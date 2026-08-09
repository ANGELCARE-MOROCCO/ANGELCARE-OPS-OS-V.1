$ErrorActionPreference = "Stop"
$Source = Split-Path -Parent $MyInvocation.MyCommand.Path
$Target = $env:SOCIAL_COMMAND_MEDIA_GATEWAY_INSTALL_DIR
if (-not $Target) { $Target = "C:\AngelCare\SocialCommandMediaGateway" }
$MediaRoot = $env:SOCIAL_COMMAND_MEDIA_ROOT
if (-not $MediaRoot) { $MediaRoot = "D:\AngelCareData\SocialCommand" }
New-Item -ItemType Directory -Path $Target -Force | Out-Null
New-Item -ItemType Directory -Path $MediaRoot -Force | Out-Null
Copy-Item (Join-Path $Source "server.js") (Join-Path $Target "server.js") -Force
Copy-Item (Join-Path $Source "package.json") (Join-Path $Target "package.json") -Force
Write-Host "SOCIAL_COMMAND_MEDIA_GATEWAY_SOURCE_INSTALLED" -ForegroundColor Green
Write-Host "Install directory: $Target"
Write-Host "Media root:        $MediaRoot"
Write-Host "Required environment variables:"
Write-Host "  SOCIAL_COMMAND_MEDIA_SIGNING_SECRET"
Write-Host "  SOCIAL_COMMAND_MEDIA_GATEWAY_ADMIN_TOKEN"
Write-Host "  SOCIAL_COMMAND_MEDIA_ALLOWED_ORIGIN"
Write-Host "  SOCIAL_COMMAND_MEDIA_ROOT=$MediaRoot"
Write-Host "  SOCIAL_COMMAND_MEDIA_GATEWAY_PORT=8789"
Write-Host "  SOCIAL_COMMAND_MEDIA_MIN_FREE_BYTES=10737418240 (optional; default 10 GiB reserve)"
Write-Host "  SOCIAL_COMMAND_MEDIA_TEMP_RETENTION_HOURS=24 (optional)"
Write-Host "Register server.js with your existing AngelCare Windows service manager/NSSM after variables are configured."
