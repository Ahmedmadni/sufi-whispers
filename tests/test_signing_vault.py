"""Regression tests: vault identity, tamper protection, reuse and key safety."""
import importlib.util
import json
import os
import secrets
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("rihab_signing_vault", ROOT / "scripts" / "signing-vault.py")
vault = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vault)


class SigningVaultTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.directory = Path(cls.temp_dir.name)
        cls.password = secrets.token_urlsafe(55)
        cls.store = cls.directory / "rihab-production.jks"
        env = dict(os.environ, RIHAB_SIGNING_MASTER_PASSWORD=cls.password)
        subprocess.run(
            [
                "keytool", "-genkeypair", "-storetype", "PKCS12",
                "-keystore", str(cls.store),
                "-storepass:env", "RIHAB_SIGNING_MASTER_PASSWORD",
                "-keypass:env", "RIHAB_SIGNING_MASTER_PASSWORD",
                "-alias", "rihab-production", "-keyalg", "RSA", "-keysize", "3072",
                "-validity", "10000", "-dname", "CN=Signing Security Test", "-noprompt",
            ],
            env=env, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        cls.plaintext = cls.store.read_bytes()

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def test_encrypted_roundtrip_without_exposing_key(self):
        doc = vault.encrypt_keystore(self.plaintext, self.password)
        self.assertEqual(doc["format"], vault.VAULT_FORMAT)
        self.assertEqual(doc["alias"], "rihab-production")
        self.assertEqual(doc["cipher"], "AES-256-GCM")
        self.assertEqual(vault.decrypt_keystore(doc, self.password), self.plaintext)
        text = json.dumps(doc)
        self.assertNotIn(self.password, text)
        self.assertNotIn("MII", text[:200])

    def test_wrong_password_fails_closed(self):
        doc = vault.encrypt_keystore(self.plaintext, self.password)
        with self.assertRaisesRegex(RuntimeError, "Could not unlock"):
            vault.decrypt_keystore(doc, secrets.token_urlsafe(55))

    def test_metadata_tampering_fails_closed(self):
        doc = vault.encrypt_keystore(self.plaintext, self.password)
        for key, forged in (
            ("applicationId", "com.attacker.app"), ("alias", "wrong"),
            ("keystoreFileName", "debug.jks"), ("cipher", "AES-128-CBC"),
        ):
            altered = dict(doc, **{key: forged})
            with self.assertRaisesRegex(RuntimeError, "identity"):
                vault.decrypt_keystore(altered, self.password)

    def test_authenticated_ciphertext_tampering_fails(self):
        doc = vault.encrypt_keystore(self.plaintext, self.password)
        data = bytearray(vault.unb64(doc["ciphertext"]))
        data[0] ^= 1
        doc["ciphertext"] = vault.b64(bytes(data))
        with self.assertRaisesRegex(RuntimeError, "Could not unlock"):
            vault.decrypt_keystore(doc, self.password)

    def test_master_password_policy_and_alias_check(self):
        existing = os.environ.get("RIHAB_SIGNING_MASTER_PASSWORD")
        try:
            os.environ["RIHAB_SIGNING_MASTER_PASSWORD"] = "too-short"
            with self.assertRaisesRegex(RuntimeError, "40"):
                vault.secret_password()
            os.environ["RIHAB_SIGNING_MASTER_PASSWORD"] = self.password
            self.assertEqual(vault.secret_password(), self.password)
            vault.validate_alias(self.store)
        finally:
            if existing is None:
                os.environ.pop("RIHAB_SIGNING_MASTER_PASSWORD", None)
            else:
                os.environ["RIHAB_SIGNING_MASTER_PASSWORD"] = existing


if __name__ == "__main__":
    unittest.main()
