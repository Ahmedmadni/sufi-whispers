"""Verify original owner-approved Wird audio inside an APK or AAB archive.

The check streams each ZIP member instead of extracting or trusting file names.
It is deliberately independent of the prebuild and web bundle validators.
"""
import hashlib
import zipfile

AUDIO = (
    ("hizb-1.mp3", 9357687, "92f50015584fe52add33cc919e4371785957e9bacb54131597294b4a61a095c1"),
    ("hizb-2.mp3", 11343344, "e973da3691fd34f60f7047028c646226d9c205245ae7c5a819f6469a40b5abaf"),
)


def verify_wird_audio_archive(archive: zipfile.ZipFile, prefix: str) -> None:
    for name, expected_size, expected_sha256 in AUDIO:
        member = prefix + "audio/wird/" + name
        try:
            info = archive.getinfo(member)
        except KeyError as exc:
            raise RuntimeError("Missing owner-approved audio in Android package: " + member) from exc
        if info.file_size != expected_size:
            raise RuntimeError(f"Wird audio length mismatch: {member} ({info.file_size} vs {expected_size})")
        digest = hashlib.sha256()
        with archive.open(info) as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
        if digest.hexdigest() != expected_sha256:
            raise RuntimeError("Wird audio checksum mismatch: " + member)
    print("PASS: both original Wird audio tracks verified in " + prefix)
