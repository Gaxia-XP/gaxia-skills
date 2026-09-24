// Web-companion server — Node stdlib only (no npm install).
// One URL serves the newest .html screen in <session>/content; /theme/<file>
// serves the vendored offline theme (../theme) so screens can <link> it.
// Browser clicks carrying a `choice` field are appended to <session>/state/events.
// Env: COMPANION_DIR, COMPANION_HOST, COMPANION_URL_HOST, COMPANION_PORT,
//      COMPANION_PORT_FILE, COMPANION_IDLE_TIMEOUT_MS
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const SESSION_DIR = process.env.COMPANION_DIR || path.join(process.cwd(), 'companion-session');
const CONTENT_DIR = path.join(SESSION_DIR, 'content');
const STATE_DIR = path.join(SESSION_DIR, 'state');
const HOST = process.env.COMPANION_HOST || '127.0.0.1';
const URL_HOST = process.env.COMPANION_URL_HOST || (HOST === '127.0.0.1' ? 'localhost' : HOST);
const PORT_FILE = process.env.COMPANION_PORT_FILE || null;
const IDLE_MS = (() => {
  const n = Number(process.env.COMPANION_IDLE_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : 4 * 60 * 60 * 1000;
})();
// Reuse the session token across restarts so an open tab's cookie stays valid.
const TOKEN = (() => {
  const tf = process.env.COMPANION_TOKEN_FILE;
  if (tf) {
    try {
      const t = fs.readFileSync(tf, 'utf-8').trim();
      if (/^[a-f0-9]{16,128}$/.test(t)) return t;
    } catch (e) { /* no prior token */ }
  }
  return crypto.randomBytes(24).toString('hex');
})();
const HELPER = fs.readFileSync(path.join(__dirname, 'companion-helper.js'), 'utf-8');
const THEME_DIR = path.join(__dirname, '..', 'theme');
const THEME_FILES = (() => {
  try { return new Set(fs.readdirSync(THEME_DIR).filter(f => /\.(css|js)$/.test(f))); }
  catch (e) { return new Set(); }
})();
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};
const mimeOf = f => MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';
const INJECT = '<script>\n' + HELPER + '\n</script>';

