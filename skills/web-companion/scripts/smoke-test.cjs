// Web-companion smoke test (Node only, any OS). Boots a throwaway session via
// the launcher and verifies the full loop, including the real browser path
// (cookie-only WebSocket, no ?key=). Exits non-zero on ANY failed check.
// Usage: node smoke-test.cjs
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const vm = require('vm');

const LAUNCHER = path.join(__dirname, 'start-companion.cjs');
const HELPER = fs.readFileSync(path.join(__dirname, 'companion-helper.js'), 'utf-8');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let failed = 0;
function check(name, cond) {
  console.log((cond ? 'PASS: ' : 'FAIL: ') + name);
  if (!cond) failed = 1;
}
function launch(dir, ...extra) {
  const out = execFileSync(process.execPath, [LAUNCHER, '--session-dir', dir, ...extra], { encoding: 'utf-8' });
  return JSON.parse(out.trim().split('\n').pop());
}
function get(port, p, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: p, headers: cookie ? { Cookie: cookie } : {} }, res => {
      let body = '';
      res.setEncoding('utf-8');
      res.on('data', c => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
  });
}
function pidAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

// Minimal WebSocket client: upgrade with the given cookie/query, send masked
// text frames, collect small server frames.
function wsClient(port, { cookie, query = '' }) {
  return new Promise(resolve => {
    const c = { upgraded: false, msgs: [], closed: false };
    const sock = net.connect(port, '127.0.0.1', () => {
      sock.write('GET /' + query + ' HTTP/1.1\r\nHost: 127.0.0.1\r\nUpgrade: websocket\r\n' +
        'Connection: Upgrade\r\nSec-WebSocket-Key: ' + crypto.randomBytes(16).toString('base64') + '\r\n' +
        'Sec-WebSocket-Version: 13\r\n' + (cookie ? 'Cookie: ' + cookie + '\r\n' : '') + '\r\n');
    });
    let buf = Buffer.alloc(0);
    c.send = obj => {
      const p = Buffer.from(JSON.stringify(obj));
      const mask = crypto.randomBytes(4);
      const head = p.length < 126 ? Buffer.from([0x81, 0x80 | p.length])
        : Buffer.from([0x81, 0x80 | 126, p.length >> 8, p.length & 255]);
      const body = Buffer.alloc(p.length);
      for (let i = 0; i < p.length; i++) body[i] = p[i] ^ mask[i % 4];
      sock.write(Buffer.concat([head, mask, body]));
    };
    c.close = () => sock.destroy();
    sock.on('data', chunk => {
      buf = Buffer.concat([buf, chunk]);
      if (!c.upgraded) {
        const i = buf.indexOf('\r\n\r\n');
        if (i < 0) return;
        c.upgraded = buf.slice(0, i).toString().startsWith('HTTP/1.1 101');
        buf = buf.slice(i + 4);
        resolve(c);
      }
      while (buf.length >= 2 && buf.length >= 2 + (buf[1] & 0x7f)) {
        const len = buf[1] & 0x7f;
        c.msgs.push(buf.slice(2, 2 + len).toString());
        buf = buf.slice(2 + len);
      }
    });
    sock.on('error', () => { c.closed = true; resolve(c); });
    sock.on('close', () => { c.closed = true; resolve(c); });
  });
}

