import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { ROOM_LAYOUTS, DEFAULTS } from './layouts/registry.js';
import { makeLib } from './layouts/lib/build.js';
import { CURTAIN_WALLS, buildCurtainWall, wallPose } from './layouts/curtains.js';
import { SITE_FIXTURES, BUNDLES } from './layouts/site.js';
import { PBR_MAP, KIND } from './materials_map.js';

const $ = id => document.getElementById(id);
const CEIL_H = 3.05, EYE = 1.6, RADIUS = 0.17, STORE = 'candeur3302_layout_v2';
const params = new URLSearchParams(location.search);

/* ---------- renderer / scene ---------- */
const canvas = $('c');
// antialias off: every frame goes through the EffectComposer's (non-MSAA) render targets, so canvas MSAA only cost bandwidth
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
// render quality (perf): still frames at up to 1.5x (Retina is 2x = 78 % more pixels), moving frames at an adaptive lower ratio
const RQ = { stillPR: Math.min(devicePixelRatio, 1.5), movePR: Math.min(devicePixelRatio, 1), minPR: Math.min(devicePixelRatio, 1) * 0.75,
  dirty: true, lastMotion: -1e9, lastRender: 0, ema: 16, prevMoving: false, adaptT: 0, cam: new THREE.Matrix4(), fov: 0 };
const invalidate = () => { RQ.dirty = true; };
renderer.setPixelRatio(RQ.stillPR);
renderer.info.autoReset = false;   // composer = several render() calls per frame; reset once per frame in loop()
renderer.toneMapping = THREE.AgXToneMapping;          // same view transform Blender uses
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;                 // re-rendered only when something changes
RectAreaLightUniformsLib.init();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14161a);
const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 3000);
const pmrem = new THREE.PMREMGenerator(renderer);
{ // Blender world is a warm grey (0.63, 0.62, 0.58): tint the studio environment to match
  const env = new RoomEnvironment();
  env.traverse(o => { if (o.material) { o.material = o.material.clone(); if (o.material.color) o.material.color.multiply(new THREE.Color(1.0, 0.94, 0.84)); if (o.material.emissive) o.material.emissive.multiply(new THREE.Color(1.0, 0.94, 0.84)); } });
  scene.environment = pmrem.fromScene(env, 0.04).texture;
}

// sun (daylight through windows)
const sun = new THREE.DirectionalLight(0xffe7c8, 3.2);
const SUN_DIR = new THREE.Vector3(0.55, 0.62, 0.56).normalize();
sun.target.position.set(6, 0, -0.6); sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 30);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 70 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.025; sun.shadow.radius = 3;
scene.add(sun, sun.target);
const windowLights = [];
// warm interior lights (evening): fixed pool re-assigned to the nearest Blender lights
// URL plights=<n> (perf knob, 2026-11-11): every point light costs per fragment in every lit material, in evening mode only
const NL = Math.max(1, Math.min(16, +(params.get('plights') || 12))), plights = [];
for (let i = 0; i < NL; i++) { const l = new THREE.PointLight(0xffc27a, 0, 6, 2); scene.add(l); plights.push(l); }
/* RectAreaLight pool (perf 2026-11-11, owner: "movement became laggy"). three.js evaluates EVERY visible RectAreaLight (LTC) for
   every lit fragment in the whole frame: 16 window lights + the options' shelf / TV / console / task lights = 24 → ~70 % of
   the GPU time. All RectAreaLights in the scene stay the "sources" the code already manipulates (visible / intensity / colour /
   size / pose), but they live on layer RL_LAYER, which no camera renders. RL_N proxy lights on layer 0 copy the RL_N sources
   that matter most for the current viewpoint (front-facing, near, same room first) every frame; swaps fade over 0.35 s.
   The proxy count never changes → no shader recompiles. URL `rectlights=<n>` changes the pool size; `rectlights=all`
   turns the pool off (every source is a real light again, as before). */
const RL_ALL = params.get('rectlights') === 'all', RL_N = RL_ALL ? 0 : Math.max(1, +(params.get('rectlights') || 6)), RL_LAYER = 7;
// evening: window lights are off and only the options' LED/TV/shelf lights remain (≤ 4 in one room) while the point-light pool
// is on — lights cost super-linearly together (measured 12 points + 6 rects 28 ms vs 12 + 4 23 ms), so fewer proxies by night
const RL_EVE = Math.min(RL_N, Math.max(1, +(params.get('rectlightsEve') || 4)));
const rpool = [];
for (let i = 0; i < RL_N; i++) { const l = new THREE.RectAreaLight(0xffffff, 0, 1, 1); l.userData.rlProxy = true; scene.add(l); rpool.push({ l, src: null, k: 0 }); }
const rl = { t: 0, want: [], v: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), n: new THREE.Vector3(), sig: '' };
function rlShown(o) { for (; o; o = o.parent) { if (!o.visible) return false; if (o === scene) return true; } return false; }
function updateRectPool(instant = false) {
  if (RL_ALL) return;
  const now = performance.now();
  if (instant || now - rl.t > 150) {   // re-rank the sources (cheap traversal, not every frame)
    rl.t = now;
    let fx, fz, fy = EYE, only = null;
    if (mode === 'walk' || TOUR) { camera.getWorldPosition(rl.v); fx = rl.v.x; fy = rl.v.y; fz = rl.v.z; }
    else { fx = orbit.target.x; fz = orbit.target.z; fy = orbit.target.y; if (mode === 'room') only = curRoom; }
    const here = only || roomAt(fx, fz), cand = [];
    scene.traverse(o => {
      if (!o.isRectAreaLight || o.userData.rlProxy) return;
      if (o.layers.mask !== 1 << RL_LAYER) o.layers.set(RL_LAYER);   // a source: never rendered directly
      if (!(o.intensity > 0) || !rlShown(o)) return;
      o.updateWorldMatrix(true, false); o.matrixWorld.decompose(rl.v, rl.q, rl.s);
      if (o.userData.rlRoom === undefined) o.userData.rlRoom = o.userData.room || roomAt(rl.v.x, rl.v.z) || '';
      const area = Math.abs(o.width * rl.s.x * o.height * rl.s.y), d2 = (rl.v.x - fx) ** 2 + (rl.v.y - fy) ** 2 + (rl.v.z - fz) ** 2;
      rl.n.set(0, 0, -1).applyQuaternion(rl.q);   // emits along its local −z (lookAt target)
      const front = (fx - rl.v.x) * rl.n.x + (fy - rl.v.y) * rl.n.y + (fz - rl.v.z) * rl.n.z > -0.3 ? 1 : 0.3;
      const same = o.userData.rlRoom && o.userData.rlRoom === here ? 4 : 1;
      cand.push([o, o.intensity * (area + 0.3) / (d2 + 1) * front * same]);
    });
    const cap = lightMode === 'day' ? RL_N : RL_EVE;
    rpool.forEach((p, i) => { p.l.visible = i < cap; if (i >= cap) { p.src = null; p.k = 0; } });   // visibility only changes with Day/Evening (one recompile, as for the point lights)
    rl.want = cand.sort((a, b) => b[1] - a[1]).slice(0, cap).map(c => c[0]);
  }
  const dk = instant ? 1 : Math.min(1, (clock.elapsedTime - (rl.last || clock.elapsedTime) || 0.016) / 0.35); rl.last = clock.elapsedTime;
  // proxies whose source is no longer wanted fade out, free proxies take the newly wanted sources and fade in
  const taken = new Set(rpool.map(p => p.src));
  for (const p of rpool) if (p.src && !rl.want.includes(p.src)) { p.k = instant ? 0 : Math.max(0, p.k - dk); if (p.k === 0) p.src = null; }
  for (const o of rl.want) if (!taken.has(o)) { const p = rpool.find(x => !x.src && x.l.visible); if (p) { p.src = o; p.k = instant ? 1 : 0; taken.add(o); } }
  let sig = '';
  for (const p of rpool) {
    if (p.src && rl.want.includes(p.src)) p.k = Math.min(1, p.k + dk);
    const o = p.src, L = p.l;
    if (!o || !p.k) { if (L.intensity) { L.intensity = 0; sig += '0'; } continue; }
    o.matrixWorld.decompose(L.position, L.quaternion, rl.s);
    L.width = o.width * Math.abs(rl.s.x); L.height = o.height * Math.abs(rl.s.y); L.color.copy(o.color); L.intensity = o.intensity * p.k;
    sig += L.position.x.toFixed(3) + L.position.z.toFixed(3) + L.intensity.toFixed(3) + L.color.getHexString() + L.width.toFixed(2);
  }
  if (sig !== rl.sig) { rl.sig = sig; if (rpool.some(p => p.k > 0 && p.k < 1)) RQ.lastMotion = now; else invalidate(); }
}

