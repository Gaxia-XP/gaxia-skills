// Smoke-test WS client: upgrades with COOKIE ONLY (no ?key=, like a real
// browser tab after the bootstrap redirect), sends one choice click, then
// waits up to 15s for the reload push the orchestrator triggers.
const crypto = require('crypto');
const net = require('net');
const KEY = process.argv[2];
const PORT = Number(process.argv[3]);
const wsKey = crypto.randomBytes(16).toString('base64');
const sock = net.connect(PORT, '127.0.0.1', () => {
  sock.write(
    'GET / HTTP/1.1\r\nHost: 127.0.0.1\r\nUpgrade: websocket\r\n' +
    'Connection: Upgrade\r\nSec-WebSocket-Key: ' + wsKey + '\r\n' +
    'Sec-WebSocket-Version: 13\r\n' +
    'Cookie: companion-key-' + PORT + '=' + KEY + '\r\n\r\n'
  );
});
let buf = Buffer.alloc(0), upgraded = false, gotReload = false;
function send(obj) {
  const p = Buffer.from(JSON.stringify(obj));
  const mask = crypto.randomBytes(4);
  const head = Buffer.from([0x81, 0x80 | p.length]);
  const body = Buffer.alloc(p.length);
  for (let i = 0; i < p.length; i++) body[i] = p[i] ^ mask[i % 4];
  sock.write(Buffer.concat([head, mask, body]));
}
sock.on('data', chunk => {
  buf = Buffer.concat([buf, chunk]);
  if (!upgraded) {
    const i = buf.indexOf('\r\n\r\n');
    if (i < 0) return;
    if (!buf.slice(0, i).toString().includes('101')) { console.log('UPGRADE-FAILED'); process.exit(1); }
    buf = buf.slice(i + 4);
    upgraded = true;
    console.log('UPGRADED');
    send({ type: 'click', choice: 'smoke-pick', text: 't' });
    send({ type: 'answer', choice: 'smoke-answer', answers: { q1: 'B' } });
  }
  while (buf.length >= 2) {
    const len = buf[1] & 0x7f;
    if (buf.length < 2 + len) return;
    const msg = buf.slice(2, 2 + len).toString();
    buf = buf.slice(2 + len);
    console.log('MSG:' + msg);
    if (msg.includes('reload')) gotReload = true;
  }
});
sock.on('error', e => { console.log('ERR:' + e.message); process.exit(1); });
setTimeout(() => { console.log(gotReload ? 'RELOAD-OK' : 'RELOAD-MISSING'); process.exit(0); }, 15000);
