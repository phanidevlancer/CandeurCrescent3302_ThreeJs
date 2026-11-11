#!/usr/bin/env node
// Records the walkthrough tour video (tour/home_tour.mp4) from the three.js viewer, frame by frame.
//
//   node tools/record_tour.mjs [--frames DIR] [--out tour/home_tour.mp4] [--w 1920 --h 1080 --fps 30]
//                              [--stills 12.5,40,...]   render only these times (s) as JPEGs into --frames (for checking)
//                              [--from N --to M]        render only frames N..M (resume) ; [--no-encode] [--keep]
//                              [--swiftshader]          software GL instead of the Mac GPU (very slow)
//                              [--style youtube]        the long YouTube-style tour (tools/tour_youtube.mjs): title card, lower thirds,
//                                                       detail inserts, cross-dissolves, evening segment, credits, music, chapters.txt,
//                                                       thumbnail + 720p copy → tour/home_tour_youtube.mp4 (default style: classic)
//
// Needs: the viewer served on http://localhost:8000 (python3 tools/serve.py 8000), Google Chrome, ffmpeg.
// No npm packages: talks to headless Chrome over the DevTools protocol with Node's built-in WebSocket (Node >= 22).
// The page is opened with ?tour=1, which exposes window.__tour (app.js setupTour) and stops the normal render loop;
// every frame is posed + rendered deterministically, then grabbed with Page.captureScreenshot (caption overlay included).
// Walking paths are planned with A* on the viewer's own obstacle map (walls grid + furniture footprints + door leaves).
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HERE = path.dirname(new URL(import.meta.url).pathname), ROOT = path.resolve(HERE, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const W = +arg('w', 1920), H = +arg('h', 1080), FPS = +arg('fps', 30);
const STYLE = arg('style', 'classic'), YT = STYLE === 'youtube';
const OUT = path.resolve(ROOT, arg('out', YT ? 'tour/home_tour_youtube.mp4' : 'tour/home_tour.mp4'));
const FRAMES = path.resolve(arg('frames', path.join(os.tmpdir(), 'tour_frames')));
const URL_BASE = arg('url', 'http://localhost:8000/');
const CHROME = arg('chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const FFMPEG = arg('ffmpeg', fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg');
const STILLS = arg('stills', null), PLAN_ONLY = !!arg('plan', false);

/* ---------------- headless Chrome over CDP ---------------- */
async function openChrome() {
  const port = 9300 + Math.floor(Math.random() * 400);
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'tour-chrome-'));
  const gl = arg('swiftshader', false) ? ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
  const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, `--window-size=${W},${H}`, '--hide-scrollbars',
    '--force-device-scale-factor=1', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', ...gl, 'about:blank'], { stdio: 'ignore' });
  let list; for (let i = 0; i < 100 && !list; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(200); } }
  if (!list) throw new Error('Chrome did not start');
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') console.error('page exception:', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.j(new Error(m.error.message)) : p.r(m.result); }
  };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pend.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const close = async () => {
    try { await Promise.race([send('Browser.close'), sleep(2000)]); } catch { }
    try { ws.close(); } catch { } ch.kill('SIGKILL'); await sleep(300); fs.rmSync(prof, { recursive: true, force: true });
  };
  return { send, ev, close };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- path planning on the viewer's obstacle map ---------------- */
