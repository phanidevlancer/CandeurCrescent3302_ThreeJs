// Living + dining (Hall 2) · switchable TV wall (slot 'tvwall', owner references 2026-11-11).
// Everything is built in WORLD coordinates and added at (0, 0) with ry 0.
// Measured 2026-11-11 (viewer ray-casts): solid TV wall = south wall face z 0, x 6.82 (east jamb of the open passage
// x 3.84–6.80) → 10.28 (glazed east wall; curtain track + stacked drapes x ≥ 10.15, z ≥ −0.49); floor finish 0.035;
// ceiling bulkhead (cove fascia) 0.24 deep along this wall, underside 2.91, main ceiling 3.05 beyond it (cove slot above the
// bulkhead top 3.03). v1 skirting z −0.04…0 up to 0.18 → every design starts with a 45 mm built-out finish layer
// (WF = −0.045, like the v1 microcement), so the skirting disappears behind it.
// The 65″ TV is the v1 stand-in (groups approved-h2-65-inch#0 + approved-h2-tv#1, 1.46 × 0.84 m, y 1.14–1.98) moved
// sideways/forwards per design; it is replaced by the owners' Samsung The Frame once the FBX arrives (DESIGN_BRIEF rule 24).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const X0 = 6.82, X1 = 10.28, FL = 0.035, CE = 2.91, WF = -0.045, TV0 = { x: 8.62, z: 0 };
const R = 'references/living-and-dining/2026-11-11_tv-wall-';
export const TVWALL_ANCHOR = [8.55, 2.62, -0.35];
export const TV_WALLS = [
  { id: 'current', name: 'Current · grey microcement + walnut console', summary: 'The design so far: grey microcement TV wall, a walnut niche pillar on the west end, a long floating walnut console with drawers and an open media niche, a long walnut shelf above the TV, soundbar.', search: ['microcement tv wall walnut floating console'] },
  { id: 'terracotta-olive-arch', ref: R + 'terracotta-olive-arch.png', name: 'Terracotta limewash + olive arch',
    summary: 'Owner reference: the whole wall in warm terracotta limewash (mottled, trowelled), a tall olive-green painted arch (1.00 × 2.52 m, 6 mm panel) behind the west half of the TV with nine olive slat battens from the arch top to the ceiling and a shorter slat group lower on the arch, the 65″ TV left of centre overlapping the arch edge, a 2.6 m floating light-oak console (doors at both ends, two drawers with open book niches above), two floating oak shelves on the east with terracotta jugs, books and a trailing pothos, terracotta pots + a snake plant on the console, a fiddle-leaf fig in a cream planter by the curtains and a snake plant floor pot on the west.',
    search: ['terracotta limewash tv wall olive arch', 'painted arch slat tv wall', 'floating oak tv console open niches', 'terracotta wall boho living room tv'] },
  { id: 'white-stone-ledge', ref: R + 'white-stacked-stone.png', name: 'White stacked ledge stone',
    summary: 'Owner reference: the whole wall clad in off-white split-face stacked ledge stone (real relief), four downlights in the bulkhead grazing the stone, a warm cove glow on the ceiling above the existing bulkhead, a 2.4 m floating light-oak shelf above the TV with an LED strip under it (two black-framed prints, river stones, a small bowl and box), the 65″ TV flush on the stone, a 2.6 m wall-hung light-oak console with five flush fronts of different widths (black vase, books, box), a bird-of-paradise in a white round pot on the east and a leafy plant in a dark pot on the west.',
    search: ['white stacked stone tv wall', 'ledge stone feature wall floating shelf led', 'stone cladding tv wall oak console', 'white split face stone living room'] },
  { id: 'walnut-slat-warm', ref: R + 'walnut-slat-warm.png', name: 'Ivory plaster + walnut slats, rounded console',
    summary: 'Owner reference: warm ivory plaster wall, a full-height walnut slat panel on the west end with a brass globe wall sconce, three floating walnut shelves with LED strips in the east corner by the curtains (books, trailing pothos, white vases, a ribbed pot plant), the 65″ TV over a 2.25 m floating walnut console with rounded ends (flush end doors + fluted centre doors) and a warm under-glow, a linen-shade table lamp, pampas in smoky glass, reed diffuser, brass balls and dried branches in a dark vase, a cove glow and downlight pools.',
    search: ['walnut slat wall tv unit warm lighting', 'rounded walnut floating tv console', 'floating shelves led niche living room', 'cosy warm tv wall ivory walnut'] },
  { id: 'oak-fluted-tower', ref: R + 'oak-fluted-tower.png', name: 'Greige plaster + fluted oak console + oak tower',
    summary: 'Owner reference: warm greige plaster wall with a cove glow, the 65″ TV left of centre with a black soundbar below, a 2.0 m light-oak sideboard on slim tapered legs with fluted (reeded) doors, a floor-to-ceiling light-oak open bookcase tower (0.85 × 0.35 m) at the west end with four lit shelves and a two-door cupboard below, stoneware vases, books, small plants, a candle, olive branches and a tall olive tree in a cream pot (east end: the west side of the tower is the passage).',
    search: ['fluted oak sideboard tv', 'oak bookcase tower tv wall', 'japandi tv wall greige oak', 'reeded oak media console legs'] },
  { id: 'walnut-white-frame', ref: R + 'walnut-white-frame.png', name: 'Walnut slat frame + white cabinets',
    summary: 'Owner reference: one 2.7 m entertainment unit on a greige wall: walnut plinth, white lacquered end cabinets with a grooved chevron front and bar pulls, a lower centre bay with an open media shelf over three grooved white drawers, a walnut-slat back frame (side columns + top band) with a white floating bridge shelf and an LED glow above it, a lit light panel behind the TV, white side shelves, a small walnut shelf and a walnut shelf above the TV with a speaker, the 65″ TV showing a streaming home screen, soundbar, plants in white pots, gold elephant and deer, books, candle holders, photo frame, clock and a trailing pothos.',
    search: ['walnut slat tv unit white cabinets', 'tv entertainment unit led back panel', 'white and walnut tv wall unit', 'modern tv unit slat frame floating shelves'] },
];
export const TVWALL_HIDE = /^(approved-h2-(65-inch-x|console|corner|floating|long|niche|open|pillar|set-top|tv#0|wall#|walnut)|plant#(1|9|10)$|handmade-ceramic#[1-4]$|vase-neck#[1-4]$|dried-branch#[1-3]$)/;

// ---------------- shared materials (cached: textures are built once) ----------------
const C = {};
const once = (k, f) => C[k] || (C[k] = f());
const std = (name, o) => once(name, () => new THREE.MeshStandardMaterial({ name, roughness: 0.6, ...o }));
const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
// mottled lime plaster: colour canvas + bump canvas (one per colour)
function plasterMat(name, rgb, mott = 26, bump = 2.5) {
  return once(name, () => { seed = 31; const W = 1024, H = 850, c = cnv(W, H), x = c.getContext('2d'), b = cnv(W, H), y = b.getContext('2d');
    x.fillStyle = `rgb(${rgb})`; x.fillRect(0, 0, W, H); y.fillStyle = '#808080'; y.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) { const px = rnd() * W, py = rnd() * H, r = 20 + rnd() * 90, d = (rnd() - 0.5) * mott, [r0, g0, b0] = rgb.split(',').map(Number);
      const gr = x.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, `rgba(${r0 + d},${g0 + d * 0.8},${b0 + d * 0.6},0.35)`); gr.addColorStop(1, `rgba(${r0 + d},${g0 + d * 0.8},${b0 + d * 0.6},0)`); x.fillStyle = gr; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
      const v = 128 + d * 2; const g2 = y.createRadialGradient(px, py, 0, px, py, r * 0.4); g2.addColorStop(0, `rgba(${v},${v},${v},0.5)`); g2.addColorStop(1, `rgba(${v},${v},${v},0)`); y.fillStyle = g2; y.beginPath(); y.arc(px, py, r * 0.4, 0, 7); y.fill(); }
    for (let i = 0; i < 380; i++) { const px = rnd() * W, py = rnd() * H, l = 20 + rnd() * 70, a = rnd() * 6.28; x.strokeStyle = `rgba(255,255,255,${0.03 + rnd() * 0.05})`; x.lineWidth = 2 + rnd() * 5; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + 8, py + Math.sin(a) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    return new THREE.MeshStandardMaterial({ name, color: 0xffffff, map: tex(c), bumpMap: tex(b, false), bumpScale: bump, roughness: 0.93 }); });
}
const OAKL = () => std('__tw_light_oak', { color: 0xffffff, roughness: 0.55, map: once('t_oak', () => { seed = 3; const c = cnv(512, 512), x = c.getContext('2d'); x.fillStyle = '#c9a77a'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { const y0 = rnd() * 512, a = 0.04 + rnd() * 0.08; x.strokeStyle = rnd() < 0.5 ? `rgba(150,110,65,${a})` : `rgba(235,210,170,${a})`; x.lineWidth = 1 + rnd() * 3; x.beginPath(); x.moveTo(0, y0); for (let k = 1; k <= 8; k++) x.lineTo(k * 64, y0 + Math.sin(k * 0.9 + y0) * 4 * rnd()); x.stroke(); }
  return tex(c); }) });
const WAL = () => std('__tw_walnut', { color: 0xffffff, roughness: 0.5, map: once('t_wal', () => { seed = 5; const c = cnv(512, 512), x = c.getContext('2d'); x.fillStyle = '#6a4630'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 170; i++) { const y0 = rnd() * 512, a = 0.06 + rnd() * 0.1; x.strokeStyle = rnd() < 0.55 ? `rgba(55,32,20,${a})` : `rgba(150,105,72,${a})`; x.lineWidth = 1 + rnd() * 3; x.beginPath(); x.moveTo(0, y0); for (let k = 1; k <= 8; k++) x.lineTo(k * 64, y0 + Math.sin(k * 0.8 + y0) * 5 * rnd()); x.stroke(); }
  return tex(c); }) });