// Run the injected helper against a stub page and return the key it would
// open its WebSocket with.
function helperKey(cookie, port) {
  let opened = null;
  function WebSocket(u) { opened = u; this.send = () => {}; }
  WebSocket.OPEN = 1;
  const ctx = {
    window: { location: { port: String(port), protocol: 'http:', host: 'localhost:' + port, search: '' } },
    document: { cookie, addEventListener() {} },
    WebSocket, setTimeout, clearTimeout,
  };
  vm.createContext(ctx);
  vm.runInContext(HELPER, ctx);
  return opened && new URL(opened).searchParams.get('key');
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-companion-smoke-'));
  const pids = [];
  try {
    const j = launch(dir);
    pids.push(j.pid);
    const key = new URL(j.url).searchParams.get('key');
    const cookie = 'companion-key-' + j.port + '=' + key;
    check('boot: server-info has keyed URL', /\?key=[a-f0-9]+$/.test(j.url));
    check('gate: no key -> 403', (await get(j.port, '/')).status === 403);
    check('gate: bad key -> 403', (await get(j.port, '/?key=0')).status === 403);
    const boot = await get(j.port, '/?key=' + key);
    check('gate: good key -> cookie + redirect', boot.status === 302 &&
      String(boot.headers['set-cookie']).startsWith('companion-key-' + j.port + '='));

    if (process.platform === 'win32') {
      // Windows reserves TCP port blocks (Hyper-V, WinNAT) where listen fails
      // with EACCES, not EADDRINUSE; the server must fall back, not exit.
      const out = execFileSync('netsh', ['int', 'ipv4', 'show', 'excludedportrange', 'protocol=tcp'], { encoding: 'utf-8' });
      const reserved = (out.match(/^\s*\d+\s+\d+/gm) || []).map(l => Number(l.trim().split(/\s+/)[0])).find(p => p > 1023);
      if (reserved) {
        const rdir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-companion-smoke-'));
        let r = null;
        try { r = launch(rdir, '--port', String(reserved)); pids.push(r.pid); } catch (e) { /* checked below */ }
        check('boot: reserved port ' + reserved + ' (EACCES) falls back instead of exiting', !!r && r.port !== reserved);
        if (r) execFileSync(process.execPath, [LAUNCHER, '--session-dir', rdir, '--stop']);
        fs.rmSync(rdir, { recursive: true, force: true, maxRetries: 5 });
      } else console.log('SKIP: no reserved TCP port range to test the EACCES fallback');
    }

    const again = launch(dir);
    check('launcher: live server reused, not duplicated', again.reused === true && again.pid === j.pid && again.url === j.url);

    fs.writeFileSync(path.join(dir, 'content', 's1.html'),
      '<!DOCTYPE html><html><body><h2>s1</h2><button data-choice="smoke-pick" onclick="toggleSelect(this)">go</button></body></html>');
    await sleep(500);
    const p1 = await get(j.port, '/', cookie);
    check('screen: newest served with helper', p1.body.includes('s1') && p1.body.includes('window.companion'));

    const css = await get(j.port, '/theme/bootstrap.min.css', cookie);
    check('theme: vendored CSS served offline', css.status === 200 && css.headers['content-type'].startsWith('text/css') && css.body.includes('Bootstrap'));
    check('theme: gated without key', (await get(j.port, '/theme/bootstrap.min.css')).status === 403);
    check('theme: unknown file -> 404', (await get(j.port, '/theme/THIRD_PARTY_NOTICES.md', cookie)).status === 404);

    fs.writeFileSync(path.join(dir, 'content', 'my pic.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const img = await get(j.port, '/files/my%20pic.png', cookie);
    check('files: encoded name served with image mime', img.status === 200 && img.headers['content-type'] === 'image/png');

    const bad = await wsClient(j.port, { cookie, query: '?key=' + 'ab'.repeat(24) });
    check('ws: wrong key rejected', !bad.upgraded);
    bad.close();

    const ws = await wsClient(j.port, { cookie });
    check('ws: cookie-only upgrade accepted', ws.upgraded);
    ws.send({ type: 'click', choice: 'smoke-pick', text: 't' });
    ws.send({ type: 'answer', choice: 'smoke-answer', answers: { q1: 'B', essay: 'x'.repeat(300) } });
    await sleep(500);
    const ev = fs.readFileSync(path.join(dir, 'state', 'events'), 'utf-8');
    check('events: click recorded', ev.includes('smoke-pick'));
    check('events: on-page answer recorded (16-bit frame)', ev.includes('smoke-answer') && ev.includes('x'.repeat(300)));

    fs.writeFileSync(path.join(dir, 'content', 's2.html'), '<!DOCTYPE html><html><body><h2>s2</h2></body></html>');
    for (let i = 0; i < 40 && !ws.msgs.some(m => m.includes('reload')); i++) await sleep(100);
    check('reload: push received', ws.msgs.some(m => m.includes('reload')));
    check('events: wiped on new screen', !fs.existsSync(path.join(dir, 'state', 'events')));
    check('screen: newest served after push', (await get(j.port, '/', cookie)).body.includes('s2'));
    ws.close();

    const other = 'companion-key-' + (j.port + 1) + '=' + 'cd'.repeat(24);
    check('helper: picks this port\'s key when another session\'s cookie comes first',
      helperKey(other + '; ' + cookie, j.port) === key);

    process.kill(j.pid, 'SIGKILL');
    for (let i = 0; i < 30 && pidAlive(j.pid); i++) await sleep(100);
    const j2 = launch(dir);
    pids.push(j2.pid);
    check('restart after hard kill: same URL, new pid', j2.url === j.url && j2.pid !== j.pid && !j2.reused);

    if (process.platform !== 'win32') {
      // A stale server must not mark a newer live one as stopped.
      const info = path.join(dir, 'state', 'server-info');
      const real = fs.readFileSync(info, 'utf-8');
      fs.writeFileSync(info, JSON.stringify(Object.assign(JSON.parse(real), { pid: 1 })) + '\n');
      process.kill(j2.pid, 'SIGTERM');
      for (let i = 0; i < 30 && pidAlive(j2.pid); i++) await sleep(100);
      check('stale server leaves newer state alone', fs.existsSync(info) && !fs.existsSync(path.join(dir, 'state', 'server-stopped')));
      fs.writeFileSync(info, real);
      const j3 = launch(dir);
      pids.push(j3.pid);
      process.kill(j3.pid, 'SIGTERM');
      for (let i = 0; i < 30 && pidAlive(j3.pid); i++) await sleep(100);
      check('SIGTERM: server marks its own state stopped', !fs.existsSync(info) && fs.existsSync(path.join(dir, 'state', 'server-stopped')));
      const j4 = launch(dir);
      pids.push(j4.pid);
    }

    const stopped = JSON.parse(execFileSync(process.execPath, [LAUNCHER, '--session-dir', dir, '--stop'], { encoding: 'utf-8' }).trim());
    const last = pids[pids.length - 1];
    for (let i = 0; i < 30 && pidAlive(last); i++) await sleep(100);
    check('stop: process gone, state says stopped', stopped.type === 'server-stopped' && !pidAlive(last) &&
      fs.existsSync(path.join(dir, 'state', 'server-stopped')) && !fs.existsSync(path.join(dir, 'state', 'server-info')));
  } catch (e) {
    console.log('FAIL: ' + e.message);
    failed = 1;
  } finally {
    for (const pid of pids) { try { process.kill(pid, 'SIGKILL'); } catch (e) { /* gone */ } }
    await sleep(300);
    fs.rmSync(dir, { recursive: true, force: true });
  }
  process.exit(failed);
})();