const R_SAFE = 0.26;   // keep the eye this far (m) from walls / furniture / door leaves
function makePlanner(o) {
  const { x0, y0, cell, nx, ny } = o, N = nx * ny, occ = new Uint8Array(N);
  for (let k = 0; k < N; k++) occ[k] = o.data.charCodeAt(k) === 49;
  // chamfer distance transform (cells) to the nearest obstacle
  const d = new Float32Array(N).fill(1e9);
  for (let k = 0; k < N; k++) if (occ[k]) d[k] = 0;
  const A = 1, B = Math.SQRT2;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i; let v = d[k];
    if (i > 0) v = Math.min(v, d[k - 1] + A); if (j > 0) v = Math.min(v, d[k - nx] + A);
    if (i > 0 && j > 0) v = Math.min(v, d[k - nx - 1] + B); if (i < nx - 1 && j > 0) v = Math.min(v, d[k - nx + 1] + B); d[k] = v;
  }
  for (let j = ny - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) {
    const k = j * nx + i; let v = d[k];
    if (i < nx - 1) v = Math.min(v, d[k + 1] + A); if (j < ny - 1) v = Math.min(v, d[k + nx] + A);
    if (i < nx - 1 && j < ny - 1) v = Math.min(v, d[k + nx + 1] + B); if (i > 0 && j < ny - 1) v = Math.min(v, d[k + nx - 1] + B); d[k] = v;
  }
  const idx = (x, z) => { const i = Math.floor((x - x0) / cell), j = Math.floor((-z - y0) / cell); return i < 0 || j < 0 || i >= nx || j >= ny ? -1 : j * nx + i; };
  const pos = k => [x0 + (k % nx + 0.5) * cell, -(y0 + (Math.floor(k / nx) + 0.5) * cell)];
  const clear = (x, z) => { const k = idx(x, z); return k < 0 ? 0 : d[k] * cell; };
  const free = (x, z, r = R_SAFE) => clear(x, z) >= r;
  const los = (a, b, r = R_SAFE) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / 0.02)); for (let s = 0; s <= n; s++) { const t = s / n; if (!free(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, r)) return false; } return true; };
  function snap(p) {
    if (free(p[0], p[1])) return p;
    for (let r = 0.05; r < 1.5; r += 0.05) for (let a = 0; a < 32; a++) { const q = [p[0] + Math.cos(a / 32 * 6.283) * r, p[1] + Math.sin(a / 32 * 6.283) * r]; if (free(q[0], q[1])) { console.warn(`  snapped ${p.map(v => v.toFixed(2))} -> ${q.map(v => v.toFixed(2))}`); return q; } }
    throw new Error('no free cell near ' + p);
  }
  function astar(a, b) {
    a = snap(a); b = snap(b);
    const s = idx(...a), g = idx(...b), rc = R_SAFE / cell;
    const gs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), done = new Uint8Array(N);
    const heap = []; const push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const gx = g % nx, gy = Math.floor(g / nx);
    gs[s] = 0; push(s, 0);
    const nb = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, B], [1, -1, B], [-1, 1, B], [-1, -1, B]];
    while (heap.length) {
      const [, k] = pop(); if (done[k]) continue; done[k] = 1; if (k === g) break;
      const i = k % nx, j = Math.floor(k / nx);
      for (const [di, dj, c] of nb) {
        const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
        const kk = jj * nx + ii; if (done[kk] || d[kk] < rc) continue;
        const pen = Math.max(0, 14 - d[kk]) / 14;     // prefer the middle of rooms and doorways
        const ng = gs[k] + c * (1 + 3 * pen * pen);
        if (ng < gs[kk]) { gs[kk] = ng; came[kk] = k; push(kk, ng + Math.hypot(ii - gx, jj - gy)); }
      }
    }
    if (came[g] < 0 && g !== s) throw new Error(`no path ${a} -> ${b}`);
    const cells = []; for (let k = g; k >= 0; k = came[k]) { cells.push(pos(k)); if (k === s) break; }
    cells.reverse(); cells[0] = a; cells[cells.length - 1] = b;
    // string-pull, then round the corners (Chaikin) while staying clear
    const pts = [cells[0]]; let i = 0;
    while (i < cells.length - 1) { let j = cells.length - 1; while (j > i + 1 && !los(cells[i], cells[j])) j--; pts.push(cells[j]); i = j; }
    let sm = pts;
    for (let it = 0; it < 4; it++) {
      const n = [sm[0]];
      for (let q = 0; q < sm.length - 1; q++) { const [p0, p1] = [sm[q], sm[q + 1]]; n.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]); }
      n.push(sm[sm.length - 1]);
      let ok = true; for (let q = 0; q < n.length - 1 && ok; q++) ok = los(n[q], n[q + 1], R_SAFE * 0.8);
      if (!ok) break; sm = n;
    }
    return sm;
  }
  const inside = (x, z) => idx(x, z) >= 0;
  return { astar, free, clear, snap, los, inside };
}

/* ---------------- timeline ---------------- */
const smooth = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * u * (u * (u * 6 - 15) + 10);
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const yawTo = (from, to) => Math.atan2(-(to[0] - from[0]), -(to[1] - from[1]));   // three.js walk yaw looking from → to
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const PITCH = -0.07;