// post-processing: ambient occlusion
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, 1, 1);
gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 16, distanceFallOff: 1 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
gtao.blendIntensity = 1.0;
{ // perf: AO buffers at half resolution (AO is low-frequency; the blend pass upsamples it)
  const fullSetSize = gtao.fullSetSize = gtao.setSize.bind(gtao);
  gtao.setSize = (w, h) => fullSetSize(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
}
// the AO pass renders depth + normals of everything visible: glow meshes (additive LED halos, projector beam, picture)
// must not take part, or they come out as solid black shapes in the HQ (Shadows + AO) render
{ const ov = gtao.overrideVisibility.bind(gtao);
  gtao.overrideVisibility = () => { ov(); scene.traverse(o => { const m = o.material; if (((o.isMesh && m && !Array.isArray(m) && (m.blending === THREE.AdditiveBlending || (m.transparent && m.depthWrite === false))) || o.isSprite)) o.visible = false; }); }; }   // sprites (⇄ icons, comment pins) too
composer.addPass(gtao);
composer.addPass(new OutputPass());
// approximates Blender's "AgX - Medium High Contrast" look (applied in display space)
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, contrast: { value: 0.45 }, saturation: { value: 1.18 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float contrast; uniform float saturation; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 x = clamp(c.rgb, 0., 1.);
      x = mix(x, x * x * (3. - 2. * x), contrast);
      float l = dot(x, vec3(0.2126, 0.7152, 0.0722)); x = clamp(mix(vec3(l), x, saturation), 0., 1.);
      gl_FragColor = vec4(x, c.a); }`
});
composer.addPass(grade);

const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true; orbit.maxPolarAngle = Math.PI / 2 - 0.03; orbit.minDistance = 1; orbit.maxDistance = 45;
const tc = new TransformControls(camera, canvas);
tc.setTranslationSnap(0.05); tc.setRotationSnap(THREE.MathUtils.degToRad(15)); tc.setSize(0.8);
scene.add(tc.getHelper());

/* ---------- state ---------- */
let rooms = {}, roomNames = [], lightData = [], grid = null, gridMeta = null, matInfo = {}, phInfo = {};
let items = [], groups = new Map(), cloneCount = 0, movers = new Map(), blockers = [];
// loose furniture, appliances and decor (hidden by the "Furniture & appliances" switch); everything else is interior work
const LOOSE_RX = /sectional|chaise|drum|travertine|tripod|pedestal|approved-dining|sofa|seat|chair|lounge|ottoman|pouf|outward-(bench|four|movable)|balcony-bench|bed\b|bed frame|king|queen|mattress|duvet|pillow|cushion|throw|bedside|nightstand|compact-floating|owned-desk|desk-|\btable|coffee|tea\b|-tea|side-table|round-teak|rug|handloom|woven-geometric|carpet|runner|linen-shade|floor lamp|lamp\b|\btv\b|65|70-inch|television|projector|ps5|controller|laptop|monitor|keycap|fridge|refrigerator|washing|front-loading|microwave|burner|gas-|stove|plant|leaf|stem|soil|planter|trailing|branch|vase|ceramic|book|tray|cup|chai|jar|chopping|pan-handle|clothes-hanger|folded-linen|hanging-folded|ivory-handmade|styled|diya-warm|child-ottoman|dedicated-child/i;
let showLoose = true;
const SEAT_RX = /sofa|sectional|chair|lounge|bench|ottoman|stool|seat|recliner|pouf|king|queen|bed\b|mattress|duvet/i;
const origMat = new WeakMap();
let mode = 'plan', curRoom = null;
let showCeil = false, showExt = false, showDim = true, collide = true, cutaway = true;
let cine = 0;   // projector 'cinema' dimming 0…1 (see applyCine)
let lightMode = params.get('light') === 'evening' ? 'evening' : 'day', hq = params.get('hq') !== '0';
let selected = null, selBox = null;
const undoStack = [];
const walk = { x: 1.2, z: -3.4, yaw: -Math.PI / 2, pitch: 0, locked: false };
const keys = {};
const shadowsDirty = () => { renderer.shadowMap.needsUpdate = true; invalidate(); };

/* ---------- load ---------- */
async function init() {
  const [r, l, gm, gb, mi, ph] = await Promise.all([
    fetch('rooms.json').then(r => r.json()), fetch('lights.json').then(r => r.json()),
    fetch('grid_meta.json').then(r => r.json()), fetch('grid.bin').then(r => r.arrayBuffer()),
    fetch('materials.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
    fetch('assets/polyhaven/textures.json').then(r => r.ok ? r.json() : {}).catch(() => ({}))]);
  rooms = r; roomNames = Object.keys(r); lightData = l; gridMeta = gm; grid = new Uint8Array(gb); matInfo = mi; phInfo = ph;
  for (const L of lightData) L.room = roomAt(L.x, L.z);

  const gltf = await new Promise((res, rej) => new GLTFLoader().load('home.glb', res, e => {
    if (e.total) { const p = e.loaded / e.total; document.querySelector('#bar i').style.width = p * 100 + '%'; $('pct').textContent = Math.round(p * 100) + '%'; }
  }, rej));
  $('pct').textContent = 'Preparing materials…';
  await new Promise(r => setTimeout(r, 0));
  const root = gltf.scene; scene.add(root); root.updateMatrixWorld(true);
  const raw = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    // multi-material objects load as Group(extras) + child meshes without extras
    if (!o.userData.cat) { let a = o.parent; while (a && !a.userData.cat) a = a.parent; if (a) o.userData = JSON.parse(JSON.stringify(a.userData)); }
    const u = o.userData; u.cat = u.cat || 'furn';
    u.rooms = Array.isArray(u.rooms) ? u.rooms : (u.rooms || '').split('|').filter(Boolean);
    raw.push(o);
  });
  prepareMaterials(raw);
  buildWindowLights(raw);
  const movRaw = raw.filter(m => m.userData.mov), rest = raw.filter(m => !m.userData.mov);
  buildGroups(rest);
  buildMovers(movRaw);
  computeFootprints();
  const statics = rest.filter(m => !(m.userData.cat === 'furn' && m.userData.grp));
  items.push(...bakeAndMerge(statics, scene, m => m.userData.cat === 'arch' ? m.uuid : m.userData.cat + ':' + m.userData.rooms.join('|')));
  scene.remove(root);
  for (const m of items) setShadowFlags(m);
  scene.updateMatrixWorld(true); commonSenseMovers();
  buildRoomUI(); buildOutlines();
  await Promise.all([upgradePlants(), loadProductModels()]);
  await loadLayouts();
  // site conditions first: they move v1 baselines (g.init), and the owner's saved edits are absolute poses applied after
  buildSiteFixtures(); loadStored();
  buildCurtains();
  commonSenseDoors();
  interiorsOn = params.get('interiors') !== '0'; buildInteriors();
  if (params.has('opt')) setRoomLayout(params.get('room') || 'Master bedroom', params.get('opt'), { quiet: true });
  if (params.has('variant')) { const r = params.get('room') || 'Master bedroom'; store.variant = store.variant || {}; store.variant[r + '|' + store.sel[r]] = params.get('variant'); setRoomLayout(r, store.sel[r], { quiet: true }); }
  renderLayoutUI();
  $('load').style.display = 'none';
  setLightMode(lightMode); setHQ(hq);
  const m = params.get('mode') || 'walk';
  if (m === 'room') enterRoom(params.get('room') || 'Kitchen');
  else if (m === 'plan') enterPlan();
  else {
    if (params.has('x')) { walk.x = +params.get('x'); walk.z = +params.get('z'); walk.yaw = +params.get('yaw') || 0; walk.pitch = +params.get('pitch') || 0; }
    enterWalk();
  }
  if (params.has('sit')) { const g = [...groups.values()].find(g => g.id.includes(params.get('sit'))); if (g) { const c = new THREE.Box3().setFromObject(g.pivot).getCenter(new THREE.Vector3()); sitOn(g, c); } }
  if (params.get('furniture') === '0') { showLoose = false; applyVisibility(); }
  if (params.has('dump')) {   // agent helper: list a room's groups with bounds
    const R = params.get('dump'), out = [...groups.values()].filter(g => g.room === R).map(g => { const b = new THREE.Box3().setFromObject(g.pivot); return [g.id, g.name, g.loose ? 'L' : 'B', g.pivot.visible ? 'v' : 'h', ...[b.min.x, b.max.x, b.min.y, b.max.y, b.min.z, b.max.z].map(v => +v.toFixed(2))]; });
    const pre = document.createElement('pre'); pre.id = 'dump'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  if (params.has('sel')) { const g = [...groups.values()].find(g => g.name.toLowerCase().includes(params.get('sel').toLowerCase())); if (g) select(g); }
  window.__app = { mirrorProbes: () => mirrorProbes, renderer: () => renderer, hotspots: () => hotGroup.children.map(sp => { const v = sp.position.clone().project(camera); return { ...sp.userData.hot, sx: (v.x + 1) / 2 * innerWidth, sy: (1 - v.y) / 2 * innerHeight }; }), switchMode: () => dsw.active, setVariant, holes: () => holes.map(h => h.mv.id), audit, auditFloating, auditDoorLeaves, items: () => items, THREE, fixLog: () => fixLog, projector: setProjector, projState: () => projState,
    probe: (id) => { const mv = movers.get(id); const t0 = mv.t; mv.t = 0; poseMover(mv); mv.pivot.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(mv.pivot), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3());
      const ax = sz.x < sz.z ? 'x' : 'z', out = []; for (const sg of [1, -1]) { const d = new THREE.Vector3(); d[ax] = sg; lookRay.set(c.clone().addScaledVector(d, -0.002), d); lookRay.far = 0.4;
        out.push(lookRay.intersectObjects(items.filter(m => !m.userData.mov), false).slice(0, 3).map(h => [sg, +h.distance.toFixed(3), h.object.userData.cat, h.object.name.slice(0, 30), h.object.material.name])); }
      mv.t = t0; poseMover(mv); return { sz: sz.toArray(), out }; },
    cam: () => camera, scene: () => scene, mirrors: () => mirrorProbes.map(p => ({ name: p.m.material.name, renders: p.renders || 0, cpuMs: p.ms, dirty: p.dirty })), carry: { start: ndc => startCarry(ndc), end: () => endCarry("api"), state: () => carry }, groups, movers, toggleMover, sitOn, interact, hits, setRoomLayout, setMood, store: () => store, select, delSel, dupSel, undo, exportLayout, importLayout, enterRoom, recolor, clearances: () => clr.last,
    perf: () => ({ pr: renderer.getPixelRatio(), stillPR: RQ.stillPR, movePR: RQ.movePR, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      programs: renderer.info.programs.length, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, ao: gtao.enabled,
      frame: renderer.info.render.frame, lights: perfLights() }),
    // agent helper: CPU ms per loop() section, averaged over `ms` (sim = keep turning + run the crosshair hint ray every frame)
    async loopProf(ms = 3000, sim = true) {
      const lk = walk.locked; if (sim) walk.locked = true;
      RQ.prof = { sim }; await new Promise(r => setTimeout(r, ms)); const P = RQ.prof; RQ.prof = null; walk.locked = lk;
      const out = { loops: P.loops, frames: P.frames || 0 }; for (const k in P) if (!['sim', 'loops', 'frames'].includes(k)) out[k] = +(P[k] / P.loops).toFixed(2);
      return out;
    },
    // agent helper: GPU ms per frame (EXT_disjoint_timer_query_webgl2) for still (AO) or moving (no AO) frames; fullAO = AO at full resolution
    async perfBench(n = 8, still = true, pr = still ? RQ.stillPR : RQ.movePR, fullAO = false, allLights = false) {
      const gl = renderer.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2'), ao = gtao.enabled, pr0 = renderer.getPixelRatio();
      RQ.bench = true; setPR(pr); gtao.enabled = still && hq;
      if (fullAO) gtao.fullSetSize(gtao.width * 2, gtao.height * 2);
      const pv = plights.map(l => l.visible); if (allLights) plights.forEach(l => { l.visible = true; });
      const qs = [], cpu = [];
      for (let i = 0; i < n; i++) {
        await new Promise(r => requestAnimationFrame(r));
        const q = ext && gl.createQuery(); if (q) gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
        const c0 = performance.now(); renderer.info.reset(); composer.render(); cpu.push(performance.now() - c0); if (q) { gl.endQuery(ext.TIME_ELAPSED_EXT); qs.push(q); }
      }
      const calls = renderer.info.render.calls, tris = renderer.info.render.triangles;
      const ms = [];
      for (const q of qs) { while (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) await new Promise(r => setTimeout(r, 5));
        if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) ms.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6); gl.deleteQuery(q); }
      if (fullAO) gtao.setSize(gtao.width, gtao.height);
      plights.forEach((l, i) => { l.visible = pv[i]; });
      setPR(pr0); gtao.enabled = ao; RQ.bench = false; invalidate();
      ms.sort((a, b) => a - b);
      cpu.sort((a, b) => a - b);
      return { cpuMsMedian: +cpu[cpu.length >> 1].toFixed(2), gpuMsMedian: ms.length ? +ms[ms.length >> 1].toFixed(2) : null, gpuMsMin: ms.length ? +ms[0].toFixed(2) : null, pr, ao: still && hq, fullAO, allLights, calls, tris };
    } };
  if (params.has('selftest')) selfTest();
  if (TOUR) setupTour();
  if (params.has('debug')) {
    const cnt = {}; items.forEach(m => { const k = m.userData.cat + (m.visible ? ':vis' : ':hid'); cnt[k] = (cnt[k] || 0) + 1; });
    const pre = document.createElement('pre'); pre.id = 'dbg';
    pre.textContent = JSON.stringify({ cnt, meshes: items.length, groups: groups.size, windows: windowLights.length, tri: Object.keys(matInfo).length }); document.body.appendChild(pre);
  }
  refreshComments();
  if (params.has('ctest')) {   // agent test: comment on the selected item through the real UI path
    const g = [...groups.values()].find(g => g.id.includes(params.get('ctest'))); if (g) select(g);
    await new Promise(r => setTimeout(r, 1500));
    openCommentBox(); $('cText').value = 'Headless comment test (safe to delete)'; await saveComment();
  }
  updateRectPool(true);   // proxies in place before the first frame (shaders compile once for the pool size)
  window.__ready = true;
  requestAnimationFrame(loop);
}

/* ---------- materials: baked Blender textures, applied tri-planar in metric object space ---------- */
const texLoader = new THREE.TextureLoader(), texCache = {}, matByName = {}, fallbackMats = {};
function libMat(name, fb) {
  if (matByName[name]) return matByName[name];
  if (!fallbackMats[name]) fallbackMats[name] = new THREE.MeshStandardMaterial({ color: fb ?? 0x888888, roughness: /screen/.test(name) ? 0.95 : 0.55, name });
  return fallbackMats[name];
}
const productModels = {};
const layoutLib = makeLib(libMat, key => productModels[key]);
async function loadProductModels() {
  let man = {}; try { man = await (await fetch('assets/abo/manifest.json')).json(); } catch (e) { return; }
  const loader = new GLTFLoader();
  await Promise.all(Object.entries(man).map(async ([k, v]) => {
    try {
      const gl = await loader.loadAsync(v.file || `assets/abo/${k}.glb`);
      gl.scene.traverse(o => { if (o.isMesh) { [].concat(o.material).forEach(mm => { mm.envMapIntensity = 1; }); } });
      productModels[k] = { scene: gl.scene, front: v.front || '+z', name: v.name, rotX: v.rotX || 0 };
    } catch (e) { console.warn('model', k, e); }
  }));
}
function tex(fn, srgb) {
  if (!texCache[fn]) {
    const t = texLoader.load(fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; texCache[fn] = t;
  }
  return texCache[fn];
}
const srgbLin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function prepareMaterials(meshes) {
  const done = new Map();
  for (const m of meshes) {
    const mats = [].concat(m.material).map(mat => {
      if (done.has(mat)) return done.get(mat);
      let out = mat;
      // cheap, convincing glass instead of the costly transmission pass
      if (mat.transmission > 0 || /glazing|glass/i.test(mat.name)) {
        mat.transmission = 0; mat.transparent = true; mat.opacity = Math.min(mat.opacity, 0.18); mat.roughness = 0.05; mat.metalness = 0;
        mat.color.set(0xeef4f6); mat.depthWrite = false; mat.userData.glass = true;
      } else {
        mat.envMapIntensity = 1;
        const pm = PBR_MAP[mat.name], ph = pm && phInfo[pm.ph], info = matInfo[mat.name];
        if (ph) out = photoMaterial(mat, pm, ph, info);
        else if (info) triplanar(mat, { col: 'tex/' + info.col, rgh: 'tex/' + info.rgh, nrm: info.nrm && 'tex/' + info.nrm, tile: info.tile });
      }
      done.set(mat, out); matByName[mat.name] = out; return out;
    });
    m.material = Array.isArray(m.material) ? mats : mats[0];
  }
}
// photographic material: real weave/grain/relief from Poly Haven, re-tinted to the designed colour
function photoMaterial(src, pm, ph, info) {
  const k = { ...KIND[pm.kind], ...(pm.nstr ? { nstr: pm.nstr } : {}) };
  const design = info && info.avg ? info.avg : [src.color.r, src.color.g, src.color.b].map(c => Math.pow(c, 1 / 2.2));
  const gain = new THREE.Vector3(...[0, 1, 2].map(i => Math.min(4, srgbLin(design[i]) / Math.max(0.02, srgbLin(ph.avg[i])))));
  const mat = new THREE.MeshPhysicalMaterial({ name: src.name, color: 0xffffff, roughness: k.rough, metalness: 0, side: src.side,
    sheen: k.sheen || 0, sheenRoughness: k.sheenRough || 0.5, clearcoat: k.clearcoat || 0, clearcoatRoughness: 0.45 });
  if (k.sheen) mat.sheenColor.setRGB(...design.map(srgbLin)).multiplyScalar(0.9);
  mat.envMapIntensity = 1;
  triplanar(mat, { col: ph.files.diff, rgh: ph.files.rough, nrm: ph.files.nor, tile: ph.size_m, gain, nstr: k.nstr });
  return mat;
}
function triplanar(mat, info) {
  mat.color.set(0xffffff); if (!mat.isMeshPhysicalMaterial) mat.roughness = 1; mat.map = null;
  const u = { triCol: { value: tex(info.col, true) }, triRgh: { value: tex(info.rgh, false) }, triNrm: { value: info.nrm ? tex(info.nrm, false) : null },
    triScale: { value: 1 / (info.tile || 1.5) }, triNStr: { value: info.nstr ?? 1.0 }, triGain: { value: info.gain || new THREE.Vector3(1, 1, 1) } };
  const hasN = !!info.nrm;
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTriPos; varying vec3 vTriN; varying vec3 vTriX; varying vec3 vTriY; varying vec3 vTriZ;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vTriPos = position; vTriN = normal;
        vTriX = normalize(normalMatrix * vec3(1.,0.,0.)); vTriY = normalize(normalMatrix * vec3(0.,1.,0.)); vTriZ = normalize(normalMatrix * vec3(0.,0.,1.));`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vTriPos; varying vec3 vTriN; varying vec3 vTriX; varying vec3 vTriY; varying vec3 vTriZ;
        uniform sampler2D triCol; uniform sampler2D triRgh; uniform sampler2D triNrm; uniform float triScale; uniform float triNStr; uniform vec3 triGain;`)
      .replace('#include <map_fragment>', `
        vec3 triNn = normalize(vTriN);
        vec3 triW = pow(abs(triNn), vec3(4.0)); triW /= (triW.x + triW.y + triW.z + 1e-5);
        vec2 triUX = vTriPos.zy * triScale, triUY = vTriPos.xz * triScale, triUZ = vTriPos.xy * triScale;
        diffuseColor.rgb *= (texture2D(triCol, triUX).rgb * triW.x + texture2D(triCol, triUY).rgb * triW.y + texture2D(triCol, triUZ).rgb * triW.z) * triGain;`)
      .replace('#include <roughnessmap_fragment>', `
        float roughnessFactor = roughness * (texture2D(triRgh, triUX).g * triW.x + texture2D(triRgh, triUY).g * triW.y + texture2D(triRgh, triUZ).g * triW.z);`)
      .replace('#include <normal_fragment_maps>', hasN ? `
        {
          vec3 tX = texture2D(triNrm, triUX).xyz * 2. - 1.; vec3 tY = texture2D(triNrm, triUY).xyz * 2. - 1.; vec3 tZ = texture2D(triNrm, triUZ).xyz * 2. - 1.;
          tX.xy *= triNStr; tY.xy *= triNStr; tZ.xy *= triNStr;
          tX = vec3(tX.xy + triNn.zy, triNn.x); tY = vec3(tY.xy + triNn.xz, triNn.y); tZ = vec3(tZ.xy + triNn.xy, triNn.z);
          vec3 on = normalize(tX.zyx * triW.x + tY.xzy * triW.y + tZ.xyz * triW.z);
          normal = normalize(on.x * vTriX + on.y * vTriY + on.z * vTriZ) * faceDirection;
        }` : '');
  };
  mat.customProgramCacheKey = () => 'tri' + (hasN ? 'n' : '') + (mat.isMeshPhysicalMaterial ? 'p' : '');
  mat.needsUpdate = true;
}
function setShadowFlags(m) {
  const glass = m.material.userData.glass || m.material.transparent;
  m.castShadow = !glass && m.userData.cat !== 'exterior';
  m.receiveShadow = !glass;
}

/* ---------- geometry: bake transforms into metric geometry and merge per material ---------- */
const KEEP = ['position', 'normal', 'uv'];
function bakeAndMerge(meshes, space, keyFn) {
  space.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(space.matrixWorld).invert();
  const buckets = new Map();
  for (const m of meshes) {
    m.updateMatrixWorld(true);
    const rel = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    const g = m.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!KEEP.includes(k) && !(k === 'color' && m.material.vertexColors)) g.deleteAttribute(k);   // keep vertex colours where the material uses them (LED halo)
    for (const k of Object.keys(g.morphAttributes)) delete g.morphAttributes[k];
    if (!g.index) { const n = g.attributes.position.count, idx = new Uint32Array(n); for (let i = 0; i < n; i++) idx[i] = i; g.setIndex(new THREE.BufferAttribute(idx, 1)); }
    g.applyMatrix4(rel);
    if (rel.determinant() < 0) { const a = g.index.array; for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; } }
    g.clearGroups();
    const key = keyFn(m) + '|' + m.material.uuid + '|' + Object.keys(g.attributes).sort().join(',');
    if (!buckets.has(key)) buckets.set(key, { mat: m.material, ud: m.userData, name: m.name, geos: [] });
    buckets.get(key).geos.push(g);
    m.removeFromParent();
  }
  const out = [];
  for (const b of buckets.values()) {
    const geo = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos, false);
    if (!geo) continue;
    geo.computeBoundingBox(); geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, b.mat); mesh.name = b.name; mesh.userData = JSON.parse(JSON.stringify(b.ud));
    space.add(mesh); out.push(mesh);
  }
  return out;
}

/* ---------- replace scripted v1 plants with scanned Poly Haven potted plants (CC0) ---------- */
async function upgradePlants() {
  const loader = new GLTFLoader(), P = {};
  for (const id of ['potted_plant_01', 'potted_plant_02', 'potted_plant_04']) {
    try { P[id] = (await loader.loadAsync(`assets/polyhaven/${id}/${id}.gltf`)).scene; } catch (e) { console.warn('plant', id, e); }
  }
  if (!Object.keys(P).length) return;
  const PART = /^(broad-leaf|plant-stem|pot-soil|handthrown-planter)#/;
  const centre = g => new THREE.Box3().setFromObject(g.pivot).getCenter(new THREE.Vector3());
  let n = 0;
  for (const a of [...groups.values()].filter(g => /\/handthrown-planter#/.test(g.id))) {
    if (!groups.has(a.id)) continue;
    const ab = new THREE.Box3().setFromObject(a.pivot), ac = ab.getCenter(new THREE.Vector3());
    const cluster = [...groups.values()].filter(g => g.room === a.room && PART.test(g.id.split('/')[1] || '') && (c => Math.hypot(c.x - ac.x, c.z - ac.z) < 0.6)(centre(g)));
    const cb = new THREE.Box3(); cluster.forEach(g => cb.expandByObject(g.pivot));
    const h = Math.min(1.6, cb.max.y - ab.min.y);
    const id = h > 1.0 && P.potted_plant_01 ? 'potted_plant_01' : h > 0.45 && P.potted_plant_02 ? 'potted_plant_02' : (P.potted_plant_04 ? 'potted_plant_04' : Object.keys(P)[0]);
    cluster.forEach(removeGroup);
    const src = P[id].clone(true); src.updateMatrixWorld(true);
    const sb = new THREE.Box3().setFromObject(src), ss = sb.getSize(new THREE.Vector3()), k = Math.max(0.25, h) / ss.y;
    src.scale.setScalar(k); src.position.set(-(sb.min.x + sb.max.x) / 2 * k, -sb.min.y * k, -(sb.min.z + sb.max.z) / 2 * k); src.rotation.y = n * 1.7;
    const gid = slugify(a.room) + '/plant#' + (n++);
    const pivot = new THREE.Group(); pivot.position.set(ac.x, ab.min.y, ac.z); scene.add(pivot); pivot.add(src); pivot.updateMatrixWorld(true);
    const meshes = []; src.traverse(o => { if (o.isMesh) { o.userData = { cat: 'furn', rooms: [a.room], gid }; meshes.push(o); } });
    const merged = bakeAndMerge(meshes, pivot, () => ''); src.removeFromParent();
    const g = { id: gid, pivot, meshes: merged, dom: merged[0] && merged[0].material, colMat: null, col: null, name: 'Potted plant', clone: false, loose: true, room: a.room,
      init: { x: pivot.position.x, y: pivot.position.y, z: pivot.position.z, ry: 0 } };
    merged.forEach(m => { origMat.set(m, m.material); items.push(m); setShadowFlags(m); });
    groups.set(gid, g); footprintOf(g);
  }
  // plant parts with no planter under them (their pot was another object) were left hanging in the air: drop them
  for (const g of [...groups.values()].filter(g => PART.test(g.id.split('/')[1] || '')))
    if (new THREE.Box3().setFromObject(g.pivot).min.y > 0.15) removeGroup(g);
}

/* ---------- daylight from window openings ---------- */
function buildWindowLights(meshes) {
  const boxes = [];
  for (const m of meshes) {
    if (!m.material.userData.glass) continue;
    const b = new THREE.Box3().setFromObject(m), s = b.getSize(new THREE.Vector3());
    if (s.y < 0.5 || Math.max(s.x, s.z) < 0.4 || Math.min(s.x, s.z) > 0.25) continue;
    const hit = boxes.find(o => o.intersectsBox(b.clone().expandByScalar(0.08)));
    if (hit) hit.union(b); else boxes.push(b);
  }
  for (const b of boxes) {
    const s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    const alongX = s.x > s.z, n = alongX ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const a = roomAt(c.x + n.x * 0.4, c.z + n.z * 0.4), bR = roomAt(c.x - n.x * 0.4, c.z - n.z * 0.4);
    const inside = r => r && !/balcony|utility/i.test(r);
    let dir;
    if (inside(a) && !inside(bR)) dir = 1; else if (inside(bR) && !inside(a)) dir = -1; else if (a && !bR) dir = 1; else if (bR && !a) dir = -1; else continue;
    n.multiplyScalar(dir);
    const w = alongX ? s.x : s.z, h = s.y;
    const L = new THREE.RectAreaLight(0xfff3e4, 0, w, h);
    L.position.copy(c).addScaledVector(n, 0.06); L.lookAt(c.clone().addScaledVector(n, 2));
    L.userData.room = dir > 0 ? a : bR;
    if (!RL_ALL) L.layers.set(RL_LAYER);   // RectAreaLight pool source (updateRectPool)
    scene.add(L); windowLights.push(L);
  }
}

/* ---------- movable parts: doors, wardrobe fronts, drawers, sliders ---------- */
function buildMovers(raw) {
  const by = new Map();
  for (const m of raw) {
    const id = m.userData.mov; if (!by.has(id)) by.set(id, { meshes: [], info: null });
    const e = by.get(id); e.meshes.push(m);
    if (m.userData.movInfo && !e.info) e.info = JSON.parse(m.userData.movInfo);
  }
  for (const [id, e] of by) {
    if (!e.info) { e.meshes.forEach(m => { delete m.userData.mov; }); continue; }
    const info = e.info, prim = e.meshes.find(m => m.userData.movInfo) || e.meshes[0];
    const g = prim.userData.grp && groups.get(prim.userData.grp);
    const parent = g ? g.pivot : scene; parent.updateMatrixWorld(true);
    const piv = new THREE.Group(); parent.add(piv);
    const box = new THREE.Box3(); e.meshes.forEach(m => box.expandByObject(m));
    const at = info.hinge ? new THREE.Vector3(info.hinge[0], box.min.y, info.hinge[2]) : box.getCenter(new THREE.Vector3());
    piv.position.copy(parent.worldToLocal(at.clone())); piv.updateMatrixWorld(true);
    const merged = bakeAndMerge(e.meshes, piv, () => '');
    for (const m of merged) { m.userData.mov = id; if (g) m.userData.gid = g.id; items.push(m); if (g) g.meshes.push(m), origMat.set(m, m.material); }
    const mv = { id, info, pivot: piv, base: piv.position.clone(), t: info.start || 0, target: info.start || 0, group: g || null,
      label: info.type === 'door' ? 'door' : info.type === 'drawer' ? 'drawer' : info.type === 'slide' ? (/glass/i.test(prim.name) ? 'sliding door' : 'sliding wardrobe') : 'cupboard',
      free: info.dir ? new THREE.Vector3(info.dir[0] * info.len, 0, info.dir[1] * info.len) : null };
    movers.set(id, mv); poseMover(mv);
  }
}
function poseMover(mv) {
  const i = mv.info, t = mv.t, k = t * t * (3 - 2 * t);
  if (i.type === 'door' || i.type === 'cab') mv.pivot.rotation.y = i.a0 + (i.a1 - i.a0) * k;
  else if (i.type === 'roll') mv.pivot.scale.y = Math.max(0.002, k);
  else if (i.type === 'gather') mv.pivot.scale.x = 1 - (1 - (i.min || 0.2)) * k;   // curtain half bunching towards its wall end
  else mv.pivot.position.set(mv.base.x + i.slide[0] * k, mv.base.y + i.slide[1] * k, mv.base.z + i.slide[2] * k);
}
function toggleMover(mv, to) {
  mv.target = to === undefined ? (mv.target > 0.5 ? 0 : 1) : to;
  setMsg(mv.info.type === 'roll' ? `${mv.target ? 'Lowering' : 'Raising'} ${mv.label}` : `${mv.target ? 'Opening' : 'Closing'} ${mv.label}`);
}
/* ---------- cupboard interiors ----------
   The v1 cabinets (and the built ones) are solid blocks: an opened door showed a flat face. For every cupboard door,
   drawer and sliding front we find the carcass face right behind it (ray-cast), cut that face away in the shader
   (fragments inside a thin world-space "hole" box are discarded — only for the carcass's material) and line the
   cavity: back/sides/top/bottom panels plus shelves, a hanging rail in tall wardrobes, and a tray that slides out
   with each drawer. All rooms, automatic; re-run for built groups after every layout switch. */
const HOLE_MAX = 96;
const holeU = { min: { value: Array.from({ length: HOLE_MAX }, () => new THREE.Vector3(1e9, 1e9, 1e9)) },
  max: { value: Array.from({ length: HOLE_MAX }, () => new THREE.Vector3(-1e9, -1e9, -1e9)) }, n: { value: 0 } };
const holes = [];   // { mv, local: Box3 in parent space, parent, liner: Group, mesh }
let linerMat = null, interiorsOn = false;
function holeHook(mat) {
  if (!mat || mat.userData.holeHook) return; mat.userData.holeHook = true;
  const prevC = mat.onBeforeCompile, prevK = mat.customProgramCacheKey;
  mat.onBeforeCompile = (sh, r) => {
    if (prevC) prevC.call(mat, sh, r);
    sh.uniforms.uHoleMin = holeU.min; sh.uniforms.uHoleMax = holeU.max; sh.uniforms.uHoleN = holeU.n;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHoleW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvHoleW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vHoleW; uniform vec3 uHoleMin[${HOLE_MAX}]; uniform vec3 uHoleMax[${HOLE_MAX}]; uniform int uHoleN;`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      for (int i = 0; i < ${HOLE_MAX}; i++) { if (i >= uHoleN) break;
        if (all(greaterThan(vHoleW, uHoleMin[i])) && all(lessThan(vHoleW, uHoleMax[i]))) discard; }`);
  };
  mat.customProgramCacheKey = () => (prevK ? prevK.call(mat) : '') + '|hole';
  mat.needsUpdate = true;
}
function refreshHoles() {
  let n = 0; const b = new THREE.Box3();
  for (let i = holes.length - 1; i >= 0; i--) if (!movers.has(holes[i].mv.id) || !holes[i].parent.parent && holes[i].parent !== scene) { holes[i].liner.removeFromParent(); holes.splice(i, 1); }
  for (const h of holes) {
    const shown = isShown(h.mesh);
    h.liner.visible = shown;
    if (!shown || n >= HOLE_MAX) continue;
    h.parent.updateWorldMatrix(true, false);
    b.copy(h.local).applyMatrix4(h.parent.matrixWorld);
    holeU.min.value[n].copy(b.min); holeU.max.value[n].copy(b.max); n++;
  }
  holeU.n.value = n;
}
function buildInterior(mv) {
  const i = mv.info;
  if (mv.interior !== undefined || !['cab', 'drawer', 'slide'].includes(i.type)) return;
  mv.interior = null;
  if (/fridge|freezer|projector|screen/i.test(mv.label) || /glass/i.test(mv.id) || i.fitted) return;   // fitted = builder already furnished the inside (e.g. caneConsole)
  // closed pose → door box
  const t0 = mv.t; mv.t = 0; poseMover(mv); mv.pivot.updateMatrixWorld(true);
  const own = []; mv.pivot.traverse(o => { if (o.isMesh) own.push(o); });
  const box = new THREE.Box3(); own.forEach(o => box.expandByObject(o));
  const restore = () => { mv.t = t0; poseMover(mv); mv.pivot.updateMatrixWorld(true); };
  const sz = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  if (Math.min(sz.x, sz.z) > 0.08 || sz.y < 0.08) { restore(); return; }              // not a flat, axis-aligned front
  const ax = sz.x < sz.z ? 'x' : 'z', across = ax === 'x' ? 'z' : 'x';
  if (sz[across] < 0.12) { restore(); return; }
  // carcass face behind the front: nearest front-facing non-mover surface within 8 cm on either side
  const cand = items.filter(m => !m.userData.mov && (m.userData.cat === 'furn' || m.userData.cat === 'arch'));
  let best = null;
  for (const sgn of [1, -1]) {
    const dir = new THREE.Vector3(); dir[ax] = sgn;
    lookRay.set(c.clone().addScaledVector(dir, -0.002), dir); lookRay.far = i.type === 'slide' ? 0.22 : 0.1;   // sliding fronts run on staggered tracks
    const h = lookRay.intersectObjects(cand, false)[0];
    // built-in sliding wardrobes were exported as architecture: accept that carcass for sliding fronts only
    if (h && (h.object.userData.cat === 'furn' || (i.type === 'slide' && h.distance < 0.15)) && (!best || h.distance < best.h.distance)) best = { h, dir };
  }
  if (!best) { restore(); return; }
  const { h, dir } = best, plane = h.point[ax];
  // depth: to the wall behind (or 0.6 m)
  lookRay.set(h.point.clone().addScaledVector(dir, 0.01), dir); lookRay.far = 0.9;
  const wall = lookRay.intersectObjects(items.filter(m => m.userData.cat === 'arch' || (m.userData.cat === 'furn' && !m.userData.mov && m !== h.object)), false)[0];
  const depth = THREE.MathUtils.clamp(wall ? wall.distance - 0.012 : 0.58, 0.18, 0.66);
  const inset = 0.012;
  const lo = new THREE.Vector3(box.min.x, box.min.y + inset, box.min.z), hi = new THREE.Vector3(box.max.x, box.max.y - inset, box.max.z);
  lo[across] += inset; hi[across] -= inset;
  const sgn = dir[ax];
  // world hole slab: from 4 mm in front of the carcass face to 3 cm into it
  const hw = new THREE.Box3(lo.clone(), hi.clone());
  hw.min[ax] = Math.min(plane - 0.004 * sgn, plane + 0.03 * sgn); hw.max[ax] = Math.max(plane - 0.004 * sgn, plane + 0.03 * sgn);
  holeHook(h.object.material);
  if (!linerMat) linerMat = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.75, name: '__carcass_liner' });
  // liner panels (world placement, then attached to the carcass's parent so editor moves carry them)
  const liner = new THREE.Group(); liner.name = 'interior:' + mv.id; scene.add(liner);
  const W = hi[across] - lo[across], H = hi.y - lo.y, cA = (lo[across] + hi[across]) / 2, th = 0.012;
  const panel = (w, hgt, d, pa, py, pn) => {   // w along `across`, d along the normal; pa/py/pn = centre
    const m = new THREE.Mesh(new THREE.BoxGeometry(ax === 'x' ? d : w, hgt, ax === 'x' ? w : d), linerMat);
    m.position[across] = pa; m.position.y = py; m.position[ax] = pn; m.castShadow = false; m.receiveShadow = true; liner.add(m); return m;
  };
  const nAt = f => plane + sgn * f;          // f metres behind the carcass face
  panel(W, H, th, cA, lo.y + H / 2, nAt(depth - th / 2));                       // back
  panel(th, H, depth, lo[across] + th / 2, lo.y + H / 2, nAt(depth / 2));        // sides
  panel(th, H, depth, hi[across] - th / 2, lo.y + H / 2, nAt(depth / 2));
  panel(W, th, depth, cA, hi.y - th / 2, nAt(depth / 2));                       // top / bottom
  panel(W, th, depth, cA, lo.y + th / 2, nAt(depth / 2));
  if (i.type === 'drawer') {
    // tray that slides out with the front
    const tray = new THREE.Group(), tw = W - 0.03, tH = Math.max(0.06, H - 0.05), tD = Math.min(depth - 0.03, 0.5), ty = lo.y + 0.02;
    const tp = (w, hgt, d, pa, py, pn) => { const m = new THREE.Mesh(new THREE.BoxGeometry(ax === 'x' ? d : w, hgt, ax === 'x' ? w : d), linerMat); m.position[across] = pa; m.position.y = py; m.position[ax] = pn; tray.add(m); };
    tp(tw, 0.01, tD, cA, ty + 0.005, nAt(tD / 2)); tp(tw, tH, 0.01, cA, ty + tH / 2, nAt(tD - 0.005));
    tp(0.01, tH, tD, cA - tw / 2 + 0.005, ty + tH / 2, nAt(tD / 2)); tp(0.01, tH, tD, cA + tw / 2 - 0.005, ty + tH / 2, nAt(tD / 2));
    scene.add(tray); mv.pivot.attach(tray);
  } else if (H > 1.3) {
    // wardrobe: top shelf + hanging rail when wide enough, else shelves every ~35 cm
    const shelfY = hi.y - Math.min(0.42, H * 0.22);
    panel(W - 2 * th, 0.018, depth - th, cA, shelfY, nAt((depth - th) / 2));
    if (W > 0.38) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, W - 2 * th, 12), new THREE.MeshStandardMaterial({ color: 0xb8b2a6, metalness: 0.8, roughness: 0.35, name: '__rail' }));
      rod.rotation[ax === 'x' ? 'x' : 'z'] = Math.PI / 2; rod.position[across] = cA; rod.position.y = shelfY - 0.07; rod.position[ax] = nAt(depth * 0.5); liner.add(rod);
      panel(W - 2 * th, 0.018, depth - th, cA, lo.y + 0.32, nAt((depth - th) / 2));   // low shelf under the hanging zone
    } else for (let y = lo.y + 0.35; y < shelfY - 0.2; y += 0.35) panel(W - 2 * th, 0.018, depth - th, cA, y, nAt((depth - th) / 2));
  } else if (H > 0.3) {
    for (let k = 1, nS = H > 0.75 ? 2 : 1; k <= nS; k++) panel(W - 2 * th, 0.018, depth - th, cA, lo.y + H * k / (nS + 1), nAt((depth - th) / 2));
  }
  const parent = h.object.parent || scene; parent.attach(liner); parent.updateWorldMatrix(true, false);
  const local = hw.clone().applyMatrix4(parent.matrixWorld.clone().invert());
  holes.push({ mv, local, parent, liner, mesh: own[0] }); mv.carcass = h.object.userData.gid || h.object.uuid;
  mv.interior = liner;
  restore();
}
function buildInteriors() {
  if (!interiorsOn) return;
  scene.updateMatrixWorld(true);
  for (const mv of movers.values()) { try { buildInterior(mv); } catch (e) { console.warn('interior', mv.id, e); mv.interior = null; } }
  refreshHoles(); shadowsDirty();
}
/* ---------- common-sense audit: sweep every door / drawer / sliding front and report what it would hit ---------- */
function moverLocalBox(mv) {   // box of the moving part in pivot space (incl. drawer trays)
  mv.pivot.updateMatrixWorld(true); const inv = mv.pivot.matrixWorld.clone().invert(), b = new THREE.Box3(), tmp = new THREE.Box3(), m4 = new THREE.Matrix4();
  mv.pivot.traverse(o => { if (!o.isMesh) return; o.geometry.computeBoundingBox(); tmp.copy(o.geometry.boundingBox).applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld)); b.union(tmp); });
  return b;
}
function rectCorners(mv, lb) {  // xz footprint of the moving part (oriented) + its y range
  const e = mv.pivot.matrixWorld, pts = [[lb.min.x, lb.min.z], [lb.max.x, lb.min.z], [lb.max.x, lb.max.z], [lb.min.x, lb.max.z]]
    .map(([x, z]) => new THREE.Vector3(x, 0, z).applyMatrix4(e));
  const y0 = new THREE.Vector3(0, lb.min.y, 0).applyMatrix4(e).y, y1 = new THREE.Vector3(0, lb.max.y, 0).applyMatrix4(e).y;
  return { pts, y0: Math.min(y0, y1), y1: Math.max(y0, y1) };
}
function rectHitsBox(r, b, pad = 0.01) {   // SAT in xz: oriented rect vs axis-aligned box (shrunk by pad)
  const bx0 = b.min.x + pad, bx1 = b.max.x - pad, bz0 = b.min.z + pad, bz1 = b.max.z - pad;
  if (bx0 >= bx1 || bz0 >= bz1) return false;
  if (r.y1 < b.min.y + 0.02 || r.y0 > b.max.y - 0.02) return false;
  const xs = r.pts.map(p => p.x), zs = r.pts.map(p => p.z);
  if (Math.max(...xs) <= bx0 || Math.min(...xs) >= bx1 || Math.max(...zs) <= bz0 || Math.min(...zs) >= bz1) return false;
  const bc = [[bx0, bz0], [bx1, bz0], [bx1, bz1], [bx0, bz1]];
  for (let k = 0; k < 2; k++) {
    const a = r.pts[k], c = r.pts[k + 1], nx = -(c.z - a.z), nz = c.x - a.x;
    const pr = r.pts.map(p => p.x * nx + p.z * nz), pb = bc.map(([x, z]) => x * nx + z * nz);
    if (Math.max(...pr) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pr)) return false;
  }
  return true;
}
function rectHitsRect(r1, r2) {
  if (r1.y1 < r2.y0 + 0.02 || r2.y1 < r1.y0 + 0.02) return false;
  for (const [A, B] of [[r1, r2], [r2, r1]]) for (let k = 0; k < 2; k++) {
    const a = A.pts[k], c = A.pts[k + 1], nx = -(c.z - a.z), nz = c.x - a.x, l = Math.hypot(nx, nz) || 1;
    const pa = A.pts.map(p => (p.x * nx + p.z * nz) / l), pb = B.pts.map(p => (p.x * nx + p.z * nz) / l);
    if (Math.max(...pa) <= Math.min(...pb) + 0.025 || Math.max(...pb) <= Math.min(...pa) + 0.025) return false;   // ≥ 25 mm penetration (pivots sit mid-thickness: corners of neighbouring leaves overlap ~1–2 cm, real concealed hinges don't)
  }
  return true;
}
function audit({ rooms: only, only: onlyId } = {}) {
  scene.updateMatrixWorld(true);
  const saved = new Map([...movers].map(([k, mv]) => [k, mv.t]));
  for (const mv of movers.values()) { mv.t = 0; poseMover(mv); }
  scene.updateMatrixWorld(true);
  const gBoxes = [];
  for (const g of groups.values()) {
    if (!isShown(g.pivot) || !g.meshes.some(m => m.visible && !m.userData.mov && !m.userData.suppressed)) continue;
    if (/curtain|rug|runner|mat\b|plant|leaf|pendant|chandelier|downlight|lamp-shade|light/i.test(g.id + ' ' + g.name)) continue;
    // ignore floor-level parts (a rug grouped with a bed made the whole bed box reach the wardrobe)
    const b = new THREE.Box3(), mb = new THREE.Box3(); for (const m of g.meshes) if (!m.userData.mov && m.visible) { mb.setFromObject(m); if (mb.max.y >= 0.12) b.union(mb); }
    if (b.isEmpty() || b.max.y < 0.12) continue; gBoxes.push({ g, b });
  }
  const closedRects = new Map();
  const live = mv => { let v = false; mv.pivot.traverse(o => { if (o.isMesh && o.visible && !o.userData.suppressed && isShown(o)) v = true; }); return v; };
  for (const mv of movers.values()) if (live(mv) && mv.info.type !== 'roll' && mv.info.type !== 'gather') closedRects.set(mv.id, rectCorners(mv, moverLocalBox(mv)));
  const issues = [];
  for (const mv of movers.values()) {
    if (!closedRects.has(mv.id)) continue;
    const lb = moverLocalBox(mv), roomName = (mv.group && mv.group.room) || '';
    if (only && !only.includes(roomName)) continue;
    if (onlyId && mv.id !== onlyId) continue;
    const hitG = new Map(), hitM = new Map(), wallT = null;
    const r0 = closedRects.get(mv.id), host = new Set(gBoxes.filter(({ b }) => rectHitsBox(r0, b, -0.01)).map(({ g }) => g.id));   // the cabinet / wall panel it sits in
    for (let k = 1; k <= 10; k++) {
      mv.t = k / 10; poseMover(mv); mv.pivot.updateMatrixWorld(true);
      const r = rectCorners(mv, lb);
      for (const { g, b } of gBoxes) {
        if (g === mv.group || g.id === mv.carcass || host.has(g.id)) continue;
        if (rectHitsBox(r, b, 0.02) && !hitG.has(g.id)) hitG.set(g.id, { name: g.name, t: mv.t });
      }
      for (const [id, r2] of closedRects) if (id !== mv.id && !hitM.has(id) && rectHitsRect(r, r2)) hitM.set(id, mv.t);
    }
    mv.t = 0; poseMover(mv); mv.pivot.updateMatrixWorld(true);
    if (hitG.size || hitM.size || wallT !== null) issues.push({ id: mv.id, type: mv.info.type, label: mv.label, room: roomName,
      furniture: [...hitG.values()].map(h => `${h.name} @${Math.round(h.t * 100)}%`), movers: [...hitM].map(([id, t]) => `${id} @${Math.round(t * 100)}%`), wall: wallT });
  }
  for (const [k, mv] of movers) { mv.t = mv.target = saved.get(k); poseMover(mv); }
  shadowsDirty();
  return issues;
}
/* floating / leftover items: groups with nothing under them that are not wall-mounted, and v1 pieces still showing
   inside the footprint of an option-added product (parts of the furniture it replaced) */
// owner 2026-11-10 ("when the master bedroom door is open the wall designs come through the door"): every open room
// door leaf must have nothing within 3 cm in front of either face (wall finishes, panels, LEDs, furniture). Rays are cast
// from a 3 cm band outside each face towards the leaf; anything hit there pokes through the leaf or clashes with it.
function auditDoorLeaves({ band = 0.03 } = {}) {
  const out = [], shown = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  for (const mv of movers.values()) {
    if (mv.info.type !== 'door' || !shown(mv.pivot)) continue;
    const t0 = mv.t; mv.t = 1; poseMover(mv); mv.pivot.updateMatrixWorld(true);
    const lb = moverLocalBox(mv), sz = lb.getSize(new THREE.Vector3()), ax = sz.x < sz.z ? 'x' : 'z', al = ax === 'x' ? 'z' : 'x';
    const own = new Set(); mv.pivot.traverse(o => { if (o.isMesh) own.add(o); });
    const cand = items.filter(m => !own.has(m) && !['arch', 'floor', 'ceiling', 'exterior'].includes(m.userData.cat) && shown(m) && !m.userData.mov);
    const q = mv.pivot.getWorldQuaternion(new THREE.Quaternion()), hitsBy = new Map();
    for (const sg of [1, -1]) for (let i = 0; i < 12; i++) for (let j = 0; j < 9; j++) {
      const p = new THREE.Vector3(); p[al] = lb.min[al] + 0.03 + (sz[al] - 0.06) * i / 11; p.y = lb.min.y + 0.05 + (sz.y - 0.1) * j / 8;
      p[ax] = (sg > 0 ? lb.max[ax] : lb.min[ax]) + sg * 0.12;                               // start outside the leaf (handles make the box thick)
      const d = new THREE.Vector3(); d[ax] = -sg;
      lookRay.set(mv.pivot.localToWorld(p.clone()), d.applyQuaternion(q)); lookRay.far = 0.12 + sz[ax] + 0.05;
      if (blocked(lookRay.ray.origin.x, lookRay.ray.origin.z)) continue;                         // this face rests against a wall: only the room side is seen
      const hs = lookRay.intersectObjects([...own], false); if (!hs.length) continue;             // leaf surface along this ray
      const dLeaf = hs[0].distance, all = lookRay.intersectObjects(cand, false);
      // poke-through = one object surface ≥ 1 mm in front of the leaf face (within the band) AND the same object continues behind it
      const h = all.find(x => x.distance > dLeaf - band && x.distance < dLeaf - 0.001 && all.some(y => y.object === x.object && y.distance > dLeaf + 0.001));
      if (h) { const k = (h.object.userData.grp || h.object.parent?.userData?.grp || '') + ' ' + (h.object.material?.name || h.object.name); hitsBy.set(k, (hitsBy.get(k) || 0) + 1); }
    }
    mv.t = t0; poseMover(mv); mv.pivot.updateMatrixWorld(true);
    if (hitsBy.size) out.push({ door: mv.id, hits: [...hitsBy].map(([k, n]) => `${k.trim()} ×${n}`) });
  }
  return out;
}
function auditFloating() {
  scene.updateMatrixWorld(true);
  const solid = items.filter(m => m.visible && isShown(m) && !m.userData.mov);
  const vis = [...groups.values()].filter(g => isShown(g.pivot) && g.meshes.some(m => m.visible && !m.userData.suppressed && isShown(m)));
  const boxOf = g => { const b = new THREE.Box3(); for (const m of g.meshes) if (m.visible && !m.userData.suppressed) b.expandByObject(m); return b; };
  const out = { floating: [], leftovers: [] }, down = new THREE.Vector3(0, -1, 0);
  const own = g => new Set(g.meshes);
  for (const g of vis) {
    if (/curtain|pendant|chandelier|downlight|ceiling|fan|light|lamp|ac-|air-con|split/i.test(g.id + ' ' + g.name)) continue;
    const b = boxOf(g); if (b.isEmpty() || b.min.y < 0.04) continue;
    const mine = own(g), others = solid.filter(m => !mine.has(m));
    const c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3());
    let supported = false;
    for (const [fx, fz] of [[0, 0], [-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) {
      lookRay.set(new THREE.Vector3(c.x + fx * sz.x, b.min.y + 0.005, c.z + fz * sz.z), down); lookRay.far = 0.06;
      if (lookRay.intersectObjects(others, false).length) { supported = true; break; }
    }
    if (!supported) for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const dir = new THREE.Vector3(d[0], 0, d[1]), half = Math.abs(d[0]) ? sz.x / 2 : sz.z / 2;
      lookRay.set(c, dir); lookRay.far = half + 0.06;
      if (lookRay.intersectObjects(others.filter(m => m.userData.cat === 'arch' || m.userData.cat === 'furn'), false).some(h => h.distance > half - 0.06)) { supported = true; break; }
    }
    if (!supported) out.floating.push({ id: g.id, name: g.name, room: g.room, y: +b.min.y.toFixed(2), size: sz.toArray().map(v => +v.toFixed(2)) });
  }
  const added = vis.filter(g => g.added && !/\/fixed\//.test(g.id));
  for (const g of vis) {
    if (g.added || g.clone) continue;
    const b = boxOf(g); if (b.isEmpty()) continue;
    for (const a of added) {
      if (a.room !== g.room) continue;
      const ab = boxOf(a).expandByScalar(-0.02);
      if (b.min.x > ab.min.x - 0.01 && b.max.x < ab.max.x + 0.01 && b.min.z > ab.min.z - 0.01 && b.max.z < ab.max.z + 0.01 && b.min.y < ab.max.y && b.max.y > ab.min.y)
        { out.leftovers.push({ id: g.id, name: g.name, inside: a.name }); break; }
    }
  }
  return out;
}
/* ---------- common-sense pass on the v1 fittings (2026-11-10, owner: "check for these kind of issues and fix them everywhere") ----------
   1. a part mounted on a door (mirror on a wardrobe leaf) that was exported as its own mover is merged into that door
   2. (not a fix: two leaves hinged on one line have a partition between them — standard joinery)
   3. sliding wardrobes: handles / decor bands made flush with the panel face and tracks spaced ≥ 6 mm apart
   4. room doors whose swing hits furniture: try the other jamb, then the other swing side; keep the first clean one */
const fixLog = [];
function atClosed(mv, fn) { const t0 = mv.t; mv.t = 0; poseMover(mv); mv.pivot.updateMatrixWorld(true); const r = fn(); mv.t = t0; poseMover(mv); mv.pivot.updateMatrixWorld(true); return r; }
function rehinge(mv) {
  atClosed(mv, () => {
    const lb = moverLocalBox(mv), ax = (lb.max.x - lb.min.x) > (lb.max.z - lb.min.z) ? 'x' : 'z';
    const far = Math.abs(lb.max[ax]) > Math.abs(lb.min[ax]) ? lb.max[ax] : lb.min[ax], mid = (lb.min[ax] + lb.max[ax]) / 2;
    const R = new THREE.Matrix4().makeScale(ax === 'x' ? -1 : 1, 1, ax === 'z' ? -1 : 1);
    R.setPosition(ax === 'x' ? 2 * mid : 0, 0, ax === 'z' ? 2 * mid : 0);
    const off = new THREE.Vector3(); off[ax] = far;
    const M = new THREE.Matrix4().makeTranslation(-off.x, -off.y, -off.z).multiply(R);
    for (const c of [...mv.pivot.children]) c.applyMatrix4(M);
    mv.pivot.position.add(off.clone().applyQuaternion(mv.pivot.quaternion));
    mv.base = mv.pivot.position.clone();
    if (mv.free) mv.free.negate();
  });
  const i = mv.info; i.a1 = i.a0 - (i.a1 - i.a0);
  if (i.hinge) { const p = mv.pivot.getWorldPosition(new THREE.Vector3()); i.hinge = [p.x, 0, p.z]; }
  poseMover(mv);
}
function flipSwing(mv) { const i = mv.info; i.a1 = i.a0 - (i.a1 - i.a0); poseMover(mv); }
// cupboard leaves pivot on their FRONT face edge (like a concealed cup hinge) — pivoting on the back face swung the
// hinge-side corner of 4–5 cm thick leaves into the neighbouring leaf on a shared partition
function frontPivot(mv) {
  if (mv.info.type !== 'cab' || mv.fronted || mv.info.noFront || /fridge|freezer/.test(mv.label)) return; mv.fronted = true;   // fridge pins sit at the cabinet front: keep; noFront = angled leaves (the axis-box guess is wrong at 45°)
  atClosed(mv, () => {
    const lb = moverLocalBox(mv), thinAx = (lb.max.x - lb.min.x) < (lb.max.z - lb.min.z) ? 'x' : 'z';
    // front = the side the leaf's centre moves towards when it opens a little
    const c0 = lb.getCenter(new THREE.Vector3()), i = mv.info, a = (i.a1 - i.a0) * 0.2;
    const c1 = c0.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
    const sgn = Math.sign(c1[thinAx] - c0[thinAx]) || 1;
    const face = sgn > 0 ? lb.max[thinAx] : lb.min[thinAx];
    if (Math.abs(face) < 0.003) return;
    const off = new THREE.Vector3(); off[thinAx] = face;
    for (const ch of mv.pivot.children) ch.position.sub(off);
    mv.pivot.position.add(off.clone().applyQuaternion(mv.pivot.quaternion)); mv.base = mv.pivot.position.clone();
    if (i.hinge) { const p = mv.pivot.getWorldPosition(new THREE.Vector3()); i.hinge = [p.x, i.hinge[1], p.z]; }
  });
}
function closedBox(mv) { return atClosed(mv, () => new THREE.Box3().setFromObject(mv.pivot)); }
function commonSenseMovers() {
  const cabs = [...movers.values()].filter(mv => mv.info.type === 'cab' && !mv.added && !/\//.test(mv.id));
  cabs.forEach(frontPivot);
  // 1. door-mounted parts
  for (const a of cabs) for (const b of cabs) {
    if (a === b || !movers.has(a.id) || !movers.has(b.id)) continue;
    const ba = closedBox(a), bb = closedBox(b), sa = ba.getSize(new THREE.Vector3()), sb = bb.getSize(new THREE.Vector3());
    if (sb.x * sb.y * sb.z > sa.x * sa.y * sa.z) continue;
    const grown = ba.clone().expandByScalar(0.03);
    if (grown.containsBox(bb) && Math.hypot(a.info.hinge?.[0] - b.info.hinge?.[0] || 0, a.info.hinge?.[2] - b.info.hinge?.[2] || 0) > 0.01) {
      atClosed(a, () => atClosed(b, () => { for (const c of [...b.pivot.children]) a.pivot.attach(c); }));
      b.pivot.removeFromParent(); movers.delete(b.id);
      fixLog.push(`merged ${b.id} into the door it is mounted on (${a.id})`);
    }
  }
  // (two leaves hinged on one line are normal: a partition sits between them — not changed)
  // 3. sliding wardrobes
  const slides = [...movers.values()].filter(mv => mv.info.type === 'slide' && !/glass/i.test(mv.id) && !/\//.test(mv.id));
  const info = slides.map(mv => atClosed(mv, () => {
    const b = new THREE.Box3().setFromObject(mv.pivot), sz = b.getSize(new THREE.Vector3()), ax = sz.x < sz.z ? 'x' : 'z', along = ax === 'x' ? 'z' : 'x';
    const parts = []; mv.pivot.traverse(o => { if (o.isMesh) parts.push({ o, b: new THREE.Box3().setFromObject(o) }); });
    const area = p => (p.b.max[along] - p.b.min[along]) * (p.b.max.y - p.b.min.y);
    const panelA = (b.max[along] - b.min[along]) * sz.y;
    const body = parts.filter(p => area(p) > panelA * 0.3), extra = parts.filter(p => area(p) <= panelA * 0.3);
    const bb = new THREE.Box3(); body.forEach(p => bb.union(p.b));
    return { mv, ax, along, bb, extra };
  })).filter(x => !x.bb.isEmpty());
  const used = new Set();
  for (const x of info) {
    if (used.has(x)) continue;
    const set = info.filter(y => y.ax === x.ax && Math.abs(y.bb.getCenter(new THREE.Vector3())[y.ax] - x.bb.getCenter(new THREE.Vector3())[x.ax]) < 0.15 &&
      y.bb.max[y.along] > x.bb.min[x.along] - 1.5 && y.bb.min[y.along] < x.bb.max[x.along] + 1.5);
    if (set.length < 2) continue; set.forEach(y => used.add(y));
    const ax = x.ax;
    // room side = the side the handles stick out on
    let side = 0; for (const y of set) for (const e of y.extra) { if (e.b.max[ax] > y.bb.max[ax] + 0.003) side += 1; if (e.b.min[ax] < y.bb.min[ax] - 0.003) side -= 1; }
    if (!side) {   // handles set inside the frame: the cabinet is on the side with a surface right behind the panels
      const c = x.bb.getCenter(new THREE.Vector3()), cand = items.filter(m => !m.userData.mov), d = [1, -1].map(sg => { const v = new THREE.Vector3(); v[ax] = sg; lookRay.set(c, v); lookRay.far = 0.8; const h = lookRay.intersectObjects(cand, false)[0]; return h ? h.distance : 9; });
      side = d[0] < d[1] ? -1 : 1;
    }
    side = Math.sign(side);
    // flush handles / bands
    let flushed = 0;
    for (const y of set) for (const e of y.extra) {
      const proud = side > 0 ? e.b.max[ax] - (y.bb.max[ax] + 0.001) : (y.bb.min[ax] - 0.001) - e.b.min[ax];
      if (proud <= 0) continue;
      const w = new THREE.Vector3(); w[ax] = -side * proud; const p = e.o.getWorldPosition(new THREE.Vector3()).add(w);
      e.o.position.copy(e.o.parent.worldToLocal(p)); e.o.updateMatrixWorld(true); flushed++;
    }
    // tracks: sort rear → front and keep ≥ 6 mm between consecutive tracks
    const tracks = [];
    for (const y of [...set].sort((a, b) => side * (a.bb.getCenter(new THREE.Vector3())[ax] - b.bb.getCenter(new THREE.Vector3())[ax]))) {
      const c = y.bb.getCenter(new THREE.Vector3())[ax], t = tracks.find(t => Math.abs(t.c - c) < 0.004);
      if (t) t.items.push(y); else tracks.push({ c, items: [y] });
    }
    // positions in 'room-side' coordinates s = side * coord; off[k] = how far track k moves towards the room
    const fr = y => side > 0 ? y.bb.max[ax] : -y.bb.min[ax], bk = y => side > 0 ? y.bb.min[ax] : -y.bb.max[ax];
    const off = [0]; let moved = 0;
    for (let k = 1; k < tracks.length; k++) {
      const rearFront = Math.max(...tracks[k - 1].items.map(fr)) + off[k - 1], frontBack = Math.min(...tracks[k].items.map(bk));
      off[k] = Math.max(0, off[k - 1], rearFront + 0.006 - frontBack);
      if (off[k] > 0) for (const y of tracks[k].items) { const w = new THREE.Vector3(); w[ax] = side * off[k]; y.mv.pivot.position.add(w); y.mv.base.add(w); poseMover(y.mv); moved++; }
    }
    const shiftAcc = off[off.length - 1];
    fixLog.push(`sliding set ${set.map(y => y.mv.id.replace(/-\d+$/, '').slice(-24)).join(', ')}: ${flushed} handle/band parts made flush, ${moved} panels moved to clear tracks (${(shiftAcc * 1000).toFixed(0)} mm)`);
  }
}
function commonSenseDoors() {
  // after layouts: room doors whose swing hits furniture try the other jamb / the other swing side
  for (const mv of [...movers.values()].filter(mv => mv.info.type === 'door' && !/\//.test(mv.id))) {
    const hitsNow = () => (audit({ only: mv.id })[0] || { furniture: [] }).furniture.length;
    const opensIntoRoom = () => atClosed(mv, () => { const t0 = mv.t; mv.t = 1; poseMover(mv); mv.pivot.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(mv.pivot), c = b.getCenter(new THREE.Vector3()); mv.t = t0; poseMover(mv);
      return !!roomAt(c.x, c.z) && !hits(c.x, c.z); });
    const n0 = hitsNow(); if (!n0) continue;
    const tries = [['other jamb', () => rehinge(mv), () => rehinge(mv)], ['other swing side', () => flipSwing(mv), () => flipSwing(mv)],
      ['other jamb + other side', () => { rehinge(mv); flipSwing(mv); }, () => { flipSwing(mv); rehinge(mv); }]];
    let fixed = null;
    for (const [name, apply, undo] of tries) { apply(); if (opensIntoRoom() && hitsNow() === 0) { fixed = name; break; } undo(); }
    fixLog.push(fixed ? `${mv.id}: swing hit furniture → hinged on the ${fixed}` : `${mv.id}: swing hits furniture in every hinge/swing combination — door stop added; needs a layout change`);
  }
  // door stops: any hinged door / cupboard leaf that still hits something opens only as far as it is clear
  for (const r of audit()) {
    const mv = movers.get(r.id); if (!mv || !['door', 'cab'].includes(mv.info.type) || mv.added) continue;
    const t = Math.min(...[...r.furniture, ...r.movers].map(s => +s.match(/@(\d+)%/)[1] / 100)) - 0.1;
    if (t < 0.45) { fixLog.push(`${mv.id}: hits ${[...r.furniture, ...r.movers].join(', ')} early — left as is, needs a design change`); continue; }
    const i = mv.info, deg = Math.round(Math.abs(i.a1 - i.a0) * t * 180 / Math.PI);
    i.a1 = i.a0 + (i.a1 - i.a0) * t; poseMover(mv);
    fixLog.push(`${mv.id}: door stop at ${deg}° (would hit ${[...r.furniture, ...r.movers].join(', ').replace(/ @\d+%/g, '')})`);
  }
}
function animateMovers(dt) {
  let moved = false;
  for (const mv of movers.values()) {
    if (mv.t === mv.target) continue;
    const sp = dt / (mv.info.type === 'door' ? 0.9 : 0.6);
    mv.t = mv.target > mv.t ? Math.min(mv.target, mv.t + sp) : Math.max(mv.target, mv.t - sp);
    poseMover(mv); moved = true;
  }
  if (moved) { shadowsDirty(); clr.dirty = true; }
  animateMovers.moved = moved;
  // dynamic blockers (door leaves, sliding glass) for walking
  blockers.length = 0;
  for (const mv of movers.values()) {
    if (!mv.info.block || !isShown(mv.pivot)) continue;
    if (mv.free) { const a = mv.pivot.getWorldPosition(new THREE.Vector3()), b = mv.pivot.localToWorld(mv.free.clone()); blockers.push({ seg: [a.x, a.z, b.x, b.z] }); }
    else { const bx = new THREE.Box3().setFromObject(mv.pivot); blockers.push({ box: [bx.min.x, bx.min.z, bx.max.x, bx.max.z] }); }
  }
}
function isShown(o) { for (let a = o; a; a = a.parent) if (!a.visible) return false; return true; }
$('dOpen').onclick = () => { for (const mv of movers.values()) if (mv.info.type === 'door') toggleMover(mv, 1); setMsg('All room doors opened'); };
$('dClose').onclick = () => { for (const mv of movers.values()) if (mv.info.type === 'door') toggleMover(mv, 0); setMsg('All room doors closed'); };

/* ---------- furniture footprints (dynamic collision, follows edits) ---------- */
function computeFootprints() { for (const g of groups.values()) footprintOf(g); }
function footprintOf(g) {
  const fp = [Infinity, Infinity, -Infinity, -Infinity]; let any = false;
  for (const m of g.meshes) {
    if (m.userData.mov || m.parent !== g.pivot) continue;
    const pos = m.geometry.attributes.position, py = g.pivot.position.y;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) + py; if (y < 0.25 || y > 1.7) continue;
      const x = pos.getX(i), z = pos.getZ(i); any = true;
      if (x < fp[0]) fp[0] = x; if (z < fp[1]) fp[1] = z; if (x > fp[2]) fp[2] = x; if (z > fp[3]) fp[3] = z;
    }
  }
  g.fp = any && (fp[2] - fp[0]) * (fp[3] - fp[1]) > 0.0004 ? fp : null;
}
function hitsFurniture(x, z, r) {
  for (const g of groups.values()) {
    if (!g.fp || !g.pivot.visible || (!showLoose && g.loose)) continue;
    const p = g.pivot.position, ry = g.pivot.rotation.y, dx = x - p.x, dz = z - p.z;
    if (dx * dx + dz * dz > 12) continue;
    const c = Math.cos(-ry), s = Math.sin(-ry), lx = dx * c + dz * s, lz = -dx * s + dz * c;
    const f = g.fp;
    const qx = Math.max(f[0], Math.min(lx, f[2])), qz = Math.max(f[1], Math.min(lz, f[3]));
    if ((lx - qx) ** 2 + (lz - qz) ** 2 < r * r) return true;
  }
  return false;
}
function hitsBlockers(x, z, r) {
  for (const b of blockers) {
    if (b.seg) {
      const [ax, az, bx, bz] = b.seg, vx = bx - ax, vz = bz - az, L = vx * vx + vz * vz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L)), qx = ax + vx * t, qz = az + vz * t;
      if ((x - qx) ** 2 + (z - qz) ** 2 < (r + 0.03) ** 2) return true;
    } else {
      const [x0, z0, x1, z1] = b.box, qx = Math.max(x0, Math.min(x, x1)), qz = Math.max(z0, Math.min(z, z1));
      if ((x - qx) ** 2 + (z - qz) ** 2 < r * r) return true;
    }
  }
  return false;
}

/* ---------- interaction: look at something and click / press E ---------- */
const lookRay = new THREE.Raycaster(); lookRay.far = 2.8;
function pickAt(ndcX, ndcY, far) {
  lookRay.far = far; lookRay.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const cand = items.filter(m => m.visible && m.userData.cat !== 'ceiling' && isShown(m));
  const h = lookRay.intersectObjects(cand, false)[0]; if (!h) return null;
  const m = h.object;
  if (m.userData.mov && movers.has(m.userData.mov)) return { kind: 'mover', mv: movers.get(m.userData.mov), point: h.point };
  const g = m.userData.gid && groups.get(m.userData.gid);
  if (g && (g.seat || SEAT_RX.test(g.name + ' ' + g.id.split('/').slice(1).join('/')))) return { kind: 'seat', g, point: h.point };
  return null;
}
function interact() {
  if (walk.seated) { standUp(); return; }
  const p = pickAt(0, 0, 2.8);
  if (!p) { setMsg('Nothing to open or sit on here — look at a door, wardrobe, drawer, sofa, chair or bed'); return; }
  if (p.kind === 'mover' && /projector/.test(p.mv.label) && projRoom()) toggleProjector();
  else if (p.kind === 'mover') toggleMover(p.mv); else sitOn(p.g, p.point);
}
function sitOn(g, point) {
  const box = new THREE.Box3().setFromObject(g.pivot), c = box.getCenter(new THREE.Vector3());
  const arch = items.filter(m => m.userData.cat === 'arch');
  const others = items.filter(m => m.userData.gid && m.userData.gid !== g.id && m.visible && isShown(m));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const cast = (list, d) => { lookRay.far = 3; lookRay.set(new THREE.Vector3(c.x, box.min.y + 0.45, c.z), new THREE.Vector3(d[0], 0, d[1])); const h = lookRay.intersectObjects(list, false)[0]; return h ? h.distance : 9; };
  const wall = dirs.map(d => [cast(arch, d), d]).sort((a, b) => a[0] - b[0])[0];
  let face;
  if (wall[0] < 1.4) face = [-wall[1][0], -wall[1][1]];
  else { const f = dirs.map(d => [cast(others, d), d]).sort((a, b) => a[0] - b[0])[0]; face = f[1]; }
  const isBed = /king|queen|\bbed\b|mattress|duvet/i.test(g.name + ' ' + g.id.split('/').slice(1).join('/'));
  const sx = THREE.MathUtils.clamp(point.x, box.min.x + 0.2, box.max.x - 0.2) - face[0] * 0.1;
  const sz = THREE.MathUtils.clamp(point.z, box.min.z + 0.2, box.max.z - 0.2) - face[1] * 0.1;
  walk.seated = { name: g.name, eye: isBed ? 1.2 : 1.12, prev: [walk.x, walk.z] };
  walk.x = sx; walk.z = sz; walk.yaw = Math.atan2(-face[0], -face[1]); walk.pitch = -0.05;
  setMsg(`Sitting on ${g.name} · eye height ${walk.seated.eye.toFixed(2)} m · look around with the mouse · E or W/S to stand up · to MOVE furniture press V (Room view), click it, then drag it`);
}
function standUp() {
  const [x, z] = nearestFree(walk.seated.prev[0], walk.seated.prev[1]); walk.x = x; walk.z = z; walk.seated = null;
  setMsg('Standing · E on a door, wardrobe or drawer to open it · E on a sofa, chair or bed to sit');
}
let hintT = 0;
function updateHint() {
  const el = $('hint'); if (mode !== 'walk' || !walk.locked || picking) { el.style.display = 'none'; return; }
  const now = performance.now(); if (now - hintT < 120) return; hintT = now;
  if (walk.seated) { el.textContent = 'E · stand up'; el.style.display = 'block'; return; }
  const p = pickAt(0, 0, 2.8);
  if (!p) { el.style.display = 'none'; return; }
  el.textContent = p.kind === 'mover' ? `E / click · ${p.mv.info.type === 'roll' ? (p.mv.target > 0.5 ? 'raise' : 'lower') : (p.mv.target > 0.5 ? 'close' : 'open')} ${p.mv.label}` : `E / click · sit on ${p.g.name.toLowerCase()}`;
  el.style.display = 'block';
}
canvas.addEventListener('dblclick', e => {
  if (mode === 'walk') return;
  const p = pickAt(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1, 60);
  if (p && p.kind === 'mover') { if (/projector/.test(p.mv.label) && projRoom()) toggleProjector(); else toggleMover(p.mv); }
});

/* ---------- furniture groups ---------- */
function buildGroups(raw) {
  const by = new Map();
  for (const m of raw) if (m.userData.cat === 'furn' && m.userData.grp) {
    if (!by.has(m.userData.grp)) by.set(m.userData.grp, []); by.get(m.userData.grp).push(m);
  }
  for (const [id, meshes] of by) {
    const box = new THREE.Box3(); meshes.forEach(m => box.expandByObject(m));
    const pivot = new THREE.Group();
    pivot.position.set((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2);
    scene.add(pivot); pivot.updateMatrixWorld(true);
    let best = null, bv = -1;
    for (const m of meshes) { const s = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3()), v = s.x * s.y * s.z; if (v > bv) { bv = v; best = m; } }
    const dom = best.material, name = friendly(best.name);
    const merged = bakeAndMerge(meshes, pivot, () => '');
    for (const m of merged) { origMat.set(m, m.material); m.userData.gid = id; items.push(m); }
    groups.set(id, { id, pivot, meshes: merged, dom, colMat: null, col: null, name, clone: false, room: meshes[0].userData.rooms[0] || null, loose: LOOSE_RX.test(id.split('/')[1] + ' ' + name),
      init: { x: pivot.position.x, y: pivot.position.y, z: pivot.position.z, ry: 0 } });
  }
}
function friendly(n) { return (n || 'Item').replace(/\.\d+$/, '').replace(/_\d+$/, '').replace(/_/g, ' '); }
function gState(g) { return { x: g.pivot.position.x, z: g.pivot.position.z, ry: g.pivot.rotation.y, hide: !g.pivot.visible, col: g.col }; }
function applyState(g, s) {
  g.pivot.position.x = s.x; g.pivot.position.z = s.z; g.pivot.rotation.y = s.ry; g.pivot.visible = !s.hide; setColor(g, s.col || null); shadowsDirty();
}
function setColor(g, hex) {
  g.col = hex;
  for (const m of g.meshes) {
    const o = origMat.get(m);
    if (hex && o === g.dom) {
      if (!g.colMat) { g.colMat = g.dom.clone(); g.colMat.onBeforeCompile = g.dom.onBeforeCompile; g.colMat.customProgramCacheKey = g.dom.customProgramCacheKey; }
      g.colMat.color.set(hex); m.material = g.colMat;
    } else m.material = o;
  }
}
function changed(g) {
  const b = g.base || { x: g.init.x, z: g.init.z, ry: g.init.ry || 0, hide: false, col: null }, p = g.pivot;
  return g.clone || p.visible === b.hide || (g.col || null) !== (b.col || null) || Math.abs(p.position.x - b.x) > 1e-4 || Math.abs(p.position.z - b.z) > 1e-4 || Math.abs(p.rotation.y - b.ry) > 1e-4;
}

/* ---------- persistence: { v: 2, sel: { room: optionId }, edits: { 'room|optionId': { items, clones } } } ---------- */
let store = { v: 2, sel: {}, edits: {}, chosen: {}, variant: {} };
function exportRoom(room) {
  const out = { items: {}, clones: {} };
  for (const g of groups.values()) {
    if (g.room !== room || !changed(g)) continue;
    if (g.clone) out.clones[g.id] = { src: g.src, ...gState(g) }; else out.items[g.id] = gState(g);
  }
  return out;
}
function applyRoomEdits(d) {
  for (const [id, s] of Object.entries(d.clones || {})) { const src = groups.get(s.src); if (src) { const c = cloneGroup(src, id); applyState(c, s); } }
  for (const [id, s] of Object.entries(d.items || {})) { const g = groups.get(id); if (g) applyState(g, s); }
}
function exportLayout() {
  const edits = { ...store.edits };
  for (const r of roomNames) if (store.sel[r]) edits[r + '|' + store.sel[r]] = exportRoom(r);
  return { v: 2, sel: { ...store.sel }, edits, chosen: { ...(store.chosen || {}) }, variant: { ...(store.variant || {}) }, mig: { ...(store.mig || {}) } };
}
function persist() { store = exportLayout(); try { localStorage.setItem(STORE, JSON.stringify(store)); } catch (e) { /* storage unavailable */ } }
function importLayout(d) {
  if (!d || d.v !== 2) d = { v: 2, sel: {}, edits: {} };
  const chosen = { ...(d.chosen || {}) };
  store = { v: 2, sel: { ...(d.sel || {}) }, edits: { ...(d.edits || {}) }, chosen, variant: { ...(d.variant || {}) } };
  // one-time migration (2026-11-10): Dress option1 became 'Walk-in designs' with switchable passage wall + wardrobe.
  // Original → option1 (identical look: Buddha + original wardrobe); an earlier option1 pick meant the carved stone wall.
  if (!(d.mig && d.mig.dress1110)) {
    if (store.sel.Dress === 'original') store.sel.Dress = 'option1';
    else if (store.sel.Dress === 'option1' && !store.variant['Dress|option1|passage']) store.variant['Dress|option1|passage'] = 'carved-stone';
  }
  // one-time (owner 2026-11-11: "for now revert my sofa change in the balcony"): drop the owner's saved moves of the
  // master-balcony outward bench set (it now stands 1 ft out against the drain-pipe enclosure, layouts/site.js)
  if (!(d.mig && d.mig.balbench1111)) {
    const rx = /^master-balcony\/(outward-four-seat|outward-bench|balcony-bench|cushion-woven|handloom-accent|compact-balcony|cantilever-tea|balcony-brass|balcony-tea)/;
    for (const [k, e] of Object.entries(store.edits)) if (k.startsWith('Master balcony|') && e) {
      const items = { ...(e.items || {}) }; for (const id of Object.keys(items)) if (rx.test(id)) delete items[id];
      store.edits[k] = { ...e, items };
    }
  }
  // one-time (owner 2026-11-11: "computer table and chair are still not changed"): Bedroom 1 + 2 option1 now hold the owners'
  // models (beds, desk, monitor, keyboard, mouse) — a saved 'original' pick kept the old room → move both to option1 once
  if (!(d.mig && d.mig.bedrooms1111)) { for (const r of ['Bedroom 1', 'Bedroom 2']) if (store.sel[r] !== 'option1') store.sel[r] = 'option1'; }
  // one-time (owner 2026-11-11: "replace all the outdoor chairs with this"): the balconies got option1 (wicker armchair model).
  // Carry the owner's saved moves of the other balcony items (e.g. the master-balcony bench) from 'original' to option1
  // (minus the old chairs, which option1 hides) and switch a saved 'original' pick to option1.
  if (!(d.mig && d.mig.outchair1111)) {
    const old = /^(master-balcony\/outward-movable#|family-balcony\/family-balcony#|bedroom-1-balcony\/bedroom-1#)/;
    for (const r of ['Master balcony', 'Family balcony', 'Bedroom 1 balcony']) {
      const e = store.edits[r + '|original'];
      if (e && !store.edits[r + '|option1']) {
        const items = { ...(e.items || {}) }; for (const id of Object.keys(items)) if (old.test(id)) delete items[id];
        const clones = Object.fromEntries(Object.entries(e.clones || {}).filter(([, c]) => !old.test((c && c.src) || '')));
        store.edits[r + '|option1'] = { ...e, items, clones };
      }
      if (store.sel[r] && store.sel[r] !== 'option1') store.sel[r] = 'option1';
    }
  }
  // one-time (owner 2026-11-11: utility sink on the east wall, washer + west sink removed): Utility got option1 — carry the
  // owner's saved 'original' moves (minus the removed washer / west sink set) and switch a saved 'original' pick to option1
  if (!(d.mig && d.mig.utilsink1111)) {
    const old = /^utility\/(front-loading|washing-machine|utility-cleaning|utility-faucet|utility-countertop|utility-storage)#/;
    const e = store.edits['Utility|original'];
    if (e && !store.edits['Utility|option1']) {
      const items = { ...(e.items || {}) }; for (const id of Object.keys(items)) if (old.test(id)) delete items[id];
      const clones = Object.fromEntries(Object.entries(e.clones || {}).filter(([, c]) => !old.test((c && c.src) || '')));
      store.edits['Utility|option1'] = { ...e, items, clones };
    }
    if (store.sel.Utility && store.sel.Utility !== 'option1') store.sel.Utility = 'option1';
  }
  store.mig = { ...(d.mig || {}), dress1110: 1, balbench1111: 1, bedrooms1111: 1, outchair1111: 1, utilsink1111: 1 };
  for (const r of roomNames) setRoomLayout(r, (chosen[r] && store.sel[r]) || DEFAULTS[r] || 'original', { quiet: true });
  applyVisibility(); renderLayoutUI();
}
function loadStored() { let d = null; try { d = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { /* ignore corrupt state */ } importLayout(d); }

/* ---------- per-room layout options (layouts/registry.js) ---------- */
const layoutMods = {}, layoutExtras = {}, roomMood = {};
let layoutRoom = 'Master bedroom';
const ORIGINAL = { id: 'original', name: 'Original (version 1)', summary: 'The room exactly as designed in the version-1 Blender file.', facts: [], apply() { return {}; } };
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
async function loadLayouts() {
  for (const r of roomNames) layoutMods[r] = [ORIGINAL];
  for (const [room, files] of Object.entries(ROOM_LAYOUTS)) for (const f of files) {
    try { const m = (await import('./layouts/' + f)).default; if (layoutMods[room]) layoutMods[room].push(m); }
    catch (e) { console.error('layout', f, e); }
  }
}
// a layout option may set its room's curtains: result.curtains = 'drawn' | { blackout: true, sheer: 0|1, drape: 0|1 } (0 = drawn closed,
// 1 = gathered open). blackout swaps the room-side drape for a lined, fully opaque blackout fabric (owner 2026-11-10: 2 layers —
// blackout + semi-transparent sheer); any other option restores the original drape.
const BLACKOUT = new THREE.MeshPhysicalMaterial({ name: '__curtain_blackout', color: 0x7a6d60, roughness: 1, sheen: 0.8, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xfff4e6), side: THREE.DoubleSide });
function curtainPref(room) { const r = layoutExtras[room] && layoutExtras[room].result && layoutExtras[room].result.curtains; return r === 'drawn' ? { sheer: 0, drape: 0 } : r || null; }
function applyCurtainPref(room) {
  const pref = curtainPref(room);
  for (const mv of movers.values()) {
    if (mv.info.type !== 'gather' || !mv.group || mv.group.room !== room) continue;
    const drape = /:cd\d+$/.test(mv.id);
    if (drape) for (const m of mv.group.meshes) if (m.userData.mov === mv.id) { if (!m.userData.origDrape) m.userData.origDrape = m.material; m.material = pref && pref.blackout ? BLACKOUT : m.userData.origDrape; origMat.set(m, m.material); }
    if (pref) { mv.t = mv.target = drape ? (pref.drape ?? 0) : (pref.sheer ?? 0); poseMover(mv); }
  }
  invalidate();
}
function setRoomLayout(room, id, { quiet = false } = {}) {
  const prev = store.sel[room];
  if (!quiet && prev) store.edits[room + '|' + prev] = exportRoom(room);
  if (selected && selected.room === room) select(null);
  const ex = layoutExtras[room];
  if (ex) {
    ex.groups.forEach(removeGroup);
    for (const m of ex.suppressed) delete m.userData.suppressed;
    for (const c of ex.cuts || []) c.mesh.geometry.setIndex(c.index);   // undo cutStatic
    for (const d of ex.dressed) { const set = new Set(d.meshes); d.meshes.forEach(m => m.removeFromParent()); d.g.meshes = d.g.meshes.filter(m => !set.has(m)); items = items.filter(m => !set.has(m)); }
  }
  layoutExtras[room] = { groups: [], moods: [], result: {}, dressed: [], suppressed: [], cuts: [] };
  for (const g of [...groups.values()]) if (g.room === room && g.clone) removeClone(g);
  // permanent fixtures (curtains) keep their own pose: resetting them to ry 0 turned the master curtain round, outside the wall (2026-11-10)
  for (const g of groups.values()) if (g.room === room && !g.fixture) { g.base = null; applyState(g, { x: g.init.x, z: g.init.z, ry: g.init.ry || 0, hide: false, col: null }); }
  const mod = (layoutMods[room] || [ORIGINAL]).find(m => m.id === id) || ORIGINAL;
  store.sel[room] = mod.id;
  try { layoutExtras[room].result = mod.apply(makeCtx(room, mod.id)) || {}; }
  catch (e) { console.error(e); setMsg(`Layout error in ${room} / ${mod.id}: ${e.message}`); }
  for (const g of groups.values()) if (g.room === room) g.base = gState(g);
  const ed = store.edits[room + '|' + mod.id]; if (ed) applyRoomEdits(ed);
  setMood(room, roomMood[room] || 'normal');
  // owner 2026-11-10: switching a design while the projector plays must keep the new screen + projector down and playing
  const pst = projState[room], pp = projectorParts(room);
  if (pst && pst.on && pp) { for (const mv of [pp.roll, pp.lift]) if (mv) { mv.t = mv.target = 1; poseMover(mv); } pst.fade = 0; pst.swapT = 0; pst.t0 = performance.now() - 500; }
  applyCurtainPref(room);
  buildInteriors();
  shadowsDirty(); clr.dirty = true; lightT = 0;
  if (!quiet) { undoStack.length = 0; persist(); applyVisibility(); renderLayoutUI(); setMsg(`${room}: ${mod.name}`); }
}
function resetRoom(room) {
  delete store.edits[room + '|' + store.sel[room]];
  setRoomLayout(room, store.sel[room], { quiet: true }); undoStack.length = 0; persist(); applyVisibility(); renderLayoutUI();
}
function removeGroup(g) {
  if (selected === g) select(null);
  g.pivot.removeFromParent();
  const set = new Set(g.meshes); items = items.filter(m => !set.has(m));
  for (const [k, mv] of movers) if (mv.group === g) movers.delete(k);
  groups.delete(g.id);
}
function makeCtx(room, opt) {
  const slug = slugify(room), ex = layoutExtras[room];
  const own = () => [...groups.values()].filter(g => g.room === room && !g.added && !g.clone);
  const short = g => g.id.slice(slug.length + 1);
  // switchable elements: an option may offer `slots` [{ id, label, variants:[{id,name,summary,search}], default }]
  // (legacy `variants` = slot 'style'); ctx.slot(id) / ctx.variant = the chosen design of each element
  const omod = (layoutMods[room] || []).find(m => m.id === opt);
  const slot = sid => slotValue(room, opt, sid);
  return {
    THREE, room, bounds: rooms[room], ceiling: CEIL_H, lib: layoutLib, variant: slot('style'), slot,
    find: re => own().filter(g => re.test(short(g))),
    one: name => groups.get(slug + '/' + name),
    byCol: cols => own().filter(g => g.meshes.some(m => cols.includes(m.userData.col))),
    box: g => new THREE.Box3().setFromObject(g.pivot),
    pose: (g, x, z, ry) => { g.pivot.position.x = x; g.pivot.position.z = z; if (ry !== undefined) g.pivot.rotation.y = ry; },
    hide: g => { g.pivot.visible = false; },
    rigid: (list, a, b, rot) => {
      const c = Math.cos(rot), s = Math.sin(rot);
      for (const g of list) { const p = g.pivot.position, dx = p.x - a.x, dz = p.z - a.z; p.x = b.x + dx * c + dz * s; p.z = b.z - dx * s + dz * c; g.pivot.rotation.y += rot; }
    },
    clearZone: (x0, z0, x1, z1, { keep } = {}) => {
      for (const g of own()) {
        if (!g.pivot.visible || (keep && keep.test(short(g)))) continue;
        const b = new THREE.Box3().setFromObject(g.pivot); if (b.max.y < 0.12 || b.min.y > 2.6) continue;
        if (b.min.x < x1 && b.max.x > x0 && b.min.z < z1 && b.max.z > z0) g.pivot.visible = false;
      }
    },
    add: (name, built, x, z, ry, o) => addBuilt(room, opt, name, built, x, z, ry, o),
    // hide parts of a v1 group by material name, and dress it with new built geometry (both undone on option switch)
    // hide v1 movers (cabinet doors etc.) that are not inside any furniture group, by mover id (e.g. /^35-/ = collection 35)
    // remove the triangles of merged static meshes (cats, e.g. ['ceilfix']) of this room whose centre lies in a world box —
    // for v1 bits a new design exposes (merged per room, so they cannot be hidden one by one); undone on every switch
    cutStatic: (min, max, cats) => {
      const B = new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max)), c = new THREE.Vector3(), v = new THREE.Vector3();
      for (const m of items) {
        if (!cats.includes(m.userData.cat) || !(m.userData.rooms || []).includes(room) || m.userData.mov) continue;
        m.updateMatrixWorld(true); const wb = new THREE.Box3().setFromObject(m); if (!wb.intersectsBox(B)) continue;
        const geo = m.geometry, pos = geo.attributes.position, old = geo.index, idx = old ? old.array : Array.from({ length: pos.count }, (_, i) => i), keep = [];
        for (let i = 0; i < idx.length; i += 3) { c.set(0, 0, 0); for (let k = 0; k < 3; k++) c.add(v.fromBufferAttribute(pos, idx[i + k]).applyMatrix4(m.matrixWorld)); c.multiplyScalar(1 / 3); if (!B.containsPoint(c)) keep.push(idx[i], idx[i + 1], idx[i + 2]); }
        if (keep.length === idx.length) continue;
        ex.cuts.push({ mesh: m, index: old }); geo.setIndex(keep);
      }
    },
    // same for a v1 furniture group whose merged per-material meshes span several pieces (e.g. bedroom 2: bed + wardrobe share
    // one teak mesh): drop only the triangles whose centre lies in the world box; `re` limits it to material names; undone on switch
    cutGroup: (g, min, max, re) => {
      const B = new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max)), c = new THREE.Vector3(), v = new THREE.Vector3();
      g.pivot.updateMatrixWorld(true);
      for (const m of g.meshes) {
        if (m.userData.mov || (re && !re.test(m.material.name))) continue;
        const wb = new THREE.Box3().setFromObject(m); if (!wb.intersectsBox(B)) continue;
        const geo = m.geometry, pos = geo.attributes.position, old = geo.index, idx = old ? old.array : Array.from({ length: pos.count }, (_, i) => i), keep = [];
        for (let i = 0; i < idx.length; i += 3) { c.set(0, 0, 0); for (let k = 0; k < 3; k++) c.add(v.fromBufferAttribute(pos, idx[i + k]).applyMatrix4(m.matrixWorld)); c.multiplyScalar(1 / 3); if (!B.containsPoint(c)) keep.push(idx[i], idx[i + 1], idx[i + 2]); }
        if (keep.length === idx.length) continue;
        ex.cuts.push({ mesh: m, index: old }); geo.setIndex(keep);
      }
    },
    // hide whole static (non-furniture) meshes of this room by object name, e.g. a v1 AC an option replaces; undone on switch
    hideStatic: re => { for (const m of items) if (re.test(m.name || '') && (m.userData.rooms || []).includes(room) && !m.userData.mov) { m.userData.suppressed = true; ex.suppressed.push(m); } },
    hideMovers: re => { for (const [id, mv] of movers) if (!mv.group && re.test(id)) for (const m of items) if (m.userData.mov === id) { m.userData.suppressed = true; ex.suppressed.push(m); } },   // explicit ids: also parts tagged to the neighbouring room
    suppress: (g, re) => { for (const m of g.meshes) if (re.test(m.material.name)) { m.userData.suppressed = true; ex.suppressed.push(m); } },
    localBox: (g, re) => { const b = new THREE.Box3(); for (const m of g.meshes) if (m.parent === g.pivot && re.test(m.material.name)) { m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox); } return b; },
    dress: (g, built, x, z, ry = 0) => {
      const obj = built.obj; obj.position.set(x, 0, z); obj.rotation.y = ry; g.pivot.add(obj); g.pivot.updateMatrixWorld(true);
      const ms = []; obj.traverse(c => { if (c.isMesh) { c.userData = { cat: 'furn', rooms: [room], gid: g.id }; ms.push(c); } });
      const merged = bakeAndMerge(ms, g.pivot, () => 'dress'); obj.removeFromParent();
      merged.forEach(m => { origMat.set(m, m.material); items.push(m); g.meshes.push(m); setShadowFlags(m); });
      ex.dressed.push({ g, meshes: merged });
    },
    mood: m => { if (m) ex.moods.push(m); },
  };
}
function addBuilt(room, opt, name, built, x, z, ry = 0, o = {}) {
  // opt === null → permanent fixture (curtains): not owned by a layout option, survives option switches
  const id = slugify(room) + '/' + (opt || 'fixed') + '/' + name, ex = opt ? layoutExtras[room] : { groups: [] };
  const pivot = new THREE.Group(); pivot.position.set(x, 0, z); pivot.rotation.y = ry; scene.add(pivot);
  const obj = built.obj; pivot.add(obj); pivot.updateMatrixWorld(true);
  const lights = []; obj.traverse(c => { if (c.isLight) lights.push(c); });
  const plain = [], movs = new Map();
  obj.traverse(c => {
    if (!c.isMesh) return; const sp = c.userData.moverSpec;
    if (sp) { if (!movs.has(sp.id)) movs.set(sp.id, { sp, meshes: [] }); movs.get(sp.id).meshes.push(c); } else plain.push(c);
  });
  for (const m of [...plain, ...[...movs.values()].flatMap(v => v.meshes)]) m.userData = { cat: 'furn', rooms: [room], gid: id, added: true, ...(m.userData.loose ? { loose: true } : {}) };
  lights.forEach(l => { pivot.attach(l); if (l.isRectAreaLight && !RL_ALL) l.layers.set(RL_LAYER); });   // pool source from the first frame (else one recompile per option switch)
  if (lights.length) rl.t = 0;
  const g = { id, pivot, meshes: [], dom: null, colMat: null, col: null, name: (o && o.name) || name, clone: false, added: true, seat: !!(o && o.seat), loose: !!(o && (o.loose || o.seat)), room, init: { x, y: 0, z, ry } };
  groups.set(id, g); ex.groups.push(g);
  // o.follow = short id of a lead group added earlier by the same option (bench, under-bed glow, halo → 'bed'): dragging the
  // lead moves these with it (owner 2026-11-11 drag request)
  // resolved when a drag starts (followersOf), so a follower may be added before its lead (option2 headboard screen)
  if (o && o.follow && opt) g.followOf = slugify(room) + '/' + opt + '/' + o.follow;
  // light-only layers (additive washes, pools, halos, neon) must never catch clicks / E / audits: the curtain cove wash hid the
  // curtain from interaction (owner 2026-11-10: "unable to open the curtains")
  const glowOnly = m => { const mt = m.material; return mt && !Array.isArray(mt) && (mt.blending === THREE.AdditiveBlending || (mt.transparent && mt.depthWrite === false && /wash|pool|glow|neon|halo/i.test(mt.name))); };
  const keep = m => { origMat.set(m, m.material); items.push(m); g.meshes.push(m); setShadowFlags(m); if (glowOnly(m)) m.raycast = () => {}; if (/^__mirror_reflective/.test(m.material.name)) addMirrorProbe(m); };
  bakeAndMerge(plain, pivot, m => m.userData.loose ? 'loose' : '').forEach(keep);
  for (const [mid, v] of movs) {
    const sp = v.sp, piv = new THREE.Group(); pivot.add(piv);
    const h = sp.hinge || [0, 0, 0]; piv.position.set(h[0], h[1], h[2]); piv.updateMatrixWorld(true);
    const fullId = id + ':' + mid;
    bakeAndMerge(v.meshes, piv, () => '').forEach(m => { m.userData.mov = fullId; keep(m); });
    const info = { type: sp.type, a0: 0, a1: sp.a1 || 0, slide: sp.slide || [0, 0, 0], min: sp.min, start: sp.start || 0, block: 0, fitted: !!sp.fitted, noFront: !!sp.noFront };
    const mv = { id: fullId, info, pivot: piv, base: piv.position.clone(), t: info.start, target: info.start, group: g, label: sp.label || 'cupboard', free: null };
    movers.set(fullId, mv); poseMover(mv); frontPivot(mv);
  }
  obj.removeFromParent();
  let bv = -1;
  for (const m of g.meshes) { if (m.material.name === 'LED') continue; const s = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3()), v = s.x * s.y * s.z; if (v > bv) { bv = v; g.dom = m.material; } }
  footprintOf(g);
  return g;
}

/* ---------- curtains: ceiling-to-floor, wall-to-wall on every window wall (layouts/curtains.js) ---------- */
function buildCurtains() {
  const ceilMeshes = items.filter(m => m.userData.cat === 'ceiling'), up = new THREE.Raycaster();
  for (const w of CURTAIN_WALLS) {
    const slug = slugify(w.room) + '/';
    const old = [...groups.values()].filter(g => g.room === w.room && !g.added && w.retire && w.retire.test(g.id.slice(slug.length)));
    const drapeSrc = old.find(g => w.drape && w.drape.test(g.id.slice(slug.length)));
    for (const g of old) { g.retired = true; g.fp = null; g.meshes.forEach(m => { m.userData.suppressed = true; }); }
    // ceiling underside along the wall (false ceilings / coves differ per room): lowest hit 6 cm in front of the wall
    let ceil = Infinity;
    for (const f of [0.15, 0.5, 0.85]) {
      const s = w.a + (w.b - w.a) * f, d = w.into * 0.06;
      const o = w.axis === 'z' ? new THREE.Vector3(s, 1.5, w.line + d) : new THREE.Vector3(w.line + d, 1.5, s);
      up.set(o, new THREE.Vector3(0, 1, 0)); up.far = 2.5;
      const h = up.intersectObjects(ceilMeshes, false)[0]; if (h) ceil = Math.min(ceil, h.point.y);
    }
    if (!isFinite(ceil) || ceil < 2.3) ceil = CEIL_H;
    const built = buildCurtainWall(Math.abs(w.b - w.a), ceil, { hem: w.hem, depth: w.depth, ...(drapeSrc && drapeSrc.dom ? { drapeMat: drapeSrc.dom } : {}) });
    const p = wallPose(w);
    const g = addBuilt(w.room, null, 'curtains', built, p.x, p.z, p.ry, { name: `Curtains (${w.room}, ceiling ${ceil.toFixed(2)} m, ${Math.abs(w.b - w.a).toFixed(2)} m wall)` });
    g.fp = null; g.fixture = true;   // hangs against the wall: never blocks walking to the balcony
  }
  for (const r of Object.keys(layoutExtras)) applyCurtainPref(r);
  // test param: curtains=open (everything gathered) | closed (everything drawn)
  const cp = params.get('curtains');
  if (cp) for (const mv of movers.values()) if (mv.info.type === 'gather') { mv.t = mv.target = cp === 'open' ? 1 : 0; poseMover(mv); }
}

/* ---------- site conditions (layouts/site.js): fixed in every design, e.g. the master-balcony drain-pipe enclosure ---------- */
function buildSiteFixtures() {
  const ceilMeshes = items.filter(m => m.userData.cat === 'ceiling'), up = new THREE.Raycaster();
  for (const f of SITE_FIXTURES) {
    const slug = slugify(f.room) + '/', v1 = [...groups.values()].filter(g => g.room === f.room && !g.added);
    for (const g of v1.filter(g => f.retire && f.retire.test(g.id.slice(slug.length)))) { g.retired = true; g.fp = null; g.meshes.forEach(m => { m.userData.suppressed = true; m.visible = false; }); }
    if (f.shift) for (const g of v1.filter(g => f.shift.re.test(g.id.slice(slug.length)))) { g.pivot.position.z += f.shift.dz; g.init.z += f.shift.dz; g.pivot.updateMatrixWorld(true); footprintOf(g); }
    // ceiling underside above the fixture (balcony slab / false ceiling)
    let ceil = Infinity;
    for (const t of [0.2, 0.5, 0.8]) { up.set(new THREE.Vector3(f.x0 + (f.x1 - f.x0) * t, 1.5, f.wallZ + f.depth / 2), new THREE.Vector3(0, 1, 0)); up.far = 2.5; const h = up.intersectObjects(ceilMeshes, false)[0]; if (h) ceil = Math.min(ceil, h.point.y); }
    if (!isFinite(ceil) || ceil < 2.3) ceil = CEIL_H;
    const g = addBuilt(f.room, null, f.name, f.build(layoutLib, ceil, f), (f.x0 + f.x1) / 2, f.wallZ, 0, { name: f.label });
    g.fixture = true;   // keeps its collision footprint: the strip really is unusable
  }
  for (const b of BUNDLES) { const slug = slugify(b.room) + '/'; for (const g of groups.values()) if (g.room === b.room && !g.added && b.re.test(g.id.slice(slug.length))) g.bundle = slug + b.name; }
  shadowsDirty();
}

/* ---------- mood lighting for option-built LED strips ---------- */
const MOODS = { normal: { c: 0xffc890, s: 2.4, g: 4 }, gaming: { c: null, s: 3.4, g: 7 }, movie: { c: 0xff9a4a, s: 0.55, g: 0.9 }, off: { c: 0x000000, s: 0, g: 0 } };
function setMood(room, mood) {
  roomMood[room] = mood; const m = MOODS[mood] || MOODS.normal, ex = layoutExtras[room]; if (!ex) return;
  for (const md of ex.moods) {
    for (const mat of md.strips || []) { if (m.c !== null) mat.emissive.set(m.c); mat.emissiveIntensity = m.s; }
    for (const l of md.glow || []) { if (m.c !== null) l.color.set(m.c); l.intensity = m.g; }
    for (const h of md.halos || []) { if (m.c !== null) h.color.set(m.c); h.opacity = Math.min(1, m.s / 2.4); }   // LED washes
    for (const mat of md.accent || []) mat.emissiveIntensity = m.s;   // fixed-colour accents (e.g. blue shelf LEDs): brightness only
  }
  if (mood === 'movie') for (const mv of movers.values()) if (mv.info.type === 'roll' && mv.group && mv.group.room === room) toggleMover(mv, 1);
}
/* ---------- projector simulation (owner request 2026-11-10) ----------
   Room panel button: screen rolls down + projector lowers from the ceiling on its lift → lamp on: light beam, picture
   fades in on the screen (slideshow of the home's tour stills), the screen lights the room, LED strips go to movie
   mood. Off: picture fades, projector and screen go back up. */
const PROJ_IMAGES = ['tour/still_2m02_master_bedroom.jpg', 'tour/still_0m06_formal_hall.jpg', 'tour/still_0m19_seated_sofa.jpg', 'tour/still_0m47_family_balcony.jpg', 'tour/still_2m36_gaming_mood.jpg'];
const projTex = []; let projTexLoading = false;
const projState = {};   // room → { on, fade, t0, idx, swapT, beam }
function projectorParts(room) {
  const ex = layoutExtras[room]; if (!ex) return null;
  const sc = ex.moods.find(m => m.projectorScreen), pj = ex.moods.find(m => m.projectorLift);
  if (!sc || !pj) return null;
  const gS = ex.groups.find(g => /\/projector-screen$/.test(g.id)), gP = ex.groups.find(g => /\/projector$/.test(g.id));
  if (!gS || !gP) return null;
  const roll = [...movers.values()].find(mv => mv.group === gS && mv.info.type === 'roll'), lift = [...movers.values()].find(mv => mv.group === gP && mv.info.type === 'slide');
  return { sc: sc.projectorScreen, pj: pj.projectorLift, gS, gP, roll, lift };
}
function loadProjTex() {
  if (projTexLoading) return; projTexLoading = true;
  const tl = new THREE.TextureLoader();
  PROJ_IMAGES.forEach((u, i) => tl.load(u, t => { t.colorSpace = THREE.SRGBColorSpace; projTex[i] = t; invalidate(); }));
}
function setProjector(room, on) {
  const p = projectorParts(room); if (!p) return;
  loadProjTex();
  const st = projState[room] || (projState[room] = { on: false, fade: 0, idx: 0, swapT: 0, beam: null });
  st.on = on;
  if (on) { if (p.roll) toggleMover(p.roll, 1); if (p.lift) toggleMover(p.lift, 1); st.t0 = performance.now(); setMood(room, 'movie');
    const cpf = curtainPref(room); if (cpf && cpf.blackout) for (const mv of movers.values()) if (mv.info.type === 'gather' && mv.group && mv.group.room === room && /:cd\d+$/.test(mv.id)) mv.target = 0;
    // ↑ the blackout layer closes for the movie
    setMsg('Projector: lowering the screen and the projector…'); }
  else { st.t0 = performance.now(); setMsg('Projector off'); }
  renderLayoutUI();
}
function projectorBeam(st) {
  if (st.beam) return st.beam;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(15), 3));
  const a = 0.22, b = 0.03; geo.setAttribute('color', new THREE.Float32BufferAttribute([0.85, 0.9, 1, a, 0.85, 0.9, 1, b, 0.85, 0.9, 1, b, 0.85, 0.9, 1, b, 0.85, 0.9, 1, b], 4));
  geo.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1]);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, opacity: 0 }));
  m.frustumCulled = false; m.renderOrder = 12; scene.add(m); st.beam = m; return m;
}
// owner 2026-11-10: while the projector plays, the room's ambient light dims like a cinema (sun / daylight / IBL /
// ceiling lights); the movie-mood LEDs stay as a soft glow. cine = 0…1 follows the picture fade.
function applyCine() {
  const day = lightMode === 'day', k = 1 - 0.85 * cine;
  sun.intensity = 3.2 * k; scene.environmentIntensity = (day ? 0.55 : 0.08) * (1 - 0.75 * cine);
  windowLights.forEach(L => { L.intensity = day ? 5 * k : 0; });
  lightT = 0; invalidate();
}
function updateProjectors(now, dt) {
  for (const room in projState) {
    const st = projState[room], p = projectorParts(room);
    if (!p) { if (st.beam) { st.beam.removeFromParent(); st.beam = null; } delete projState[room]; continue; }
    const ready = st.on && (!p.roll || p.roll.t > 0.98) && (!p.lift || p.lift.t > 0.98) && now - st.t0 > 400;
    const target = ready ? 1 : 0, prev = st.fade;
    st.fade = THREE.MathUtils.clamp(st.fade + Math.sign(target - st.fade) * dt / 0.9, 0, 1);
    if (st.fade !== prev) RQ.lastMotion = now;
    if (prev === 0 && st.fade > 0) setMsg('Projector on — showing the home tour stills (button again to switch off)');
    if (!st.on && st.fade === 0 && prev > 0) { if (p.roll) toggleMover(p.roll, 0); if (p.lift) toggleMover(p.lift, 0); setMood(room, 'normal'); }
    // slideshow
    if (st.fade > 0 && projTex.length) {
      if (!p.sc.imgMat.map || now - st.swapT > 6000) {
        let tries = 0; do { st.idx = (st.idx + 1) % PROJ_IMAGES.length; } while (!projTex[st.idx] && ++tries < PROJ_IMAGES.length);
        if (projTex[st.idx]) { p.sc.imgMat.map = projTex[st.idx]; p.sc.imgMat.needsUpdate = true; st.swapT = now; invalidate(); }
      }
    }
    const k = st.fade * (p.sc.imgMat.map ? 1 : 0.3);
    p.sc.imgMat.opacity = k;
    const opaque = k > 0.999; if (p.sc.imgMat.transparent === opaque) { p.sc.imgMat.transparent = !opaque; p.sc.imgMat.depthWrite = opaque; p.sc.imgMat.needsUpdate = true; }   // fully on → solid picture (no see-through at grazing angles)
    p.sc.light.intensity = 9 * k;
    // beam from the lens to the picture corners
    const beam = projectorBeam(st); beam.visible = st.fade > 0.01; beam.material.opacity = st.fade;
    if (beam.visible) {
      const lens = new THREE.Vector3(...p.pj.lens).applyMatrix4(p.lift ? p.lift.pivot.matrixWorld : p.gP.pivot.matrixWorld);
      const L = p.sc.light, c = L.getWorldPosition(new THREE.Vector3()), q = L.getWorldQuaternion(new THREE.Quaternion());
      const rx = new THREE.Vector3(1, 0, 0).applyQuaternion(q).multiplyScalar(p.sc.width / 2), ry = new THREE.Vector3(0, 1, 0).applyQuaternion(q).multiplyScalar(p.sc.imageH / 2);
      const pts = [lens, c.clone().add(rx).add(ry), c.clone().sub(rx).add(ry), c.clone().sub(rx).sub(ry), c.clone().add(rx).sub(ry)];
      const pa = beam.geometry.attributes.position; pts.forEach((v, i) => pa.setXYZ(i, v.x, v.y, v.z)); pa.needsUpdate = true;
    }
  }
  const c2 = Math.max(0, ...Object.values(projState).map(s2 => s2.fade || 0));
  if (Math.abs(c2 - cine) > 0.001) { cine = c2; applyCine(); }
}
// floating switch: shown while the room you are in / looking at has a projector; P toggles it too
function projRoom() { const r = mode === 'walk' ? roomAt(walk.x, walk.z) : (mode === 'room' ? curRoom : layoutRoom); return r && projectorParts(r) ? r : null; }
function toggleProjector() { const r = projRoom(); if (r) setProjector(r, !(projState[r] || {}).on); }
let projUiKey = '';
function updateProjSwitch() {
  const r = projRoom(), on = !!(r && (projState[r] || {}).on), k = (r || '') + on;
  if (k === projUiKey) return; projUiKey = k;
  const el = $('projSwitch'); el.style.display = r ? 'flex' : 'none'; el.classList.toggle('on', on);
  el.firstElementChild.textContent = on ? 'Projector on' : 'Projector off';
}
$('projSwitch').onclick = e => { e.stopPropagation(); toggleProjector(); };
/* gaming media wall: in Gaming mood the TV shows a (procedural) game feed and every sync LED takes its colour from the
   picture — edge LEDs from their side of the screen, the rest from the average — like Hue Sync / Ambilight */
const game = { cv: null, ctx: null, tex: null, t: 0, last: 0 };
function gameFrame(t) {
  if (!game.cv) { game.cv = document.createElement('canvas'); game.cv.width = 256; game.cv.height = 144; game.ctx = game.cv.getContext('2d', { willReadFrequently: true });
    game.tex = new THREE.CanvasTexture(game.cv); game.tex.colorSpace = THREE.SRGBColorSpace; }
  const x = game.ctx, W = 256, H = 144, scenes = [['#2b0b4f', '#ff5e9e', '#ffb347'], ['#03213a', '#19c6ff', '#9dfcff'], ['#2a0700', '#ff3d00', '#ffd000'], ['#04210e', '#2bff88', '#d8ff5e']];
  const k = (t / 6) % scenes.length, i = Math.floor(k), f = Math.min(1, (k - i) * 3), A = scenes[i], B = scenes[(i + 1) % scenes.length];
  const mix = (a, b) => { const ca = new THREE.Color(a), cb = new THREE.Color(b); return '#' + ca.lerp(cb, f > 0.66 ? (f - 0.66) * 3 : 0).getHexString(); };
  const sky = x.createLinearGradient(0, 0, 0, H * 0.6); sky.addColorStop(0, mix(A[0], B[0])); sky.addColorStop(1, mix(A[1], B[1])); x.fillStyle = sky; x.fillRect(0, 0, W, H * 0.6);
  x.fillStyle = mix(A[2], B[2]); x.beginPath(); x.arc(W / 2 + Math.sin(t * 0.3) * 30, H * 0.5, 34, Math.PI, 0); x.fill();                       // sun
  x.fillStyle = '#05030a'; x.fillRect(0, H * 0.6, W, H * 0.4);
  x.strokeStyle = mix(A[1], B[1]); x.lineWidth = 1.2;                                                                                          // scrolling grid
  for (let r = 0; r < 10; r++) { const y = H * 0.6 + Math.pow(((r + (t * 2) % 1) / 10), 2) * H * 0.4; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
  for (let c = -8; c <= 8; c++) { x.beginPath(); x.moveTo(W / 2 + c * 6, H * 0.6); x.lineTo(W / 2 + c * 40, H); x.stroke(); }
  const carX = W / 2 + Math.sin(t * 1.3) * 50; x.fillStyle = '#0a0a12'; x.fillRect(carX - 14, H - 26, 28, 12); x.fillStyle = mix(A[1], B[1]); x.fillRect(carX - 12, H - 16, 6, 3); x.fillRect(carX + 6, H - 16, 6, 3);
  x.fillStyle = '#ffffffcc'; x.font = 'bold 9px sans-serif'; x.fillText('LAP 2/3   ' + (102 + Math.round(Math.sin(t) * 40)) + ' km/h', 6, 12);
  game.tex.needsUpdate = true;
}
function sampleSide(x0, y0, x1, y1) {
  const d = game.ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data; let r = 0, g2 = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 16) { r += d[i]; g2 += d[i + 1]; b += d[i + 2]; n++; }
  return new THREE.Color().setRGB(r / n / 255, g2 / n / 255, b / n / 255, THREE.SRGBColorSpace);
}
function updateTvSync(room, t) {
  const ex = layoutExtras[room]; if (!ex) return;
  for (const md of ex.moods) {
    const s = md.tvSync; if (!s) continue;
    if (roomMood[room] !== 'gaming') { const want = s.art || null; if (s.screenMat.map !== want) { s.screenMat.map = want; s.screenMat.color.set(want ? 0xffffff : 0x050505); s.screenMat.needsUpdate = true; } continue; }   // art mode when not gaming (if the design has one)
    const now = performance.now(); if (now - game.last > 60) { game.last = now; gameFrame(t); }
    if (s.screenMat.map !== game.tex) { s.screenMat.map = game.tex; s.screenMat.color.set(0xffffff); s.screenMat.needsUpdate = true; }
    const L = sampleSide(0, 0, 40, 144), R = sampleSide(216, 0, 256, 144), T = sampleSide(0, 0, 256, 40), Bo = sampleSide(0, 104, 256, 144), avg = sampleSide(0, 0, 256, 144);
    // saturated, not too bright: AgX tone mapping washes very bright emissives towards white
    const boost = c => { const h = {}; c.getHSL(h); return new THREE.Color().setHSL(h.h, 1, 0.5); };
    for (const m of [...s.all, ...Object.values(s.sync)]) m.emissiveIntensity = 1.6;
    for (const m of s.all) m.emissive.copy(boost(avg));
    s.sync.left.emissive.copy(boost(L)); s.sync.right.emissive.copy(boost(R)); s.sync.top.emissive.copy(boost(T)); s.sync.bottom.emissive.copy(boost(Bo));
  }
}
/* ---------- design switcher bar (owner 2026-11-10: switch everything quickly) ----------
   Shows the room you are in / looking at: tabs = Layout (complete room options) + every switchable element of the
   current option (bed wall, TV wall, …). ← / → step the selected tab's designs instantly; Shift+← / → (or click a tab)
   picks the tab. Each element remembers its own choice. */
const dsw = { room: null, tab: {}, key: '', pin: null, look: null, lookT: 0 };
const hasDesigns = r => !!(r && layoutMods[r] && (layoutMods[r].length > 1 || slotsOf((layoutMods[r] || []).find(m => m.id === (store.sel[r] || 'original'))).length));
function dswRoom() { return dsw.active && hasDesigns(dsw.active.room) ? dsw.active.room : null; }
const layoutLabel = room => ((layoutMods[room] || []).find(m => m.layoutLabel) || {}).layoutLabel || 'Layout';
// owner 2026-11-10: one click opens the actual reference image a design was built from (variant or module field "ref": a path or a list)
function refLinks(item) {
  const r = item && item.ref; if (!r) return '';
  return (Array.isArray(r) ? r : [r]).map((u, k, a) => `<a class="dref" href="${encodeURI(u)}" target="_blank" rel="noopener" title="Open the owner's reference image">🖼 Reference${a.length > 1 ? ' ' + (k + 1) : ''}</a>`).join('');
}
function dswTabs(room) {
  const cur = store.sel[room] || 'original', mod = (layoutMods[room] || []).find(m => m.id === cur);
  const tabs = [];
  if ((layoutMods[room] || []).length > 1 && !(layoutMods[room] || []).some(m => m.layoutIcon === false)) tabs.push({ id: '__layout', label: layoutLabel(room), items: layoutMods[room].map(m => ({ id: m.id, name: m.name.replace(/^Option (\d+) · /, 'Opt $1 · '), ref: m.ref })), cur });
  for (const sl of slotsOf(mod)) tabs.push({ id: sl.id, label: sl.label, items: sl.variants, cur: slotValue(room, cur, sl.id) });
  return tabs;
}
function dswStep(d, tabStep = 0) {
  const room = dswRoom(); if (!room) return false;
  const tabs = dswTabs(room); if (!tabs.length) return false;
  let ti = Math.max(0, tabs.findIndex(t => t.id === dsw.tab[room]));
  if (!tabs.some(t => t.id === dsw.tab[room])) ti = tabs.length > 1 ? 1 : 0;     // default: the first element, else Layout
  if (tabStep) { ti = (ti + tabStep + tabs.length) % tabs.length; dsw.tab[room] = tabs[ti].id; dsw.key = ''; return true; }
  const t = tabs[ti], i = t.items.findIndex(x => x.id === t.cur), n = t.items[(i + d + t.items.length) % t.items.length];
  dsw.tab[room] = t.id;
  if (t.id === '__layout') { store.chosen = store.chosen || {}; store.chosen[room] = true; setRoomLayout(room, n.id); }
  else setVariant(room, n.id, t.id);
  setMsg(`${room} · ${t.label}: ${n.name}`); dsw.key = ''; return true;
}
// ⇄ icons on every switchable wall / room; click one to enter switch mode for it, Esc or Done to leave
const hotGroup = new THREE.Group(); hotGroup.renderOrder = 30; scene.add(hotGroup);
let hotKey = '', hotTex = null;
function hotIcon(active) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
  x.fillStyle = active ? '#e0a24a' : 'rgba(22,24,29,0.88)'; x.beginPath(); x.arc(64, 64, 58, 0, 7); x.fill();
  x.lineWidth = 6; x.strokeStyle = '#e0a24a'; x.stroke();
  x.fillStyle = active ? '#111' : '#f3e7d3'; x.font = 'bold 64px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('⇄', 64, 68);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function hotAnchors() {
  const out = [];
  for (const room of roomNames) {
    if (!hasDesigns(room)) continue;
    const mods = layoutMods[room] || [], cur = store.sel[room] || 'original', mod = mods.find(m => m.id === cur);
    // a module with layoutIcon: false shows only its slot icons (owner 2026-11-11, puja: "I only need 2 — door and interior")
    if (mods.length > 1 && !mods.some(m => m.layoutIcon === false)) { const a = (mods.find(m => m.roomAnchor) || {}).roomAnchor, b = rooms[room];
      out.push({ room, tab: '__layout', pos: a || [(b.x0 + b.x1) / 2, 2.35, (b.z0 + b.z1) / 2] }); }
    for (const sl of slotsOf(mod)) if (sl.anchor) out.push({ room, tab: sl.id, pos: sl.anchor });
  }
  return out;
}
function updateHotspots() {
  const act = dsw.active ? dsw.active.room + '|' + dsw.tab[dsw.active.room] : '';
  const anchors = hotAnchors(), key = anchors.map(a => a.room + a.tab + a.pos.join(',')).join(';') + '|' + act + '|' + mode + '|' + curRoom;
  if (key === hotKey) return; hotKey = key;
  hotGroup.clear();
  for (const a of anchors) {
    if (mode === 'room' && a.room !== curRoom) continue;
    const on = !!dsw.active && dsw.active.room === a.room && dsw.tab[a.room] === a.tab;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: hotIcon(on), depthTest: true, depthWrite: false, transparent: true, toneMapped: false }));
    sp.position.fromArray(a.pos); sp.scale.set(0.24, 0.24, 1); sp.renderOrder = 30; sp.userData.hot = a; hotGroup.add(sp);
  }
  invalidate();
}
function hotAt(ndcX, ndcY) {
  if (!hotGroup.children.length) return null;
  ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera); ray.far = 30;
  const h = ray.intersectObjects(hotGroup.children, false)[0]; ray.far = Infinity; return h ? h.object.userData.hot : null;
}
function enterSwitchMode(a) {
  dsw.active = { room: a.room }; dsw.tab[a.room] = a.tab; dsw.key = ''; hotKey = '';
  if (a.room !== layoutRoom) { layoutRoom = a.room; renderLayoutUI(); }
  setMsg(`Switch mode: ${a.room === 'Dress' ? 'passage wall' : a.room} — ← → to change the design, tabs for other parts, Esc or Done to finish`);
}
function exitSwitchMode() { if (!dsw.active) return; dsw.active = null; dsw.key = ''; hotKey = ''; setMsg('Switch mode off'); }
function updateDesignBar() {
  updateHotspots();
  const el = $('designBar'), room = dswRoom(), tabs = room ? dswTabs(room) : [];
  if (!tabs.length) { if (el.style.display !== 'none') el.style.display = 'none'; dsw.key = ''; return; }
  if (!tabs.some(t => t.id === dsw.tab[room])) dsw.tab[room] = tabs[tabs.length > 1 ? 1 : 0].id;
  const t = tabs.find(x => x.id === dsw.tab[room]), i = t.items.findIndex(x => x.id === t.cur);
  const key = room + '|' + tabs.map(x => x.id + ':' + x.cur).join(',') + '|' + t.id;
  if (key === dsw.key) return; dsw.key = key;
  const esc = s2 => String(s2).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  el.innerHTML = `<div class="dtabs"><span class="droomlbl">⇄ ${esc(room === 'Dress' ? 'Passage wall' : room)}</span>${tabs.map(x => `<button class="dtab ${x.id === t.id ? 'on' : ''}" data-tab="${x.id}">${esc(x.label)}</button>`).join('')}<button class="ddone" title="Exit switch mode (Esc)">✕ Done</button></div>
    <div class="dsel"><button class="darr" data-d="-1" title="Previous (←)">◀</button><div class="dname"><b>${esc(t.items[i] ? t.items[i].name : '')}</b><small>${i + 1} of ${t.items.length} · ← → to switch · Esc to finish</small>${refLinks(t.items[i])}</div><button class="darr" data-d="1" title="Next (→)">▶</button></div>`;
  el.style.display = 'block';
  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = e => { e.stopPropagation(); dsw.tab[room] = b.dataset.tab; dsw.key = ''; });
  el.querySelector('.ddone').onclick = e => { e.stopPropagation(); exitSwitchMode(); };
  el.querySelectorAll('.dref').forEach(a => a.addEventListener('click', e => e.stopPropagation()));
  el.querySelectorAll('[data-d]').forEach(b => b.onclick = e => { e.stopPropagation(); dswStep(+b.dataset.d); });
}
function animateMoods(t) {
  for (const room in roomMood) {
    if (roomMood[room] !== 'gaming' || !layoutExtras[room]) continue;
    const c = new THREE.Color().setHSL((t * 0.04) % 1, 0.85, 0.55);
    for (const md of layoutExtras[room].moods) { (md.strips || []).forEach(mat => mat.emissive.copy(c)); (md.glow || []).forEach(l => l.color.copy(c)); (md.halos || []).forEach(h => h.color.copy(c)); }
    updateTvSync(room, t);
  }
  for (const room in layoutExtras) if (roomMood[room] !== 'gaming') updateTvSync(room, t);
}

/* ---------- layout panel ---------- */
function liveMetrics(room) {
  const res = (layoutExtras[room] || {}).result || {}, out = [];
  const bed = res.bed && groups.get(slugify(room) + '/' + res.bed);
  if (bed && bed.pivot.visible) {
    const c = clearancesOf(bed, res.ignore ? new RegExp(res.ignore) : null);
    if (c) out.push(['Bed free space (measured)', Object.entries(c).map(([k, v]) => `${k} ${v.toFixed(2)} m`).join(' · ')]);
  }
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]).toFixed(2) + ' m';
  if (res.view) out.push(['Pillow → TV (measured)', d(res.view.from, res.view.to)]);
  if (res.screen) out.push(['Pillow → screen (measured)', d(res.screen.from, res.screen.to)]);
  return out;
}
function slotsOf(mod) {
  if (!mod) return [];
  const out = [...(mod.slots || [])];
  if (mod.variants) out.unshift({ id: 'style', label: mod.variantLabel || 'Style', variants: mod.variants, default: mod.defaultVariant, anchor: mod.variantAnchor });
  return out;
}
const slotKey = (room, opt, sid) => room + '|' + opt + (sid === 'style' ? '' : '|' + sid);
function slotValue(room, opt, sid) {
  const mod = (layoutMods[room] || []).find(m => m.id === opt), sl = slotsOf(mod).find(x => x.id === sid);
  if (!sl) return null;
  const v = (store.variant || {})[slotKey(room, opt, sid)];
  return sl.variants.some(x => x.id === v) ? v : (sl.default || sl.variants[0].id);
}
function setVariant(room, v, sid = 'style') {
  const cur = store.sel[room]; if (!cur) return;
  store.variant = store.variant || {}; store.variant[slotKey(room, cur, sid)] = v; store.chosen = store.chosen || {}; store.chosen[room] = true;
  setRoomLayout(room, cur);
}
function renderLayoutUI() {
  const box = $('layoutBox'); if (!box || !roomNames.length) return;
  const room = layoutRoom, mods = layoutMods[room] || [ORIGINAL], cur = store.sel[room] || 'original';
  const mod = mods.find(m => m.id === cur) || ORIGINAL, ex = layoutExtras[room] || { moods: [] };
  const esc = t => String(t).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
  const facts = [...(mod.facts || []), ...liveMetrics(room)];
  box.innerHTML = `
    <select id="lRoom">${roomNames.map(r => `<option ${r === room ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
    <div class="opts">${mods.map(m => `<button data-opt="${m.id}" class="${m.id === cur ? 'on' : ''}">${esc(m.name)}</button>`).join('')}</div>
    ${slotsOf(mod).map(sl => { const vcur = slotValue(room, cur, sl.id), vm = sl.variants.find(v => v.id === vcur) || sl.variants[0];
      return `<label class="sum"><b>${esc(sl.label)}</b> <select data-slot="${sl.id}">${sl.variants.map((v, i) => `<option value="${v.id}" ${v.id === vm.id ? 'selected' : ''}>${i + 1}. ${esc(v.name)}</option>`).join('')}</select></label><p class="sum">${esc(vm.summary || '')} ${refLinks(vm)}</p>`; }).join('')}
    <p class="sum">${esc(mod.summary || '')} ${refLinks(mod)}</p>
    <p class="sum"><a class="dref" href="references/index.html" target="_blank" rel="noopener">🖼 All reference images</a></p>
    ${(() => {   // reference searches (owner 2026-11-10): chips open a Pinterest search in a new tab
      const own = slotsOf(mod).flatMap(sl => { const vm = sl.variants.find(v => v.id === slotValue(room, cur, sl.id)); return (vm && vm.search) || []; }), gen = mod.search || [];
      if (!own.length && !gen.length) return '';
      const chip = q => `<span class="chipw"><a class="chip" target="_blank" rel="noopener" title="Search Pinterest" href="https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}">${esc(q)}</a><button class="cpy" data-copy="${esc(q)}" title="Copy">⧉</button></span>`;
      const group = (label, list) => `<div class="refhead"><small>${label}</small><button class="cpyall" data-copy="${esc(list.join('\n'))}">Copy all</button></div><div class="chips">${list.map(chip).join('')}</div>`;
      return `<details class="refs" open><summary>Find references on Pinterest</summary>${own.length ? group('This style', own) : ''}${gen.length ? group(own.length ? 'General' : 'Searches', gen) : ''}<small>Click a term to search, ⧉ to copy it. Send the pins you like back here and I'll build that look.</small></details>`;
    })()}
    ${facts.length ? `<table class="facts">${facts.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>` : ''}
    ${projectorParts(room) ? `<div class="row"><button data-proj class="${(projState[room] || {}).on ? 'on' : ''}">${(projState[room] || {}).on ? '■ Projector off' : '▶ Projector on'}</button></div>` : ''}
    ${ex.moods.length ? `<div class="row moods">${['normal', 'gaming', 'movie', 'off'].map(m => `<button data-mood="${m}" class="${(roomMood[room] || 'normal') === m ? 'on' : ''}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div>` : ''}
    <div class="row"><button id="lView">View this room</button><button id="lReset">Reset my edits</button></div>`;
  $('lRoom').onchange = e => { layoutRoom = e.target.value; renderLayoutUI(); };
  box.querySelectorAll('select[data-slot]').forEach(sel => sel.onchange = e => setVariant(room, e.target.value, sel.dataset.slot));
  box.querySelectorAll('[data-opt]').forEach(b => b.onclick = () => { store.chosen = store.chosen || {}; store.chosen[room] = true; setRoomLayout(room, b.dataset.opt); });
  box.querySelectorAll('[data-mood]').forEach(b => b.onclick = () => { setMood(room, b.dataset.mood); renderLayoutUI(); });
  box.querySelectorAll('[data-proj]').forEach(b => b.onclick = () => setProjector(room, !(projState[room] || {}).on));
  box.querySelectorAll('[data-copy]').forEach(b => b.onclick = async e => {
    e.preventDefault(); const t = b.dataset.copy, n = t.split('\n').length;
    try { await navigator.clipboard.writeText(t); }
    catch (err) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e2) { /* ignore */ } ta.remove(); }
    const old = b.textContent; b.textContent = n > 1 ? 'Copied ✓' : '✓'; setTimeout(() => { b.textContent = old; }, 1200);
    setMsg(n > 1 ? `Copied ${n} search terms` : `Copied "${t}" — paste it into Pinterest`);
  });
  $('lView').onclick = () => enterRoom(room);
  $('lReset').onclick = () => resetRoom(room);
}

/* ---------- clone / delete ---------- */
function cloneGroup(src, id) {
  const pivot = src.pivot.clone(true);
  const sm = [], cm = [];
  src.pivot.traverse(o => o.isMesh && sm.push(o)); pivot.traverse(o => o.isMesh && cm.push(o));
  id = id || 'c' + (++cloneCount);
  if (id.startsWith('c')) cloneCount = Math.max(cloneCount, parseInt(id.slice(1)) || 0);
  cm.forEach((m, i) => { origMat.set(m, origMat.get(sm[i]) || sm[i].material); m.userData.gid = id; m.userData.grp = id; items.push(m); });
  scene.add(pivot);
  const g = { id, pivot, meshes: cm, dom: src.dom, colMat: null, col: null, name: src.name, clone: true, src: src.clone ? src.src : src.id, init: src.init, room: src.room, fp: src.fp, seat: src.seat, loose: src.loose };
  groups.set(id, g); setColor(g, null); shadowsDirty();
  return g;
}
function removeClone(g) {
  if (selected === g) select(null);
  scene.remove(g.pivot); g.meshes.forEach(m => { const i = items.indexOf(m); if (i >= 0) items.splice(i, 1); });
  groups.delete(g.id); shadowsDirty();
}

/* ---------- geometry helpers ---------- */
function roomAt(x, z) {
  let best = null, ba = 1e9;
  for (const n of roomNames) { const r = rooms[n]; if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) { const a = (r.x1 - r.x0) * (r.z1 - r.z0); if (a < ba) { ba = a; best = n; } } }
  return best;
}
function blocked(x, z) {
  const i = Math.floor((x - gridMeta.x0) / gridMeta.cell), j = Math.floor((-z - gridMeta.y0) / gridMeta.cell);
  if (i < 0 || j < 0 || i >= gridMeta.nx || j >= gridMeta.ny) return true;
  return grid[j * gridMeta.nx + i] === 1;
}
function hits(x, z) {
  if (hitsFurniture(x, z, RADIUS) || hitsBlockers(x, z, RADIUS)) return true;
  if (blocked(x, z)) return true;
  for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; if (blocked(x + Math.cos(t) * RADIUS, z + Math.sin(t) * RADIUS)) return true; }
  return false;
}
function nearestFree(x, z) {
  if (!hits(x, z)) return [x, z];
  for (let r = 0.1; r < 3; r += 0.1) for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2, px = x + Math.cos(t) * r, pz = z + Math.sin(t) * r; if (!hits(px, pz)) return [px, pz]; }
  return [x, z];
}

/* ---------- visibility / clipping ---------- */
const archBox = new WeakMap();
function cutawayWalls() {
  if (mode !== 'room') return;
  const r = rooms[curRoom], cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, cp = camera.position;
  for (const m of items) {
    const u = m.userData; if (u.cat !== 'arch' || !u.rooms.includes(curRoom)) continue;
    let b = archBox.get(m); if (!b) { b = new THREE.Box3().setFromObject(m); archBox.set(m, b); }
    const sx = b.max.x - b.min.x, sz = b.max.z - b.min.z, c = b.getCenter(new THREE.Vector3());
    let hide = false;
    if (cutaway && sz < 0.6 && sx > sz) hide = Math.abs(c.z - cz) > 0.5 * (r.z1 - r.z0) - 0.4 && (c.z - cz) * (cp.z - cz) > 0 && Math.abs(cp.z - cz) > Math.abs(c.z - cz) - 0.1;
    else if (cutaway && sx < 0.6 && sz > sx) hide = Math.abs(c.x - cx) > 0.5 * (r.x1 - r.x0) - 0.4 && (c.x - cx) * (cp.x - cx) > 0 && Math.abs(cp.x - cx) > Math.abs(c.x - cx) - 0.1;
    m.visible = !hide && !u.userHidden && !u.suppressed;
  }
}
/* ---------- mirror probes (owner 2026-11-11, master-toilet mirror): a built mesh whose material is '__mirror_reflective'
   (metalness 1, roughness 0.02) gets a STATIC CubeCamera reflection of the real room, rendered once (6 × 256² faces) when it
   is first visible and again only after a light / mode / layout change — no per-frame cost. Without it the mirror would only
   reflect the generic RoomEnvironment IBL. */
const mirrorProbes = [];
function addMirrorProbe(m) {
  const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  const cam = new THREE.CubeCamera(0.05, 30, rt); scene.add(cam);
  mirrorProbes.push({ m, rt, cam, dirty: true });
}
function mirrorsDirty() { mirrorProbes.forEach(p => { p.dirty = true; }); }
function updateMirrorProbes() {
  for (let i = mirrorProbes.length - 1; i >= 0; i--) {
    const p = mirrorProbes[i];
    let rootObj = p.m; while (rootObj.parent) rootObj = rootObj.parent;
    if (rootObj !== scene) { p.cam.removeFromParent(); p.rt.dispose(); mirrorProbes.splice(i, 1); continue; }   // option switched away
    if (!p.dirty) continue;
    let vis = true; for (let o = p.m; o; o = o.parent) if (!o.visible) { vis = false; break; }
    if (!vis) continue;
    // probe 3 cm in front of the glass (the glass is the thin axis of its box; "front" = towards the room's centre)
    const b = new THREE.Box3().setFromObject(p.m), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    const ax = s.x < s.z ? 'x' : 'z', r = roomAt(c.x, c.z), rb = r && rooms[r];
    let sgn = 1; if (rb) { const mid = ax === 'x' ? (rb.x0 + rb.x1) / 2 : (rb.z0 + rb.z1) / 2; sgn = Math.sign(mid - c[ax]) || 1; }
    c[ax] += 0.03 * sgn; p.cam.position.copy(c); p.cam.updateMatrixWorld(true);
    const hid = mirrorProbes.filter(q => q.m.visible).map(q => q.m);
    // three r170: a transmissive material in view makes the renderer run its transmission pass, which restores the render
    // target WITHOUT the active cube face → that face lands on face 0 and stays empty (the mirror reflected black). Hide them.
    scene.traverse(o => { if (o.isMesh && o.visible && [].concat(o.material).some(mt => mt && mt.transmission > 0)) hid.push(o); });
    hid.forEach(o => { o.visible = false; });
    const tm = renderer.toneMapping; renderer.toneMapping = THREE.NoToneMapping;
    { const c0 = performance.now(); p.cam.update(renderer, scene); p.renders = (p.renders || 0) + 1; p.ms = +(performance.now() - c0).toFixed(1); }
    renderer.toneMapping = tm; hid.forEach(o => { o.visible = true; });
    p.m.material.envMap = p.rt.texture; p.m.material.envMapIntensity = 1; p.m.material.needsUpdate = true;
    p.dirty = false; RQ.dirty = true;
  }
}
function applyVisibility() {
  mirrorsDirty();
  const inRoom = mode === 'room';
  for (const m of items) {
    const u = m.userData; let v = true;
    if (u.cat === 'exterior') v = showExt && !inRoom;
    else {
      if (inRoom) v = u.rooms.includes(curRoom);
      if (u.cat === 'ceiling' || u.cat === 'ceilfix') v = v && showCeil;
    }
    if (!showLoose && v) { const g = u.gid && groups.get(u.gid); if (u.loose || (g && g.loose)) v = false; }
    if (inRoom && (u.userHidden || (u.gid && groups.get(u.gid) && groups.get(u.gid).userHidden))) v = false;   // walls / elements the owner hid in room view
    m.visible = v && !u.suppressed;
  }
  if (inRoom) {
    const r = rooms[curRoom], k = 0.25;
    renderer.clippingPlanes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), -(r.x0 - k)), new THREE.Plane(new THREE.Vector3(-1, 0, 0), r.x1 + k),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), -(r.z0 - k)), new THREE.Plane(new THREE.Vector3(0, 0, -1), r.z1 + k)];
  } else renderer.clippingPlanes = [];
  const sky = mode === 'walk' || showExt;
  scene.background.set(lightMode === 'day' ? (sky ? 0xb9cde0 : 0x14161a) : (sky ? 0x18202c : 0x101216));
  for (const [id, b] of [['tCut', cutaway], ['tCeil', showCeil], ['tExt', showExt], ['tDim', showDim], ['tFurn', showLoose]]) $(id).classList.toggle('on', b);
  updateOutlines(); refreshHoles(); shadowsDirty(); clr.dirty = true;
}

/* ---------- lighting modes ---------- */
function setLightMode(m) {
  lightMode = m;
  const day = m === 'day';
  sun.visible = day;
  scene.environmentIntensity = day ? 0.55 : 0.08;
  mirrorsDirty();
  windowLights.forEach(L => { L.intensity = day ? 5 : 0; L.visible = day; });
  plights.forEach(p => { p.visible = !day; });   // perf: the 12 point lights are dark by day; hiding them drops them from every shader
  $('lDay').classList.toggle('on', day); $('lEve').classList.toggle('on', !day);
  lightT = 0; rl.t = 0; applyCine(); applyVisibility();
}
function setHQ(on) { hq = on; gtao.enabled = on; invalidate(); renderer.shadowMap.enabled = on; sun.castShadow = on; $('tHQ').classList.toggle('on', on); scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); shadowsDirty(); }
$('lDay').onclick = () => setLightMode('day');
$('lEve').onclick = () => setLightMode('evening');
$('tHQ').onclick = () => setHQ(!hq);

let lightT = 0;
function updateLights() {
  const now = performance.now(); if (now - lightT < 150) return; lightT = now;
  let fx, fz, only = null;
  if (mode === 'walk') { fx = walk.x; fz = walk.z; } else if (mode === 'room') { fx = orbit.target.x; fz = orbit.target.z; only = curRoom; } else { fx = orbit.target.x; fz = orbit.target.z; }
  const c = lightData.filter(l => !only || l.room === only).map(l => [l, (l.x - fx) ** 2 + (l.z - fz) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, NL);
  const eve = lightMode === 'evening';
  plights.forEach((p, i) => {
    const e = c[i]; if (!e) { p.intensity = 0; return; }
    const l = e[0]; p.position.set(l.x, l.y - 0.12, l.z); p.color.setRGB(l.c[0], l.c[1], l.c[2]);
    p.intensity = eve ? Math.min(14, 1.5 + l.e * 0.12) * (1 - 0.85 * cine) : 0;
  });
  const sig = plights.map(p => p.intensity ? p.position.x.toFixed(2) + p.position.z.toFixed(2) + p.intensity.toFixed(2) : '').join();
  if (sig !== updateLights.sig) { updateLights.sig = sig; invalidate(); }
}

/* ---------- dimension overlays ---------- */
const outlineGroup = new THREE.Group(); scene.add(outlineGroup);
function mkLabel(cls) { const d = document.createElement('div'); d.className = 'lbl ' + (cls || ''); d.style.display = 'none'; document.body.appendChild(d); return d; }
let planLabels = {}, roomLabels = [];
const lineMat = new THREE.LineBasicMaterial({ color: 0xe0a24a, depthTest: false, transparent: true });
function buildOutlines() {
  for (const n of roomNames) {
    const r = rooms[n], y = 0.04;
    const g = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]].map(([x, z]) => new THREE.Vector3(x, y, z))), lineMat);
    g.userData.room = n; g.renderOrder = 10; outlineGroup.add(g);
    planLabels[n] = mkLabel('room'); planLabels[n].textContent = `${n}\n${r.mm[0]} × ${r.mm[1]}`;
  }
  roomLabels = [mkLabel(), mkLabel(), mkLabel()];
  const h = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, CEIL_H, 0)]), lineMat);
  h.name = 'hline'; h.renderOrder = 10; outlineGroup.add(h);
}
function updateOutlines() {
  outlineGroup.visible = showDim && mode !== 'walk';
  outlineGroup.children.forEach(c => { if (c.userData.room) c.visible = mode === 'plan' || c.userData.room === curRoom; });
  const h = outlineGroup.getObjectByName('hline'); if (!h) return; h.visible = mode === 'room';
  if (mode === 'room') { const r = rooms[curRoom]; h.position.set(r.x0, 0, r.z1); }
}
const _v = new THREE.Vector3();
function place(el, x, y, z) {
  _v.set(x, y, z).project(camera);
  if (_v.z > 1 || _v.z < -1) { el.style.display = 'none'; return; }
  el.style.display = 'block'; el.style.left = (_v.x * 0.5 + 0.5) * innerWidth + 'px'; el.style.top = (-_v.y * 0.5 + 0.5) * innerHeight + 'px';
}
function updateLabels() {
  const on = showDim && mode !== 'walk';
  for (const n of roomNames) { const el = planLabels[n]; if (!on || mode !== 'plan') { el.style.display = 'none'; continue; } const r = rooms[n]; place(el, (r.x0 + r.x1) / 2, 0.1, (r.z0 + r.z1) / 2); }
  if (!(on && mode === 'room')) roomLabels.forEach(l => l.style.display = 'none');
  else {
    const r = rooms[curRoom], cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    roomLabels[0].textContent = (r.mm[0] / 1000).toFixed(2) + ' m'; roomLabels[1].textContent = (r.mm[1] / 1000).toFixed(2) + ' m';
    roomLabels[2].textContent = 'Ceiling ' + CEIL_H.toFixed(2) + ' m (assumed)';
    place(roomLabels[0], cx, 0.05, r.z1 + 0.18); place(roomLabels[1], r.x0 - 0.18, 0.05, cz); place(roomLabels[2], r.x0, CEIL_H / 2, r.z1);
  }
  clr.labels.forEach((l, i) => { const p = clr.pts[i]; if (!p || !clr.group.visible) l.style.display = 'none'; else place(l, p.x, p.y, p.z); });
}

/* ---------- clearances around the selected furniture (measured to the nearest wall/furniture) ---------- */
const clr = { group: new THREE.Group(), labels: [], pts: [], dirty: true, t: 0, last: null };
scene.add(clr.group);
const clrRay = new THREE.Raycaster();
function clearancesOf(g, ignore) {
  g.pivot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g.pivot), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const obst = items.filter(m => m.userData.gid !== g.id && !(ignore && m.userData.gid && ignore.test(m.userData.gid)) && (m.userData.cat === 'arch' || (m.userData.cat === 'furn' && m.visible && isShown(m))));
  const hs = [0.1, 0.3, 0.6, 0.9].filter(h => h < Math.max(box.max.y, 0.2) + 0.4).map(h => box.min.y + h), out = {};
  for (const [nm, dx, dz] of [['E', 1, 0], ['W', -1, 0], ['S', 0, 1], ['N', 0, -1]]) {
    const span = dx ? s.z : s.x; let best = Infinity;
    for (const t of [-0.4, 0, 0.4]) for (const y of hs) {
      const o = new THREE.Vector3(dx ? (dx > 0 ? box.max.x : box.min.x) + dx * 0.003 : c.x + t * span, y, dz ? (dz > 0 ? box.max.z : box.min.z) + dz * 0.003 : c.z + t * span);
      clrRay.set(o, new THREE.Vector3(dx, 0, dz)); clrRay.far = 6;
      const h = clrRay.intersectObjects(obst, false)[0]; if (h && h.distance < best) best = h.distance;
    }
    if (best < Infinity) out[nm] = best;
  }
  return out;
}
// feet + inches (owner 2026-11-11: distances in ft)
function ftIn(m) { const t = Math.round(m / 0.0254), f = Math.floor(t / 12), i = t % 12; return (f ? f + '′ ' : '') + i + '″'; }
function measureClearances() {
  clr.group.clear(); clr.pts = [];
  if (!selected || (mode === 'walk' && !carry) || (!showDim && !carry)) { clr.group.visible = false; clr.last = null; return; }
  clr.group.visible = true;
  selected.pivot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(selected.pivot), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const own = new Set([selected.id, ...followersOf(selected).map(f => f.id)]);
  const obst = items.filter(m => !own.has(m.userData.gid) && (m.userData.cat === 'arch' || (m.userData.cat === 'furn' && m.visible && m.parent && m.parent.visible)));
  const hs = [0.12, 0.45, 0.85].filter(h => h < Math.max(box.max.y, 0.2) + 0.4).map(h => box.min.y + h);
  const dirs = [['E', 1, 0], ['W', -1, 0], ['S', 0, 1], ['N', 0, -1]], out = {};
  for (const [nm, dx, dz] of dirs) {
    const span = dx ? s.z : s.x; let best = Infinity, bestO = null;
    for (const t of [-0.4, 0, 0.4]) for (const y of hs) {
      const o = new THREE.Vector3(dx ? (dx > 0 ? box.max.x : box.min.x) + dx * 0.003 : c.x + t * span, y, dz ? (dz > 0 ? box.max.z : box.min.z) + dz * 0.003 : c.z + t * span);
      clrRay.set(o, new THREE.Vector3(dx, 0, dz)); clrRay.far = 6;
      const h = clrRay.intersectObjects(obst, false)[0];
      if (h && h.distance < best) { best = h.distance; bestO = o; }
    }
    if (!bestO) continue;
    out[nm] = best;
    const a = new THREE.Vector3(bestO.x, 0.06, bestO.z), b = a.clone().add(new THREE.Vector3(dx * best, 0, dz * best));
    const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat); ln.renderOrder = 11; clr.group.add(ln);
    clr.pts.push(a.clone().lerp(b, 0.5).setY(0.1));
    while (clr.labels.length < clr.pts.length) clr.labels.push(mkLabel('clr'));
    const L = clr.labels[clr.pts.length - 1]; L.textContent = ftIn(best); L.classList.toggle('tight', best < 0.6);
  }
  for (let i = clr.pts.length; i < clr.labels.length; i++) clr.labels[i].style.display = 'none';
  clr.last = out; invalidate();
}

/* ---------- view settings ---------- */
const SET = 'candeur3302_view_v2';
let vs = { exp: 0.9, fov: 50 };
try { Object.assign(vs, JSON.parse(localStorage.getItem(SET) || '{}')); } catch (e) { /* ignore */ }
function applyView() {
  renderer.toneMappingExposure = vs.exp; camera.fov = vs.fov; camera.updateProjectionMatrix();
  $('sExp').value = vs.exp; $('sFov').value = vs.fov; $('vExp').textContent = (+vs.exp).toFixed(2); $('vFov').textContent = Math.round(vs.fov) + '°';
  try { localStorage.setItem(SET, JSON.stringify(vs)); } catch (e) { /* ignore */ }
}
$('sExp').oninput = e => { vs.exp = +e.target.value; applyView(); };
$('sFov').oninput = e => { vs.fov = +e.target.value; applyView(); };
if (params.has('exp')) vs.exp = +params.get('exp');
applyView();

/* ---------- UI ---------- */
function buildRoomUI() {
  const box = $('rooms');
  for (const n of roomNames) {
    const b = document.createElement('button'); b.dataset.room = n;
    const r = rooms[n]; b.innerHTML = `${n}<span>${(r.mm[0] / 1000).toFixed(2)}×${(r.mm[1] / 1000).toFixed(2)}</span>`;
    b.onclick = () => enterRoom(n); box.appendChild(b);
  }
}
function syncUI() {
  for (const [id, m] of [['mWalk', 'walk'], ['mPlan', 'plan'], ['mRoom', 'room']]) $(id).classList.toggle('on', mode === m);
  document.querySelectorAll('#rooms button').forEach(b => b.classList.toggle('on', mode === 'room' && b.dataset.room === curRoom));
  $('cross').style.display = mode === 'walk' ? 'block' : 'none';
}
function setMsg(t) { $('msg').textContent = t; invalidate(); }

/* ---------- modes ---------- */
function enterPlan() {
  leaveWalk(); mode = 'plan'; curRoom = null; select(null);
  showCeil = false; showExt = params.get('sky') === '1';
  orbit.enabled = true; orbit.target.set(6, 0, -0.6); camera.position.set(6, 21, 11);
  applyVisibility(); syncUI(); setMsg('Drag to orbit · scroll to zoom · right-drag to pan · click furniture to see its size and clearances · pick a room to isolate it');
}
function enterRoom(name) {
  leaveWalk(); mode = 'room'; curRoom = name; select(null); layoutRoom = name; renderLayoutUI();
  showCeil = false; const r = rooms[name], cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  const d = Math.max(r.x1 - r.x0, r.z1 - r.z0) * 1.1 + 2.2, el = THREE.MathUtils.degToRad(58);
  orbit.enabled = true; orbit.target.set(cx, 0.8, cz);
  camera.position.set(cx, 0.8 + d * Math.sin(el), cz + d * Math.cos(el));
  applyVisibility(); syncUI();
  setMsg(`${name} · ${r.mm[0]} × ${r.mm[1]} mm · click furniture for clearances, then drag it (distances in ft) · G move, R rotate, Del delete, Shift+D duplicate, Ctrl+Z undo`);
}
function enterWalk() {
  walk.seated = null; mode = 'walk'; curRoom = null; select(null); orbit.enabled = false;
  if (window.__fromRoom) { const [x, z] = nearestFree(window.__fromRoom[0], window.__fromRoom[1]); walk.x = x; walk.z = z; window.__fromRoom = null; }
  [walk.x, walk.z] = nearestFree(walk.x, walk.z);
  showCeil = true; showExt = true; applyVisibility(); syncUI();
  setMsg('Click the view to look around · W A S D move · Shift run · E or click: open doors/wardrobes/drawers, sit on sofas, chairs, beds · V see this room whole · C collisions · Esc releases the mouse');
}
// owner 2026-11-10: "how can I see my walk-in closet completely?" → V in walk mode jumps to the cut-away room view of the room
// you stand in, looking the same way you were facing; V again (or Walk) returns you to exactly where you stood.
let walkReturn = null;
function roomViewHere() {
  const r = roomAt(walk.x, walk.z); if (!r || !rooms[r]) { setMsg('Step inside a room first, then press V to see it whole'); return; }
  walkReturn = { x: walk.x, z: walk.z, yaw: walk.yaw, pitch: walk.pitch, room: r };
  enterRoom(r);
  const R = rooms[r], cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2, d = Math.max(R.x1 - R.x0, R.z1 - R.z0) * 1.1 + 2.2, el = THREE.MathUtils.degToRad(42);
  const fx = -Math.sin(walk.yaw), fz = -Math.cos(walk.yaw);                 // the way you were facing
  camera.position.set(cx - fx * d * Math.cos(el), 0.8 + d * Math.sin(el), cz - fz * d * Math.cos(el)); orbit.target.set(cx, 1.0, cz); orbit.update && orbit.update();
  applyVisibility(); invalidate();
  setMsg(`${r} — whole room, near walls cut away · drag to look around, scroll to zoom · V back to where you were standing`);
}
function backToWalk() {
  if (!walkReturn) { const r = rooms[curRoom]; if (r) window.__fromRoom = [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2]; enterWalk(); return; }
  const w = walkReturn; walkReturn = null; walk.x = w.x; walk.z = w.z; walk.yaw = w.yaw; walk.pitch = w.pitch; enterWalk();
}
function leaveWalk() { if (document.pointerLockElement) document.exitPointerLock(); walk.locked = false; }

$('mPlan').onclick = enterPlan;
$('mRoom').onclick = () => enterRoom(curRoom || 'Master bedroom');
// start outside the flat, in the corridor, walking towards the main door (owner: "add a corridor to walk and feel the entrance")
$('mFront').onclick = () => { walk.x = -4.0; walk.z = 2.0; walk.yaw = -0.585; walk.pitch = -0.02; enterWalk(); setMsg('Corridor outside your main door · click the view to look around · W A S D to walk in · the ⇄ icon on the wall switches the entrance design'); };
$('mWalk').onclick = () => {
  if (mode === 'room' && walkReturn) { backToWalk(); return; }
  walkReturn = null;
  if (mode === 'room') { const r = rooms[curRoom]; window.__fromRoom = [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2]; }
  else if (mode === 'plan') window.__fromRoom = [orbit.target.x, orbit.target.z];
  enterWalk();
};
$('tCut').onclick = () => { cutaway = !cutaway; applyVisibility(); };
$('tHide').onclick = () => setHideMode(!hideMode);
$('tShowWalls').onclick = showAllWalls;
$('tCeil').onclick = () => { showCeil = !showCeil; applyVisibility(); };
$('tFurn').onclick = () => { showLoose = !showLoose; select(null); applyVisibility(); setMsg(showLoose ? 'Showing furniture, appliances and decor' : 'Interior design only: walls, panelling, TV units, wardrobes, kitchen, false ceiling and lights (furniture, appliances and decor hidden)'); };
$('tExt').onclick = () => { showExt = !showExt; applyVisibility(); };
$('tDim').onclick = () => { showDim = !showDim; applyVisibility(); };

/* ---------- walking ---------- */
canvas.addEventListener('click', e => { if (mode !== 'walk') return; if (carry || performance.now() - carryT < 400 || e.ctrlKey || e.metaKey) return; if (!walk.locked) canvas.requestPointerLock(); else if (picking) confirmPick(hl.t); else { const hs = hotAt(0, 0); if (hs) enterSwitchMode(hs); else interact(); } });
document.addEventListener('pointerlockchange', () => { walk.locked = document.pointerLockElement === canvas; if (carry && mode === 'walk' && !walk.locked) endCarry('Esc'); });
document.addEventListener('mousemove', e => {
  if (!walk.locked) return;
  walk.yaw -= e.movementX * 0.0022; walk.pitch = THREE.MathUtils.clamp(walk.pitch - e.movementY * 0.0022, -1.4, 1.4);
});
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') { if (e.code === 'Escape') closeCommentBox(); return; }
  if (carry && e.code === 'Escape') { endCarry('Esc'); return; }
  if (dsw.active && e.code === 'Escape') { exitSwitchMode(); return; }
  if (dsw.active && (e.code === 'ArrowLeft' || e.code === 'ArrowRight') && !picking && e.target.tagName !== 'SELECT') {   // switch mode only
    if (dswStep(e.code === 'ArrowRight' ? 1 : -1, e.shiftKey ? (e.code === 'ArrowRight' ? 1 : -1) : 0)) { e.preventDefault(); keys[e.code] = false; return; }
  }
  keys[e.code] = true;
  // Ctrl/⌘+Z undoes in every mode (owner 2026-11-11); while carrying it cancels the move (item back to where it was picked up)
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.repeat) {
    e.preventDefault(); keys[e.code] = false;
    if (carry) { const c = carry; endCarry('cancel'); if (c.moved) undo(); setMsg('Move cancelled'); } else undo();
    return;
  }
  if (mode === 'walk') {
    if (e.code === 'KeyC') { collide = !collide; setMsg('Collisions ' + (collide ? 'on' : 'off (noclip)')); }
    if (e.code === 'KeyE' && !e.repeat) interact();
    if (e.code === 'KeyP' && !e.repeat) toggleProjector();
    if (e.code === 'KeyM' && !e.repeat) { if (picking) confirmPick(hl.t); else startPick(); }
    if (e.code === 'KeyV' && !e.repeat && !picking) { roomViewHere(); return; }
    if (walk.seated && /^(KeyW|KeyS|KeyA|KeyD|Arrow)/.test(e.code)) standUp();
    return;
  }
  if (picking) { if (e.code === 'Escape') { stopPick(); setMsg('Comment cancelled'); } return; }
  if (e.code === 'KeyG') setTool('translate');
  else if (e.code === 'KeyR') setTool('rotate');
  else if (e.code === 'Delete' || e.code === 'Backspace') delSel();
  else if (e.code === 'KeyD' && e.shiftKey) dupSel();
  else if (e.code === 'Escape') { if (hideMode) setHideMode(false); else select(null); }
  else if (e.code === 'KeyH' && !e.repeat && mode !== 'walk') hideUnder(lastMouse[0], lastMouse[1]);
  else if (e.code === 'KeyM') startPick();
  else if (e.code === 'KeyP') toggleProjector();
  else if (e.code === 'KeyV' && !e.repeat && mode === 'room') backToWalk();
});
addEventListener('keyup', e => { keys[e.code] = false; });
function stepWalk(dt) {
  const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  if ((f || s) && !walk.seated) {
    const sp = (keys.ShiftLeft || keys.ShiftRight ? 3.0 : 1.3) * dt, len = Math.hypot(f, s) || 1;
    const fx = -Math.sin(walk.yaw), fz = -Math.cos(walk.yaw), rx = Math.cos(walk.yaw), rz = -Math.sin(walk.yaw);
    const dx = (fx * f + rx * s) / len * sp, dz = (fz * f + rz * s) / len * sp;
    if (!collide || !hits(walk.x + dx, walk.z)) walk.x += dx;
    if (!collide || !hits(walk.x, walk.z + dz)) walk.z += dz;
  }
  camera.position.set(walk.x, walk.seated ? walk.seated.eye : EYE, walk.z);
  camera.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ');
}

/* ---------- selection & editing ---------- */
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let down = null;
// owner 2026-11-10: in room view, hide the walls (or built elements) you click — 'Hide walls' button or H over a wall; 'Show walls' restores
let hideMode = false, lastMouse = [0, 0];
function hideUnder(cx, cy) {
  mouse.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera);
  const cand = items.filter(m => m.visible && isShown(m) && m.userData.cat !== 'ceiling' && m.userData.cat !== 'floor' && m.userData.cat !== 'ceilfix');
  const h = ray.intersectObjects(cand, false)[0]; if (!h) { setMsg('Nothing to hide there — point at a wall'); return false; }
  const u = h.object.userData, g = u.gid && groups.get(u.gid);
  if (u.cat === 'arch' || !g) { u.userHidden = true; setMsg(`Wall hidden (${hiddenCount()} hidden) · click more walls, or "Show walls" to bring them back`); }
  else { g.userHidden = true; setMsg(`"${g.name}" hidden (${hiddenCount()} hidden) · "Show walls" brings everything back`); }
  if (selected && selected.userHidden) select(null);
  applyVisibility(); invalidate(); return true;
}
function hiddenCount() { let n = 0; for (const m of items) if (m.userData.userHidden) n++; for (const g of groups.values()) if (g.userHidden) n++; return n; }
function showAllWalls() { for (const m of items) delete m.userData.userHidden; for (const g of groups.values()) delete g.userHidden; setHideMode(false); applyVisibility(); invalidate(); setMsg('All walls shown again'); }
function setHideMode(on) { hideMode = on && mode !== 'walk'; const b = $('tHide'); if (b) b.classList.toggle('on', hideMode); canvas.style.cursor = hideMode ? 'crosshair' : ''; if (hideMode) setMsg('Click the walls (or wall units) you want to hide · Esc when done · "Show walls" brings them back'); }
canvas.addEventListener('pointermove', e => { lastMouse = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => {
  if (mode === 'walk' || !down) return;
  const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null;
  if (carry || performance.now() - carryT < 400) return;
  if (!picking && moved <= 4 && !tc.dragging) { const hs = hotAt(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); if (hs) { enterSwitchMode(hs); return; } }
  if (picking) { if (moved <= 4) confirmPick(hitTarget(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1, 80)); return; }
  if (hideMode) { if (moved <= 4) hideUnder(e.clientX, e.clientY); return; }
  if (moved > 4 || tc.dragging || tc.axis) return;
  mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const cand = items.filter(m => m.visible && m.userData.gid && m.parent && m.parent.visible);
  const hit = ray.intersectObjects(cand, false)[0];
  select(hit ? groups.get(hit.object.userData.gid) : null);
});
function select(g) {
  selected = g;
  if (selBox) { scene.remove(selBox); selBox = null; }
  clr.dirty = true;
  if (!g || mode === 'walk') { tc.detach(); return; }
  tc.attach(g.pivot); selBox = new THREE.BoxHelper(g.pivot, 0xe0a24a); scene.add(selBox);
  $('eCol').value = g.col || '#b08a5a';
}
function setTool(m) {
  tc.setMode(m); tc.showX = m === 'translate'; tc.showY = m === 'rotate'; tc.showZ = m === 'translate';
  $('eMove').classList.toggle('on', m === 'translate'); $('eRot').classList.toggle('on', m === 'rotate');
}
setTool('translate');
let dragStart = null;
tc.addEventListener('objectChange', () => { if (dragStart && dragStart.fol) followMove(dragStart.fol, selected.pivot.position.x - dragStart.x, selected.pivot.position.z - dragStart.z); refreshHoles(); shadowsDirty(); clr.dirty = true; });
tc.addEventListener('dragging-changed', e => {
  orbit.enabled = !e.value && mode !== 'walk';
  if (!selected) return;
  if (e.value) { dragStart = gState(selected); dragStart.fol = followStart(selected); }
  else if (dragStart) { const g = selected, s = dragStart; dragStart = null; undoStack.push(() => { applyState(g, s); (s.fol || []).forEach(([fg, st]) => applyState(fg, st)); persist(); }); persist(); clr.dirty = true; }
});
/* Direct drag (owner 2026-11-11: "move the bed dragable, while moving show the distance to the nearest object in ft").
   Room / plan view: click an item to select it, then press on it and drag it across the floor. Moves in 1-inch steps
   (Shift = free). Clearance lines + labels (ft/in) re-measure live and a tip at the cursor shows the nearest gap.
   Undo (Ctrl+Z) and the per-option saved edits work exactly as with the gizmo. */
let fdrag = null, fdragT = 0;
const followersOf = g => [...groups.values()].filter(f => f !== g && f.pivot.visible && (f.followOf === g.id || (g.bundle && f.bundle === g.bundle)));
const followStart = g => followersOf(g).map(f => [f, gState(f)]);
function followMove(fol, dx, dz) { for (const [f, st] of fol) { f.pivot.position.x = st.x + dx; f.pivot.position.z = st.z + dz; f.pivot.updateMatrixWorld(true); } }
const fdragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), fdragHit = new THREE.Vector3();
function fdragRay(e) { mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera); }
function fdragTip(e) {
  const tip = $('dragTip'); if (!tip) return;
  if ((!fdrag && !carry) || !clr.last) { tip.style.display = 'none'; return; }
  const ent = Object.entries(clr.last).sort((a, b) => a[1] - b[1]);
  if (!ent.length) { tip.style.display = 'none'; return; }
  const nm = { N: 'north', S: 'south', E: 'east', W: 'west' };
  tip.innerHTML = `<b>Nearest: ${ftIn(ent[0][1])}</b> (${nm[ent[0][0]]})` + (ent.length > 1 ? '<br>' + ent.slice(1).map(([k, v]) => `${nm[k]} ${ftIn(v)}`).join(' · ') : '');
  tip.classList.toggle('tight', ent[0][1] < 0.6);
  tip.style.display = 'block'; tip.style.left = (e.clientX + 18) + 'px'; tip.style.top = (e.clientY + 18) + 'px';
}
addEventListener('pointerdown', e => {
  if (e.target !== canvas || e.button !== 0 || e.ctrlKey || e.metaKey || carry || mode === 'walk' || !selected || picking || hideMode || tc.axis || tc.dragging) return;
  fdragRay(e);
  const own = items.filter(m => m.userData.gid === selected.id && m.visible);
  const hit = ray.intersectObjects(own, false)[0]; if (!hit) return;
  fdragPlane.constant = -hit.point.y;
  fdrag = { start: gState(selected), p0: selected.pivot.position.clone(), h0: hit.point.clone(), moved: false, fol: followStart(selected) };
  orbit.enabled = false;
}, { capture: true });
addEventListener('pointermove', e => {
  if (!fdrag || !selected) return;
  fdragRay(e); if (!ray.ray.intersectPlane(fdragPlane, fdragHit)) return;
  const step = e.shiftKey ? 0.001 : 0.0254, p = selected.pivot.position;
  const dx = Math.round((fdragHit.x - fdrag.h0.x) / step) * step, dz = Math.round((fdragHit.z - fdrag.h0.z) / step) * step;
  if (!fdrag.moved && Math.hypot(dx, dz) < 0.02) return;
  fdrag.moved = true; p.x = fdrag.p0.x + dx; p.z = fdrag.p0.z + dz; selected.pivot.updateMatrixWorld(true);
  followMove(fdrag.fol, dx, dz);
  if (selBox) selBox.update();
  refreshHoles(); shadowsDirty();
  const now = performance.now(); if (now - fdragT > 40) { fdragT = now; measureClearances(); }
  fdragTip(e); invalidate();
});
addEventListener('pointerup', () => {
  if (!fdrag) return;
  const f = fdrag; fdrag = null; orbit.enabled = mode !== 'walk'; $('dragTip').style.display = 'none';
  if (!f.moved || !selected) return;
  const g = selected; undoStack.push(() => { applyState(g, f.start); f.fol.forEach(([fg, st]) => applyState(fg, st)); persist(); }); persist(); clr.dirty = true;
  setMsg(`${g.name || 'Item'} moved ${ftIn(Math.hypot(g.pivot.position.x - f.p0.x, g.pivot.position.z - f.p0.z))} — Ctrl+Z to undo`);
});
/* Carry mode (owner 2026-11-11: "Ctrl + click makes it draggable and Esc should exit the drag mode"; a normal click stays
   as before — walk: sit / open, room view: select). Ctrl/⌘ + click on any furniture picks it up:
   walk = it follows the crosshair across the floor as you look around; room / plan view = it follows the mouse (no button
   held). Clearance lines + labels in ft/in re-measure live and a tip shows the nearest gap. Click or Esc puts it down
   where it is (Ctrl+Z undoes); in walk mode Esc also releases the mouse, which ends the carry too. */
let carry = null, carryT = 0;
const carryCands = () => items.filter(m => m.visible && m.userData.gid && m.parent && m.parent.visible && isShown(m) && m.userData.cat !== 'ceiling');
function carryRayAt(ndcX, ndcY) { mouse.set(ndcX, ndcY); ray.setFromCamera(mouse, camera); }
function carryNdc() { return mode === 'walk' ? [0, 0] : [lastMouse[0] / innerWidth * 2 - 1, -(lastMouse[1] / innerHeight) * 2 + 1]; }
function startCarry(ndc) {
  if (walk.seated) standUp();
  carryRayAt(ndc[0], ndc[1]); ray.far = mode === 'walk' ? 6 : 100;
  const hit = ray.intersectObjects(carryCands(), false)[0]; ray.far = Infinity;
  const g = hit && groups.get(hit.object.userData.gid);
  if (!g || g.fixture) { setMsg('Ctrl + click on a piece of furniture to pick it up'); return; }
  if (mode === 'walk') { selected = g; if (selBox) scene.remove(selBox); selBox = new THREE.BoxHelper(g.pivot, 0xe0a24a); scene.add(selBox); }
  else select(g);
  carry = { g, start: gState(g), fol: followStart(g), p0: g.pivot.position.clone(), h0: hit.point.clone(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -hit.point.y), moved: false, t: 0 };
  carryT = performance.now(); orbit.enabled = false; clr.dirty = true;
  setMsg(`Moving ${g.name} — ${mode === 'walk' ? 'look where it should go' : 'move the mouse'} · Shift = fine steps · click or Esc to put it down · Ctrl+Z undoes`);
}
function updateCarry() {
  const c = carry; if (!c || !groups.has(c.g.id)) { carry = null; return; }
  const n = carryNdc(); carryRayAt(n[0], n[1]);
  const hit = new THREE.Vector3(); if (!ray.ray.intersectPlane(c.plane, hit) || hit.distanceTo(camera.position) > 12) return;
  const step = keys.ShiftLeft || keys.ShiftRight ? 0.001 : 0.0254;
  const dx = Math.round((hit.x - c.h0.x) / step) * step, dz = Math.round((hit.z - c.h0.z) / step) * step, p = c.g.pivot.position;
  const tipNow = () => fdragTip({ clientX: mode === 'walk' ? innerWidth / 2 : lastMouse[0], clientY: mode === 'walk' ? innerHeight / 2 + 30 : lastMouse[1] });
  if (Math.abs(p.x - c.p0.x - dx) < 1e-6 && Math.abs(p.z - c.p0.z - dz) < 1e-6) { tipNow(); return; }
  c.moved = true; p.x = c.p0.x + dx; p.z = c.p0.z + dz; c.g.pivot.updateMatrixWorld(true); followMove(c.fol, dx, dz);
  refreshHoles(); shadowsDirty();
  const now = performance.now(); if (now - c.t > 40) { c.t = now; measureClearances(); }
  tipNow(); invalidate();
}
function endCarry(why) {
  const c = carry; if (!c) return; carry = null; carryT = performance.now();
  orbit.enabled = mode !== 'walk'; $('dragTip').style.display = 'none';
  if (c.moved) {
    const g = c.g; undoStack.push(() => { applyState(g, c.start); c.fol.forEach(([fg, st]) => applyState(fg, st)); persist(); }); persist();
    setMsg(`${g.name} put down — moved ${ftIn(Math.hypot(g.pivot.position.x - c.p0.x, g.pivot.position.z - c.p0.z))} · Ctrl+Z to undo`);
  } else setMsg('Put down (not moved)');
  if (mode === 'walk') { selected = null; if (selBox) { scene.remove(selBox); selBox = null; } }
  clr.dirty = true; invalidate();
}
addEventListener('pointerdown', e => {
  if (e.target !== canvas) return;
  if (carry) { e.preventDefault(); e.stopImmediatePropagation(); endCarry('click'); return; }
  if (!(e.ctrlKey || e.metaKey) || picking || hideMode) return;
  if (mode === 'walk' && !walk.locked) return;
  e.preventDefault(); e.stopImmediatePropagation();
  startCarry(mode === 'walk' ? [0, 0] : [e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1]);
}, { capture: true });
canvas.addEventListener('contextmenu', e => { if (e.ctrlKey || carry || performance.now() - carryT < 400) e.preventDefault(); });
function delSel() {
  const g = selected; if (!g) return; const s = gState(g); select(null);
  if (g.clone) { const src = exportRoom(g.room).clones[g.id]; removeClone(g); undoStack.push(() => { const c = cloneGroup(groups.get(src.src), g.id); applyState(c, src); applyVisibility(); persist(); }); }
  else { g.pivot.visible = false; shadowsDirty(); undoStack.push(() => { g.pivot.visible = true; applyState(g, s); persist(); }); }
  persist();
}
function dupSel() {
  if (!selected) return; const c = cloneGroup(selected, null);
  c.pivot.position.set(selected.pivot.position.x + 0.5, selected.pivot.position.y, selected.pivot.position.z + 0.5); c.pivot.rotation.y = selected.pivot.rotation.y;
  c.col = null; if (selected.col) setColor(c, selected.col);
  applyVisibility(); undoStack.push(() => { removeClone(c); persist(); }); select(c); persist();
}
function recolor(hex) {
  const g = selected; if (!g) return; const prev = g.col; setColor(g, hex);
  undoStack.push(() => { setColor(g, prev); persist(); }); persist();
}
function undo() { const f = undoStack.pop(); if (f) { f(); clr.dirty = true; shadowsDirty(); setMsg('Undone (Ctrl+Z)'); } else setMsg('Nothing to undo'); }
$('eMove').onclick = () => setTool('translate'); $('eRot').onclick = () => setTool('rotate');
$('eDel').onclick = delSel; $('eDup').onclick = dupSel; $('eUndo').onclick = undo;
$('eCol').addEventListener('change', e => recolor(e.target.value));
$('eReset').onclick = () => { if (confirm('Discard ALL your furniture edits in every room and option?')) { store.edits = {}; importLayout({ v: 2, sel: store.sel, edits: {} }); undoStack.length = 0; select(null); persist(); } };
$('eSave').onclick = () => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(exportLayout(), null, 1)], { type: 'application/json' }));
  a.download = 'home_layout.json'; a.click(); URL.revokeObjectURL(a.href);
};
$('eLoad').onclick = () => {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.json';
  i.onchange = async () => { try { importLayout(JSON.parse(await i.files[0].text())); persist(); } catch (e) { setMsg('Could not read that layout file'); } }; i.click();
};

function selfTest() {
  const log = []; try {
    enterRoom('Master bedroom');
    const g = [...groups.values()].find(g => g.pivot.visible && g.meshes.some(m => m.userData.rooms.includes('Master bedroom')));
    const R = 'Master bedroom', ER = () => exportRoom(R);
    log.push('opt=' + store.sel[R] + ' added=' + layoutExtras[R].groups.length + ' movers=' + movers.size);
    select(g); g.pivot.position.x += 0.5; dupSel(); log.push('clones=' + Object.keys(ER().clones).length);
    recolor('#336699'); log.push('col=' + selected.col);
    delSel(); log.push('afterDel clones=' + Object.keys(ER().clones).length);
    undo(); log.push('afterUndo clones=' + Object.keys(ER().clones).length);
    undo(); undo(); log.push('afterUndo3 clones=' + Object.keys(ER().clones).length + ' moved=' + Object.keys(ER().items).length);
    setRoomLayout(R, 'option2'); log.push('switch→' + store.sel[R] + ' added=' + layoutExtras[R].groups.length + ' keptEdits1=' + Object.keys(store.edits[R + '|option1'].items).length);
    setRoomLayout(R, 'option1'); log.push('back→' + store.sel[R] + ' moved=' + Object.keys(ER().items).length);
    resetRoom(R); log.push('reset moved=' + Object.keys(ER().items).length);
    const scr = [...movers.values()].find(m => m.info.type === 'roll'); log.push('screen=' + !!scr);
    log.push('metrics=' + JSON.stringify(liveMetrics(R)));
  } catch (e) { log.push('ERR ' + e.stack); }
  const pre = document.createElement('pre'); pre.id = 'selftest'; pre.textContent = log.join(' | '); document.body.appendChild(pre);
}

/* ---------- comments for the designer: stored in comments.json by tools/serve.py ---------- */
let comments = [], pinsOn = true, showDone = false, pending = null;
const pinGroup = new THREE.Group(); scene.add(pinGroup);
function cameraState() {
  return mode === 'walk' ? { mode: 'walk', pos: [walk.x, EYE, walk.z], yaw: walk.yaw, pitch: walk.pitch }
    : { mode, pos: camera.position.toArray(), target: orbit.target.toArray() };
}
function snapshot() {
  try {
    ensureSize(); if (mode === 'walk') stepWalk(0); else orbit.update(); composer.render();
    const src = renderer.domElement, w = 800, c = document.createElement('canvas');
    c.width = w; c.height = Math.round(src.height * w / src.width);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  } catch (e) { return null; }
}
function targetFromHit(m, p) {
  const g = m.userData.gid && groups.get(m.userData.gid);
  if (g) return { kind: 'item', id: g.id, name: g.name, cat: 'furn', room: g.room, point: p };
  const what = { arch: 'wall / architecture', floor: 'floor', ceiling: 'ceiling', ceilfix: 'ceiling fixture', exterior: 'outside view' }[m.userData.cat] || m.userData.cat;
  return { kind: 'surface', id: m.name, name: `${what} (${m.material.name || 'surface'})`, cat: m.userData.cat, room: roomAt(p.x, p.z) || (m.userData.rooms || [])[0], point: p };
}
function describeTarget() {
  if (mode === 'walk') {
    lookRay.far = 10; lookRay.setFromCamera(new THREE.Vector2(0, 0), camera);
    const h = lookRay.intersectObjects(items.filter(m => m.visible && isShown(m)), false)[0];
    return h ? targetFromHit(h.object, h.point) : { kind: 'room', room: roomAt(walk.x, walk.z), name: 'whole room', point: null };
  }
  if (selected) {
    const b = new THREE.Box3().setFromObject(selected.pivot), c = b.getCenter(new THREE.Vector3()); c.y = b.max.y + 0.05;
    return { kind: 'item', id: selected.id, name: selected.name, cat: 'furn', room: selected.room, point: c };
  }
  return { kind: 'room', room: curRoom || layoutRoom, name: 'whole room', point: null };
}
/* Picking what a comment is about: "Add comment" / M starts pick mode. The item (or wall / floor surface) under the
   cursor — or under the crosshair in walk mode — is tinted orange with its name shown, and a click attaches the
   comment to exactly that. The highlight stays on while the comment box is open (and is in the saved screenshot). */
const hl = { group: new THREE.Group(), key: null, box: null, t: null, at: 0 };
scene.add(hl.group);
const hlMat = new THREE.MeshBasicMaterial({ color: 0xff9a1f, transparent: true, opacity: 0.38, depthWrite: false,
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
let picking = false;
function insideClip(p) { return renderer.clippingPlanes.every(pl => pl.distanceToPoint(p) >= -1e-3); }
function hitTarget(ndcX, ndcY, far) {
  lookRay.far = far; lookRay.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const hits = lookRay.intersectObjects(items.filter(m => m.visible && isShown(m)), false);
  const h = hits.find(h => insideClip(h.point));   // room view clips neighbouring rooms: skip hits in the cut-off part
  return h ? { ...targetFromHit(h.object, h.point), mesh: h.object } : null;
}
function wholeRoomTarget() {
  return { kind: 'room', room: mode === 'walk' ? roomAt(walk.x, walk.z) : (curRoom || layoutRoom), name: 'whole room', point: null };
}
function setHighlight(t) {
  const key = t && t.kind !== 'room' ? (t.kind === 'item' ? 'g:' + t.id : 'm:' + t.mesh.uuid) : null;
  hl.t = t; if (key === hl.key) return; hl.key = key;
  hl.group.clear(); if (hl.box) { scene.remove(hl.box); hl.box.dispose(); hl.box = null; }
  if (key) {
    const ms = t.kind === 'item' ? items.filter(m => m.userData.gid === t.id && isShown(m)) : [t.mesh];
    for (const m of ms) {
      m.updateWorldMatrix(true, false);
      const o = new THREE.Mesh(m.geometry, hlMat); o.matrixAutoUpdate = false; o.matrix.copy(m.matrixWorld);
      o.renderOrder = 15; o.raycast = () => {}; hl.group.add(o);
    }
    const g = t.kind === 'item' && groups.get(t.id);
    if (g) { hl.box = new THREE.BoxHelper(g.pivot, 0xff9a1f); hl.box.renderOrder = 16; hl.box.raycast = () => {}; scene.add(hl.box); }
  }
  invalidate();
}
function targetLabel(t) { return !t || t.kind === 'room' ? `the whole ${(t && t.room) || 'home'}` : `${t.name}${t.room ? ' · ' + t.room : ''}`; }
function showPickTip(t, x, y) {
  const el = $('pickTip');
  el.innerHTML = `<b>${t ? 'Comment on: ' + escHtml(targetLabel(t)) : 'Point at an item'}</b><br><small>${mode === 'walk' ? 'Click or M to choose' : 'Click to choose · click empty space for the whole room'} · Esc to cancel</small>`;
  if (mode === 'walk') { el.style.left = '50%'; el.style.top = 'calc(50% + 22px)'; el.style.transform = 'translateX(-50%)'; }
  else { el.style.left = (x + 16) + 'px'; el.style.top = (y + 16) + 'px'; el.style.transform = 'none'; }
  el.style.display = 'block';
}
function escHtml(t) { return String(t || '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }
function startPick() {
  if (pending) return;
  picking = true; canvas.style.cursor = 'crosshair'; select(null);
  if (mode === 'walk') { if (!walk.locked) canvas.requestPointerLock(); updatePickWalk(true); }
  else { setHighlight(null); showPickTip(null, innerWidth / 2 - 120, 70); }
  $('cAdd').classList.add('on');
  setMsg(mode === 'walk' ? 'Aim the centre dot at what you want to comment on — it turns orange — then click or press M'
    : 'Move the mouse over what you want to comment on — it turns orange — then click it');
}
function stopPick(keepHighlight) {
  picking = false; canvas.style.cursor = ''; $('pickTip').style.display = 'none'; $('cAdd').classList.remove('on');
  if (!keepHighlight) setHighlight(null);
}
function updatePickWalk(force) {   // walk mode: follow the crosshair (throttled)
  const now = performance.now(); if (!force && now - hl.at < 90) return; hl.at = now;
  const t = hitTarget(0, 0, 12); setHighlight(t); showPickTip(t);
}
function confirmPick(t) {
  t = t || wholeRoomTarget();
  stopPick(true); setHighlight(t); openCommentBox(t);
  setMsg(`Commenting on ${targetLabel(t)} (shown in orange)`);
}
canvas.addEventListener('pointermove', e => {
  if (!picking || mode === 'walk' || e.buttons) return;
  const t = hitTarget(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1, 80);
  setHighlight(t); showPickTip(t, e.clientX, e.clientY);
});
canvas.addEventListener('pointerleave', () => { if (picking && mode !== 'walk') { setHighlight(null); $('pickTip').style.display = 'none'; } });
document.addEventListener('pointerlockchange', () => { if (picking && mode === 'walk' && !document.pointerLockElement) stopPick(); });
function openCommentBox(t) {
  t = t || describeTarget();
  pending = { t, img: snapshot(), cam: cameraState() };
  leaveWalk();
  $('cWhat').textContent = targetLabel(t);
  $('cText').value = ''; $('cBox').style.display = 'block'; setTimeout(() => $('cText').focus(), 0);
}
function closeCommentBox() { const was = !!pending; $('cBox').style.display = 'none'; pending = null; setHighlight(null); if (was) setMsg(''); }
async function api(body) {
  const r = await fetch('api/comments', { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
  return r.json();
}
async function saveComment() {
  const text = $('cText').value.trim(); if (!text || !pending) return;
  const t = pending.t;
  try {
    await api({ action: 'add', image: pending.img, comment: { text, room: t.room || '', option: (t.room && store.sel[t.room]) || '', mode,
      target: { kind: t.kind, id: t.id || '', name: t.name || '', cat: t.cat || '' }, point: t.point ? t.point.toArray().map(v => +v.toFixed(3)) : null, camera: pending.cam } });
    closeCommentBox(); setMsg('Comment saved — it is in walkthrough/comments.json for the designer'); refreshComments();
  } catch (e) { setMsg('Could not save the comment: start the app with  python3 tools/serve.py 8000  (' + e.message + ')'); }
}
async function refreshComments() {
  try { comments = (await api()).comments || []; } catch (e) { comments = []; $('cList').innerHTML = '<small>Comments need the local server: python3 tools/serve.py 8000</small>'; return; }
  renderComments(); buildPins();
}
function renderComments() {
  const esc = t => String(t || '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const list = comments.filter(c => showDone || c.status !== 'done').sort((a, b) => b.n - a.n);
  $('cList').innerHTML = list.length ? list.map(c => `<div class="c ${c.status}"><b>#${c.n}</b> ${esc(c.target && c.target.kind !== 'room' ? c.target.name : 'Whole room')} · ${esc(c.room)}${c.status === 'done' ? ' ✓' : ''}<br>${esc(c.text)}
      ${c.reply ? `<div class="rep">Designer: ${esc(c.reply)}</div>` : ''}
      <div class="row"><button data-go="${c.id}">Go</button><button data-st="${c.id}">${c.status === 'done' ? 'Reopen' : 'Done'}</button><button data-del="${c.id}">Delete</button></div></div>`).join('')
    : '<small>No comments yet.</small>';
  $('cList').querySelectorAll('[data-go]').forEach(b => b.onclick = () => goToComment(comments.find(c => c.id === b.dataset.go)));
  $('cList').querySelectorAll('[data-st]').forEach(b => b.onclick = async () => { const c = comments.find(x => x.id === b.dataset.st); await api({ action: 'update', id: c.id, status: c.status === 'done' ? 'open' : 'done' }).catch(() => {}); refreshComments(); });
  $('cList').querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (confirm('Delete this comment?')) { await api({ action: 'delete', id: b.dataset.del }).catch(() => {}); refreshComments(); } });
}
function pinSprite(n, done) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d');
  x.fillStyle = done ? '#6b7280' : '#e0a24a'; x.beginPath(); x.arc(32, 32, 28, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#111'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 32, 34);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false, transparent: true }));
  sp.scale.set(0.22, 0.22, 1); sp.renderOrder = 20; return sp;
}
function buildPins() {
  pinGroup.clear();
  for (const c of comments) {
    if (!c.point || (c.status === 'done' && !showDone)) continue;
    const sp = pinSprite(c.n, c.status === 'done'); sp.position.fromArray(c.point).y += 0.12; pinGroup.add(sp);
  }
  pinGroup.visible = pinsOn; invalidate();
}
function goToComment(c) {
  if (!c) return;
  if (c.room && c.option && layoutMods[c.room] && store.sel[c.room] !== c.option) { store.chosen = store.chosen || {}; store.chosen[c.room] = true; setRoomLayout(c.room, c.option); }
  const cam = c.camera || {};
  if (cam.mode === 'walk' && cam.pos) { enterWalk(); walk.x = cam.pos[0]; walk.z = cam.pos[2]; walk.yaw = cam.yaw || 0; walk.pitch = cam.pitch || 0; }
  else { if (cam.mode === 'room' && c.room) enterRoom(c.room); else enterPlan(); if (cam.pos) camera.position.fromArray(cam.pos); if (cam.target) orbit.target.fromArray(cam.target); }
  setMsg(`Comment #${c.n}: ${c.text}`);
}
$('cAdd').onclick = () => { if (picking) stopPick(); else startPick(); };
$('cSave').onclick = saveComment;
$('cCancel').onclick = closeCommentBox;
$('cPins').onclick = () => { pinsOn = !pinsOn; pinGroup.visible = pinsOn; $('cPins').classList.toggle('on', pinsOn); };
$('cShowDone').onclick = () => { showDone = !showDone; $('cShowDone').classList.toggle('on', showDone); renderComments(); buildPins(); };

