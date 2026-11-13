param(
  [Parameter(Mandatory = $true)][string]$MsiPath,
  [Parameter(Mandatory = $true)][string]$SetupPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$oldMsiUrl = "https://github.com/playertwo1/coucou/releases/download/windows-v0.6.11/Coucou-Windows-0.6.11.msi"
$oldSetupUrl = "https://github.com/playertwo1/coucou/releases/download/windows-v0.6.11/Coucou-Windows-0.6.11-setup.exe"
$testRoot = [IO.Path]::GetFullPath((Join-Path $env:TEMP "lumen-upgrade-$PID"))
$tempPrefix = [IO.Path]::GetFullPath($env:TEMP).TrimEnd('\') + '\'
if (-not $testRoot.StartsWith($tempPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Temporary test directory is outside TEMP: $testRoot"
}

$settingsPath = Join-Path $env:APPDATA "Coucou\settings.json"
$localData = Join-Path $env:LOCALAPPDATA "Coucou"
$hookPath = Join-Path $localData "bin\coucou-hook.exe"
$inboxPath = Join-Path $localData "inbox\synthetic-upgrade.txt"
$logPath = Join-Path $localData "coucou.log"
$identityPath = "HKCU:\Software\Classes\AppUserModelId\fr.louisraille.coucou"

function Assert-Equal([string]$Actual, [string]$Expected, [string]$Name) {
  if ($Actual -cne $Expected) { throw "$Name changed: expected '$Expected', got '$Actual'" }
}

function Invoke-Msi([string]$Path) {
  $process = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$Path`" /qn /norestart" -Wait -PassThru
  if ($process.ExitCode -notin @(0, 3010)) { throw "MSI exited with $($process.ExitCode): $Path" }
}

function Invoke-Nsis([string]$Installer, [string]$Destination) {
  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
  $process = Start-Process -FilePath $Installer -ArgumentList "/S /D=$Destination" -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "NSIS exited with $($process.ExitCode): $Installer" }
}

function Installed-App([string]$Name) {
  $roots = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall"
  )
  foreach ($root in $roots) {
    if (-not (Test-Path $root)) { continue }
    foreach ($key in Get-ChildItem -LiteralPath $root) {
      $app = Get-ItemProperty -LiteralPath $key.PSPath -ErrorAction SilentlyContinue
      if ($app.PSObject.Properties["DisplayName"] -and $app.DisplayName -eq $Name) { return $app }
    }
  }
  return $null
}

function Seed-LegacyData([string]$Scenario) {
  $marker = "sintetico-$Scenario"
  New-Item -ItemType Directory -Path (Split-Path $settingsPath), (Split-Path $hookPath), (Split-Path $inboxPath) -Force | Out-Null
  $settings = '{"language":"fr","soundVolume":0.17,"syntheticMarker":"' + $marker + '"}'
  [IO.File]::WriteAllText($settingsPath, $settings, [Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllBytes($hookPath, [Text.Encoding]::UTF8.GetBytes("synthetic-coucou-hook-$marker"))
  [IO.File]::WriteAllText($inboxPath, $marker, [Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllText($logPath, $marker, [Text.UTF8Encoding]::new($false))
}

function Assert-LegacyData([string]$Scenario) {
  $marker = "sintetico-$Scenario"
  $settings = '{"language":"fr","soundVolume":0.17,"syntheticMarker":"' + $marker + '"}'
  Assert-Equal ([IO.File]::ReadAllText($settingsPath)) $settings "settings.json"
  Assert-Equal ([Text.Encoding]::UTF8.GetString([IO.File]::ReadAllBytes($hookPath))) "synthetic-coucou-hook-$marker" "legacy hook path"
  Assert-Equal ([IO.File]::ReadAllText($inboxPath)) $marker "legacy inbox"
  Assert-Equal ([IO.File]::ReadAllText($logPath)) $marker "legacy log"
}

try {
  New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
  $oldMsi = Join-Path $testRoot "Coucou-Windows-0.6.11.msi"
  $oldSetup = Join-Path $testRoot "Coucou-Windows-0.6.11-setup.exe"
  Invoke-WebRequest -Uri $oldMsiUrl -OutFile $oldMsi
  Invoke-WebRequest -Uri $oldSetupUrl -OutFile $oldSetup
  Assert-Equal (Get-FileHash -LiteralPath $oldMsi -Algorithm SHA256).Hash.ToLowerInvariant() "3c6bc710dde8f195774c470cd0ed48238c30e60016797a0e83d056f217e45033" "published 0.6.11 MSI SHA-256"
  Assert-Equal (Get-FileHash -LiteralPath $oldSetup -Algorithm SHA256).Hash.ToLowerInvariant() "e0c6d17f77d31b44c2ecd8b57f1a53793bcc81d141f12eed29758b8c6ccc727b" "published 0.6.11 NSIS SHA-256"

  Invoke-Msi $oldMsi
  if (-not (Installed-App "Coucou")) { throw "The 0.6.11 MSI did not register Coucou." }
  Seed-LegacyData "msi"
  Invoke-Msi ([IO.Path]::GetFullPath($MsiPath))
  if (-not (Installed-App "Lumen")) { throw "The Lumen MSI did not register Lumen." }
  if (Installed-App "Coucou") { throw "MSI upgrade left the old Coucou product installed." }
  Assert-LegacyData "msi"
  Assert-Equal (Get-ItemProperty -LiteralPath $identityPath).DisplayName "Lumen" "notification display name after MSI upgrade"
  Write-Output "PASS: MSI upgrade replaces Coucou and preserves synthetic user data."

  $oldNsiDir = Join-Path $testRoot "old-coucou-nsis"
  $lumenNsiDir = Join-Path $testRoot "new-lumen-nsis"
  Invoke-Nsis $oldSetup $oldNsiDir
  $oldNsiExe = Join-Path $oldNsiDir "Coucou.exe"
  if (-not (Test-Path -LiteralPath $oldNsiExe)) { throw "The 0.6.11 NSIS install has no Coucou.exe in its test directory." }
  Seed-LegacyData "nsis"
  Invoke-Nsis ([IO.Path]::GetFullPath($SetupPath)) $lumenNsiDir
  if (-not (Test-Path -LiteralPath $oldNsiExe)) { throw "The Lumen NSIS install removed the old Coucou app." }
  if (-not (Test-Path -LiteralPath (Join-Path $lumenNsiDir "lumen.exe"))) { throw "The Lumen NSIS install has no lumen.exe." }
  Assert-LegacyData "nsis"
  Assert-Equal (Get-ItemProperty -LiteralPath $identityPath).DisplayName "Lumen" "notification display name after NSIS install"
  Write-Output "PASS: NSIS installs beside Coucou and preserves synthetic user data."
}
finally {
  if (Test-Path -LiteralPath $testRoot) { Remove-Item -LiteralPath $testRoot -Recurse -Force }
}
