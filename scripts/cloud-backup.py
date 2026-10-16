#!/usr/bin/env python3
"""Create a verified, restorable GitHub Actions archive of Rihab source + media.

Only known source archives and content folders are packaged. Never add .env,
GitHub Secrets, private signing keys, arbitrary workspace folders or device data.

Usage: python scripts/cloud-backup.py create GIT_BUNDLE MUSHAF_SOURCE MOBILE_PUBLIC ZIP
       python scripts/cloud-backup.py verify ZIP
"""
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path, PurePosixPath

SOURCE_SHA = "2f0b03925568fca326f47a5ec756df2c3eecc8b29f75471f3a0815a5a3e58d28"
EXPECTED_PAGES = 604
EXPECTED_BOOK_PAGES = 1040
MAX_TOTAL_BYTES = 2 * 1024**3
BLOCKED = {".env", ".jks", ".keystore", ".p12", ".pfx", ".pkcs12", "id_rsa", "id_ed25519"}
BACKUP_FORMAT = "rihab-cloud-recovery-v1"


def sha256(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def safe_relative(path):
    name = path.as_posix() if isinstance(path, (Path, PurePosixPath)) else str(path)
    p = PurePosixPath(name)
    if not name or name.startswith("/") or "\\" in name or any(part in ("", ".", "..") for part in p.parts):
        raise ValueError(f"Unsafe recovery archive path: {name}")
    if any(part.startswith(".env") or part.lower().endswith(tuple(BLOCKED - {".env"}))
           or part in {"node_modules", ".git", ".ssh"} for part in p.parts):
        raise ValueError(f"Private or generated file not allowed in archive: {name}")
    return name


def verified_file(path, expected_bytes, expected_sha):
    if not path.is_file() or path.is_symlink():
        raise ValueError(f"Missing or symlinked required recovery file: {path}")
    if not isinstance(expected_bytes, int) or path.stat().st_size != expected_bytes:
        raise ValueError(f"Recovery file byte mismatch: {path}")
    if sha256(path) != expected_sha:
        raise ValueError(f"Recovery file SHA-256 mismatch: {path}")


def check_quran_original(source):
    data = load(source / "manifest.json")
    if data.get("sourceSha256") != SOURCE_SHA or data.get("printedPages") != EXPECTED_PAGES:
        raise ValueError("Original Quran image manifest does not match the pinned edition")
    if len(data.get("pages", {})) != EXPECTED_PAGES:
        raise ValueError("Original printed Quran has missing pages")
    for n in range(1, EXPECTED_PAGES + 1):
        name = f"{n:03d}.png"
        item = data["pages"][name]
        verified_file(source / "pages" / name, item["bytes"], item["sha256"])


def check_rendered(mobile):
    printed = load(mobile / "printed-mushaf/manifest.json")
    if printed.get("format") != 1 or printed.get("sourceSha256") != SOURCE_SHA or printed.get("pageCount") != EXPECTED_PAGES:
        raise ValueError("Bundled printed Quran is not the approved complete edition")
    for n in range(1, EXPECTED_PAGES + 1):
        item = printed["pages"][str(n)]
        verified_file(mobile / "printed-mushaf/pages" / item["name"], item["bytes"], item["sha256"])

    library = load(mobile / "offline-books/manifest.json")
    if library.get("version") != 1 or len(library.get("books", {})) != 7:
        raise ValueError("Offline book catalog is incomplete")
    count = 0
    for book_id, book in library["books"].items():
        if not re.fullmatch(r"[a-z][a-z-]*", book_id):
            raise ValueError("Unsafe original book id")
        pages = book["pages"]
        if book["pageCount"] != len(pages):
            raise ValueError(f"Missing rendered pages in {book_id}")
        count += len(pages)
        for item in pages:
            verified_file(mobile / "offline-books" / book_id / item["name"], item["bytes"], item["sha256"])
    if count != EXPECTED_BOOK_PAGES:
        raise ValueError(f"Wrong number of offline book pages: {count}")

    assets = load(mobile / "mobile-assets/manifest.json")
    if assets.get("format") != 2 or len(assets.get("assets", [])) < 9:
        raise ValueError("Original Quran/books source asset list is incomplete")
    names = set()
    for item in assets["assets"]:
        name = item["filename"]
        if "/" in name or "\\" in name or not safe_relative(name) or name in names:
            raise ValueError("Unsafe or duplicate original media filename")
        names.add(name)
        verified_file(mobile / "mobile-assets" / name, item["bytes"], item["sha256"])
    if not {"hafsData_v2-0.json", "uthmanic_hafs_v20.ttf"}.issubset(names):
        raise ValueError("Quran original text or font is missing")

    for rel in ["book.pdf", "pdfjs/pdf.worker.min.mjs", "mobile-assets/fonts/fonts.css"]:
        if not (mobile / rel).is_file():
            raise ValueError(f"Missing packaged offline reading resource: {rel}")


def iter_files(root, target_prefix):
    for path in sorted(root.rglob("*")):
        if path.is_symlink():
            raise ValueError(f"Symlink forbidden in recovery archive: {path}")
        if path.is_file():
            relative = safe_relative(path.relative_to(root))
            yield path, f"{target_prefix}/{relative}"


def create(bundle, source, mobile, output):
    if not bundle.is_file() or bundle.is_symlink() or bundle.stat().st_size < 10000:
        raise ValueError("Git repository bundle is missing or empty")
    check_quran_original(source)
    check_rendered(mobile)
    if output.exists():
        raise ValueError("Refusing to overwrite an existing recovery archive")
    entries = [(bundle, "repository/project-history.bundle")]
    entries.extend(iter_files(source / "pages", "original-mushaf/pages"))
    entries.append((source / "manifest.json", "original-mushaf/manifest.json"))
    entries.extend(iter_files(mobile, "mobile-public"))
    names = [name for _, name in entries]
    if len(names) != len(set(names)):
        raise ValueError("Duplicate recovery archive entries")
    metadata = []
    total = 0
    for path, name in entries:
        safe_relative(name)
        size = path.stat().st_size
        total += size
        if total > MAX_TOTAL_BYTES:
            raise ValueError("Cloud backup exceeds 2 GiB safe size limit")
        metadata.append({"path": name, "bytes": size, "sha256": sha256(path)})
    manifest = {
        "format": BACKUP_FORMAT,
        "verifiedPrintedQuranPages": EXPECTED_PAGES,
        "verifiedOfflineBookPages": EXPECTED_BOOK_PAGES,
        "approvedOriginalMushafSourceSha256": SOURCE_SHA,
        "includesEncryptedSigningKey": "only if committed to git history; never plaintext",
        "doesNotInclude": ["GitHub Actions Secrets", "device-local user data", "plain signing keys", "unavailable original 640-page Mushaf PDF"],
        "entries": metadata,
    }
    instructions = (
        "رحاب الخليلية — GitHub cloud backup recovery\n"
        "Source history: repository/project-history.bundle (git clone project-history.bundle recovered-repo).\n"
        "Original approved Quran page scans: original-mushaf/pages/001.png ... 604.png.\n"
        "Rebuild input content: mobile-public/ contains original book PDFs, Quran JSON,\n"
        "fonts, PDF.js worker and offline printed Quran and books.\n"
        "Restore mobile-public/ into mobile/.public/ after checkout to build offline.\n"
        "Github Secrets, signing master password and personal device data are NOT archived.\n"
        "Keep this archive away from a public release; GitHub Actions artifacts expire.\n"
        "The upstream original 640-page Mushaf PDF is not included; original printed\n"
        "image pages and their verified immutable checksums ARE included.\n"
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    try:
        with zipfile.ZipFile(output, "x", allowZip64=True, compression=zipfile.ZIP_STORED) as archive:
            for path, name in entries:
                archive.write(path, arcname=name, compress_type=zipfile.ZIP_STORED)
            archive.writestr("BACKUP-INSTRUCTIONS.txt", instructions)
            archive.writestr("RECOVERY-MANIFEST.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        verify(output)
    except BaseException:
        output.unlink(missing_ok=True)
        raise
    print(f"PASS cloud recovery archive: {len(metadata)} files, {total:,} uncompressed bytes")
    print("Backup SHA-256:", sha256(output))


def verify(output):
    with zipfile.ZipFile(output) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise ValueError("Duplicate archive paths")
        for name in names:
            safe_relative(name)
        manifest = json.loads(archive.read("RECOVERY-MANIFEST.json"))
        if (manifest.get("format") != BACKUP_FORMAT or
            manifest.get("verifiedPrintedQuranPages") != EXPECTED_PAGES or
            manifest.get("verifiedOfflineBookPages") != EXPECTED_BOOK_PAGES or
            manifest.get("approvedOriginalMushafSourceSha256") != SOURCE_SHA):
            raise ValueError("Recovery archive manifest does not meet invariant")
        listed = {item["path"] for item in manifest["entries"]}
        if listed != set(names) - {"RECOVERY-MANIFEST.json", "BACKUP-INSTRUCTIONS.txt"}:
            raise ValueError("Recovery archive has extra or missing files")
        for item in manifest["entries"]:
            p = safe_relative(item["path"])
            with archive.open(p) as stream:
                digest = hashlib.sha256()
                total = 0
                while chunk := stream.read(1024 * 1024):
                    total += len(chunk)
                    digest.update(chunk)
            if total != item["bytes"] or digest.hexdigest() != item["sha256"]:
                raise ValueError(f"Recovery archive content checksum mismatch: {p}")
        corrupted = archive.testzip()
        if corrupted:
            raise ValueError(f"ZIP archive entry is corrupt: {corrupted}")
    print(f"PASS: {len(listed)} verified restore assets and git history, original Quran and books.")


if __name__ == "__main__":
    if len(sys.argv) == 6 and sys.argv[1] == "create":
        create(Path(sys.argv[2]), Path(sys.argv[3]), Path(sys.argv[4]), Path(sys.argv[5]))
    elif len(sys.argv) == 3 and sys.argv[1] == "verify":
        verify(Path(sys.argv[2]))
    else:
        raise SystemExit("Usage: cloud-backup.py create GIT_BUNDLE SOURCE MOBILE_PUBLIC OUTPUT_ZIP | verify OUTPUT_ZIP")