/* ---------- HUD / loop ---------- */
function hud() {
  let t = '';
  if (mode === 'walk') t = walk.seated ? `<b>Seated</b> · ${walk.seated.name} · ${roomAt(walk.x, walk.z) || ''}` : `<b>Walking</b> · ${roomAt(walk.x, walk.z) || 'outside'}`;
  else if (mode === 'room') { const r = rooms[curRoom]; t = `<b>${curRoom}</b><br>${r.mm[0]} × ${r.mm[1]} mm (${(r.mm[0] * r.mm[1] / 1e6).toFixed(1)} m²)`; }
  else t = '<b>Whole home</b> · 3 BHK · C2';
  if (selected && mode !== 'walk') {
    const s = new THREE.Box3().setFromObject(selected.pivot).getSize(new THREE.Vector3());
    t += `<br><br>Selected: <b>${selected.name}</b><br>${Math.round(s.x * 100)} × ${Math.round(s.z * 100)} × ${Math.round(s.y * 100)} cm (W×D×H)`;
    if (clr.last) t += '<br>Free space: ' + Object.entries(clr.last).map(([k, v]) => `${k} ${ftIn(v)}`).join(' · ') + '<br><small>to nearest wall or furniture · red = under 2 ft (0.60 m) · drag the selected item to move it</small>';
  }
  if ($('hud').dataset.t !== t) { $('hud').innerHTML = t; $('hud').dataset.t = t; }
}
/* compass: dial turns so the orange marker at the top always shows the direction the view faces.
   North = floor-plan north (three −z; Blender +Y), the convention used for every "north wall" in this project. */
