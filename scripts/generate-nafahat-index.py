"""Map EVERY printed entry of Jami al-Nafahat's original scanned table
of contents to its true target PDF page, without OCR guesswork.

Pages 425..431 contain a two-column printed index; the Arabic font's broken
Unicode map corrupts extracted headings. We preserve the ORIGINAL visible
lettering by rendering those seven PDF pages in the reader, and create
transparent hit regions over each original line from verified numeric glyph
coordinates. This avoids invented or incorrectly transcribed poem titles.
"""
from pathlib import Path
import fitz, hashlib, json, re

SOURCE = Path("public/book.pdf")
FIRST, LAST = 425, 431


def build():
    data = SOURCE.read_bytes()
    doc = fitz.open(stream=data, filetype="pdf")
    if doc.page_count != 432:
        raise RuntimeError("Unrecognized Jami al-Nafahat source: expected exactly 432 pages")
    result = {
        "format": 1,
        "sourceSha256": hashlib.sha256(data).hexdigest(),
        "sourcePages": 432,
        "printedIndexFirstPage": FIRST,
        "printedIndexLastPage": LAST,
        "sheets": {},
    }
    total = 0
    for p in range(FIRST, LAST + 1):
        page = doc[p - 1]
        if not 594 < page.rect.width < 597 or not 840 < page.rect.height < 843:
            raise RuntimeError(f"Unexpected page geometry {p}")
        entries = []
        for x0, y0, x1, y1, text, *_ in page.get_text("words"):
            text = text.strip().strip(".,،:;")
            if not re.fullmatch(r"[0-9]{1,3}", text):
                continue
            target = int(text)
            # Page numbers in the printed index appear on the far left of
            # EACH of the two 250-pt columns, not in the poem title.
            col = "left" if 49 <= x0 < 87 else "right" if 302 <= x0 < 335 else None
            if col is None or not (6 <= target <= 420) or not (70 < y0 < 765):
                continue
            entries.append({
                "page": target,
                "column": col,
                "top": round(max(0, (y0 - 2.5) / page.rect.height), 6),
                "height": round(18.9 / page.rect.height, 6),
            })
        if not entries:
            raise RuntimeError(f"Printed index page {p} has no reference entries")
        # Repeated numbers at different positions represent distinct headings
        # and MUST NOT be deduplicated.
        entries.sort(key=lambda e: (e["top"], e["column"]))
        result["sheets"][str(p)] = entries
        total += len(entries)
    if not (370 <= total <= 510):
        raise RuntimeError(f"Unexpected printed TOC row count: {total}")
    result["references"] = total
    if max(e["page"] for v in result["sheets"].values() for e in v) != 420:
        raise RuntimeError("Printed TOC no longer maps through page 420")
    return result


if __name__ == "__main__":
    import sys
    expected = build()
    if sys.argv[1:] == ["--verify"]:
        actual = json.loads(Path("src/data/nafahat-printed-index.json").read_text(encoding="utf-8"))
        if actual != expected:
            raise RuntimeError("Printed Madih reference map diverges from authoritative book.pdf")
        print(f"PASS: {expected['references']} verified original printed index links from {len(expected['sheets'])} sheets; source SHA-256 pinned.")
    elif sys.argv[1:] == ["--export"]:
        print(json.dumps(expected, separators=(",", ":"), ensure_ascii=False))
    else:
        raise SystemExit("Usage: generate-nafahat-index.py --verify|--export")