const DARKGAP = () => std('__tw_slat_gap', { color: 0x1c140f, roughness: 0.95 });
const OLIVE = () => std('__tw_olive_paint', { color: 0x7d7c47, roughness: 0.85 });
const WHITE_LAC = () => std('__tw_white_lacquer', { color: 0xf1eee8, roughness: 0.3 });
const BLACK = () => std('__tw_matte_black', { color: 0x18181a, roughness: 0.45 });
const BRASS = () => std('__tw_brass', { color: 0xc49a55, metalness: 0.85, roughness: 0.32 });
const GOLD = () => std('__tw_gold', { color: 0xd4a94e, metalness: 0.95, roughness: 0.22 });
const CREAM_POT = () => std('__tw_cream_pot', { color: 0xe7e0d2, roughness: 0.8 });
const WHITE_POT = () => std('__tw_white_pot', { color: 0xf3f1ec, roughness: 0.35 });
const DARK_POT = () => std('__tw_dark_pot', { color: 0x2b2a28, roughness: 0.55 });
const TERRA = () => std('__tw_terracotta_pot', { color: 0xb46a45, roughness: 0.85 });
const STONEW = () => std('__tw_stoneware', { color: 0xc9b9a0, roughness: 0.75 });
const SOIL = () => std('__tw_soil', { color: 0x3a2c22, roughness: 1 });
const LEAF = () => std('__tw_leaf_deep', { color: 0x355f2a, roughness: 0.55, side: THREE.DoubleSide });
const LEAF2 = () => std('__tw_leaf_mid', { color: 0x5f8f3a, roughness: 0.55, side: THREE.DoubleSide });
const SNAKE = () => std('__tw_snake_leaf', { color: 0xffffff, roughness: 0.5, side: THREE.DoubleSide, map: once('t_snake', () => { const c = cnv(64, 256), x = c.getContext('2d'); x.fillStyle = '#2f5a2c'; x.fillRect(0, 0, 64, 256);
  for (let k = 0; k < 26; k++) { x.strokeStyle = 'rgba(150,180,110,0.45)'; x.lineWidth = 3; x.beginPath(); const yy = k * 10 + 4; x.moveTo(8, yy); x.quadraticCurveTo(32, yy + 6, 56, yy); x.stroke(); }
  x.fillStyle = '#c9c46a'; x.fillRect(0, 0, 5, 256); x.fillRect(59, 0, 5, 256); return tex(c); }) });
const OLIVELEAF = () => std('__tw_olive_leaf', { color: 0x7f8f62, roughness: 0.7, side: THREE.DoubleSide });
const BARK = () => std('__tw_bark', { color: 0x5a4636, roughness: 0.9 });
const PAMPAS = () => std('__tw_pampas', { color: 0xdcc6a2, roughness: 1 });
const TWIG = () => std('__tw_twig', { color: 0x7a6248, roughness: 0.9 });
const SMOKE = () => once('__tw_smoke_glass', () => new THREE.MeshPhysicalMaterial({ name: '__tw_smoke_glass', color: 0x4a4038, roughness: 0.1, transparent: true, opacity: 0.65, clearcoat: 1 }));
const CLEAR = () => once('__tw_clear_glass', () => new THREE.MeshPhysicalMaterial({ name: '__tw_clear_glass', color: 0xe9eef0, roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false }));
const BOOKS = ['__tw_book_a', '__tw_book_b', '__tw_book_c', '__tw_book_d'].map((n, i) => () => std(n, { color: [0xeee8dc, 0x6c7a5a, 0xc9b28e, 0x3d3a36][i], roughness: 0.85 }));
const glowMat = (name, colour = 0xffc890) => once(name, () => new THREE.MeshBasicMaterial({ name, color: colour, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
const POOL = () => once('__tw_downlight_pool', () => new THREE.MeshBasicMaterial({ name: '__tw_downlight_pool', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: 0xffc890, map: (() => {
  const c = cnv(128, 256), x = c.getContext('2d'); for (let py = 0; py < 256; py++) { const t = py / 256, half = 10 + t * 52, a = Math.pow(1 - t, 1.5) * 0.5;
    const gr = x.createLinearGradient(64 - half, 0, 64 + half, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(64 - half, py, half * 2, 1); }
  return tex(c); })() }));
const HALO = () => once('__tw_halo_glow', () => new THREE.MeshBasicMaterial({ name: '__tw_halo_glow', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: 0xffc890, map: (() => {
  const c = cnv(128, 128), x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.8)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return tex(c); })() }));

// ---------------- geometry helpers (world coords; the room is on −z) ----------------
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
// world box from extents
const wb = (x0, x1, y0, y1, z0, z1, m) => at(new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), typeof m === 'function' ? m() : m), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
const cyl = (rt, rb, h, m, x, y, z, seg = 24) => at(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'function' ? m() : m), x, y + h / 2, z);
const lathe = (pts, m, x, y, z, seg = 32) => at(new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), typeof m === 'function' ? m() : m), x, y, z);
const loose = o => { o.traverse(c => { if (c.isMesh) c.userData.loose = true; }); return o; };
let MSEQ = 0;
const mover = (grp, spec) => { const id = 'tw' + (++MSEQ); grp.traverse(o => { if (o.isMesh) o.userData.moverSpec = { id, fitted: true, ...spec }; }); return grp; };
// leaf blade along +y (length L, width W), folded on the midrib, tip bent towards +z
function blade(L, W, { fold = 0.25, bend = 0.15, n = 8, shape = t => Math.sin(Math.PI * Math.min(1, t * 1.08)) } = {}) {
  const pos = [], idx = [];
  for (let k = 0; k <= n; k++) { const t = k / n, w = W / 2 * Math.max(0, shape(t)), y = L * t, z = bend * L * t * t; pos.push(-w, y, z + w * fold, 0, y, z, w, y, z + w * fold); }
  for (let k = 0; k < n; k++) { const a = k * 3; idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const uv = []; for (let k = 0; k <= n; k++) uv.push(0, k / n, 0.5, k / n, 1, k / n); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}
// collect transformed copies of a geometry → one mesh per material
function Bag() { const m = new Map(); return {
  put(geo, mat, pos, rot, s = 1) { const o = new THREE.Object3D(); o.position.copy(pos); o.rotation.set(rot[0], rot[1], rot[2], 'YXZ'); o.scale.setScalar(s); o.updateMatrix(); const g = geo.clone().applyMatrix4(o.matrix); const k = mat(); if (!m.has(k)) m.set(k, []); m.get(k).push(g); },
  meshes() { return [...m].map(([mt, gs]) => { const all = gs.map(g => g.index ? g.toNonIndexed() : g); all.forEach(g => { if (g.attributes.uv) return; g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); }); return new THREE.Mesh(mergeGeometries(all.map(g => { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); return g; })), mt); }); } }; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const tube = (pts, r, m) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 4), r, 6), typeof m === 'function' ? m() : m);

