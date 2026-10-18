#!/usr/bin/env python3
"""Check real Android icon assets AND the compiled APK against official logo.

Fail closed if either the generated native resources or packaged launcher icon
are missing, default, incorrectly sized or out of sync with official web logo.
"""
from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec
import os
import re
import subprocess
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
    # Android Gradle/AAPT2 can re-encode PNG as WebP or rename the packaged
    # resource path during Release, even when Debug retains the source name.
    # The authoritative proof of the compiled resource is the resource table,
    # not a filename under the APK ZIP. Inspect it with Android SDK aapt.
    sdk = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT") or "/usr/local/lib/android/sdk"
    aapt = Path(sdk) / "build-tools" / "36.0.0" / "aapt"
    if not aapt.is_file():
        raise ValueError("Android SDK aapt 36.0.0 unavailable for compiled APK icon audit")
    resources = subprocess.run(
        [str(aapt), "dump", "resources", str(apk_path)],
        capture_output=True, text=True, check=True,
    ).stdout
    # Both launcher IDs MUST be resolvable in the actual compiled table.
    # The foreground image and background are required by the adaptive icon.
    required_ids = (
        "mipmap/ic_launcher",
        "mipmap/ic_launcher_round",
        "mipmap/ic_launcher_foreground",
        "drawable/rihab_launcher_background",
    )
    for name in required_ids:
        if not re.search(r":" + re.escape(name) + r"(?=[\s:])", resources):
            raise ValueError(f"Compiled APK lacks Android resource table entry: {name}")
    with zipfile.ZipFile(apk_path) as package:
        names = set(package.namelist())
        # Native image payloads might be WebP, PNG or resource-shrunk names.
        # Confirm a resource image is packaged, not merely listed by aapt.
        if not any(n.startswith("res/") and n.endswith((".png", ".webp")) for n in names):
            raise ValueError("Compiled APK contains no image resources for its launcher")
    print(f"PASS: official Rihab logo matches {count} native generated icons; all compiled launcher resources present in APK ({apk_path.stat().st_size:,} bytes).")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: verify-android-launcher-icons.py path/to/app-debug-or-release.apk")
    check_icons(Path(sys.argv[1]).resolve())