class Tour {
  constructor(planner, start) {
    this.P = planner; this.t = 0; this.shots = []; this.caps = []; this.ramps = []; this.log = [];
    this.xfs = []; this.lts = []; this.cards = []; this.chapters = []; this.maxYawRate = 0; this.limitYaw = false;   // youtube style sets limitYaw
    this.cur = { x: start[0], z: start[1], yaw: start[2], pitch: PITCH, eye: 1.6 };
  }
  // cross-dissolve from the frame just before now into whatever comes next
  xf(dur = 0.7) { this.xfs.push({ t0: this.t, dur }); return this; }
  // lower third (YouTube style): kicker = small label above the title
  lt(title, sub = '', { kicker = '', dur = 5.5, delay = 0.5 } = {}) { this.lts.push({ t0: this.t + delay, dur, title, sub, kicker }); this.log.push([this.t + delay, title + (sub ? ' — ' + sub : '')]); return this; }
  // full-screen card (title / end / credits) shown from now for dur seconds
  card(kind, dur, data = {}, { fadeIn = 0.8, fadeOut = 0.8 } = {}) { this.cards.push({ t0: this.t, dur, kind, data, fadeIn, fadeOut }); return this; }
  chapter(name) { this.chapters.push([this.t, name]); this.log.push([this.t, '## ' + name]); return this; }
  push(dur, fn) { const t0 = this.t; this.shots.push({ t0, t1: t0 + dur, fn }); this.t += dur; return this; }
  caption(title, sub, dur = 4.2) { this.caps.push({ t0: this.t, dur, title, sub }); this.log.push([this.t, title + (sub ? ' — ' + sub : '')]); return this; }
  // world-state ramps: key ∈ movers:<regex> | screen | mood | light ; value interpolated (numbers) or switched (strings)
  set(key, from, to, dur = 0, delay = 0) { this.ramps.push({ key, t0: this.t + delay, t1: this.t + delay + dur, from, to }); return this; }
  // hold the pose; drift > 0 = a slow gimbal push-in (m/s) along the view, stopped short of obstacles
  hold(dur, { drift = 0 } = {}) {
    const c = { ...this.cur }; if (!drift) return this.push(dur, () => ({ cam: c }));
    let L = drift * dur; const dx = -Math.sin(c.yaw), dz = -Math.cos(c.yaw);
    while (L > 0.01 && !this.P.free(c.x + dx * (L + 0.25), c.z + dz * (L + 0.25), 0.2)) L *= 0.7;
    this.cur = { ...c, x: c.x + dx * L, z: c.z + dz * L };
    return this.push(dur, u => { const e = ease(u) * 0.6 + u * 0.4; return { cam: { ...c, x: c.x + dx * L * e, z: c.z + dz * L * e } }; });
  }
  // pan in place; the duration grows if needed so the peak yaw speed stays under maxRate (deg/s)
  turn(target, dur, { pitch = PITCH, maxRate = 22, fov } = {}) {
    const c = { ...this.cur }, y1 = Array.isArray(target) ? yawTo([c.x, c.z], target) : target, dy = wrap(y1 - c.yaw), p0 = c.pitch;
    if (this.limitYaw) dur = Math.max(dur, 1.875 * Math.abs(dy) * 180 / Math.PI / maxRate);
    const f0 = c.fov ?? 50, f1 = fov ?? f0;
    this.cur = { ...c, yaw: c.yaw + dy, pitch, fov: f1 };
    return this.push(dur, u => ({ cam: { ...c, yaw: c.yaw + dy * smooth(u), pitch: p0 + (pitch - p0) * smooth(u), fov: f0 + (f1 - f0) * smooth(u) } }));
  }
  // walk along an A* path (or a straight line with {direct:true}) at ~speed m/s, gaze along the path, ending on `look`
  move(to, opts = {}) {
    const { look = null, speed = 0.8, direct = false, endPitch = PITCH, lookAhead = 1.3, _try = 0, gaze = 'path' } = opts;
    const c = { ...this.cur };
    const poly = direct ? [[c.x, c.z], to] : this.P.astar([c.x, c.z], to);
    // resample by arc length
    const seg = []; let L = 0; for (let i = 0; i < poly.length - 1; i++) { const l = Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1]); seg.push(l); L += l; }
    const at = s => { s = Math.max(0, Math.min(L, s)); for (let i = 0; i < seg.length; i++) { if (s <= seg[i] || i === seg.length - 1) { const u = seg[i] ? s / seg[i] : 0; return [poly[i][0] + (poly[i + 1][0] - poly[i][0]) * u, poly[i][1] + (poly[i + 1][1] - poly[i][1]) * u]; } s -= seg[i]; } return poly[poly.length - 1]; };
    const ta = 1.1, dur = L < speed * ta ? Math.max(1.2, 2 * Math.sqrt(L * ta / speed)) : L / speed + ta;
    const sOf = t => { if (L < speed * ta) return L * ease(t / dur); const v = L / (dur - ta); if (t < ta) return v * t * t / (2 * ta); if (t > dur - ta) { const r = dur - t; return L - v * r * r / (2 * ta); } return v * (t - ta / 2); };
    // gaze: path tangent with look-ahead; blend from the current yaw at the start and towards `look` at the end
    const n = Math.max(2, Math.round(dur * FPS)), yaws = [];
    const endYaw = look ? (Array.isArray(look) ? yawTo(at(L), look) : look) : null;
    let prev = c.yaw;
    for (let f = 0; f <= n; f++) {
      const t = f / n * dur, s = sOf(t), p = at(s), q = at(s + lookAhead);
      let y = Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.05 ? yawTo(p, q) : prev;
      if (endYaw !== null) { const w = smooth((s - (L - 1.6)) / 1.6); const yl = Array.isArray(look) ? yawTo(p, look) : look; y = y + wrap(yl - y) * (L < 1.6 ? smooth(t / dur) : w); }
      const w0 = smooth(t / Math.min(1.4, dur * 0.6)); y = c.yaw + wrap(y - c.yaw) * w0;
      if (gaze === 'blend' && endYaw !== null) y = c.yaw + wrap(endYaw - c.yaw) * smooth(t / dur);   // gimbal: one smooth pan start → end
      y = prev + wrap(y - prev); yaws.push(y); prev = y;
    }
    // low-pass the gaze (0.5 s gaussian) but keep the first/last frames exact
    const k = Math.round(FPS * 0.25), sm = yaws.map((_, i) => { let a = 0, wsum = 0; for (let j = -2 * k; j <= 2 * k; j++) { const ii = Math.max(0, Math.min(n, i + j)), w = Math.exp(-(j * j) / (2 * k * k)); a += yaws[ii] * w; wsum += w; } return a / wsum; });
    const fix = i => { const e = Math.min(1, Math.min(i, n - i) / (k * 2)); return yaws[i] + (sm[i] - yaws[i]) * e; };
    const yawAt = u => { const fi = u * n, i = Math.floor(fi), fr = fi - i; return i >= n ? fix(n) : fix(i) * (1 - fr) + fix(i + 1) * fr; };
    const end = at(L), p0 = c.pitch;
    this.cur = { ...c, x: end[0], z: end[1], yaw: yawAt(1), pitch: endPitch };
    for (let s = 0; s <= L; s += 0.05) { const p = at(s); if (!direct && !this.P.free(p[0], p[1], 0.18)) console.warn(`  path close to obstacle at ${p.map(v => v.toFixed(2))}`); }
    let mr = 0; for (let i = 1; i <= n; i++) mr = Math.max(mr, Math.abs(fix(i) - fix(i - 1)) * n / dur * 180 / Math.PI);
    // too fast a pan for a gimbal look → walk the same path more slowly (the gaze timing scales with it)
    if (process.env.TOUR_DEBUG) console.log(`  move @${this.t.toFixed(1)} L ${L.toFixed(2)} dur ${dur.toFixed(1)} speed ${speed.toFixed(2)} yaw ${mr.toFixed(0)}°/s`);
    if (this.limitYaw && mr > 24 && _try < 5) { this.cur = c; return this.move(to, { ...opts, speed: speed * Math.max(0.6, 22 / mr), _try: _try + 1 }); }
    this.maxYawRate = Math.max(this.maxYawRate, mr); if (mr > 26) console.warn(`  move @${this.t.toFixed(1)}s: yaw speed ${mr.toFixed(0)}°/s`);
    return this.push(dur, u => { const p = at(sOf(u * dur)); return { cam: { x: p[0], z: p[1], yaw: yawAt(u), pitch: p0 + (endPitch - p0) * smooth(u), eye: c.eye, fov: c.fov } }; });
  }
  // dip to black, cut to a new pose (e.g. seated), fade back in
  cut(pose, dip = 0.45) {
    const c = { ...this.cur }; this.set('fade', 0, 1, dip); this.push(dip, () => ({ cam: c }));
    this.cur = { pitch: PITCH, eye: 1.6, ...pose }; this.set('fade', 1, 0, dip);
    const n = { ...this.cur }; return this.push(dip, () => ({ cam: n }));
  }
  // camera move between two look-at keyframes A, B = { p: [x, y, z], at: [x, y, z], fov } (y = height); orbit: true = plan view
  la(dur, A, B = A, { e = smooth, orbit = false, label = '' } = {}) {
    const lerp = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u), F0 = A.fov ?? this.cur.fov ?? 50, F1 = B.fov ?? F0;
    const poseOf = (p, at, fov) => { const dx = at[0] - p[0], dy = at[1] - p[1], dz = at[2] - p[2]; return { x: p[0], z: p[2], eye: p[1], yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), fov }; };
    const f = u => { const k = e(u); return orbit ? { orbit: { pos: lerp(A.p, B.p, k), target: lerp(A.at, B.at, k) }, fov: F0 + (F1 - F0) * k } : { cam: poseOf(lerp(A.p, B.p, k), lerp(A.at, B.at, k), F0 + (F1 - F0) * k) }; };
    if (!orbit) {
      let prev = f(0).cam, worst = 1e9, mr = 0;
      for (let i = 1; i <= 60; i++) { const c = f(i / 60).cam; mr = Math.max(mr, Math.abs(wrap(c.yaw - prev.yaw)) * 60 / dur * 180 / Math.PI); prev = c; if (c.eye > 0.3 && c.eye < 1.75 && this.P.inside(c.x, c.z)) worst = Math.min(worst, this.P.clear(c.x, c.z)); }
      this.maxYawRate = Math.max(this.maxYawRate, mr); if (mr > 26) console.warn(`  la @${this.t.toFixed(1)}s ${label}: yaw speed ${mr.toFixed(0)}°/s`);
      if (worst < 0.12) console.warn(`  la @${this.t.toFixed(1)}s ${label}: camera ${worst.toFixed(2)} m from an obstacle (check the still)`);
      this.cur = { ...f(1).cam };
    }
    return this.push(dur, f);
  }
  // hard cut (no time) to a new pose; combine with xf() for a dissolve
  cutTo(pose, { snap = true } = {}) {
    this.cur = { pitch: PITCH, eye: 1.6, fov: this.cur.fov, ...pose };
    if (snap && this.P.inside(pose.x, pose.z) && !this.P.free(pose.x, pose.z)) { const q = this.P.snap([pose.x, pose.z]); this.cur.x = q[0]; this.cur.z = q[1]; }
    return this;
  }
  // vertical change of eye height in place (sit down / stand up)
  eye(to, dur) { const c = { ...this.cur }; this.cur = { ...c, eye: to }; return this.push(dur, u => ({ cam: { ...c, eye: c.eye + (to - c.eye) * smooth(u) } })); }
  orbit(dur, { centre = [6.1, -0.6], r0 = 13, r1 = 11.5, h0 = 14.5, h1 = 11.5, a0 = 0.15, a1 = 2.3 } = {}) {
    return this.push(dur, u => { const e = smooth(u), a = a0 + (a1 - a0) * (0.15 * u + 0.85 * e), r = r0 + (r1 - r0) * e, h = h0 + (h1 - h0) * e;
      return { orbit: { pos: [centre[0] + r * Math.sin(a), h, centre[1] + r * Math.cos(a)], target: [centre[0], 0.6, centre[1]] } }; });
  }
  state(t) {
    let shot = this.shots.find(s => t >= s.t0 && t < s.t1) || this.shots[this.shots.length - 1];
    const st = shot.fn(Math.min(1, (t - shot.t0) / (shot.t1 - shot.t0)));
    const world = {};
    for (const r of this.ramps) {
      if (t < r.t0) continue;
      const u = r.t1 > r.t0 ? smooth((t - r.t0) / (r.t1 - r.t0)) : 1;
      world[r.key] = typeof r.to === 'number' ? r.from + (r.to - r.from) * u : r.to;
    }
    let fade = world.fade ?? 0; delete world.fade;
    fade = Math.max(fade, 1 - smooth(t / 1.2), smooth((t - (this.t - 1.6)) / 1.5));
    let cap = { title: '', sub: '', a: 0 };
    for (const c of this.caps) if (t >= c.t0 && t < c.t0 + c.dur) { const u = t - c.t0; cap = { title: c.title, sub: c.sub || '', a: Math.min(1, u / 0.6, (c.dur - u) / 0.7) }; }
    let lt = null, card = null, xf = null;
    // a lower third never runs into the next dissolve
    for (const c of this.lts) { if (c.end === undefined) { const nx = this.xfs.find(x => x.t0 > c.t0 + 0.3); c.end = Math.min(c.t0 + c.dur, nx ? nx.t0 - 0.15 : 1e9); c.dur = c.end - c.t0; } }
    for (const c of this.lts) if (t >= c.t0 && t < c.t0 + c.dur) { const u = t - c.t0; lt = { title: c.title, sub: c.sub, kicker: c.kicker, a: +Math.min(1, smooth(u / 0.9), smooth((c.dur - u) / 0.8)).toFixed(4), u: +u.toFixed(3) }; }
    for (const c of this.cards) if (t >= c.t0 && t < c.t0 + c.dur) { const u = t - c.t0; card = { kind: c.kind, data: c.data, u: +u.toFixed(3), dur: c.dur, a: +Math.min(1, smooth(u / c.fadeIn), smooth((c.dur - u) / c.fadeOut)).toFixed(4) }; }
    for (const x of this.xfs) if (t >= x.t0 && t < x.t0 + x.dur) xf = { src: Math.round(x.t0 * FPS) - 1, a: +(1 - smooth((t - x.t0) / x.dur)).toFixed(4) };
    return { ...st, world, fade: +fade.toFixed(4), cap, lt, card, xf };
  }
}