// ---------------- pots + plants ----------------
function pot(root, kind, x, y, z, r, h) {
  const P = { cream: [CREAM_POT, [[0, 0], [r * 0.78, 0], [r * 0.95, h * 0.5], [r, h], [r * 0.92, h], [0, h * 0.97]]], white: [WHITE_POT, [[0, 0], [r * 0.55, 0], [r * 0.95, h * 0.35], [r, h * 0.6], [r * 0.85, h], [r * 0.78, h], [0, h * 0.97]]],
    dark: [DARK_POT, [[0, 0], [r * 0.7, 0], [r, h * 0.7], [r * 0.98, h], [r * 0.9, h], [0, h * 0.97]]], terra: [TERRA, [[0, 0], [r * 0.75, 0], [r, h * 0.85], [r * 1.04, h], [r * 0.94, h], [0, h * 0.97]]] }[kind];
  root.add(lathe(P[1], P[0], x, y, z, 36)); root.add(cyl(r * 0.9, r * 0.9, 0.004, SOIL, x, y + h * 0.92, z, 20)); return y + h * 0.93;
}
const FIG_LEAF = blade(0.3, 0.2, { fold: 0.12, bend: -0.1, shape: t => Math.pow(Math.sin(Math.PI * Math.min(1, t)), 0.6) * (0.55 + 0.45 * t) });
function fiddleFig(root, x, z, h) {
  const top = pot(root, 'cream', x, FL, z, 0.19, 0.42), b = Bag();
  const trunk = [V(x, top, z), V(x + 0.03, top + h * 0.4, z - 0.02), V(x - 0.02, top + h * 0.75, z + 0.01), V(x + 0.01, top + h, z)]; root.add(tube(trunk, 0.018, BARK));
  for (let k = 0; k < 34; k++) { const t = 0.35 + 0.65 * k / 34, a = k * 2.4, y = top + h * t; b.put(FIG_LEAF, k % 3 ? LEAF : LEAF2, V(x + Math.cos(a) * 0.03, y, z + Math.sin(a) * 0.03), [-(0.6 + rnd() * 0.5), a, 0], 0.8 + rnd() * 0.5 - t * 0.2); }
  b.meshes().forEach(m => root.add(m));
}
function snakePlant(root, x, y, z, h, n, potKind = 'cream', r = 0.09, ph = 0.16) {
  const top = potKind ? pot(root, potKind, x, y, z, r, ph) : y, b = Bag();
  for (let k = 0; k < n; k++) { const a = k * 2.4 + rnd(), L = h * (0.6 + rnd() * 0.4); b.put(blade(L, 0.055 + rnd() * 0.02, { fold: 0.35, bend: 0.06, shape: t => t < 0.85 ? 0.7 + 0.3 * Math.sin(t * 3) : (1 - t) / 0.15 }), SNAKE, V(x + Math.cos(a) * r * 0.4, top - 0.01, z + Math.sin(a) * r * 0.4), [-(0.05 + rnd() * 0.2), a, (rnd() - 0.5) * 0.15]); }
  b.meshes().forEach(m => root.add(m));
}
function birdOfParadise(root, x, z, h) {
  const top = pot(root, 'white', x, FL, z, 0.21, 0.4), b = Bag(), stems = [];
  const PADDLE = blade(0.62, 0.26, { fold: 0.1, bend: 0.12, n: 10, shape: t => Math.pow(Math.sin(Math.PI * t), 0.7) });
  for (let k = 0; k < 8; k++) { const a = k * 2.3 + rnd() * 0.3, tilt = 0.12 + rnd() * 0.35, sl = h * (0.45 + rnd() * 0.25), dx = Math.sin(tilt) * sl, ex = V(x + Math.cos(a) * dx, top + Math.cos(tilt) * sl, z + Math.sin(a) * dx);
    stems.push([V(x, top, z), ex]); b.put(PADDLE, k % 2 ? LEAF : LEAF2, ex, [-tilt * 1.3, Math.PI / 2 - a, 0]); }
  stems.forEach(([p, q]) => root.add(tube([p, p.clone().lerp(q, 0.5), q], 0.008, LEAF)));
  b.meshes().forEach(m => root.add(m));
}
function bushy(root, x, y, z, h, potKind, r, ph, leafL = 0.16) {
  const top = pot(root, potKind, x, y, z, r, ph), b = Bag(), L = blade(leafL, leafL * 0.6, { fold: 0.15, bend: -0.2 });
  const n = Math.round(14 + h * 30);
  for (let k = 0; k < n; k++) { const a = k * 2.39, t = k / n, rr = r * (0.3 + 0.9 * t), y2 = top + h * (0.15 + 0.75 * Math.sqrt(t)) * (0.85 + rnd() * 0.3);
    b.put(L, k % 3 ? LEAF2 : LEAF, V(x + Math.cos(a) * rr * 0.5, y2, z + Math.sin(a) * rr * 0.5), [-(0.9 + rnd() * 0.6), -a + Math.PI / 2, 0], 0.8 + rnd() * 0.5); }
  for (let k = 0; k < 5; k++) { const a = k * 1.3; root.add(tube([V(x, top, z), V(x + Math.cos(a) * r * 0.25, top + h * 0.5, z + Math.sin(a) * r * 0.25)], 0.004, LEAF)); }
  b.meshes().forEach(m => root.add(m));
}
const HEART = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.55, 0.25, 0.6, 0.85, 0.08, 1.0); s.quadraticCurveTo(0, 0.95, -0.08, 1.0); s.bezierCurveTo(-0.6, 0.85, -0.55, 0.25, 0, 0); return new THREE.ShapeGeometry(s, 5); })();
// pothos in a pot with vines hanging down the wall side (front = −z)
function pothos(root, x, y, z, { potKind = 'white', r = 0.07, ph = 0.11, vines = [[0.0, 0.5]] } = {}) {
  const top = pot(root, potKind, x, y, z, r, ph), b = Bag();
  for (let k = 0; k < 16; k++) { const a = rnd() * 6.28, rr = r * Math.sqrt(rnd()); b.put(HEART, k % 3 ? LEAF2 : LEAF, V(x + Math.cos(a) * rr, top + rnd() * 0.08, z + Math.sin(a) * rr), [-0.6 - rnd() * 0.6, -a, (rnd() - 0.5) * 0.5], 0.05 + rnd() * 0.02); }
  for (const [dx, len] of vines) { const n = Math.round(len / 0.05), pts = [V(x + dx * 0.3, top, z - r * 0.6)];
    for (let k = 0; k <= n; k++) pts.push(V(x + dx + Math.sin(k * 0.9) * 0.015, top - 0.04 - len * k / n, z - r - 0.03 + Math.sin(k * 0.6) * 0.01));
    root.add(tube(pts, 0.0018, LEAF)); pts.forEach((p, k) => { if (k) b.put(HEART, k % 2 ? LEAF2 : LEAF, V(p.x + (k % 2 ? 0.012 : -0.012), p.y - 0.012, p.z - 0.008), [0.3, Math.PI + (k % 2 ? 0.6 : -0.6), (rnd() - 0.5) * 0.4], 0.04 + rnd() * 0.015); }); }
  b.meshes().forEach(m => root.add(m));
}
function oliveTree(root, x, z, h) {
  const top = pot(root, 'cream', x, FL, z, 0.17, 0.4), b = Bag(), L = blade(0.07, 0.014, { fold: 0.2, bend: 0.1, n: 4 });
  const trunk = [V(x, top, z), V(x + 0.02, top + h * 0.35, z), V(x - 0.03, top + h * 0.6, z + 0.02)]; root.add(tube(trunk, 0.02, BARK));
  const br = []; for (let k = 0; k < 6; k++) { const a = k * 1.1, s = V(x - 0.03, top + h * (0.55 + k * 0.05), z + 0.02), e = V(x - 0.06 + Math.cos(a) * 0.24, top + h * (0.75 + rnd() * 0.25), z + Math.sin(a) * 0.2); br.push([s, e]); root.add(tube([s, s.clone().lerp(e, 0.5).add(V(0, 0.05, 0)), e], 0.007, BARK)); }
  for (const [s, e] of br) for (let k = 0; k < 70; k++) { const t = 0.3 + 0.7 * rnd(), p = s.clone().lerp(e, t).add(V((rnd() - 0.5) * 0.18, (rnd() - 0.5) * 0.16, (rnd() - 0.5) * 0.18)); b.put(L, k % 2 ? OLIVELEAF : LEAF2, p, [-(rnd() * 2.5), rnd() * 6.28, rnd() - 0.5]); }
  b.meshes().forEach(m => root.add(m));
}
function branches(root, x, y, z, h, n = 7, mat = TWIG, leafy = false) {
  const b = Bag(), L = blade(0.05, 0.012, { n: 3 });
  for (let k = 0; k < n; k++) { const a = k * 2.4, tl = 0.15 + rnd() * 0.3, e = V(x + Math.cos(a) * Math.sin(tl) * h, y + Math.cos(tl) * h * (0.8 + rnd() * 0.3), z + Math.sin(a) * Math.sin(tl) * h * 0.6);
    const pts = [V(x, y, z), V(x, y, z).lerp(e, 0.5).add(V(0, 0.03, 0)), e]; root.add(tube(pts, 0.0025, mat));
    for (let j = 0; j < (leafy ? 16 : 6); j++) { const p = pts[0].clone().lerp(e, 0.35 + 0.65 * rnd()); if (leafy) b.put(L, OLIVELEAF, p, [-(rnd() * 2), rnd() * 6.28, 0]); else root.add(tube([p, p.clone().add(V((rnd() - 0.5) * 0.08, 0.05 + rnd() * 0.05, (rnd() - 0.5) * 0.05))], 0.0015, mat)); } }
  b.meshes().forEach(m => root.add(m));
}
function pampas(root, x, y, z, h) {
  for (let k = 0; k < 6; k++) { const a = k * 1.1, tl = 0.1 + rnd() * 0.3, e = V(x + Math.cos(a) * Math.sin(tl) * h, y + Math.cos(tl) * h, z + Math.sin(a) * Math.sin(tl) * h * 0.5);
    root.add(tube([V(x, y, z), e], 0.002, TWIG)); const pl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), PAMPAS()); pl.scale.set(1, 3.2, 1); pl.position.copy(e).add(V(0, 0.07, 0)); pl.rotation.z = (e.x - x) * 2; root.add(pl); }
}
// decor
const jug = (root, x, y, z, s = 1, m = TERRA) => { root.add(lathe([[0, 0], [0.045 * s, 0], [0.07 * s, 0.07 * s], [0.06 * s, 0.14 * s], [0.03 * s, 0.18 * s], [0.035 * s, 0.21 * s], [0.03 * s, 0.21 * s], [0, 0.2 * s]], m, x, y, z));
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.032 * s, 0.006 * s, 6, 16, Math.PI), typeof m === 'function' ? m() : m); t.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2; t.position.set(x + sx * 0.045 * s, y + 0.155 * s, z); root.add(t); } };
const roundVase = (root, x, y, z, s = 1, m = TERRA) => root.add(lathe([[0, 0], [0.05 * s, 0], [0.085 * s, 0.06 * s], [0.07 * s, 0.12 * s], [0.035 * s, 0.15 * s], [0.04 * s, 0.16 * s], [0, 0.155 * s]], m, x, y, z));
const bottleVase = (root, x, y, z, s = 1, m = DARK_POT) => root.add(lathe([[0, 0], [0.05 * s, 0], [0.065 * s, 0.1 * s], [0.055 * s, 0.2 * s], [0.025 * s, 0.25 * s], [0.028 * s, 0.28 * s], [0, 0.275 * s]], m, x, y, z));
function books(root, x, y, z, n, { flat = false, w = 0.22, d = 0.16 } = {}) {
  let cx = x; for (let k = 0; k < n; k++) { const th = 0.02 + rnd() * 0.02, hh = flat ? th : 0.19 + rnd() * 0.06; if (flat) root.add(wb(x - w / 2 + (rnd() - 0.5) * 0.02, x + w / 2, y + k * th * 1.01, y + (k + 1) * th, z - d, z, BOOKS[k % 4]));
    else { root.add(wb(cx, cx + th, y, y + hh, z - d, z, BOOKS[k % 4])); cx += th + 0.002; } }
}
function frameArt(root, x, y, z, w, h, draw, frame = BLACK) {
  root.add(wb(x - w / 2, x + w / 2, y, y + h, z - 0.02, z, frame)); const pl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.04, h - 0.04), new THREE.MeshStandardMaterial({ map: (() => { const c = cnv(160, Math.round(160 * h / w)); draw(c.getContext('2d'), c.width, c.height); return tex(c); })(), roughness: 0.9, name: '__tw_art_' + Math.round(x * 100) }));
  pl.rotation.y = Math.PI; pl.rotation.x = -0.18; pl.position.set(x, y + h / 2, z - 0.022); root.add(pl);
}
// downlights in the bulkhead + pools on the wall face (zFace)
function downlights(root, xs, zFace, moods) {
  const trim = std('__tw_downlight_trim', { color: 0xf0ede6, roughness: 0.5 }), dl = ledOf(moods, 0xfff0d8, 3);
  for (const x of xs) { root.add(cyl(0.045, 0.045, 0.004, trim, x, CE - 0.004, -0.13, 24)); root.add(cyl(0.032, 0.032, 0.002, dl, x, CE - 0.006, -0.13, 20));
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.5), POOL()); pm.rotation.y = Math.PI; pm.position.set(x, CE - 0.75, zFace - 0.004); root.add(pm); }
  moods.halos.push(POOL());
}
const ledOf = (moods, colour = 0xffc880, power = 2.6) => { const m = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(colour), emissiveIntensity: power, roughness: 0.6, name: 'LED' }); moods.strips.push(m); return m; };
// LED strip (x0..x1 at height y, z) with a wash on the wall going 'down'/'up' (vertical plane at zw) or 'floor'/'ceil' (horizontal towards −z)
function strip(root, moods, x0, x1, y, z, dir, wash, alpha = 0.5, name = '__tw_led_wash') {
  root.add(wb(x0, x1, y - 0.004, y + 0.004, z - 0.006, z + 0.006, ledOf(moods)));
  const seg = 24, pos = [], col = [], idx = [];
  for (let k = 0; k <= seg; k++) { const x = x0 + (x1 - x0) * k / seg, e = Math.min(1, Math.min(k, seg - k) / 3);
    if (dir === 'down' || dir === 'up') pos.push(x, y, z, x, y + (dir === 'up' ? wash : -wash), z); else pos.push(x, y, z, x, y, z - wash);
    col.push(1, 1, 1, alpha * e, 1, 1, 1, 0); if (k < seg) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx);
  const gm = glowMat(name); if (!moods.halos.includes(gm)) moods.halos.push(gm); root.add(new THREE.Mesh(g, gm));
}
// warm glow on the main ceiling from the cove slot above the existing bulkhead (no ceiling rebuild)
const cove = (root, moods) => strip(root, moods, X0 + 0.05, X1 - 0.2, 3.036, -0.235, 'ceil', 0.6, 0.5, '__tw_cove_wash');
// slats: n vertical battens across x0..x1 from y0 to y1, depth d in front of zb, on a dark backer when backer = true
function slats(root, x0, x1, y0, y1, zb, { w = 0.03, gap = 0.015, d = 0.02, m = WAL, backer = true } = {}) {
  if (backer) root.add(wb(x0, x1, y0, y1, zb - 0.008, zb, DARKGAP));
  const z0 = zb - (backer ? 0.008 : 0), n = Math.floor((x1 - x0 + gap) / (w + gap)), off = (x1 - x0 - (n * (w + gap) - gap)) / 2;
  for (let k = 0; k < n; k++) { const a = x0 + off + k * (w + gap); root.add(wb(a, a + w, y0, y1, z0 - d, z0, m)); }
}
// floating / legged console: sections from WEST (x0) to EAST; types door | drawer | niche (open over a drawer) | open | drawers3
function consoleUnit(root, { x0, x1, y0, h, d = 0.42, zb = WF, body = OAKL, front = body, sections, gap = 0.003, frontFn, top = body }) {
  const zf = zb - d, t = 0.018, tot = sections.reduce((a, s) => a + s.w, 0), W = x1 - x0;
  root.add(wb(x0, x1, y0 + h - t, y0 + h, zf, zb, top)); root.add(wb(x0, x1, y0, y0 + t, zf + 0.01, zb, body));
  root.add(wb(x0, x0 + t, y0, y0 + h, zf, zb, body)); root.add(wb(x1 - t, x1, y0, y0 + h, zf, zb, body)); root.add(wb(x0 + t, x1 - t, y0 + t, y0 + h - t, zb - 0.01, zb, DARKGAP));
  let x = x0 + t; const ib = y0 + t, ih = h - 2 * t, fz = zf;   // fronts lie in the carcass opening, flush with its front
  const mk = (fx0, fx1, fy0, fy1, extra) => { const g2 = new THREE.Group(); if (frontFn) frontFn(g2, fx0, fx1, fy0, fy1, fz); else g2.add(wb(fx0, fx1, fy0, fy1, fz, fz + 0.018, front)); if (extra) extra(g2); return g2; };
  sections.forEach((s, i) => {
    const w = s.w / tot * (W - 2 * t), xa = x, xb = x + w; x = xb;
    if (i < sections.length - 1) root.add(wb(xb - t / 2, xb + t / 2, ib, ib + ih, fz + 0.02, zb - 0.01, body));
    const a = xa + gap, b = xb - gap, pull = (g2, fx0, fx1, fy0, fy1) => { if (s.pull) s.pull(g2, fx0, fx1, fy0, fy1, fz); };
    if (s.type === 'door') { const hingeE = s.hinge === 'e', hx = hingeE ? b : a, g2 = mk(a, b, ib + gap, ib + ih - gap, g3 => pull(g3, a, b, ib, ib + ih));
      g2.children.forEach(c => c.position.x -= hx); g2.position.x = hx; g2.children.forEach(c => c.position.z -= fz); g2.position.z = fz;
      root.add(mover(g2, { type: 'cab', hinge: [hx, 0, fz], a1: hingeE ? -Math.PI / 2 : Math.PI / 2, label: s.label || 'console door' })); return; }
    const drawer = (fy0, fy1) => { const g2 = mk(a, b, fy0, fy1, g3 => { pull(g3, a, b, fy0, fy1); g3.add(wb(a + 0.03, b - 0.03, fy0 + 0.01, fy0 + 0.02, fz + 0.02, zb - 0.04, body)); g3.add(wb(a + 0.03, b - 0.03, fy0 + 0.01, fy1 - 0.04, zb - 0.05, zb - 0.04, body)); });
      root.add(mover(g2, { type: 'slide', slide: [0, 0, -Math.min(0.32, d - 0.08)], label: s.label || 'console drawer' })); };
    if (s.type === 'drawer') drawer(ib + gap, ib + ih - gap);
    else if (s.type === 'drawers3') { const dh = ih / 3; for (let k = 0; k < 3; k++) drawer(ib + k * dh + gap, ib + (k + 1) * dh - gap); }
    else if (s.type === 'niche') { const split = ib + ih * 0.45; root.add(wb(xa, xb, split, split + t, fz + 0.02, zb - 0.01, body)); drawer(ib + gap, split - gap); s.fill && s.fill(xa, xb, split + t, ib + ih, fz); }
    else if (s.type === 'open') { s.fill && s.fill(xa, xb, ib, ib + ih, fz); }
  });
  return { zf, top: y0 + h };
}

