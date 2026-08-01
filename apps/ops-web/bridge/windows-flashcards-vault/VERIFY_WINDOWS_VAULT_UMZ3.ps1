param([string]$InstallDir="C:\AngelCare\flashcards-vault-node",[string]$StorageRoot="C:\AngelCare\storage\flashcards-os")
$ErrorActionPreference="Stop";$fail=@()
function Check($name,$ok){if($ok){Write-Host "PASS  $name" -ForegroundColor Green}else{Write-Host "FAIL  $name" -ForegroundColor Red;$script:fail+=$name}}
Check "server.js installed" (Test-Path "$InstallDir\server.js")
Check "package.json installed" (Test-Path "$InstallDir\package.json")
Check "server-only .env installed" (Test-Path "$InstallDir\.env")
Check "storage root exists" (Test-Path $StorageRoot)
Check "Node syntax passes" ((& node --check "$InstallDir\server.js" 2>&1; $LASTEXITCODE) -eq 0)
$task=Get-ScheduledTask -TaskName "AngelCare Flashcards Product Vault" -ErrorAction SilentlyContinue
Check "startup task registered" ($null -ne $task)
if($task){Check "startup task enabled" ($task.State -ne 'Disabled')}
$envMap=@{}; Get-Content "$InstallDir\.env" | ForEach-Object { if($_ -match '^([^#=]+)=(.*)$'){ $envMap[$matches[1]]=$matches[2] } }
$port=4317; if($envMap.ContainsKey('FLASHCARDS_VAULT_PORT')){$port=[int]$envMap['FLASHCARDS_VAULT_PORT']}
$firewallName="AngelCare Flashcards Vault TCP $port"
Check "private/domain firewall rule exists" ($null -ne (Get-NetFirewallRule -DisplayName $firewallName -ErrorAction SilentlyContinue))
Check "vault process accepts TCP connections" (Test-NetConnection -ComputerName 127.0.0.1 -Port $port -InformationLevel Quiet)
$content=Get-Content "$InstallDir\server.js" -Raw
Check "HMAC signed request validation present" ($content -match 'createHmac' -and $content -match 'x-angelcare-signature')
Check "replay nonce protection present" ($content -match 'NONCES' -and $content -match 'Replay nonce')
Check "chunked upload endpoints present" ($content -match '/parts/' -and $content -match 'uploadedParts')
Check "SHA-256 finalisation present" ($content -match 'Final SHA-256 mismatch')
Check "range downloads present" ($content -match 'content-range' -and $content -match 'accept-ranges')
Check "path traversal protection present" ($content -match 'Path traversal blocked')
if($fail.Count){throw "$($fail.Count) Windows Vault verification check(s) failed."}
Write-Host "`nSUCCESS: Windows Product Vault UMZ3 verification passed." -ForegroundColor Cyan
