#!/usr/bin/env python3
"""Verify Android APK and split it for transports with a 200 MiB file limit.

Reassemble part-01 ... part-05 in order and verify against manifest.json.
This never modifies the signed debug APK.
"""
import hashlib
import json
import math
import sys
import zipfile
from pathlib import Path
from verify_wird_audio import verify_wird_audio_archive

PART_COUNT = 5
MAX_PART_BYTES = 90 * 1024 * 1024


def hash_file(path: Path) -> str:
    with path.open("rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def prepare(apk: Path, directory: Path) -> None:
    if not apk.is_file():
        raise RuntimeError(f"Android APK missing: {apk}")
    # Detect truncated or corrupt packages before distributing a file.
    with zipfile.ZipFile(apk) as archive:
        names = set(archive.namelist())
        required = {
            "assets/public/index.html",
            "assets/public/offline-books/manifest.json",
            "assets/public/printed-mushaf/manifest.json",
        }
        if not required.issubset(names):
            raise RuntimeError(f"Android APK missing packaged content: {required - names}")
        offline = json.loads(archive.read("assets/public/offline-books/manifest.json"))
        mushaf = json.loads(archive.read("assets/public/printed-mushaf/manifest.json"))
        if len(offline.get("books", {})) != 7 or sum(b["pageCount"] for b in offline["books"].values()) != 1040:
            raise RuntimeError("Expected seven offline books and 1040 readable pages")
        if mushaf.get("pageCount") != 604:
            raise RuntimeError("Original Mushaf must have 604 pages")
        verify_wird_audio_archive(archive, "assets/public/")
        if archive.testzip() is not None:
            raise RuntimeError("Android APK has a corrupt ZIP entry")
    total = apk.stat().st_size
    chunk_size = math.ceil(total / PART_COUNT)
    if chunk_size > MAX_PART_BYTES:
        raise RuntimeError(f"APK pieces exceed transport limit: {chunk_size}")
    directory.mkdir(parents=True, exist_ok=True)
    pieces = []
    with apk.open("rb") as original:
        for i in range(1, PART_COUNT + 1):
            name = f"part-{i:02d}"
            output = directory / name
            with output.open("wb") as part:
                remainder = min(chunk_size, total - (i - 1) * chunk_size)
                while remainder:
                    content = original.read(min(remainder, 4 * 1024 * 1024))
                    if not content:
                        raise RuntimeError("Unexpected early end of APK")
                    part.write(content)
                    remainder -= len(content)
            pieces.append({"name": name, "bytes": output.stat().st_size, "sha256": hash_file(output)})
        if original.read(1):
            raise RuntimeError("Unexpected trailing Android APK data")
    if any(piece["bytes"] == 0 for piece in pieces):
        raise RuntimeError("Missing or empty output chunk")
    manifest = {
        "version": 1,
        "file": "rihab-alkhaliliyya-debug.apk",
        "totalBytes": total,
        "sha256": hash_file(apk),
        "parts": pieces,
    }
    (directory / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Verified full APK ({total} bytes), seven books, 1040 book pages, 604 Mushaf pages")
    for piece in pieces:
        print(f"{piece['name']}: {piece['bytes']} bytes, SHA-256: {piece['sha256']}")
    print(f"APK SHA-256: {manifest['sha256']}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: split-android-apk.py path/to/app.apk path/to/parts")
    prepare(Path(sys.argv[1]), Path(sys.argv[2]))
