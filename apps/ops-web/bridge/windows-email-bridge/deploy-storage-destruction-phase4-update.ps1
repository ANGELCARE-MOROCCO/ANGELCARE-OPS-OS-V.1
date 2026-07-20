param(
  [string]$SourceFile = "",
  [string]$TargetFile = "C:\AngelCare\email-bridge\server.js",
  [string]$ServiceName = "angelcare-email-bridge",
  [string]$QuarantineRoot = "C:\AngelCare\quarantine"
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($SourceFile)) { $SourceFile = Join-Path $PSScriptRoot "server.js" }
$SourceFile = [System.IO.Path]::GetFullPath($SourceFile)
$TargetFile = [System.IO.Path]::GetFullPath($TargetFile)
$QuarantineRoot = [System.IO.Path]::GetFullPath($QuarantineRoot)
if (-not (Test-Path $SourceFile)) { throw "Patched bridge source was not found: $SourceFile" }

$RequiredContracts = @(
  '/admin/storage/inventory',
  '/admin/storage/browse',
  '/admin/storage/quarantine/impact',
  '/admin/storage/quarantine/execute',
  '/admin/storage/quarantine/restore',
  '/admin/storage/destruction/preflight',
  '/admin/storage/destruction/execute',
  '/admin/storage/destruction/status',
  '/admin/storage/destruction/verify',
  '/admin/storage/destruction/cancel',
  '/admin/storage/cleanup/dry-run',
  '/admin/storage/cleanup/execute'
)
$SourceContent = Get-Content -Path $SourceFile -Raw
foreach ($Contract in $RequiredContracts) {
  if (-not $SourceContent.Contains($Contract)) { throw "The selected source does not contain required Phase 4 endpoint: $Contract" }
}

$TargetDirectory = Split-Path -Parent $TargetFile
if (-not (Test-Path $TargetDirectory)) { New-Item -ItemType Directory -Path $TargetDirectory -Force | Out-Null }
if (-not (Test-Path $QuarantineRoot)) { New-Item -ItemType Directory -Path $QuarantineRoot -Force | Out-Null }
$EvidenceRoot = Join-Path $QuarantineRoot "destruction-evidence"
if (-not (Test-Path $EvidenceRoot)) { New-Item -ItemType Directory -Path $EvidenceRoot -Force | Out-Null }

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDirectory = Join-Path $TargetDirectory "backups\storage-destruction-phase4-$Stamp"
New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null
if (Test-Path $TargetFile) { Copy-Item $TargetFile (Join-Path $BackupDirectory "server.js.before-storage-destruction-phase4") -Force }
Copy-Item $SourceFile $TargetFile -Force
& node --check $TargetFile
if ($LASTEXITCODE -ne 0) { throw "Node syntax validation failed. The service was not restarted. Backup: $BackupDirectory" }

[Environment]::SetEnvironmentVariable("STORAGE_QUARANTINE_ROOT", $QuarantineRoot, [EnvironmentVariableTarget]::Machine)
$EnvFile = Join-Path $TargetDirectory ".env"
if (Test-Path $EnvFile) {
  $EnvLines = Get-Content -Path $EnvFile -ErrorAction SilentlyContinue
  $FilteredLines = @($EnvLines | Where-Object { $_ -notmatch '^STORAGE_QUARANTINE_ROOT=' })
  $FilteredLines += "STORAGE_QUARANTINE_ROOT=$QuarantineRoot"
  Set-Content -Path $EnvFile -Value $FilteredLines -Encoding UTF8
}

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($null -eq $service) { throw "Windows service '$ServiceName' was not found. The file was updated but the service was not restarted." }
Restart-Service -Name $ServiceName -Force
Start-Sleep -Seconds 3
$service = Get-Service -Name $ServiceName
if ($service.Status -ne "Running") { throw "The bridge service did not return to Running status. Backup: $BackupDirectory" }

Write-Host "Storage Destruction Phase 4 bridge update deployed successfully." -ForegroundColor Green
Write-Host "Source:          $SourceFile"
Write-Host "Target:          $TargetFile"
Write-Host "Backup:          $BackupDirectory"
Write-Host "Quarantine root: $QuarantineRoot"
Write-Host "Evidence root:   $EvidenceRoot"
Write-Host "Service:         $ServiceName ($($service.Status))"
Write-Host "Governed Phase 4 endpoints:" -ForegroundColor Cyan
$RequiredContracts | ForEach-Object { Write-Host "  $_" }
Write-Host "Permanent destruction is accepted only through approved Phase 4 requests and signed quarantine evidence." -ForegroundColor Yellow
