#!/usr/bin/env python3
"""Extract the ORIGINAL, unmodified printed page images from the verified PDF.

Nothing is OCR'd, rendered, retyped, resized, recompressed or reformatted.
PDF pages 4..607 correspond exactly to Quran pages 1..604.
"""
import hashlib
import json
import os
import sys
from pathlib import Path

import fitz

EXPECTED_SHA = "2f0b03925568fca326f47a5ec756df2c3eecc8b29f75471f3a0815a5a3e58d28"
EXPECTED_BYTES = 65_008_727
SOURCE_PAGES = 640
FIRST_PDF_PAGE_INDEX = 3
QURAN_PAGES = 604
PAGE_WIDTH = 957
PAGE_HEIGHT = 1368


def publish(pdf_path: Path, destination: Path) -> dict:
    size = pdf_path.stat().st_size
    if size != EXPECTED_BYTES:
        raise ValueError(f"Source PDF size mismatch: {size} != {EXPECTED_BYTES}")
    digest = hashlib.file_digest(open(pdf_path, "rb"), "sha256").hexdigest()
    if digest != EXPECTED_SHA:
        raise ValueError("Source PDF SHA-256 does not match the uploaded, approved Mushaf")
    document = fitz.open(pdf_path)
    if len(document) != SOURCE_PAGES:
        raise ValueError(f"Expected {SOURCE_PAGES} PDF pages, found {len(document)}")

    pages = destination / "pages"
    pages.mkdir(parents=True, exist_ok=True)
    hashes = {}
    for printed_page in range(1, QURAN_PAGES + 1):
        pdf_page = document[printed_page + FIRST_PDF_PAGE_INDEX - 1]
        source_images = pdf_page.get_images(full=True)
        if len(source_images) != 1:
            raise ValueError(f"PDF page {printed_page+3}: expected exactly one source image")
        xref, _, width, height, *_ = source_images[0]
        if (width, height) != (PAGE_WIDTH, PAGE_HEIGHT):
            raise ValueError(f"Unexpected dimensions on printed page {printed_page}: {width}x{height}")
        image = document.extract_image(xref)
        if image["ext"] != "png":
            raise ValueError(f"Printed page {printed_page} is not an original PNG image")
        image_bytes = image["image"]
        name = f"{printed_page:03}.png"
        (pages / name).write_bytes(image_bytes)
        hashes[name] = {
            "sha256": hashlib.sha256(image_bytes).hexdigest(),
            "bytes": len(image_bytes),
            "pdfPage": printed_page + FIRST_PDF_PAGE_INDEX,
        }
        if printed_page % 100 == 0:
            print(f"Extracted {printed_page}/{QURAN_PAGES} source images without alteration", flush=True)

    manifest = {
        "sourceFilename": pdf_path.name,
        "sourceSha256": EXPECTED_SHA,
        "sourceBytes": EXPECTED_BYTES,
        "originalPdfPages": SOURCE_PAGES,
        "printedPages": QURAN_PAGES,
        "pageDimensions": [PAGE_WIDTH, PAGE_HEIGHT],
        "pageFormat": "png",
        "pageMapping": "pdfPage = printedPage + 3",
        "mode": "extract_image, byte-for-byte, no OCR/transcoding",
        "pages": hashes,
    }
    (destination / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2) + "\n",
        encoding="utf-8",
    )
    (destination / ".nojekyll").write_text("", encoding="utf-8")
    print(
        f"Validated and exported {len(hashes)} original Quran pages "
        f"({sum(e['bytes'] for e in hashes.values()) / 1048576:.1f} MiB) "
        f"from SHA-256 {digest}",
        flush=True,
    )
    return manifest


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Usage: python scripts/extract-printed-mushaf-pages.py SOURCE.pdf OUT_DIR")
    publish(Path(sys.argv[1]), Path(sys.argv[2]))
