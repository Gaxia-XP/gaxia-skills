# Start the web-companion server (Windows-first, no bash needed).
# Usage: .\start-companion.ps1 -SessionDir "C:\path\to\.web-companion\demo" [-Port 0] [-IdleMinutes 240]
# Prints the server-info JSON (url, screen_dir, state_dir). The server keeps
# running after this script exits. Rerun with the same SessionDir to resume.
param(
  [Parameter(Mandatory = $true)][string]$SessionDir,
  [int]$Port = 0,
  [int]$IdleMinutes = 240
)

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverJs = Join-Path $scriptDir 'companion-server.cjs'
if (-not (Test-Path -LiteralPath $serverJs)) { throw "server not found: $serverJs" }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'node is required on PATH' }

New-Item -ItemType Directory -Force -Path (Join-Path $SessionDir 'content'), (Join-Path $SessionDir 'state') | Out-Null
# A force-killed server leaves stale state behind; clear it so the poll below
# waits for THIS run's info (fresh key/pid) instead of reading the old one.
Remove-Item -LiteralPath (Join-Path $SessionDir 'state\server-stopped') -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $SessionDir 'state\server-info') -ErrorAction SilentlyContinue

$env:COMPANION_DIR = $SessionDir
$env:COMPANION_HOST = '127.0.0.1'
$env:COMPANION_URL_HOST = 'localhost'
$env:COMPANION_PORT_FILE = Join-Path $SessionDir '.last-port'
$env:COMPANION_TOKEN_FILE = Join-Path $SessionDir '.last-token'
if ($Port -gt 0) { $env:COMPANION_PORT = "$Port" } else { Remove-Item Env:\COMPANION_PORT -ErrorAction SilentlyContinue }
$env:COMPANION_IDLE_TIMEOUT_MS = "$($IdleMinutes * 60 * 1000)"

$log = Join-Path $SessionDir 'state\server.log'
$proc = Start-Process -FilePath node -ArgumentList "`"$serverJs`"" -WindowStyle Hidden `
  -RedirectStandardOutput $log -RedirectStandardError ($log + '.err') -PassThru

$info = Join-Path $SessionDir 'state\server-info'
for ($i = 0; $i -lt 50 -and -not (Test-Path -LiteralPath $info); $i++) { Start-Sleep -Milliseconds 100 }
if (-not (Test-Path -LiteralPath $info)) {
  if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  throw "server did not start; see $log"
}
Get-Content -LiteralPath $info