/* ======================= designs ======================= */
export function buildTvWall(ctx, style) {
  const T = ctx.THREE, moods = { strips: [], halos: [], glow: [] }, G = () => new T.Group();
  seed = 11 + style.length;
  // retire today's TV wall (microcement, niche pillar, walnut console + drawers, shelf, soundbar, set-top box, decor)
  ctx.find(TVWALL_HIDE).forEach(ctx.hide);
  ctx.hideMovers(/approved-h2-walnut/);
  const tvs = ctx.find(/^approved-h2-(65-inch|tv#1)/);
  const moveTV = (x, zBack) => ctx.rigid(tvs, TV0, { x, z: zBack + 0.02 }, 0);   // v1 TV back face sits at z −0.02
  const add = (name, o, label, opt = {}) => ctx.add(name, { obj: o }, 0, 0, 0, { name: label, ...opt });
  const wall = G(), cons = G(), shel = G(), deco = G();

  if (style === 'terracotta-olive-arch') {
    const TVX = 8.45, AX0 = 7.10, AX1 = 8.10, SPR = 2.03, AR = (AX1 - AX0) / 2;
    wall.add(wb(X0, X1, FL, CE, WF, 0, plasterMat('__tw_terracotta_limewash', '178,86,58', 34, 3)));
    // olive painted arch: 6 mm panel, floor → 2.53 m
    const sh = new T.Shape(); sh.moveTo(AX0, FL); sh.lineTo(AX1, FL); sh.lineTo(AX1, SPR); sh.absarc((AX0 + AX1) / 2, SPR, AR, 0, Math.PI, false); sh.lineTo(AX0, FL);
    const am = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false, curveSegments: 40 }), OLIVE()); am.position.z = WF - 0.006; wall.add(am);
    // nine olive battens from inside the arch dome to the ceiling (west half + past the west edge), a full-height edge batten,
    // and a shorter group lower on the arch (between the console top and the TV's west edge)
    slats(wall, 6.97, 7.56, SPR + 0.12, CE, WF - 0.006, { w: 0.035, gap: 0.03, d = 0.022, m: OLIVE, backer: false });
    wall.add(wb(6.93, 6.965, 0.64, CE, WF - 0.028, WF, OLIVE));
    slats(wall, 7.16, 7.66, 0.64, 1.60, WF - 0.006, { w: 0.035, gap: 0.03, d: 0.022, m: OLIVE, backer: false });
    moveTV(TVX, WF - 0.03);
    // console 2.6 m: door | niche over drawer | niche over drawer | door (west → east), floating at 0.22
    const fillN = (xa, xb, y0) => books(cons, (xa + xb) / 2 - 0.12, y0, -0.12, 3, { flat: true, w: 0.26, d: 0.2 });
    const c = consoleUnit(cons, { x0: 7.05, x1: 9.65, y0: 0.22, h: 0.42, body: OAKL, sections: [{ w: 0.62, type: 'door', hinge: 'w' }, { w: 0.68, type: 'niche', fill: (a, b, y) => fillN(a, b, y) }, { w: 0.68, type: 'niche', fill: (a, b, y) => fillN(a, b, y) }, { w: 0.62, type: 'door', hinge: 'e' }] });
    jug(deco, 9.42, c.top, -0.25, 1.15); roundVase(deco, 9.2, c.top, -0.22, 0.9, STONEW); jug(deco, 7.55, c.top, -0.22, 0.8);
    snakePlant(deco, 7.28, c.top, -0.22, 0.42, 9, 'cream', 0.075, 0.13);
    // two floating oak shelves (east), 0.8 × 0.24
    for (const y of [1.66, 2.03]) shel.add(wb(9.25, 10.05, y, y + 0.035, WF - 0.24, WF, OAKL));
    jug(shel, 9.48, 2.065, -0.17, 1.1); jug(shel, 9.64, 2.065, -0.17, 0.95);
    pothos(shel, 9.9, 2.065, -0.15, { potKind: 'terra', r: 0.065, ph: 0.1, vines: [[0.08, 0.75], [-0.02, 0.45]] });
    books(shel, 9.3, 1.695, -0.1, 7); shel.add(lathe([[0, 0], [0.04, 0], [0.05, 0.05], [0, 0.1]], STONEW(), 9.52, 1.695, -0.15)); books(shel, 9.75, 1.695, -0.08, 3, { flat: true, w: 0.2, d: 0.15 }); shel.add(cyl(0.03, 0.03, 0.07, CLEAR(), 9.9, 1.695 + 0.06, -0.15));
    const fig = G(); fiddleFig(fig, 9.97, -0.45, 1.55); add('tw-fig', loose(fig), 'Fiddle-leaf fig in a cream planter', { loose: true });
    const sn = G(); snakePlant(sn, 6.97, FL, -0.62, 0.85, 12, 'cream', 0.15, 0.32); add('tw-snake', loose(sn), 'Snake plant, cream floor pot', { loose: true });
    add('tw-wall', wall, 'TV wall · terracotta limewash, olive arch + olive battens');
  } else if (style === 'white-stone-ledge') {
    const TVX = 8.55, SF = WF - 0.022;      // stone face (relief reaches ≈ 22 mm proud of the base)
    wall.add(stoneWall(T));
    downlights(wall, [7.3, 8.05, 8.85, 9.65], SF, moods); cove(wall, moods);
    moveTV(TVX, SF - 0.004);
    // shelf 2.4 m above the TV + LED wash down the stone
    shel.add(wb(7.35, 9.75, 2.18, 2.23, SF - 0.25, SF, OAKL)); strip(shel, moods, 7.4, 9.7, 2.175, SF - 0.2, 'down', 0.01, 0); strip(shel, moods, 7.4, 9.7, 2.175, SF - 0.005, 'down', 0.75, 0.55);
    frameArt(shel, 8.2, 2.23, SF - 0.05, 0.32, 0.42, (x, w, h) => { x.fillStyle = '#f4f2ee'; x.fillRect(0, 0, w, h); x.strokeStyle = '#555'; x.lineWidth = 2; x.beginPath(); x.moveTo(w * 0.2, h * 0.7); x.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.8, h * 0.6); x.stroke(); });
    frameArt(shel, 8.58, 2.23, SF - 0.03, 0.28, 0.36, (x, w, h) => { x.fillStyle = '#efece6'; x.fillRect(0, 0, w, h); x.fillStyle = '#9a948a'; x.beginPath(); x.arc(w * 0.5, h * 0.45, w * 0.22, 0, 7); x.fill(); });
    for (const [x, s] of [[7.6, 1], [7.68, 0.7], [9.3, 0.8]]) { const st = new T.Mesh(new T.SphereGeometry(0.04 * s, 14, 10), STONEW()); st.scale.y = 0.6; st.position.set(x, 2.23 + 0.024 * s, SF - 0.12); shel.add(st); }
    shel.add(lathe([[0, 0], [0.03, 0], [0.07, 0.04], [0.068, 0.045], [0, 0.01]], STONEW(), 9.5, 2.23, -0.17)); shel.add(wb(9.12, 9.22, 2.23, 2.29, -0.19, -0.11, OLIVE));
    // console 2.6 m, five flush fronts (west → east)
    const c = consoleUnit(cons, { x0: 7.25, x1: 9.85, y0: 0.24, h: 0.36, zb: SF, body: OAKL, gap: 0.004, sections: [{ w: 0.62, type: 'door', hinge: 'w' }, { w: 0.4, type: 'drawer' }, { w: 0.4, type: 'drawer' }, { w: 0.58, type: 'door', hinge: 'e' }, { w: 0.6, type: 'door', hinge: 'e' }] });
    bottleVase(deco, 9.32, c.top, -0.2, 0.9); books(deco, 9.42, c.top, -0.1, 4); books(deco, 7.62, c.top, -0.12, 2, { flat: true, w: 0.24, d: 0.17 }); deco.add(wb(7.55, 7.68, c.top + 0.04, c.top + 0.09, -0.19, -0.1, BLACK));
    const bp = G(); birdOfParadise(bp, 10.0, -0.65, 1.45); add('tw-bird-of-paradise', loose(bp), 'Bird-of-paradise, white round pot', { loose: true });
    const lf = G(); bushy(lf, 7.04, FL, -0.38, 0.9, 'dark', 0.16, 0.34, 0.24); add('tw-leafy-plant', loose(lf), 'Leafy plant, dark pot', { loose: true });
    add('tw-wall', wall, 'TV wall · white stacked ledge stone, downlights, cove glow');
  } else if (style === 'walnut-slat-warm') {
    const TVX = 8.8;
    wall.add(wb(X0, X1, FL, CE, WF, 0, plasterMat('__tw_ivory_plaster', '232,224,208', 12, 1.5)));
    slats(wall, X0, 7.67, FL, CE, WF, { w: 0.03, gap: 0.015, d: 0.022 });
    // brass globe sconce on the slats
    const sz = WF - 0.03; wall.add(cyl(0.035, 0.035, 0.012, BRASS, 7.25, 0, sz, 24)); wall.children.at(-1).rotation.x = Math.PI / 2; wall.children.at(-1).position.set(7.25, 1.72, sz - 0.006);
    wall.add(wb(7.243, 7.257, 1.66, 1.72, sz - 0.12, sz - 0.01, BRASS)); const gl = new T.Mesh(new T.SphereGeometry(0.075, 28, 20), ledOf(moods, 0xffe2b8, 1.4)); gl.material.color.set(0xf4ece0); gl.position.set(7.25, 1.79, sz - 0.12); wall.add(gl);
    const hl = new T.Mesh(new T.PlaneGeometry(0.7, 0.7), HALO()); hl.rotation.y = Math.PI; hl.position.set(7.25, 1.79, sz - 0.004); wall.add(hl); moods.halos.push(HALO());
    downlights(wall, [8.1, 9.5], WF, moods); cove(wall, moods);
    moveTV(TVX, WF - 0.004);
    // console with rounded ends (front elevation pill corners r 0.12) + fluted centre doors
    const cx0 = 7.72, cx1 = 9.97, cy0 = 0.26, ch = 0.42, cd = 0.4, rr = 0.12, zf = WF - cd;
    const prof = new T.Shape(); prof.moveTo(cx0 + rr, cy0); prof.lineTo(cx1 - rr, cy0); prof.absarc(cx1 - rr, cy0 + rr, rr, -Math.PI / 2, 0); prof.lineTo(cx1, cy0 + ch - rr); prof.absarc(cx1 - rr, cy0 + ch - rr, rr, 0, Math.PI / 2); prof.lineTo(cx0 + rr, cy0 + ch); prof.absarc(cx0 + rr, cy0 + ch - rr, rr, Math.PI / 2, Math.PI); prof.lineTo(cx0, cy0 + rr); prof.absarc(cx0 + rr, cy0 + rr, rr, Math.PI, Math.PI * 1.5);
    const hole = new T.Path(), ix0 = cx0 + 0.04, ix1 = cx1 - 0.04, iy0 = cy0 + 0.03, iy1 = cy0 + ch - 0.03, ir = rr - 0.035;
    hole.moveTo(ix0 + ir, iy0); hole.lineTo(ix1 - ir, iy0); hole.absarc(ix1 - ir, iy0 + ir, ir, -Math.PI / 2, 0); hole.lineTo(ix1, iy1 - ir); hole.absarc(ix1 - ir, iy1 - ir, ir, 0, Math.PI / 2); hole.lineTo(ix0 + ir, iy1); hole.absarc(ix0 + ir, iy1 - ir, ir, Math.PI / 2, Math.PI); hole.lineTo(ix0, iy0 + ir); hole.absarc(ix0 + ir, iy0 + ir, ir, Math.PI, Math.PI * 1.5);
    prof.holes.push(hole); const shell = new T.Mesh(new T.ExtrudeGeometry(prof, { depth: cd, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2, curveSegments: 14 }), WAL()); shell.position.z = zf; cons.add(shell);
    cons.add(wb(ix0, ix1, iy0, iy1, WF - 0.01, WF, DARKGAP)); cons.add(wb(ix0, ix1, iy0, iy0 + 0.015, zf + 0.02, WF, WAL));
    const dw = 0.55, flutedFront = (g2, a, b, y0, y1) => { g2.add(wb(a, b, y0, y1, zf + 0.012, zf + 0.026, DARKGAP)); slats(g2, a + 0.01, b - 0.01, y0 + 0.01, y1 - 0.01, zf + 0.012, { w: 0.022, gap: 0.012, d: 0.012, backer: false }); };
    const door = (a, b, hingeE, fn, label) => { const hx = hingeE ? b : a, g2 = new T.Group(); if (fn) fn(g2, a, b, iy0 + 0.004, iy1 - 0.004); else g2.add(wb(a, b, iy0 + 0.004, iy1 - 0.004, zf + 0.004, zf + 0.022, WAL));
      g2.children.forEach(ch2 => { ch2.position.x -= hx; ch2.position.z -= zf; }); g2.position.set(hx, 0, zf); cons.add(mover(g2, { type: 'cab', hinge: [hx, 0, zf], a1: hingeE ? -Math.PI / 2 : Math.PI / 2, label })); };
    door(ix0 + 0.06, ix0 + 0.06 + dw, false, null, 'console door (west)'); door(ix1 - 0.06 - dw, ix1 - 0.06, true, null, 'console door (east)');
    const m0 = ix0 + 0.06 + dw + 0.004, m1 = ix1 - 0.06 - dw - 0.004, mm = (m0 + m1) / 2;
    door(m0, mm - 0.002, false, flutedFront, 'fluted door'); door(mm + 0.002, m1, true, flutedFront, 'fluted door');
    // the rounded end bays (inside the curve) are fixed walnut panels
    for (const [a, b] of [[ix0, ix0 + 0.06], [ix1 - 0.06, ix1]]) cons.add(wb(a, b, iy0, iy1, zf + 0.004, zf + 0.022, WAL));
    for (const [a, b] of [[m0 - 0.004, m0 - 0.0], [m1, m1 + 0.004]]) cons.add(wb(a, b, iy0, iy1, zf + 0.02, WF, DARKGAP));
    strip(cons, moods, cx0 + 0.15, cx1 - 0.15, cy0 - 0.004, zf + 0.06, 'floor', 0.0, 0, '__tw_core'); strip(cons, moods, cx0 + 0.1, cx1 - 0.1, FL + 0.003, WF, 'floor', 0.75, 0.6, '__tw_floor_wash');
    const top = cy0 + ch + 0.006;
    // console styling: pampas in smoky glass (east), diffuser + book, linen lamp, brass balls, dark vase with dried branches (west)
    deco.add(lathe([[0, 0], [0.06, 0], [0.07, 0.08], [0.045, 0.16], [0.04, 0.18], [0, 0.17]], SMOKE(), 9.72, top, -0.22)); pampas(deco, 9.72, top + 0.17, -0.22, 0.35);
    deco.add(cyl(0.028, 0.03, 0.09, SMOKE(), 9.55, top, -0.17)); for (let k = 0; k < 6; k++) { const s = cyl(0.0018, 0.0018, 0.22, TWIG, 9.55 + (k - 2.5) * 0.006, top + 0.08, -0.17, 4); s.rotation.z = (k - 2.5) * 0.08; deco.add(s); }
    books(deco, 9.45, top, -0.08, 1, { flat: true, w: 0.22, d: 0.15 });
    deco.add(lathe([[0, 0], [0.05, 0], [0.085, 0.06], [0.07, 0.15], [0.02, 0.18], [0, 0.18]], STONEW(), 8.18, top, -0.22));
    const shade = new T.Mesh(new T.CylinderGeometry(0.1, 0.13, 0.17, 32, 1, true), new T.MeshStandardMaterial({ name: '__tw_linen_shade', color: 0xeadcc2, emissive: new T.Color(0xffc890), emissiveIntensity: 0.9, side: T.DoubleSide, roughness: 0.9 })); moods.strips.push(shade.material);
    shade.position.set(8.18, top + 0.26, -0.22); deco.add(shade); deco.add(cyl(0.006, 0.006, 0.06, BRASS, 8.18, top + 0.17, -0.22));
    const lh = new T.Mesh(new T.PlaneGeometry(0.8, 0.8), HALO()); lh.rotation.y = Math.PI; lh.position.set(8.18, top + 0.26, WF - 0.003); deco.add(lh);
    for (const [x, r] of [[8.0, 0.03], [7.94, 0.026]]) { const s = new T.Mesh(new T.SphereGeometry(r, 18, 12), GOLD()); s.position.set(x, top + r, -0.12); deco.add(s); }
    bottleVase(deco, 7.88, top, -0.24, 1.05); branches(deco, 7.88, top + 0.28, -0.24, 0.42, 7);
    // three floating walnut shelves in the east corner + LED under each (wash down the plaster)
    for (const y of [1.30, 1.72, 2.14]) { shel.add(wb(9.62, 10.12, y, y + 0.035, WF - 0.24, WF, WAL)); strip(shel, moods, 9.65, 10.09, y - 0.004, WF - 0.2, 'down', 0.0, 0, '__tw_core'); strip(shel, moods, 9.65, 10.09, y - 0.004, WF - 0.004, 'down', 0.38, 0.55); }
    books(shel, 9.66, 2.175, -0.1, 6); deco.add(lathe([[0, 0], [0.035, 0], [0.05, 0.05], [0.03, 0.1], [0.012, 0.13], [0, 0.13]], WHITE_POT(), 9.98, 2.175, -0.15));
    pothos(shel, 9.85, 2.175, -0.16, { r: 0.06, ph: 0.09, vines: [[0.12, 0.8], [0.02, 0.5]] });
    books(shel, 9.66, 1.755, -0.1, 5); shel.add(cyl(0.025, 0.025, 0.05, CLEAR(), 9.9, 1.755, -0.15)); bushy(shel, 10.0, 1.755, -0.15, 0.16, 'white', 0.06, 0.1, 0.08);
    books(shel, 9.66, 1.335, -0.1, 4); bushy(shel, 9.95, 1.335, -0.15, 0.2, 'cream', 0.065, 0.12, 0.09);
    add('tw-wall', wall, 'TV wall · ivory plaster, walnut slat panel + brass globe sconce, cove + downlights');
  } else if (style === 'oak-fluted-tower') {
    const TVX = 8.85;
    wall.add(wb(X0, X1, FL, CE, WF, 0, plasterMat('__tw_greige_plaster', '196,184,168', 14, 1.5))); cove(wall, moods);
    moveTV(TVX, WF - 0.004);
    // legged sideboard 2.0 m, four fluted doors
    const lx0 = 7.92, lx1 = 9.92, legH = 0.13, body = 0.4, cd = 0.42, ly0 = FL + legH;
    const fl = (g2, a, b, y0, y1, fz) => { g2.add(wb(a, b, y0, y1, fz + 0.008, fz + 0.022, OAKL)); const n = Math.floor((b - a - 0.01) / 0.024); for (let k = 0; k < n; k++) { const cxk = a + 0.005 + 0.012 + k * ((b - a - 0.01) / n), cy2 = new T.Mesh(new T.CylinderGeometry(0.011, 0.011, y1 - y0 - 0.01, 10, 1, false, Math.PI / 2, Math.PI), OAKL()); cy2.position.set(cxk, (y0 + y1) / 2, fz + 0.008); g2.add(cy2); } };
    const c = consoleUnit(cons, { x0: lx0, x1: lx1, y0: ly0, h: body, d: cd, body: OAKL, frontFn: fl, sections: [{ w: 1, type: 'door', hinge: 'w' }, { w: 1, type: 'door', hinge: 'e' }, { w: 1, type: 'door', hinge: 'w' }, { w: 1, type: 'door', hinge: 'e' }] });
    for (const [x, z] of [[lx0 + 0.07, WF - 0.06], [lx1 - 0.07, WF - 0.06], [lx0 + 0.07, WF - cd + 0.06], [lx1 - 0.07, WF - cd + 0.06]]) { const lg = cyl(0.012, 0.02, legH, OAKL, x, FL, z, 12); lg.rotation.x = z < WF - 0.2 ? 0.1 : -0.1; cons.add(lg); }
    deco.add(wb(TVX - 0.45, TVX + 0.45, c.top, c.top + 0.07, -0.2, -0.1, BLACK));
    deco.add(cyl(0.04, 0.04, 0.09, CLEAR(), 9.75, c.top, -0.2)); deco.add(cyl(0.034, 0.034, 0.07, std('__tw_candle', { color: 0xf3ead8, emissive: 0x332211 }), 9.75, c.top + 0.004, -0.2)); const fla = new T.Mesh(new T.SphereGeometry(0.006, 8, 6), ledOf(moods, 0xffb060, 3)); fla.scale.y = 2; fla.position.set(9.75, c.top + 0.085, -0.2); deco.add(fla);
    roundVase(deco, 8.05, c.top, -0.22, 1.4, STONEW); branches(deco, 8.05, c.top + 0.2, -0.22, 0.4, 6, TWIG, true);
    // floor-to-ceiling open oak tower (west end, 0.85 × 0.35): 2-door cupboard + four lit shelves
    const tx0 = 6.84, tx1 = 7.69, td = 0.35, tz = WF - td, t = 0.022, tw = std('__tw_tower_back', { color: 0xb89a74, roughness: 0.7 });
    shel.add(wb(tx0, tx0 + t, FL, CE, tz, WF, OAKL)); shel.add(wb(tx1 - t, tx1, FL, CE, tz, WF, OAKL)); shel.add(wb(tx0 + t, tx1 - t, CE - t, CE, tz, WF, OAKL)); shel.add(wb(tx0 + t, tx1 - t, FL, CE, WF - 0.01, WF, tw)); shel.add(wb(tx0 + t, tx1 - t, FL, FL + 0.06, tz + 0.02, WF, OAKL));
    const cb = 0.82, ys = [cb, 1.33, 1.84, 2.35];
    for (const y of ys) { shel.add(wb(tx0 + t, tx1 - t, y, y + t, tz, WF, OAKL)); }
    for (let k = 0; k < 4; k++) { const y1 = (ys[k + 1] || CE - t); strip(shel, moods, tx0 + 0.04, tx1 - 0.04, y1 - 0.006, tz + 0.04, 'down', 0.0, 0, '__tw_core'); strip(shel, moods, tx0 + 0.04, tx1 - 0.04, y1 - 0.006, WF - 0.012, 'down', 0.4, 0.5); }
    const tdw = (tx1 - tx0 - 2 * t) / 2;
    for (const [a, b, he] of [[tx0 + t, tx0 + t + tdw, false], [tx0 + t + tdw, tx1 - t, true]]) { const hx = he ? b - 0.002 : a + 0.002, g2 = new T.Group(); g2.add(wb(a + 0.002 - hx, b - 0.002 - hx, FL + 0.065, cb - 0.003, 0, 0.02, OAKL)); g2.position.set(hx, 0, tz); cons.add(mover(g2, { type: 'cab', hinge: [hx, 0, tz], a1: he ? -Math.PI / 2 : Math.PI / 2, label: 'tower cupboard' })); }
    const sy = ys.map(y => y + t);
    books(shel, 7.36, sy[3], -0.12, 6); bushy(shel, 7.05, sy[3], -0.2, 0.15, 'cream', 0.06, 0.1, 0.07);
    roundVase(shel, 7.45, sy[2], -0.2, 1.1, STONEW); books(shel, 6.9, sy[2], -0.12, 4);
    books(shel, 7.38, sy[1], -0.12, 5); bushy(shel, 7.1, sy[1], -0.2, 0.18, 'cream', 0.065, 0.11, 0.08);
    bushy(shel, 7.45, sy[0], -0.2, 0.16, 'cream', 0.065, 0.12, 0.08); roundVase(shel, 7.08, sy[0], -0.2, 0.9, STONEW);
    const ol = G(); oliveTree(ol, 10.0, -0.7, 1.65); add('tw-olive', loose(ol), 'Olive tree, cream pot', { loose: true });
    add('tw-wall', wall, 'TV wall · greige plaster, cove glow');
  } else if (style === 'walnut-white-frame') {
    const UX0 = 7.2, UX1 = 9.9, TVX = 8.55, PL = 0.1, CAB = 0.78, CTOP = 0.62;
    wall.add(wb(X0, X1, FL, CE, WF, 0, plasterMat('__tw_greige_plaster', '196,184,168', 14, 1.5)));
    const GRV = () => std('__tw_white_groove', { color: 0xffffff, roughness: 0.3, map: once('t_grv', () => { const c = cnv(256, 512), x = c.getContext('2d'); x.fillStyle = '#f2efea'; x.fillRect(0, 0, 256, 512); x.strokeStyle = 'rgba(150,145,138,0.55)'; x.lineWidth = 2;
      for (let y = 0; y < 512; y += 18) { x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke(); } x.lineWidth = 4; x.strokeStyle = 'rgba(120,115,108,0.7)'; x.beginPath(); x.moveTo(256, 0); x.lineTo(150, 256); x.lineTo(256, 512); x.stroke(); return tex(c); }) });
    const bar = (g2, a, b, y0, y1, fz, vertical, hingeE) => { const px = hingeE ? a + 0.04 : b - 0.04; if (vertical) g2.add(wb(px - 0.006, px + 0.006, (y0 + y1) / 2 - 0.09, (y0 + y1) / 2 + 0.09, fz - 0.025, fz, BLACK)); else g2.add(wb((a + b) / 2 - 0.08, (a + b) / 2 + 0.08, y1 - 0.05, y1 - 0.038, fz - 0.025, fz, BLACK)); };
    // plinth + end cabinets + centre bay (open media shelf over three drawers)
    cons.add(wb(UX0 + 0.03, UX1 - 0.03, FL, FL + PL, WF - 0.4, WF, WAL));
    const cabFront = (hE) => (g2, a, b, y0, y1, fz) => { g2.add(wb(a, b, y0, y1, fz, fz + 0.018, GRV)); bar(g2, a, b, y0, y1, fz, true, hE); };
    consoleUnit(cons, { x0: UX0, x1: UX0 + 0.62, y0: FL + PL, h: CAB, d: 0.42, body: WHITE_LAC, top: WAL, frontFn: cabFront(true), sections: [{ w: 1, type: 'door', hinge: 'w' }] });
    consoleUnit(cons, { x0: UX1 - 0.62, x1: UX1, y0: FL + PL, h: CAB, d: 0.42, body: WHITE_LAC, top: WAL, frontFn: cabFront(false), sections: [{ w: 1, type: 'door', hinge: 'e' }] });
    cons.add(wb(UX0 - 0.02, UX0 + 0.64, FL + PL + CAB, FL + PL + CAB + 0.04, WF - 0.44, WF, WAL)); cons.add(wb(UX1 - 0.64, UX1 + 0.02, FL + PL + CAB, FL + PL + CAB + 0.04, WF - 0.44, WF, WAL));
    const mx0 = UX0 + 0.62, mx1 = UX1 - 0.62, dfront = (g2, a, b, y0, y1, fz) => { g2.add(wb(a, b, y0, y1, fz, fz + 0.018, GRV)); g2.add(wb((a + b) / 2 - 0.07, (a + b) / 2 + 0.07, y1 - 0.045, y1 - 0.035, fz - 0.02, fz, GOLD)); };
    const dh = 0.24; consoleUnit(cons, { x0: mx0, x1: mx1, y0: FL + PL, h: dh, d: 0.4, body: WHITE_LAC, frontFn: dfront, sections: [{ w: 1, type: 'drawer' }, { w: 1, type: 'drawer' }, { w: 1, type: 'drawer' }] });
    const oy = FL + PL + dh; cons.add(wb(mx0, mx1, oy, oy + 0.24, WF - 0.012, WF, WHITE_LAC)); for (const x of [mx0 + 0.49, mx1 - 0.49]) cons.add(wb(x - 0.009, x + 0.009, oy, oy + 0.24, WF - 0.4, WF, WHITE_LAC));
    const tt = oy + 0.24; cons.add(wb(mx0 - 0.02, mx1 + 0.02, tt, tt + 0.04, WF - 0.44, WF, WAL));
    strip(cons, moods, mx0 + 0.03, mx1 - 0.03, tt - 0.006, WF - 0.37, 'down', 0.0, 0, '__tw_core'); strip(cons, moods, mx0 + 0.03, mx1 - 0.03, tt - 0.006, WF - 0.014, 'down', 0.22, 0.5);
    for (const [x, w] of [[mx0 + 0.25, 0.26], [(mx0 + mx1) / 2, 0.28], [mx1 - 0.25, 0.2]]) cons.add(wb(x - w / 2, x + w / 2, oy, oy + 0.045, WF - 0.3, WF - 0.08, BLACK));
    // walnut slat ⊓ frame, recessed lit panel behind the TV, white bridge shelf, side shelves
    const SC = 0.5, BR = 2.32, TOPY = 2.6, cy0 = FL + PL + CAB + 0.04;
    slats(wall, UX0 + 0.04, UX0 + 0.04 + SC, cy0, TOPY, WF, { w: 0.03, gap: 0.016, d: 0.022 }); slats(wall, UX1 - 0.04 - SC, UX1 - 0.04, cy0, TOPY, WF, { w: 0.03, gap: 0.016, d: 0.022 });
    slats(wall, UX0 + 0.04 + SC, UX1 - 0.04 - SC, BR, TOPY, WF, { w: 0.03, gap: 0.016, d: 0.022 });
    const px0 = UX0 + 0.04 + SC, px1 = UX1 - 0.04 - SC; wall.add(wb(px0, px1, tt + 0.04, BR, WF - 0.006, WF, std('__tw_light_panel', { color: 0xf3e8d6, roughness: 0.8, emissive: 0x3a2a18 })));
    // LED perimeter glow inside the frame (sides + top), on the panel
    for (const [x, dir] of [[px0 + 0.004, 1], [px1 - 0.004, -1]]) { const pos = [], col = [], idx = [], n = 20; for (let k = 0; k <= n; k++) { const y = tt + 0.05 + (BR - tt - 0.06) * k / n, e = Math.min(1, Math.min(k, n - k) / 2); pos.push(x, y, WF - 0.008, x + dir * 0.28, y, WF - 0.008); col.push(1, 1, 1, 0.7 * e, 1, 1, 1, 0); if (k < n) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 4)); g.setIndex(idx); wall.add(new T.Mesh(g, glowMat('__tw_panel_glow'))); wall.add(wb(x - 0.004, x + 0.004, tt + 0.05, BR - 0.01, WF - 0.02, WF - 0.006, ledOf(moods))); }
    strip(wall, moods, px0 + 0.02, px1 - 0.02, BR - 0.01, WF - 0.008, 'down', 0.3, 0.6, '__tw_panel_glow');
    moods.halos.push(glowMat('__tw_panel_glow'));
    shel.add(wb(UX0 - 0.05, UX1 + 0.05, BR - 0.045, BR, WF - 0.26, WF - 0.022, WHITE_LAC)); strip(shel, moods, UX0, UX1, BR + 0.004, WF - 0.03, 'up', 0.28, 0.6);
    for (const [x0, x1, y] of [[UX1 - 0.04 - SC - 0.06, UX1 + 0.02, 1.42], [UX1 - 0.04 - SC - 0.06, UX1 + 0.02, 1.86], [UX0 - 0.02, UX0 + 0.1 + SC, 1.5], [UX0 - 0.02, UX0 + 0.1 + SC, 1.9]]) shel.add(wb(x0, x1, y, y + 0.035, WF - 0.24, WF - 0.022, WHITE_LAC));
    shel.add(wb(UX0 + 0.08, UX0 + 0.44, 1.2, 1.225, WF - 0.2, WF - 0.022, WAL)); shel.add(wb(TVX - 0.42, TVX + 0.42, 2.05, 2.08, WF - 0.22, WF - 0.006, WAL));
    moveTV(TVX, WF - 0.01);
    // streaming home screen on the TV (generic tiles, no logos / titles)
    const scr = new T.Mesh(new T.PlaneGeometry(1.43, 0.81), once('__tw_tv_home', () => new T.MeshBasicMaterial({ name: '__tw_tv_home', toneMapped: true, map: (() => { const c = cnv(1024, 580), x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 1024, 300); gr.addColorStop(0, '#0d1b2a'); gr.addColorStop(0.6, '#24364d'); gr.addColorStop(1, '#5b4a3a'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 580);
      const sun = x.createRadialGradient(780, 150, 10, 780, 150, 220); sun.addColorStop(0, 'rgba(255,200,140,0.8)'); sun.addColorStop(1, 'rgba(255,200,140,0)'); x.fillStyle = sun; x.fillRect(0, 0, 1024, 330); x.fillStyle = '#1c2633'; x.beginPath(); x.moveTo(0, 300); x.lineTo(300, 200); x.lineTo(520, 280); x.lineTo(760, 190); x.lineTo(1024, 290); x.lineTo(1024, 330); x.lineTo(0, 330); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillRect(40, 70, 260, 26); x.fillRect(40, 108, 180, 12); x.fillStyle = '#0b0f14'; x.fillRect(0, 330, 1024, 250);
      ['#c9302c', '#e9e9e9', '#1d3f8f', '#2c8fd6', '#ffffff', '#6b2fb0', '#1f1f1f'].forEach((cc, i) => { x.fillStyle = cc; x.fillRect(40 + i * 136, 350, 122, 62); });
      for (let i = 0; i < 6; i++) { const g2 = x.createLinearGradient(0, 440, 0, 560); g2.addColorStop(0, ['#7a4b2a', '#2f5d6b', '#6b2f3a', '#3a5a2f', '#5a4a7a', '#7a6a3a'][i]); g2.addColorStop(1, '#111'); x.fillStyle = g2; x.fillRect(40 + i * 160, 440, 148, 110); }
      return tex(c); })() })));
    scr.rotation.y = Math.PI; scr.position.set(TVX, 1.56, WF - 0.01 - 0.052); deco.add(scr);
    // decor
    deco.add(wb(TVX - 0.48, TVX + 0.48, tt + 0.04, tt + 0.12, -0.24, -0.14, BLACK));
    deco.add(wb(TVX - 0.18, TVX + 0.18, 2.08, 2.18, -0.17, -0.07, BLACK)); bushy(deco, TVX + 0.3, 2.08, -0.13, 0.1, 'white', 0.045, 0.07, 0.06);
    const ele = G(); ele.add(new T.Mesh(new T.SphereGeometry(0.05, 14, 10), GOLD())); ele.children[0].scale.set(1.3, 0.9, 0.8); ele.children[0].position.y = 0.07; for (const [dx, dz] of [[-0.04, -0.025], [0.04, -0.025], [-0.04, 0.025], [0.04, 0.025]]) ele.add(cyl(0.012, 0.012, 0.05, GOLD, dx, 0, dz, 8)); const hd = new T.Mesh(new T.SphereGeometry(0.032, 12, 10), GOLD()); hd.position.set(0.07, 0.1, 0); ele.add(hd); ele.position.set(TVX - 0.3, 2.08, -0.15); deco.add(ele);
    bushy(deco, UX1 - 0.32, 1.935, -0.15, 0.14, 'white', 0.06, 0.12, 0.07); bushy(deco, UX1 - 0.16, 1.935, -0.15, 0.12, 'white', 0.055, 0.1, 0.06);
    books(deco, UX1 - 0.4, 1.535, -0.1, 7); deco.add(cyl(0.035, 0.035, 0.08, CLEAR(), UX1 - 0.1, 1.535, -0.15));
    bushy(deco, UX0 + 0.25, 1.935, -0.15, 0.14, 'white', 0.06, 0.12, 0.07); pothos(deco, UX0 + 0.45, 1.935, -0.15, { r: 0.05, ph: 0.12, vines: [[0.05, 0.4]] });
    frameArt(deco, UX0 + 0.25, 1.535, -0.06, 0.16, 0.2, (x, w, h) => { const g2 = x.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, '#c9b49a'); g2.addColorStop(1, '#6f5f4f'); x.fillStyle = g2; x.fillRect(0, 0, w, h); x.fillStyle = '#3a2f28'; x.beginPath(); x.arc(w / 2, h * 0.45, w * 0.18, 0, 7); x.fill(); x.fillRect(w * 0.3, h * 0.62, w * 0.4, h * 0.4); }, GOLD);
    deco.add(wb(UX0 + 0.15, UX0 + 0.3, 1.225, 1.3, -0.12, -0.08, BLACK));
    const vase = G(); bushy(vase, UX1 - 0.3, FL + PL + CAB + 0.04, -0.2, 0.22, 'white', 0.07, 0.2, 0.08); deco.add(vase);
    const deer = G(); deer.add(new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.08, 10), GOLD())); deer.children[0].rotation.z = Math.PI / 2; deer.children[0].position.y = 0.12; for (const dx of [-0.03, 0.03]) deer.add(cyl(0.005, 0.005, 0.1, GOLD, dx, 0.02, 0, 6)); deer.add(cyl(0.006, 0.008, 0.08, GOLD, 0.045, 0.12, 0, 6)); deer.add(wb(-0.06, 0.06, 0, 0.02, -0.03, 0.03, BLACK)); deer.position.set(UX1 - 0.14, FL + PL + CAB + 0.04, -0.18); deco.add(deer);
    deco.add(cyl(0.035, 0.035, 0.09, CLEAR(), UX0 + 0.3, FL + PL + CAB + 0.04, -0.15)); deco.add(wb(UX0 + 0.42, UX0 + 0.52, FL + PL + CAB + 0.04, FL + PL + CAB + 0.1, -0.12, -0.08, BLACK));
    add('tw-wall', wall, 'TV wall · greige plaster, walnut slat frame, lit panel behind the TV');
  }
  if (cons.children.length) add('tw-console', cons, ({ 'terracotta-olive-arch': 'Floating light-oak console 2.6 m (doors + drawers, book niches)', 'white-stone-ledge': 'Floating light-oak console 2.6 m, five flush fronts', 'walnut-slat-warm': 'Floating walnut console 2.25 m, rounded ends, fluted centre doors', 'oak-fluted-tower': 'Light-oak fluted sideboard 2.0 m on legs + tower cupboard', 'walnut-white-frame': 'White + walnut TV unit 2.7 m (cabinets, drawers, media shelf)' })[style]);
  if (shel.children.length) add('tw-shelves', shel, style === 'oak-fluted-tower' ? 'Open light-oak bookcase tower 0.85 × 0.35 m, lit shelves' : 'Floating shelves + decor');
  if (deco.children.length) add('tw-decor', loose(deco), 'TV wall decor (vases, plants, books, lamp)', { loose: true });
  ctx.mood(moods);
}

