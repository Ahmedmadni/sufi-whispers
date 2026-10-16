#!/usr/bin/env python3
"""Cloud-only, owner-controlled Android production signing vault.

The *encrypted* PKCS#12 keystore may be committed to the public repository.
The owner-provided, high-entropy master secret must exist ONLY in GitHub Actions
Secrets (RIHAB_SIGNING_MASTER_PASSWORD), never in git, logs or dispatch inputs.
"""
import base64
import hashlib
import json
import os
import secrets
import subprocess
import sys
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding

VAULT_PATH = Path("config/rihab-production.jks.enc.json")
KEY_NAME = "rihab-production.jks"
KEY_ALIAS = "rihab-production"
VAULT_FORMAT = "rihab-android-signing-keystore-v1"
AAD = b"com.rihabalkhaliliyya.app|rihab-production.jks|v1"
N = 32768
R = 8
P = 1


def secret_password() -> str:
    password = os.environ.get("RIHAB_SIGNING_MASTER_PASSWORD", "")
    if len(password) < 40 or len(password) > 512 or any(ch in password for ch in "\r\n\x00"):
        raise RuntimeError(
            "RIHAB_SIGNING_MASTER_PASSWORD must be a unique random 40+ character GitHub Actions secret"
        )
    if len(set(password)) < 12:
        raise RuntimeError("Signing master secret looks non-random; use a cryptographically random password")
    return password


def derive(password: str, salt: bytes) -> bytes:
    return Scrypt(salt=salt, length=32, n=N, r=R, p=P).derive(password.encode("utf-8"))


def b64(value: bytes) -> str:
    return base64.b64encode(value).decode("ascii")


def unb64(value: object, length: int | None = None) -> bytes:
    if not isinstance(value, str):
        raise RuntimeError("Invalid encrypted signing vault field")
    try:
        data = base64.b64decode(value, validate=True)
    except (ValueError, base64.binascii.Error) as exc:
        raise RuntimeError("Invalid encrypted signing vault encoding") from exc
    if length is not None and len(data) != length:
        raise RuntimeError("Incorrect encrypted signing vault field length")
    return data


def certificate_fingerprint(store: bytes, password: str) -> str:
    key, certificate, _ = pkcs12.load_key_and_certificates(store, password.encode("utf-8"))
    if key is None or certificate is None:
        raise RuntimeError("Keystore does not contain both a production private key and certificate")
    return hashlib.sha256(certificate.public_bytes(Encoding.DER)).hexdigest()


def encrypt_keystore(store: bytes, password: str) -> dict:
    fingerprint = certificate_fingerprint(store, password)
    salt, nonce = secrets.token_bytes(32), secrets.token_bytes(12)
    encrypted = AESGCM(derive(password, salt)).encrypt(nonce, store, AAD)
    return {
        "format": VAULT_FORMAT,
        "applicationId": "com.rihabalkhaliliyya.app",
        "keystoreFileName": KEY_NAME,
        "alias": KEY_ALIAS,
        "certificateSha256": fingerprint,
        "kdf": {"name": "scrypt", "n": N, "r": R, "p": P},
        "cipher": "AES-256-GCM",
        "salt": b64(salt),
        "nonce": b64(nonce),
        "ciphertext": b64(encrypted),
    }


