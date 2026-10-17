#!/usr/bin/env python3
"""Reproducibly install the OFFICIAL Rihab logo as Android launcher artwork.

Generated native Android project is disposable (Capacitor 8 regenerates it).
Do not hand-edit ephemeral Android image resources: re-apply source-controlled
logo on every debug AND signed release build after cap sync.

Requires Pillow 11.3.0, already pinned for the lossless Mushaf build.
"""
from pathlib import Path
import hashlib
import sys

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "icon-512.png"  # existing official web/PWA logo
RES = ROOT / "android" / "app" / "src" / "main" / "res"
SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
BG = (15, 44, 34, 255)
GOLD = (204, 168, 91, 255)
EXPECTED_XML = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/rihab_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""
BACKGROUND_XML = """<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#0F2C22" />
</shape>
"""


def actual_logo() -> Image.Image:
    if not SOURCE.is_file():
        raise FileNotFoundError("Official website logo source is missing")
    original = Image.open(SOURCE).convert("RGBA")
    if original.size != (512, 512):
        raise ValueError("Refusing to replace Android icon with unexpected logo dimensions")
    if original.getbbox() is None:
        raise ValueError("Official logo cannot be transparent/empty")
    return original


def crop_logo(source: Image.Image, canvas_size: int) -> Image.Image:
    box = source.getchannel("A").getbbox()
    if not box:
        raise ValueError("Logo alpha silhouette is empty")
    cropped = source.crop(box)
    return ImageOps.contain(cropped, (canvas_size, canvas_size), Image.Resampling.LANCZOS)


def native_legacy(source: Image.Image, size: int, circular: bool = False) -> Image.Image:
    # Square/round variants have an emerald-and-gold backdrop. Official
    # logo pixels and proportions are preserved; no artificial text is added.
    upscale = 4
    dim = size * upscale
    im = Image.new("RGBA", (dim, dim), (0, 0, 0, 0) if circular else BG)
    draw = ImageDraw.Draw(im)
    inset = round(dim * 0.02)
    if circular:
        draw.ellipse((inset, inset, dim - inset - 1, dim - inset - 1), fill=BG)
    # Restrained gold edging helps readability on both light/dark home screens.
    rim = max(1, round(dim * 0.012))
    if circular:
        draw.ellipse((inset + rim, inset + rim, dim - inset - rim - 1, dim - inset - rim - 1),
                     outline=GOLD, width=rim)
    else:
        draw.rounded_rectangle((inset + rim, inset + rim, dim - inset - rim - 1,
                               dim - inset - rim - 1), radius=round(dim * .23),
                               outline=GOLD, width=rim)
    mark = crop_logo(source, round(dim * 0.76))
    im.alpha_composite(mark, ((dim - mark.width) // 2, (dim - mark.height) // 2))
    return im.resize((size, size), Image.Resampling.LANCZOS)


def native_adaptive(source: Image.Image, size: int) -> Image.Image:
    # Android's adaptive safe zone covers the central 2/3 of the foreground.
    # Keep every part of the logo inside that zone for circular/squircle masks.
    high = size * 3
    im = Image.new("RGBA", (high, high), (0, 0, 0, 0))
    mark = crop_logo(source, round(high * .62))
    im.alpha_composite(mark, ((high - mark.width) // 2, (high - mark.height) // 2))
    return im.resize((size, size), Image.Resampling.LANCZOS)


def write_png(destination: Path, im: Image.Image) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    im.save(destination, format="PNG", optimize=True)


def main() -> None:
    if not (ROOT / "android" / "app" / "src" / "main" / "AndroidManifest.xml").is_file():
        raise SystemExit("Native Android project missing; run 'cap add android' and 'cap sync android' first")
    logo = actual_logo()
    for density, size in SIZES.items():
        mipmap = RES / ("mipmap-" + density)
        write_png(mipmap / "ic_launcher.png", native_legacy(logo, size))
        write_png(mipmap / "ic_launcher_round.png", native_legacy(logo, size, circular=True))
        write_png(mipmap / "ic_launcher_foreground.png", native_adaptive(logo, size * 9 // 4))
    xml_dir = RES / "mipmap-anydpi-v26"
    xml_dir.mkdir(parents=True, exist_ok=True)
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        (xml_dir / name).write_text(EXPECTED_XML, encoding="utf-8")
    drawable_dir = RES / "drawable"
    drawable_dir.mkdir(parents=True, exist_ok=True)
    (drawable_dir / "rihab_launcher_background.xml").write_text(BACKGROUND_XML, encoding="utf-8")

    # Cap's stock values/colors.xml may exist; do not touch other app resources.
    # A source pointer is embedded in the CI log, never user secrets.
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    print("PASS: branded Android launcher resources installed across 5 densities.")
    print("Official source: public/icon-512.png; SHA-256: " + digest)
    print("Adaptive foreground, legacy round/square icons and XML backgrounds are ready.")


if __name__ == "__main__":
    main()