// off-white split-face stacked ledge stone: canvas heightmap → displaced 1.5 cm grid + colour + bump (WORLD coords)
function stoneWall(T) {
  const g = new T.Group(), W = X1 - X0, H = CE - FL, PX = 200, cw = Math.round(W * PX), ch = Math.round(H * PX);
  const data = once('stone_maps', () => {
    seed = 77; const hc = cnv(cw, ch), x = hc.getContext('2d'), cc = cnv(cw, ch), y = cc.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, cw, ch); y.fillStyle = '#d9d4cb'; y.fillRect(0, 0, cw, ch);
    let py = 0; while (py < ch) { const rh = Math.round((0.035 + rnd() * 0.06) * PX); let px = -rnd() * 60;
      while (px < cw) { const rw = Math.round((0.12 + rnd() * 0.45) * PX), v = 110 + Math.floor(rnd() * 140), cv2 = 226 + Math.floor((rnd() - 0.5) * 22);
        x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(px + 2, py + 2, rw - 3, rh - 3);
        for (let k = 0; k < 6; k++) { const vv = v + (rnd() - 0.5) * 70; x.fillStyle = `rgba(${vv},${vv},${vv},0.6)`; x.fillRect(px + 2 + rnd() * rw * 0.8, py + 2 + rnd() * rh * 0.6, rw * (0.1 + rnd() * 0.3), rh * (0.2 + rnd() * 0.4)); }
        y.fillStyle = `rgb(${cv2},${cv2 - 3},${cv2 - 8})`; y.fillRect(px + 2, py + 2, rw - 3, rh - 3); px += rw; }
      py += rh; }
    y.fillStyle = 'rgba(120,112,100,0.0)'; const bc = cnv(cw, ch), bx = bc.getContext('2d'); bx.filter = 'blur(1px)'; bx.drawImage(hc, 0, 0);
    const id = bx.getImageData(0, 0, cw, ch).data;
    // joints darker in the colour map
    const cd = y.getImageData(0, 0, cw, ch); for (let i = 0; i < cw * ch; i++) { const h = id[i * 4] / 255; if (h < 0.15) { cd.data[i * 4] *= 0.62; cd.data[i * 4 + 1] *= 0.6; cd.data[i * 4 + 2] *= 0.58; } else { const n = (rnd() - 0.5) * 14; cd.data[i * 4] += n; cd.data[i * 4 + 1] += n; cd.data[i * 4 + 2] += n; } }
    y.putImageData(cd, 0, 0);
    return { id, mat: new T.MeshStandardMaterial({ name: '__tw_white_ledge_stone', color: 0xffffff, map: tex(cc), bumpMap: tex(bc, false), bumpScale: 6, roughness: 0.92 }) };
  });
  const hAt = (u, v) => { const ix = Math.min(cw - 1, Math.max(0, Math.round(u * (cw - 1)))), iy = Math.min(ch - 1, Math.max(0, Math.round((1 - v) * (ch - 1)))); return data.id[(iy * cw + ix) * 4] / 255; };
  const pg = new T.PlaneGeometry(W, H, Math.round(W / 0.015), Math.round(H / 0.015)), pp = pg.attributes.position;
  for (let i = 0; i < pp.count; i++) { const u = (pp.getX(i) + W / 2) / W, v = (pp.getY(i) + H / 2) / H; pp.setZ(i, 0.004 + 0.018 * hAt(u, v)); }
  pg.computeVertexNormals(); const m = new T.Mesh(pg, data.mat); m.rotation.y = Math.PI; m.scale.x = -1; m.position.set((X0 + X1) / 2, FL + H / 2, WF);
  // rotation π about y turns +z (relief) into −z; scale.x −1 keeps u running west→east as seen from the room
  g.add(m); g.add(wb(X0, X1, FL, CE, WF, 0, std('__tw_stone_base', { color: 0xcfc9bf, roughness: 0.95 })));
  return g;
}
