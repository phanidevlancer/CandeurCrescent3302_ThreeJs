// Headless viewer check (real GPU via Chrome DevTools protocol; Node ≥ 22, no npm deps). Server must run on :8000.
//   node tools/headless.mjs --eval '<JS expression, may return a promise>'            → prints the (JSON) result
//   node tools/headless.mjs --setup '<JS run first>' --shots shots.json --out <dir>   → one JPEG per shot
// shots.json = [{ "name": "east", "view": {x,z,yaw,pitch,eye}, "fov": 72, "light": "day"|"evening" }, …]
//   yaw 0 = facing −z (north), π/2 = west (−x), π = south, −π/2 = east; pitch −1.5 = straight down (plan check).
// Options: --url (default http://localhost:8000/?tour=1), --w/--h (1920×1080), --retries (3: the viewer sometimes never
// reports __ready headless — a retry fixes it). Inside --eval strings NEVER write `\/` in regex literals (use strings / startsWith).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const W = +arg('w', 1920), H = +arg('h', 1080), URL = arg('url', 'http://localhost:8000/?tour=1');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function openChrome() {
  const port = 9300 + Math.floor(Math.random() * 400), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'viewer-chrome-'));
  const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`, '--hide-scrollbars',
    '--force-device-scale-factor=1', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
  let list; for (let i = 0; i < 100 && !list; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(200); } }
  if (!list) throw new Error('Chrome did not start');
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') console.error('page exception:', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(m.error.message)) : p.r(m.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pend.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const close = async () => { try { await Promise.race([send('Browser.close'), sleep(2000)]); } catch { } try { ws.close(); } catch { } ch.kill('SIGKILL'); await sleep(300); fs.rmSync(prof, { recursive: true, force: true }); };
  return { send, ev, close };
}

async function run() {
  const C = await openChrome();
  try {
    await C.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    await C.send('Runtime.enable'); await C.send('Page.navigate', { url: URL });
    for (let i = 0; ; i++) { if (await C.ev('!!(window.__ready && window.__tour)').catch(() => false)) break; if (i > 400) throw new Error('viewer not ready'); await sleep(300); }
    await sleep(1000);
    const setup = arg('setup'); if (setup) { const r = await C.ev(setup); if (r !== undefined) console.log(typeof r === 'string' ? r : JSON.stringify(r)); }
    const e = arg('eval'); if (e) { const r = await C.ev(e); console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1)); }
    const shots = arg('shots'); if (shots) {
      const out = arg('out', 'shots'); fs.mkdirSync(out, { recursive: true });
      for (const s of JSON.parse(fs.readFileSync(shots, 'utf8'))) {
        await C.ev(`(async()=>{const T=__tour;T.caption('','',0);T.fade(0);T.light('${s.light || 'day'}');{const f=document.getElementById('sFov');f.value=${s.fov || 72};f.dispatchEvent(new Event('input'));}T.view(${JSON.stringify(s.view)});await T.render(0);await T.render(0);return T.render(0)})()`);
        await sleep(300); const shot = await C.send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
        const f = path.join(out, s.name + '.jpg'); fs.writeFileSync(f, Buffer.from(shot.data, 'base64')); console.log('wrote', f);
      }
    }
  } finally { await C.close(); }
}
const tries = +arg('retries', 3);
for (let t = 1; ; t++) { try { await run(); break; } catch (err) { if (t >= tries || !/not ready/.test(err.message)) { console.error(err.message); process.exit(1); } console.error('retry', t); } }
