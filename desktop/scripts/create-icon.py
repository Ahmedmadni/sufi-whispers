"""Create a genuine multi-resolution Windows .ico from the approved app icon."""
from pathlib import Path
import sys
from PIL import Image
if len(sys.argv) != 3:
    raise SystemExit("Usage: create-icon.py ORIGINAL_ICON_PNG OUTPUT_ICO")
src,dst=map(Path,sys.argv[1:])
with Image.open(src) as original:
    image=original.convert("RGBA")
    if image.width < 256 or image.height < 256:
        raise SystemExit("Refusing low-resolution desktop identity icon")
    dst.parent.mkdir(parents=True,exist_ok=True)
    image.save(dst,format="ICO",sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
print("Prepared approved Rihab Windows application icon:",dst)