function preferredPort() {
  if (process.env.COMPANION_PORT) return Number(process.env.COMPANION_PORT);
  if (PORT_FILE) {
    try {
      const p = Number(fs.readFileSync(PORT_FILE, 'utf-8').trim());
      if (Number.isInteger(p) && p > 1023 && p < 65536) return p;
    } catch (e) { /* no prior port */ }
  }
  return 0; // first boot: the OS picks a free port it will actually let us bind
}
let PORT = preferredPort();
let COOKIE = 'companion-key-' + PORT;
let lastActivity = Date.now();
const touch = () => { lastActivity = Date.now(); };

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function parseCookies(h) {
  const out = {};
  for (const part of String(h || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}
function keyOf(req, url) {
  if (url.searchParams.get('key')) return url.searchParams.get('key');
  const c = parseCookies(req.headers.cookie)[COOKIE];
  return c ? decodeURIComponent(c) : null;
}
function authorized(req, url) { return safeEqual(keyOf(req, url) || '', TOKEN); }
function headers(extra) {
  return Object.assign({
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "frame-ancestors 'none'",
    'Cache-Control': 'no-store',
  }, extra || {});
}
function insideContent(fp) {
  try {
    const st = fs.lstatSync(fp);
    if (st.isSymbolicLink() || !st.isFile() || st.nlink !== 1) return false;
    return fs.realpathSync(fp).startsWith(fs.realpathSync(CONTENT_DIR) + path.sep);
  } catch (e) { return false; }
}
function newestScreen() {
  let files = [];
  try {
    files = fs.readdirSync(CONTENT_DIR)
      .filter(f => !f.startsWith('.') && f.endsWith('.html'))
      .map(f => path.join(CONTENT_DIR, f))
      .filter(insideContent)
      .map(fp => ({ fp, mtime: fs.statSync(fp).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
  } catch (e) { /* empty */ }
  return files.length ? files[0].fp : null;
}
function withHelper(html) {
  return html.includes('</body>')
    ? html.replace('</body>', INJECT + '\n</body>')
    : html + INJECT;
}
const WAITING = '<!DOCTYPE html><html><body style="font-family:system-ui;display:flex;min-height:90vh;align-items:center;justify-content:center"><p>Waiting for the first screen…</p></body></html>';

// ---- WebSocket (minimal RFC 6455, text frames incl. continuation) ----
const MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const clients = new Set();
function wsAccept(k) {
  return crypto.createHash('sha1').update(k + MAGIC).digest('base64');
}
function wsSend(sock, text) {
  const p = Buffer.from(text);
  const h = p.length < 126 ? [0x81, p.length] : [0x81, 126, p.length >> 8, p.length & 255];
  try { sock.write(Buffer.concat([Buffer.from(h), p])); }
  catch (e) { clients.delete(sock); }
}
function broadcast(obj) {
  const s = JSON.stringify(obj);
  for (const sock of clients) wsSend(sock, s);
}
function handleSocket(sock) {
  clients.add(sock);
  let buf = Buffer.alloc(0), textAcc = '';
  sock.on('data', chunk => {
    touch();
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      if (buf.length < 2) return;
      const fin = (buf[0] & 0x80) !== 0, op = buf[0] & 0x0f;
      if ((buf[1] & 0x80) === 0) { sock.destroy(); return; } // clients must mask
      let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { sock.destroy(); return; } // too big for events
      if (buf.length < off + 4 + len) return;
      const mask = buf.slice(off, off + 4);
      const data = Buffer.alloc(len);
      for (let i = 0; i < len; i++) data[i] = buf[off + 4 + i] ^ mask[i % 4];
      buf = buf.slice(off + 4 + len);
      if (op === 0x8) { sock.destroy(); return; }
      if (op === 0x9) { // ping -> unmasked pong (server frames must not be masked)
        sock.write(Buffer.concat([Buffer.from([0x8A, data.length]), data]));
        continue;
      }
      if (op === 0x1 || op === 0x0) {
        textAcc += data.toString('utf-8');
        if (!fin) continue;
        const msg = textAcc; textAcc = '';
        let ev; try { ev = JSON.parse(msg); } catch (e) { continue; }
        console.log(JSON.stringify(Object.assign({ source: 'user-event' }, ev)));
        if (ev && ev.choice) {
          fs.appendFileSync(path.join(STATE_DIR, 'events'), JSON.stringify(ev) + '\n');
        }
      }
    }
  });
  sock.on('error', () => clients.delete(sock));
  sock.on('close', () => clients.delete(sock));
}

// ---- HTTP ----
const server = http.createServer((req, res) => {
  touch();
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET' && url.pathname === '/' && url.searchParams.has('key')) {
    if (!safeEqual(url.searchParams.get('key') || '', TOKEN)) {
      res.writeHead(403, headers({ 'Content-Type': 'text/plain' }));
      res.end('Forbidden: bad key');
      return;
    }
    res.writeHead(302, headers({
      'Set-Cookie': COOKIE + '=' + encodeURIComponent(TOKEN) + '; Path=/; SameSite=Lax',
      'Location': '/',
    }));
    res.end();
    return;
  }
  if (!authorized(req, url)) {
    res.writeHead(403, headers({ 'Content-Type': 'text/plain' }));
    res.end('Forbidden');
    return;
  }
  if (req.method === 'GET' && url.pathname === '/') {
    const f = newestScreen();
    const html = f ? withHelper(fs.readFileSync(f, 'utf-8')) : withHelper(WAITING);
    res.writeHead(200, headers({ 'Content-Type': 'text/html; charset=utf-8' }));
    res.end(html);
    return;
  }
  if (req.method === 'GET' && url.pathname.startsWith('/files/')) {
    let name; try { name = decodeURIComponent(url.pathname.slice(7)); } catch (e) { name = ''; }
    const fp = path.join(CONTENT_DIR, path.basename(name));
    if (!insideContent(fp)) {
      res.writeHead(404, headers()); res.end('Not found'); return;
    }
    res.writeHead(200, headers({ 'Content-Type': mimeOf(fp) }));
    res.end(fs.readFileSync(fp));
    return;
  }
  if (req.method === 'GET' && url.pathname.startsWith('/theme/')) {
    const name = url.pathname.slice(7);
    if (!THEME_FILES.has(name)) { res.writeHead(404, headers()); res.end('Not found'); return; }
    res.writeHead(200, headers({ 'Content-Type': mimeOf(name), 'Cache-Control': 'private, max-age=86400' }));
    res.end(fs.readFileSync(path.join(THEME_DIR, name)));
    return;
  }
  res.writeHead(404, headers()); res.end('Not found');
});

server.on('upgrade', (req, sock) => {
  touch();
  const url = new URL(req.url, 'http://x');
  if (!authorized(req, url) || !req.headers['sec-websocket-key']) { sock.destroy(); return; }
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + wsAccept(req.headers['sec-websocket-key']) + '\r\n\r\n');
  handleSocket(sock);
});

// New/changed screen -> wipe events, tell tabs to reload.
fs.mkdirSync(CONTENT_DIR, { recursive: true });
fs.mkdirSync(STATE_DIR, { recursive: true });
try {
  fs.watch(CONTENT_DIR, (eventType, filename) => {
    try {
      if (!filename || !filename.endsWith('.html')) return;
      touch();
      try { fs.unlinkSync(path.join(STATE_DIR, 'events')); } catch (e) { /* none yet */ }
      broadcast({ type: 'reload' });
    } catch (e) { console.error('watch handler:', e.message); }
  }).on('error', e => console.error('watch error:', e.message));
} catch (e) { console.error('watch unavailable:', e.message); }

// The state files belong to whichever server wrote server-info last. A stale
// second server (same SessionDir) must not mark the live one as stopped.
function ownsState() {
  try {
    return JSON.parse(fs.readFileSync(path.join(STATE_DIR, 'server-info'), 'utf-8')).pid === process.pid;
  } catch (e) { return true; }
}
let stopping = false;
function shutdown(reason) {
  if (stopping) return;
  stopping = true;
  console.log(JSON.stringify({ type: 'server-stopped', reason }));
  if (ownsState()) {
    try { fs.unlinkSync(path.join(STATE_DIR, 'server-info')); } catch (e) {}
    fs.writeFileSync(path.join(STATE_DIR, 'server-stopped'),
      JSON.stringify({ reason, pid: process.pid, timestamp: Date.now() }) + '\n');
  }
  for (const s of clients) { try { s.destroy(); } catch (e) {} }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}
setInterval(() => {
  if (Date.now() - lastActivity > IDLE_MS) shutdown('idle timeout');
}, 60 * 1000).unref();
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  try { process.on(sig, () => shutdown(sig)); } catch (e) { /* unsupported here */ }
}

let fellBack = false;
server.on('error', e => {
  // EACCES: Windows reserves TCP port blocks (Hyper-V, WinNAT) that fail
  // with EACCES rather than EADDRINUSE.
  if ((e.code === 'EADDRINUSE' || e.code === 'EACCES') && !fellBack) {
    fellBack = true;
    server.listen(0, HOST);
  } else { console.error('listen failed:', e.message); process.exit(1); }
});
server.on('listening', () => {
  PORT = server.address().port;
  COOKIE = 'companion-key-' + PORT;
  if (PORT_FILE && !fellBack) {
    try { fs.writeFileSync(PORT_FILE, String(PORT)); } catch (e) { /* best effort */ }
  }
  if (process.env.COMPANION_TOKEN_FILE) {
    try { fs.writeFileSync(process.env.COMPANION_TOKEN_FILE, TOKEN); } catch (e) { /* best effort */ }
  }
  const info = JSON.stringify({
    type: 'server-started', port: PORT, host: HOST,
    url_host: URL_HOST, url: 'http://' + URL_HOST + ':' + PORT + '/?key=' + TOKEN,
    screen_dir: CONTENT_DIR, state_dir: STATE_DIR, idle_timeout_ms: IDLE_MS,
    pid: process.pid,
  });
  console.log(info);
  try { fs.unlinkSync(path.join(STATE_DIR, 'server-stopped')); } catch (e) { /* none */ }
  fs.writeFileSync(path.join(STATE_DIR, 'server-info'), info + '\n');
});
server.listen(PORT, HOST);
