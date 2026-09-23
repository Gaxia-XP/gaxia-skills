# Start, reuse, or stop the web-companion server (PowerShell wrapper around the
# cross-platform launcher start-companion.cjs; Node on PATH is the only need).
# Usage: .\start-companion.ps1 -SessionDir "C:\path\to\.web-companion\demo" [-Port 0] [-IdleMinutes 240] [-Stop]
# Prints the server-info JSON (url, screen_dir, state_dir, pid). The server keeps
# running after this script exits. Rerun with the same SessionDir any time: a
# live server is reused, a dead one restarts on the same URL.
param(
  [Parameter(Mandatory = $true)][string]$SessionDir,
  [int]$Port = 0,
  [int]$IdleMinutes = 240,
  [switch]$Stop
)

$ErrorActionPreference = 'Stop'
$launcher = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'start-companion.cjs'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'node is required on PATH' }
$dir = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($SessionDir)
$nodeArgs = @($launcher, '--session-dir', $dir, '--port', "$Port", '--idle-minutes', "$IdleMinutes")
if ($Stop) { $nodeArgs += '--stop' }
& node @nodeArgs
if ($LASTEXITCODE -ne 0) { throw "start-companion.cjs failed (exit $LASTEXITCODE)" }