/* ---------------- the tour script ---------------- */
function buildTour(P, seats) {
  const T = new Tour(P, [0.35, -3.72, -Math.PI / 2]);
  const MB = 'Master bedroom';
  T.set('movers:balcony-sliding-door', 0, 0).set('movers:living-and-dining/fixed/curtains:cs', 0, 0).set('light', 'day', 'day').set('mood', 'normal', 'normal').set('screen', 0, 0);
  // 1. entrance → formal hall
  T.caption('Entrance', 'Main door into the formal hall').hold(1.6);
  T.move([1.25, -3.25], { look: [3.2, -2.0], speed: 0.6 });
  T.caption('Formal hall', 'Emerald velvet sofa · Laurel armchairs · TV wall');
  T.turn([1.8, -0.5], 3.2).hold(0.6);
  T.turn([2.5, -4.3], 3.4, { pitch: -0.04 }).hold(0.4);
  // seated view from the formal-hall sofa
  const s1 = seats.formal;
  T.cut({ x: s1.x, z: s1.z, yaw: s1.yaw, pitch: -0.04, eye: s1.eye });
  T.caption('Formal hall', 'Seated on the sofa · eye height 1.12 m', 4.6);
  T.hold(1.2).turn(s1.yaw + 0.45, 2.6, { pitch: -0.04 }).turn(s1.yaw - 0.35, 3.0, { pitch: -0.04 }).hold(0.4);
  T.cut({ x: 2.05, z: -2.45, yaw: yawTo([2.05, -2.45], [5.4, -2.1]), pitch: PITCH, eye: 1.6 });
  // 2. living and dining
  T.move([4.15, -3.55], { look: [5.45, -2.1], speed: 0.75 });
  T.caption('Living and dining', 'Walnut dining table for six');
  T.turn([5.6, -1.6], 2.0);
  T.move([6.95, -2.55], { look: [8.5, -3.8], speed: 0.75 });
  T.turn([8.5, -0.2], 3.2).hold(0.3);
  T.set('movers:living-and-dining/fixed/curtains:cs', 0, 1, 3.0, 0.5);    // gather the sheers to reveal the balcony
  T.set('movers:balcony-sliding-door', 0, 1, 2.0, 2.0);
  T.move([9.55, -1.15], { look: [12.0, -1.6], speed: 0.7 });
  T.hold(0.4);
  T.caption('Family balcony', 'Sheers gathered · slider open');
  T.move([11.2, -1.6], { look: [11.6, -3.6], speed: 0.6, direct: true });
  T.turn([11.4, -0.4], 3.0).turn([9.0, -1.8], 2.4);
  T.move([9.55, -1.6], { look: [7.0, -0.4], speed: 0.7, direct: true });
  // 3. puja + kitchen
  T.move([6.2, 0.75], { look: [9.5, 0.9], speed: 0.85 });
  T.caption('Puja', 'Open alcove off the passage', 3.2);
  T.move([7.6, 1.0], { look: [9.6, 0.8], speed: 0.7 });
  T.move([8.2, 2.6], { look: [9.6, 4.4], speed: 0.7 });
  T.caption('Kitchen');
  T.turn([7.1, 4.6], 3.2).turn([10.0, 2.4], 3.0).hold(0.3);
  // 4. bedroom 1
  T.move([7.1, -5.7], { look: [10.2, -6.6], speed: 0.95 });
  T.caption('Bedroom 1', 'Sage wardrobe wall · floor-to-ceiling curtains');
  T.turn([8.6, -8.3], 3.0).turn([9.6, -4.6], 3.2).hold(0.3);
  // 5. bedroom 2
  T.move([4.0, -5.15], { look: [2.6, -7.6], speed: 0.9 });
  T.caption('Bedroom 2', 'Sliding wardrobe · owned desk');
  T.turn([3.2, -8.3], 2.6).turn([2.4, -4.6], 3.0).hold(0.3);
  // 6. master bedroom
  T.move([3.25, 1.2], { look: [1.0, 3.6], speed: 0.95 });
  T.caption('Master bedroom', 'King bed · gaming TV wall · work wall');
  T.turn([1.2, 0.2], 3.2).hold(0.3);
  T.move([2.75, 2.15], { look: [3.6, 4.0], speed: 0.6 });
  T.turn([3.66, 4.2], 1.8).hold(0.8);
  T.turn([3.8, 2.6], 1.8);
  T.move([4.75, 2.65], { look: [6.8, 2.6], speed: 0.6 });
  T.caption('Walk-in wardrobe', 'Hidden fluted door from the bedroom');
  T.hold(0.8).turn([5.6, 1.2], 2.6);
  T.move([5.35, 2.6], { look: [5.35, 4.9], speed: 0.5 });
  T.caption('Master toilet', '', 3.2);
  T.hold(2.2).turn([3.6, 2.7], 2.6);
  // gaming beat, seen from the bed
  T.cut({ x: 0.75, z: 3.45, yaw: -Math.PI / 2, pitch: -0.2, eye: 1.2 });
  T.caption('Master bedroom', 'From the bed · 65″ TV on the east wall', 3.6).hold(3.2);
  T.set('fade', 0, 0.85, 0.5).hold(0.5);
  T.set('light', 'evening', 'evening').set('mood', 'gaming', 'gaming').set('fade', 0.85, 0, 0.6);
  T.caption('Gaming mood', '100″ projector screen lowered · evening lights', 5.5);
  T.set('screen', 0, 1, 3.5, 0.3).turn(-Math.PI / 2, 3.8, { pitch: 0.17 }).hold(1.0).turn(-Math.PI / 2 + 0.3, 2.4, { pitch: 0.1 }).turn(-Math.PI / 2 - 0.05, 2.2, { pitch: 0.15 }).hold(1.2);
  // 7. aerial
  T.set('fade', 0, 1, 0.6).hold(0.6);
  T.set('light', 'day', 'day').set('mood', 'normal', 'normal').set('screen', 1, 0).set('fade', 1, 0, 0.8);
  T.caption('The whole home', '3 BHK · Candeur Crescent 3302', 5);
  T.orbit(15);
  return T;
}

