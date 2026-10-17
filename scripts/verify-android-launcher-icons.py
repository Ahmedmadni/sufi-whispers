#!/usr/bin/env python3
"""Check real Android icon assets AND the compiled APK against official logo.

Fail closed if either the generated native resources or packaged launcher icon
are missing, default, incorrectly sized or out of sync with official web logo.
"""
from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec
import sys
import zipfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = spec_from_file_location("rihab_icons", ROOT / "scripts" / "prepare-android-launcher-icons.py")
module = module_from_spec(spec)
spec.loader.exec_module(module)


def check_icons(apk_path: Path) -> None:
    logo = module.actual_logo()
    res = module.RES
    manifest = (ROOT / "android" / "app" / "src" / "main" / "AndroidManifest.xml").read_text(encoding="utf-8")
    if '@mipmap/ic_launcher"' not in manifest or '@mipmap/ic_launcher_round"' not in manifest:
        raise ValueError("Android launcher manifest does not reference generated logo resources")
    count = 0
    for density, size in module.SIZES.items():
        d = res / ("mipmap-" + density)
        expected = {
            "ic_launcher.png": module.native_legacy(logo, size),
            "ic_launcher_round.png": module.native_legacy(logo, size, circular=True),
            "ic_launcher_foreground.png": module.native_adaptive(logo, size * 9 // 4),
        }
        for filename, generated in expected.items():
            actual = d / filename
            if not actual.is_file():
                raise ValueError(f"Missing native launcher icon: {actual}")
            with Image.open(actual) as parsed:
                parsed.load()
                parsed = parsed.convert("RGBA")
                if parsed.size != generated.size or parsed.tobytes() != generated.tobytes():
                    raise ValueError(f"Native launcher differs from official logo: {actual}")
            count += 1
    xml = res / "mipmap-anydpi-v26"
    for filename in ("ic_launcher.xml", "ic_launcher_round.xml"):
        if (xml / filename).read_text(encoding="utf-8") != module.EXPECTED_XML:
            raise ValueError(f"Adaptive icon missing or modified: {filename}")
    if (res / "drawable" / "rihab_launcher_background.xml").read_text(encoding="utf-8") != module.BACKGROUND_XML:
        raise ValueError("Adaptive launcher background is not the official emerald color")
    if not apk_path.is_file():
        raise FileNotFoundError(f"APK does not exist: {apk_path}")
    with zipfile.ZipFile(apk_path) as package:
        names = set(package.namelist())
        for filename in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
            if not any(n.startswith("res/mipmap-") and n.endswith("/" + filename) for n in names):
                raise ValueError(f"Compiled APK omits launcher resource {filename}")
        if not any(n.startswith("res/mipmap-anydpi") and n.endswith("/ic_launcher.xml") for n in names):
            raise ValueError("Compiled APK omits adaptive launcher definition")
    print(f"PASS: official Rihab association logo in {count} native launcher icons and compiled APK; {apk_path.stat().st_size:,} bytes.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: verify-android-launcher-icons.py path/to/app-debug-or-release.apk")
    check_icons(Path(sys.argv[1]).resolve())
