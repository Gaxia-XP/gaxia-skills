// Start, reuse, or stop the web-companion server for one session (Node only,
// any OS). Prints the server-info JSON line: url (with ?key=), port, pid,
// screen_dir, state_dir, and `reused` when a live server was kept.
// Usage: node start-companion.cjs --session-dir <dir> [--port N] [--idle-minutes 240] [--stop]
// Idempotent: rerun it whenever unsure whether the server is up. A live server
// is reused; a dead or killed one is restarted on the same port with the same
// key, so an open tab reconnects by itself.
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > 1 && i + 1 < process.argv.length ? process.argv[i + 1] : def;
}
if (!arg('session-dir')) {
  console.error('usage: node start-companion.cjs --session-dir <dir> [--port N] [--idle-minutes M] [--stop]');
  process.exit(2);
}
const SESSION = path.resolve(arg('session-dir'));
const STATE = path.join(SESSION, 'state');
const INFO = path.join(STATE, 'server-info');
const STOPPED = path.join(STATE, 'server-stopped');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function readInfo() {
  try { return JSON.parse(fs.readFileSync(INFO, 'utf-8')); } catch (e) { return null; }
}
function pidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}
// Alive = the recorded PID exists AND answers as this session's server
// (the keyed URL redirects to set its cookie), so a recycled PID never counts.
function alive(info) {
  if (!info || !info.pid || !info.url || !pidAlive(info.pid)) return Promise.resolve(false);
  const key = new URL(info.url).searchParams.get('key') || '';
  return new Promise(resolve => {
    const req = http.get({ host: info.host || '127.0.0.1', port: info.port,
      path: '/?key=' + encodeURIComponent(key), timeout: 2000 }, res => {
      res.resume();
      resolve(res.statusCode === 302);
    });
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
  });
}

async function stop() {
  const info = readInfo();
  if (info && await alive(info)) {
    try { process.kill(info.pid, 'SIGTERM'); } catch (e) { /* already gone */ }
    for (let i = 0; i < 30 && pidAlive(info.pid); i++) await sleep(100);
    if (pidAlive(info.pid)) { try { process.kill(info.pid, 'SIGKILL'); } catch (e) {} }
  }
  // On Windows SIGTERM is a hard kill, so the server may not have cleaned up.
  try { fs.unlinkSync(INFO); } catch (e) { /* none */ }
  if (!fs.existsSync(STOPPED)) {
    fs.mkdirSync(STATE, { recursive: true });
    fs.writeFileSync(STOPPED, JSON.stringify({ reason: 'stopped by launcher', timestamp: Date.now() }) + '\n');
  }
  console.log(JSON.stringify({ type: 'server-stopped', session_dir: SESSION }));
}

async function start() {
  fs.mkdirSync(path.join(SESSION, 'content'), { recursive: true });
  fs.mkdirSync(STATE, { recursive: true });
  const current = readInfo();
  if (await alive(current)) {
    console.log(JSON.stringify(Object.assign({}, current, { reused: true })));
    return;
  }
  // A killed or crashed server leaves stale state behind; clear it so the
  // poll below waits for THIS run's info (fresh pid) instead of the old one.
  for (const f of [INFO, STOPPED]) { try { fs.unlinkSync(f); } catch (e) { /* none */ } }

  const env = Object.assign({}, process.env, {
    COMPANION_DIR: SESSION,
    COMPANION_HOST: '127.0.0.1',
    COMPANION_URL_HOST: 'localhost',
    COMPANION_PORT_FILE: path.join(SESSION, '.last-port'),
    COMPANION_TOKEN_FILE: path.join(SESSION, '.last-token'),
    COMPANION_IDLE_TIMEOUT_MS: String(Math.max(1, Number(arg('idle-minutes', 240)) || 240) * 60 * 1000),
  });
  const port = Number(arg('port', 0));
  if (port > 0) env.COMPANION_PORT = String(port); else delete env.COMPANION_PORT;

  const log = path.join(STATE, 'server.log');
  const child = spawn(process.execPath, [path.join(__dirname, 'companion-server.cjs')], {
    env, detached: true, windowsHide: true,
    stdio: ['ignore', fs.openSync(log, 'w'), fs.openSync(log + '.err', 'w')],
  });
  child.unref();
  for (let i = 0; i < 50; i++) {
    const info = readInfo();
    if (info && info.pid === child.pid) { console.log(JSON.stringify(info)); return; }
    if (child.exitCode !== null) break;
    await sleep(100);
  }
  try { process.kill(child.pid); } catch (e) { /* already exited */ }
  let reason = '';
  try { reason = fs.readFileSync(log + '.err', 'utf-8').trim(); } catch (e) { /* no log */ }
  console.error('server did not start' + (reason ? ': ' + reason : '') + '; see ' + log + '.err');
  process.exitCode = 1;
}

(process.argv.includes('--stop') ? stop() : start()).catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});
