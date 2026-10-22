"""Regression tests: an APK/AAB must carry exact original MP3 bytes."""
import hashlib
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from verify_wird_audio import AUDIO, verify_wird_audio_archive


class WirdAudioPackageTests(unittest.TestCase):
    def test_original_source_files_match_approved_sha256(self):
        for name, size, expected in AUDIO:
            file = ROOT / "public" / "audio" / "wird" / name
            self.assertEqual(file.stat().st_size, size)
            self.assertEqual(hashlib.sha256(file.read_bytes()).hexdigest(), expected)

    def make_package(self, archive, prefix, exclude=(), change=None):
        with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_STORED) as z:
            for name, _, _ in AUDIO:
                if name in exclude:
                    continue
                data = (ROOT / "public" / "audio" / "wird" / name).read_bytes()
                if name == change:
                    data = b"BROKEN"
                z.writestr(prefix + "audio/wird/" + name, data)

    def test_both_apk_and_aab_prefixes_verify_against_actual_originals(self):
        with tempfile.TemporaryDirectory() as tmp:
            for prefix in ["assets/public/", "base/assets/public/"]:
                archive = Path(tmp) / ("test-" + prefix.split("/")[0] + ".zip")
                self.make_package(archive, prefix)
                with zipfile.ZipFile(archive) as z:
                    verify_wird_audio_archive(z, prefix)

    def test_missing_recording_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            archive = Path(tmp) / "missing.zip"
            self.make_package(archive, "assets/public/", exclude={"hizb-2.mp3"})
            with zipfile.ZipFile(archive) as z, self.assertRaisesRegex(RuntimeError, "Missing owner-approved"):
                verify_wird_audio_archive(z, "assets/public/")

    def test_tampered_recording_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            archive = Path(tmp) / "broken.zip"
            self.make_package(archive, "base/assets/public/", change="hizb-1.mp3")
            with zipfile.ZipFile(archive) as z, self.assertRaisesRegex(RuntimeError, "length mismatch"):
                verify_wird_audio_archive(z, "base/assets/public/")


if __name__ == "__main__":
    unittest.main()
