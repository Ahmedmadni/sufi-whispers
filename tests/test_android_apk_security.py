"""APK static Play Protect readiness checks are strict, tested and non-bypassable."""
import importlib.util
import pathlib
import unittest

MODULE = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "audit-android-apk.py"
spec = importlib.util.spec_from_file_location("rihab_apk_audit", MODULE)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
GOOD_CERT = "Signer #1 certificate SHA-256 digest: " + "b" * 64
METADATA = {
    "package": "com.rihabalkhaliliyya.app",
    "versionCode": "1",
    "versionName": "1.0.0",
    "targetSdk": 36,
    "debuggable": False,
    "testOnly": False,
}
PERMISSIONS = ["android.permission.INTERNET", "android.permission.ACCESS_NETWORK_STATE"]


class ApkSecurityAuditTests(unittest.TestCase):
    def test_reads_aapt_permissions_and_actual_identity(self):
        raw = ("package: com.rihabalkhaliliyya.app\n"
               "uses-permission: name='android.permission.INTERNET'\n"
               "uses-permission: name='android.permission.ACCESS_NETWORK_STATE'\n")
        self.assertEqual(audit.parse_permissions(raw), sorted(PERMISSIONS))
        badging = ("package: name='com.rihabalkhaliliyya.app' versionCode='1' versionName='1.0.0'\n"
                   "sdkVersion:'24'\ntargetSdkVersion:'36'\n")
        self.assertEqual(audit.parse_badging(badging), METADATA)
        self.assertEqual(
            audit.check_report(PERMISSIONS, METADATA, "", GOOD_CERT, "release")["status"],
            "PASS",
        )

    def test_allows_only_notification_permissions_required_for_opt_in_reminders(self):
        approved = PERMISSIONS + [
            "android.permission.POST_NOTIFICATIONS",
            "android.permission.RECEIVE_BOOT_COMPLETED",
            "android.permission.WAKE_LOCK",
        ]
        self.assertEqual(audit.check_report(approved, METADATA, "", GOOD_CERT, "release")["status"], "PASS")
        with self.assertRaisesRegex(ValueError, "Unapproved permission"):
            audit.check_report(approved + ["android.permission.READ_CALENDAR"], METADATA, "", GOOD_CERT, "release")

    def test_refuses_sensitive_side_loaded_permissions(self):
        for permission in sorted(audit.BLOCKED_PERMISSIONS):
            with self.subTest(permission=permission):
                with self.assertRaisesRegex(ValueError, "high-risk permissions"):
                    audit.check_report(PERMISSIONS + [permission], METADATA, "", GOOD_CERT, "release")

    def test_release_cannot_be_debuggable_testonly_cleartext_or_debug_signed(self):
        variants = [
            (dict(METADATA, debuggable=True), "", GOOD_CERT, "debuggable"),
            (dict(METADATA, testOnly=True), "", GOOD_CERT, "testOnly"),
            (METADATA, "  A: android:debuggable(0x0101000f)=(type 0x12)0xffffffff", GOOD_CERT, "debuggable"),
            (METADATA, "  A: android:testOnly(0x01010272)=(type 0x12)0xffffffff", GOOD_CERT, "testOnly"),
            (METADATA, "  A: android:usesCleartextTraffic(0x010104ec)=(type 0x12)0xffffffff", GOOD_CERT, "cleartext"),
            (METADATA, "", "Signer #1 certificate DN: CN=Android Debug\n" + GOOD_CERT, "Debug key"),
        ]
        for metadata, xml, cert, expected in variants:
            with self.subTest(expected=expected), self.assertRaisesRegex(ValueError, expected):
                audit.check_report(PERMISSIONS, metadata, xml, cert, "release")

    def test_invalid_identity_unverified_certificate_and_obsolete_sdk_block_release(self):
        cases = [
            (dict(METADATA, package="other.app"), GOOD_CERT, "applicationId"),
            (dict(METADATA, targetSdk=23), GOOD_CERT, "targetSdk"),
            (METADATA, "not verified", "certificate"),
        ]
        for metadata, cert, expected in cases:
            with self.subTest(expected=expected), self.assertRaisesRegex(ValueError, expected):
                audit.check_report(PERMISSIONS, metadata, "", cert, "release")

    def test_debug_diagnostics_do_not_falsely_claim_release_signing(self):
        report = audit.check_report(
            PERMISSIONS, dict(METADATA, debuggable=True),
            "  A: android:debuggable(0x0101000f)=(type 0x12)0xffffffff",
            GOOD_CERT, "debug",
        )
        self.assertEqual(report["mode"], "debug")
        self.assertTrue(report["debuggable"])
        self.assertEqual(report["blockedPermissionCount"], 0)
        self.assertIn("not a malware", report["limitations"])
        self.assertEqual(
            audit.manifest_flag(" A: android:debuggable(0x0101000f)=(type 0x12)0x0", "debuggable"),
            False,
        )


if __name__ == "__main__":
    unittest.main()
