[CmdletBinding(SupportsShouldProcess=$true)] param([switch]$RemoveStartup)
$ErrorActionPreference="Stop";if($RemoveStartup -and $PSCmdlet.ShouldProcess("HKCU Run","Remove ANGELCARE startup")){Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "ANGELCARE Corporate Station" -ErrorAction SilentlyContinue}
Write-Host "Application startup rollback complete. Shell Launcher/Assigned Access/AppLocker must be rolled back through the same approved management channel that applied them." -ForegroundColor Yellow
