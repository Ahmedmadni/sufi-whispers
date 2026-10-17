"""Read only actual index evidence from public/book.pdf using PyMuPDF.
Do not invent table-of-contents entries. Output compact diagnostics in CI logs
so a human can map every real printed index entry before final packaging.
"""
import fitz
from pathlib import Path

source = Path("public/book.pdf")
doc = fitz.open(source)
print("NAFAHAT_DIAGNOSTIC pdf_pages=", doc.page_count, "pdf_metadata_title=", repr(doc.metadata.get("title", "")))
toc = doc.get_toc()
print("NAFAHAT_DIAGNOSTIC pdf_bookmarks_count=", len(toc))
for level, title, page in toc[:140]:
    print("NAFAHAT_BOOKMARK", level, page, repr(" ".join(title.split())[:150]))
keywords = ["فهرس", "القصائد", "محتويات", "القصيدة", "قصيدة", "صفحـة"]
for i in list(range(min(18,doc.page_count))) + list(range(max(18,doc.page_count-28),doc.page_count)):
    pg=doc[i]
    raw=pg.get_text(sort=True)
    lines=[" ".join(x.split()) for x in raw.splitlines() if x.strip()]
    has_index=any(w in raw for w in keywords)
    print(f"NAFAHAT_PAGE page={i+1} chars={len(raw)} words={len(raw.split())} index_hint={has_index} lines={len(lines)}")
    if has_index or i<10 or i >= doc.page_count-15:
        for l in lines[:35]:
            print("NAFAHAT_TEXT",i+1,repr(l[:150]))
print("NAFAHAT_DIAGNOSTIC done")

for index in [424, 425, 429, 430]:
    pg = doc[index]
    print("NAFAHAT_GEOM",index+1,"width",pg.rect.width,"height",pg.rect.height)
    numerals = [(round(x0,1),round(y0,1),round(x1,1),round(y1,1),text)
                for x0,y0,x1,y1,text,*_ in pg.get_text("words")
                if text.strip(".,;:، \\t").isdigit() and len(text.strip())<=5]
    print("NAFAHAT_GEOM_DIGITS",index+1,repr(numerals[:125]))
