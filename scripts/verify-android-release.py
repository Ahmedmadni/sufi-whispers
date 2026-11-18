#!/usr/bin/env python3
"""Independently inspect the signed Android APK/AAB's embedded offline corpus.

Signing itself is checked using Android apksigner and Java jarsigner in CI.
This script fails closed when user-facing Quran/books/worker assets are absent.
"""
import hashlib
import json
import sys
import zipfile
from pathlib import Path
from verify_wird_audio import verify_wird_audio_archive

def checksum(path: Path) -> str:
    with path.open("rb") as file:
        return hashlib.file_digest(file, "sha256").hexdigest()

def verify(archive_path: Path, prefix: str) -> None:
    if not archive_path.is_file() or archive_path.stat().st_size < 10_000_000:
        raise RuntimeError(f"Release binary is missing or unexpectedly small: {archive_path}")
    with zipfile.ZipFile(archive_path) as archive:
        names = set(archive.namelist())
        mandatory = [
            "index.html", "book.pdf", "pdfjs/pdf.worker.min.mjs",
            "offline-books/manifest.json", "printed-mushaf/manifest.json",
            "mobile-assets/hafsData_v2-0.json",
        ]
        for file in mandatory:
            if prefix + file not in names:
                raise RuntimeError(f"Missing offline release asset: {prefix + file}")
        books = json.loads(archive.read(prefix + "offline-books/manifest.json"))
        if books.get("version") != 1 or len(books.get("books", {})) != 7:
            raise RuntimeError("Invalid seven-book release manifest")
        book_pages = 0
        for book_id, entry in books["books"].items():
            pages = entry.get("pages", [])
            if entry.get("pageCount") != len(pages):
                raise RuntimeError(f"Incomplete book: {book_id}")
            book_pages += len(pages)
            for item in pages:
                if prefix + f"offline-books/{book_id}/{item['name']}" not in names:
                    raise RuntimeError(f"Missing release page: {book_id}/{item['name']}")
        if book_pages != 1040:
            raise RuntimeError(f"Wrong offline book count: {book_pages}")

        quran = json.loads(archive.read(prefix + "printed-mushaf/manifest.json"))
        if quran.get("pageCount") != 604 or len(quran.get("pages", {})) != 604 or \
           quran.get("sourceSha256") != "2f0b03925568fca326f47a5ec756df2c3eecc8b29f75471f3a0815a5a3e58d28":
            raise RuntimeError("Release corpus must use approved Madinah 604-page edition")
        for page in range(1, 605):
            item = quran["pages"].get(str(page))
            if not item or prefix + "printed-mushaf/pages/" + item["name"] not in names:
                raise RuntimeError(f"Missing original Mushaf page {page}")
        # The full corrected Sheikh poster is user-approved artwork. Unlike
        # the Quran/page corpus, older releases did not verify its pixels.
        # Fail closed if the APK/AAB contains an outdated or substituted poster.
        poster_assets = [
            name for name in names
            if name.startswith(prefix + "assets/rihab-approved-full-mobile-poster-")
            and name.endswith(".webp")
        ]
        if len(poster_assets) != 1:
            raise RuntimeError(
                f"Expected exactly one approved Sheikh poster in {archive_path.name}, "
                f"found {len(poster_assets)}"
            )
        poster = archive.read(poster_assets[0])
        expected = "3987f7f4fe27eaf9c68f677c91c09526f5f9854fbab252d402b413bc75b87598"
        if hashlib.sha256(poster).hexdigest() != expected:
            raise RuntimeError("Approved Sheikh poster pixel checksum mismatch")
        if (len(poster) != 1431622 or poster[:4] != b"RIFF" or
                poster[8:12] != b"WEBP" or poster[12:16] != b"VP8L"):
            raise RuntimeError("Approved Sheikh poster size or WebP format mismatch")
        geometry = int.from_bytes(poster[21:25], "little")
        width = (geometry & 0x3FFF) + 1
        height = ((geometry >> 14) & 0x3FFF) + 1
        if (width, height) != (941, 1672):
            raise RuntimeError("Approved Sheikh poster dimensions mismatch")
        print(f"PASS {archive_path.name}: owner-approved corrected Sheikh poster, 941×1672, exact pixel checksum.")
        verify_wird_audio_archive(archive, prefix)
        corrupted = archive.testzip()
        if corrupted:
            raise RuntimeError(f"Corrupted Android release archive entry: {corrupted}")
    print(f"PASS {archive_path.name}: 604 approved printed Quran pages, 1040 offline book pages, original PDF, local PDF worker.")
    print(f"SHA-256 {archive_path.name}: {checksum(archive_path)}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: verify-android-release.py app-release.apk app-release.aab")
    verify(Path(sys.argv[1]), "assets/public/")
    verify(Path(sys.argv[2]), "base/assets/public/")