const compass = { deg: null, v: new THREE.Vector3(), u: new THREE.Vector3() };
function updateCompass() {
  const e = camera.matrixWorld.elements;
  // horizontal part of (forward + screen-up): forward when level, screen-up when looking straight down (plan views)
  const x = -e[8] + e[4], z = -e[10] + e[6];
  if (Math.hypot(x, z) < 1e-6) return;
  let deg = THREE.MathUtils.radToDeg(Math.atan2(x, -z)); deg = (deg + 360) % 360;   // 0 = north, 90 = east (clockwise)
  if (compass.deg !== null && Math.abs(((deg - compass.deg + 540) % 360) - 180) < 0.5) return;
  compass.deg = deg;
  $('cRose').setAttribute('transform', `rotate(${(-deg).toFixed(1)})`);
  // letters stay upright
  $('cRose').querySelectorAll('text').forEach(t => t.setAttribute('transform', `rotate(${deg.toFixed(1)} ${t.getAttribute('x') || 0} ${t.getAttribute('y') || 0})`));
  const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  $('cFace').textContent = `Facing ${names[Math.round(deg / 45) % 8]} · ${Math.round(deg) % 360}°`;
}
const clock = new THREE.Clock();
let lastW = 0, lastH = 0;
function ensureSize() {
  const w = innerWidth, h = innerHeight;
  if (w !== lastW || h !== lastH) { lastW = w; lastH = h; renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
}
// agent helper (perf): lights that currently reach the shaders (visible in the scene graph), by type
function perfLights() {
  const n = {}; scene.traverseVisible(o => { if (o.isLight && o.layers.test(camera.layers)) n[o.type] = (n[o.type] || 0) + 1; }); return n;
}
function setPR(pr) {
  if (renderer.getPixelRatio() === pr) return;
  renderer.setPixelRatio(pr); composer.setPixelRatio(pr);
}
// any user input may change what is on screen: render a full-quality frame for it
for (const ev of ['pointerdown', 'pointerup', 'keydown', 'keyup', 'wheel', 'click', 'input', 'change', 'resize']) addEventListener(ev, invalidate, { capture: true, passive: true });
// hovering the move/rotate gizmo highlights it: treat as motion (cheap frames) while an item is selected
addEventListener('pointermove', () => { if (tc.object) RQ.lastMotion = performance.now(); }, { capture: true, passive: true });
THREE.DefaultLoadingManager.onLoad = invalidate;   // late textures
function loop() {
  if (TOUR) return;   // tour recording renders frame by frame through window.__tour.render()
  requestAnimationFrame(loop);
  const raw = clock.getDelta(), dt = Math.min(raw, 0.1);
  const P = RQ.prof, pt = P ? (k, t0) => { const t1 = performance.now(); P[k] = (P[k] || 0) + t1 - t0; return t1; } : null;
  let t0 = P ? performance.now() : 0;
  if (P && P.sim) { walk.yaw += 0.01; RQ.lastMotion = t0; hintT = 0; }   // __app.loopProf(): simulated turning + crosshair hint every frame
  animateMovers(dt);
  if (mode === 'walk') stepWalk(dt); else orbit.update();
  if (P) t0 = pt('walk', t0);
  updateMirrorProbes();
  if (P) t0 = pt('mirror', t0);
  updateHint();
  if (P) t0 = pt('hint', t0);
  animateMoods(performance.now() / 1000); updateProjectors(performance.now(), dt); updateProjSwitch();
  if (P) t0 = pt('moods', t0);
  updateDesignBar();
  if (P) t0 = pt('designBar', t0);
  if (mode === 'walk') { const r = roomAt(walk.x, walk.z); if (r && r !== layoutRoom && layoutMods[r]) { layoutRoom = r; renderLayoutUI(); } }
  if (carry) updateCarry();
  if (selBox) selBox.update();
  if (picking && mode === 'walk') updatePickWalk();
  const now = performance.now();
  if (clr.dirty && now - clr.t > 120) { clr.dirty = false; clr.t = now; measureClearances(); }
  if (P) t0 = pt('misc', t0);
  cutawayWalls(); updateLights(); updateRectPool(); updateLabels(); hud(); updateCompass();
  if (P) t0 = pt('lightsHud', t0);
  ensureSize();
  if (RQ.bench) return;   // __app.perfBench() is rendering
  // perf: render on demand. Moving -> cheap frames (adaptive pixel ratio, no AO); still -> one full-quality frame, then idle.
  camera.updateMatrixWorld();
  const cm = camera.matrixWorld.elements, pm = RQ.cam.elements;
  let camMoved = camera.fov !== RQ.fov;
  for (let i = 0; i < 16 && !camMoved; i++) if (Math.abs(cm[i] - pm[i]) > 1e-5) camMoved = true;
  if (camMoved) { RQ.cam.copy(camera.matrixWorld); RQ.fov = camera.fov; }
  const anim = animateMovers.moved || tc.dragging || Object.values(roomMood).includes('gaming');
  if (camMoved || anim) RQ.lastMotion = now;
  const moving = now - RQ.lastMotion < 200;
  if (moving) {
    if (RQ.prevMoving) {   // adapt the moving resolution to the measured frame time
      RQ.ema += (raw * 1000 - RQ.ema) * 0.15;
      if (now - RQ.adaptT > 400) {
        RQ.adaptT = now;
        if (RQ.ema > 26 && RQ.movePR > RQ.minPR) RQ.movePR = Math.max(RQ.minPR, +(RQ.movePR - 0.1).toFixed(2));
        else if (RQ.ema < 18.5 && RQ.movePR < RQ.stillPR) RQ.movePR = Math.min(RQ.stillPR, +(RQ.movePR + 0.1).toFixed(2));
      }
    }
    setPR(RQ.movePR); gtao.enabled = false;
    renderer.info.reset(); composer.render(); RQ.lastRender = now; RQ.dirty = true;
    if (P) { pt('render', t0); P.frames = (P.frames || 0) + 1; }
  } else if (RQ.dirty || renderer.shadowMap.needsUpdate || now - RQ.lastRender > 2000) {
    setPR(RQ.stillPR); gtao.enabled = hq;
    renderer.info.reset(); composer.render(); RQ.lastRender = now; RQ.dirty = false;
    if (P) { pt('render', t0); P.frames = (P.frames || 0) + 1; }
  }
  if (P) P.loops = (P.loops || 0) + 1;
  RQ.prevMoving = moving;
}
/* ---------- tour recording hook: only active with ?tour=1 (driven by tools/record_tour.mjs) ---------- */
const TOUR = params.has('tour');
function setupTour() {
  const st = document.createElement('style');
  st.textContent = `#side,#hud,#msg,#cross,#hint,#compass,#pickTip,#projSwitch,#designBar,.lbl,#load{display:none!important}`; hotGroup.visible = false; st.textContent += `
    #tourCap{position:fixed;left:72px;bottom:64px;color:#fff;font:600 40px/1.15 -apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;letter-spacing:.01em;
      text-shadow:0 2px 12px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.7);opacity:0;z-index:40;pointer-events:none}
    #tourCap small{display:block;font-size:21px;font-weight:400;opacity:.88;margin-top:6px;letter-spacing:.03em}
    #tourFade{position:fixed;inset:0;background:#000;opacity:0;z-index:41;pointer-events:none}`;
  document.head.appendChild(st);
  const cap = document.createElement('div'); cap.id = 'tourCap'; document.body.appendChild(cap);
  const fade = document.createElement('div'); fade.id = 'tourFade'; document.body.appendChild(fade);
  pinGroup.visible = false; showDim = false;
  for (const mv of movers.values()) if (mv.info.type === 'door') { mv.t = mv.target = 1; poseMover(mv); }
  animateMovers(0); shadowsDirty(); applyVisibility();
  const rollers = room => [...movers.values()].filter(mv => mv.info.type === 'roll' && mv.group && mv.group.room === room);
  let capKey = '';
  window.__tour = {
    // walk-mode camera (eye height in metres)
    view({ x, z, yaw, pitch = 0, eye = EYE }) {
      if (mode !== 'walk') { enterWalk(); showDim = false; applyVisibility(); }
      walk.x = x; walk.z = z; walk.yaw = yaw; walk.pitch = pitch; walk.seated = null;
      camera.position.set(x, eye, z); camera.rotation.set(pitch, yaw, 0, 'YXZ');
    },
    // free camera over the whole home (plan mode visibility: no ceilings)
    orbitView({ pos, target }) {
      if (mode !== 'plan') { enterPlan(); showDim = false; orbit.enabled = false; applyVisibility(); }
      camera.position.fromArray(pos); orbit.target.fromArray(target); camera.lookAt(orbit.target);
    },
    // obstacle map for path planning: same cells as grid.bin, 1 = wall/furniture/door leaf at the cell centre
    occupancy() {
      animateMovers(0);
      const { x0, y0, cell, nx, ny } = gridMeta; let s = '';
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = x0 + (i + 0.5) * cell, z = -(y0 + (j + 0.5) * cell);
        s += (blocked(x, z) || hitsFurniture(x, z, 0.02) || hitsBlockers(x, z, 0.02)) ? '1' : '0';
      }
      return { ...gridMeta, data: s };
    },
    // seated pose (as the E key would give) on the first group whose id contains `sub`
    seat(sub) {
      const g = [...groups.values()].find(g => g.id.includes(sub) && g.pivot.visible); if (!g) return null;
      const c = new THREE.Box3().setFromObject(g.pivot).getCenter(new THREE.Vector3());
      const prev = { ...walk }; sitOn(g, c);
      const out = { x: walk.x, z: walk.z, yaw: walk.yaw, pitch: walk.pitch, eye: walk.seated.eye, name: g.name, id: g.id };
      Object.assign(walk, prev); walk.seated = null; return out;
    },
    groups: re => [...groups.values()].filter(g => new RegExp(re).test(g.id)).map(g => { const b = new THREE.Box3().setFromObject(g.pivot); return [g.id, g.name, ...[b.min.x, b.max.x, b.min.z, b.max.z].map(v => +v.toFixed(2))]; }),
    mood: (room, m) => { if (roomMood[room] !== m) setMood(room, m); },
    light: m => { if (lightMode !== m) setLightMode(m); },
    screen(room, t) { for (const mv of rollers(room)) { mv.t = mv.target = t; poseMover(mv); } shadowsDirty(); },
    // projector fully on / off at once (the live loop that animates it does not run with ?tour=1); images must be loaded
    async projector(room, on) {
      const p = projectorParts(room); if (!p) return false;
      loadProjTex(); for (let i = 0; i < 60 && projTex.filter(Boolean).length < PROJ_IMAGES.length; i++) await new Promise(r => setTimeout(r, 100));
      const st = projState[room] || (projState[room] = { on: false, fade: 0, idx: 0, swapT: 0, beam: null });
      for (const mv of [p.roll, p.lift]) if (mv) { mv.t = mv.target = on ? 1 : 0; poseMover(mv); }
      st.on = on; st.fade = on ? 1 : 0; st.t0 = -1e9; setMood(room, on ? 'movie' : 'normal');
      scene.updateMatrixWorld(true); updateProjectors(performance.now(), 0); shadowsDirty(); return true;
    },
    projectorImage(room, i) { const p = projectorParts(room), st = projState[room]; if (!p || !st || !projTex[i]) return false; st.idx = i; st.swapT = performance.now(); p.sc.imgMat.map = projTex[i]; p.sc.imgMat.needsUpdate = true; return true; },
    // pose every mover whose id matches `re` (doors, sliders, curtains…) at t (0..1), e.g. movers('balcony-sliding', 1)
    movers(re, t) { const rx = new RegExp(re); let n = 0; for (const mv of movers.values()) if (rx.test(mv.id) && mv.t !== t) { mv.t = mv.target = t; poseMover(mv); n++; } if (n) { shadowsDirty(); animateMovers(0); } return n; },
    caption(title, sub, alpha) {
      const k = title + '|' + (sub || '');
      if (k !== capKey) { capKey = k; cap.innerHTML = ''; cap.append(title || ''); if (sub) { const s = document.createElement('small'); s.textContent = sub; cap.append(s); } }
      cap.style.opacity = alpha;
    },
    fade: a => { fade.style.opacity = a; },
    roomAt: (x, z) => roomAt(x, z),
    // render one frame at scene time t (s); resolves once it has been presented
    render: t => new Promise(res => requestAnimationFrame(() => {
      animateMoods(t); lightT = 0; updateLights(); updateRectPool(true); updateMirrorProbes(); ensureSize(); composer.render();
      requestAnimationFrame(() => res(true));
    })),
  };
}
init().catch(e => { console.error(e); $('load').innerHTML = '<div>Could not load the model. Run this folder from a local web server (see README.md).<br><small>' + e + '</small></div>'; });
