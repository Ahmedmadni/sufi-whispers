"""Cloud recovery file safety and tamper-resistance tests (offline, fast)."""
import hashlib
import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("cloud_backup", HERE / "scripts/cloud-backup.py")
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class CloudBackupTests(unittest.TestCase):
    def test_rejects_key_material_and_traversal(self):
        bad = ["../secret", "/private/private.key", "mobile/.env.production",
               "sources/signing-key.jks", "media/id_ed25519", "node_modules/private.txt",
               "foo\\bar", "dir/.git/config"]
        for path in bad:
            with self.subTest(path=path), self.assertRaises(ValueError):
                backup.safe_relative(path)
        self.assertEqual(backup.safe_relative("original-mushaf/pages/001.png"), "original-mushaf/pages/001.png")

    def test_detects_changed_source_hash_and_missing_file(self):
        with tempfile.TemporaryDirectory() as temp:
            name = Path(temp) / "test.pdf"
            name.write_bytes(b"%PDF-abc")
            digest = backup.sha256(name)
            backup.verified_file(name, 8, digest)
            with self.assertRaisesRegex(ValueError, "byte mismatch"):
                backup.verified_file(name, 9, digest)
            with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
                backup.verified_file(name, 8, "0" * 64)
            name.unlink()
            with self.assertRaisesRegex(ValueError, "Missing"):
                backup.verified_file(name, 8, digest)

    def test_verifier_detects_tampered_manifest_payload(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "recovery.zip"
            data = b"history-bundle-source"
            file_name = "repository/project-history.bundle"
            manifest = {
                "format": backup.BACKUP_FORMAT,
                "verifiedPrintedQuranPages": backup.EXPECTED_PAGES,
                "verifiedOfflineBookPages": backup.EXPECTED_BOOK_PAGES,
                "approvedOriginalMushafSourceSha256": backup.SOURCE_SHA,
                "entries": [{"path": file_name, "bytes": len(data),
                             "sha256": hashlib.sha256(data).hexdigest()}],
            }
            with zipfile.ZipFile(target, "w") as archive:
                archive.writestr(file_name, data)
                archive.writestr("BACKUP-INSTRUCTIONS.txt", "restore instructions")
                archive.writestr("RECOVERY-MANIFEST.json", json.dumps(manifest))
            backup.verify(target)
            with zipfile.ZipFile(target, "w") as archive:
                archive.writestr(file_name, b"tampered data")
                archive.writestr("BACKUP-INSTRUCTIONS.txt", "restore instructions")
                archive.writestr("RECOVERY-MANIFEST.json", json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                backup.verify(target)

    def test_verifier_rejects_additional_unlisted_secrets(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "recovery.zip"
            manifest = {"format": backup.BACKUP_FORMAT,
                        "verifiedPrintedQuranPages": backup.EXPECTED_PAGES,
                        "verifiedOfflineBookPages": backup.EXPECTED_BOOK_PAGES,
                        "approvedOriginalMushafSourceSha256": backup.SOURCE_SHA,
                        "entries": []}
            with zipfile.ZipFile(target, "w") as archive:
                archive.writestr("RECOVERY-MANIFEST.json", json.dumps(manifest))
                archive.writestr("BACKUP-INSTRUCTIONS.txt", "restore")
                archive.writestr("some-extra.txt", "not in manifest")
            with self.assertRaisesRegex(ValueError, "extra or missing"):
                backup.verify(target)


if __name__ == "__main__":
    unittest.main()
