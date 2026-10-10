#!/usr/bin/env python3
"""Prepare a pixel-perfect OFFLINE 604-page Madinah Mushaf for Android.

Input PNGs are the byte-for-byte original source images extracted from the
previously SHA-256-verified PDF. WebP is written in LOSSLESS mode and accepted
only when decoding produces identical RGBA pixels to the original PNG.
When WebP is larger, keep the untouched original PNG instead.
No OCR, no pixel interpolation, no lossy quality knobs, and no Quran edits.
"""
import hashlib
import json
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageChops

SOURCE_SHA = "2f0b03925568fca326f47a5ec756df2c3eecc8b29f75471f3a0815a5a3e58d28"
PRINTED_PAGES = 604
EXPECTED_DIMENSIONS = (957, 1368)


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def prepare_one(args):
    page, src_dir, output = args
    name = f"{page:03}"
    item = src_dir / "pages" / f"{name}.png"
    original = item.read_bytes()
    with Image.open(item) as image:
        if image.format != "PNG" or image.size != EXPECTED_DIMENSIONS:
            raise RuntimeError(f"Page {page}: unexpected original image encoding/size")
        source_pixels = image.convert("RGBA")
        # The page scan often has wide, asymmetric WHITE gutters.
        # Detect all non-white ink/ornaments (minimum RGB < 180); retain
        # a full 14px safety border around detected artwork.
        rgb = source_pixels.convert("RGB")
        red, green, blue = rgb.split()
        visible = ImageChops.darker(ImageChops.darker(red, green), blue)
        bbox = visible.point(lambda v: 255 if v < 180 else 0).getbbox()
        if not bbox:
            raise RuntimeError(f"Page {page}: source has no visible ink")
        safety = 14
        crop = [
            max(0, bbox[0] - safety),
            max(0, bbox[1] - safety),
            max(0, EXPECTED_DIMENSIONS[0] - bbox[2] - safety),
            max(0, EXPECTED_DIMENSIONS[1] - bbox[3] - safety),
        ]
        # Only the visible viewport is trimmed: original source pixels
        # and original WebP lossless compression remain UNMODIFIED.
        if any(x < 0 for x in crop):
            raise RuntimeError("Invalid safe page crop")


    # Pillow uses libwebp's reversible (lossless) predictor/entropy coding.
    # method=6 is the maximum supported effort without quality reduction.
    candidate = output / f"{name}.webp"
    source_pixels.save(candidate, "WEBP", lossless=True, method=6, exact=True)
    with Image.open(candidate) as decoded:
        if decoded.size != EXPECTED_DIMENSIONS:
            raise RuntimeError(f"Page {page}: converted WebP dimensions changed")
        # getbbox() is None iff every decoded RGB+alpha value matches.
        difference = ImageChops.difference(source_pixels, decoded.convert("RGBA"))
        # RGBA getbbox() alone can mask differences when alpha-diff is zero.
        # Verify every channel individually, including all RGB samples.
        if any(max_value != 0 for _, max_value in difference.getextrema()):
            raise RuntimeError(f"Page {page}: NON-IDENTICAL WebP pixels: stop publication")

    if candidate.stat().st_size < len(original):
        encoded = candidate.read_bytes()
        extension = "webp"
    else:
        candidate.unlink()
        encoded = original
        extension = "png"
        (output / f"{name}.png").write_bytes(original)

    return page, {
        "name": f"{name}.{extension}",
        "bytes": len(encoded),
        "sha256": sha256(encoded),
        "crop": crop,
    }


def main(source_dir: Path, output_dir: Path):
    source_manifest = json.loads((source_dir / "manifest.json").read_text(encoding="utf-8"))
    if (source_manifest.get("sourceSha256") != SOURCE_SHA or
        source_manifest.get("printedPages") != PRINTED_PAGES or
        tuple(source_manifest.get("pageDimensions", [])) != EXPECTED_DIMENSIONS or
        len(source_manifest.get("pages", {})) != PRINTED_PAGES):
        raise RuntimeError("Publisher source manifest does not match original approved Mushaf")

    # Validate every original PNG hash BEFORE conversion or byte copying.
    original_bytes = 0
    for page in range(1, PRINTED_PAGES + 1):
        key = f"{page:03}.png"
        entry = source_manifest["pages"][key]
        file = source_dir / "pages" / key
        data = file.read_bytes()
        if sha256(data) != entry["sha256"] or len(data) != entry["bytes"]:
            raise RuntimeError(f"Original page {page}: source hash/size changed")
        original_bytes += len(data)

    pages_dir = output_dir / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        result = dict(pool.map(
            prepare_one,
            ((page, source_dir, pages_dir) for page in range(1, PRINTED_PAGES + 1)),
        ))

    packed_bytes = sum(item["bytes"] for item in result.values())
    manifest = {
        "format": 1,
        "sourceSha256": SOURCE_SHA,
        "pageCount": PRINTED_PAGES,
        "pageDimensions": list(EXPECTED_DIMENSIONS),
        "compression": "Lossless WebP if smaller, otherwise original PNG",
        "pixelIntegrity": "every decoded RGBA pixel equals source original PNG",
        "sourceBytes": original_bytes,
        "storedBytes": packed_bytes,
        "pages": {str(i): result[i] for i in range(1, PRINTED_PAGES + 1)},
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, sort_keys=True, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    webps = sum(p["name"].endswith(".webp") for p in result.values())
    print(f"Offline original PNG bytes: {original_bytes:,}")
    print(f"Bundled optimized bytes: {packed_bytes:,}")
    print(f"Saved: {100 * (1 - packed_bytes / original_bytes):.2f}% "
          f"({webps} WebP lossless, {PRINTED_PAGES - webps} untouched PNG)")
    print("PASS: all 604 pages SHA-256 verified and lossless pixel equality checked")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python scripts/prepare-offline-mushaf.py ORIGINAL_BRANCH_DIR MOBILE_OUTPUT_DIR")
    main(Path(sys.argv[1]), Path(sys.argv[2]))
