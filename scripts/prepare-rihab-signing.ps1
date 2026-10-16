# One-time local Windows signing key helper for Rihab Al-Khaliliyya.
# This script never sends passwords or keystore bytes to any server.
# Run with -CopyBase64 AFTER generating the key to copy its encoded bytes
# to the clipboard for GitHub Actions secret configuration.
param([switch] $CopyBase64)
$ErrorActionPreference = 'Stop'

$Alias = 'rihab-production'
$KeyName = 'rihab-production.jks'
$KeyFolder = Join-Path $HOME 'RihabKeys'
$KeyFile = Join-Path $KeyFolder $KeyName

if ($CopyBase64) {
    if (-not (Test-Path -LiteralPath $KeyFile -PathType Leaf)) {
        throw "Signing keystore not found at $KeyFile. Generate it first."
    }
    [Convert]::ToBase64String([IO.File]::ReadAllBytes($KeyFile)) | Set-Clipboard
    Write-Host "Keystore Base64 copied privately to clipboard. Paste into ANDROID_RELEASE_KEYSTORE_BASE64 on GitHub."
    Write-Host "Clear the clipboard after saving the secret. Never paste it in chat or source files."
    exit 0
}

if (Test-Path -LiteralPath $KeyFile) {
    Write-Host "An existing signing key was found at: $KeyFile"
    Write-Host "It was NOT overwritten. Keep this original key safe for all future releases."
    exit 0
}

$cmd = Get-Command 'keytool.exe' -ErrorAction SilentlyContinue
$Keytool = if ($cmd) { $cmd.Source } else { $null }

if (-not $Keytool) {
    $folders = @(
        (Join-Path $env:ProgramFiles 'Eclipse Adoptium'),
        (Join-Path $env:ProgramFiles 'Java'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Eclipse Adoptium')
    )
    foreach ($folder in $folders) {
        if (-not (Test-Path -LiteralPath $folder -PathType Container)) { continue }
        $jdks = Get-ChildItem -LiteralPath $folder -Directory -ErrorAction SilentlyContinue |
            Sort-Object Name -Descending
        foreach ($jdk in $jdks) {
            $candidate = Join-Path $jdk.FullName 'bin\keytool.exe'
            if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                $Keytool = $candidate
                break
            }
        }
        if ($Keytool) { break }
    }
}

if (-not $Keytool) {
    throw 'Java keytool was not found. Verify Eclipse Temurin JDK 21 installation; do not reinstall without checking.'
}

New-Item -ItemType Directory -Force -Path $KeyFolder | Out-Null
Write-Host "Creating Android production signing key for Rihab Al-Khaliliyya."
Write-Host "File: $KeyFile"
Write-Host "Alias: $Alias"
Write-Host 'A secure password will be requested interactively and never stored in this script.'
Write-Host 'When typing the password, PowerShell may show no characters. This is normal.'

& $Keytool -genkeypair -v -keystore $KeyFile -storetype PKCS12 -alias $Alias -keyalg RSA -keysize 3072 -validity 10000
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $KeyFile -PathType Leaf)) {
    throw 'keytool did not create the signing file. Review its message above.'
}

Write-Host "SUCCESS: Production signing keystore created at $KeyFile"
Write-Host 'Keep two private backups of this file and its password, OUTSIDE the GitHub project.'
Write-Host 'When ready, run the same script with -CopyBase64 to prepare the GitHub secret.'
