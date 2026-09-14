# Web-companion smoke test. Boots a throwaway session and verifies the full
# loop, including the real browser path (cookie-only WebSocket, no ?key=).
# Usage: .\smoke-test.ps1   (exits non-zero on the first... no — on ANY failure)
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:fail = 0
function check($name, $cond) {
  if ($cond) { Write-Host "PASS: $name" } else { Write-Host "FAIL: $name"; $script:fail = 1 }
}
$t = Join-Path ([System.IO.Path]::GetTempPath()) ('web-companion-smoke-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
try {
  $info = & (Join-Path $scriptDir 'start-companion.ps1') -SessionDir $t
  $j = $info | ConvertFrom-Json
  $u = "http://localhost:$($j.port)"; $key = $j.url.Split('=')[1]
  check 'boot: server-info has keyed URL' ($j.url -match '\?key=[a-f0-9]+')
  $nokey = try { (Invoke-WebRequest -Uri "$u/" -UseBasicParsing).StatusCode; 0 } catch { $_.Exception.Response.StatusCode.Value__ }
  check 'gate: no key -> 403' ($nokey -eq 403)
  $bad = try { (Invoke-WebRequest -Uri "$u/?key=0" -UseBasicParsing).StatusCode; 0 } catch { $_.Exception.Response.StatusCode.Value__ }
  check 'gate: bad key -> 403' ($bad -eq 403)
  Set-Content -LiteralPath "$t\content\s1.html" -Value '<!DOCTYPE html><html><body><h2>s1</h2><button data-choice="smoke-pick" onclick="toggleSelect(this)">go</button></body></html>' -NoNewline
  Start-Sleep -Milliseconds 500
  $null = Invoke-WebRequest -Uri "$u/?key=$key" -UseBasicParsing -SessionVariable s
  $p = Invoke-WebRequest -Uri "$u/" -UseBasicParsing -WebSession $s
  check 'screen: newest served with helper' ($p.Content.Contains('s1') -and $p.Content.Contains('window.companion'))
  Start-Process -FilePath node -ArgumentList (Join-Path $scriptDir 'smoke-ws.cjs'), $key, "$($j.port)" -WindowStyle Hidden -RedirectStandardOutput "$t\ws-out.txt"
  Start-Sleep -Seconds 3
  $ev = Get-Content "$t\state\events" -ErrorAction SilentlyContinue
  check 'events: cookie-only click recorded' ($ev -match 'smoke-pick')
  check 'events: on-page answer recorded' ($ev -match 'smoke-answer')
  Set-Content -LiteralPath "$t\content\s2.html" -Value '<!DOCTYPE html><html><body><h2>s2</h2></body></html>' -NoNewline
  Start-Sleep -Seconds 8
  $out = Get-Content "$t\ws-out.txt" -ErrorAction SilentlyContinue
  Write-Host "--- ws client saw:"; $out | ForEach-Object { Write-Host "    $_" }
  check 'reload: push received' ($out -match 'MSG:.*reload')
  check 'events: wiped on new screen' (-not (Test-Path "$t\state\events"))
  $p2 = Invoke-WebRequest -Uri "$u/" -UseBasicParsing -WebSession $s
  check 'screen: newest served after push' ($p2.Content.Contains('s2'))
  Stop-Process -Id $j.pid -Force
  Start-Sleep -Seconds 1
  $info2 = & (Join-Path $scriptDir 'start-companion.ps1') -SessionDir $t
  check 'restart: same URL reused' (($info2 | ConvertFrom-Json).url -eq $j.url)
  Stop-Process -Id (($info2 | ConvertFrom-Json).pid) -Force
} finally {
  Start-Sleep -Seconds 1
  Remove-Item -LiteralPath $t -Recurse -Force -ErrorAction SilentlyContinue
}
exit $script:fail
