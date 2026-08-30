$ErrorActionPreference = 'Stop'
$Target = if ($env:MARKETPLACE_MEDIA_GATEWAY_INSTALL_DIR) { $env:MARKETPLACE_MEDIA_GATEWAY_INSTALL_DIR } else { 'C:\AngelCare\MarketplaceMediaGateway' }
$MediaRoot = if ($env:MARKETPLACE_MEDIA_ROOT) { $env:MARKETPLACE_MEDIA_ROOT } else { 'D:\AngelCareData\Marketplace' }
New-Item -ItemType Directory -Force -Path $Target | Out-Null
New-Item -ItemType Directory -Force -Path $MediaRoot | Out-Null
Copy-Item -Force "$PSScriptRoot\server.js" "$Target\server.js"
Copy-Item -Force "$PSScriptRoot\package.json" "$Target\package.json"
Write-Host 'ANGELCARE_MARKETPLACE_MEDIA_GATEWAY_SOURCE_INSTALLED' -ForegroundColor Green
Write-Host "Install directory: $Target"
Write-Host "Marketplace media root: $MediaRoot"
Write-Host 'Configure MARKETPLACE_MEDIA_SIGNING_SECRET, MARKETPLACE_MEDIA_GATEWAY_ADMIN_TOKEN and MARKETPLACE_MEDIA_ALLOWED_ORIGIN in the Windows service environment.'
