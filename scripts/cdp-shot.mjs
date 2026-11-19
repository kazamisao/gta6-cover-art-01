// CDP screenshot helper: node scripts/cdp-shot.mjs <url> <w> <h> <out.jpg> [quality]
// Launches nothing; expects Chrome already running with --remote-debugging-port=9222.
const [url, w, h, out, quality = '85'] = process.argv.slice(2);
const port = 9222;

async function getTarget() {
  // Create a blank tab first: navigating from /json/new's URL makes Chrome
  // treat 127.0.0.1 as a local-network target of a public initiator and
  // block it (ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS). Navigating the
  // blank tab via CDP has no public initiator.
  const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  return res.json();
}

const target = await getTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};
await new Promise((r) => { ws.onopen = r; });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: Number(w), height: Number(h), deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
// Wait for the app to signal readiness (window.__shotReady), polling via Runtime.evaluate.
let ready = false;
for (let i = 0; i < 40 && !ready; i++) {
  await new Promise((r) => setTimeout(r, 500));
  const r = await send('Runtime.evaluate', { expression: 'window.__shotReady === true', returnByValue: true });
  ready = r?.result?.value === true;
}
console.log('ready:', ready);
const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: Number(quality) });
const { writeFileSync } = await import('node:fs');
writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('wrote', out);
process.exit(0);
