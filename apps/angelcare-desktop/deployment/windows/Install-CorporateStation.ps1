[CmdletBinding(SupportsShouldProcess=$true)] param([Parameter(Mandatory=$true)][string]$InstallerPath,[string]$LogDirectory="$env:ProgramData\ANGELCARE\CorporateStation\Logs")
$ErrorActionPreference="Stop";if(!(Test-Path $InstallerPath)){throw "Installer not found: $InstallerPath"};New-Item -ItemType Directory -Force -Path $LogDirectory|Out-Null
$hash=(Get-FileHash -Algorithm SHA256 $InstallerPath).Hash;"$(Get-Date -Format o) installer=$InstallerPath sha256=$hash"|Out-File (Join-Path $LogDirectory "install.log") -Append
if($PSCmdlet.ShouldProcess($InstallerPath,"Install ANGELCARE Desktop")){Start-Process -FilePath $InstallerPath -Wait}
Write-Host "Application installation completed/requested. OS kiosk policies were NOT applied." -ForegroundColor Green