def decrypt_keystore(vault: dict, password: str) -> bytes:
    if (
        not isinstance(vault, dict)
        or vault.get("format") != VAULT_FORMAT
        or vault.get("applicationId") != "com.rihabalkhaliliyya.app"
        or vault.get("keystoreFileName") != KEY_NAME
        or vault.get("alias") != KEY_ALIAS
        or vault.get("kdf") != {"name": "scrypt", "n": N, "r": R, "p": P}
        or vault.get("cipher") != "AES-256-GCM"
    ):
        raise RuntimeError("Signing vault metadata does not match the approved Android identity")
    fp = vault.get("certificateSha256")
    if not isinstance(fp, str) or len(fp) != 64 or any(c not in "0123456789abcdef" for c in fp):
        raise RuntimeError("Invalid certificate fingerprint in signing vault")
    salt, nonce, content = unb64(vault.get("salt"), 32), unb64(vault.get("nonce"), 12), unb64(vault.get("ciphertext"))
    if len(content) > 1_000_000 or len(content) < 50:
        raise RuntimeError("Keystore vault payload has an invalid size")
    try:
        keystore = AESGCM(derive(password, salt)).decrypt(nonce, content, AAD)
        actual_fp = certificate_fingerprint(keystore, password)
    except Exception as exc:
        raise RuntimeError("Could not unlock the signing vault; check the owner-controlled GitHub Secret") from exc
    if actual_fp != fp:
        raise RuntimeError("Signing certificate fingerprint mismatch")
    return keystore


def validate_alias(path: Path) -> None:
    subprocess.run(
        [
            "keytool", "-list", "-storetype", "PKCS12", "-keystore", str(path),
            "-storepass:env", "RIHAB_SIGNING_MASTER_PASSWORD", "-alias", KEY_ALIAS,
        ],
        stdout=subprocess.DEVNULL,
        check=True,
    )


def temp_keyfile() -> Path:
    temp = os.environ.get("RUNNER_TEMP")
    if not temp:
        raise RuntimeError("This command requires a GitHub Actions runner temporary directory")
    return Path(temp) / KEY_NAME


def generate() -> None:
    password = secret_password()
    if VAULT_PATH.exists():
        raise RuntimeError("Encrypted signing key already exists; refusing to rotate or overwrite it")
    dest = temp_keyfile()
    if dest.exists():
        raise RuntimeError("Temporary keystore exists already; refusing to overwrite")
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(
            [
                "keytool", "-genkeypair", "-storetype", "PKCS12",
                "-keystore", str(dest), "-storepass:env", "RIHAB_SIGNING_MASTER_PASSWORD",
                "-keypass:env", "RIHAB_SIGNING_MASTER_PASSWORD", "-alias", KEY_ALIAS,
                "-keyalg", "RSA", "-keysize", "3072", "-validity", "10000",
                "-dname", "CN=Rihab Al Khaliliyya, OU=Android Production Signing",
                "-noprompt",
            ],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        os.chmod(dest, 0o600)
        validate_alias(dest)
        encrypted = encrypt_keystore(dest.read_bytes(), password)
        # Write ONLY the authenticated ciphertext to the public repository.
        VAULT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with VAULT_PATH.open("x", encoding="utf-8") as file:
            json.dump(encrypted, file, indent=2, ensure_ascii=False)
            file.write("\n")
        print("PASS: Production signing identity created in GitHub runner and encrypted for repository backup.")
        print("Public SHA-256 signing certificate fingerprint:", encrypted["certificateSha256"])
    finally:
        dest.unlink(missing_ok=True)


def restore() -> None:
    password = secret_password()
    vault = json.loads(VAULT_PATH.read_text(encoding="utf-8"))
    keystore = decrypt_keystore(vault, password)
    dest = temp_keyfile()
    if dest.exists():
        raise RuntimeError("Temporary signing keystore already exists; refusing to overwrite")
    with dest.open("xb") as file:
        file.write(keystore)
    os.chmod(dest, 0o600)
    try:
        validate_alias(dest)
    except Exception:
        dest.unlink(missing_ok=True)
        raise
    with Path(os.environ["GITHUB_ENV"]).open("a", encoding="utf-8") as file:
        file.write("RIHAB_RELEASE_KEYSTORE_FILE=" + str(dest) + "\n")
    print("PASS: Decrypted production signing keystore into private runner temporary storage.")


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in ("generate", "restore"):
        raise SystemExit("Usage: python scripts/signing-vault.py generate|restore")
    try:
        if sys.argv[1] == "generate":
            generate()
        else:
            restore()
    except Exception as exc:
        # Never emit password, keystore bytes or a stack trace with secret data.
        raise SystemExit("ERROR: " + str(exc)) from None


if __name__ == "__main__":
    main()
