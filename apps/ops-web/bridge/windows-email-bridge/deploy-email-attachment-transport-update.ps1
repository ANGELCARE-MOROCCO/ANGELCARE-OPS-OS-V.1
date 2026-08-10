param(
  [string]$SourceFile = "",
  [string]$TargetFile = "C:\AngelCare\email-bridge\server.js",
  [string]$ServiceName = "angelcare-email-bridge"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($SourceFile)) {
  $SourceFile = Join-Path $PSScriptRoot "server.js"
}

$SourceFile = [System.IO.Path]::GetFullPath($SourceFile)
$TargetFile = [System.IO.Path]::GetFullPath($TargetFile)

if (-not (Test-Path $SourceFile)) {
  throw "Patched bridge source was not found: $SourceFile"
}
if (-not (Test-Path $TargetFile)) {
  throw "Current production bridge server.js was not found: $TargetFile"
}

$secret = [Environment]::GetEnvironmentVariable("EMAIL_STORAGE_TRANSFER_SIGNING_SECRET", "Machine")
if ([string]::IsNullOrWhiteSpace($secret)) {
  $secret = [Environment]::GetEnvironmentVariable("EMAIL_STORAGE_TRANSFER_SIGNING_SECRET", "Process")
}
if ([string]::IsNullOrWhiteSpace($secret) -or $secret.Length -lt 32) {
  throw "EMAIL_STORAGE_TRANSFER_SIGNING_SECRET is missing or shorter than 32 characters. Configure the SAME secret used by Vercel before deploying the bridge update."
}

$origins = [Environment]::GetEnvironmentVariable("EMAIL_STORAGE_ALLOWED_ORIGINS", "Machine")
if ([string]::IsNullOrWhiteSpace($origins)) {
  $origins = [Environment]::GetEnvironmentVariable("EMAIL_STORAGE_ALLOWED_ORIGINS", "Process")
}
if ([string]::IsNullOrWhiteSpace($origins)) {
  throw "EMAIL_STORAGE_ALLOWED_ORIGINS is not configured. Configure exact HTTPS origin(s) before deploying the bridge update."
}

& node --check $SourceFile
if ($LASTEXITCODE -ne 0) {
  throw "Patched bridge source failed node --check. Nothing was deployed."
}

$TargetDirectory = Split-Path -Parent $TargetFile
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDirectory = Join-Path $TargetDirectory "backups\email-attachment-transport-$Stamp"
New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null
$BackupFile = Join-Path $BackupDirectory "server.js.before-email-attachment-transport"
Copy-Item $TargetFile $BackupFile -Force

Copy-Item $SourceFile $TargetFile -Force

try {
  & node --check $TargetFile
  if ($LASTEXITCODE -ne 0) { throw "Installed server.js failed node --check" }

  $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  if ($null -eq $service) { throw "Windows service '$ServiceName' was not found" }

  Restart-Service -Name $ServiceName -Force
  Start-Sleep -Seconds 3
  $service = Get-Service -Name $ServiceName
  if ($service.Status -ne "Running") { throw "Bridge service did not return to Running status" }
} catch {
  Write-Warning "Bridge activation failed. Restoring previous server.js from $BackupFile"
  Copy-Item $BackupFile $TargetFile -Force
  & node --check $TargetFile | Out-Null
  $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  if ($null -ne $service) {
    Restart-Service -Name $ServiceName -Force
    Start-Sleep -Seconds 3
  }
  throw
}

Write-Host "Email attachment transport bridge update deployed successfully." -ForegroundColor Green
Write-Host "Source:       $SourceFile"
Write-Host "Target:       $TargetFile"
Write-Host "Backup:       $BackupFile"
Write-Host "Service:      $ServiceName (Running)"
Write-Host "Direct upload:   /storage/direct-upload/:fileId" -ForegroundColor Cyan
Write-Host "Direct download: /storage/direct-download/:fileId" -ForegroundColor Cyan
Write-Host "Existing /send and /admin/storage/* endpoints remain available." -ForegroundColor Cyan
