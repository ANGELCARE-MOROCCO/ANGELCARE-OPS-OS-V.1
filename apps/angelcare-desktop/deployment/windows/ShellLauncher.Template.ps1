# TEMPLATE ONLY — requires supported Windows Enterprise/Education/IoT edition and explicit administrator review.
# Do not run until the executable path, operator SID, emergency-admin path, exit codes and rollback have been validated on a pilot device.
[CmdletBinding(SupportsShouldProcess=$true)] param([Parameter(Mandatory=$true)][string]$OperatorSid,[string]$Executable="$env:ProgramFiles\ANGELCARE Desktop\ANGELCARE Desktop.exe")
$ErrorActionPreference="Stop";if(!(Test-Path $Executable)){throw "Executable not found"}
$feature=Get-WindowsOptionalFeature -Online -FeatureName Client-DeviceLockdown,Client-EmbeddedShellLauncher -ErrorAction SilentlyContinue
$feature|Format-Table FeatureName,State
if(!$PSCmdlet.ShouldProcess($OperatorSid,"Configure Shell Launcher for ANGELCARE Desktop")){return}
throw "Safety stop: this template intentionally does not mutate Shell Launcher. Complete edition-specific MDM/GPO validation, then implement through your approved endpoint-management change."
