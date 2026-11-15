# Stamps version.json: when the page last changed (now) and the newest Android build.
# Called by deploy.ps1 before every deploy. The page polls this file to offer an update.
$ErrorActionPreference='Continue'
$android=0
try { $name = gh release view latest -R jayfcousins-cell/one-button-android --json name --jq .name 2>$null; if ($name -match 'build (\d+)') { $android = [int]$Matches[1] } } catch {}
$old = Join-Path $PSScriptRoot 'version.json'
if ($android -eq 0 -and (Test-Path $old)) { try { $android = (Get-Content $old -Raw | ConvertFrom-Json).android } catch {} }
$v = @{ web = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'); android = $android; apk = 'https://github.com/jayfcousins-cell/one-button-android/releases/latest/download/one-button.apk' }
($v | ConvertTo-Json -Compress) | Out-File -Encoding ascii $old
Write-Host "version.json: web $($v.web), android build $android"
