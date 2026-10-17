#!/usr/bin/env python3
"""Render original bundled books into reliable offline Android WebP pages.

PDF originals remain untouched. No network calls. The immutable page manifest
lets Android display scanned books without relying on WebView PDF rendering.
"""
import hashlib
import io
import json
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Install offline renderer: python -m pip install PyMuPDF==1.26.5 Pillow==11.3.0") from exc

BOOKS = {
    "ward": "ward-tuli.pdf",
    "sirah": "sirah-khaliliyya.pdf",
    "kashf": "kashf-al-ghita.pdf",
    "nafahat-khaliliyya": "nafahat-khaliliyya.pdf",
    "murabbi": "al-murabbi.pdf",
    "manaqib": "manaqib-khaliliyya.pdf",
    "manahil": "manahil-khaliliyya.pdf",
}


def sha256(contents: bytes) -> str:
    return hashlib.sha256(contents).hexdigest()


def prepare(source: Path, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    manifest = {"version": 1, "books": {}}
    for book_id, filename in BOOKS.items():
        file = source / filename
        if not file.is_file():
            raise RuntimeError(f"Missing bundled book: {filename}")
        original = file.read_bytes()
        if not original.startswith(b"%PDF-"):
            raise RuntimeError(f"Bad PDF header: {filename}")
        document = fitz.open(stream=original, filetype="pdf")
        if document.needs_pass or not document.page_count:
            raise RuntimeError(f"Unreadable or encrypted book: {filename}")
        page_dir = output / book_id
        page_dir.mkdir(parents=True, exist_ok=True)
        pages = []
        for index in range(document.page_count):
            page = document.load_page(index)
            width = float(page.rect.width)
            # Narrow originals need more resolution for phone zoom.
            scale = min(4.5, max(1.5, 1200 / width))
            pixels = page.get_pixmap(matrix=fitz.Matrix(scale, scale), colorspace=fitz.csRGB, alpha=False)
            image = Image.frombytes("RGB", (pixels.width, pixels.height), pixels.samples)
            buffer = io.BytesIO()
            image.save(buffer, format="WEBP", quality=88, method=4)
            data = buffer.getvalue()
            if len(data) < 100:
                raise RuntimeError(f"Empty rendered page: {book_id}:{index + 1}")
            name = f"{index + 1:04d}.webp"
            (page_dir / name).write_bytes(data)
            pages.append({"name": name, "sha256": sha256(data), "bytes": len(data),
                          "width": pixels.width, "height": pixels.height})
        # Preserve real PDF bookmarks when available. The UI falls back to
        # explicitly labelled position landmarks when the source has no TOC;
        # never invent poetry headings or chapters.
        toc = []
        seen = set()
        for level, title, page_number, *_ in document.get_toc():
            title = " ".join(str(title).split())[:70]
            if (level > 2 or not title or page_number < 1 or page_number > len(pages)
                    or page_number in seen):
                continue
            toc.append({"title": title, "page": page_number})
            seen.add(page_number)
            if len(toc) >= 60:
                break
        manifest["books"][book_id] = {
            "source": filename, "sourceSha256": sha256(original),
            "pageCount": len(pages), "pages": pages, "toc": toc,
        }
        document.close()
        print(f"Rendered offline {book_id}: {len(pages)} pages", flush=True)
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: prepare-offline-books.py <mobile-assets> <offline-books>")
    prepare(Path(sys.argv[1]), Path(sys.argv[2]))
