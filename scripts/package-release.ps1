param(
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

$syncVersionScript = Join-Path $root 'scripts\sync-version.cjs'
node $syncVersionScript

$packageJsonPath = Join-Path $root 'package.json'
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$version = $packageJson.version

if ([string]::IsNullOrWhiteSpace($version)) {
  throw 'package.json version is empty.'
}

$releaseRoot = Join-Path $root 'release'
$stagingDirName = "ACE-Lite_$($version)_windows_x64"
$stagingDir = Join-Path $releaseRoot $stagingDirName
$zipPath = Join-Path $releaseRoot "$stagingDirName.zip"
$exePath = Join-Path $root 'src-tauri\target\release\ace-lite.exe'

if (-not $SkipBuild) {
  $cargoBin = Join-Path $env:USERPROFILE '.cargo\bin'
  if (Test-Path $cargoBin) {
    $env:PATH = "$cargoBin;$env:PATH"
  }

  Write-Host "Building ACE-Lite v$version..."
  npm run tauri build
}

if (-not (Test-Path $exePath)) {
  throw "Release executable not found: $exePath"
}

if (Test-Path $stagingDir) {
  Remove-Item $stagingDir -Recurse -Force
}
New-Item -ItemType Directory -Force $stagingDir | Out-Null

Copy-Item $exePath (Join-Path $stagingDir 'ACE-Lite.exe') -Force
Copy-Item (Join-Path $root 'LICENSE') (Join-Path $stagingDir 'LICENSE') -Force
Copy-Item (Join-Path $root 'README.md') (Join-Path $stagingDir 'README.md') -Force

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

Compress-Archive -Path (Join-Path $stagingDir '*') -DestinationPath $zipPath -Force

Write-Host ''
Write-Host "Portable release package created:"
Get-Item $zipPath | Select-Object FullName, Length, LastWriteTime

Write-Host ''
Write-Host 'ZIP contents:'
tar -tf $zipPath