/* ---------------- main ---------------- */
const t0 = Date.now();
const C = await openChrome();
try {
  await C.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await C.send('Runtime.enable');
  // fresh Chrome profile (openChrome) = no saved layout → every room shows its DEFAULT option / slot variants
  await C.send('Page.navigate', { url: URL_BASE + '?tour=1&mode=walk' });
  for (let i = 0; ; i++) { if (await C.ev('!!window.__ready').catch(() => false)) break; if (i > 900) throw new Error('viewer did not load'); await sleep(300); }
  console.log(`viewer ready in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  let tour, YTM = null;
  if (YT) {
    YTM = await import('./tour_youtube.mjs');
    tour = await YTM.buildYoutube({ C, Tour, makePlanner, FPS, W, H, yawTo, smooth, ease, PITCH });
  } else {
    // obstacle map with the doors / sliders / sheers in the states used while walking
    const o = await C.ev(`(()=>{const T=window.__tour;T.movers('balcony-sliding-door',1);T.movers('living-and-dining/fixed/curtains:cs',1);const o=T.occupancy();T.movers('balcony-sliding-door',0);T.movers('living-and-dining/fixed/curtains:cs',0);return o})()`);
    const seats = { formal: await C.ev(`window.__tour.seat('formal-hall/option1/sofa')`) };
    if (!seats.formal) throw new Error('formal-hall sofa not found');
    tour = buildTour(makePlanner(o), seats);
  }
  const N = Math.round(tour.t * FPS);
  const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  console.log(`tour ${tour.t.toFixed(1)} s (${mmss(tour.t)}) = ${N} frames @ ${FPS} fps, ${W}x${H}; peak yaw speed ${tour.maxYawRate.toFixed(1)}°/s`);
  for (const [t, c] of tour.log) console.log(`  ${String(Math.floor(t / 60)).padStart(1)}:${(t % 60).toFixed(1).padStart(4, '0')}  ${c}`);
  if (YT) {
    const ch = tour.chapters.map(([t, n]) => `${mmss(t)} ${n}`).join('\n') + '\n';
    if (!STILLS) { fs.writeFileSync(path.join(path.dirname(OUT), 'chapters.txt'), ch); console.log('chapters → tour/chapters.txt'); }
  }
  if (arg('shotlist', false)) console.log('SHOTS ' + tour.shots.filter(s => s.t1 - s.t0 > 1.5).map(s => ((s.t0 + s.t1) / 2).toFixed(1)).join(','));
  if (PLAN_ONLY) { await C.close(); process.exit(0); }
  fs.mkdirSync(FRAMES, { recursive: true });
  if (YTM) await C.ev(YTM.OVERLAY_JS);
  const sent = {}; let xfKey = -1, depth = 0;
  const fname = f => path.join(FRAMES, `f_${String(f).padStart(5, '0')}.jpg`);
  async function grab(file) {
    const shot = await C.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 });
    const buf = Buffer.from(shot.data, 'base64'); if (file) fs.writeFileSync(file, buf); return buf;
  }
  async function frame(t, file) {
    const s = tour.state(t), w = s.world, cmd = [];
    // cross-dissolve: show the last frame before the cut on top of the new shot (read back from disk, or re-rendered)
    if (YTM) {
      if (s.xf && s.xf.src !== xfKey && depth === 0) {
        let buf = fs.existsSync(fname(s.xf.src)) ? fs.readFileSync(fname(s.xf.src)) : null;
        if (!buf) { depth++; await frame(s.xf.src / FPS, null); buf = await grab(null); depth--; for (const k in sent) delete sent[k]; }
        await C.ev(`__yt.xfSrc(${JSON.stringify('data:image/jpeg;base64,' + buf.toString('base64'))})`); xfKey = s.xf.src;
      }
    }
    for (const [k, v] of Object.entries(w)) {
      const val = typeof v === 'number' ? +v.toFixed(4) : v; if (sent[k] === val) continue; sent[k] = val;
      if (k.startsWith('movers:')) cmd.push(`T.movers(${JSON.stringify(k.slice(7))},${val})`);
      else if (k === 'screen') cmd.push(`T.screen('Master bedroom',${val})`);
      else if (k.startsWith('screen:')) cmd.push(`T.screen(${JSON.stringify(k.slice(7))},${val})`);
      else if (k === 'mood') cmd.push(`T.mood('Master bedroom',${JSON.stringify(val)})`);
      else if (k.startsWith('mood:')) cmd.push(`T.mood(${JSON.stringify(k.slice(5))},${JSON.stringify(val)})`);
      else if (k.startsWith('projector:')) cmd.push(`await T.projector(${JSON.stringify(k.slice(10))},${val === 'on'})`);
      else if (k.startsWith('js:')) cmd.push(String(val));
      else if (k === 'light') cmd.push(`T.light(${JSON.stringify(val)})`);
    }
    const fov = s.cam ? s.cam.fov : s.fov;
    if (fov && sent.fov !== +fov.toFixed(3)) { sent.fov = +fov.toFixed(3); cmd.push(`{const c=__app.cam();c.fov=${sent.fov};c.updateProjectionMatrix()}`); }
    cmd.push(s.cam ? `T.view(${JSON.stringify(s.cam)})` : `T.orbitView(${JSON.stringify(s.orbit)})`);
    if (YTM) cmd.push(`__yt.apply(${JSON.stringify({ lt: s.lt, card: s.card, xf: depth ? null : s.xf, orbit: !s.cam })})`, `T.caption('','',0)`, `T.fade(${s.fade})`);
    else cmd.push(`T.caption(${JSON.stringify(s.cap.title)},${JSON.stringify(s.cap.sub)},${s.cap.a.toFixed(3)})`, `T.fade(${s.fade})`);
    await C.ev(`(async()=>{const T=window.__tour;${cmd.join(';')};return T.render(${(t * 3).toFixed(3)})})()`);
    if (file) await grab(file);
  }
  // thumbnail: hero frame from the timeline + title card, no lower third / bug / dissolve
  async function thumbnail() {
    await frame(YTM.THUMB_T, null);
    await C.ev(`(async()=>{__yt.apply(${JSON.stringify({ lt: null, card: YTM.THUMB_CARD, xf: null, orbit: false })});document.getElementById('ytBug').style.opacity=0;await __tour.render(${(YTM.THUMB_T * 3).toFixed(2)});return 1})()`);
    const f = path.join(path.dirname(OUT), 'thumbnail.jpg'); await grab(f); console.log('wrote', f);
  }
  if (YTM && arg('thumb', false)) { await thumbnail(); await C.close(); process.exit(0); }
  if (STILLS) {
    // stills mode: frames rendered in order up to each requested time (keeps world ramps consistent)
    const times = String(STILLS).split(',').map(Number).sort((a, b) => a - b);
    for (const t of times) { await frame(t, path.join(FRAMES, `still_${t.toFixed(1).padStart(6, '0')}.jpg`)); console.log('still', t); }
  } else {
    const from = +arg('from', 0), to = Math.min(N - 1, +arg('to', N - 1)); let last = Date.now();
    for (let f = from; f <= to; f++) {
      await frame(f / FPS, fname(f));
      if (f % 150 === 0) { console.log(`frame ${f}/${N} (${((Date.now() - last) / 150).toFixed(0)} ms/frame)`); last = Date.now(); }
    }
    console.log(`rendered in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
    if (YTM && to === N - 1) { for (const k in sent) delete sent[k]; await thumbnail(); }
    if (!arg('no-encode', false)) {
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      if (YTM) await YTM.finish({ FFMPEG, FRAMES, OUT, FPS, dur: N / FPS, tour, ROOT });
      else {
        const r = spawnSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f_%05d.jpg'),
          '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', OUT], { stdio: 'inherit' });
        if (r.status) throw new Error('ffmpeg failed');
      }
      console.log('wrote', OUT);
      if (!arg('keep', false)) fs.rmSync(FRAMES, { recursive: true, force: true });
    }
  }
} finally { await C.close(); }
console.log(`total ${((Date.now() - t0) / 60000).toFixed(1)} min`);
process.exit(0);
