[CmdletBinding()] param([string]$ExpectedVersion = "1.5.0", [string]$InstallPath = "$env:ProgramFiles\ANGELCARE Desktop")
$ErrorActionPreference = "Stop"
function Result($Name,$Status,$Detail){[pscustomobject]@{Check=$Name;Status=$Status;Detail=$Detail}}
$results=@();$edition=(Get-ComputerInfo -Property WindowsProductName,WindowsVersion,OsArchitecture)
$results+=Result "Windows edition" "INFO" "$($edition.WindowsProductName) $($edition.WindowsVersion) $($edition.OsArchitecture)"
$shellLauncherSupported=$edition.WindowsProductName -match "Enterprise|Education|IoT"
$results+=Result "Shell Launcher eligibility" ($(if($shellLauncherSupported){"PASS"}else{"GUIDANCE"})) ($(if($shellLauncherSupported){"Edition potentially eligible; confirm optional feature and licensing."}else{"Use application Locked Mode or supported Assigned Access; Shell Launcher is not assumed on this edition."}))
$exe=Join-Path $InstallPath "ANGELCARE Desktop.exe";$results+=Result "Desktop executable" ($(if(Test-Path $exe){"PASS"}else{"NOT_INSTALLED"})) $exe
$results+=Result "Operator account" ($(if(([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){"WARNING"}else{"PASS"})) "Production operators should use a standard non-administrator account."
$results+=Result "Emergency admin" "MANUAL" "Confirm a separate tested administrator account and sealed recovery procedure."
$results|Format-Table -AutoSize
if($results.Status -contains "NOT_INSTALLED"){exit 2};exit 0
