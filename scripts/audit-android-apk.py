#!/usr/bin/env python3
"""Inspect FINAL Android APK before distributing.

Google Play Protect warnings have multiple causes: unrecognized sideloaded
apps and genuinely risky permissions are different issues. This script checks
the actual APK's manifest, signing verification and package identity; it does
not claim to certify malware-freedom or evade Play Protect.

No private signing material is inspected or printed.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


BLOCKED_PERMISSIONS = frozenset({
    "android.permission.READ_SMS",
    "android.permission.RECEIVE_SMS",
    "android.permission.SEND_SMS",
    "android.permission.READ_CALL_LOG",
    "android.permission.WRITE_CALL_LOG",
    "android.permission.READ_CONTACTS",
    "android.permission.WRITE_CONTACTS",
    "android.permission.READ_PHONE_STATE",
    "android.permission.ANSWER_PHONE_CALLS",
    "android.permission.RECORD_AUDIO",
    "android.permission.CAMERA",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.READ_MEDIA_IMAGES",
    "android.permission.READ_MEDIA_VIDEO",
    "android.permission.MANAGE_EXTERNAL_STORAGE",
    "android.permission.QUERY_ALL_PACKAGES",
    "android.permission.REQUEST_INSTALL_PACKAGES",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
    "android.permission.BIND_ACCESSIBILITY_SERVICE",
    "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.USE_EXACT_ALARM",
})
PACKAGE_NAME = "com.rihabalkhaliliyya.app"
ALLOWED_PERMISSIONS = frozenset({
    "android.permission.INTERNET",
    "android.permission.ACCESS_NETWORK_STATE",
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.WAKE_LOCK",
    PACKAGE_NAME + ".DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION",
})


def parse_permissions(output: str) -> list[str]:
    names = re.findall(
        r"^uses-permission(?:-sdk-23)?:\s+name='([^']+)'",
        output,
        flags=re.MULTILINE,
    )
    if not names:
        # aapt versions may emit the alternative permission: prefix.
        names = re.findall(
            r"^permission:\s+([^\s]+)", output, flags=re.MULTILINE
        )
    return sorted(set(names))


def parse_badging(output: str) -> dict:
    match = re.search(
        r"^package:\s+name='([^']+)'\s+versionCode='([^']+)'\s+versionName='([^']*)'",
        output, flags=re.MULTILINE,
    )
    if not match:
        raise ValueError("Cannot parse package identity from aapt dump badging")
    sdk = re.search(r"^targetSdkVersion:'(\d+)'", output, flags=re.MULTILINE)
    return {
        "package": match.group(1),
        "versionCode": match.group(2),
        "versionName": match.group(3),
        "targetSdk": int(sdk.group(1)) if sdk else None,
        "debuggable": bool(re.search(r"^application-debuggable\b", output, flags=re.MULTILINE)),
        "testOnly": bool(re.search(r"^application-testOnly\b", output, flags=re.MULTILINE)),
    }


def manifest_flag(xmltree: str, name: str) -> bool | None:
    # Binary manifest aapt XML trees render true as 0xffffffff, 0x1, or true.
    escaped = re.escape(name)
    pattern = r"^\s*A:\s+android:" + escaped + r"\b[^\n]*"
    match = re.search(pattern, xmltree, flags=re.MULTILINE)
    if not match:
        return None
    line = match.group(0)
    if re.search(r"(?:0xffffffff|0x1|\btrue\b)\s*$", line):
        return True
    if re.search(r"(?:0x0|\bfalse\b)\s*$", line):
        return False
    raise ValueError(f"Cannot interpret Android manifest flag: {name}")


def check_report(
    permissions: list[str], metadata: dict, xmltree: str,
    signing_report: str, mode: str,
) -> dict:
    if mode not in {"debug", "release"}:
        raise ValueError("Security audit mode must be debug or release")
    if metadata.get("package") != PACKAGE_NAME:
        raise ValueError("Unexpected Android applicationId")
    if not re.fullmatch(r"[1-9]\d*", str(metadata.get("versionCode", ""))):
        raise ValueError("Invalid versionCode")
    dangerous = sorted(set(permissions) & BLOCKED_PERMISSIONS)
    if dangerous:
        raise ValueError("Unexpected high-risk permissions in Android package: " + ", ".join(dangerous))
    unexpected = sorted(set(permissions) - ALLOWED_PERMISSIONS)
    if unexpected:
        raise ValueError("Unapproved permission in signed APK: " + ", ".join(unexpected))
    if "android.permission.INTERNET" not in permissions:
        raise ValueError("Capacitor Android APK missing standard INTERNET permission")
    if metadata.get("targetSdk") is None or metadata["targetSdk"] < 35:
        raise ValueError("Android targetSdk must be 35 or newer")
    if not re.search(r"Signer #1 certificate SHA-256 digest:\s*[0-9a-fA-F]{64}", signing_report):
        raise ValueError("APK has no validated SHA-256 signing certificate")
    cert = re.search(r"Signer #1 certificate SHA-256 digest:\s*([0-9a-fA-F]{64})", signing_report)
    if mode == "release":
        if metadata["debuggable"] or manifest_flag(xmltree, "debuggable") is True:
            raise ValueError("Production release must not be debuggable")
        if metadata["testOnly"] or manifest_flag(xmltree, "testOnly") is True:
            raise ValueError("Production release cannot be testOnly")
        if manifest_flag(xmltree, "usesCleartextTraffic") is True:
            raise ValueError("Production release cannot allow cleartext HTTP by default")
        if re.search(r"Signer #1 certificate DN:.*Android Debug", signing_report):
            raise ValueError("Release APK is still signed with the Android Debug key")
    report = {
        "mode": mode,
        "package": metadata["package"],
        "versionCode": str(metadata["versionCode"]),
        "versionName": metadata["versionName"],
        "targetSdk": metadata["targetSdk"],
        "debuggable": metadata["debuggable"] or manifest_flag(xmltree, "debuggable") is True,
        "certificateSha256": cert.group(1).lower(),
        "permissions": permissions,
        "blockedPermissionCount": 0,
        "status": "PASS",
        "limitations": (
            "Static permission, signing and build-type checks only; "
            "not a malware or Google Play Protect verdict."
        ),
    }
    return report


def execute(*args: str) -> str:
    result = subprocess.run(args, capture_output=True, text=True, check=True)
    return result.stdout


def audit(apk: Path, mode: str, aapt: str, apksigner: str, output: Path | None) -> None:
    if not apk.is_file() or apk.stat().st_size < 1_000_000:
        raise ValueError("APK is missing or unexpectedly small")
    badging = execute(aapt, "dump", "badging", str(apk))
    permissions = execute(aapt, "dump", "permissions", str(apk))
    tree = execute(aapt, "dump", "xmltree", str(apk), "AndroidManifest.xml")
    certificate = execute(apksigner, "verify", "--verbose", "--print-certs", str(apk))
    report = check_report(
        parse_permissions(permissions), parse_badging(badging),
        tree, certificate, mode,
    )
    if output is not None:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"PASS Android {mode} security audit: {report['package']}, SDK {report['targetSdk']}")
    print(f"Declared APK permissions ({len(report['permissions'])}): {', '.join(report['permissions'])}")
    print("Public signing certificate SHA-256:", report["certificateSha256"])
    if mode == "debug":
        print("NOTE: Debug is signed with a development certificate and cannot be treated as an official production release.")
    print("NOTE: Google Play Protect may still inspect apps installed outside Google Play.")


if __name__ == "__main__":
    if len(sys.argv) not in {5, 6}:
        raise SystemExit("Usage: audit-android-apk.py APK debug|release AAPT APKSIGNER [OUT_REPORT.json]")
    try:
        audit(
            Path(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4],
            Path(sys.argv[5]) if len(sys.argv) == 6 else None,
        )
    except (subprocess.CalledProcessError, ValueError, OSError) as exc:
        raise SystemExit("FAIL Android security audit: " + str(exc)) from None
