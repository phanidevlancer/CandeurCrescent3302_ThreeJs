// Parametric builders for layout options. All sizes in metres.
// Local frame of every item: origin on the floor at the centre of its BACK face (the face against the wall),
// +x = along the wall (left→right when you face the item), +y = up, +z = towards the room (the item's front).
// A mesh with userData.moverSpec becomes an interactive part (hinged door, drawer, sliding shutter, roll-down screen).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

let moverSeq = 0;
export function makeLib(mat, getModel = () => null) {
  const M = (name, fallback) => mat(name, fallback);
  const WOOD = () => M('Approved mid walnut veneer', 0x6b4a32), DARK = () => M('Dark walnut', 0x3b2a1f), SMOKED = () => M('Smoked walnut - master feature wall', 0x4a3428);
  const OAK = () => M('Light natural timber', 0xb08a5a), BRASS = () => M('05 Aged brushed brass', 0xb08d57), GRAPH = () => M('Graphite metal', 0x2b2d31);
  const LINEN = () => M('04 Natural linen upholstery', 0xcfc3ad), OLIVE = () => M('Muted olive green textile', 0x6e7651), IVORY = () => M('Ivory cotton', 0xe9e1d0);
  const GREIGE = () => M('Wardrobe sliding door warm greige', 0xb3a798), GLASS = () => M('TV dark glass', 0x0b0c0e), SAGE = () => M('Approved B1 sage lacquer', 0x8a9879);
  const BLACK = () => M('__matte_black', 0x141414), FRIDGE = () => M('__fridge_grey', 0x3a3d42), SCREEN = () => M('__screen_white', 0xf2f2ef);

  const g = () => new THREE.Group();
  function box(w, h, d, m, x = 0, y = 0, z = 0, r = 0) {
    const geo = r > 0 && Math.min(w, h, d) > 2.2 * r ? new RoundedBoxGeometry(w, h, d, r > 0.025 ? 5 : 2, r) : new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, typeof m === 'function' ? m() : m); mesh.position.set(x, y + h / 2, z + d / 2); return mesh;   // x centre, y bottom, z back
  }
  function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 32) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'function' ? m() : m); mesh.position.set(x, y + h / 2, z); return mesh;
  }
  function led(colour = 0xffc890, power = 2.5) {
    return new THREE.MeshStandardMaterial({ color: 0x111111, emissive: new THREE.Color(colour), emissiveIntensity: power, roughness: 0.6, name: 'LED' });
  }
  // appliances / loose items inside a built-in: hidden by the 'interior only' view
  const loose = o => { o.traverse(c => { if (c.isMesh) c.userData.loose = true; }); return o; };
  const mover = (mesh, spec) => { mesh.userData.moverSpec = { id: 'm' + (++moverSeq), ...spec }; return mesh; };
  const tagGroup = (grp, spec) => { const id = 'm' + (++moverSeq); grp.traverse(o => { if (o.isMesh) o.userData.moverSpec = { id, ...spec }; }); return grp; };

  /* ---------- gaming TV wall: slatted backdrop, LED reveals, 65" TV, floating console with PS5 bay ---------- */
  // finish: 'fluted' = vertical walnut slats; 'flush' = plain smoked-walnut veneer panels (≤ 0.6 m) with 6 mm shadow gaps
  function tvWall({ width = 1.8, height = 2.9, consoleW = 1.6, tvW = 1.449, tvH = 0.837, tvCentreY = 1.1, ledColour = 0x8a5cff, finish = 'fluted' } = {}) {
    const root = g(), moods = { strips: [], glow: [] };
    root.add(box(width, height, 0.018, GRAPH, 0, 0.02, 0));                                   // backing board (shows in the gaps)
    if (finish === 'flush') {
      const np = Math.ceil(width / 0.6), gap = 0.006, pw = (width - gap * (np - 1)) / np;
      for (let i = 0; i < np; i++) root.add(box(pw, height - 0.04, 0.022, SMOKED, -width / 2 + pw / 2 + i * (pw + gap), 0.04, 0.018));
    } else {
      const n = Math.floor(width / 0.055);
      for (let i = 0; i < n; i++) { const x = -width / 2 + 0.03 + i * (width - 0.06) / (n - 1); root.add(box(0.028, height - 0.04, 0.022, SMOKED, x, 0.04, 0.018)); }
    }
    const stripMat = led(ledColour, 3);
    for (const sx of [-1, 1]) { const s = box(0.012, height - 0.3, 0.008, stripMat, sx * (width / 2 - 0.1), 0.15, 0.042); root.add(s); }
    const cove = box(width - 0.2, 0.01, 0.008, stripMat, 0, height - 0.12, 0.042); root.add(cove);
    moods.strips.push(stripMat);
    // TV on a slim mount, with an ambient back-light that washes the slats
    const tv = g();
    tv.add(box(tvW, tvH, 0.028, GRAPH, 0, tvCentreY - tvH / 2, 0.07, 0.004));
    tv.add(box(tvW - 0.012, tvH - 0.012, 0.004, GLASS, 0, tvCentreY - tvH / 2 + 0.006, 0.097));
    loose(tv); root.add(tv);
    const back = new THREE.RectAreaLight(ledColour, 6, tvW * 0.9, tvH * 0.8); back.position.set(0, tvCentreY, 0.066); back.lookAt(0, tvCentreY, -1); root.add(back); moods.glow.push(back);
    // floating console: two push-to-open drawers + open PS5 bay, LED under-glow
    const cy = 0.24, ch = 0.32, cd = 0.38;
    root.add(box(consoleW, ch, cd, WOOD, 0, cy, 0.045, 0.006));
    const bayW = 0.5; root.add(box(bayW, ch - 0.06, 0.012, BLACK, 0, cy + 0.03, 0.045 + cd - 0.01));
    root.add(loose(box(0.39, 0.104, 0.26, IVORY, 0, cy + 0.06, 0.12, 0.02)));                         // PS5 lying flat
    root.add(loose(box(0.395, 0.06, 0.262, BLACK, 0, cy + 0.08, 0.118)));
    const dw = (consoleW - bayW) / 2 - 0.01;
    for (const sx of [-1, 1]) {
      const d = g(); d.add(box(dw - 0.006, ch - 0.02, 0.018, WOOD, 0, cy + 0.01, 0.045 + cd)); d.add(box(dw - 0.06, ch - 0.06, cd - 0.06, OAK, 0, cy + 0.03, 0.08));
      d.position.x = sx * (bayW / 2 + dw / 2 + 0.005); tagGroup(d, { type: 'slide', slide: [0, 0, 0.3], label: 'console drawer' }); root.add(d);
    }
    const under = led(ledColour, 2.2); root.add(box(consoleW - 0.1, 0.008, 0.01, under, 0, cy - 0.01, 0.045 + cd - 0.03)); moods.strips.push(under);
    const floor = new THREE.RectAreaLight(ledColour, 3, consoleW - 0.2, 0.2); floor.position.set(0, cy - 0.02, 0.045 + cd / 2); floor.lookAt(0, -1, 0.045 + cd / 2); root.add(floor); moods.glow.push(floor);
    return { obj: root, moods };
  }

  /* ---------- side-by-side double-door refrigerator (≈ 650 L class, e.g. 912 × 1780 × 716) ---------- */
  // Modelled on a typical Samsung / LG side-by-side: freezer left (≈ 45 % width) with ice maker, 4 shelves and 2 drawers;
  // fresh-food right with 4 spill-proof glass shelves, a deli drawer and a full-width crisper; 4 bins on each door,
  // white liner, grey door gaskets, LED strip under the ceiling. Doors hinge at the outer edges (E / click).
  function fridgeSideBySide({ w = 0.912, h = 1.78, d = 0.716, finish = () => M('Ceramic ivory', 0xe8dcc8), stocked = true } = {}) {
    const root = g(), dd = 0.045, gap = 0.004, lw = w * 0.46 - gap / 2, rw = w - lw - gap, dz = d - dd;
    const t = 0.045, base = 0.1, top = h - 0.05;                       // wall thickness, cavity floor (machine bay below), cavity ceiling
    const split = -w / 2 + lw + gap / 2, mt = 0.03;                   // centre mullion
    const LINER = () => M('__fridge_liner', 0xf3f4f2), GASKET = () => M('__fridge_gasket', 0x6b6e72);
    const clear = new THREE.MeshPhysicalMaterial({ color: 0xe6f2f2, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0, name: '__fridge_glass', depthWrite: false });
    const binM = new THREE.MeshPhysicalMaterial({ color: 0xf6f8f8, transparent: true, opacity: 0.55, roughness: 0.25, name: '__fridge_bin', depthWrite: false });
    const glow = led(0xf4f8ff, 2.2);
    // outer shell (open at the front) + centre mullion
    root.add(box(t, h - 0.01, dz, finish, -w / 2 + t / 2, 0.01, 0));
    root.add(box(t, h - 0.01, dz, finish, w / 2 - t / 2, 0.01, 0));
    root.add(box(w - 2 * t, 0.05, dz, finish, 0, h - 0.05, 0));
    root.add(box(w - 2 * t, base, dz, finish, 0, 0, 0));
    root.add(box(w - 2 * t, h - 0.06, t, finish, 0, 0.01, 0));
    root.add(box(mt, top - base, dz, LINER, split, base, t));
    root.add(box(w - 0.02, 0.07, 0.01, BLACK, 0, 0.005, dz - 0.012));                 // toe-kick grille
    // white liner on the cavity faces
    const cx0 = -w / 2 + t, cx1 = w / 2 - t, cz0 = t, cz1 = dz, ch = top - base;
    root.add(box(cx1 - cx0, ch, 0.004, LINER, 0, base, cz0));                          // back
    root.add(box(0.004, ch, cz1 - cz0, LINER, cx0 + 0.002, base, cz0));
    root.add(box(0.004, ch, cz1 - cz0, LINER, cx1 - 0.002, base, cz0));
    root.add(box(cx1 - cx0, 0.004, cz1 - cz0, LINER, 0, top - 0.004, cz0));
    root.add(box(cx1 - cx0, 0.004, cz1 - cz0, LINER, 0, base, cz0));
    const shelfD = cz1 - cz0 - 0.12;                                                   // leave room for the door bins
    const shelf = (x0, x1, y, wire) => {
      const sw = x1 - x0 - 0.01, sx = (x0 + x1) / 2;
      if (wire) { for (let k = 0; k < 9; k++) root.add(box(0.005, 0.005, shelfD, LINER, sx - sw / 2 + 0.01 + k * (sw - 0.02) / 8, y, cz0 + 0.01)); root.add(box(sw, 0.012, 0.012, LINER, sx, y - 0.004, cz0 + shelfD - 0.002)); }
      else { root.add(box(sw, 0.006, shelfD, clear, sx, y, cz0 + 0.01)); root.add(box(sw, 0.02, 0.012, GRAPH, sx, y - 0.007, cz0 + shelfD)); }   // glass + front trim
      for (const ex of [x0 + 0.004, x1 - 0.012]) root.add(box(0.008, 0.012, shelfD - 0.05, LINER, ex + 0.004, y - 0.012, cz0 + 0.03));   // side rails
    };
    const drawer = (x0, x1, y0, hh, rounded) => {
      const dw = x1 - x0 - 0.016, dx = (x0 + x1) / 2, dD = shelfD - 0.02;
      root.add(box(dw, hh - 0.01, dD - 0.01, binM, dx, y0, cz0 + 0.02));               // translucent bin
      root.add(box(dw, hh, 0.01, binM, dx, y0, cz0 + dD + 0.01));                      // front
      root.add(box(dw * 0.5, 0.02, 0.012, LINER, dx, y0 + hh - 0.035, cz0 + dD + 0.02)); // handle lip
      root.add(box(dw + 0.012, 0.006, dD + 0.02, clear, dx, y0 + hh + 0.004, cz0 + 0.01)); // glass lid
    };
    const fz0 = cx0, fz1 = split - mt / 2, rz0 = split + mt / 2, rz1 = cx1;
    // freezer: ice maker + bucket at top, 3 wire shelves, 2 drawers
    root.add(box(fz1 - fz0 - 0.02, 0.12, shelfD * 0.85, LINER, (fz0 + fz1) / 2, top - 0.16, cz0 + 0.02));
    root.add(box((fz1 - fz0) * 0.7, 0.1, 0.18, binM, (fz0 + fz1) / 2, top - 0.27, cz0 + shelfD - 0.2));
    for (const y of [0.62, 0.92, 1.22]) shelf(fz0, fz1, y, true);
    drawer(fz0, fz1, base + 0.02, 0.2); drawer(fz0, fz1, base + 0.25, 0.2);
    // fresh food: glass shelves, deli drawer, crisper
    for (const y of [0.66, 0.95, 1.22, 1.48]) shelf(rz0, rz1, y, false);
    drawer(rz0, rz1, base + 0.02, 0.32); drawer(rz0, rz1, base + 0.38, 0.1);
    root.add(box(rz1 - rz0 - 0.04, 0.01, 0.02, glow, (rz0 + rz1) / 2, top - 0.02, cz0 + shelfD * 0.6));   // LED strips
    root.add(box(fz1 - fz0 - 0.04, 0.01, 0.02, glow, (fz0 + fz1) / 2, top - 0.02, cz0 + shelfD * 0.9));
    if (stocked) {   // a few groceries so it reads as a fridge, not an empty box
      const c = (col) => M('__food_' + col.toString(16), col);
      const items = [[0.66, 0.06, 0.18, 0.1, 0xd9d4c8], [0.66, 0.08, 0.11, 0.08, 0xc9442f], [0.95, 0.15, 0.08, 0.15, 0x6c8f3c], [0.95, 0.12, 0.12, 0.12, 0xe8c05a],
        [1.22, 0.16, 0.06, 0.12, 0xb7c9d6], [1.48, 0.1, 0.1, 0.18, 0xf0eadc]];
      items.forEach(([y, wd, hh, dp, col], k) => root.add(box(wd, hh, dp, c(col), rz0 + 0.08 + (k % 2) * 0.17, y + 0.006, cz0 + 0.08 + (k % 3) * 0.08, 0.01)));
      for (let k = 0; k < 5; k++) { const ball = cyl(0.04, 0.04, 0.07, c([0xc0392b, 0xe67e22, 0x7fae3e][k % 3]), rz0 + 0.07 + k * 0.07, base + 0.04, cz0 + 0.2, 12); root.add(ball); }
    }
    // doors: outer skin + gasket + inner liner + 4 bins each (bins sit inside the cavity when closed)
    const door = (dw, side, label) => {
      const dG = g(), cxD = side * dw / 2;     // side −1: hinge at the door's right edge (door spans −dw … 0)
      dG.add(box(dw, h - 0.09, dd, finish, cxD, 0.08, 0, 0.006));
      dG.add(box(dw - 0.012, h - 0.1, 0.008, GASKET, cxD, 0.085, -0.008));
      dG.add(box(dw - 0.05, h - 0.17, 0.014, LINER, cxD, 0.12, -0.022));
      const bw = Math.min(dw - 0.1, (side > 0 ? split - mt / 2 - cx0 : cx1 - split - mt / 2) - 0.03);
      for (const y of [0.3, 0.68, 1.06, 1.42]) {
        dG.add(box(bw, 0.012, 0.085, binM, cxD, y, -0.108));
        dG.add(box(bw, 0.075, 0.006, binM, cxD, y, -0.108));
        for (const sx of [-1, 1]) dG.add(box(0.006, 0.075, 0.085, binM, cxD + sx * (bw / 2 - 0.003), y, -0.108));
      }
      if (side < 0 && stocked) for (let k = 0; k < 3; k++) dG.add(cyl(0.032, 0.032, 0.24, M('__food_bottle' + k, [0x2e7d4f, 0xd8e6ee, 0x8a5a2b][k]), cxD - bw / 2 + 0.05 + k * 0.08, 0.31, -0.065, 16));
      return dG;
    };
    const left = door(lw, 1, 'freezer door');
    left.add(box(0.2, 0.3, 0.006, GLASS, lw / 2, 0.95, dd - 0.003, 0.004));          // dispenser recess
    left.add(box(0.12, 0.035, 0.004, GRAPH, lw / 2, 1.3, dd));
    left.add(box(0.018, 0.9, 0.03, GRAPH, lw - 0.03, 0.6, dd, 0.006));
    left.position.set(-w / 2, 0, dz);
    tagGroup(left, { type: 'cab', hinge: [-w / 2, 0, dz], a1: -Math.PI * 0.5, label: 'freezer door' });   // 90° stop: counter beside the hinge
    const right = door(rw, -1, 'fridge door');
    right.add(box(0.018, 0.9, 0.03, GRAPH, -rw + 0.03, 0.6, dd, 0.006));
    right.position.set(w / 2, 0, dz);
    tagGroup(right, { type: 'cab', hinge: [w / 2, 0, dz], a1: Math.PI * 0.5, label: 'fridge door' });
    root.add(left, right);
    return { obj: loose(root) };
  }

  /* ---------- wave-top slatted headboard wall (owner reference, 2026-11-10) ----------
     Vertical oak slats on a matching backing board whose top edge follows a smooth wave, a warm LED strip hidden along
     the top edge and a soft additive halo washing the wall above it. Optional painted wall field behind.
     profile: [[u 0..1 along the wall (local −x → +x), height m], ...] */
  function waveWall({ cove = null, halo: haloOn = true, length = 3.6, profile = [[0, 0.95], [0.15, 1.05], [0.3, 1.3], [0.42, 1.22], [0.55, 1.5], [0.65, 1.95], [0.75, 2.05], [0.85, 1.96], [0.94, 2.1], [1, 2.15]],
    slatW = 0.022, pitch = 0.034, depth = 0.04, wood = () => M('__wave_honey_oak', 0xc79a64), backing = () => M('__wave_oak_shadow', 0x8a6440), paint = null, glow = 0xffbf6e } = {}) {
    const root = g(), moods = { strips: [] }, x0 = -length / 2;
    const curve = new THREE.SplineCurve(profile.map(([u, h]) => new THREE.Vector2(u, h)));
    const pts = curve.getSpacedPoints(600);
    const hAt = u => { let lo = 0, hi = pts.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m].x < u) lo = m; else hi = m; } const a = pts[lo], b = pts[hi], t = (u - a.x) / ((b.x - a.x) || 1); return a.y + (b.y - a.y) * Math.min(1, Math.max(0, t)); };
    if (paint) root.add(box(paint.to - paint.from, paint.h || 2.88, 0.004, paint.mat || (() => M('__mb_beige_paint', paint.colour || 0xd6c4aa)), (paint.from + paint.to) / 2, 0, 0));
    // dark backing with the wave top (reads as the shadow gaps between slats)
    const shape = new THREE.Shape(); shape.moveTo(x0, 0); shape.lineTo(x0 + length, 0);
    for (let k = pts.length - 1; k >= 0; k--) shape.lineTo(x0 + pts[k].x * length, pts[k].y - 0.012);
    shape.closePath();
    const back = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false, curveSegments: 2 }), backing()); back.position.z = 0.004; root.add(back);
    // slats: each top is cut along the curve, so the edge reads as one smooth wave (no steps)
    const woodM = typeof wood === 'function' ? wood() : wood;
    const n = Math.floor((length - slatW) / pitch) + 1, off = (length - (n - 1) * pitch - slatW) / 2;
    for (let i = 0; i < n; i++) {
      const xa = x0 + off + i * pitch, xb = xa + slatW, sh = new THREE.Shape();
      sh.moveTo(xa, 0); sh.lineTo(xb, 0); sh.lineTo(xb, hAt((xb - x0) / length)); sh.lineTo(xa, hAt((xa - x0) / length)); sh.closePath();
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: depth - 0.016, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 1 }), woodM);
      m.position.z = 0.016; root.add(m);
    }
    // glowing edge: LED line along the top edge + strong warm halo on the wall above it
    const ledM = led(glow, 4.5); moods.strips.push(ledM);
    const path = new THREE.CatmullRomCurve3(pts.filter((_, k) => k % 6 === 0).map(p => new THREE.Vector3(x0 + p.x * length, p.y + 0.004, 0.02)));
    root.add(new THREE.Mesh(new THREE.TubeGeometry(path, 300, 0.005, 6, false), ledM));
    const haloH = 0.28, seg = 240, pos = [], col = [], idx = [], c = new THREE.Color(glow);
    for (let k = 0; k <= seg; k++) {
      const u = k / seg, h = hAt(u), x = x0 + u * length, edge = Math.min(1, Math.min(u, 1 - u) * 30);
      pos.push(x, h - 0.02, 0.006, x, h + haloH * 0.25, 0.006, x, h + haloH, 0.006);
      col.push(c.r, c.g, c.b, 0.8 * edge, c.r, c.g, c.b, 0.22 * edge, c.r, c.g, c.b, 0);
      if (k < seg) { const a = k * 3; idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
    }
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); hg.setIndex(idx);
    const halo = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, name: '__wave_halo', toneMapped: false }));
    halo.castShadow = false; if (haloOn) root.add(halo);
    if (cove) {   // ceiling cove: warm LED line where the wall meets the ceiling + a soft wash down the wall
      const cl = led(glow, 3.2); moods.strips.push(cl);
      root.add(box(cove.to - cove.from, 0.012, 0.03, cl, (cove.from + cove.to) / 2, cove.y - 0.012, 0.01));
      const wp = [], wc = [], wi = [], segs = 2;
      for (const [k, x] of [cove.from, cove.to].entries()) { wp.push(x, cove.y, 0.007, x, cove.y - 0.45, 0.007); wc.push(c.r, c.g, c.b, 0.55, c.r, c.g, c.b, 0); }
      wi.push(0, 1, 2, 1, 3, 2);
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(wc, 4)); wg.setIndex(wi);
      root.add(new THREE.Mesh(wg, halo.material));
    }
    return { obj: root, moods };
  }

  /* ---------- chevron (herringbone-look) flat-weave rug, cream on beige ---------- */
  function chevronRug({ w = 2.0, l = 2.6, base = '#e4d8c4', line = '#cdbfa8' } = {}) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const x = cv.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, 512, 512); x.strokeStyle = line; x.lineWidth = 9;
    for (let r = -1; r < 18; r++) { x.beginPath(); for (let k = 0; k <= 8; k++) x.lineTo(k * 64, r * 32 + (k % 2 ? 16 : -16)); x.stroke(); }
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(w / 0.5, l / 0.5); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, name: '__chevron_rug' });
    const root = g();
    const rug = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, l), mat); rug.position.set(0, 0.006, l / 2); rug.receiveShadow = true; root.add(rug);
    return { obj: loose(root) };
  }

  /* ---------- upholstered king bed with a tall tufted headboard (owner reference: dusty mauve, cream bedding,
     lavender throw, sage cushions). Local frame: headboard back on the wall (z 0), foot towards +z. ---------- */
  function upholsteredBed({ fabricColour = 0x8f8378, mattressW = 1.829, mattressL = 2.134, hbH = 1.3, fabric = () => M('__bed_upholstery_' + fabricColour.toString(16), fabricColour), legs = () => M('__matte_black', 0x141414),
    duvet = () => M('__cream_duvet', 0xeee5d6), throwM = () => M('__lavender_throw', 0xa48bb8), accent = () => M('__sage_cushion', 0x8a9a6c) } = {}) {
    const root = g(), w = mattressW + 0.12, hbD = 0.1, frameL = mattressL + 0.06, frameH = 0.3, fy = 0.1;
    // headboard: base panel + quilted pads (square tufting)
    if (hbH > 0.8) root.add(box(w, hbH - 0.02, hbD - 0.03, fabric, 0, 0.02, 0, 0.02));
    const cols = 7, rows = hbH > 0.8 ? 3 : 0, top = hbH - 0.04, bot = 0.62, pw = (w - 0.08) / cols, ph = (top - bot) / Math.max(1, rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) root.add(box(pw - 0.012, ph - 0.012, 0.05, fabric, -w / 2 + 0.04 + pw * (c + 0.5), bot + r * ph + 0.006, hbD - 0.04, 0.022));
    // platform frame on slim black legs
    root.add(box(w, frameH, frameL, fabric, 0, fy, hbD, 0.03));
    for (const sx of [-1, 1]) for (const zz of [hbD + 0.08, hbD + frameL - 0.08]) root.add(cyl(0.018, 0.014, fy, legs, sx * (w / 2 - 0.08), 0, zz, 10));
    // bedding (bedding() puts the head at +z: turn it round)
    const b = bedding({ w: mattressW, l: mattressL, top: fy + frameH + 0.2, duvet, sheet: IVORY, accent, throwM, upright: true });
    b.obj.rotation.y = Math.PI; b.obj.position.z = hbD + 0.03 + mattressL / 2; root.add(b.obj);
    return { obj: root, size: { w, l: hbD + frameL } };
  }

  /* =====================  OPTION 3 builders (master bedroom, 2026-11-10)  ===================== */
  const CHAR = () => M('__charcoal_matte', 0x2b2a29), CHARL = () => M('__charcoal_lacquer', 0x34322f), FELT = () => M('__black_felt', 0x151515);
  const OATL = () => M('__oatmeal_lacquer', 0xd9cdb9), PS5W = () => M('__ps5_white', 0xf1f1ef), PS5B = () => M('__ps5_black', 0x0d0d0f), SILVER = () => M('__appliance_silver', 0xb9bcc0);
  const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
  // physical materials for the consoles (gloss / matte plastics), cached by name
  const PMc = new Map(), PM = (name, o) => { if (!PMc.has(name)) PMc.set(name, new THREE.MeshPhysicalMaterial({ name, ...o })); return PMc.get(name); };
  const rrShape = (w, h, r, cx = 0, cy = 0, path) => { const s = path || new THREE.Shape(), x0 = cx - w / 2, y0 = cy - h / 2; s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.absarc(x0 + w - r, y0 + r, r, -Math.PI / 2, 0, false); s.lineTo(x0 + w, y0 + h - r); s.absarc(x0 + w - r, y0 + h - r, r, 0, Math.PI / 2, false); s.lineTo(x0 + r, y0 + h); s.absarc(x0 + r, y0 + h - r, r, Math.PI / 2, Math.PI, false); s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false); return s; };
  const faceZ = (m, z) => { m.rotation.x = Math.PI / 2; m.position.z = z; return m; };            // cylinder axis → +z (buttons, sticks)
  // PS5 Slim with disc drive, standing vertically on its round stand: 358 H × 96 W × 216 D mm (Sony spec).
  // Real build: gloss-black core with a 'fin' profile showing front and back, two white side covers each split into a
  // GLOSSY upper part and a MATTE lower part (≈ 3 mm seam), soft rounded edges, white light bar in the front gap,
  // disc slot + eject / power + USB-C ×2 on the front, vent slots on top.
  function ps5Slim() {
    const r = g(), H = 0.358, W = 0.096, D = 0.216, base = 0.014;
    const gloss = PM('__ps5_gloss_white', { color: 0xf3f3f1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06 });
    const matte = PM('__ps5_matte_white', { color: 0xe9e9e6, roughness: 0.68 });
    const core = PM('__ps5_core_black', { color: 0x0a0a0c, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2 });
    const port = PM('__ps5_port', { color: 0x020202, roughness: 0.8 });
    r.add(cyl(0.052, 0.056, 0.008, core, 0, 0, D / 2, 40)); r.add(cyl(0.02, 0.02, base - 0.008, core, 0, 0.008, D / 2, 20));   // round stand + screw post
    r.add(box(W - 0.036, H, D - 0.006, core, 0, base, 0.003, 0.006));                               // core / fin
    const cover = (y0, h, m, sx) => {                                                             // side cover: rounded side profile, bevelled edges
      const sh = rrShape(D - 0.004, h, Math.min(0.016, h / 2.5), D / 2, y0 + h / 2);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 4, curveSegments: 10 });
      const mesh = new THREE.Mesh(geo, m); mesh.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; mesh.position.x = sx * (W / 2 - 0.005); return mesh;
    };
    for (const sx of [-1, 1]) { r.add(cover(base + H * 0.385, H * 0.615 - 0.006, gloss, sx)); r.add(cover(base + 0.004, H * 0.38 - 0.006, matte, sx)); }
    const lb = led(0xf2f6ff, 1.6); r.add(box(0.004, H * 0.5, 0.002, lb, 0, base + H * 0.44, D - 0.001));    // light bar
    r.add(box(0.003, 0.125, 0.002, port, 0.012, base + 0.03, D - 0.0005));                         // disc slot (lower front)
    for (const [y, w2] of [[0.018, 0.009], [0.032, 0.009]]) r.add(box(w2, 0.003, 0.002, port, -0.014, base + y, D - 0.0005));   // USB-C ×2
    r.add(box(0.012, 0.004, 0.002, port, -0.014, base + 0.165, D - 0.0005)); r.add(box(0.012, 0.004, 0.002, port, -0.014, base + 0.185, D - 0.0005));   // power / eject
    for (let k = 0; k < 9; k++) r.add(box(W - 0.05, 0.002, 0.004, port, 0, base + H - 0.0015, 0.03 + k * 0.019));   // top vents
    return loose(r);
  }
  // DualSense (160 × 66 × 106 mm): pillowy white shell with grips, black centre with two sticks + PS button, white
  // touchpad edged by the light bar, D-pad and face buttons on the wings. Built STANDING as it sits in the charging
  // station: trigger edge down (y 0), grips up, face towards +z.
  function dualSense({ bar = 0x3a6bff } = {}) {
    const real = dualSenseModel(bar); if (real) return real;
    const c = g();
    const white = PM('__dualsense_white', { color: 0xf1f1ef, roughness: 0.42, clearcoat: 0.3 }), black = PM('__dualsense_black', { color: 0x111113, roughness: 0.55 });
    const grey = PM('__dualsense_grey', { color: 0x3a3a3e, roughness: 0.4 });
    const half = [[0, 0.003], [0.03, 0.002], [0.055, 0.004], [0.07, 0.012], [0.078, 0.032], [0.08, 0.06], [0.077, 0.086], [0.069, 0.103], [0.055, 0.106], [0.045, 0.096], [0.038, 0.077], [0.026, 0.067], [0.0, 0.065]];
    const ring = [...half.map(([x, y]) => new THREE.Vector2(x, y)), ...half.slice(1, -1).reverse().map(([x, y]) => new THREE.Vector2(-x, y))];
    const sh = new THREE.Shape(); sh.moveTo(ring[0].x, ring[0].y); sh.splineThru([...ring.slice(1), ring[0]]);
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.026, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.008, bevelSegments: 5, curveSegments: 48 }), white);
    body.position.z = 0.014; c.add(body);
    const fz = 0.014 + 0.026 + 0.014 + 0.0005;                                                     // shell face (extrude + bevel) + 0.5 mm: parts sit ON it (no z-fighting)
    const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(rrShape(0.074, 0.03, 0.013, 0, 0.056), { depth: 0.003, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 1 }), black); plate.position.z = fz - 0.002; c.add(plate);
    const pad = new THREE.Mesh(new THREE.ExtrudeGeometry(rrShape(0.058, 0.036, 0.006, 0, 0.024), { depth: 0.004, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.0015, bevelSegments: 2 }), white); pad.position.z = fz - 0.001; c.add(pad);
    const lbm = led(bar, 2.2); for (const sx of [-1, 1]) c.add(box(0.003, 0.032, 0.003, lbm, sx * 0.031, 0.009, fz - 0.001));
    for (const sx of [-1, 1]) {                                                                   // thumbsticks: base, stem, concave cap
      for (const [r1, h1, z1, sg] of [[0.011, 0.004, fz + 0.002, 28], [0.004, 0.01, fz + 0.008, 12]]) { const m1 = faceZ(cyl(r1, r1, h1, black, sx * 0.022, 0, 0, sg), z1); m1.position.y = 0.058; c.add(m1); }
      const cap = faceZ(cyl(0.0095, 0.009, 0.004, black, sx * 0.022, 0, 0, 28), fz + 0.014); cap.position.y = 0.058; c.add(cap);
      c.add(box(0.03, 0.006, 0.024, black, sx * 0.05, -0.004, 0.018, 0.002));                      // L1/R1 + triggers on the bottom edge
    }
    const ps = faceZ(cyl(0.0045, 0.0045, 0.003, grey, 0, 0, 0, 20), fz + 0.001); ps.position.y = 0.068; c.add(ps);
    for (const [dx, dy, w2, h2] of [[0, 0, 0.007, 0.022], [0, 0, 0.022, 0.007]]) c.add(box(w2, h2, 0.004, grey, -0.05 + dx, 0.024 + dy, fz - 0.003, 0.001));   // D-pad
    for (const [dx, dy] of [[0, 0.01], [0, -0.01], [0.01, 0], [-0.01, 0]]) { const b2 = faceZ(cyl(0.0045, 0.0045, 0.004, grey, 0.05 + dx, 0, 0, 16), fz - 0.001); b2.position.y = 0.035 + dy; c.add(b2); }
    return c;
  }
  // owner model (2026-11-11): 'Ps5' by KIARASH 3D (sketchfab.com/kiarash8585, CC BY 4.0 — credit the author) = a real DualSense,
  // baked lying flat at its real 160 mm width (manifest 'ps5_dualsense'). Stood up into dualSense()'s frame: trigger edge down
  // (y 0), grips up, face +z, back at z 0, centred on x. Its light bar used KHR transmission (extra render pass) → LED material.
  function dualSenseModel(bar) {
    const m = model('ps5_dualsense'); if (!m) return null;
    const lb = led(bar, 2.2), inner = m.obj, c = g();
    inner.traverse(o => { if (o.isMesh && /VRayMtl52/.test(o.material.name)) o.material = lb; });
    inner.rotation.x = Math.PI / 2;
    c.add(inner); c.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(inner);
    inner.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, -b.min.z);
    c.name = 'DualSense (KIARASH 3D, CC BY 4.0)';
    return c;
  }
  // DualSense charging station (Sony: ≈ 116 × 52 × 79 mm) — white curved base, black top, two controllers standing in it
  function dualSenseDock() {
    const r = g(), white = PM('__dualsense_white', { color: 0xf1f1ef, roughness: 0.42, clearcoat: 0.3 }), black = PM('__dualsense_black', { color: 0x111113, roughness: 0.55 });
    r.add(box(0.116, 0.042, 0.079, white, 0, 0, 0, 0.018)); r.add(box(0.1, 0.01, 0.064, black, 0, 0.04, 0.008, 0.004));
    for (const sx of [-1, 1]) { const c = dualSense(); c.position.set(sx * 0.082, 0.046, 0.0); c.rotation.x = -0.1; r.add(c); }
    return loose(r);
  }
  // 55″ TV now (1232 × 711 × 25), wall ready for 80″ (1790 × 1030); sync LEDs on its back edges light the backdrop
  function tvSet({ inch = 55 } = {}) {
    const r = g(), w = inch * 0.0254 * 0.8716, h = inch * 0.0254 * 0.4903, d = 0.025;
    r.add(box(0.4, 0.3, 0.06, PS5B, 0, -0.15, 0));                                                // articulating mount
    r.add(box(w, h, d, GLASS, 0, -h / 2, 0.06, 0.004));
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x050505, toneMapped: false, name: '__tv_screen' });
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.012, h - 0.012), screenMat); sc.position.set(0, 0, 0.06 + d + 0.0015); r.add(sc);
    const sync = { left: led(0x6a5cff, 3), right: led(0x6a5cff, 3), top: led(0x6a5cff, 3), bottom: led(0x6a5cff, 3) };
    r.add(box(0.01, h - 0.06, 0.01, sync.left, -w / 2 + 0.03, -h / 2 + 0.03, 0.05)); r.add(box(0.01, h - 0.06, 0.01, sync.right, w / 2 - 0.03, -h / 2 + 0.03, 0.05));
    r.add(box(w - 0.06, 0.01, 0.01, sync.top, 0, h / 2 - 0.04, 0.05)); r.add(box(w - 0.06, 0.01, 0.01, sync.bottom, 0, -h / 2 + 0.03, 0.05));
    return { obj: r, screenMat, sync, w, h };
  }
  /* gaming media wall on the north wall, origin = west end of the wall, back on the wall, +x east, +z into the room */
  function gamingWall({ backdrop = 'acoustic', roomW = 3.658, ceiling = 2.85, deepTo = 2.45, tall = 0.62, tvCx = 1.55, tvCy = 1.3, tvInch = 55, leafFrom = 2.70, leafTop = 2.32 } = {}) {
    // DOOR-LEAF ZONE (owner 2026-11-10: "wall designs are coming through the door"): the open entry-door leaf rests 0–50 mm
    // off this wall for x ≥ leafFrom (leaf tip 2.75) up to leafTop (door 2.29 m). Below leafTop nothing there may stand
    // proud of the wall by more than SKIN (a flat 4 mm finish lies inside the leaf's thickness, invisible when it is open).
    const SKIN = 0.004;
    const root = g(), moods = { strips: [], glow: [], halos: [], accent: [] }, t = 0.018;
    const syncAll = [];
    const GREEN = backdrop === 'green-arch', WABI = backdrop === 'wabi', FRAME = backdrop === 'sculpted-frame', PEACH = backdrop === 'peach-arch', NEON = backdrop === 'neon-play';
    // owner 2026-11-10: these three designs are built 'as the reference' and drop the mini-fridge + pull-out desk (only these)
    const STUDY = backdrop === 'beige-wave-study', SAGE = backdrop === 'sage-wave' || backdrop === 'beige-wave' || STUDY, BEIGEWAVE = backdrop === 'beige-wave' || STUDY, COT = backdrop === 'cottage', BELLS = backdrop === 'brass-bells', MID = backdrop === 'mid-century' || backdrop === 'mid-century-storage', MIDS = backdrop === 'mid-century-storage', WAVE = backdrop === 'wave-desk', PILL = backdrop === 'pill-tower', HER = backdrop === 'heritage', CHO = backdrop === 'charcoal-oak', SLATE = backdrop === 'slate-slats', NOTALL = SAGE || COT || BELLS || MID || WAVE || PILL || HER || CHO || SLATE;
    if (SLATE) { tvCx = 1.33; tvCy = 1.35; }   // reference: TV on the slate, its right edge at the slats; an 80″ (0.44–2.23) clears the left shelves (≤ 0.42)
    if (CHO) { tvCx = 1.2; tvCy = 1.35; }   // reference: TV left of centre; an 80″ (0.31–2.09) still clears the small shelves (x ≥ 2.12)
    if (HER) { tvCx = 1.68; tvCy = 1.38; }   // reference: TV right of the shelves; an 80″ (0.79–2.58) still clears them
    if (WAVE) { tvCx = 1.35; tvCy = 1.42; }
    if (PILL) { tvCx = 1.72; tvCy = 1.2; }    // reference: TV right of the shelf tower, low over the console; an 80″ (1.79 m) still clears the tower (x ≥ 0.83)   // reference: TV left of the wave, higher so the wave clears up to an 80″ screen
    const GRN = () => M('__forest_green_lacquer', 0x2e4a3a), CRM = () => M('__cream_lacquer', 0xe9e1cf);
    const PCH = () => M('__peach_lacquer', 0xd9a189), PFL = () => M('__peach_flute', 0xcd937a), PWALL = () => M('__peach_wall', 0xdca58c), PLAS = () => M('__cream_plaster', 0xf1e6d6);
    const NGR = () => M('__warm_grey_lacquer', 0x57534f), NGRD = () => M('__warm_grey_dark', 0x45423f);
    const UNIT = GREEN ? GRN : WABI ? CRM : FRAME ? OAK : PEACH ? PCH : NEON ? NGR : CHARL;
    const MICRO = () => M('__microcement_warm', 0xb7aa98), WABIW = () => M('__wabi_wall_cream', 0xeee5d8);
    // ---- tall unit: vented mini-fridge bay · pull-out desk niche · storage ----
    const TD = 0.6, x0 = 0, xc = tall / 2;
    if (!NOTALL) {
    root.add(box(t, ceiling, TD, UNIT, x0 + t / 2, 0, 0)); root.add(box(t, ceiling, TD, UNIT, tall - t / 2, 0, 0));
    root.add(box(tall, t, TD, UNIT, xc, ceiling - t, 0)); root.add(box(tall - 2 * t, ceiling, 0.012, UNIT, xc, 0, 0));
    root.add(box(tall - 2 * t, 0.06, TD - 0.06, PS5B, xc, 0, 0));                                  // plinth (intake slots behind the front)
    for (let k = 0; k < 7; k++) root.add(box(0.05, 0.01, 0.004, PS5B, xc - 0.21 + k * 0.07, 0.025, TD - 0.06));
    root.add(loose(box(0.47, 0.51, 0.5, SILVER, xc, 0.07, 0.05, 0.01)));                            // ~50 L mini fridge 470×510×500, 50 mm rear chimney
    root.add(box(0.44, 0.47, 0.004, PS5B, xc, 0.09, 0.55));
    root.add(box(tall - 2 * t, t, TD - 0.06, UNIT, xc, 0.62, 0.06));                              // shelf stops 60 mm short: hot air rises behind
    const fd = g();                                                                                 // slatted breathing door
    // corner unit: doors hinge on the EAST edge so they swing away from the west wall cladding
    fd.add(box(tall - 0.006, 0.55, 0.012, UNIT, -(tall - 0.006) / 2, 0.065, 0));
    for (let k = 0; k < 9; k++) fd.add(box(0.03, 0.5, 0.012, PEACH ? PFL : NEON ? NGRD : WOOD, -(0.05 + k * 0.064), 0.09, 0.012));
    fd.position.set(tall - 0.003, 0, TD); tagGroup(fd, { type: 'cab', hinge: [tall - 0.003, 0, TD], a1: Math.PI * 0.5, label: 'mini-fridge cabinet' }); root.add(fd);
    // desk niche: lit, sockets, pull-out desktop at 745 mm
    const nl = led(0xffd9a8, 2.2); moods.strips.push(nl); root.add(box(tall - 0.06, 0.01, 0.02, nl, xc, 1.205, 0.04));
    root.add(box(0.14, 0.08, 0.008, PS5W, xc, 0.95, 0.012)); root.add(box(0.14, 0.08, 0.008, PS5W, xc - 0.16, 0.95, 0.012));
    // desktop 520 mm wide: clears the 41 mm linen wainscot on the west wall when pulled out
    const desk = g(); desk.add(box(tall - 0.1, 0.025, 0.52, WOOD, xc + 0.02, 0.72, 0.06, 0.004)); desk.add(box(tall - 0.1, 0.05, 0.02, UNIT, xc + 0.02, 0.695, 0.58));
    desk.add(loose(box(0.31, 0.016, 0.22, SILVER, xc, 0.745, 0.2, 0.004)));                          // laptop kept on the desk
    tagGroup(desk, { type: 'slide', slide: [0, 0, 0.42], label: 'pull-out desk' }); root.add(desk);
    root.add(box(tall - 2 * t, t, TD, UNIT, xc, 1.24, 0));
    if (!GREEN && !WABI && !FRAME && !NEON) {
    const ud = g(); ud.add(box(tall - 0.006, ceiling - 1.27, 0.018, UNIT, -(tall - 0.006) / 2, 1.262, 0)); ud.add(box(0.012, 0.5, 0.02, BRASS, -(tall - 0.05), 1.5, 0.018));
    if (PEACH) for (let k = 0; k < 9; k++) ud.add(box(0.03, ceiling - 1.34, 0.012, PFL, -(0.05 + k * 0.064), 1.3, 0.018));   // reference: fluted peach panel
    ud.position.set(tall - 0.003, 0, TD); tagGroup(ud, { type: 'cab', hinge: [tall - 0.003, 0, TD], a1: Math.PI * 0.5, label: 'tall cupboard' }); root.add(ud);
    root.add(box(tall - 2 * t, t, TD - 0.02, UNIT, xc, 1.95, 0));
    } else if (GREEN) {   // reference: open arched display niche with lit shelves for collectibles
      const ap = new THREE.Shape(); ap.moveTo(0, 1.25); ap.lineTo(tall, 1.25); ap.lineTo(tall, ceiling); ap.lineTo(0, ceiling); ap.lineTo(0, 1.25);
      const nw = tall - 0.12, ny0 = 1.32, ny1 = ceiling - 0.12, hole = new THREE.Path(); hole.moveTo(xc - nw / 2, ny0); hole.lineTo(xc + nw / 2, ny0); hole.lineTo(xc + nw / 2, ny1 - nw / 2); hole.absarc(xc, ny1 - nw / 2, nw / 2, 0, Math.PI, false); hole.lineTo(xc - nw / 2, ny0); ap.holes.push(hole);
      const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(ap, { depth: 0.02, bevelEnabled: false, curveSegments: 20 }), UNIT()); fr.position.z = TD - 0.02; root.add(fr);
      const nled = led(0xffc880, 2.4); moods.strips.push(nled); const archPts = hole.getPoints(40).filter(p => p.y > ny0 + 0.02).map(p => new THREE.Vector3(p.x, p.y - 0.01, TD - 0.03));
      root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts), 60, 0.005, 6, false), nled));
      for (const sy of [1.7, 2.1]) { root.add(box(nw, 0.022, TD - 0.06, OAK, xc, sy, 0.03)); const sl = led(0xffc880, 2); moods.strips.push(sl); root.add(box(nw - 0.04, 0.006, 0.01, sl, xc, sy - 0.006, TD - 0.1)); }
      const fig = (x, y, c, h) => { const f = g(); f.add(cyl(0.03, 0.035, h * 0.6, () => M('__fig_' + c.toString(16), c), 0, 0, 0, 14)); f.add(new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10), M('__fig_' + c.toString(16), c))); f.children[1].position.y = h * 0.6 + 0.03; f.position.set(x, y, 0.3); root.add(loose(f)); };
      fig(xc - 0.12, 1.722, 0x2b2b2e, 0.16); fig(xc + 0.1, 1.722, 0xe8e2d6, 0.14); fig(xc, 2.122, 0xc7462f, 0.12);
      root.add(loose(box(0.12, 0.17, 0.12, () => M('__helmet_dark', 0x222226), xc, 1.36, 0.25, 0.04)));
    } else if (WABI) {    // glass-door display cabinet: rounded-top glass doors in a cream frame, lit oak shelves inside
      root.add(box(tall - 2 * t, ceiling - 1.26, 0.012, OAK, xc, 1.26, 0.012));
      for (const sy of [1.62, 1.98, 2.34]) { root.add(box(tall - 2 * t, 0.018, TD - 0.08, OAK, xc, sy, 0.02)); const sl = led(0xffc880, 2.2); moods.strips.push(sl); root.add(box(tall - 0.08, 0.006, 0.01, sl, xc, sy - 0.006, TD - 0.12)); }
      const glass = new THREE.MeshPhysicalMaterial({ color: 0xe8eef0, transparent: true, opacity: 0.18, roughness: 0.05, name: '__cabinet_glass', depthWrite: false });
      for (const sx of [-1, 1]) { const dw2 = tall / 2 - 0.01, dr2 = g(), y0 = 1.28, y1 = ceiling - 0.04, rr = dw2 / 2;
        const fr = new THREE.Shape(); fr.moveTo(0, y0); fr.lineTo(dw2, y0); fr.lineTo(dw2, y1 - rr); fr.absarc(dw2 / 2, y1 - rr, dw2 / 2, 0, Math.PI, false); fr.lineTo(0, y0);
        const ih = new THREE.Path(), iw = dw2 - 0.08; ih.moveTo(0.04, y0 + 0.05); ih.lineTo(0.04 + iw, y0 + 0.05); ih.lineTo(0.04 + iw, y1 - rr); ih.absarc(dw2 / 2, y1 - rr, iw / 2, 0, Math.PI, false); ih.lineTo(0.04, y0 + 0.05); fr.holes.push(ih);
        const fm = new THREE.Mesh(new THREE.ExtrudeGeometry(fr, { depth: 0.02, bevelEnabled: false, curveSegments: 20 }), CRM()); const gm = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(ih.getPoints(30)), 20), glass); gm.position.z = 0.01;
        fm.position.x = sx > 0 ? -dw2 : 0; gm.position.x = fm.position.x; dr2.add(fm, gm); dr2.position.set(sx > 0 ? tall - 0.003 : 0.003, 0, TD);   // leaves extend inwards from their hinges
        tagGroup(dr2, { type: 'cab', hinge: [sx > 0 ? tall - 0.003 : 0.003, 0, TD], a1: sx > 0 ? Math.PI * 0.5 : -Math.PI * 0.5, label: 'display cabinet' }); root.add(dr2); }
      for (const [x, y, c] of [[xc - 0.12, 1.64, 0xd8c8b2], [xc + 0.1, 1.64, 0x8a6a52], [xc, 2.0, 0xe9e1d4], [xc - 0.1, 2.36, 0xb8a58c]]) root.add(loose(cyl(0.045, 0.06, 0.16, () => M('__ceramic_' + c.toString(16), c), x, y, 0.28, 18)));
    } else if (NEON) {    // reference: tall slot of open shelves lit electric blue (collectibles), warm-grey carcass
      root.add(box(tall - 2 * t, ceiling - 1.26, 0.012, () => M('__niche_navy', 0x1a2142), xc, 1.26, 0.012));
      for (const sy of [1.62, 1.98, 2.34]) root.add(box(tall - 2 * t, 0.018, TD - 0.06, NGR, xc, sy, 0.02));
      for (const sy of [1.62, 1.98, 2.34, ceiling - t]) { const bl = led(0x2f55ff, 2.8); moods.accent.push(bl); root.add(box(tall - 0.08, 0.006, 0.01, bl, xc, sy - 0.007, TD - 0.1)); }
      const droid = g(); droid.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 16), M('__droid_white', 0xeeeae2))); droid.children[0].position.y = 0.07;
      droid.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M('__droid_white', 0xeeeae2))); droid.children[1].position.y = 0.145;
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 8, 32), M('__droid_orange', 0xd8662a)); band.rotation.x = Math.PI / 2; band.position.y = 0.07; droid.add(band);
      droid.position.set(xc, 1.26 + t, 0.3); root.add(loose(droid));
      root.add(loose(box(0.12, 0.17, 0.12, () => M('__helmet_dark', 0x222226), xc - 0.1, 1.62 + 0.018, 0.25, 0.04)));
      root.add(loose(box(0.1, 0.13, 0.08, () => M('__plush_red', 0x9b2e2a), xc + 0.12, 1.98 + 0.018, 0.25, 0.03)));
      for (let k = 0; k < 5; k++) root.add(loose(box(0.024, 0.2, 0.15, () => M('__game_case_' + k, [0x1f4fd8, 0x111111, 0x1f4fd8, 0xd8d8d8, 0x2b2b2b][k]), xc - 0.08 + k * 0.03, 2.34 + 0.018, 0.12)));
    } else {              // FRAME: open oak cubby tower with vases and books
      root.add(box(tall - 2 * t, ceiling - 1.26, 0.012, OAK, xc, 1.26, 0.012));
      for (const sy of [1.26, 1.62, 1.98, 2.34]) root.add(box(tall - 2 * t, 0.022, TD - 0.04, OAK, xc, sy, 0.02));
      for (const [y0, side] of [[1.26, 1], [1.62, -1], [1.98, 1], [2.34, -1]]) root.add(box(0.022, 0.36, TD - 0.04, OAK, xc + side * 0.06, y0, 0.02));
      for (const [x, y, c, h2] of [[xc - 0.14, 1.282, 0xe6e0d6, 0.2], [xc + 0.15, 1.282, 0xd8cdbd, 0.16], [xc - 0.15, 1.642, 0xcfc4b3, 0.18], [xc + 0.14, 2.002, 0xe8e2d8, 0.15], [xc - 0.15, 2.362, 0xd2c7b6, 0.17]]) root.add(loose(cyl(0.045, 0.055, h2, () => M('__vase_' + c.toString(16), c), x, y, 0.3, 18)));
      for (let k = 0; k < 6; k++) root.add(loose(box(0.026, 0.24, 0.17, () => M('__book_frame_' + k, [0x2d2d2d, 0xe9e4da, 0x7a5a42, 0xb33a2e, 0x3b4a5e, 0xd6c2a3][k]), xc + 0.04 + k * 0.03, 2.002, 0.12)));
    }
    }   // end tall unit
    // ---- shared decor helpers for the reference-built designs (sage-wave / cottage / brass-bells) ----
    const TEAK = () => M('__teak_honey', 0x9c6640), LEAF = () => M('__leaf_green', 0x5f7d3e), LEAF2 = () => M('__leaf_green_light', 0x86a35a);
    const caneMat = () => new THREE.MeshStandardMaterial({ roughness: 0.75, name: '__cane_webbing', map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#d9bf8f'; x.fillRect(0, 0, w, h);
      const s3 = 16; x.fillStyle = '#5a4630'; for (let r = 0; r < h / s3 + 1; r++) for (let c = 0; c < w / s3 + 1; c++) { x.beginPath(); x.arc(c * s3 + (r % 2) * s3 / 2, r * s3, 4.2, 0, 7); x.fill(); }
      x.strokeStyle = 'rgba(150,110,60,0.55)'; x.lineWidth = 1.5; for (let k = -h; k < w; k += 8) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + h, h); x.stroke(); x.beginPath(); x.moveTo(k + h, 0); x.lineTo(k, h); x.stroke(); } }) });
    const potPlant = (h = 0.3, pot = 0xe9e1d2, r = 0.06) => { const p2 = g(); p2.add(cyl(r, r * 0.8, r * 1.5, () => M('__pot_' + pot.toString(16), pot), 0, 0, 0, 20));
      for (let k = 0; k < 14; k++) { const a = k * 2.39, rr2 = 0.02 + (k % 4) * 0.012, lf = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 8, 6), (k % 3 ? LEAF : LEAF2)()); lf.scale.set(1, 0.4, 0.6); lf.rotation.set(0.4 * Math.sin(k), a, 0.5 * Math.cos(k)); lf.position.set(Math.cos(a) * rr2 * (h / 0.3), r * 1.5 + (k / 14) * h * 0.8, Math.sin(a) * rr2 * (h / 0.3)); p2.add(lf); }
      return loose(p2); };
    const vine = (len, seed = 1) => { const v = g(); for (let k = 0; k < Math.round(len / 0.035); k++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), (k % 2 ? LEAF : LEAF2)()); lf.scale.set(1, 0.35, 0.8); lf.rotation.z = Math.sin(k * 1.7 + seed); lf.position.set(Math.sin(k * 0.45 + seed) * 0.035, -k * 0.035, 0.02 + Math.cos(k * 0.6 + seed) * 0.015); v.add(lf); } return loose(v); };
    const teddy = (s = 1, col = 0xb07a45) => { const b = g(), fm = () => M('__teddy_' + col.toString(16), col); const body = new THREE.Mesh(new THREE.SphereGeometry(0.035 * s, 16, 12), fm()); body.scale.y = 1.15; body.position.y = 0.04 * s; b.add(body);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.028 * s, 16, 12), fm()); hd.position.y = 0.1 * s; b.add(hd); for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.01 * s, 10, 8), fm()); e.position.set(sx * 0.02 * s, 0.125 * s, 0); b.add(e); }
      const sn = new THREE.Mesh(new THREE.SphereGeometry(0.011 * s, 10, 8), M('__teddy_snout', 0xe6cfae)); sn.position.set(0, 0.095 * s, 0.024 * s); b.add(sn); return loose(b); };
    const framedArt = (w2, h2, draw, frame = 0x6b4a32) => { const f = g(); f.add(box(w2, h2, 0.025, () => M('__frame_' + frame.toString(16), frame), 0, 0, 0, 0.003));
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w2 - 0.05, h2 - 0.05), new THREE.MeshStandardMaterial({ map: canvasTex(256, Math.round(256 * h2 / w2), draw), roughness: 0.9, name: '__art_' + Math.random().toString(36).slice(2, 7) })); pl.position.set(0, h2 / 2, 0.026); f.add(pl); return f; };
    const mushroomLamp = (s = 1) => { const l = g(); l.add(cyl(0.012 * s, 0.018 * s, 0.1 * s, () => M('__lamp_stem_cream', 0xefe5d2), 0, 0, 0, 16)); const cm = led(0xffd29a, 2.4); moods.strips.push(cm);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), cm); cap.position.y = 0.095 * s; l.add(cap); return loose(l); };
    // cane-front console (owner references: cottage = legged teak sideboard; brass-bells = floating teak): sections 'open' | 'cane' | 'drawers';
    // contents 'ps5' (lies flat, cane breathes) | 'gadgets' (DualSense dock, Apple TV, router) | 'store'; every door / drawer is a real mover
    const weaveMat = () => new THREE.MeshStandardMaterial({ roughness: 0.9, name: '__diamond_weave', map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#e9e4da'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8f8a82'; x.lineWidth = 3;
      for (let r = -1; r < 9; r++) for (let c = -1; c < 9; c++) { const cx2 = c * 32 + (r % 2) * 16, cy2 = r * 32; x.beginPath(); x.moveTo(cx2, cy2 - 14); x.lineTo(cx2 + 14, cy2); x.lineTo(cx2, cy2 + 14); x.lineTo(cx2 - 14, cy2); x.closePath(); x.stroke(); x.beginPath(); x.moveTo(cx2, cy2 - 6); x.lineTo(cx2 + 6, cy2); x.lineTo(cx2, cy2 + 6); x.lineTo(cx2 - 6, cy2); x.closePath(); x.stroke(); } }) });
    function caneConsole({ x0: c0, x1: c1, y0, h, d = 0.42, legs = 0, sections, wood = TEAK }) {
      const WD = wood;
      const W2 = c1 - c0, yb = y0 + legs, yt = yb + h, cane = caneMat();
      root.add(box(W2, 0.022, d, WD, (c0 + c1) / 2, yt - 0.022, 0, 0.004)); root.add(box(W2, t, d - 0.01, WD, (c0 + c1) / 2, yb, 0));
      root.add(box(t, h, d, WD, c0 + t / 2, yb, 0)); root.add(box(t, h, d, WD, c1 - t / 2, yb, 0)); root.add(box(W2 - 2 * t, h - 0.03, 0.01, () => M('__cabinet_back_dark', 0x3a2a1f), (c0 + c1) / 2, yb + t, 0.01));
      if (legs) for (const [lx, lz] of [[c0 + 0.08, 0.08], [c1 - 0.08, 0.08], [c0 + 0.08, d - 0.08], [c1 - 0.08, d - 0.08]]) { const lg = cyl(0.018, 0.011, legs + 0.01, WD, 0, 0, 0, 12); lg.position.set(lx, y0 + legs / 2, lz); lg.rotation.set((lz > d / 2 ? 0.12 : -0.12), 0, (lx > (c0 + c1) / 2 ? -0.1 : 0.1)); root.add(lg); }
      const tot = sections.reduce((a, s3) => a + s3.w, 0); let x = c0 + t;
      sections.forEach((sc, i) => {
        const w = sc.w / tot * (W2 - 2 * t), xa = x, xm = x + w / 2; x += w;
        if (i < sections.length - 1) root.add(box(t, h - t - 0.022, d - 0.03, WD, x, yb + t, 0.02));
        const ib = yb + t, ih = h - t - 0.022, fz = d - 0.02;
        if (sc.type === 'open' && sc.content === 'ps5av') {   // open bay: PS5 flat (free air on three sides) + Apple TV + router behind
          const p5 = ps5Slim(); p5.rotation.z = Math.PI / 2; p5.position.set(xm - 0.04 + 0.186, ib + 0.05, 0.12); root.add(p5);
          root.add(loose(box(0.093, 0.031, 0.093, PS5B, xm + w * 0.36, ib, 0.22, 0.008))); root.add(loose(box(0.2, 0.035, 0.09, PS5B, xm + w * 0.3, ib, 0.025, 0.01)));   // router behind (clear of the PS5)
          const gl = led(0xffc88a, 1.6); moods.strips.push(gl); root.add(box(w - 0.04, 0.006, 0.01, gl, xm, ib + ih - 0.01, d - 0.06)); return; }
        if (sc.type === 'open') { if (sc.content === 'av') {   // open media shelf: books + Apple TV + router (as in the reference)
            for (let k = 0; k < 3; k++) root.add(loose(box(0.24, 0.03, 0.17, () => M('__book_mid_' + k, [0x2e4a3a, 0xe9e1cf, 0x3b4a5e][k]), xm - w * 0.22, ib + k * 0.03, 0.12)));
            root.add(loose(box(0.093, 0.031, 0.093, PS5B, xm + w * 0.18, ib, 0.2, 0.008))); root.add(loose(box(0.2, 0.035, 0.14, PS5B, xm + w * 0.15, ib, 0.04, 0.01)));
            const gl = led(0xffc88a, 1.6); moods.strips.push(gl); root.add(box(w - 0.04, 0.006, 0.01, gl, xm, ib + ih - 0.01, d - 0.06)); return; }
          root.add(box(w - 0.01, 0.018, d - 0.06, WD, xm, ib + ih * 0.5, 0.03)); return; }
        if (sc.type === 'drawers') { const n = sc.n || 3, dh = ih / n;
          for (let k = 0; k < n; k++) { const dr = g(); dr.add(box(w - 0.006, dh - 0.006, 0.02, WD, xm, ib + k * dh + 0.003, fz, 0.003)); const kn = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8), (sc.knob === 'black' ? PS5B : BRASS)()); kn.position.set(xm, ib + k * dh + dh / 2, fz + 0.026); dr.add(kn);
            dr.add(box(w - 0.06, 0.01, d - 0.12, OAK, xm, ib + k * dh + 0.02, 0.08)); tagGroup(dr, { type: 'slide', slide: [0, 0, 0.3], label: 'console drawer', fitted: true }); root.add(dr); } return; }
        // cane door: teak frame + cane panel, hinged on sc.hinge ('l' | 'r'), brass knob
        const left = sc.hinge !== 'r', hx = left ? xa + 0.002 : xa + w - 0.002, sgn = left ? 1 : -1, lw = w - 0.006, dr = g();
        for (const [fw2, fh2, ox, oy] of [[lw, 0.04, lw / 2, 0], [lw, 0.04, lw / 2, ih - 0.046], [0.04, ih - 0.006, 0.02, 0], [0.04, ih - 0.006, lw - 0.02, 0]]) dr.add(box(fw2, fh2, 0.02, WD, sgn * ox, ib + 0.003 + oy, 0));
        const front = sc.front || 'cane';
        if (front === 'cane' || front === 'weave') { const cp = new THREE.Mesh(new THREE.PlaneGeometry(lw - 0.07, ih - 0.08), front === 'weave' ? weaveMat() : cane); cp.position.set(sgn * lw / 2, ib + ih / 2, 0.01); dr.add(cp); }
        else if (front === 'wood') dr.add(box(lw - 0.07, ih - 0.08, 0.016, WD, sgn * lw / 2, ib + 0.04, 0.002));
        else for (let ly = ib + 0.05; ly < ib + ih - 0.05; ly += 0.032) { const lv = box(lw - 0.08, 0.022, 0.012, WD, sgn * lw / 2, ly, 0.006); lv.rotation.x = -0.35; dr.add(lv); }   // 'louvre': angled slats breathe
        const kn = new THREE.Mesh(new THREE.SphereGeometry(0.01, 12, 8), BRASS()); kn.position.set(sgn * (lw - 0.045), ib + ih * 0.62, 0.028); dr.add(kn);
        dr.position.set(hx, 0, fz); tagGroup(dr, { type: 'cab', hinge: [hx, 0, fz], a1: left ? -Math.PI * 0.5 : Math.PI * 0.5, label: sc.label || 'cane cabinet', fitted: true }); root.add(dr);
        if (sc.content === 'ps5') { const p5 = ps5Slim(); p5.rotation.z = Math.PI / 2; p5.position.set(xm + 0.186, ib + 0.05, 0.12); root.add(p5);
          const gl = led(0xffc88a, 1.6); moods.strips.push(gl); root.add(box(w - 0.06, 0.006, 0.01, gl, xm, ib + ih - 0.01, 0.06)); }   // PS5 lies flat; cane front + 50 mm rear gap + top vent slot
        if (sc.type !== 'open') root.add(cyl(0.018, 0.018, 0.004, PS5B, xa + w - 0.05, ib + 0.001, 0.06, 16));   // cable grommet → wall chase
        if (sc.content === 'remotes') {   // owner: remotes + chargers on a mid shelf, games below
          const my = ib + ih * 0.5; root.add(box(w - 0.01, 0.018, d - 0.06, WD, xm, my, 0.03)); const uy = my + 0.018;
          root.add(loose(box(0.045, 0.018, 0.17, PS5B, xm - w * 0.3, uy, 0.12, 0.006))); root.add(loose(box(0.035, 0.009, 0.135, SILVER, xm - w * 0.14, uy, 0.14, 0.004)));
          root.add(loose(cyl(0.045, 0.045, 0.01, () => M('__charger_pad', 0xe9e6e0), xm + w * 0.08, uy, 0.2, 28))); root.add(loose(box(0.06, 0.03, 0.06, () => M('__charger_brick', 0xf2f1ee), xm + w * 0.3, uy, 0.1, 0.008)));
          for (let k = 0; k < 2; k++) { const cb = cyl(0.003, 0.003, 0.1, () => M('__cable_white', 0xeeeeea), 0, 0, 0, 6); cb.rotation.x = Math.PI / 2; cb.position.set(xm + w * 0.28 + k * 0.015, uy + 0.01, 0.19); root.add(loose(cb)); }
          for (let k = 0; k < 4; k++) root.add(loose(box(0.135, 0.015, 0.17, () => M('__game_case_' + k, [0x1f4fd8, 0x111111, 0x1f4fd8, 0xd8d8d8][k]), xm, ib + k * 0.015, 0.1))); }
        if (sc.content === 'games') for (let k = 0; k < 7; k++) root.add(loose(box(0.015, 0.17, 0.135, () => M('__game_case_' + (k % 4), [0x1f4fd8, 0x111111, 0x1f4fd8, 0xd8d8d8][k % 4]), xa + 0.04 + k * 0.017, ib, 0.12)));
        if (sc.content === 'ps5dock') {   // PS5 lies flat below (louvres + 50 mm rear gap breathe), DualSense charging station on a shelf above
          const p5 = ps5Slim(); p5.rotation.z = Math.PI / 2; p5.position.set(xm + 0.186, ib + 0.05, 0.12); root.add(p5);
          const sy2 = ib + 0.14; root.add(box(w - 0.01, 0.018, d - 0.12, WD, xm, sy2, 0.09)); const dk = dualSenseDock(); dk.position.set(xm, sy2 + 0.018, 0.18); root.add(dk);
          const gl = led(0xffc88a, 1.6); moods.strips.push(gl); root.add(box(w - 0.06, 0.006, 0.01, gl, xm, ib + ih - 0.01, 0.06)); }
        if (sc.content === 'sub') {   // wireless subwoofer for the soundbar: louvred door lets the bass out
          const sb = g(); sb.add(box(0.26, 0.28, 0.27, () => M('__sub_body', 0x1b1b1d), 0, 0, 0, 0.012)); sb.add(box(0.22, 0.22, 0.004, () => M('__sub_grille', 0x2c2d30), 0, 0.03, 0.27)); const dot = led(0xffffff, 1); sb.add(box(0.006, 0.006, 0.002, dot, 0.1, 0.25, 0.272));
          sb.position.set(xm, ib, 0.06); root.add(loose(sb)); }
        if (sc.content === 'dock') { const dk = dualSenseDock(); dk.position.set(xm, ib, 0.2); root.add(dk); }
        if (sc.content === 'gadgets') { const dk = dualSenseDock(); dk.position.set(xm - (w > 0.42 ? 0.06 : 0), ib, 0.2); root.add(dk);
          root.add(loose(box(0.093, 0.031, 0.093, PS5B, xm + Math.min(0.17, w / 2 - 0.06), ib, 0.24, 0.008))); root.add(loose(box(0.2, 0.035, 0.14, PS5B, xm, ib, 0.04, 0.01))); }
      });
      root.add(box(W2 - 0.1, 0.012, 0.03, PS5B, (c0 + c1) / 2, yt - 0.02, -0.002));                 // cable tray / grommet strip at the back (all wires drop into the wall chase)
      return { yt };
    }
    // brass elephant bell chain (Indian 'ghungroo' hanging, ceiling hook → console height)
    const bellChain = (top, bottom) => { const c = g(), br = BRASS;
      for (let y = top, k = 0; y > bottom; y -= 0.022, k++) { const lk = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0022, 6, 12), br()); lk.position.y = y; lk.rotation.y = k % 2 ? Math.PI / 2 : 0; c.add(lk); }
      for (let y = top - 0.35; y > bottom + 0.1; y -= 0.42) {
        const el = g(), bd = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), br()); bd.scale.set(1.25, 0.9, 0.8); el.add(bd);
        const hd = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), br()); hd.position.set(0.035, 0.012, 0); el.add(hd);
        const tr = cyl(0.006, 0.004, 0.04, br, 0.048, -0.03, 0, 8); tr.rotation.z = 0.25; el.add(tr);
        for (const [lx, lz] of [[-0.02, -0.012], [-0.02, 0.012], [0.02, -0.012], [0.02, 0.012]]) el.add(cyl(0.006, 0.006, 0.025, br, lx, -0.045, lz, 8));
        el.position.y = y; c.add(el); const bl = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), br()); bl.position.y = y - 0.12; c.add(bl); const bl2 = bl.clone(); bl2.position.y = y + 0.16; bl2.scale.setScalar(0.8); c.add(bl2);
      }
      const bt = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), br()); bt.rotation.x = Math.PI; bt.position.y = bottom + 0.03; c.add(bt);
      return loose(c); };
    // ---- backdrop: charcoal felt + micro-slat acoustic panel, LED channels at both edges, hexagon acoustic cluster ----
    const bx0 = NOTALL ? 0 : tall, bx1 = deepTo, bw = bx1 - bx0, bc = (bx0 + bx1) / 2;
    if (backdrop === 'stone') {                                                  // dark stone slab backdrop, walnut fins either side, LED reveals
      const slab = (() => { const t = canvasTex(512, 1024, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a3633'); gr.addColorStop(1, '#2a2725'); x.fillStyle = gr; x.fillRect(0, 0, w, h); for (let k = 0; k < 90; k++) { x.strokeStyle = `rgba(200,190,175,${0.05 + Math.random() * 0.12})`; x.lineWidth = 0.6 + Math.random() * 1.6; x.beginPath(); let px = Math.random() * w, py = Math.random() * h; x.moveTo(px, py); for (let s2 = 0; s2 < 6; s2++) { px += (Math.random() - 0.3) * 90; py += (Math.random() - 0.5) * 60; x.lineTo(px, py); } x.stroke(); } }); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, name: '__nero_stone' }); })();
      root.add(box(bw - 0.36, ceiling, 0.03, slab, bc, 0, 0));
      for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) root.add(box(0.03, ceiling - 0.02, 0.04, WOOD, bc + sx * (bw / 2 - 0.03 - k * 0.045), 0.01, 0, 0.004));
      for (const ex of [bx0 + 0.19, bx1 - 0.19]) { const m = led(0x6a5cff, 2.4); syncAll.push(m); root.add(box(0.01, ceiling - 0.1, 0.01, m, ex, 0.05, 0.034)); }
      const top = led(0x6a5cff, 2.2); syncAll.push(top); root.add(box(bw - 0.4, 0.008, 0.01, top, bc, ceiling - 0.06, 0.034));
    } else if (GREEN) {                                                          // green panelling + tall arch of light oak slats around the TV, LED outline, crown band
      root.add(box(bw, ceiling, 0.02, GRN, bc, 0, 0));
      for (let x = bx0 + 0.15; x < bx1 - 0.05; x += 0.15) root.add(box(0.004, ceiling - 0.2, 0.004, () => M('__green_groove', 0x1f3328), x, 0.08, 0.02));
      const aw = bw - 0.22, ay0 = 0.7, ay1 = ceiling - 0.14, cxA = bc, frm = new THREE.Shape(); frm.moveTo(bx0, 0.68); frm.lineTo(bx1, 0.68); frm.lineTo(bx1, ceiling); frm.lineTo(bx0, ceiling); frm.lineTo(bx0, 0.68);
      const hole = new THREE.Path(); hole.moveTo(cxA - aw / 2, ay0); hole.lineTo(cxA + aw / 2, ay0); hole.lineTo(cxA + aw / 2, ay1 - aw / 2); hole.absarc(cxA, ay1 - aw / 2, aw / 2, 0, Math.PI, false); hole.lineTo(cxA - aw / 2, ay0); frm.holes.push(hole);
      const fm = new THREE.Mesh(new THREE.ExtrudeGeometry(frm, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 32 }), GRN()); fm.position.z = 0.02; root.add(fm);
      for (let x = cxA - aw / 2 + 0.015; x < cxA + aw / 2 - 0.01; x += 0.03) { const top = x < cxA - aw / 2 || x > cxA + aw / 2 ? ay0 : (ay1 - aw / 2) + Math.sqrt(Math.max(0, (aw / 2) ** 2 - (x - cxA) ** 2)); root.add(box(0.018, Math.max(0.05, top - ay0 - 0.01), 0.015, OAK, x, ay0, 0.022)); }
      const al = led(0xffc880, 2.8); syncAll.push(al); const pts = hole.getPoints(48).filter(p => p.y > ay0 + 0.02).map(p => new THREE.Vector3(p.x, p.y - 0.008, 0.07));
      root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.006, 6, false), al));
      root.add(box(bw + 0.02, 0.1, 0.1, GRN, bc, ceiling - 0.1, 0, 0.006));                                    // crown band
    } else if (WABI) {                                                           // cream wall + taupe limewash panel with a rounded corner, long oak shelf on a bead leg
      root.add(box(bw, ceiling, 0.01, WABIW, bc, 0, 0));
      const lw = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#b69b80'; x.fillRect(0, 0, w, h); for (let k = 0; k < 500; k++) { x.fillStyle = `rgba(${200 + Math.random() * 40},${180 + Math.random() * 30},${150 + Math.random() * 30},0.06)`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 30, 0, 7); x.fill(); } });
      const lx0 = bx0 + 0.06, lx1 = bx1, ly0 = 0.7, ly1 = 2.32, lr = 0.36, ls = new THREE.Shape(); ls.moveTo(lx0, ly0); ls.lineTo(lx1, ly0); ls.lineTo(lx1, ly1); ls.lineTo(lx0 + lr, ly1); ls.absarc(lx0 + lr, ly1 - lr, lr, Math.PI / 2, Math.PI, false); ls.lineTo(lx0, ly0);
      const lm = new THREE.Mesh(new THREE.ExtrudeGeometry(ls, { depth: 0.025, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 24 }), new THREE.MeshStandardMaterial({ map: lw, roughness: 0.95, name: '__limewash_taupe' })); lm.position.z = 0.01; root.add(lm);
      const sx1 = Math.min(deepTo + 0.3, leafFrom - 0.03);   // must end before the door-leaf zone
      root.add(box(sx1 - bx0 - 0.02, 0.035, 0.3, OAK, (bx0 + 0.02 + sx1) / 2, 0.8, 0.01, 0.006));                  // long floating shelf (runs past the console)
      const sl = led(0xffc880, 2.4); syncAll.push(sl); root.add(box(sx1 - bx0 - 0.1, 0.006, 0.01, sl, (bx0 + sx1) / 2, 0.796, 0.27));
      for (let k = 0; k < 3; k++) { const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), OAK()); b2.scale.set(1, 1.15, 1); b2.position.set(sx1 - 0.12, 0.13 + k * 0.23, 0.17); root.add(b2); }   // stacked wooden-bead leg
      const vz = g(); vz.add(cyl(0.05, 0.08, 0.26, () => M('__vase_brown', 0x6e4a36), 0, 0, 0, 20)); for (let k = 0; k < 6; k++) { const br = cyl(0.004, 0.003, 0.4, () => M('__dried_branch', 0x6b543f), 0, 0, 0, 5); br.position.set((k - 2.5) * 0.03, 0.42, 0); br.rotation.z = (k - 2.5) * 0.25; vz.add(br); } vz.position.set(sx1 - 0.12, 0.835, 0.15); root.add(loose(vz));
    } else if (FRAME) {                                                          // microcement wall, sculpted white wavy frame around the TV with a halo
      root.add(box(bw, ceiling, 0.012, MICRO, bc, 0, 0));
      const fw = tvInch * 0.0254 * 0.8716 + 0.5, fh = tvInch * 0.0254 * 0.4903 + 0.42, fr = 0.12, fs = new THREE.Shape();
      fs.moveTo(-fw / 2 + fr, -fh / 2); fs.lineTo(fw / 2 - fr, -fh / 2); fs.absarc(fw / 2 - fr, -fh / 2 + fr, fr, -Math.PI / 2, 0, false); fs.lineTo(fw / 2, fh / 2 - fr); fs.absarc(fw / 2 - fr, fh / 2 - fr, fr, 0, Math.PI / 2, false); fs.lineTo(-fw / 2 + fr, fh / 2); fs.absarc(-fw / 2 + fr, fh / 2 - fr, fr, Math.PI / 2, Math.PI, false); fs.lineTo(-fw / 2, -fh / 2 + fr); fs.absarc(-fw / 2 + fr, -fh / 2 + fr, fr, Math.PI, 1.5 * Math.PI, false);
      const waves = canvasTex(512, 320, (x, w, h) => { x.fillStyle = '#efebe4'; x.fillRect(0, 0, w, h); for (let k = 0; k < 14; k++) { x.strokeStyle = `rgba(150,140,128,${0.18 + (k % 3) * 0.05})`; x.lineWidth = 3; x.beginPath(); for (let px = 0; px <= w; px += 8) x.lineTo(px, k * 24 + Math.sin(px * 0.02 + k) * 10); x.stroke(); } });
      const fm = new THREE.Mesh(new THREE.ExtrudeGeometry(fs, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 4, curveSegments: 12 }), new THREE.MeshStandardMaterial({ map: waves, roughness: 0.9, name: '__sculpted_plaster' }));
      const uv = fm.geometry.attributes.uv, ps = fm.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, ps.getX(i) / fw + 0.5, ps.getY(i) / fh + 0.5);
      fm.position.set(tvCx, tvCy, 0.03); root.add(fm);
      const halo = ledStrip({ w: fw - 0.1, wash: 0.25, dir: 'up', alpha: 0.6 }); halo.obj.position.set(tvCx, tvCy + fh / 2 - 0.02, 0.025); root.add(halo.obj); syncAll.push(...halo.moods.strips);
      const hb = led(0xffc880, 2.6); syncAll.push(hb); for (const sx of [-1, 1]) root.add(box(0.008, fh - 0.2, 0.008, hb, tvCx + sx * (fw / 2 - 0.02), tvCy - fh / 2 + 0.1, 0.03));
    } else if (backdrop === 'walnut-arch') {                                     // warm walnut with a large backlit arch recess framing the TV
      root.add(box(bw, ceiling, 0.02, WOOD, bc, 0, 0));
      const aw = 1.62, ay0 = 0.66, ay1 = 2.62, ar = new THREE.Shape(); ar.moveTo(tvCx - aw / 2, ay0); ar.lineTo(tvCx + aw / 2, ay0); ar.lineTo(tvCx + aw / 2, ay1 - aw / 2); ar.absarc(tvCx, ay1 - aw / 2, aw / 2, 0, Math.PI, false); ar.lineTo(tvCx - aw / 2, ay0);
      const inner = new THREE.Mesh(new THREE.ShapeGeometry(ar, 32), M('__arch_plaster_dark', 0x4a3e36)); inner.position.z = 0.021; root.add(inner);
      const ring = new THREE.Shape(); const ao = aw / 2 + 0.03; ring.moveTo(tvCx - ao, ay0); ring.lineTo(tvCx + ao, ay0); ring.lineTo(tvCx + ao, ay1 - aw / 2); ring.absarc(tvCx, ay1 - aw / 2, ao, 0, Math.PI, false); ring.lineTo(tvCx - ao, ay0); ring.holes.push(new THREE.Path(ar.getPoints(48)));
      const m = led(0x6a5cff, 2.6); syncAll.push(m); const rm = new THREE.Mesh(new THREE.ShapeGeometry(ring, 32), m); rm.position.z = 0.022; root.add(rm);
      for (const sx of [-1, 1]) for (let y = 0.9; y < 2.4; y += 0.4) root.add(box(0.16, 0.02, 0.14, OAK, tvCx + sx * (aw / 2 + 0.2), y, 0.02));      // little side shelves
    } else if (SAGE) {                                                           // owner reference: sage plaster wall, raised S-curve mass with lit niches, LED edge, walnut slats
      const SG = BEIGEWAVE ? () => M('__beige_plaster_wave', 0xd9c7aa) : () => M('__sage_plaster', 0x8e9878);   // owner: same design in beige too
      root.add(box(bw, ceiling, 0.012, SG, bc, 0, 0));
      const top = ceiling - 0.005, cA = STUDY ? [new THREE.Vector2(2.2, top), new THREE.Vector2(2.02, 2.5), new THREE.Vector2(1.42, 2.45), new THREE.Vector2(1.06, 2.05)] : [new THREE.Vector2(2.2, top), new THREE.Vector2(2.02, 2.5), new THREE.Vector2(1.36, 2.42), new THREE.Vector2(1.0, 2.0)], cB = STUDY ? [new THREE.Vector2(1.06, 2.05), new THREE.Vector2(0.86, 1.74), new THREE.Vector2(0.79, 1.22), new THREE.Vector2(0.81, 0.68)] : [new THREE.Vector2(1.0, 2.0), new THREE.Vector2(0.74, 1.66), new THREE.Vector2(0.6, 1.22), new THREE.Vector2(0.64, 0.68)];
      const mx0 = STUDY ? 0.76 : 0, ms = new THREE.Shape(); ms.moveTo(mx0, 0.68); ms.lineTo(mx0, top); ms.lineTo(cA[0].x, cA[0].y); ms.bezierCurveTo(cA[1].x, cA[1].y, cA[2].x, cA[2].y, cA[3].x, cA[3].y); ms.bezierCurveTo(cB[1].x, cB[1].y, cB[2].x, cB[2].y, cB[3].x, cB[3].y); ms.lineTo(mx0, 0.68);
      const niches = STUDY ? [] : [[0.86, 1.2, 0.06], [1.26, 1.6, 0.06], [1.66, 2.0, 0.06], [2.06, 2.46, 0.1]];
      niches.forEach(([y0, y1, r]) => { const hp = new THREE.Path(); rrShape(0.4, y1 - y0, r, 0.3, (y0 + y1) / 2, hp); ms.holes.push(hp); });
      const mass = new THREE.Mesh(new THREE.ExtrudeGeometry(ms, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 36 }), SG()); mass.position.z = 0.012; root.add(mass);
      niches.forEach(([y0, y1, r], i) => { const nl = led(0xffc27a, 2.6); moods.strips.push(nl); root.add(box(0.3, 0.006, 0.01, nl, 0.3, y1 - Math.max(0.012, r * 0.35), 0.11));
        const nw = ledStrip({ w: 0.34, wash: Math.min(0.32, y1 - y0 - 0.02), dir: 'down', alpha: 0.5 }); nw.obj.position.set(0.3, y1 - 0.02, 0.014); root.add(nw.obj); moods.strips.push(...nw.moods.strips); moods.halos.push(...nw.moods.halos); });
      if (STUDY) {   // owner 2026-11-10 (references/master-bedroom/2026-11-10_beige-study-cabinet-nook.png): tall storage left of the TV = a study nook behind two tall doors
        const CAB = () => M('__beige_lacquer_study', 0xe6d9c5), INT = () => M('__study_back', 0xdccbb1), c0 = 0.05, c1 = 0.75, cwd = c1 - c0, cxm = (c0 + c1) / 2, D = 0.5, z0 = 0.012, dy = 0.75, ny1 = 2.12;
        root.add(box(t, ceiling - 0.62, D, CAB, c0 + t / 2, 0.62, z0)); root.add(box(t, ceiling - 0.62, D, CAB, c1 - t / 2, 0.62, z0)); root.add(box(cwd, t, D, CAB, cxm, ceiling - t, z0));
        root.add(box(cwd - 2 * t, ceiling - 0.62, 0.01, INT, cxm, 0.62, z0));
        root.add(box(cwd - 2 * t, 0.03, D - 0.02, CAB, cxm, dy, z0, 0.004));                                                   // desk top 0.78 m
        root.add(box(cwd - 2 * t, 0.12, 0.02, CAB, cxm, 0.63, z0 + D - 0.05)); for (let x = c0 + t + 0.01; x < c1 - t - 0.005; x += 0.017) root.add(cyl(0.0075, 0.0075, 0.12, CAB, x, 0.63, z0 + D - 0.028, 8));   // fluted apron
        for (const y of [1.38, 1.78]) root.add(box(cwd - 2 * t, 0.022, D - 0.08, CAB, cxm, y, z0 + 0.01));
        root.add(box(cwd - 2 * t, 0.025, D, CAB, cxm, ny1, z0));
        for (const y of [ny1, 1.78, 1.38]) { const sl = led(0xffc27a, 2.6); moods.strips.push(sl); root.add(box(cwd - 0.08, 0.006, 0.01, sl, cxm, y - 0.008, z0 + D - 0.1));
          const ws = ledStrip({ w: cwd - 0.06, wash: 0.36, dir: 'down', alpha: 0.55 }); ws.obj.position.set(cxm, y - 0.01, z0 + 0.012); root.add(ws.obj); moods.strips.push(...ws.moods.strips); moods.halos.push(...ws.moods.halos); }
        // two tall study doors (open by default, like the reference) + upper cupboard doors, brass bar handles
        const leaf = (hx, left, y0, y1, label, start, hy) => { const lw = cwd / 2 - 0.004, dr = g(), sg = left ? 1 : -1; dr.add(box(lw, y1 - y0, 0.02, CAB, sg * lw / 2, y0, 0, 0.003)); dr.add(box(0.012, 0.32, 0.02, BRASS, sg * (lw - 0.035), hy, 0.02, 0.003));
          dr.position.set(hx, 0, z0 + D); tagGroup(dr, { type: 'cab', hinge: [hx, 0, z0 + D], a1: left ? -Math.PI * 0.5 : Math.PI * 0.5, label, start, fitted: start === 1 }); root.add(dr); };
        leaf(c0 + 0.002, true, dy + 0.035, ny1 - 0.002, 'study door', 1, 1.2); leaf(c1 - 0.002, false, dy + 0.035, ny1 - 0.002, 'study door', 1, 1.2);
        leaf(c0 + 0.002, true, ny1 + 0.027, ceiling - 0.006, 'upper cupboard', 0, ny1 + 0.06); leaf(c1 - 0.002, false, ny1 + 0.027, ceiling - 0.006, 'upper cupboard', 0, ny1 + 0.06);
        // desk: laptop, brass task lamp, 2 sockets; shelves: books, pen pot, vases, plant, photo frame
        const dt = dy + 0.03, lap2 = g(); lap2.add(box(0.31, 0.012, 0.22, SILVER, 0, 0, 0, 0.004)); const sc3 = box(0.31, 0.2, 0.008, PS5B, 0, 0, 0, 0.003); sc3.rotation.x = -0.2; sc3.position.set(0, 0.11, 0); lap2.add(sc3); lap2.position.set(cxm - 0.1, dt, z0 + 0.18); root.add(loose(lap2));
        const lmp = g(); lmp.add(cyl(0.06, 0.065, 0.015, BRASS, 0, 0, 0, 24)); const rod = cyl(0.005, 0.005, 0.38, BRASS, 0, 0.015, 0, 8); rod.rotation.z = 0.12; lmp.add(rod); const arm = cyl(0.005, 0.005, 0.16, BRASS, 0, 0, 0, 8); arm.rotation.z = Math.PI / 2 - 0.5; arm.position.set(-0.08, 0.42, 0); lmp.add(arm);
        const lsm = led(0xffd9a0, 2.4); moods.strips.push(lsm); const shd = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.08, 20, 1, true), BRASS()); shd.position.set(-0.16, 0.42, 0); shd.rotation.z = -0.6; lmp.add(shd); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), lsm); bulb.position.set(-0.15, 0.395, 0); lmp.add(bulb);
        lmp.position.set(c1 - 0.1, dt, z0 + 0.22); root.add(loose(lmp));
        root.add(box(0.14, 0.08, 0.008, () => M('__socket_plate', 0x2a2724), cxm + 0.05, dt + 0.12, z0 + 0.01)); for (const sx of [-0.035, 0.035]) root.add(cyl(0.016, 0.016, 0.004, () => M('__socket_hole', 0x111111), cxm + 0.05 + sx, dt + 0.16, z0 + 0.019, 12));
        const s1y = 1.38 + 0.022, s2y = 1.78 + 0.022;
        for (let k = 0; k < 5; k++) root.add(loose(box(0.026, 0.2 + (k % 2) * 0.03, 0.15, () => M('__book_study_' + k, [0xefe6d8, 0xd9cbb2, 0x3a3631, 0xe9e1cf, 0x8f8378][k]), c0 + 0.06 + k * 0.03, s1y, z0 + 0.05)));
        root.add(loose(cyl(0.03, 0.03, 0.09, () => M('__pen_pot', 0xefe9df), cxm + 0.02, s1y, z0 + 0.2, 16))); for (let k = 0; k < 4; k++) { const pn = cyl(0.003, 0.003, 0.13, PS5B, cxm + 0.02 + (k - 1.5) * 0.008, s1y + 0.03, z0 + 0.2, 6); pn.rotation.z = (k - 1.5) * 0.08; root.add(loose(pn)); }
        root.add(loose(cyl(0.028, 0.028, 0.08, PS5B, cxm + 0.12, s1y, z0 + 0.2, 16))); const bv4 = g(); bv4.add(cyl(0.035, 0.045, 0.12, BRASS, 0, 0, 0, 18)); bv4.add(cyl(0.012, 0.02, 0.06, BRASS, 0, 0.12, 0, 12)); bv4.position.set(c1 - 0.1, s1y, z0 + 0.2); root.add(loose(bv4));
        for (let k = 0; k < 2; k++) root.add(loose(box(0.2, 0.022, 0.15, () => M('__book_study_f' + k, [0x3a3631, 0xefe6d8][k]), cxm + 0.12, s1y + k * 0.022, z0 + 0.15)));
        const pp4 = potPlant(0.16, 0xefe9df, 0.055); pp4.position.set(c0 + 0.12, s2y, z0 + 0.2); root.add(pp4);
        for (let k = 0; k < 2; k++) root.add(loose(box(0.22, 0.025, 0.16, () => M('__book_study_g' + k, [0xefe6d8, 0x3a3631][k]), cxm + 0.1, s2y + k * 0.025, z0 + 0.14)));
        const ph2 = framedArt(0.16, 0.2, (x, w, h) => { x.fillStyle = '#e9e1d4'; x.fillRect(0, 0, w, h); x.fillStyle = '#b9a58a'; x.beginPath(); x.arc(w / 2, h * 0.4, w * 0.18, 0, 7); x.fill(); x.fillRect(w * 0.3, h * 0.55, w * 0.4, h * 0.35); }, 0xf2ede4); ph2.position.set(cxm + 0.1, s2y + 0.05, z0 + 0.1); ph2.rotation.x = -0.1; root.add(loose(ph2));
        // swivel desk chair like the reference: ivory bouclé shell seat + curved back, black 5-star base on castors, gas lift
        const sw = g(), BOU = () => M('__boucle_ivory', 0xe9e2d6), BLK = () => M('__chair_base_black', 0x1a1a1b);
        for (let k = 0; k < 5; k++) { const a = k * 1.2566, arm2 = box(0.3, 0.025, 0.04, BLK, 0, 0, 0, 0.008); arm2.rotation.y = a; arm2.position.set(Math.cos(a) * 0.15, 0.07, -Math.sin(a) * 0.15 - 0.02); sw.add(arm2);
          const cas = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), BLK()); cas.position.set(Math.cos(a) * 0.29, 0.03, -Math.sin(a) * 0.29); sw.add(cas); }
        sw.add(cyl(0.025, 0.025, 0.3, BLK, 0, 0.09, 0, 14)); sw.add(cyl(0.03, 0.03, 0.03, BLK, 0, 0.38, 0, 14));
        sw.add(box(0.5, 0.09, 0.48, BOU, 0, 0.41, -0.24, 0.04));
        const bk = box(0.46, 0.4, 0.07, BOU, 0, 0.47, 0.18, 0.033); bk.rotation.x = 0.12; sw.add(bk); for (const sx of [-1, 1]) { const wing = box(0.06, 0.2, 0.3, BOU, sx * 0.23, 0.47, -0.06, 0.028); sw.add(wing); }   // curved-shell look: back + low wings
        sw.position.set(cxm, 0, 0.98); root.add(loose(sw));   // back at +z → the chair faces the desk
      } else {
      for (let k = 0; k < 6; k++) root.add(loose(box(0.026, 0.2 + (k % 3) * 0.02, 0.15, () => M('__book_sage_' + k, [0xd9cbb2, 0x6b4a32, 0xefe6d8, 0x8f8378, 0x3e4a36, 0xc9a77a][k]), 0.16 + k * 0.03, 0.87, 0.04)));
      root.add(loose(cyl(0.03, 0.04, 0.12, () => M('__vase_white', 0xf2eee8), 0.4, 0.87, 0.09, 18)));
      root.add(loose(cyl(0.035, 0.045, 0.13, () => M('__vase_white', 0xf2eee8), 0.2, 1.27, 0.08, 18))); const ph = framedArt(0.12, 0.15, (x, w, h) => { x.fillStyle = '#d9cbb2'; x.fillRect(0, 0, w, h); x.fillStyle = '#6f7d5c'; x.fillRect(w * 0.2, h * 0.3, w * 0.6, h * 0.5); }, 0x2e2a26); ph.position.set(0.38, 1.27, 0.05); ph.rotation.x = -0.12; root.add(loose(ph));
      const np = potPlant(0.24, 0xe9e1d2, 0.055); np.position.set(0.3, 1.67, 0.08); root.add(np); const nv = vine(0.45, 2); nv.position.set(0.18, 1.85, 0.12); root.add(nv);
      root.add(loose(cyl(0.025, 0.035, 0.1, () => M('__vase_white', 0xf2eee8), 0.22, 2.07, 0.08, 18))); root.add(loose(cyl(0.02, 0.03, 0.07, () => M('__vase_white', 0xf2eee8), 0.36, 2.07, 0.08, 18)));
      }
      // LED along the S-curve edge + its soft wash onto the TV wall
      const crv = new THREE.CurvePath(); crv.add(new THREE.CubicBezierCurve(...cA)); crv.add(new THREE.CubicBezierCurve(...cB));
      const ep = crv.getSpacedPoints(120), el = led(0xffc27a, 3); syncAll.push(el);
      root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ep.map(p => new THREE.Vector3(p.x + 0.01, p.y - 0.004, 0.02))), 200, 0.006, 6, false), el));
      const hm = new THREE.MeshBasicMaterial({ color: 0xffc27a, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, name: '__led_wash' }); moods.halos.push(hm);
      const pos = [], col = [], idx = [];
      ep.forEach((p, i) => { const q2 = ep[Math.min(ep.length - 1, i + 1)], q0 = ep[Math.max(0, i - 1)], tx = q2.x - q0.x, ty = q2.y - q0.y, L = Math.hypot(tx, ty) || 1; let nx = ty / L, ny = -tx / L;
        if (nx * (tvCx - p.x) + ny * (tvCy - p.y) < 0) { nx = -nx; ny = -ny; } const e = Math.min(1, i / 10, (ep.length - 1 - i) / 10);
        pos.push(p.x + nx * 0.01, p.y + ny * 0.01, 0.0135, p.x + nx * 0.24, p.y + ny * 0.24, 0.0135); col.push(1, 1, 1, 0.6 * e, 1, 1, 1, 0); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); wg.setIndex(idx); root.add(new THREE.Mesh(wg, hm));
      // walnut slat panel on the right (ends at 2.68: the open door leaf starts at 2.70) + lit shelf with a trailing plant
      root.add(box(0.48, ceiling, 0.01, () => M('__slat_backing', 0x2b211a), 2.44, 0, 0.012));
      for (let x = 2.215; x < 2.67; x += 0.04) root.add(box(0.026, ceiling - 0.01, 0.03, WOOD, x, 0.005, 0.02, 0.003));
      const sv = led(0xffc27a, 2.4); syncAll.push(sv); root.add(box(0.008, ceiling - 0.1, 0.008, sv, 2.195, 0.05, 0.03));
      root.add(box(0.46, 0.035, 0.2, WOOD, 2.44, 2.28, 0.05, 0.004)); const shl = ledStrip({ w: 0.42, wash: 0.5, dir: 'down', alpha: 0.5 }); shl.obj.position.set(2.44, 2.275, 0.056); root.add(shl.obj); moods.strips.push(...shl.moods.strips); moods.halos.push(...shl.moods.halos);
      const sp = potPlant(0.2, 0xe9e1d2, 0.05); sp.position.set(2.5, 2.315, 0.15); root.add(sp); for (const [vx, vl, sd] of [[2.44, 0.8, 1], [2.55, 0.55, 3], [2.36, 0.45, 5]]) { const vv = vine(vl, sd); vv.position.set(vx, 2.33, 0.2); root.add(vv); }
      const cove = ledStrip({ w: bw + 0.2, wash: 0.5, dir: 'down', alpha: 0.32 }); cove.obj.position.set(bc + 0.1, ceiling - 0.03, 0.16); root.add(cove.obj); moods.strips.push(...cove.moods.strips); moods.halos.push(...cove.moods.halos);
    } else if (COT) {                                                            // owner reference: cosy cottage — cream wall, lit niche pier, long shelf with art + figurines, legged cane sideboard
      root.add(box(bw, ceiling, 0.01, () => M('__cottage_cream', 0xefe4cf), bc, 0, 0));
      const pier = new THREE.Shape(); pier.moveTo(0.02, 0); pier.lineTo(0.6, 0); pier.lineTo(0.6, ceiling - 0.005); pier.lineTo(0.02, ceiling - 0.005); pier.lineTo(0.02, 0);
      const rows = [[0.5, 0.92], [1.0, 1.42], [1.5, 1.92], [2.0, 2.5]]; rows.forEach(([y0, y1]) => { const hp = new THREE.Path(); rrShape(0.42, y1 - y0, 0.08, 0.31, (y0 + y1) / 2, hp); pier.holes.push(hp); });
      const pm2 = new THREE.Mesh(new THREE.ExtrudeGeometry(pier, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2, curveSegments: 20 }), M('__cottage_cream_lacquer', 0xf3ead8)); pm2.position.z = 0.01; root.add(pm2);
      rows.forEach(([y0, y1], i) => { const nl = led(0xffc27a, 2.6); moods.strips.push(nl); root.add(box(0.3, 0.006, 0.01, nl, 0.31, y1 - 0.03, 0.22));
        const nw = ledStrip({ w: 0.38, wash: 0.36, dir: 'down', alpha: 0.6 }); nw.obj.position.set(0.31, y1 - 0.02, 0.013); root.add(nw.obj); moods.strips.push(...nw.moods.strips); moods.halos.push(...nw.moods.halos);
        if (i === 0) { const pp = potPlant(0.22, 0xe9e1d2, 0.06); pp.position.set(0.31, y0, 0.16); root.add(pp); }
        if (i === 1) { const tb = teddy(1.4); tb.position.set(0.25, y0, 0.16); root.add(tb); const pp = potPlant(0.16, 0xd8c7a8, 0.045); pp.position.set(0.42, y0, 0.16); root.add(pp); const vv = vine(0.5, 2); vv.position.set(0.45, y0 + 0.2, 0.25); root.add(vv); }
        if (i === 2) { const tb = teddy(1.6, 0xc58a52); tb.position.set(0.31, y0, 0.16); root.add(tb); }
        if (i === 3) { const hs = g(); hs.add(box(0.1, 0.1, 0.08, () => M('__birdhouse', 0xb8865a), 0, 0, 0)); const rf = box(0.13, 0.012, 0.1, () => M('__birdhouse_roof', 0x7a5236), 0, 0.1, -0.01); hs.add(rf); hs.position.set(0.24, y0, 0.12); root.add(loose(hs)); const h2 = hs.clone(); h2.scale.setScalar(0.7); h2.position.set(0.4, y0, 0.12); root.add(h2); }
      });
      // long teak shelf over the TV (ends at 2.62, before the door-leaf zone) with art, figurines, plants, trailing vines
      const shY = 2.2; root.add(box(1.97, 0.04, 0.22, TEAK, 0.65 + 1.97 / 2, shY, 0.012, 0.004));
      const shl = ledStrip({ w: 1.9, wash: 0.55, dir: 'down', alpha: 0.45 }); shl.obj.position.set(0.65 + 1.97 / 2, shY - 0.004, 0.2); root.add(shl.obj); syncAll.push(...shl.moods.strips); moods.halos.push(...shl.moods.halos);
      const duck = framedArt(0.3, 0.38, (x, w, h) => { x.fillStyle = '#9fb27a'; x.fillRect(0, 0, w, h); x.fillStyle = '#fbf7ee'; x.beginPath(); x.ellipse(w * 0.5, h * 0.62, w * 0.28, h * 0.14, 0, 0, 7); x.fill(); x.beginPath(); x.arc(w * 0.32, h * 0.38, w * 0.12, 0, 7); x.fill(); x.fillStyle = '#e39a3a'; x.beginPath(); x.moveTo(w * 0.2, h * 0.38); x.lineTo(w * 0.08, h * 0.4); x.lineTo(w * 0.2, h * 0.42); x.fill(); }, 0x8a5a33);
      duck.position.set(1.0, shY + 0.04, 0.05); duck.rotation.x = -0.08; root.add(loose(duck));
      const flw = framedArt(0.26, 0.32, (x, w, h) => { x.fillStyle = '#f3ead2'; x.fillRect(0, 0, w, h); for (const [fx, fy, c] of [[0.3, 0.4, '#e3b23c'], [0.6, 0.3, '#e9a1a1'], [0.5, 0.6, '#e3b23c']]) { x.strokeStyle = '#6f8a4a'; x.lineWidth = 3; x.beginPath(); x.moveTo(w * fx, h * fy); x.lineTo(w * fx, h); x.stroke(); x.fillStyle = c; x.beginPath(); x.arc(w * fx, h * fy, w * 0.07, 0, 7); x.fill(); } }, 0x8a5a33);
      flw.position.set(1.62, shY + 0.04, 0.05); flw.rotation.x = -0.08; root.add(loose(flw));
      for (const [tx, s3, c] of [[0.74, 1.2, 0xb07a45], [0.84, 0.9, 0xc58a52], [1.3, 1, 0xa86b3c], [1.82, 1.1, 0xb07a45], [2.4, 1, 0xc58a52]]) { const tb = teddy(s3, c); tb.position.set(tx, shY + 0.04, 0.12); root.add(tb); }
      for (const [px, vl] of [[1.25, 0.5], [2.1, 0.9], [2.52, 0.6]]) { const pp = potPlant(0.2, 0xe9e1d2, 0.055); pp.position.set(px, shY + 0.04, 0.12); root.add(pp); const vv = vine(vl, px * 3); vv.position.set(px + 0.03, shY + 0.02, 0.22); root.add(vv); }
      const ml = mushroomLamp(1.1); ml.position.set(2.0, shY + 0.04, 0.12); root.add(ml);
      const cove = ledStrip({ w: bw, wash: 0.5, dir: 'down', alpha: 0.32 }); cove.obj.position.set(bc, ceiling - 0.03, 0.012); root.add(cove.obj); moods.strips.push(...cove.moods.strips); moods.halos.push(...cove.moods.halos);
    } else if (BELLS) {                                                          // owner reference: warm cream wall, teak slat panel + art, brass elephant bell chains, floating cane console
      root.add(box(bw, ceiling, 0.01, () => M('__warm_cream_wall', 0xece0cb), bc, 0, 0));
      root.add(box(0.44, ceiling, 0.01, () => M('__slat_backing', 0x2b211a), 0.22, 0, 0.01));
      for (let x = 0.015; x < 0.43; x += 0.036) root.add(box(0.024, ceiling - 0.01, 0.03, TEAK, x, 0.005, 0.02, 0.003));
      const art = framedArt(0.4, 0.62, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d8b98c'); gr.addColorStop(0.45, '#b98a5a'); gr.addColorStop(0.55, '#3b3a32'); gr.addColorStop(1, '#2a2924'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(240,220,190,0.5)'; x.fillRect(0, h * 0.5, w, 3); }, 0x1e1c1a);
      art.position.set(0.2, 1.45, 0.05); root.add(art);
      const sl = ledStrip({ w: 0.42, wash: 0.6, dir: 'down', alpha: 0.4 }); sl.obj.position.set(0.22, ceiling - 0.03, 0.06); root.add(sl.obj); moods.strips.push(...sl.moods.strips); moods.halos.push(...sl.moods.halos);
      for (const bx2 of [tvCx - 0.92, tvCx + 0.92]) { const bc2 = bellChain(ceiling - 0.01, 0.82); bc2.position.set(bx2, 0, 0.08); root.add(bc2); root.add(cyl(0.025, 0.025, 0.01, BRASS, bx2, ceiling - 0.01, 0.08, 16)); }
      const cove = ledStrip({ w: bw, wash: 0.55, dir: 'down', alpha: 0.3 }); cove.obj.position.set(bc, ceiling - 0.03, 0.012); root.add(cove.obj); moods.strips.push(...cove.moods.strips); moods.halos.push(...cove.moods.halos);
    } else if (SLATE) {                                                          // owner reference: dark slate wall + wide oak slat panel, backlit TV, three oak shelves, fiddle-leaf fig
      root.add(box(1.96, ceiling, 0.012, () => M('__slate_wall', 0x34383b), 0.98, 0, 0));
      root.add(box(bw - 1.96 + 0.01, ceiling, 0.012, () => M('__warm_white_wall', 0xece6dc), (1.96 + bx1) / 2, 0, 0));
      // owner: fill the whole wall → oak slats from 1.96 m to the corner. Real 35 mm slats wherever allowed; in the door-leaf zone
      // (x ≥ leafFrom, below leafTop) a flat 3 mm slat-look veneer keeps the rhythm (the open door rests over it)
      root.add(box(leafFrom - 1.96, ceiling, 0.01, () => M('__slat_backing', 0x2b211a), (1.96 + leafFrom) / 2, 0, 0.022));
      root.add(box(roomW - leafFrom, ceiling - leafTop, 0.01, () => M('__slat_backing', 0x2b211a), (leafFrom + roomW) / 2, leafTop, 0.022));
      for (let x = 1.985; x < roomW - 0.02; x += 0.062) {
        if (x + 0.0225 <= leafFrom) root.add(box(0.045, ceiling - 0.01, 0.035, OAK, x, 0.005, 0.032, 0.004));
        else { root.add(box(0.045, ceiling - leafTop - 0.01, 0.035, OAK, x, leafTop, 0.032, 0.004)); root.add(box(0.045, leafTop - 0.005, 0.003, OAK, x, 0.005, SKIN)); }
      }
      // TV backlight halo (sync lights follow the game)
      const tw4 = tvInch * 0.0254 * 0.8716, th4 = tvInch * 0.0254 * 0.4903;
      // one soft backlight glow behind the TV (rounded, blurred edge), additive, follows moods; the TV's own sync LEDs drive the game colours
      const gw4 = tw4 + 0.7, gh4 = th4 + 0.55, glowTex = canvasTex(512, Math.round(512 * gh4 / gw4), (x, w, h) => { x.clearRect(0, 0, w, h); x.shadowColor = '#fff'; x.shadowBlur = 60; x.fillStyle = '#fff'; const ix = w * 0.35 / gw4 * 0.9, iy = h * 0.275 / gh4 * 0.9; x.fillRect(ix + 20, iy + 20, w - 2 * ix - 40, h - 2 * iy - 40); x.shadowBlur = 25; x.fillRect(ix + 20, iy + 20, w - 2 * ix - 40, h - 2 * iy - 40); });
      const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffb866, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, name: '__tv_backlight_glow' }); moods.halos.push(glowMat);
      const glowM = new THREE.Mesh(new THREE.PlaneGeometry(gw4, gh4), glowMat); glowM.position.set(tvCx, tvCy, 0.0135); root.add(glowM);
      // three floating oak shelves on the left (end at 0.42 m)
      for (const sy4 of [1.3, 1.62, 1.95]) { root.add(box(0.36, 0.035, 0.2, OAK, 0.25, sy4, 0.012, 0.004)); }
      const sp4 = potPlant(0.18, 0xefe9df, 0.05); sp4.position.set(0.17, 1.985, 0.11); root.add(sp4); root.add(loose(cyl(0.03, 0.03, 0.07, () => M('__candle_glass', 0xd9cbb2), 0.35, 1.985, 0.11, 16)));
      for (let k = 0; k < 3; k++) root.add(loose(box(0.2, 0.022, 0.14, () => M('__book_slate_' + k, [0xefe6d8, 0x8f8378, 0x3a3631][k]), 0.22, 1.655 + k * 0.022, 0.06))); root.add(loose(cyl(0.025, 0.03, 0.05, () => M('__candle_amber', 0xc08a4a), 0.36, 1.655, 0.11, 14)));
      const jug2 = g(); const jb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 12), M('__jug_cream', 0xefe9df)); jb.scale.y = 1.1; jb.position.y = 0.06; jug2.add(jb); jug2.add(cyl(0.022, 0.03, 0.06, () => M('__jug_cream', 0xefe9df), 0, 0.11, 0, 14)); jug2.position.set(0.18, 1.335, 0.11); root.add(loose(jug2)); root.add(loose(cyl(0.025, 0.025, 0.06, () => M('__candle_glass', 0xd9cbb2), 0.35, 1.335, 0.11, 14)));
      // fiddle-leaf fig in a terracotta pot beside the slats (> 1.2 m from the door hinge)
      const fig2 = g(); fig2.add(cyl(0.17, 0.13, 0.36, () => M('__terracotta_pot', 0xb8724a), 0, 0, 0, 24)); fig2.add(cyl(0.012, 0.015, 1.1, () => M('__fig_trunk', 0x5a4632), 0, 0.36, 0, 8));
      for (let k = 0; k < 22; k++) { const a = k * 2.39, lf = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), (k % 3 ? LEAF : LEAF2)()); lf.scale.set(0.85, 1.55, 0.16); lf.rotation.set(0.5 * Math.sin(k) - 0.3, a, 0.4 * Math.cos(k)); lf.position.set(Math.cos(a) * (0.12 + (k % 4) * 0.03), 0.95 + (k / 22) * 0.75, Math.sin(a) * (0.12 + (k % 4) * 0.03)); fig2.add(lf); }
      fig2.position.set(2.28, 0, 0.36); root.add(loose(fig2));
      const cv4 = ledStrip({ w: bw, wash: 0.45, dir: 'down', alpha: 0.3 }); cv4.obj.position.set(bc, ceiling - 0.03, 0.02); root.add(cv4.obj); moods.strips.push(...cv4.moods.strips); moods.halos.push(...cv4.moods.halos);
    } else if (CHO) {                                                            // owner reference: charcoal feature wall, dark fluted strip, honey-oak floating shelves with downlight pools
      const HO = OAK;   // real oak grain (baked photo material)
      root.add(box(bw, ceiling, 0.012, () => M('__charcoal_feature', 0x3b3a3a), bc, 0, 0));
      for (let x = 0.015; x < 0.26; x += 0.03) root.add(box(0.022, ceiling - 0.01, 0.025, () => M('__charcoal_flute', 0x2a2a2b), x, 0.005, 0.012, 0.004));
      // long top shelf with five downlights → light pools on the charcoal wall
      // downlight pool on the wall: soft cone (narrow + bright under the light, fanning out and fading), additive, follows the moods
      const poolTex = canvasTex(128, 256, (x, w, h) => { for (let yy = 0; yy < h; yy++) { const t2 = yy / h, half = 6 + t2 * w * 0.45, a = Math.pow(1 - t2, 1.6) * 0.9; const gr = x.createLinearGradient(w / 2 - half, 0, w / 2 + half, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(w / 2 - half, yy, half * 2, 1); } });
      const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, color: 0xffd9a8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, name: '__downlight_pool' }); moods.halos.push(poolMat);
      const poolMesh = (x, yTop) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.95), poolMat); m.position.set(x, yTop - 0.475, 0.0135); return m; };
      // owner: fill the whole wall → the shelf runs to the corner just above the door (2.36 m)
      const sx0 = 0.3, sx1 = roomW - 0.04, sy = leafTop + 0.04; root.add(box(sx1 - sx0, 0.05, 0.26, HO, (sx0 + sx1) / 2, sy, 0.012, 0.004));
      for (let k = 0; k < 7; k++) { const lx = sx0 + 0.22 + k * (sx1 - sx0 - 0.44) / 6, dl = led(0xfff0d8, 3); moods.strips.push(dl); root.add(cyl(0.022, 0.022, 0.004, dl, lx, sy - 0.003, 0.17, 18));
        root.add(poolMesh(lx, sy - 0.006)); }
      // decor on the top shelf: plant, little figurines, jug, framed postcard, mini tower
      const tp2 = potPlant(0.2, 0x2f2f30, 0.06); tp2.position.set(1.15, sy + 0.05, 0.12); root.add(tp2);
      for (const [fx, c, hh] of [[0.45, 0xc0392b, 0.08], [0.55, 0x8a5a33, 0.06], [1.62, 0x5a6b7a, 0.1], [1.75, 0xd9c3a3, 0.07], [2.25, 0x6b4a32, 0.09]]) root.add(loose(cyl(0.025, 0.03, hh, () => M('__fig_' + c.toString(16), c), fx, sy + 0.05, 0.13, 14)));
      root.add(loose(cyl(0.035, 0.04, 0.1, () => M('__jug_copper', 0x9c5b34), 0.8, sy + 0.05, 0.12, 16)));
      const tw3 = g(); tw3.add(cyl(0.004, 0.035, 0.22, PS5B, 0, 0, 0, 4)); tw3.position.set(1.95, sy + 0.05, 0.12); root.add(loose(tw3));
      const pc = box(0.14, 0.1, 0.012, () => M('__postcard', 0x6f8fa8), 2.1, sy + 0.05, 0.06); pc.rotation.x = -0.15; root.add(loose(pc));
      const tp3 = potPlant(0.22, 0x2f2f30, 0.065); tp3.position.set(3.0, sy + 0.05, 0.12); root.add(tp3); for (const [fx, c, hh] of [[2.75, 0x9c5b34, 0.09], [3.3, 0xd9c3a3, 0.07], [3.42, 0x5a6b7a, 0.11]]) root.add(loose(cyl(0.025, 0.03, hh, () => M('__fig_' + c.toString(16), c), fx, sy + 0.05, 0.13, 14)));
      // two small floating shelves right of the TV (doll, plant), a switch plate between them, warm backlight
      for (const [yy, item] of [[1.55, 'doll'], [1.15, 'plate']]) { root.add(box(0.3, 0.04, 0.2, HO, 2.27, yy, 0.012, 0.004)); const ul = led(0xffc88a, 2.2); moods.strips.push(ul); root.add(box(0.26, 0.006, 0.01, ul, 2.27, yy - 0.006, 0.16));
        if (item === 'doll') { const dl2 = g(); dl2.add(cyl(0.03, 0.04, 0.08, () => M('__doll_pink', 0xd9a0a8), 0, 0, 0, 14)); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), M('__doll_skin', 0xe8c4a0)); hd.position.y = 0.1; dl2.add(hd); dl2.position.set(2.3, yy + 0.04, 0.1); root.add(loose(dl2)); root.add(loose(box(0.1, 0.03, 0.06, () => M('__box_white', 0xf2efe9), 2.17, yy + 0.04, 0.1, 0.008))); } }
      root.add(box(0.12, 0.12, 0.008, () => M('__switch_plate_dark', 0x2a2a2b), 2.27, 1.32, 0.012)); for (const ox of [-0.025, 0.025]) root.add(box(0.035, 0.05, 0.004, () => M('__switch_rocker', 0x4a4a4b), 2.27 + ox, 1.355, 0.02));
      // tall potted bamboo palm in the corner
      const bam = g(); bam.add(cyl(0.12, 0.1, 0.28, () => M('__pot_grey', 0x6b6a68), 0, 0, 0, 20)); for (let k = 0; k < 5; k++) { const st = cyl(0.008, 0.008, 1.3 + k * 0.08, () => M('__bamboo_stem', 0x7c8a4a), (k - 2) * 0.03, 0.28, (k % 2) * 0.03, 8); st.rotation.z = (k - 2) * 0.05; bam.add(st);
        for (let j = 0; j < 11; j++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), (j % 2 ? LEAF : LEAF2)()); lf.scale.set(1.9, 0.18, 0.5); lf.rotation.set(0.3 * Math.sin(j), j * 1.3 + k, -0.35); lf.position.set((k - 2) * 0.03 + Math.cos(j * 1.3 + k) * 0.13, 0.55 + j * 0.085 + k * 0.03, Math.sin(j * 1.3 + k) * 0.13); bam.add(lf); } }
      bam.position.set(0.17, 0, 0.32); root.add(loose(bam));
    } else if (HER) {                                                            // owner reference: Indian heritage — off-white wall, teak beams, drum shelves, bead chain, teak inlay frame
      const TK = () => M('__teak_dark', 0x4e2c18), WALL = () => M('__heritage_offwhite', 0xe6dccd);
      root.add(box(bw, ceiling, 0.012, WALL, bc, 0, 0));
      // ceiling: teak wall beam on brackets + cross-beam stubs (stop at 0.42 m: the projector screen cassette is right in front)
      root.add(box(roomW, 0.16, 0.14, TK, roomW / 2, ceiling - 0.16, 0.012, 0.006));   // owner: design fills the whole wall → beam runs wall to wall (above the door)
      for (const bx3 of [0.42, 1.42, 2.42, 3.42]) { root.add(box(0.12, 0.15, 0.42, TK, bx3, ceiling - 0.15, 0.012, 0.006)); const br2 = box(0.1, 0.12, 0.06, TK, bx3, ceiling - 0.28, 0.012, 0.01); root.add(br2); }
      // left: three teak shelves (drums, drums, brass figurines) ending at 0.72 m, wooden bead chain, display ledge with a waterfall end down to the floor
      for (const [sy3, sd] of [[2.25, 0.28], [1.85, 0.28], [1.45, 0.2]]) root.add(box(0.67, 0.035, sd, TK, 0.385, sy3, 0.012, 0.004));
      const drum = (r1, len, upright) => { const d2 = g(), shellM = () => M('__drum_shell', 0x5a3620), skin = () => M('__drum_skin', 0xefe6d6), lace = new THREE.MeshStandardMaterial({ roughness: 0.8, name: '__drum_lace', transparent: true, map: canvasTex(256, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#f3ede2'; x.lineWidth = 2.5; for (let k = 0; k < 20; k++) { x.beginPath(); x.moveTo(k * 13, 0); x.lineTo(k * 13 + 13, h); x.moveTo(k * 13 + 13, 0); x.lineTo(k * 13, h); x.stroke(); } }) });
        const sh = cyl(r1 * 0.92, r1, len, shellM, 0, 0, 0, 24); d2.add(sh); const lc = new THREE.Mesh(new THREE.CylinderGeometry(r1 * 0.94, r1 * 1.02, len * 0.96, 24, 1, true), lace); lc.position.y = len / 2; d2.add(lc);
        const top = cyl(r1 * 0.9, r1 * 0.9, 0.006, skin, 0, len, 0, 24); d2.add(top); const dot = cyl(r1 * 0.3, r1 * 0.3, 0.003, () => M('__drum_syahi', 0x1d1b19), 0, len + 0.006, 0, 18); d2.add(dot);
        if (!upright) d2.rotation.z = Math.PI / 2; return loose(d2); };
      const d1 = drum(0.07, 0.2, true); d1.position.set(0.15, 2.285, 0.15); root.add(d1); const d2b = drum(0.065, 0.24, true); d2b.position.set(0.45, 2.285, 0.15); root.add(d2b);
      const d3 = drum(0.09, 0.26, false); d3.position.set(0.3, 1.885 + 0.09, 0.15); root.add(d3); const d4 = drum(0.08, 0.16, true); d4.position.set(0.56, 1.885, 0.15); root.add(d4);
      const brassFig = (x2, y2, z2, h2) => { const f = g(); f.add(cyl(0.012, 0.016, 0.01, BRASS, 0, 0, 0, 10)); const b3 = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), BRASS()); b3.scale.y = h2 / 0.03; b3.position.y = 0.01 + h2 / 2; f.add(b3); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.01, 10, 8), BRASS()); hd.position.y = 0.01 + h2 + 0.008; f.add(hd); f.position.set(x2, y2, z2); root.add(loose(f)); };
      for (let k = 0; k < 7; k++) brassFig(0.1 + k * 0.085, 1.485, 0.1, 0.04 + (k % 3) * 0.012);
      for (const bx4 of [0.18, 0.3, 0.42, 0.55]) brassFig(bx4, 0.815, 0.18, 0.035);
      const cart = g(); cart.add(box(0.16, 0.012, 0.07, () => M('__toy_cart', 0x8a2e1e), 0, 0.03, 0)); for (const wx of [-0.06, 0.06]) { const wh = cyl(0.025, 0.025, 0.008, () => M('__toy_wheel', 0x3a2416), wx, 0.025, 0.04, 14); wh.rotation.x = Math.PI / 2; cart.add(wh); } cart.add(box(0.1, 0.05, 0.004, BRASS, 0, 0.042, -0.03)); cart.position.set(0.32, 0.815, 0.12); root.add(loose(cart));
      // ledge 0.78 m with a rounded waterfall corner down to the floor at its right end
      const lx1 = 0.84, ly = 0.78, lr = 0.08, ls = new THREE.Shape(); ls.moveTo(0.05, ly); ls.lineTo(lx1 - lr, ly); ls.absarc(lx1 - lr, ly - lr, lr, Math.PI / 2, 0, true); ls.lineTo(lx1, 0.0); ls.lineTo(lx1 - 0.035, 0.0); ls.lineTo(lx1 - 0.035, ly - lr); ls.absarc(lx1 - lr, ly - lr, lr - 0.035, 0, Math.PI / 2, false); ls.lineTo(0.05, ly - 0.035); ls.lineTo(0.05, ly);
      const lm2 = new THREE.Mesh(new THREE.ExtrudeGeometry(ls, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 16 }), TK()); lm2.position.z = 0.012; root.add(lm2);
      // wooden bead chain (ceiling → ledge) at the shelves' front corner
      const ch3 = g(); ch3.add(cyl(0.004, 0.004, ceiling - 0.16 - ly, PS5B, 0, ly, 0, 6));
      for (const cy3 of [2.55, 2.12, 1.72, 1.2]) for (let k = 0; k < 5; k++) { const bd2 = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.022, 16), M('__bead_wood', 0x7a3f22)); bd2.position.y = cy3 + k * 0.024; ch3.add(bd2); }
      ch3.position.set(0.68, 0, 0.27); root.add(loose(ch3));
      // teak inlay frame line around the TV + small cane square at the corner
      root.add(box(0.025, 2.2 - 0.62, 0.012, TK, 0.95, 0.62, 0.012)); root.add(box(leafFrom - 0.95, 0.025, 0.012, TK, (0.95 + leafFrom) / 2, 2.2, 0.012));   // runs on to the door-leaf zone
      root.add(box(0.15, 0.15, 0.016, TK, 0.95, 2.15, 0.012)); const cs = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), caneMat()); cs.position.set(0.95, 2.225, 0.03); root.add(cs);
      // warm wall washers from the beam + soft glow under the shelves (lighting soul)
      const bw2 = ledStrip({ w: roomW - 0.1, wash: 0.6, dir: 'down', alpha: 0.32 }); bw2.obj.position.set(roomW / 2, ceiling - 0.17, 0.02); root.add(bw2.obj); moods.strips.push(...bw2.moods.strips); moods.halos.push(...bw2.moods.halos);
      for (const sy3 of [2.25, 1.85, 1.45]) { const sl = led(0xffc27a, 2.2); moods.strips.push(sl); root.add(box(0.6, 0.006, 0.01, sl, 0.385, sy3 - 0.008, 0.18)); }
      // ---- owner 2026-11-10: extend to the whole wall without blocking the door ----
      // above the door (leaf top 2.29 m): a high teak display shelf at 2.36 m with drums + brass diyas, lit underneath
      const hx0 = deepTo + 0.19, hx1 = roomW - 0.04; root.add(box(hx1 - hx0, 0.035, 0.24, TK, (hx0 + hx1) / 2, leafTop + 0.04, 0.012, 0.004));
      const hl3 = led(0xffc27a, 2.2); moods.strips.push(hl3); root.add(box(hx1 - hx0 - 0.08, 0.006, 0.01, hl3, (hx0 + hx1) / 2, leafTop + 0.032, 0.2));
      const d5 = drum(0.07, 0.24, false); d5.position.set(hx0 + 0.28, leafTop + 0.075 + 0.07, 0.15); root.add(d5); const d6 = drum(0.06, 0.16, true); d6.position.set(hx0 + 0.55, leafTop + 0.075, 0.15); root.add(d6);
      for (const dx of [hx0 + 0.72, hx0 + 0.82]) { const dy3 = g(); const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), BRASS()); bowl.position.y = 0.035; dy3.add(bowl); const fl5 = led(0xffb060, 2.6); moods.strips.push(fl5); const flame = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), fl5); flame.scale.y = 1.8; flame.position.set(0.02, 0.05, 0); dy3.add(flame); dy3.position.set(dx, leafTop + 0.075, 0.15); root.add(loose(dy3)); }
      // in the door-leaf zone (x ≥ leafFrom, below leafTop): only flat finishes ≤ 7 mm — the open door rests over them
      const FL = 0.003, fz = SKIN;
      root.add(box(roomW - leafFrom, 0.025, FL, TK, (leafFrom + roomW) / 2, 2.2, fz));                                    // teak inlay line continues to the corner
      root.add(box(0.025, 2.2 - 0.62, FL, TK, roomW - 0.12, 0.62, fz));                                           // and turns down at the corner (mirror of the TV-side L)
      root.add(box(0.15, 0.15, FL, TK, roomW - 0.12, 2.15, fz)); const cs2 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), caneMat()); cs2.position.set(roomW - 0.12, 2.225, fz + FL + 0.001); root.add(cs2);
      const tx2 = 2.86, tx3 = 3.4, ty2 = 0.95, ty3 = 2.02, blk = canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#efe5d3'; x.fillRect(0, 0, w, h);
        for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { const cx2 = c * 64 + 32 + (r % 2) * 32, cy2 = r * 64 + 32; x.fillStyle = r % 2 ? '#7a2e1e' : '#2e3f5c'; x.beginPath(); x.ellipse(cx2, cy2, 14, 22, 0.6, 0, 7); x.fill(); x.fillStyle = '#efe5d3'; x.beginPath(); x.arc(cx2 + 3, cy2 - 5, 5, 0, 7); x.fill();
          x.fillStyle = '#b07a3a'; for (let p = 0; p < 6; p++) { x.beginPath(); x.arc(cx2 + Math.cos(p) * 24, cy2 + Math.sin(p) * 24, 2.5, 0, 7); x.fill(); } }
        x.strokeStyle = '#7a2e1e'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20); });
      for (const [w3, h3, x3, y3] of [[tx3 - tx2 + 0.05, 0.025, (tx2 + tx3) / 2, ty2 - 0.025], [tx3 - tx2 + 0.05, 0.025, (tx2 + tx3) / 2, ty3], [0.025, ty3 - ty2 + 0.025, tx2 - 0.0125, ty2 - 0.025], [0.025, ty3 - ty2 + 0.025, tx3 + 0.0125, ty2 - 0.025]]) root.add(box(w3, h3, FL, TK, x3, y3, fz));
      const tp = new THREE.Mesh(new THREE.PlaneGeometry(tx3 - tx2, ty3 - ty2), new THREE.MeshStandardMaterial({ map: blk, roughness: 0.95, name: '__block_print_textile' })); tp.position.set((tx2 + tx3) / 2, (ty2 + ty3) / 2, fz + 0.002); root.add(tp);
      const tw2 = ledStrip({ w: tx3 - tx2, wash: 0.5, dir: 'down', alpha: 0.35 }); tw2.obj.position.set((tx2 + tx3) / 2, leafTop + 0.025, 0.013); root.add(tw2.obj); moods.halos.push(...tw2.moods.halos); moods.strips.push(...tw2.moods.strips);   // grazes the textile from the shelf above
    } else if (PILL) {                                                           // owner reference: greige panels, walnut pill shelf tower = gaming storage, ivory fluted panel, white console
      root.add(box(bw, ceiling, 0.012, () => M('__greige_panel_warm', 0xd2c3ad), bc, 0, 0));
      for (const jx of [0.3, 2.66]) root.add(box(0.004, ceiling, 0.004, () => M('__panel_joint', 0x8a7d6c), jx, 0, 0.012));
      const cv2 = ledStrip({ w: bw + 0.2, wash: 0.55, dir: 'down', alpha: 0.4 }); cv2.obj.position.set(bc + 0.1, ceiling - 0.03, 0.02); root.add(cv2.obj); moods.strips.push(...cv2.moods.strips); moods.halos.push(...cv2.moods.halos);
      // ivory panel behind the TV: rounded bottom-right corner, two shallow joints, vertical flutes on its left part
      const IV = () => M('__ivory_lacquer', 0xefe8dc), ip0 = 0.62, ip1 = 2.62, iy0 = 0.66, iy1 = ceiling - 0.1, ir = 0.26, ips = new THREE.Shape();
      ips.moveTo(ip0, iy0); ips.lineTo(ip1 - ir, iy0); ips.absarc(ip1 - ir, iy0 + ir, ir, -Math.PI / 2, 0, false); ips.lineTo(ip1, iy1); ips.lineTo(ip0, iy1); ips.lineTo(ip0, iy0);
      const ipm = new THREE.Mesh(new THREE.ExtrudeGeometry(ips, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 24 }), IV()); ipm.position.z = 0.012; root.add(ipm);
      for (const jx of [1.62, 2.12]) root.add(box(0.004, iy1 - iy0 - 0.02, 0.003, () => M('__panel_joint_light', 0xcfc6b8), jx, iy0 + 0.01, 0.045));
      for (let x = 0.86; x < 1.16; x += 0.02) { const fl2 = cyl(0.009, 0.009, iy1 - iy0 - 0.04, IV, x, iy0 + 0.02, 0.046, 10); root.add(fl2); }
      // walnut pill tower (open shelves, rounded bottom) — owner: PlayStation, remotes, chargers and speakers live here
      const tx0 = 0.35, tx1 = 0.81, tw = tx1 - tx0, txc = (tx0 + tx1) / 2, tr = tw / 2, ty0 = 0.72, ft = 0.025, TD2 = 0.36;
      const tsh = new THREE.Shape(); tsh.moveTo(tx0, ceiling); tsh.lineTo(tx0, ty0 + tr); tsh.absarc(txc, ty0 + tr, tr, Math.PI, 2 * Math.PI, false); tsh.lineTo(tx1, ceiling); tsh.lineTo(tx0, ceiling);
      const shelves = [1.06, 1.54, 1.78, 2.02, 2.38];                      // shelf undersides: speaker | PS5 (0.455) | dock (0.215) | remotes + chargers (0.215) | books | decor
      const bays = [[ty0 + ft, shelves[0]], ...shelves.map((y, i) => [y + ft, i + 1 < shelves.length ? shelves[i + 1] : ceiling - ft])];
      bays.forEach(([a, b2], i) => { const hp = new THREE.Path(); if (i === 0) { hp.moveTo(tx0 + ft, b2); hp.lineTo(tx0 + ft, ty0 + tr); hp.absarc(txc, ty0 + tr, tr - ft, Math.PI, 2 * Math.PI, false); hp.lineTo(tx1 - ft, b2); hp.lineTo(tx0 + ft, b2); } else { hp.moveTo(tx0 + ft, a); hp.lineTo(tx1 - ft, a); hp.lineTo(tx1 - ft, b2); hp.lineTo(tx0 + ft, b2); hp.lineTo(tx0 + ft, a); } tsh.holes.push(hp); });
      const tm = new THREE.Mesh(new THREE.ExtrudeGeometry(tsh, { depth: TD2, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 32 }), WOOD()); tm.position.z = 0.012; root.add(tm);
      // back panels: walnut, the PS5 bay gets a perforated (vent) back with a 40 mm air gap to the wall chase
      const perf = new THREE.MeshStandardMaterial({ roughness: 0.6, name: '__vent_perforated', map: canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#4a3426'; x.fillRect(0, 0, w, h); x.fillStyle = '#0d0b09'; for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) { x.beginPath(); x.arc(c * 8 + 4 + (r % 2) * 4, r * 8 + 4, 2.2, 0, 7); x.fill(); } }) });
      bays.forEach(([a, b2], i) => { if (i === 0) return; root.add(box(tw - 2 * ft, b2 - a, 0.008, i === 1 ? perf : WOOD, txc, a, i === 1 ? 0.052 : 0.014)); if (i === 1) root.add(box(tw - 2 * ft, b2 - a, 0.006, PS5B, txc, a, 0.012)); });
      bays.forEach(([a, b2], i) => { const sl = led(0xffc27a, 2.4); moods.strips.push(sl); root.add(box(tw - 0.07, 0.006, 0.01, sl, txc, b2 - 0.008, 0.32));
        const ws = ledStrip({ w: tw - 0.06, wash: Math.min(0.3, b2 - a - 0.02), dir: 'down', alpha: 0.45 }); ws.obj.position.set(txc, b2 - 0.01, 0.062); root.add(ws.obj); moods.halos.push(...ws.moods.halos); moods.strips.push(...ws.moods.strips);
        root.add(cyl(0.018, 0.018, 0.004, PS5B, tx1 - 0.06, a + 0.001, 0.08, 16)); });           // cable grommet in every bay → hidden vertical cable channel behind the tower
      root.add(box(0.06, ceiling - ty0 - 0.3, 0.03, () => M('__cable_channel', 0x2a1f18), tx1 - 0.06, ty0 + 0.3, 0.012));
      // bay 0 (rounded bottom): flat insert + retro portable speaker (generic, brown leather + brass grille)
      root.add(box(0.37, 0.02, TD2 - 0.02, WOOD, txc, 0.86, 0.022));
      const spk = g(); spk.add(box(0.3, 0.17, 0.14, () => M('__speaker_leather', 0x3a2c22), 0, 0, 0, 0.012)); spk.add(box(0.27, 0.12, 0.004, () => M('__speaker_grille_brass', 0xa8915f), 0, 0.022, 0.14));
      const hnd = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 8, 20, Math.PI), M('__speaker_leather', 0x3a2c22)); hnd.position.set(0, 0.17, 0.07); spk.add(hnd);
      for (const kx of [-0.06, 0.06]) { const kn = cyl(0.008, 0.008, 0.012, BRASS, kx, 0.15, 0.1, 12); spk.add(kn); }
      spk.position.set(txc, 0.88, 0.1); root.add(loose(spk));
      // bay 1: PS5 Slim upright on its stand (open front + vented back) + Apple TV
      const p5 = ps5Slim(); p5.position.set(txc - 0.09, bays[1][0], 0.08); root.add(p5);
      root.add(loose(box(0.093, 0.031, 0.093, PS5B, txc + 0.11, bays[1][0], 0.18, 0.008)));
      // bay 2: DualSense charging station with both controllers
      const dk3 = dualSenseDock(); dk3.position.set(txc, bays[2][0], 0.16); root.add(dk3);
      // bay 3: remotes + chargers — TV remote, Apple TV remote, wireless charging pad, 4-port USB-C charger with cables into the grommet
      const by3 = bays[3][0];
      root.add(loose(box(0.045, 0.018, 0.17, PS5B, txc - 0.14, by3, 0.12, 0.006)));                                   // TV remote
      root.add(loose(box(0.035, 0.009, 0.135, SILVER, txc - 0.08, by3, 0.14, 0.004)));                                 // Apple TV remote
      root.add(loose(cyl(0.05, 0.05, 0.01, () => M('__charger_pad', 0xe9e6e0), txc + 0.03, by3, 0.2, 28)));             // wireless pad
      root.add(loose(box(0.07, 0.03, 0.07, () => M('__charger_brick', 0xf2f1ee), txc + 0.14, by3, 0.1, 0.008)));          // USB-C charger
      for (let k = 0; k < 3; k++) { const cb = cyl(0.003, 0.003, 0.12, () => M('__cable_white', 0xeeeeea), 0, 0, 0, 6); cb.rotation.x = Math.PI / 2; cb.position.set(txc + 0.12 + k * 0.015, by3 + 0.012, 0.19); root.add(loose(cb)); }
      // bay 4: books + Wi-Fi router lying behind them; bay 5: decor (vases, globe on a stand)
      for (let k = 0; k < 5; k++) root.add(loose(box(0.03, 0.22 + (k % 2) * 0.03, 0.17, () => M('__book_pill_' + k, [0xe9e1cf, 0x8f8378, 0xd9cbb2, 0x6b4a32, 0xefe6d8][k]), tx0 + 0.07 + k * 0.034, bays[4][0], 0.16)));
      root.add(loose(box(0.2, 0.035, 0.14, PS5B, txc + 0.08, bays[4][0], 0.03, 0.01)));
      root.add(loose(cyl(0.04, 0.05, 0.2, () => M('__vase_cream', 0xe9dfcf), tx0 + 0.11, bays[5][0], 0.18, 18)));
      const glb2 = g(); glb2.add(cyl(0.004, 0.012, 0.12, BRASS, 0, 0, 0, 10)); const gs = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 12), M('__globe_white', 0xf3efe6)); gs.position.y = 0.17; glb2.add(gs); glb2.position.set(txc + 0.1, bays[5][0], 0.18); root.add(loose(glb2));
    } else if (WAVE) {                                                           // owner reference: beige panels, mosaic strip, walnut desk flowing into a blue fluted wave, ring chandelier
      root.add(box(bw, ceiling, 0.012, () => M('__greige_panel', 0xcbbda6), bc, 0, 0));
      for (const jx of [0.62, 1.1, 2.05]) root.add(box(0.004, ceiling, 0.004, () => M('__panel_joint', 0x8a7d6c), jx, 0, 0.012));
      // vertical mosaic strip with LED lines either side
      const mos = canvasTex(64, 512, (x, w, h) => { x.fillStyle = '#6f5a45'; x.fillRect(0, 0, w, h); const c = 10.6; for (let r = 0; r < h / c; r++) for (let k = 0; k < w / c; k++) { const v = 150 + ((r * 7 + k * 13) % 5) * 10; x.fillStyle = `rgb(${v + 20},${v},${v - 30})`; x.fillRect(k * c + 1, r * c + 1, c - 2, c - 2); } });
      const mm = new THREE.Mesh(new THREE.BoxGeometry(0.26, ceiling - 0.02, 0.01), new THREE.MeshStandardMaterial({ map: mos, roughness: 0.4, name: '__mosaic_strip' })); mm.position.set(0.48, (ceiling - 0.02) / 2 + 0.01, 0.017); root.add(mm);
      for (const lx of [0.345, 0.615]) { const ml2 = led(0xffc27a, 2.6); syncAll.push(ml2); root.add(box(0.006, ceiling - 0.1, 0.006, ml2, lx, 0.05, 0.016)); }
      const scn = g(); scn.add(box(0.07, 0.03, 0.04, () => M('__bronze', 0x6b4a32), 0, 0, 0)); const gl3 = led(0xffd9a8, 2.4); moods.strips.push(gl3); scn.add(cyl(0.035, 0.035, 0.15, gl3, 0, 0.03, 0.06, 20)); scn.add(cyl(0.037, 0.037, 0.03, () => M('__bronze', 0x6b4a32), 0, 0.03, 0.06, 20)); scn.position.set(0.18, 1.48, 0.012); root.add(loose(scn));
      // walnut desk band: flat desk on the left (top 0.76 m) dipping into a trough under the wave and flaring up at the right end (≤ 2.64 m)
      const yb = new THREE.SplineCurve([[0.06, 0.76], [1.12, 0.76], [1.32, 0.72], [1.5, 0.56], [1.7, 0.46], [2.0, 0.44], [2.3, 0.48], [2.5, 0.6], [2.64, 0.64]].map(([x, y]) => new THREE.Vector2(x, y)));
      const bp = yb.getSpacedPoints(120), bs = new THREE.Shape(); bs.moveTo(bp[0].x, bp[0].y); bp.slice(1).forEach(p => bs.lineTo(p.x, p.y)); [...bp].reverse().forEach(p => bs.lineTo(p.x, p.y - 0.035)); bs.lineTo(bp[0].x, bp[0].y);
      const band = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 }), WOOD()); band.position.z = 0.012; root.add(band);
      const ybAt = x => { let best = bp[0]; for (const p of bp) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p; return best.y; };
      const wt = new THREE.SplineCurve([[1.4, 0.66], [1.65, 0.53], [1.92, 0.58], [2.12, 0.78], [2.3, 1.06], [2.44, 1.16], [2.54, 1.08], [2.6, 0.86], [2.63, 0.68]].map(([x, y]) => new THREE.Vector2(x, y)));
      const wp = wt.getSpacedPoints(160), wtAt = x => { let best = wp[0]; for (const p of wp) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p; return best.y; };
      // upholstered fluted wave: vertical channels in deep teal with a lighter stripe, each cut to the wave line
      const NV = () => M('__teal_fluted_fabric', 0x23465a), NL = () => M('__teal_fluted_light', 0x4d7a8c);
      for (let x = 1.43, k = 0; x < 2.62; x += 0.026, k++) { const y0 = ybAt(x), y1 = wtAt(x); if (y1 - y0 < 0.03) continue; root.add(box(0.022, y1 - y0, 0.26, k % 3 === 2 ? NL : NV, x, y0, 0.03, 0.009)); }
      // LED: under the band (follows the curve) + halo behind the wave top onto the wall
      const ul = led(0xffc27a, 3); syncAll.push(ul); root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bp.map(p => new THREE.Vector3(p.x, p.y - 0.045, 0.2))), 160, 0.005, 6, false), ul));
      const hl2 = led(0xffc27a, 3); syncAll.push(hl2); root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wp.map(p => new THREE.Vector3(p.x, p.y + 0.004, 0.022))), 160, 0.005, 6, false), hl2));
      const fl = ledStrip({ w: bw + 0.15, wash: 0.4, dir: 'floor', alpha: 0.5 }); fl.obj.position.set(bc + 0.07, 0.066, 0.03); root.add(fl.obj); syncAll.push(...fl.moods.strips); moods.halos.push(...fl.moods.halos);
      // cream push-to-open cabinet under the desk: PS5 lies flat inside (15 mm breathing gap under the desk + open back to the ventilated chase), Apple TV, router
      caneConsole({ x0: 0.1, x1: 0.78, y0: 0.3, h: 0.39, wood: () => M('__cream_lacquer', 0xe9e1cf), sections: [{ type: 'cane', front: 'wood', w: 1, hinge: 'l', content: 'ps5', label: 'PS5 cabinet' }] });
      root.add(loose(box(0.093, 0.031, 0.093, PS5B, 0.69, 0.318, 0.26, 0.008))); root.add(loose(box(0.2, 0.035, 0.14, PS5B, 0.44, 0.318 + 0.1, 0.05, 0.01)));
      // desk dressing: laptop, bud vase, DualSense dock; vase on the wave shelf
      const lap = g(); lap.add(box(0.31, 0.012, 0.22, SILVER, 0, 0, 0, 0.004)); const scr = box(0.31, 0.2, 0.008, SILVER, 0, 0, 0, 0.003); scr.rotation.x = -0.25; scr.position.set(0, 0.11, 0.0); lap.add(scr); lap.position.set(0.52, 0.765, 0.12); root.add(loose(lap));
      const bv2 = g(); bv2.add(cyl(0.03, 0.04, 0.16, () => M('__glass_bud', 0xdfe6e2), 0, 0, 0, 16)); for (let k = 0; k < 4; k++) { const st = cyl(0.002, 0.002, 0.26, () => M('__dried_branch', 0x6b543f), 0, 0, 0, 5); st.position.set((k - 1.5) * 0.01, 0.26, 0); st.rotation.z = (k - 1.5) * 0.15; bv2.add(st); } bv2.position.set(0.2, 0.765, 0.16); root.add(loose(bv2));
      const dk2 = dualSenseDock(); dk2.position.set(0.98, 0.765, 0.12); root.add(dk2);
      root.add(loose(cyl(0.045, 0.06, 0.07, () => M('__vase_white', 0xf2eee8), 1.86, 0.45, 0.2, 20)));
      // ring chandelier with five globes (centred on the bed axis line in front of the wall; kept above the projector beam)
      const rc = g(), rr4 = 0.42, ry4 = ceiling - 0.22; const ring = new THREE.Mesh(new THREE.TorusGeometry(rr4, 0.008, 8, 80), BRASS()); ring.rotation.x = Math.PI / 2; ring.position.y = ry4; rc.add(ring);
      for (const a of [0, 2.1, 4.2]) rc.add(cyl(0.002, 0.002, ceiling - ry4, BRASS, Math.cos(a) * rr4, ry4, Math.sin(a) * rr4, 4));
      const gm4 = led(0xffe2b8, 2.2); moods.strips.push(gm4); for (let k = 0; k < 5; k++) { const a = k * 1.2566 + 0.3, gb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 12), gm4); gb.position.set(Math.cos(a) * rr4, ry4 - 0.07 - (k % 2) * 0.03, Math.sin(a) * rr4); rc.add(gb); rc.add(cyl(0.002, 0.002, 0.07, BRASS, gb.position.x, gb.position.y, gb.position.z, 4)); }
      rc.position.set(1.55, 0, 1.25); root.add(loose(rc));
    } else if (MID) {                                                            // owner reference: mid-century — beige wall, walnut slats, floating halo panel, long shelf, sconce
      root.add(box(bw, ceiling, 0.01, () => M('__warm_beige_wall', 0xd8c8b0), bc, 0, 0));
      root.add(box(1.58, ceiling - 0.6, 0.01, () => M('__slat_backing', 0x2b211a), 1.87, 0.6, 0.01));
      for (let x = 1.095; x < 2.65; x += 0.042) root.add(box(0.028, ceiling - 0.61, 0.03, WOOD, x, 0.6, 0.02, 0.003));
      const sw = ledStrip({ w: 1.56, wash: 0.5, dir: 'down', alpha: 0.35 }); sw.obj.position.set(1.87, ceiling - 0.03, 0.06); root.add(sw.obj); moods.strips.push(...sw.moods.strips); moods.halos.push(...sw.moods.halos);
      // floating beige plaster panel behind the TV, glowing all round (halo = TV sync)
      const px0 = 0.72, px1 = 2.38, py0 = 0.78, py1 = 1.92; root.add(box(px1 - px0, py1 - py0, 0.04, () => M('__beige_plaster_panel', 0xcdbba0), (px0 + px1) / 2, py0, 0.05, 0.004));
      for (const [d2, y2, w2] of [['up', py1 + 0.002, px1 - px0 - 0.04], ['down', py0 - 0.002, px1 - px0 - 0.04]]) { const L2 = ledStrip({ w: w2, wash: d2 === 'up' ? 0.32 : 0.28, dir: d2, alpha: 0.6 }); L2.obj.position.set((px0 + px1) / 2, y2, 0.06); root.add(L2.obj); syncAll.push(...L2.moods.strips); moods.halos.push(...L2.moods.halos); }
      for (const sx of [px0, px1]) { const L3 = ledStrip({ w: py1 - py0 - 0.04, wash: 0.22, dir: 'up', alpha: 0.5 }); L3.obj.rotation.z = sx === px1 ? -Math.PI / 2 : Math.PI / 2; L3.obj.position.set(sx + (sx === px1 ? 0.002 : -0.002), (py0 + py1) / 2, 0.06); root.add(L3.obj); syncAll.push(...L3.moods.strips); moods.halos.push(...L3.moods.halos); }
      // long floating walnut shelf (ends at 2.62 — before the door-leaf zone)
      const shY = 2.12; root.add(box(2.5, 0.045, 0.24, WOOD, 1.37, shY, 0.012, 0.004));
      const pp = potPlant(0.2, 0x3e4a36, 0.065); pp.position.set(0.32, shY + 0.045, 0.13); root.add(pp); for (const [vx, vl, sd] of [[0.26, 0.75, 1], [0.38, 0.5, 2], [0.3, 0.35, 3]]) { const vv = vine(vl, sd); vv.position.set(vx, shY + 0.03, 0.24); root.add(vv); }
      for (let k = 0; k < 6; k++) root.add(loose(box(0.03, 0.2 + (k % 3) * 0.02, 0.15, () => M('__book_mid_' + k, [0x2e4a3a, 0xc4643c, 0xe9e1cf, 0x3b4a5e, 0xd9b44a, 0x6b4a32][k]), 0.62 + k * 0.034, shY + 0.045, 0.06)));
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 18, 12), BRASS()); orb.position.set(0.9, shY + 0.085, 0.13); root.add(loose(orb));
      const fp = potPlant(0.24, 0xe9e4da, 0.06); fp.position.set(1.42, shY + 0.045, 0.12); root.add(fp);
      const clk = g(); clk.add(box(0.2, 0.2, 0.04, () => M('__clock_wood', 0x6b4a32), 0, 0, 0, 0.02)); const face = cyl(0.085, 0.085, 0.004, () => M('__clock_face', 0xf3efe6), 0, 0, 0, 32); face.rotation.x = Math.PI / 2; face.position.set(0, 0.1, 0.042); clk.add(face);
      for (const [hl, ang] of [[0.05, 0.6], [0.07, 2.4]]) { const hand = box(0.004, hl, 0.002, PS5B, 0, 0, 0); hand.position.set(Math.sin(ang) * hl / 2, 0.1 + Math.cos(ang) * hl / 2, 0.046); hand.rotation.z = -ang; clk.add(hand); }
      clk.position.set(1.9, shY + 0.045, 0.06); root.add(loose(clk));
      const bird = g(); const bb2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 10), PS5B()); bb2.scale.set(1.6, 0.9, 0.8); bird.add(bb2); const bh = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), PS5B()); bh.position.set(0.06, 0.03, 0); bird.add(bh); const tl2 = box(0.06, 0.008, 0.03, PS5B, -0.08, 0.01, -0.015); tl2.rotation.z = 0.3; bird.add(tl2);
      bird.position.set(2.32, shY + 0.085, 0.13); root.add(loose(bird));
      // geometric art print (left) + brass globe sconce on the slats (right)
      const art = framedArt(0.42, 0.56, (x, w, h) => { x.fillStyle = '#efe6d4'; x.fillRect(0, 0, w, h); x.fillStyle = '#c4643c'; x.beginPath(); x.arc(w * 0.62, h * 0.24, w * 0.16, 0, 7); x.fill(); x.fillStyle = '#d9a93a'; x.beginPath(); x.arc(w * 0.5, h * 0.7, w * 0.22, Math.PI, 0); x.fill();
        x.fillStyle = '#2e4a3a'; x.beginPath(); x.arc(w * 0.7, h * 0.52, w * 0.17, -Math.PI / 2, Math.PI / 2); x.fill(); x.fillStyle = '#c4643c'; x.beginPath(); x.arc(w * 0.32, h * 0.52, w * 0.15, Math.PI / 2, -Math.PI / 2); x.fill(); }, 0xb08a5a);
      art.position.set(0.36, 1.12, 0.012); root.add(art);
      const sc2 = g(); sc2.add(box(0.07, 0.12, 0.02, BRASS, 0, 0, 0, 0.005)); const arm2 = cyl(0.006, 0.006, 0.12, BRASS, 0, 0, 0, 8); arm2.rotation.x = Math.PI / 2; arm2.position.set(0, 0.06, 0.08); sc2.add(arm2);
      const gm2 = led(0xffe2b8, 2.6); moods.strips.push(gm2); const glb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), gm2); glb.position.set(0, 0.14, 0.15); sc2.add(glb); sc2.position.set(2.5, 1.48, 0.05); root.add(loose(sc2));
    } else if (PEACH) {                                                          // owner reference: peach wall, cream arch panel with LED cove edge, curved lit shelves
      root.add(box(bw, ceiling, 0.01, PWALL, bc, 0, 0));
      const ax0 = bx0 + 0.08, ax1 = bx1 - 0.03, ay0 = 0.66, ay1 = 2.62, ar = 0.34, fw = 0.05, ir = ar - fw;
      const pan = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(ax1 - ax0, ay1 - ay0, ar, (ax0 + ax1) / 2, (ay0 + ay1) / 2), 24), PLAS()); pan.position.z = 0.011; root.add(pan);
      const fs = new THREE.Shape(); fs.moveTo(ax0, ay0); fs.lineTo(ax0, ay1 - ar); fs.absarc(ax0 + ar, ay1 - ar, ar, Math.PI, Math.PI / 2, true); fs.lineTo(ax1 - ar, ay1); fs.absarc(ax1 - ar, ay1 - ar, ar, Math.PI / 2, 0, true);
      fs.lineTo(ax1, ay0); fs.lineTo(ax1 - fw, ay0); fs.lineTo(ax1 - fw, ay1 - ar); fs.absarc(ax1 - ar, ay1 - ar, ir, 0, Math.PI / 2, false); fs.lineTo(ax0 + ar, ay1 - fw); fs.absarc(ax0 + ar, ay1 - ar, ir, Math.PI / 2, Math.PI, false); fs.lineTo(ax0 + fw, ay0); fs.lineTo(ax0, ay0);
      const frm = new THREE.Mesh(new THREE.ExtrudeGeometry(fs, { depth: 0.055, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 28 }), PLAS()); frm.position.z = 0.011; root.add(frm);
      const ip = new THREE.Path(), io = fw + 0.012, ri = ar - io; ip.moveTo(ax0 + io, ay0 + 0.03); ip.lineTo(ax0 + io, ay1 - ar); ip.absarc(ax0 + ar, ay1 - ar, ri, Math.PI, Math.PI / 2, true); ip.lineTo(ax1 - ar, ay1 - io); ip.absarc(ax1 - ar, ay1 - ar, ri, Math.PI / 2, 0, true); ip.lineTo(ax1 - io, ay0 + 0.03);
      const cl = led(0xffc27a, 2.8); syncAll.push(cl); root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ip.getPoints(16).map(p => new THREE.Vector3(p.x, p.y, 0.022)), false, 'centripetal'), 160, 0.005, 6, false), cl));
      const wash = ledStrip({ w: ax1 - ax0 - 0.24, wash: 0.85, dir: 'down', alpha: 0.42 }); wash.obj.position.set((ax0 + ax1) / 2, ay1 - io - 0.004, 0.013); root.add(wash.obj); syncAll.push(...wash.moods.strips); moods.halos.push(...wash.moods.halos);
      for (const sx of [-1, 1]) { const sw = ledStrip({ w: 1.2, wash: 0.22, dir: 'up', alpha: 0.3 }); sw.obj.rotation.z = sx * Math.PI / 2; sw.obj.position.set(sx < 0 ? ax0 + io : ax1 - io, ay0 + 0.75, 0.013); root.add(sw.obj); syncAll.push(...sw.moods.strips); moods.halos.push(...sw.moods.halos); }
      // curved floating shelves overlapping the arch's upper-right corner (as in the reference); mounted on the arch frame
      const s0 = bx1 - 0.43, s1 = bx1 - 0.01, sy0 = 1.86, sy1 = 2.58, sr = 0.16, sd = 0.21, sz = 0.07;
      const so = new THREE.Shape(); so.moveTo(s0, sy0); so.lineTo(s1, sy0); so.lineTo(s1, sy1 - sr); so.absarc(s1 - sr, sy1 - sr, sr, 0, Math.PI / 2, false); so.lineTo(s0, sy1); so.lineTo(s0, sy0);
      const h1 = new THREE.Path(); h1.moveTo(s0 + 0.025, sy0 + 0.025); h1.lineTo(s1 - 0.025, sy0 + 0.025); h1.lineTo(s1 - 0.025, 2.2); h1.lineTo(s0 + 0.025, 2.2); h1.lineTo(s0 + 0.025, sy0 + 0.025);
      const h2 = new THREE.Path(), hr = sr - 0.025; h2.moveTo(s0 + 0.025, 2.225); h2.lineTo(s1 - 0.025, 2.225); h2.lineTo(s1 - 0.025, sy1 - sr); h2.absarc(s1 - sr, sy1 - sr, hr, 0, Math.PI / 2, false); h2.lineTo(s0 + 0.025, sy1 - 0.025); h2.lineTo(s0 + 0.025, 2.225);
      so.holes.push(h1, h2);
      const sm = new THREE.Mesh(new THREE.ExtrudeGeometry(so, { depth: sd, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 20 }), PLAS()); sm.position.z = sz; root.add(sm);
      const sb = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(so.getPoints(20)), 20), PLAS()); sb.position.z = sz - 0.001; root.add(sb);
      root.add(box(0.04, sy1 - sy0, sz - 0.011, PLAS, s1 - 0.02, sy0, 0.011));                       // spacer to the wall where the shelf passes the arch
      for (const [w2, x2, y2] of [[s1 - s0 - 0.07, (s0 + s1) / 2, 2.2 - 0.007], [s1 - s0 - sr - 0.04, s0 + (s1 - s0 - sr) / 2, sy1 - 0.032]]) { const sl = led(0xffc27a, 2.4); moods.strips.push(sl); root.add(box(w2, 0.006, 0.01, sl, x2, y2, sz + sd - 0.04)); }
      root.add(loose(cyl(0.035, 0.05, 0.13, () => M('__terracotta_vase', 0xc77452), s0 + 0.12, sy0 + 0.028, sz + 0.1, 20)));
      root.add(loose(box(0.12, 0.15, 0.015, () => M('__frame_art_peach', 0xe9c9b0), s0 + 0.28, sy0 + 0.028, sz + 0.05, 0.003)));
      const pot = g(); pot.add(cyl(0.04, 0.032, 0.08, () => M('__cream_pot', 0xefe6d8), 0, 0, 0, 20));
      for (let k = 0; k < 9; k++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), M('__leaf_green', 0x6f8a4a)); lf.scale.set(1, 0.45, 0.7); lf.position.set(Math.cos(k * 2.4) * 0.05, 0.09 + (k % 3) * 0.02 - (k > 5 ? 0.12 : 0), Math.sin(k * 2.4) * 0.04); pot.add(lf); }
      pot.position.set(s0 + 0.11, 2.225 + 0.002, sz + 0.1); root.add(loose(pot));
      const cove = ledStrip({ w: bw, wash: 0.55, dir: 'down', alpha: 0.32 }); cove.obj.position.set(bc, ceiling - 0.03, 0.012); root.add(cove.obj); moods.strips.push(...cove.moods.strips); moods.halos.push(...cove.moods.halos);
    } else if (NEON) {                                                           // owner reference: warm-grey gaming wall, floating rounded panel with halo, neon signs, blue accents
      root.add(box(bw, ceiling, 0.012, NGR, bc, 0, 0));
      for (let x = bx0 + 0.3; x < bx1 - 0.1; x += 0.42) root.add(box(0.004, ceiling - 1.9, 0.004, NGRD, x, 1.9, 0.012));   // upper panel joints
      root.add(box(0.14, ceiling, 0.5, NGR, bx0 + 0.07, 0, 0, 0.06));                               // rounded pilaster (the tall unit's soft corner)
      const pcl = ledStrip({ w: 0.14, wash: 0.3, dir: 'down', alpha: 0.4 }); pcl.obj.position.set(bx0 + 0.07, ceiling - 0.02, 0.5); root.add(pcl.obj); moods.strips.push(...pcl.moods.strips); moods.halos.push(...pcl.moods.halos);
      const px0 = bx0 + 0.16, px1 = bx1 - 0.02, py0 = 0.74, py1 = 1.9, pr = 0.17, ps2 = new THREE.Shape();
      ps2.moveTo(px0, py0); ps2.lineTo(px1 - pr, py0); ps2.absarc(px1 - pr, py0 + pr, pr, -Math.PI / 2, 0, false); ps2.lineTo(px1, py1 - pr); ps2.absarc(px1 - pr, py1 - pr, pr, 0, Math.PI / 2, false); ps2.lineTo(px0, py1); ps2.lineTo(px0, py0);
      const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(ps2, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 3, curveSegments: 20 }), NGRD()); pm.position.z = 0.03; root.add(pm);
      const hp = new THREE.Path(); hp.moveTo(px0, py1 - 0.012); hp.lineTo(px1 - pr, py1 - 0.012); hp.absarc(px1 - pr, py1 - pr, pr - 0.012, Math.PI / 2, 0, true); hp.lineTo(px1 - 0.012, py0 + pr); hp.absarc(px1 - pr, py0 + pr, pr - 0.012, 0, -Math.PI / 2, true); hp.lineTo(px0, py0 + 0.012);
      const hl = led(0xffb866, 3); syncAll.push(hl); root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp.getPoints(16).map(p => new THREE.Vector3(p.x, p.y, 0.022)), false, 'centripetal'), 160, 0.006, 6, false), hl));
      for (const [d, y, w2] of [['up', py1 + 0.004, px1 - px0 - 0.2], ['down', py0 - 0.004, px1 - px0 - 0.2]]) { const L2 = ledStrip({ w: w2, wash: d === 'up' ? 0.3 : 0.28, dir: d, alpha: 0.55, colour: 0xffb866 }); L2.obj.position.set((px0 + px1 - 0.1) / 2, y, 0.016); root.add(L2.obj); syncAll.push(...L2.moods.strips); moods.halos.push(...L2.moods.halos); }
      const vL = ledStrip({ w: py1 - py0 - 2 * pr, wash: 0.22, dir: 'up', alpha: 0.5, colour: 0xffb866 }); vL.obj.rotation.z = -Math.PI / 2; vL.obj.position.set(px1 + 0.004, (py0 + py1) / 2, 0.016); root.add(vL.obj); syncAll.push(...vL.moods.strips); moods.halos.push(...vL.moods.halos);
      // neon signs (flex-neon on clear acrylic): "LET'S PLAY" and a game-controller outline
      const neon = (w2, h2, draw) => { const tx = canvasTex(Math.round(w2 * 800), Math.round(h2 * 800), (x, W2, H2) => { x.clearRect(0, 0, W2, H2); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = '#fff'; x.shadowBlur = 14; draw(x, W2, H2); x.shadowBlur = 4; draw(x, W2, H2); });
        const nm = new THREE.MeshBasicMaterial({ map: tx, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, name: '__neon_sign' }); moods.halos.push(nm);
        const g2 = g(); g2.add(box(w2 * 0.92, h2 * 0.92, 0.006, () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.1, depthWrite: false, name: '__acrylic' }), 0, -h2 * 0.46, 0.004));
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(w2, h2), nm); pl.position.z = 0.012; g2.add(pl); return g2; };
      const s1 = neon(0.56, 0.34, (x, W2, H2) => { x.lineWidth = 7; x.strokeRect(W2 * 0.06, H2 * 0.2, W2 * 0.88, H2 * 0.72); x.font = `600 ${H2 * 0.2}px "Arial Rounded MT Bold", Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 5;
        x.strokeText("LET'S", W2 / 2, H2 * 0.13); x.font = `800 ${H2 * 0.42}px "Arial Rounded MT Bold", Arial, sans-serif`; x.strokeText('PLAY', W2 / 2, H2 * 0.58); });
      s1.position.set(tvCx - 0.3, 2.28, 0.012); root.add(s1);
      const s2 = neon(0.42, 0.3, (x, W2, H2) => { x.lineWidth = 7; const cx2 = W2 / 2, cy2 = H2 * 0.5; x.beginPath(); x.moveTo(cx2 - 60, cy2 - 50); x.lineTo(cx2 + 60, cy2 - 50); x.bezierCurveTo(cx2 + 120, cy2 - 52, cx2 + 150, cy2 + 40, cx2 + 140, cy2 + 80); x.bezierCurveTo(cx2 + 130, cy2 + 112, cx2 + 92, cy2 + 104, cx2 + 70, cy2 + 60);
        x.lineTo(cx2 - 70, cy2 + 60); x.bezierCurveTo(cx2 - 92, cy2 + 104, cx2 - 130, cy2 + 112, cx2 - 140, cy2 + 80); x.bezierCurveTo(cx2 - 150, cy2 + 40, cx2 - 120, cy2 - 52, cx2 - 60, cy2 - 50); x.stroke();
        x.lineWidth = 6; x.beginPath(); x.moveTo(cx2 - 92, cy2 + 6); x.lineTo(cx2 - 52, cy2 + 6); x.moveTo(cx2 - 72, cy2 - 14); x.lineTo(cx2 - 72, cy2 + 26); x.stroke();
        for (const [bx2, by2] of [[70, -10], [70, 22], [54, 6], [86, 6]]) { x.beginPath(); x.arc(cx2 + bx2, cy2 + by2, 6, 0, 7); x.stroke(); }
        x.beginPath(); x.arc(cx2 - 30, cy2 + 40, 12, 0, 7); x.stroke(); x.beginPath(); x.arc(cx2 + 30, cy2 + 40, 12, 0, 7); x.stroke(); });
      s2.position.set(tvCx + 0.42, 2.3, 0.012); root.add(s2);
      const cove = ledStrip({ w: bw - 0.16, wash: 0.5, dir: 'down', alpha: 0.35, colour: 0xffb866 }); cove.obj.position.set(bc + 0.08, ceiling - 0.03, 0.012); root.add(cove.obj); moods.strips.push(...cove.moods.strips); moods.halos.push(...cove.moods.halos);
    } else {
    root.add(box(bw, ceiling, 0.012, FELT, bc, 0, 0));
      for (let x = bx0 + 0.03; x < bx1 - 0.02; x += 0.045) root.add(box(0.022, ceiling - 0.02, 0.02, CHAR, x, 0.01, 0.012));
      for (const ex of [bx0 + 0.008, bx1 - 0.008]) { const m = led(0x6a5cff, 2.4); syncAll.push(m); root.add(box(0.012, ceiling - 0.1, 0.012, m, ex, 0.05, 0.034)); }
      const hexM = [CHARL, WOOD, CHARL, () => M('__hex_walnut_dark', 0x4a3426)];
      const hexes = [[0, 0], [1, 0], [0.5, 0.87], [1.5, 0.87], [2, 0], [1, 1.73], [2.5, 0.87]];
      hexes.forEach(([hx, hy], k) => { const hm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 6), (hexM[k % hexM.length])()); hm.rotation.x = Math.PI / 2; hm.rotation.y = Math.PI / 6;
        hm.position.set(bx1 - 0.55 + hx * 0.11, 2.0 + hy * 0.11, 0.05); root.add(hm);
        if (k % 3 === 0) { const hl = led(0x6a5cff, 2); syncAll.push(hl); const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.104, 0.104, 0.008, 6), hl); ring.rotation.x = Math.PI / 2; ring.rotation.y = Math.PI / 6; ring.position.set(hm.position.x, hm.position.y, 0.034); root.add(ring); } });
    }
    // ---- floating console: drawer | PS5 bay | gadget bay | drawer ----
    const cx0 = SAGE ? (STUDY ? 0.8 : 0.1) : NOTALL ? 0.5 : tall + (NEON ? 0.16 : 0.04), cx1 = deepTo, cw = cx1 - cx0, cy = 0.24, ch = 0.44, cd = 0.42, cym = cy + ch;
    const secs = SAGE ? [0.6, 0.25, 0.46, cw - 0.6 - 0.25 - 0.46] : [0.48, 0.25, 0.46, cw - 0.48 - 0.25 - 0.46]; const xs = [cx0]; secs.forEach(s2 => xs.push(xs[xs.length - 1] + s2));
    if (COT) caneConsole({ x0: 0.72, x1: 2.38, y0: 0, legs: 0.16, h: 0.46, sections: [{ type: 'cane', w: 0.55, hinge: 'l', content: 'ps5', label: 'PS5 cabinet (cane, ventilated)' }, { type: 'drawers', w: 0.5, n: 3 }, { type: 'cane', w: 0.55, hinge: 'r', content: 'gadgets', label: 'gadget cabinet' }] });
    if (SLATE) {  // floating oak console under the TV: three flat oak doors (PS5 flat | dock + Apple TV + router | storage), soundbar + plant + books + candles on top
      caneConsole({ x0: 0.62, x1: 2.02, y0: 0.26, h: 0.34, wood: OAK, sections: [{ type: 'cane', front: 'wood', w: 1, hinge: 'l', content: 'ps5', label: 'PS5 cabinet (50 mm rear air gap + top vent slot)' }, { type: 'cane', front: 'wood', w: 1, hinge: 'l', content: 'gadgets', label: 'gadget cabinet' }, { type: 'cane', front: 'wood', w: 1, hinge: 'r', content: 'store', label: 'oak cabinet' }] });
      root.add(loose(box(0.8, 0.064, 0.11, () => M('__soundbar_fabric', 0x2a2b2d), tvCx, 0.6, 0.18, 0.02)));
      const sp5 = potPlant(0.14, 0xefe9df, 0.05); sp5.position.set(0.75, 0.6, 0.22); root.add(sp5); for (let k = 0; k < 2; k++) root.add(loose(box(0.2, 0.025, 0.14, () => M('__book_slate_c' + k, [0xefe6d8, 0x8f8378][k]), 0.75, 0.6 + k * 0.025, 0.06)));
      for (const cx5 of [1.82, 1.92]) root.add(loose(cyl(0.028, 0.028, 0.07, () => M('__candle_glass', 0xd9cbb2), cx5, 0.6, 0.2, 14)));
      const ug3 = ledStrip({ w: 1.3, wash: 0.3, dir: 'floor', alpha: 0.4 }); ug3.obj.position.set(1.32, 0.066, 0.36); root.add(ug3.obj); syncAll.push(...ug3.moods.strips); moods.halos.push(...ug3.moods.halos);
    }
    if (CHO) {    // two-tier honey-oak console: drawer | open bay (PS5 + Apple TV + router) | drawer, a floating oak plank above it (dock on it), under-glow
      const HO = OAK;   // real oak grain (baked photo material)
      caneConsole({ x0: 0.35, x1: 2.4, y0: 0.2, h: 0.34, d: 0.45, wood: HO, sections: [{ type: 'drawers', w: 0.8, n: 1, knob: 'black' }, { type: 'open', w: 0.7, content: 'ps5av' }, { type: 'drawers', w: 0.55, n: 1, knob: 'black' }] });
      root.add(box(1.7, 0.06, 0.14, () => M('__oak_spine_dark', 0x6b4a32), 1.5, 0.54, 0.012));                         // recessed spine
      root.add(box(2.1, 0.05, 0.42, HO, 1.52, 0.6, 0.012, 0.004));                                                    // floating plank (top 0.65 m)
      const dk4 = dualSenseDock(); dk4.position.set(2.2, 0.65, 0.14); root.add(dk4);
      const ug2 = ledStrip({ w: 1.95, wash: 0.35, dir: 'floor', alpha: 0.45 }); ug2.obj.position.set(1.375, 0.066, 0.36); root.add(ug2.obj); syncAll.push(...ug2.moods.strips); moods.halos.push(...ug2.moods.halos);
      const pl2 = led(0xffc27a, 2.4); syncAll.push(pl2); root.add(box(1.9, 0.006, 0.01, pl2, 1.52, 0.594, 0.4));      // light line under the plank
    }
    if (HER) {    // teak console with diamond-weave doors + drawers (hung 0.12 m off the floor), speakers + brass vase on top, soundbar under the TV
      caneConsole({ x0: 0.86, x1: 2.62, y0: 0.12, h: 0.46, wood: () => M('__teak_dark', 0x4e2c18), sections: [{ type: 'cane', front: 'weave', w: 0.5, hinge: 'l', content: 'ps5', label: 'PS5 cabinet (woven front, ventilated)' }, { type: 'drawers', w: 0.48, n: 2 }, { type: 'cane', front: 'weave', w: 0.5, hinge: 'r', content: 'gadgets', label: 'gadget cabinet' }] });
      const sub2 = g(); sub2.add(box(0.2, 0.36, 0.22, () => M('__sub_body', 0x1b1b1d), 0, 0, 0, 0.01)); const port = cyl(0.04, 0.04, 0.01, PS5B, 0, 0, 0, 20); port.rotation.x = Math.PI / 2; port.position.set(0, 0.08, 0.222); sub2.add(port); sub2.position.set(1.05, 0.58, 0.12); root.add(loose(sub2));
      const bv5 = g(); bv5.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 18, 12), BRASS())); bv5.children[0].position.y = 0.06; bv5.add(cyl(0.02, 0.03, 0.06, BRASS, 0, 0.1, 0, 14)); for (let k = 0; k < 9; k++) { const fl4 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), M('__daisy_white', 0xf4f1ea)); fl4.position.set(Math.cos(k * 2.4) * 0.06, 0.24 + (k % 3) * 0.03, Math.sin(k * 2.4) * 0.05); bv5.add(fl4); }
      bv5.position.set(1.45, 0.58, 0.2); root.add(loose(bv5));
      const rs = g(); rs.add(box(0.22, 0.13, 0.11, () => M('__speaker_cream', 0xd9c3a3), 0, 0, 0, 0.012)); rs.add(box(0.19, 0.09, 0.004, () => M('__speaker_grille_brass', 0xa8915f), 0, 0.02, 0.11)); rs.position.set(2.4, 0.58, 0.18); root.add(loose(rs));
      root.add(box(0.85, 0.07, 0.1, () => M('__soundbar_fabric', 0x2a2b2d), tvCx, tvCy - 0.36 - 0.12, 0.03, 0.02));             // wall-mounted soundbar under the TV
      const ug = ledStrip({ w: 1.7, wash: 0.3, dir: 'floor', alpha: 0.4 }); ug.obj.position.set(1.74, 0.066, 0.32); root.add(ug.obj); syncAll.push(...ug.moods.strips); moods.halos.push(...ug.moods.halos);
    }
    if (PILL) {   // long floating white console, three push-to-open drawers (games, cables, spare controllers), under-glow
      caneConsole({ x0: 0.2, x1: 2.6, y0: 0.24, h: 0.36, wood: () => M('__ivory_lacquer', 0xefe8dc), sections: [{ type: 'drawers', w: 1, n: 1 }, { type: 'drawers', w: 1, n: 1 }, { type: 'drawers', w: 1, n: 1 }] });
      const fw3 = ledStrip({ w: 2.3, wash: 0.42, dir: 'floor', alpha: 0.55 }); fw3.obj.position.set(1.4, 0.066, 0.3); root.add(fw3.obj); syncAll.push(...fw3.moods.strips); moods.halos.push(...fw3.moods.halos);
      const ul3 = led(0xffc27a, 2.8); syncAll.push(ul3); root.add(box(2.3, 0.006, 0.01, ul3, 1.4, 0.232, 0.36));
      const bv3 = g(); bv3.add(cyl(0.035, 0.05, 0.16, PS5B, 0, 0, 0, 18)); for (let k = 0; k < 7; k++) { const st = cyl(0.002, 0.002, 0.2, () => M('__dried_branch', 0x9c8a6c), 0, 0, 0, 5); st.position.set((k - 3) * 0.008, 0.24, 0); st.rotation.z = (k - 3) * 0.2; bv3.add(st); const fl3 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M('__dried_flower', 0xe9dcc4)); fl3.position.set((k - 3) * 0.035, 0.33, 0); bv3.add(fl3); }
      bv3.position.set(0.95, 0.6, 0.2); root.add(loose(bv3));
      for (let k = 0; k < 2; k++) root.add(loose(box(0.2, 0.025, 0.15, () => M('__book_pill_c' + k, [0xd9cbb2, 0x8f8378][k]), 0.95, 0.6 + k * 0.025, 0.08)));
      root.add(loose(cyl(0.06, 0.04, 0.03, () => M('__ceramic_bowl', 0xe9e1d4), 2.4, 0.6, 0.22, 20)));
    }
    if (MIDS) caneConsole({ x0: 0.15, x1: 2.45, y0: 0, legs: 0.18, h: 0.42, wood: WOOD, sections: [{ type: 'cane', front: 'wood', w: 0.3, hinge: 'l', content: 'remotes', label: 'remotes + chargers cabinet' }, { type: 'cane', front: 'wood', w: 0.3, hinge: 'r', content: 'games', label: 'games cabinet' }, { type: 'open', w: 0.7, content: 'av' }, { type: 'cane', front: 'louvre', w: 0.5, hinge: 'l', content: 'ps5dock', label: 'PS5 + controller cabinet (louvred, ventilated)' }, { type: 'cane', front: 'louvre', w: 0.5, hinge: 'r', content: 'sub', label: 'subwoofer cabinet (louvred)' }] });
    else if (MID) caneConsole({ x0: 0.15, x1: 2.45, y0: 0, legs: 0.18, h: 0.42, wood: WOOD, sections: [{ type: 'cane', front: 'wood', w: 0.3, hinge: 'l', content: 'store', label: 'walnut cabinet' }, { type: 'cane', front: 'wood', w: 0.3, hinge: 'r', content: 'store', label: 'walnut cabinet' }, { type: 'open', w: 0.7, content: 'av' }, { type: 'cane', front: 'louvre', w: 0.5, hinge: 'l', content: 'ps5', label: 'PS5 cabinet (louvred, ventilated)' }, { type: 'cane', front: 'louvre', w: 0.5, hinge: 'r', content: 'dock', label: 'controller cabinet' }] });
    if (BELLS) caneConsole({ x0: 0.5, x1: 2.45, y0: 0.3, h: 0.42, sections: [{ type: 'open', w: 0.42 }, { type: 'cane', w: 0.51, hinge: 'l', content: 'ps5', label: 'PS5 cabinet (cane, ventilated)' }, { type: 'cane', w: 0.51, hinge: 'l', content: 'gadgets', label: 'gadget cabinet' }, { type: 'cane', w: 0.51, hinge: 'r', content: 'store', label: 'cane cabinet' }] });
    if (!COT && !BELLS && !MID && !WAVE && !PILL && !HER && !CHO && !SLATE) {
    root.add(box(cw, t, cd, PEACH ? PLAS : NEON ? NGRD : SAGE ? () => M('__marble_white', 0xeeeae4) : PS5B, (cx0 + cx1) / 2, cym - t, 0, 0.003));                          // top
    const CB = GREEN ? GRN : (WABI || FRAME) ? OAK : PEACH ? PLAS : NEON ? NGRD : SAGE ? WOOD : DARK; root.add(box(cw, t, cd, CB, (cx0 + cx1) / 2, cy, 0)); root.add(box(t, ch, cd, CB, cx0 + t / 2, cy, 0)); root.add(box(t, ch, cd, CB, cx1 - t / 2, cy, 0));
    if (GREEN) { const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), M('__basketball', 0xd0732e)); ball.position.set(cx1 - 0.2, cym + 0.12, 0.22); root.add(loose(ball)); }
    root.add(box(cw, ch, 0.012, PS5B, (cx0 + cx1) / 2, cy, 0.03));                                 // perforated-look back panel (vent + cable entry)
    for (let k = 1; k < xs.length - 1; k++) root.add(box(t, ch - 2 * t, cd - 0.03, DARK, xs[k], cy + t, 0.03));
    for (const k of [0, 3]) {                                                                      // drawers (games, cables, controllers)
      const dw = secs[k] - 0.006, dx = (xs[k] + xs[k + 1]) / 2, dr = g();
      const sculpt = () => new THREE.MeshStandardMaterial({ map: canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#ece6dc'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(140,128,112,0.55)'; x.lineWidth = 3; x.beginPath(); x.arc(w * 0.3, h, h * 0.7, Math.PI, 0); x.stroke(); x.beginPath(); x.arc(w * 0.75, 0, h * 0.55, 0, Math.PI); x.stroke(); x.beginPath(); x.moveTo(w * 0.55, 0); x.lineTo(w * 0.55, h); x.stroke(); }), roughness: 0.9, name: '__sculpted_front' });
      const fmat = GREEN ? (k === 0 ? CRM : GRN) : WABI ? CRM : FRAME ? (k === 0 ? sculpt() : OAK) : PEACH ? PLAS : NEON ? NGR : SAGE ? WOOD : WOOD;
      dr.add(box(dw, ch - 0.006, 0.02, fmat, dx, cy + 0.003, cd - 0.02, 0.003));
      if (WABI) for (const [w2, h2, ox, oy] of [[dw, 0.02, 0, 0], [dw, 0.02, 0, ch - 0.026], [0.02, ch - 0.006, -dw / 2 + 0.01, 0], [0.02, ch - 0.006, dw / 2 - 0.01, 0]]) dr.add(box(w2, h2, 0.024, OAK, dx + ox, cy + 0.003 + oy, cd - 0.02));
      if (FRAME && k === 3) for (let fx = -dw / 2 + 0.02; fx < dw / 2 - 0.01; fx += 0.022) dr.add(cyl(0.008, 0.008, ch - 0.04, OAK, dx + fx, cy + 0.02, cd + 0.004, 8));
      if (!WABI && !FRAME && !PEACH && !NEON && !SAGE) dr.add(box(0.16, 0.012, 0.012, BRASS, dx, cy + ch - 0.06, cd));   // peach / neon: push-to-open, handle-less like the references
      const tw = dw - 0.05, tD = cd - 0.08; dr.add(box(tw, 0.01, tD, OAK, dx, cy + t + 0.01, cd - 0.02 - tD)); dr.add(box(tw, ch - 0.12, 0.01, OAK, dx, cy + t + 0.01, cd - 0.02 - tD));
      dr.add(box(0.01, ch - 0.12, tD, OAK, dx - tw / 2, cy + t + 0.01, cd - 0.02 - tD)); dr.add(box(0.01, ch - 0.12, tD, OAK, dx + tw / 2, cy + t + 0.01, cd - 0.02 - tD));
      tagGroup(dr, { type: 'slide', slide: [0, 0, 0.32], label: 'console drawer' }); root.add(dr);
    }
    const ps = ps5Slim(); ps.position.set((xs[1] + xs[2]) / 2, cy + t, 0.13); root.add(ps);     // narrow front (96 mm) faces the room
    const dock = dualSenseDock(); dock.position.set(xs[2] + 0.17, cy + t, 0.24); root.add(dock);     // 2 controllers (≈ 0.33 m wide) stand in the dock
    root.add(loose(box(0.093, 0.031, 0.093, PS5B, xs[2] + 0.395, cy + t, 0.27, 0.008)));           // Apple TV 4K 93×31×93
    root.add(loose(box(0.2, 0.035, 0.14, PS5B, xs[2] + 0.34, cy + t, 0.06, 0.01)));                // Wi-Fi router (behind)
    for (const k of [1, 2]) { const m = led(0x6a5cff, 2.6); syncAll.push(m); root.add(box(secs[k] - 0.04, 0.008, 0.012, m, (xs[k] + xs[k + 1]) / 2, cym - t - 0.01, cd - 0.03)); }
    const under = led(0x6a5cff, 2.8); syncAll.push(under); root.add(box(cw - 0.08, 0.008, 0.012, under, (cx0 + cx1) / 2, cy - 0.01, cd - 0.05));
    root.add(loose(box(0.8, 0.064, 0.124, () => M('__soundbar_fabric', 0x2a2b2d), tvCx, cym, 0.2, 0.02)));   // soundbar (e.g. Sony HT-S2000 800×64×124)
    if (!SAGE) for (const sx of [-1, 1]) {                                                                    // two sync light bars on the console top
      const bar = g(); bar.add(box(0.045, 0.27, 0.045, PS5B, 0, 0, 0, 0.008)); const m = led(0x6a5cff, 3.2); syncAll.push(m); bar.add(box(0.035, 0.24, 0.006, m, 0, 0.015, 0.045));
      bar.position.set(tvCx + sx * 0.62, cym, 0.08); root.add(loose(bar));
    }
    }   // end floating console
    if (SAGE) {                                                                                    // rounded right end (walnut + marble), floor wash, reference styling
      const rr3 = cd / 2, endC = new THREE.Mesh(new THREE.CylinderGeometry(rr3, rr3, ch - t, 32, 1, false, 0, Math.PI), WOOD()); endC.position.set(cx1, cy + (ch - t) / 2, rr3); root.add(endC);
      const endT = new THREE.Mesh(new THREE.CylinderGeometry(rr3 + 0.005, rr3 + 0.005, t, 32, 1, false, 0, Math.PI), M('__marble_white', 0xeeeae4)); endT.position.set(cx1, cym - t / 2, rr3); root.add(endT);
      const fw2 = ledStrip({ w: cw + 0.1, wash: 0.45, dir: 'floor', alpha: 0.55 }); fw2.obj.position.set((cx0 + cx1) / 2 + 0.05, 0.066, cd - 0.08); root.add(fw2.obj); syncAll.push(...fw2.moods.strips); moods.halos.push(...fw2.moods.halos);
      const ml = mushroomLamp(1.2); ml.position.set(cx0 + 0.22, cym, 0.22); root.add(ml); const pp = potPlant(0.2, 0xe9e1d2, 0.06); pp.position.set(cx0 + 0.42, cym, 0.2); root.add(pp);
      for (let k = 0; k < 2; k++) root.add(loose(box(0.22, 0.025, 0.16, () => M('__book_sage_' + k, [0xefe6d8, 0xd9cbb2][k]), 1.0, cym + k * 0.025, 0.16)));
      root.add(loose(cyl(0.05, 0.03, 0.04, () => M('__ceramic_bowl', 0xe9e1d4), 1.0, cym + 0.05, 0.24, 18)));
      const av = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.028, 14, 28, Math.PI), M('__vase_white', 0xf2eee8)); av.position.set(cx1 + 0.06, cym + 0.03, 0.22); root.add(loose(av));
      for (let k = 0; k < 5; k++) { const st = cyl(0.002, 0.002, 0.3, () => M('__dried_branch', 0x6b543f), 0, 0, 0, 5); st.position.set(cx1 + 0.06 + (k - 2) * 0.01, cym + 0.2, 0.22); st.rotation.z = (k - 2) * 0.15; root.add(loose(st)); }
    }
    if (COT) {                                                                                     // sideboard top: lamp, speaker, books, figurines, plant; floor plant beside it
      const tl = g(); tl.add(cyl(0.05, 0.06, 0.18, () => M('__lamp_base_wood', 0x8a5a33), 0, 0, 0, 20)); const shd = led(0xffd29a, 2.2); moods.strips.push(shd);
      const sh2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), shd); sh2.position.y = 0.2; tl.add(sh2); tl.position.set(0.86, 0.62, 0.22); root.add(loose(tl));
      const spk = g(); spk.add(box(0.13, 0.17, 0.15, () => M('__speaker_wood', 0xb07a45), 0, 0, 0, 0.008)); const cone = cyl(0.04, 0.04, 0.005, PS5B, 0, 0, 0, 20); cone.rotation.x = Math.PI / 2; cone.position.set(0, 0.07, 0.152); spk.add(cone); spk.position.set(1.06, 0.62, 0.12); root.add(loose(spk));
      for (let k = 0; k < 3; k++) root.add(loose(box(0.18, 0.025, 0.13, () => M('__book_cot_' + k, [0xefe6d8, 0xe3b23c, 0x9fb27a][k]), 1.9, 0.62 + k * 0.025, 0.2)));
      for (const [tx, s3] of [[1.84, 0.8], [1.98, 0.9]]) { const tb = teddy(s3); tb.position.set(tx, 0.695, 0.22); root.add(tb); }
      const pp = potPlant(0.26, 0xe9e1d2, 0.07); pp.position.set(2.2, 0.62, 0.2); root.add(pp); const vv = vine(0.55, 4); vv.position.set(2.28, 0.6, 0.38); root.add(vv);
      const fp = potPlant(0.75, 0xd8cdb8, 0.13); fp.position.set(2.56, 0.062, 0.2); root.add(fp);       // floor plant: outside the door swing (≥ 1.0 m from the hinge)
    }
    if (MID) {                                                                                     // console top: mushroom lamp, brass dish, soundbar, snake plant on a stand
      const ml = mushroomLamp(1.3); ml.position.set(0.3, 0.6, 0.22); root.add(ml); root.add(loose(cyl(0.06, 0.04, 0.025, BRASS, 0.48, 0.6, 0.24, 22)));
      root.add(loose(box(0.8, 0.064, 0.124, () => M('__soundbar_fabric', 0x2a2b2d), tvCx, 0.6, 0.18, 0.02)));
      const st = g(); for (const [lx, lz] of [[-0.07, -0.07], [0.07, -0.07], [-0.07, 0.07], [0.07, 0.07]]) { const lg = cyl(0.008, 0.008, 0.12, WOOD, lx, 0, lz, 8); st.add(lg); } st.add(box(0.18, 0.012, 0.18, WOOD, 0, 0.11, -0.09));
      const sp = g(); sp.add(cyl(0.075, 0.06, 0.14, () => M('__pot_white', 0xf2eee8), 0, 0, 0, 20)); for (let k = 0; k < 9; k++) { const bl = box(0.03, 0.42 + (k % 3) * 0.08, 0.006, () => M('__snake_leaf', 0x5f7d3e), 0, 0.12, 0); bl.rotation.set(0, k * 0.7, (k - 4) * 0.07); sp.add(bl); }
      sp.position.y = 0.122; st.add(sp); st.position.set(2.27, 0.6, 0.22); root.add(loose(st));
    }
    if (BELLS) {                                                                                   // console top + floor plant (reference)
      const pp = potPlant(0.2, 0xefe6d8, 0.055); pp.position.set(0.72, 0.72, 0.2); root.add(pp); for (const [vx, vl, sd] of [[0.7, 0.75, 1], [0.78, 0.55, 2]]) { const vv = vine(vl, sd); vv.position.set(vx, 0.74, 0.4); root.add(vv); }
      root.add(loose(box(0.24, 0.03, 0.17, () => M('__book_kinfolk', 0xf1ece2), 1.02, 0.72, 0.17))); root.add(loose(cyl(0.07, 0.04, 0.03, () => M('__brass_bowl', 0xb08d57), 1.0, 0.75, 0.25, 22)));
      const bv = g(); bv.add(cyl(0.04, 0.05, 0.16, BRASS, 0, 0, 0, 20)); for (let k = 0; k < 6; k++) { const st = cyl(0.002, 0.002, 0.34, () => M('__dried_branch', 0x6b543f), 0, 0, 0, 5); st.position.set((k - 2.5) * 0.01, 0.32, 0); st.rotation.z = (k - 2.5) * 0.16; bv.add(st); const lf = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), LEAF2()); lf.position.set((k - 2.5) * 0.05, 0.46, 0); bv.add(lf); }
      bv.position.set(2.3, 0.72, 0.22); root.add(loose(bv));
      const uw = ledStrip({ w: 1.85, wash: 0.35, dir: 'floor', alpha: 0.4 }); uw.obj.position.set(1.475, 0.066, 0.3); root.add(uw.obj); syncAll.push(...uw.moods.strips); moods.halos.push(...uw.moods.halos);
    }
    if (PEACH) {                                                                                   // reference styling on the console
      root.add(loose(cyl(0.045, 0.06, 0.22, () => M('__terracotta_vase', 0xc77452), cx0 + 0.09, cym, 0.2, 22)));
      root.add(loose(cyl(0.035, 0.045, 0.12, () => M('__terracotta_vase', 0xc77452), cx0 + 0.19, cym, 0.24, 22)));
      for (let k = 0; k < 5; k++) { const st = cyl(0.003, 0.003, 0.24, () => M('__leaf_green', 0x6f8a4a), 0, 0, 0, 5); st.position.set(cx0 + 0.09 + (k - 2) * 0.012, cym + 0.3, 0.2); st.rotation.z = (k - 2) * 0.18; root.add(loose(st)); }
      for (let k = 0; k < 3; k++) root.add(loose(box(0.2, 0.022, 0.15, () => M('__book_peach_' + k, [0xefe6d8, 0xd9a189, 0x8f8378][k]), cx1 - 0.14, cym + k * 0.022, 0.18)));
    }
    if (NEON) {
      const al = led(0x2f55ff, 2.6); moods.accent.push(al); root.add(box(cw - 0.04, 0.006, 0.01, al, (cx0 + cx1) / 2, cym - 0.012, cd - 0.012));   // blue line in the top's shadow gap
      const hs = g(); hs.add(cyl(0.05, 0.055, 0.012, PS5B, 0, 0, 0, 24)); hs.add(cyl(0.008, 0.008, 0.25, () => M('__alu_dark', 0x6d6f73), 0, 0.012, 0, 12));
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.012, 10, 28, Math.PI), PS5B()); band.position.y = 0.2; hs.add(band);
      for (const sx of [-1, 1]) { const cup = cyl(0.045, 0.045, 0.035, PS5B, 0, 0, 0, 24); cup.rotation.z = Math.PI / 2; cup.position.set(sx * 0.09, 0.19, 0); hs.add(cup); }
      hs.position.set(cx1 - 0.28, cym, 0.2); root.add(loose(hs));
    }
    // ---- TV (55″ now; mount + HDMI 2.1 + power rough-in sized for up to 80″) ----
    const tv = tvSet({ inch: tvInch }); tv.obj.position.set(tvCx, tvCy, 0.032); root.add(tv.obj);
    const art = WABI ? canvasTex(512, 288, (x, w, h) => { const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#f1ece4'); sky.addColorStop(1, '#d9c7b0'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
      [['#b8a48e', 0.55], ['#9c8670', 0.65], ['#c9a483', 0.78], ['#a77f5e', 0.9]].forEach(([c, yy], i) => { x.fillStyle = c; x.globalAlpha = 0.85; x.beginPath(); x.moveTo(0, h); for (let px = 0; px <= w; px += 6) x.lineTo(px, h * yy - Math.abs(Math.sin(px * 0.012 + i * 1.7)) * 40 * (1 - i * 0.2)); x.lineTo(w, h); x.fill(); }); x.globalAlpha = 1; }) : null;
    const art2 = PILL ? canvasTex(512, 288, (x, w, h) => { x.fillStyle = '#0f1520'; x.fillRect(0, 0, w, h); const hero = x.createLinearGradient(140, 0, w, 0); hero.addColorStop(0, '#24334a'); hero.addColorStop(1, '#c46b3c'); x.fillStyle = hero; x.fillRect(140, 14, w - 154, 92);
        x.fillStyle = '#fff'; x.font = 'bold 30px Arial'; x.fillText('Movie night', 160, 62); x.fillStyle = '#1a2230'; x.fillRect(0, 0, 120, h); x.fillStyle = '#9aa3b5'; x.font = '13px Arial'; ['Home', 'Movies', 'Series', 'Games', 'Library'].forEach((t2, i) => x.fillText(t2, 18, 40 + i * 26));
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { x.fillStyle = ['#d8a03a', '#c23a5a', '#3a7bd8', '#1f9e8a', '#8a5cd8', '#e0b23a'][(r * 4 + c) % 6]; x.fillRect(146 + c * 90, 120 + r * 54, 82, 46); } })
      : PEACH ? canvasTex(512, 288, (x, w, h) => { const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#f6dccb'); sky.addColorStop(1, '#e7a98c'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
        x.fillStyle = '#fff3e6'; x.beginPath(); x.arc(w * 0.62, h * 0.42, 46, 0, 7); x.fill(); [['#d98e70', 0.72], ['#c4775c', 0.84], ['#a95f49', 0.95]].forEach(([c, yy], i) => { x.fillStyle = c; x.beginPath(); x.moveTo(0, h); for (let px = 0; px <= w; px += 6) x.lineTo(px, h * yy - Math.abs(Math.sin(px * 0.01 + i * 2)) * 34); x.lineTo(w, h); x.fill(); }); })
      : NEON ? canvasTex(512, 288, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#10131c'); gr.addColorStop(1, '#2a1f3c'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
        for (let k = 0; k < 8; k++) { x.fillStyle = ['#2f55ff', '#d8662a', '#6a5cff', '#1f9e8a', '#c23a5a', '#e0b23a', '#3a7bd8', '#8a8f99'][k]; x.fillRect(22 + k * 48, 30, 40, 40); }
        x.strokeStyle = '#fff'; x.lineWidth = 2; x.strokeRect(20, 28, 44, 44); x.fillStyle = '#e8e8ee'; x.font = 'bold 26px Arial'; x.fillText('Game library', 22, 120); x.font = '14px Arial'; x.fillStyle = '#b8bccb'; x.fillText('Continue playing  ·  Media  ·  Store', 22, 146);
        x.fillStyle = 'rgba(255,255,255,0.85)'; x.fillRect(22, 220, 90, 26); x.fillStyle = '#111'; x.font = 'bold 14px Arial'; x.fillText('Play', 50, 238); }) : null;
    const art3 = COT ? canvasTex(512, 288, (x, w, h) => { x.fillStyle = '#f1ead2'; x.fillRect(0, 0, w, h); x.fillStyle = '#a9c07c'; x.beginPath(); x.arc(w * 0.18, h * 0.55, 120, 0, 7); x.fill(); x.fillStyle = '#e8b878'; x.beginPath(); x.arc(w * 0.62, h * 0.3, 34, 0, 7); x.fill();
        x.fillStyle = '#7d9a52'; x.beginPath(); x.moveTo(0, h); x.bezierCurveTo(w * 0.3, h * 0.45, w * 0.6, h * 0.5, w, h * 0.65); x.lineTo(w, h); x.fill(); x.fillStyle = '#5f7d3e'; x.beginPath(); x.ellipse(w * 0.82, h * 0.78, 30, 90, -0.4, 0, 7); x.fill();
        for (const [fx, fy] of [[0.12, 0.3], [0.28, 0.55], [0.5, 0.7]]) { x.fillStyle = '#fffaf0'; for (let p = 0; p < 5; p++) { x.beginPath(); x.arc(w * fx + Math.cos(p * 1.26) * 14, h * fy + Math.sin(p * 1.26) * 14, 11, 0, 7); x.fill(); } x.fillStyle = '#e8b878'; x.beginPath(); x.arc(w * fx, h * fy, 7, 0, 7); x.fill(); } }) : null;
    if (art3) { tv.screenMat.map = art3; tv.screenMat.color.set(0xffffff); }
    if (art2) { tv.screenMat.map = art2; tv.screenMat.color.set(0xffffff); }
    if (art) { tv.screenMat.map = art; tv.screenMat.color.set(0xffffff); }
    Object.values(tv.sync).forEach(m => syncAll.push(m));
    // ---- door return: shallow walnut veneer (the entry door folds back onto it) with an LED reveal ----
    const RET = CHO ? () => M('__charcoal_feature', 0x3b3a3a) : SLATE ? () => M('__slat_backing', 0x2b211a) : false ? () => M('__warm_white_wall', 0xece6dc) : HER ? () => M('__heritage_offwhite', 0xe6dccd) : PILL ? () => M('__greige_panel_warm', 0xd2c3ad) : WAVE ? () => M('__greige_panel', 0xcbbda6) : MID ? () => M('__warm_beige_wall', 0xd8c8b0) : GREEN ? GRN : WABI ? WABIW : FRAME ? MICRO : PEACH ? PWALL : NEON ? NGR : SAGE ? (BEIGEWAVE ? () => M('__beige_plaster_wave', 0xd9c7aa) : () => M('__sage_plaster', 0x8e9878)) : COT ? () => M('__cottage_cream', 0xefe4cf) : BELLS ? () => M('__warm_cream_wall', 0xece0cb) : WOOD;
    root.add(box(leafFrom - deepTo, ceiling, 0.022, RET, (deepTo + leafFrom) / 2, 0, 0));                 // 22 mm return up to the leaf zone
    root.add(box(roomW - leafFrom, leafTop, SKIN, RET, (leafFrom + roomW) / 2, 0, 0));                    // leaf zone: flat 4 mm skin (the open leaf covers it)
    root.add(box(roomW - leafFrom, ceiling - leafTop, 0.022, RET, (leafFrom + roomW) / 2, leafTop, 0));  // over-door band
    if (FRAME) {   // geometric oak relief panel on the door return (20 mm — the entry door still folds flat onto it)
      const geo = canvasTex(256, 1024, (x, w, h) => { x.fillStyle = '#c99d6b'; x.fillRect(0, 0, w, h); const s2 = 64; for (let r = 0; r < h / s2 + 1; r++) for (let c = 0; c < w / s2 + 1; c++) { const cx2 = c * s2 + (r % 2) * s2 / 2, cy2 = r * s2 * 0.87;
        [['#d9b17f', [[0, -1], [0.87, -0.5], [0, 0], [-0.87, -0.5]]], ['#b58855', [[-0.87, -0.5], [0, 0], [0, 1], [-0.87, 0.5]]], ['#a77b4b', [[0.87, -0.5], [0.87, 0.5], [0, 1], [0, 0]]]].forEach(([col, pts]) => { x.fillStyle = col; x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo : x.moveTo).call(x, cx2 + px * s2 / 2, cy2 + py * s2 / 2)); x.fill(); }); } });
      const gp = new THREE.Mesh(new THREE.BoxGeometry(0.6, ceiling - 0.3, 0.02), new THREE.MeshStandardMaterial({ map: geo, roughness: 0.7, name: '__oak_geometric' })); gp.geometry = new THREE.BoxGeometry(0.6, leafTop - 0.6, SKIN); gp.position.set(leafFrom + 0.04 + 0.3, (leafTop - 0.6) / 2 + 0.6, SKIN + SKIN / 2); root.add(gp);   // flat inlay inside the leaf zone
      root.add(box(0.6, ceiling - leafTop - 0.1, 0.02, () => gp.material, leafFrom + 0.34, leafTop + 0.05, 0.022));
    }
    if (GREEN) {   // matching shallow arch outline on the door return (flat: the entry door folds back onto it)
      const rw = Math.min(0.75, roomW - deepTo - 0.3), rc = (deepTo + roomW) / 2 + 0.05, ry0 = 1.2, ry1 = ceiling - 0.2, op = new THREE.Shape(), ip = new THREE.Path();
      op.moveTo(rc - rw / 2, ry0); op.lineTo(rc + rw / 2, ry0); op.lineTo(rc + rw / 2, ry1 - rw / 2); op.absarc(rc, ry1 - rw / 2, rw / 2, 0, Math.PI, false); op.lineTo(rc - rw / 2, ry0);
      const iw = rw / 2 - 0.03; ip.moveTo(rc - iw, ry0 + 0.03); ip.lineTo(rc + iw, ry0 + 0.03); ip.lineTo(rc + iw, ry1 - rw / 2); ip.absarc(rc, ry1 - rw / 2, iw, 0, Math.PI, false); ip.lineTo(rc - iw, ry0 + 0.03); op.holes.push(ip);
      const om = new THREE.Mesh(new THREE.ExtrudeGeometry(op, { depth: 0.003, bevelEnabled: false, curveSegments: 24 }), GRN()); om.position.z = SKIN; root.add(om);   // flat: inside the open leaf's thickness
      const rl = led(0xffc880, 2.4); syncAll.push(rl); const rp = ip.getPoints(40).filter(p => p.y > ry0 + 0.05).map(p => new THREE.Vector3(p.x, p.y, SKIN + 0.004)); root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 60, 0.004, 6, false), rl));
    }
    if (!NOTALL) { const rv = led(0xffc890, 2.2); moods.strips.push(rv); root.add(box(0.01, ceiling - 0.1, 0.01, rv, deepTo + 0.01, 0.05, 0.024)); }   // edge LED of the door return: only for the tall-unit designs
    moods.strips.push(...syncAll);
    return { obj: root, screenZ: cd + 0.08, tvCx, moods: { ...moods, tvSync: { screenMat: tv.screenMat, sync: tv.sync, all: syncAll, art: art || art2 || art3 } } };
  }
  /* east wall: oatmeal lacquer panels in 600 mm modules, flush hidden walk-in door, backlit clay-plaster arch, art canvas */
  function panelWall({ length = 3.7, door = [1.03, 2.0], ceiling = 2.85, mirrorAt = 0.5, artAt = 2.85 } = {}) {
    const root = g(), moods = { strips: [] }, gap = 0.006, d = 0.025;
    const spans = [[0, door[0]], [door[1], length]];
    for (const [a, b] of spans) { const n = Math.max(1, Math.round((b - a) / 0.6)), pw = (b - a - gap * (n - 1)) / n; for (let k = 0; k < n; k++) root.add(box(pw, ceiling, d, OATL, a + pw / 2 + k * (pw + gap), 0, 0)); }
    root.add(box(length, 0.06, d - 0.01, PS5B, length / 2, 0, 0));                                  // shadow-gap skirting
    const toe = led(0xffc890, 2); moods.strips.push(toe); root.add(box(length - 0.04, 0.006, 0.006, toe, length / 2, 0.02, 0.02));
    for (const x of [0.012, length - 0.012]) root.add(box(0.008, ceiling, 0.004, BRASS, x, 0, d));
    // hidden door (push-to-open), same panels, opens into the closet
    const dw = door[1] - door[0], dr = g(); const n = 2, pw = (dw - 0.006 - gap) / n;
    for (let k = 0; k < n; k++) dr.add(box(pw, ceiling - 0.006, d, OATL, 0.003 + pw / 2 + k * (pw + gap), 0.003, 0));
    dr.position.set(door[0], 0, 0); tagGroup(dr, { type: 'cab', hinge: [door[0], 0, 0], a1: Math.PI * 0.5, label: 'hidden walk-in door' }); root.add(dr);
    // arched mirror with warm halo
    const mw = 0.66, mh = 1.7, my = 0.3;
    const arch = new THREE.Shape(); arch.moveTo(-mw / 2, 0); arch.lineTo(mw / 2, 0); arch.lineTo(mw / 2, mh - mw / 2); arch.absarc(0, mh - mw / 2, mw / 2, 0, Math.PI, false); arch.lineTo(-mw / 2, 0);
    const halo = led(0xffd2a0, 2.6); moods.strips.push(halo);
    const back = new THREE.Mesh(new THREE.ExtrudeGeometry(arch, { depth: 0.02, bevelEnabled: false }), halo); back.scale.set(1.05, 1.03, 1); back.position.set(mirrorAt, my - 0.02, d); root.add(back);
    // owner: the walk-in already has a mirror → the arch is a backlit clay-plaster 'portal' with a brass shelf and a vase
    const clay = canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#b98b6e'; x.fillRect(0, 0, w, h); for (let k = 0; k < 2600; k++) { x.fillStyle = `rgba(${90 + Math.random() * 60},${60 + Math.random() * 40},${40 + Math.random() * 30},0.08)`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 10, 0, 7); x.fill(); } });
    const portal = new THREE.Mesh(new THREE.ExtrudeGeometry(arch, { depth: 0.015, bevelEnabled: false }), new THREE.MeshStandardMaterial({ map: clay, roughness: 0.95, name: '__clay_plaster_arch' }));
    portal.position.set(mirrorAt, my, d + 0.025); root.add(portal);
    root.add(box(0.42, 0.02, 0.12, BRASS, mirrorAt, my + 0.75, d + 0.04, 0.003));
    const vz = g(); vz.add(cyl(0.045, 0.06, 0.2, () => M('__vase_cream', 0xe9dfcf), 0, 0, 0, 24)); vz.add(cyl(0.004, 0.004, 0.3, () => M('__dried_stem', 0x8c7a5c), 0.01, 0.2, 0, 6));
    vz.position.set(mirrorAt + 0.08, my + 0.77, d + 0.1); root.add(loose(vz));
    // art canvas (warm abstract), 1.1 × 0.8, with a picture light
    const art = canvasTex(512, 372, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#d9c7ad'); gr.addColorStop(1, '#b89a7c'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.globalAlpha = 0.85; [['#8f8378', 150, 200, 120], ['#c26f4f', 330, 150, 80], ['#7d8a62', 380, 270, 60], ['#efe6d8', 230, 110, 50]].forEach(([c, cx, cy, r]) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); });
      x.globalAlpha = 1; x.strokeStyle = '#3b2f27'; x.lineWidth = 4; x.beginPath(); x.moveTo(60, 300); x.bezierCurveTo(200, 120, 300, 340, 470, 90); x.stroke(); });
    root.add(box(1.14, 0.84, 0.035, OAK, artAt, 1.03, d));
    const cv = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), new THREE.MeshStandardMaterial({ map: art, roughness: 0.9, name: '__art_canvas_mb' })); cv.position.set(artAt, 1.45, d + 0.036); root.add(cv);
    const pl = led(0xffd2a0, 2.4); moods.strips.push(pl); root.add(box(0.5, 0.02, 0.06, BRASS, artAt, 1.9, d + 0.02)); root.add(box(0.46, 0.006, 0.01, pl, artAt, 1.895, d + 0.07));
    return { obj: root, moods };
  }
  /* ================= Puja double doors (owner reference 2026-11-11: references/puja/2026-11-11_teak-glass-brass-grid-cane-puja-doors.png)
     Teak frame + two leaves: reeded glass behind a brass grid with eight-point brass stars (top), a teal enamel band with
     brass Shanku · Namam · Chakra emblems, a cane (rattan) panel in a moulded frame (bottom), long brass pulls with finials
     on the meeting stiles, teak head panel up to the ceiling with a downlight. Local frame: x along the opening (centre 0),
     y up, z = 0 on the opening line, +z = the side the doors are seen from (passage); the leaves swing to −z (into the puja). */
  function pujaDoors({ W = 1.273, H = 2.1, ceil = 2.91, swing = 'in' } = {}) {
    const root = g(), moods = { strips: [], halos: [] };
    const TK = WOOD, BR = BRASS;
    const jamb = 0.045, fd = 0.12, t = 0.042, gapC = 0.003, wl = (W - 2 * jamb - 3 * gapC) / 2, zf = -0.05;
    // frame (casing) + head panel to the ceiling
    root.add(box(jamb, H + 0.05, fd, TK, -W / 2 + jamb / 2, 0, -0.1, 0.004));
    root.add(box(jamb, H + 0.05, fd, TK, W / 2 - jamb / 2, 0, -0.1, 0.004));
    root.add(box(W, ceil - H - 0.004, fd, TK, 0, H + 0.004, -0.1, 0.004));
    root.add(box(W - 0.12, 0.012, 0.004, () => M('__puja_teak_dark', 0x5e3b22), 0, H + 0.22, 0.02));
    // downlight in the frame head (outside, as in the reference) + its glow on the door faces
    const dl = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.006, 24), led(0xffd9a0, 3)); moods.strips.push(dl.material); dl.position.set(0, H + 0.001, 0.0); root.add(dl);
    root.add(cyl(0.04, 0.04, 0.004, BR, 0, H + 0.0, 0, 24));
    { const cv = canvasTex(128, 256, (x, w, h) => { const gr = x.createRadialGradient(w / 2, 0, 4, w / 2, 0, h); gr.addColorStop(0, 'rgba(255,214,150,0.22)'); gr.addColorStop(1, 'rgba(255,214,150,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
      const wm = new THREE.MeshBasicMaterial({ map: cv, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, name: '__puja_wash' });
      const wp = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), wm); wp.position.set(0, H - 0.7, 0.012); root.add(wp); moods.halos.push(wm); }
    // materials of the leaf infills
    const reeded = new THREE.MeshStandardMaterial({ name: '__reeded_glass', transparent: true, opacity: 0.6, roughness: 0.2, metalness: 0, color: 0xf4ecdc, emissive: new THREE.Color(0x2a1e0e), emissiveIntensity: 0.5,
      map: canvasTex(256, 32, (x, w, h) => { for (let i = 0; i < w; i += 4) { const gr = x.createLinearGradient(i, 0, i + 4, 0); gr.addColorStop(0, '#d9cbb0'); gr.addColorStop(0.5, '#fbf3e2'); gr.addColorStop(1, '#bfae8e'); x.fillStyle = gr; x.fillRect(i, 0, 4, h); } }) });
    reeded.map.wrapS = reeded.map.wrapT = THREE.RepeatWrapping; reeded.map.repeat.set(wl / 0.256 * 0.25, 1);
    const cane = new THREE.MeshStandardMaterial({ roughness: 0.75, name: '__puja_cane', map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#d6b98a'; x.fillRect(0, 0, w, h);
      const s3 = 16; x.fillStyle = '#6b5236'; for (let r = 0; r < h / s3 + 1; r++) for (let c = 0; c < w / s3 + 1; c++) { x.beginPath(); x.arc(c * s3 + (r % 2) * s3 / 2, r * s3, 4.2, 0, 7); x.fill(); }
      x.strokeStyle = 'rgba(160,120,70,0.6)'; x.lineWidth = 1.5; for (let k = -h; k < w; k += 8) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + h, h); x.stroke(); x.beginPath(); x.moveTo(k + h, 0); x.lineTo(k, h); x.stroke(); } }) });
    cane.map.wrapS = cane.map.wrapT = THREE.RepeatWrapping; cane.map.repeat.set(2.2, 2.6);
    const band = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.15, name: '__teal_enamel_emblems', map: canvasTex(512, 160, (x, w, h) => {
      x.fillStyle = '#0d5b5c'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c9a24a'; x.lineWidth = 5; x.strokeRect(5, 5, w - 10, h - 10);
      const gold = (a, b) => { const gr = x.createLinearGradient(0, a, 0, b); gr.addColorStop(0, '#f1d48a'); gr.addColorStop(0.5, '#c79a3f'); gr.addColorStop(1, '#8f6a25'); return gr; };
      const stand = cx => { x.fillStyle = gold(110, 150); x.beginPath(); x.moveTo(cx - 34, 146); x.lineTo(cx + 34, 146); x.lineTo(cx + 22, 134); x.lineTo(cx + 8, 128); x.lineTo(cx + 8, 112); x.lineTo(cx - 8, 112); x.lineTo(cx - 8, 128); x.lineTo(cx - 22, 134); x.closePath(); x.fill(); };
      // Shankha (left): conch in a flame-edged halo on a stand
      const halo = cx => { x.fillStyle = gold(20, 112); x.beginPath(); x.arc(cx, 72, 36, 0, 7); x.fill(); x.fillStyle = '#0d5b5c'; x.beginPath(); x.arc(cx, 72, 27, 0, 7); x.fill(); x.fillStyle = gold(14, 30); x.beginPath(); x.moveTo(cx, 12); x.lineTo(cx + 8, 32); x.lineTo(cx - 8, 32); x.closePath(); x.fill(); };
      halo(92); stand(92); x.fillStyle = gold(50, 100); x.beginPath(); x.ellipse(92, 74, 15, 21, 0.35, 0, 7); x.fill(); x.strokeStyle = '#8f6a25'; x.lineWidth = 3; x.beginPath(); x.arc(92, 74, 9, 0.5, 4.5); x.stroke();
      // Chakra (right): wheel with spokes in the halo on a stand
      halo(420); stand(420); x.strokeStyle = gold(40, 110); x.lineWidth = 5; x.beginPath(); x.arc(420, 72, 19, 0, 7); x.stroke(); x.lineWidth = 3; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; x.beginPath(); x.moveTo(420, 72); x.lineTo(420 + Math.cos(a) * 19, 72 + Math.sin(a) * 19); x.stroke(); }
      // Namam (centre): tall U with the centre line on a stand
      x.fillStyle = gold(18, 120); x.beginPath(); x.moveTo(214, 18); x.lineTo(236, 18); x.lineTo(250, 104); x.lineTo(262, 104); x.lineTo(276, 18); x.lineTo(298, 18); x.lineTo(278, 118); x.lineTo(234, 118); x.closePath(); x.fill();
      x.fillStyle = '#e8c46a'; x.beginPath(); x.moveTo(252, 30); x.lineTo(260, 30); x.lineTo(258, 100); x.lineTo(254, 100); x.closePath(); x.fill();
      x.fillStyle = gold(118, 150); x.fillRect(222, 118, 68, 10); x.beginPath(); x.moveTo(226, 146); x.lineTo(286, 146); x.lineTo(276, 128); x.lineTo(236, 128); x.closePath(); x.fill(); }) });
    const star = (() => { const sh = new THREE.Shape(); for (let k = 0; k < 16; k++) { const r = k % 2 ? 0.0105 : 0.022, a = k * Math.PI / 8 + Math.PI / 2; const px = Math.cos(a) * r, py = Math.sin(a) * r; if (k) sh.lineTo(px, py); else sh.moveTo(px, py); } sh.closePath(); return new THREE.ExtrudeGeometry(sh, { depth: 0.003, bevelEnabled: false }); })();
    const sw = 0.085, y0c = 0.12, y1c = 0.78, y0b = 0.82, y1b = 0.96, y0g = 1.0, y1g = H - 0.12;
    function leaf(sx) {
      // hinge-local: the leaf runs from x 0 to sx·wl, faces z zf … zf + t
      const L = g(), cx = sx * wl / 2, z0 = zf, inner = wl - 2 * sw;
      const pane = (w, h, x, y, m, d = 0.012) => { const b = box(w, h, d, m, x, y, z0 + (t - d) / 2); L.add(b); return b; };
      L.add(box(sw, H, t, TK, sx * sw / 2, 0, z0, 0.003)); L.add(box(sw, H, t, TK, sx * (wl - sw / 2), 0, z0, 0.003));
      for (const [ya, yb] of [[0, y0c], [y1c, y0b], [y1b, y0g], [y1g, H]]) L.add(box(inner, yb - ya, t, TK, cx, ya, z0, 0.002));
      // cane panel in a raised moulding, teal band, reeded glass
      pane(inner, y1c - y0c, cx, y0c, () => M('__puja_teak_dark', 0x5e3b22), 0.02);
      const cn = pane(inner - 0.06, y1c - y0c - 0.06, cx, y0c + 0.03, cane, 0.024);
      for (const fz of [z0 - 0.002, z0 + t - 0.006]) for (const [w2, h2, xx, yy] of [[inner - 0.03, 0.015, cx, y0c + 0.015], [inner - 0.03, 0.015, cx, y1c - 0.03], [0.015, y1c - y0c - 0.03, cx - sx * (inner / 2 - 0.022), y0c + 0.015], [0.015, y1c - y0c - 0.03, cx + sx * (inner / 2 - 0.022), y0c + 0.015]])
        L.add(box(w2, h2, 0.008, TK, xx, yy, fz, 0.002));
      pane(inner, y1b - y0b, cx, y0b, band, 0.03);
      for (const fz of [z0 - 0.002, z0 + t - 0.004]) { L.add(box(inner, 0.008, 0.006, BR, cx, y0b, fz)); L.add(box(inner, 0.008, 0.006, BR, cx, y1b - 0.008, fz)); }
      pane(inner, y1g - y0g, cx, y0g, reeded, 0.008);
      // brass grid (outside face) + stars + brass bead round the glass
      const gz = z0 + t + 0.001, cols = 4, rows = 10, gw = inner - 0.02, gh = y1g - y0g - 0.02;
      for (let c = 0; c <= cols; c++) L.add(box(0.006, gh, 0.005, BR, cx - gw / 2 + gw * c / cols, y0g + 0.01, gz - 0.003));
      for (let r = 0; r <= rows; r++) L.add(box(gw, 0.006, 0.005, BR, cx, y0g + 0.01 + gh * r / rows - 0.003, gz - 0.003));
      const sp = [];
      for (let k = 0; k < 14; k++) { const a = Math.PI / 2 + 2 * Math.PI * k / 14; sp.push([Math.cos(a) * 0.34, Math.sin(a) * 0.44]); }
      sp.push([-0.36, 0.47], [0.36, 0.47]);
      for (const [u, v] of sp) { const st = new THREE.Mesh(star, BR()); st.position.set(cx + u * gw * sx, y0g + 0.01 + gh * (0.5 + v), gz + 0.001); L.add(st); }
      // long brass pull with finials on the meeting stile (both faces)
      const hx = sx * (wl - sw / 2);
      for (const [fz, dir] of [[z0 + t, 1], [z0, -1]]) {
        const zz = fz + dir * 0.04, ya = y1b + 0.02, yb = y1b + 0.5;
        L.add(cyl(0.009, 0.009, yb - ya, BR, hx, ya, zz, 16));
        for (const yy of [ya + 0.03, yb - 0.03]) { const st = cyl(0.006, 0.006, 0.04, BR, 0, 0, 0, 12); st.rotation.x = Math.PI / 2; st.position.set(hx, yy, fz + dir * 0.02); L.add(st); }
        for (const yy of [ya, yb]) { const fin = new THREE.Mesh(new THREE.SphereGeometry(0.016, 16, 12), BR()); fin.position.set(hx, yy, zz); fin.scale.y = 1.3; L.add(fin); const tip = cyl(0.002, 0.012, 0.03, BR, hx, yy + (yy === yb ? 0.012 : -0.042), zz, 12); L.add(tip); }
      }
      return L;
    }
    const hingeX = W / 2 - jamb - gapC;
    for (const sx of [1, -1]) {
      const L = leaf(sx), hx = -sx * hingeX;
      L.position.set(hx, 0, 0);
      // inward swing: the free edge goes to −z (left leaf +90°, right leaf −90°)
      const a = swing === 'in' ? sx * Math.PI * 0.5 : -sx * Math.PI * 0.5;
      tagGroup(L, { type: 'cab', hinge: [hx, 0, swing === 'in' ? zf : zf + t], a1: a, label: 'puja door', fitted: true });
      root.add(L);
    }
    return { obj: root, moods, size: { w: W, h: ceil } };
  }

  /* ================= Temple-front puja doors (owner reference 2026-11-11: references/puja/2026-11-11_temple-brass-surround-glass-puja-doors.png)
     Stepped teak gopuram tiers up to the ceiling, ornate brass frieze (lattice, scroll ends, Shanku·Namam·Chakra plaque,
     row of kalasa finials), brass side pilasters with stacked motifs, moulded dark-teak door frame, two frameless clear glass
     leaves with patch fittings and a brass lotus medallion split across the meeting edge. Same local frame as pujaDoors. */
  function templeDoors({ W = 1.273, ceil = 2.91 } = {}) {
    const root = g(), moods = { strips: [], halos: [] };
    const TK = WOOD, DK = DARK, pil = 0.12, fw = 0.075, Hd = 2.05, fTop = 2.12, frTop = 2.4;
    // embossed brass: colour map + bump map drawn from the same canvas
    const brassArt = (cw, chh, draw, rx = 1, ry = 1) => { const cv = document.createElement('canvas'); cv.width = cw; cv.height = chh; const x = cv.getContext('2d'); draw(x, cw, chh);
      const col = new THREE.CanvasTexture(cv); col.colorSpace = THREE.SRGBColorSpace; const bump = new THREE.CanvasTexture(cv);
      for (const t of [col, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
      return new THREE.MeshStandardMaterial({ map: col, bumpMap: bump, bumpScale: 2.5, metalness: 0.75, roughness: 0.38, name: '__temple_brass_relief' }); };
    const G1 = '#f0d083', G2 = '#b8892e', G3 = '#5c4416';
    const pilMat = brassArt(128, 512, (x, w, h) => { x.fillStyle = G3; x.fillRect(0, 0, w, h); x.fillStyle = G2; x.fillRect(6, 0, w - 12, h);
      for (let k = 0; k < 4; k++) { const y0 = k * 128; x.fillStyle = G1;
        x.beginPath(); x.ellipse(w / 2, y0 + 40, 30, 26, 0, 0, 7); x.fill(); x.fillStyle = G3; x.beginPath(); x.ellipse(w / 2, y0 + 40, 16, 13, 0, 0, 7); x.fill(); x.fillStyle = G1; x.beginPath(); x.arc(w / 2, y0 + 40, 7, 0, 7); x.fill();
        x.fillStyle = G1; x.beginPath(); x.moveTo(w / 2 - 34, y0 + 120); x.quadraticCurveTo(w / 2 - 40, y0 + 80, w / 2, y0 + 72); x.quadraticCurveTo(w / 2 + 40, y0 + 80, w / 2 + 34, y0 + 120); x.closePath(); x.fill();
        x.fillStyle = G3; for (let r = 0; r < 4; r++) x.fillRect(w / 2 - 28 + r * 2, y0 + 86 + r * 8, 56 - r * 4, 3); x.fillStyle = G1; x.fillRect(8, y0 + 124, w - 16, 4); } }, 1, 5);
    const friezeMat = brassArt(1024, 192, (x, w, h) => { x.fillStyle = G2; x.fillRect(0, 0, w, h);
      x.strokeStyle = G1; x.lineWidth = 3; for (let k = -h; k < w; k += 18) { x.beginPath(); x.moveTo(k, 30); x.lineTo(k + h - 60, h - 30); x.stroke(); x.beginPath(); x.moveTo(k + h - 60, 30); x.lineTo(k, h - 30); x.stroke(); }
      x.fillStyle = G1; x.fillRect(0, 0, w, 26); x.fillRect(0, h - 26, w, 26); x.fillStyle = G3; for (let k = 0; k < w; k += 16) { x.beginPath(); x.arc(k + 8, 13, 5, 0, 7); x.fill(); x.beginPath(); x.arc(k + 8, h - 13, 5, 0, 7); x.fill(); }
      for (const ex of [0, w]) { x.fillStyle = G1; x.beginPath(); x.arc(ex ? w - 52 : 52, h / 2, 46, 0, 7); x.fill(); x.strokeStyle = G3; x.lineWidth = 6; x.beginPath(); x.arc(ex ? w - 52 : 52, h / 2, 30, 0.3, 5.6); x.stroke(); }
      // central plaque: Shanku · Namam · Chakra
      const px = w / 2; x.fillStyle = G3; x.fillRect(px - 170, 36, 340, h - 72); x.fillStyle = G1; x.fillRect(px - 162, 44, 324, h - 88); x.fillStyle = '#7a1f1a'; x.fillRect(px - 150, 52, 300, h - 104);
      x.fillStyle = G1; x.beginPath(); x.arc(px - 95, h / 2, 26, 0, 7); x.fill(); x.fillStyle = '#7a1f1a'; x.beginPath(); x.arc(px - 95, h / 2, 12, 0, 7); x.fill();
      x.strokeStyle = G1; x.lineWidth = 5; x.beginPath(); x.arc(px + 95, h / 2, 24, 0, 7); x.stroke(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; x.beginPath(); x.moveTo(px + 95, h / 2); x.lineTo(px + 95 + Math.cos(a) * 24, h / 2 + Math.sin(a) * 24); x.stroke(); }
      x.fillStyle = '#f7f1e3'; x.beginPath(); x.moveTo(px - 30, 58); x.lineTo(px - 16, 58); x.lineTo(px - 6, h - 62); x.lineTo(px + 6, h - 62); x.lineTo(px + 16, 58); x.lineTo(px + 30, 58); x.lineTo(px + 16, h - 56); x.lineTo(px - 16, h - 56); x.closePath(); x.fill();
      x.fillStyle = '#d63a1e'; x.fillRect(px - 4, 62, 8, h - 126); }, 1, 1);
    // teak backing behind the whole frontage + head up to the ceiling
    root.add(box(W, ceil - fTop, 0.03, TK, 0, fTop, -0.05));
    for (const sx of [-1, 1]) root.add(box(pil, fTop, 0.03, TK, sx * (W / 2 - pil / 2), 0, -0.05));
    // brass pilasters
    for (const sx of [-1, 1]) root.add(box(pil, frTop, 0.05, () => pilMat, sx * (W / 2 - pil / 2), 0, -0.02, 0.004));
    // brass frieze + kalasa finial row + scroll curls
    root.add(box(W, frTop - fTop, 0.055, () => friezeMat, 0, fTop, -0.02, 0.004));
    for (let fx = -W / 2 + 0.04; fx <= W / 2 - 0.035; fx += 0.052) {
      const k = g(); k.add(cyl(0.012, 0.016, 0.012, BRASS, 0, 0, 0, 12)); const b = new THREE.Mesh(new THREE.SphereGeometry(0.015, 12, 10), BRASS()); b.position.y = 0.024; k.add(b); k.add(cyl(0.001, 0.007, 0.03, BRASS, 0, 0.036, 0, 10));
      k.position.set(fx, frTop, 0.012); root.add(k); }
    // stepped gopuram tiers (each a ledge over a recessed band), narrower and shallower going up, last band meets the ceiling
    let y = frTop + 0.005;
    for (let i = 0; i < 4 && y < ceil - 0.02; i++) {
      const lw = W - i * 0.12, lz = 0.17 - i * 0.035, bh = 0.085;
      root.add(box(lw, 0.035, lz + 0.05, TK, 0, y, -0.05, 0.006)); y += 0.035;
      const bh2 = Math.min(bh, ceil - y); if (bh2 <= 0.005) break;
      root.add(box(lw - 0.06, bh2, lz + 0.01, TK, 0, y, -0.05)); y += bh2;
    }
    // moulded dark-teak door frame inside the pilasters + threshold
    const fx0 = W / 2 - pil;
    for (const sx of [-1, 1]) { root.add(box(fw, fTop, 0.11, DK, sx * (fx0 - fw / 2), 0, -0.06, 0.006)); root.add(box(0.02, fTop - 0.02, 0.012, DK, sx * (fx0 - fw - 0.01), 0, 0.04, 0.003)); }
    root.add(box(2 * fx0, fTop - Hd, 0.11, DK, 0, Hd, -0.06, 0.006));
    root.add(box(2 * fx0 - 2 * fw, 0.025, 0.11, DK, 0, 0, -0.06, 0.004));
    // glass leaves (swing into the puja) with brass patch fittings + lotus medallion halves on the outside face
    const clear = new THREE.MeshStandardMaterial({ name: '__clear_glass_door', color: 0xe8f0ee, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0 });
    const gap = 0.003, wl = (2 * (fx0 - fw) - 3 * gap) / 2, hinge = fx0 - fw - gap, zf = -0.02, tg = 0.01, gy0 = 0.03, gy1 = Hd - 0.005;
    const petal = new THREE.SphereGeometry(1, 14, 10);
    for (const sx of [1, -1]) {
      const L = g(), hx = -sx * hinge;
      const pane = box(wl, gy1 - gy0, tg, () => clear, sx * wl / 2, gy0, zf); L.add(pane);
      for (const yy of [gy0, gy1 - 0.09]) L.add(box(0.11, 0.09, tg + 0.012, BRASS, sx * 0.055, yy, zf - 0.006, 0.004));
      // lotus: 2 rings of petals + seed head, only the half on this leaf's side of the meeting edge
      const mx = sx * wl, my = 1.25, mz = zf + tg + 0.004;
      for (const [n, r, sc, off] of [[16, 0.105, [0.034, 0.016, 0.006], 0], [12, 0.068, [0.03, 0.014, 0.008], 0.13]]) for (let k = 0; k < n; k++) {
        const a = k * 2 * Math.PI / n + off, px = Math.cos(a) * r; if (-px * sx < sc[1] + 0.003) continue;
        const pm = new THREE.Mesh(petal, BRASS()); pm.scale.set(sc[0], sc[1], sc[2]); pm.rotation.z = a; pm.position.set(mx + px, my + Math.sin(a) * r, mz); L.add(pm); }
      const seed = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 24, 1, false, sx > 0 ? Math.PI : 0, Math.PI), BRASS()); seed.rotation.x = Math.PI / 2; seed.position.set(mx, my, mz); L.add(seed);
      // slim brass pull on the meeting edge
      L.add(cyl(0.008, 0.008, 0.3, BRASS, sx * (wl - 0.04), 0.95, zf + tg + 0.035, 12));
      L.position.set(hx, 0, 0);
      tagGroup(L, { type: 'cab', hinge: [hx, 0, zf], a1: sx * Math.PI * 0.5, label: 'puja door', fitted: true });
      root.add(L);
    }
    // ceiling downlight in front of the tiers + soft wash on the frontage
    const dl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.006, 24), led(0xffe2b0, 3)); moods.strips.push(dl.material); dl.position.set(0, ceil - 0.004, 0.42); root.add(dl);
    { const cv = canvasTex(128, 256, (x, w, h) => { const gr = x.createRadialGradient(w / 2, 0, 4, w / 2, 0, h); gr.addColorStop(0, 'rgba(255,220,160,0.28)'); gr.addColorStop(1, 'rgba(255,220,160,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
      const wm = new THREE.MeshBasicMaterial({ map: cv, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, name: '__puja_wash' });
      const wp = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), wm); wp.position.set(0, 1.6, 0.05); root.add(wp); moods.halos.push(wm); }
    return { obj: root, moods, size: { w: W, h: ceil } };
  }

  /* ================= Kerala mandapam puja doors (owner reference 2026-11-11: references/puja/2026-11-11_kerala-tiled-roof-carved-teak-puja-doors.png)
     Terracotta-tiled half-hip roof over the opening with a brass finial, fretwork valance under the eaves, carved gilt
     frieze, turned teak pillars on square plinths, teak door frame and two carved teak leaves (chakra / shankha top panels,
     narrow glass slit on the meeting side, quatrefoil jaali, small scroll panel, big peacock panel), brass pulls + tower bolt.
     Same local frame as pujaDoors (x along the opening, +z = passage, leaves swing to −z). */
  function keralaDoors({ W = 1.273, ceil = 2.91 } = {}) {
    const root = g(), TK = WOOD, pilW = 0.12, fw = 0.07, Hd = 2.05, fTop = 2.13;
    const carved = (cw, chh, draw, base = '#7a4a26', bumpS = 3) => { const cv = document.createElement('canvas'); cv.width = cw; cv.height = chh; const x = cv.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, cw, chh); draw(x, cw, chh);
      const col = new THREE.CanvasTexture(cv); col.colorSpace = THREE.SRGBColorSpace; const bump = new THREE.CanvasTexture(cv);
      return new THREE.MeshStandardMaterial({ map: col, bumpMap: bump, bumpScale: bumpS, roughness: 0.55, name: '__carved_teak' }); };
    const HI = '#b9834e', LO = '#4a2a14';
    const scroll = (x, cx, cy, r, dir = 1) => { x.beginPath(); for (let t = 0; t < 12; t += 0.2) { const rr = r * (1 - t / 13), a = dir * t; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; t ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); };
    const frame = (x, w, h) => { x.strokeStyle = HI; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16); x.strokeStyle = LO; x.lineWidth = 3; x.strokeRect(18, 18, w - 36, h - 36); };
    const chakraM = carved(256, 256, (x, w, h) => { frame(x, w, h); x.strokeStyle = HI; x.lineWidth = 10; x.beginPath(); x.arc(w / 2, h / 2, 70, 0, 7); x.stroke(); x.lineWidth = 6; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; x.beginPath(); x.moveTo(w / 2, h / 2); x.lineTo(w / 2 + Math.cos(a) * 70, h / 2 + Math.sin(a) * 70); x.stroke(); } x.fillStyle = HI; x.beginPath(); x.arc(w / 2, h / 2, 18, 0, 7); x.fill(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; x.beginPath(); x.moveTo(w / 2 + Math.cos(a) * 80, h / 2 + Math.sin(a) * 80); x.lineTo(w / 2 + Math.cos(a + 0.2) * 100, h / 2 + Math.sin(a + 0.2) * 100); x.lineTo(w / 2 + Math.cos(a - 0.2) * 100, h / 2 + Math.sin(a - 0.2) * 100); x.fill(); } });
    const shankhaM = carved(256, 256, (x, w, h) => { frame(x, w, h); x.fillStyle = HI; x.beginPath(); x.ellipse(w / 2, h / 2 + 6, 52, 74, 0.25, 0, 7); x.fill(); x.strokeStyle = LO; x.lineWidth = 6; scroll(x, w / 2 + 8, h / 2 - 10, 40); x.fillStyle = HI; x.beginPath(); x.moveTo(w / 2 - 40, h - 40); x.lineTo(w / 2 + 40, h - 40); x.lineTo(w / 2 + 20, h - 62); x.lineTo(w / 2 - 20, h - 62); x.closePath(); x.fill(); x.strokeStyle = HI; x.lineWidth = 6; scroll(x, 50, 60, 26); scroll(x, w - 50, 60, 26, -1); });
    const scrollM = carved(256, 128, (x, w, h) => { frame(x, w, h); x.strokeStyle = HI; x.lineWidth = 7; scroll(x, w * 0.3, h / 2, 34); scroll(x, w * 0.7, h / 2, 34, -1); x.beginPath(); x.moveTo(w * 0.42, h / 2); x.quadraticCurveTo(w / 2, h * 0.15, w * 0.58, h / 2); x.stroke(); });
    const peacockM = carved(256, 384, (x, w, h) => { frame(x, w, h); x.strokeStyle = HI; x.fillStyle = HI; x.lineWidth = 7;
      // peacock: body, neck, crest, fanned tail of scrolls
      x.beginPath(); x.ellipse(w * 0.55, h * 0.62, 34, 50, -0.4, 0, 7); x.fill(); x.beginPath(); x.moveTo(w * 0.62, h * 0.5); x.quadraticCurveTo(w * 0.75, h * 0.32, w * 0.62, h * 0.26); x.stroke(); x.beginPath(); x.arc(w * 0.62, h * 0.25, 11, 0, 7); x.fill();
      for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(w * 0.62, h * 0.23); x.lineTo(w * (0.56 + k * 0.05), h * 0.15); x.stroke(); }
      for (let k = 0; k < 6; k++) scroll(x, w * (0.18 + (k % 3) * 0.12), h * (0.42 + Math.floor(k / 3) * 0.24), 26, k % 2 ? 1 : -1);
      x.beginPath(); x.moveTo(w * 0.2, h * 0.86); x.quadraticCurveTo(w / 2, h * 0.75, w * 0.85, h * 0.86); x.stroke(); });
    const friezeM = carved(1024, 128, (x, w, h) => { x.fillStyle = '#9a7232'; x.fillRect(0, 0, w, h); x.strokeStyle = '#e2bd6a'; x.lineWidth = 6; for (let k = 0; k < w; k += 64) { scroll(x, k + 20, h / 2, 22); scroll(x, k + 50, h / 2, 22, -1); } x.fillStyle = '#f4d58a'; x.fillRect(0, 0, w, 10); x.fillRect(0, h - 10, w, 10); }, '#9a7232', 4);
    friezeM.metalness = 0.5; friezeM.roughness = 0.4;
    const jaali = new THREE.MeshStandardMaterial({ name: '__jaali_quatrefoil', color: 0xffffff, roughness: 0.6, alphaTest: 0.5, side: THREE.DoubleSide, map: canvasTex(128, 256, (x, w, h) => {
      x.fillStyle = '#7a4a26'; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-out';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const cx = 32 + c * 64, cy = 32 + r * 64; for (const [dx, dy] of [[0, -11], [0, 11], [-11, 0], [11, 0]]) { x.beginPath(); x.arc(cx + dx, cy + dy, 10, 0, 7); x.fill(); } }
      x.globalCompositeOperation = 'source-over'; }) });
    // back panel (teak) behind the frontage up to the eaves
    root.add(box(W, ceil - fTop, 0.03, TK, 0, fTop, -0.06));
    for (const sx of [-1, 1]) root.add(box(pilW, fTop, 0.03, TK, sx * (W / 2 - pilW / 2), 0, -0.06));
    // turned pillars on square plinths + capitals
    const prof = [[0.0, 0], [0.045, 0], [0.045, 0.02], [0.03, 0.03], [0.05, 0.08], [0.03, 0.14], [0.034, 0.2], [0.026, 0.24], [0.026, 0.9], [0.046, 1.0], [0.026, 1.1], [0.026, 1.6], [0.04, 1.66], [0.05, 1.74], [0.03, 1.82], [0.036, 1.86], [0.028, 1.9], [0.0, 1.9]].map(([r, y]) => new THREE.Vector2(r, y));
    const lathe = new THREE.LatheGeometry(prof, 20);
    for (const sx of [-1, 1]) { const px = sx * (W / 2 - pilW / 2);
      root.add(box(0.11, 0.14, 0.11, TK, px, 0, 0.0, 0.006));
      const lt = new THREE.Mesh(lathe, TK()); lt.position.set(px, 0.14, 0.055); root.add(lt);
      root.add(box(0.11, fTop - 2.04, 0.11, TK, px, 2.04, 0.0, 0.006)); }
    // door frame + threshold
    const fx0 = W / 2 - pilW;
    for (const sx of [-1, 1]) root.add(box(fw, fTop, 0.1, TK, sx * (fx0 - fw / 2), 0, -0.05, 0.005));
    root.add(box(2 * fx0, fTop - Hd, 0.1, TK, 0, Hd, -0.05, 0.005));
    root.add(box(2 * fx0 - 2 * fw, 0.05, 0.1, TK, 0, 0, -0.05, 0.004));
    // carved gilt frieze + fretwork valance + half-hip tiled roof + brass finial
    const yF = fTop, hF = 0.14; root.add(box(W, hF, 0.06, () => friezeM, 0, yF, -0.03, 0.004));
    const eave = yF + hF, depth = 0.42, rise = Math.min(0.5, ceil - eave - 0.08), rw = W + 0.06;
    const fret = new THREE.MeshStandardMaterial({ name: '__fret_valance', color: 0xffffff, roughness: 0.6, alphaTest: 0.5, side: THREE.DoubleSide, map: canvasTex(512, 64, (x, w, h) => {
      x.fillStyle = '#6b4022'; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-out'; for (let k = 0; k < w; k += 32) { x.beginPath(); x.moveTo(k + 16, 14); x.lineTo(k + 26, 30); x.lineTo(k + 16, 46); x.lineTo(k + 6, 30); x.closePath(); x.fill(); x.beginPath(); x.arc(k + 16, h - 4, 10, Math.PI, 0); x.fill(); } x.globalCompositeOperation = 'source-over'; }) });
    fret.map.wrapS = THREE.RepeatWrapping; fret.map.repeat.set(rw / 0.5, 1);
    const fv = new THREE.Mesh(new THREE.PlaneGeometry(rw, 0.075), fret); fv.position.set(0, eave - 0.035, depth - 0.06); root.add(fv);
    for (const sx of [-1, 1]) { const fs = new THREE.Mesh(new THREE.PlaneGeometry(depth, 0.075), fret); fs.rotation.y = Math.PI / 2; fs.position.set(sx * rw / 2, eave - 0.035, depth / 2 - 0.06); root.add(fs); }
    root.add(box(rw, 0.03, depth, TK, 0, eave - 0.005, -0.06));
    { const tiles = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#9c3f22'; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) { const y = r * 32; const gr = x.createLinearGradient(0, y, 0, y + 32); gr.addColorStop(0, '#c4602f'); gr.addColorStop(0.75, '#a9492a'); gr.addColorStop(1, '#5e2414'); x.fillStyle = gr; x.fillRect(0, y, w, 32);
          x.strokeStyle = 'rgba(70,25,12,0.6)'; x.lineWidth = 2; for (let c = (r % 2) * 16; c < w; c += 32) { x.beginPath(); x.moveTo(c, y); x.lineTo(c, y + 32); x.stroke(); } } });
      tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping;
      const tm = new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.7, name: '__mangalore_tiles', side: THREE.DoubleSide });
      // half hip: eave rectangle (x ±rw/2, z −0.06 … depth−0.06) at y eave+0.025; ridge along the wall, inset by the depth at both ends
      const z0 = -0.06, z1 = depth - 0.06, yE = eave + 0.025, yR = yE + rise, rx = Math.max(0.05, rw / 2 - depth);
      const P = [[-rw / 2, yE, z1], [rw / 2, yE, z1], [rx, yR, z0], [-rx, yR, z0], [-rw / 2, yE, z0], [rw / 2, yE, z0]];
      const pos = [], uv = []; const tri = (a, b, c) => { for (const i of [a, b, c]) { const p = P[i]; pos.push(...p); uv.push((p[0] + rw / 2) / 0.3, (p[1] - yE + Math.abs(p[2] - z1)) / 0.12); } };
      tri(0, 1, 2); tri(0, 2, 3); tri(4, 0, 3); tri(1, 5, 2);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
      root.add(new THREE.Mesh(geo, tm));
      // ridge + hip caps
      const capM = () => M('__ridge_tile', 0x8c3a1f);
      const cap = (a, b) => { const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb); const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 10), capM()); c2.position.copy(va).add(vb).multiplyScalar(0.5); c2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()); root.add(c2); };
      cap(P[2], P[3]); cap(P[0], P[3]); cap(P[1], P[2]);
      // brass finial on the ridge centre
      const fin = g(); fin.add(cyl(0.02, 0.03, 0.03, BRASS, 0, 0, 0, 14)); const bb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), BRASS()); bb.position.y = 0.05; fin.add(bb); fin.add(cyl(0.004, 0.016, 0.06, BRASS, 0, 0.075, 0, 12));
      fin.position.set(0, yR, z0 + 0.03); root.add(fin); }
    // carved leaves
    const gap = 0.003, wl = (2 * (fx0 - fw) - 3 * gap) / 2, hinge = fx0 - fw - gap, zf = -0.045, t = 0.045, y0 = 0.05, y1 = Hd;
    const glass = new THREE.MeshStandardMaterial({ name: '__slit_glass', color: 0x2a2a28, transparent: true, opacity: 0.35, roughness: 0.1 });
    for (const sx of [1, -1]) {
      const L = g(), hx = -sx * hinge, X = u => sx * u;   // u = distance from the hinge edge
      const st = 0.06, colW = wl - 2 * st - 0.06 - 0.02, slitW = 0.06;
      L.add(box(st, y1 - y0, t, TK, X(st / 2), y0, zf, 0.003)); L.add(box(st, y1 - y0, t, TK, X(wl - st / 2), y0, zf, 0.003));
      L.add(box(0.02, y1 - y0, t, TK, X(st + colW + 0.01), y0, zf));
      const rail = (ya, yb, u0 = st, u1 = wl - st) => L.add(box(u1 - u0, yb - ya, t, TK, X((u0 + u1) / 2), ya, zf));
      // panels (outer column: colW; inner column: glass slit up top, timber below)
      const panel = (ya, yb, m, u0 = st, u1 = st + colW) => { L.add(box(u1 - u0, yb - ya, t - 0.012, () => m, X((u0 + u1) / 2), ya, zf + 0.006)); };
      rail(y0, 0.2); panel(0.2, 0.78, peacockM, st, wl - st); rail(0.78, 0.86);
      panel(0.86, 1.04, scrollM); rail(1.04, 1.1, st, st + colW);
      { const jm = new THREE.Mesh(new THREE.PlaneGeometry(colW, 0.42), jaali); jm.position.set(X(st + colW / 2), 1.31, zf + t / 2); L.add(jm); L.add(box(colW, 0.42, 0.004, () => M('__jaali_back', 0x1a1410), X(st + colW / 2), 1.1, zf + 0.004)); }
      rail(1.52, 1.6, st, st + colW); panel(1.6, 1.86, sx > 0 ? chakraM : shankhaM); rail(1.86, y1, st, wl - st);
      // inner column: timber below 1.1, glass slit 1.1–1.86
      L.add(box(slitW + 0.02, 1.1 - 0.86, t, TK, X(wl - st - (slitW + 0.02) / 2), 0.86, zf));
      L.add(box(slitW, 1.86 - 1.1, 0.008, () => glass, X(wl - st - 0.01 - slitW / 2), 1.1, zf + t / 2 - 0.004));
      // brass pull (both faces) on the meeting stile
      for (const [fz, dir] of [[zf + t, 1], [zf, -1]]) { const zz = fz + dir * 0.035, ux = X(wl - st / 2);
        L.add(cyl(0.008, 0.008, 0.36, BRASS, ux, 1.08, zz, 14)); for (const yy of [1.1, 1.42]) { const so = cyl(0.005, 0.005, 0.035, BRASS, 0, 0, 0, 10); so.rotation.x = Math.PI / 2; so.position.set(ux, yy, fz + dir * 0.017); L.add(so); }
        for (const yy of [1.08, 1.44]) { const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), BRASS()); b2.position.set(ux, yy, zz); L.add(b2); } }
      // tower bolt on the left leaf's outside face
      if (sx > 0) { L.add(box(0.13, 0.035, 0.012, BRASS, X(wl - 0.09), 0.93, zf + t, 0.003)); L.add(cyl(0.007, 0.007, 0.05, BRASS, X(wl - 0.13), 0.947, zf + t + 0.02, 10)); }
      L.position.set(hx, 0, 0);
      tagGroup(L, { type: 'cab', hinge: [hx, 0, zf], a1: sx * Math.PI * 0.5, label: 'puja door', fitted: true });
      root.add(L);
    }
    return { obj: root, moods: { strips: [], halos: [] }, size: { w: W, h: ceil } };
  }

  /* ================= 3D idol of Sri Venkateswara (owner 2026-11-11) — traditional Tirumala form: dark stone figure with
     gold ornaments, tall gold kireetam, large white Thiruman namam with the red Srichurnam over the eyes, four arms (upper
     right: Sudarshana chakra, upper left: Panchajanya shankha, lower right: varada pointing to the feet, lower left: on the
     hip), Lakshmi on the chest, makara kundalas, sacred thread, gold-bordered pitambara, long flower garlands, lotus
     pedestal. Local frame: pedestal base centre on y 0, faces +z, the idol's right hand is on −x. Height ≈ h. */
  function venkateswaraIdol({ h = 1.25 } = {}) {
    const root = g(), s = h / 1.25;
    const STONE = (() => { const m = new THREE.MeshStandardMaterial({ color: 0x0e0e0f, roughness: 0.14, metalness: 0.1, name: '__idol_black_gloss_stone' }); return () => m; })(), GOLD = (() => { const m = new THREE.MeshStandardMaterial({ color: 0xd9a73e, metalness: 0.85, roughness: 0.28, name: '__idol_gold' }); return () => m; })();
    const WHITE = () => M('__namam_white', 0xf6f3ec), RED = () => M('__srichurnam_red', 0xc4241a), RUBY = () => M('__idol_ruby', 0xa0101e), SILK = () => M('__pitambara_silk', 0xd2a12c);
    const S = (r, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r * s, 20, 14), m()); o.position.set(x * s, y * s, z * s); o.scale.set(sx, sy, sz); root.add(o); return o; };
    const C = (rt, rb, hh, m, x, y, z, seg = 24) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt * s, rb * s, hh * s, seg), m()); o.position.set(x * s, (y + hh / 2) * s, z * s); root.add(o); return o; };
    const lathe = (pts, m, y0 = 0, seg = 32, zs = 1) => { const o = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r * s, y * s)), seg), m()); o.position.y = y0 * s; o.scale.z = zs; root.add(o); return o; };
    const tube = (pts, r, m, seg = 40) => { const c = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x * s, y * s, z * s))); const o = new THREE.Mesh(new THREE.TubeGeometry(c, seg, r * s, 10, false), m()); root.add(o); return { o, c }; };
    const limb = (a, b, r1, r2, m = STONE) => { const va = new THREE.Vector3(...a).multiplyScalar(s), vb = new THREE.Vector3(...b).multiplyScalar(s), len = va.distanceTo(vb);
      const o = new THREE.Mesh(new THREE.CylinderGeometry(r2 * s, r1 * s, len, 16), m()); o.position.copy(va).add(vb).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()); root.add(o);
      const j = new THREE.Mesh(new THREE.SphereGeometry(r2 * s, 14, 10), m()); j.position.copy(vb); root.add(j); return o; };
    // lotus pedestal
    C(0.15, 0.16, 0.035, GOLD, 0, 0, 0, 40);
    for (const [n, r, y, sc] of [[16, 0.13, 0.05, 0.045], [12, 0.1, 0.075, 0.04]]) for (let k = 0; k < n; k++) { const a = k * 2 * Math.PI / n + (r < 0.12 ? 0.13 : 0), p = S(sc, GOLD, Math.cos(a) * r, y, Math.sin(a) * r, 0.55, 1.1, 0.35); p.rotation.y = -a; p.rotation.z = 0.5; }
    C(0.1, 0.11, 0.025, GOLD, 0, 0.09, 0, 32);
    // feet
    for (const sx of [-1, 1]) { const f = S(0.03, STONE, sx * 0.045, 0.125, 0.03, 1, 0.55, 1.9); f.rotation.y = sx * 0.12; C(0.028, 0.026, 0.016, GOLD, sx * 0.045, 0.13, 0.0, 16); S(0.012, GOLD, sx * 0.045, 0.14, 0.06, 1.4, 0.6, 0.8); }
    // pitambara (dhoti): flared lathe from the ankles to the waist, gold hem + front pleats
    lathe([[0.0, 0.0], [0.105, 0.0], [0.11, 0.02], [0.098, 0.12], [0.088, 0.28], [0.09, 0.4], [0.095, 0.46], [0.0, 0.46]], STONE, 0.15, 36, 0.72);
    for (const [y, r] of [[0.155, 0.111], [0.175, 0.109], [0.6, 0.096]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r * s, 0.006 * s, 8, 48), GOLD()); t.rotation.x = Math.PI / 2; t.scale.y = 0.72; t.position.y = y * s; root.add(t); }
    for (let k = -2; k <= 2; k++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.012 * s, 0.42 * s, 0.006 * s), STONE()); pl.position.set(k * 0.016 * s, 0.38 * s, 0.072 * s); root.add(pl); }
    // ornate waist belt with a lion-face clasp
    { const t = new THREE.Mesh(new THREE.TorusGeometry(0.093 * s, 0.014 * s, 10, 48), GOLD()); t.rotation.x = Math.PI / 2; t.scale.y = 0.75; t.position.y = 0.615 * s; root.add(t); S(0.026, GOLD, 0, 0.615, 0.07, 1, 1, 0.5); S(0.01, RUBY, 0, 0.615, 0.083); }
    // torso (narrow waist → chest → shoulders) and neck
    lathe([[0.0, 0.0], [0.088, 0.0], [0.084, 0.08], [0.1, 0.18], [0.122, 0.25], [0.118, 0.29], [0.06, 0.32], [0.0, 0.32]], STONE, 0.62, 36, 0.62);
    C(0.034, 0.038, 0.06, STONE, 0, 0.93, 0, 20);
    // necklaces (layered gold), Lakshmi on the right chest, sacred thread
    for (const [r, y, tw] of [[0.07, 0.92, 0.007], [0.085, 0.89, 0.006], [0.1, 0.86, 0.008], [0.11, 0.82, 0.006]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r * s, tw * s, 8, 48, Math.PI), GOLD()); t.rotation.set(Math.PI, 0, 0); t.rotation.x = Math.PI + 0.9; t.position.set(0, y * s, 0.012 * s); t.scale.z = 0.62; root.add(t); }
    for (let k = 0; k < 7; k++) S(0.008, k % 2 ? RUBY : GOLD, -0.06 + k * 0.02, 0.79 - Math.abs(k - 3) * 0.006, 0.072);
    { const lx = -0.05, ly = 0.86; S(0.02, GOLD, lx, ly, 0.072, 1, 1.2, 0.4); S(0.008, RUBY, lx, ly + 0.003, 0.08); }
    tube([[-0.11, 0.92, 0.0], [-0.06, 0.86, 0.065], [0.0, 0.76, 0.072], [0.06, 0.66, 0.06], [0.09, 0.62, 0.0]], 0.0022, GOLD);
    // long flower garlands from the shoulders to the shins (marigold + white jasmine beads)
    const beads = (pts, n, r = 0.0085) => { const c = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x * s, y * s, z * s))); for (let k = 0; k <= n; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(r * s, 10, 8), GOLD()); b.position.copy(c.getPoint(k / n)); b.scale.y = 1.25; root.add(b); } };
    // long gold bead garlands hanging from the chakra / shankha down to the pedestal (outside the arms)
    for (const sx of [-1, 1]) beads([[sx * 0.205, 0.93, 0.0], [sx * 0.2, 0.7, 0.03], [sx * 0.185, 0.45, 0.035], [sx * 0.16, 0.2, 0.03], [sx * 0.15, 0.13, 0.03]], 46, 0.009);
    // long necklace to the waist + two chains draped across the thighs
    beads([[-0.1, 0.9, 0.04], [-0.07, 0.74, 0.075], [0.0, 0.66, 0.08], [0.07, 0.74, 0.075], [0.1, 0.9, 0.04]], 30, 0.007);
    S(0.016, GOLD, 0, 0.645, 0.082, 1, 1.3, 0.4);
    beads([[-0.12, 0.6, 0.05], [-0.06, 0.47, 0.085], [0.0, 0.44, 0.088], [0.06, 0.47, 0.085], [0.12, 0.6, 0.05]], 30, 0.008);
    beads([[-0.13, 0.56, 0.05], [-0.07, 0.38, 0.085], [0.0, 0.35, 0.088], [0.07, 0.38, 0.085], [0.13, 0.56, 0.05]], 34, 0.008);
    // three Lakshmi medallions across the chest + one on each shoulder
    for (const [mx, my] of [[-0.05, 0.84], [0.0, 0.825], [0.05, 0.84], [-0.112, 0.875], [0.112, 0.875]]) { const md = new THREE.Mesh(new THREE.CylinderGeometry(0.022 * s, 0.022 * s, 0.006 * s, 24), GOLD()); md.rotation.x = Math.PI / 2; md.position.set(mx * s, my * s, (Math.abs(mx) > 0.1 ? 0.03 : 0.072) * s); root.add(md); S(0.009, GOLD, mx, my + 0.004, Math.abs(mx) > 0.1 ? 0.036 : 0.078, 0.8, 1.2, 0.5); }
    // shoulders + armlets
    for (const sx of [-1, 1]) { S(0.042, STONE, sx * 0.118, 0.9, 0, 1, 1, 0.9); const al = new THREE.Mesh(new THREE.TorusGeometry(0.03 * s, 0.006 * s, 8, 24), GOLD()); al.rotation.z = Math.PI / 2; al.position.set(sx * 0.13 * s, 0.84 * s, 0); root.add(al); }
    // lower right arm: varada — hanging forward, palm down, fingers pointing to the feet
    limb([-0.13, 0.88, 0.0], [-0.15, 0.7, 0.02], 0.03, 0.026); limb([-0.15, 0.7, 0.02], [-0.135, 0.55, 0.07], 0.026, 0.022);
    { const hnd = S(0.034, STONE, -0.13, 0.5, 0.088, 0.95, 1.55, 0.3); hnd.rotation.x = -0.15; for (let k = 0; k < 4; k++) { const fg = C(0.006, 0.005, 0.04, STONE, -0.152 + k * 0.014, 0.42, 0.092, 8); }
      for (let k = 0; k < 4; k++) C(0.025, 0.025, 0.007, GOLD, -0.138 + k * 0.001, 0.555 + k * 0.012, 0.068 - k * 0.004, 16); }
    // lower left arm: on the hip (katyavalambita)
    limb([0.13, 0.88, 0.0], [0.17, 0.72, 0.0], 0.03, 0.026); limb([0.17, 0.72, 0.0], [0.105, 0.62, 0.05], 0.026, 0.022);
    { S(0.026, STONE, 0.098, 0.6, 0.06, 1.3, 0.75, 0.6); const fa = new THREE.Vector3(0.17, 0.72, 0.0), fb = new THREE.Vector3(0.105, 0.62, 0.05), dir = fb.clone().sub(fa).normalize();
      for (let k = 0; k < 4; k++) { const bg = new THREE.Mesh(new THREE.TorusGeometry(0.025 * s, 0.004 * s, 8, 20), GOLD()); bg.position.copy(fa.clone().lerp(fb, 0.55 + k * 0.1)).multiplyScalar(s); bg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); root.add(bg); } }
    // upper arms raised outward, holding the chakra (right) and shankha (left)
    for (const sx of [-1, 1]) { limb([sx * 0.11, 0.9, -0.035], [sx * 0.19, 0.86, -0.035], 0.026, 0.022); S(0.02, STONE, sx * 0.2, 0.87, -0.02, 1, 1.1, 0.8); }
    { // Sudarshana chakra with flame points
      const cg = g(); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055 * s, 0.009 * s, 10, 40), GOLD()); cg.add(ring);
      for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, sp = new THREE.Mesh(new THREE.BoxGeometry(0.004 * s, 0.055 * s, 0.004 * s), GOLD()); sp.position.set(Math.cos(a) * 0.027 * s, Math.sin(a) * 0.027 * s, 0); sp.rotation.z = a - Math.PI / 2; cg.add(sp);
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.008 * s, 0.024 * s, 8), GOLD()); fl.position.set(Math.cos(a) * 0.074 * s, Math.sin(a) * 0.074 * s, 0); fl.rotation.z = a - Math.PI / 2; cg.add(fl); }
      cg.add(new THREE.Mesh(new THREE.SphereGeometry(0.012 * s, 12, 10), RUBY())); cg.position.set(-0.205 * s, 1.0 * s, 0.0); root.add(cg); C(0.006, 0.006, 0.06, GOLD, -0.205, 0.89, 0.0, 10); S(0.016, GOLD, -0.205, 0.94, 0.0, 1, 0.8, 1); }
    { // Panchajanya shankha (conch) with gold mounts
      const sh = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.02, 0.01], [0.034, 0.04], [0.036, 0.07], [0.026, 0.1], [0.012, 0.12], [0, 0.13]].map(([r, y]) => new THREE.Vector2(r * s, y * s)), 24), GOLD());
      sh.rotation.z = 0.15; sh.position.set(0.205 * s, 0.95 * s, 0.0); root.add(sh); C(0.006, 0.006, 0.05, GOLD, 0.205, 0.89, 0.0, 10);
      const sp = new THREE.Mesh(new THREE.TorusGeometry(0.02 * s, 0.004 * s, 8, 24), GOLD()); sp.position.set(0.21 * s, 1.07 * s, 0.0); sp.rotation.y = 0.3; root.add(sp); }
    // head: face, ears with makara kundalas, Thiruman namam covering the eyes with the red Srichurnam line
    S(0.06, STONE, 0, 1.02, 0.0, 0.92, 1.12, 0.92);
    for (const sx of [-1, 1]) { S(0.014, STONE, sx * 0.056, 1.02, -0.005, 0.5, 1.2, 0.8); const ku = new THREE.Mesh(new THREE.TorusGeometry(0.016 * s, 0.005 * s, 8, 20), GOLD()); ku.position.set(sx * 0.06 * s, 0.975 * s, 0.0); ku.rotation.y = Math.PI / 2; root.add(ku); S(0.007, RUBY, sx * 0.062, 0.975, 0.0); }
    { const sh = new THREE.Shape(); sh.moveTo(-0.045, 0.05); sh.lineTo(-0.024, 0.05); sh.lineTo(-0.008, -0.03); sh.lineTo(0.008, -0.03); sh.lineTo(0.024, 0.05); sh.lineTo(0.045, 0.05); sh.lineTo(0.016, -0.05); sh.lineTo(-0.016, -0.05); sh.closePath();
      const nm = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.004, bevelEnabled: false }), WHITE()); nm.scale.set(s, s, s); nm.position.set(0, 1.03 * s, 0.05 * s); nm.rotation.x = -0.12; root.add(nm);
      const ln = new THREE.Mesh(new THREE.BoxGeometry(0.01 * s, 0.075 * s, 0.004 * s), RED()); ln.position.set(0, 1.035 * s, 0.056 * s); ln.rotation.x = -0.12; root.add(ln); }
    S(0.01, STONE, 0, 1.0, 0.056, 0.8, 0.6, 0.7);
    // tall gold kireetam (crown): tiers with bands of rubies, finial on top
    { let y = 1.095; const tiers = [[0.062, 0.058, 0.04], [0.058, 0.052, 0.045], [0.052, 0.045, 0.045], [0.045, 0.037, 0.045], [0.037, 0.028, 0.045], [0.028, 0.018, 0.04]];
      for (const [rb, rt, hh] of tiers) { C(rt, rb, hh, GOLD, 0, y, 0, 28); const bd = new THREE.Mesh(new THREE.TorusGeometry(rb * s, 0.004 * s, 6, 28), GOLD()); bd.rotation.x = Math.PI / 2; bd.position.y = y * s; root.add(bd);
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; S(0.005, RUBY, Math.cos(a) * rb * 0.98, y + hh * 0.5, Math.sin(a) * rb * 0.98); } y += hh; }
      { const ce = new THREE.Mesh(new THREE.TorusGeometry(0.018 * s, 0.003 * s, 8, 24), RUBY()); ce.position.set(0, 1.18 * s, 0.05 * s); ce.rotation.x = -0.12; root.add(ce); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, sp = new THREE.Mesh(new THREE.BoxGeometry(0.002 * s, 0.017 * s, 0.002 * s), RUBY()); sp.position.set(Math.cos(a) * 0.009 * s, 1.18 * s + Math.sin(a) * 0.009 * s, 0.051 * s); sp.rotation.z = a - Math.PI / 2; root.add(sp); } }
      S(0.016, GOLD, 0, y + 0.012, 0); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.008 * s, 0.04 * s, 12), GOLD()); tip.position.y = (y + 0.045) * s; root.add(tip);
      // crown side flares (makara torana ears)
      for (const sx of [-1, 1]) { const f = S(0.026, GOLD, sx * 0.07, 1.13, -0.01, 0.35, 1.3, 0.7); f.rotation.z = -sx * 0.3; } }
    return { obj: root, size: { w: 0.5 * s, h } };
  }

  /* ================= Black-stone shrine interior (owner reference 2026-11-11: references/puja/2026-11-11_black-stone-balaji-relief-shrine.png)
     WORLD coordinates (parts added at 0,0 like masterBath): black split-face stone on the three walls, a backlit bronze
     relief of Sri Venkateswara in an arched frame with an LED outline on the altar wall, a floating white two-door cabinet
     with brass knobs carrying brass samai lamps and diyas (lit flames), a brass bell hanging from the ceiling, and a round
     embroidered mandala pouf. Room box: x0…x1 (x1 = altar wall), z0…z1, ceiling ceil. */
  function pujaStoneShrine({ x0 = 8.755, x1 = 10.28, z0 = 0.199, z1 = 1.472, ceil = 2.91, idol = 'sketchfab-black', wall = 'charcoal' } = {}) {
    const useModel = idol !== 'built' && !!getModel('balaji2');
    // fitted size of the supplied sculpt (≤ 1.0 m wide × 1.35 m tall): the LED outline is drawn round it
    const fitM = useModel ? (() => { const sz = model('balaji2').size, k = Math.min(1.35 / sz.y, 1.0 / sz.x); return { k, w: sz.x * k, h: sz.y * k }; })() : null;
    const parts = {}, zc = (z0 + z1) / 2, moods = { strips: [], halos: [] };
    // honed charcoal stone in large blocks with fine joints (owner reference 2026-11-11:
    // references/puja/2026-11-11_charcoal-carved-stone-mandapa.png) on the three walls, the floor and the ceiling,
    // plus a carved floral scroll frieze round the top of the walls
    const stone = (() => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const x = cv.getContext('2d');
      let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      x.fillStyle = '#070708'; x.fillRect(0, 0, 512, 512);
      // 2 × 2 blocks per tile (tile = 1.2 m → blocks 0.6 m), staggered rows, each block a slightly different tone
      for (let r2 = 0; r2 < 4; r2++) for (let c = -1; c < 3; c++) { const bx = c * 256 + (r2 % 2) * 128, by = r2 * 128, v = 17 + rnd() * 7;
        x.fillStyle = `rgb(${v},${v},${v + 2})`; x.fillRect(bx + 2, by + 2, 252, 124);
        for (let k = 0; k < 180; k++) { const g2 = v + (rnd() - 0.5) * 9; x.fillStyle = `rgba(${g2},${g2},${g2 + 2},0.5)`; x.fillRect(bx + 2 + rnd() * 250, by + 2 + rnd() * 122, 1 + rnd() * 3, 1 + rnd() * 3); } }
      const col = new THREE.CanvasTexture(cv); col.colorSpace = THREE.SRGBColorSpace; const bump = new THREE.CanvasTexture(cv);
      for (const t of [col, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
      return new THREE.MeshStandardMaterial({ map: col, bumpMap: bump, bumpScale: 1.5, roughness: 0.48, metalness: 0.05, color: 0x707070, name: '__charcoal_honed_stone' }); })();
    const frieze = (() => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 128; const x = cv.getContext('2d');
      x.fillStyle = '#0f0f10'; x.fillRect(0, 0, 1024, 128); x.strokeStyle = '#232326'; x.lineWidth = 6; x.strokeRect(6, 6, 1012, 116);
      const scroll = (cx, cy, r, dir) => { x.beginPath(); for (let t = 0; t < 11; t += 0.2) { const rr = r * (1 - t / 12), a = dir * t; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; t ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); };
      x.strokeStyle = '#2a2a2e'; x.lineWidth = 7; for (let k = 0; k < 1024; k += 128) { scroll(k + 36, 64, 34, 1); scroll(k + 96, 64, 34, -1); x.beginPath(); x.moveTo(k, 100); x.quadraticCurveTo(k + 64, 20, k + 128, 100); x.stroke(); }
      x.fillStyle = '#2a2a2e'; for (let k = 0; k < 1024; k += 32) { x.beginPath(); x.arc(k + 16, 14, 4, 0, 7); x.fill(); x.beginPath(); x.arc(k + 16, 114, 4, 0, 7); x.fill(); }
      const col = new THREE.CanvasTexture(cv); col.colorSpace = THREE.SRGBColorSpace; const bump = new THREE.CanvasTexture(cv);
      for (const t of [col, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
      return new THREE.MeshStandardMaterial({ map: col, bumpMap: bump, bumpScale: 5, roughness: 0.55, metalness: 0.05, color: 0x5a5a5a, name: '__charcoal_carved_frieze' }); })();
    // facade stone (owner 2026-11-11: references/puja/2026-11-11_rough-stone-slab-platform.png wall) — random rubble limestone
    // in cream / beige / grey courses with recessed mortar; and the earlier black split-face stone
    const wallStone = wall === 'facade' ? (() => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const x = cv.getContext('2d');
        let sd = 5; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
        x.fillStyle = '#7d7262'; x.fillRect(0, 0, 512, 512);
        const tones = ['#e2d9c6', '#d3c6ac', '#c9b896', '#b8aa8e', '#ddd3bf', '#a99d86', '#cbbfa6'];
        let y = 0; while (y < 512) { const rh = 26 + rnd() * 44; let cx = -rnd() * 60;
          while (cx < 512) { const w2 = 36 + rnd() * 120, gap = 3 + rnd() * 4, t = tones[Math.floor(rnd() * tones.length)];
            x.fillStyle = t; x.beginPath(); x.moveTo(cx + gap + rnd() * 4, y + gap); x.lineTo(cx + w2 - rnd() * 5, y + gap + rnd() * 3); x.lineTo(cx + w2 - gap, y + rh - gap - rnd() * 4); x.lineTo(cx + gap + rnd() * 5, y + rh - gap); x.closePath(); x.fill();
            for (let k = 0; k < 30; k++) { const v = 150 + rnd() * 90; x.fillStyle = `rgba(${v},${v - 6},${v - 18},0.35)`; x.fillRect(cx + gap + rnd() * (w2 - 2 * gap), y + gap + rnd() * (rh - 2 * gap), 2 + rnd() * 8, 1 + rnd() * 3); }
            x.strokeStyle = 'rgba(90,80,64,0.35)'; x.lineWidth = 2; x.strokeRect(cx + gap, y + gap, w2 - 2 * gap, rh - 2 * gap);
            cx += w2; }
          y += rh; }
        const col = new THREE.CanvasTexture(cv); col.colorSpace = THREE.SRGBColorSpace; const bump = new THREE.CanvasTexture(cv);
        for (const t of [col, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
        return new THREE.MeshStandardMaterial({ map: col, bumpMap: bump, bumpScale: 8, roughness: 0.9, name: '__facade_rubble_stone' }); })()
      : wall === 'splitface' ? (() => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const x = cv.getContext('2d'); x.fillStyle = '#0c0c0d'; x.fillRect(0, 0, 512, 512);
        let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
        for (let r2 = 0; r2 < 8; r2++) { let cx = -rnd() * 80; while (cx < 512) { const w2 = 70 + rnd() * 90, v = 10 + rnd() * 16;
          const gr = x.createLinearGradient(cx, r2 * 64, cx + w2, r2 * 64 + 64); gr.addColorStop(0, `rgb(${v + 8},${v + 8},${v + 10})`); gr.addColorStop(1, `rgb(${v - 6},${v - 6},${v - 5})`); x.fillStyle = gr; x.fillRect(cx + 2, r2 * 64 + 2, w2 - 4, 60);
          for (let k = 0; k < 40; k++) { const g2 = 30 + rnd() * 40; x.fillStyle = `rgba(${g2},${g2},${g2 + 3},0.35)`; x.fillRect(cx + rnd() * w2, r2 * 64 + rnd() * 60, 2 + rnd() * 14, 1 + rnd() * 3); }
          cx += w2; } }
        const col = new THREE.CanvasTexture(cv); col.colorSpace = THREE.SRGBColorSpace; const bump = new THREE.CanvasTexture(cv);
        for (const t of [col, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
        return new THREE.MeshStandardMaterial({ map: col, bumpMap: bump, bumpScale: 6, roughness: 0.32, metalness: 0.05, name: '__black_splitface_stone' }); })()
      : stone;
    const plane = (w, h, mat, rw = w / 1.2, rh = h / 1.2) => { const geo = new THREE.PlaneGeometry(w, h); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rw, uv.getY(i) * rh); return new THREE.Mesh(geo, mat); };
    { const r = g(), L = x1 - x0, D = z1 - z0, fy = 2.45, fh = 0.22;
      const wn = plane(L, ceil, wallStone); wn.position.set((x0 + x1) / 2, ceil / 2, z0 + 0.003); r.add(wn);
      const ws = plane(L, ceil, wallStone); ws.rotation.y = Math.PI; ws.position.set((x0 + x1) / 2, ceil / 2, z1 - 0.003); r.add(ws);
      const we = plane(D, ceil, wallStone); we.rotation.y = -Math.PI / 2; we.position.set(x1 - 0.003, ceil / 2, zc); r.add(we);
      // carved frieze band round the three walls, standing 8 mm proud
      if (wall === 'charcoal') { const fn = plane(L, fh, frieze, L / 1.0, 1); fn.position.set((x0 + x1) / 2, fy + fh / 2, z0 + 0.011); r.add(fn);
        const fs = plane(L, fh, frieze, L / 1.0, 1); fs.rotation.y = Math.PI; fs.position.set((x0 + x1) / 2, fy + fh / 2, z1 - 0.011); r.add(fs);
        const fe = plane(D, fh, frieze, D / 1.0, 1); fe.rotation.y = -Math.PI / 2; fe.position.set(x1 - 0.011, fy + fh / 2, zc); r.add(fe); }
      // floor and ceiling in the same stone (the ceiling plane covers the old cove; two small downlights are set into it)
      const fl = plane(L, D, stone); fl.rotation.x = -Math.PI / 2; fl.position.set((x0 + x1) / 2, 0.058, zc); r.add(fl);
      const cl = plane(L, D, stone); cl.rotation.x = Math.PI / 2; cl.position.set((x0 + x1) / 2, ceil - 0.004, zc); r.add(cl);
      for (const dx of [0.45, 1.05]) { const dl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.006, 20), led(0xffe2b0, 2.6)); moods.strips.push(dl.material); dl.position.set(x0 + dx, ceil - 0.008, zc); r.add(dl); }
      parts.walls = { obj: r, moods }; }
    // glossy black carved panel behind the 3D idol (owner reference 2026-11-11: references/puja/2026-11-11_venkateswara-black-gold-panel.png):
    // makara-torana arch on two carved pillars, all glossy black (carving = canvas bump + a 3D beaded arch rim)
    { const r = g(), pw = fitM ? fitM.w + 0.08 : 0.8, ph = fitM ? fitM.h + 0.06 : 1.5, py = 0.885;
      const cv = document.createElement('canvas'); cv.width = 400; cv.height = 750; const x = cv.getContext('2d'), W2 = 400, H2 = 750;
      x.fillStyle = '#0b0b0c'; x.fillRect(0, 0, W2, H2); x.strokeStyle = '#2c2c2f'; x.lineWidth = 10; x.strokeRect(12, 12, W2 - 24, H2 - 24);
      const L2 = '#3a3a3e', L1 = '#26262a';
      // pillars: stacked mouldings, carved bands, square bases
      for (const px of [52, W2 - 52]) { x.fillStyle = L1; x.fillRect(px - 26, 230, 52, 490); for (let k = 0; k < 12; k++) { x.fillStyle = k % 3 ? L2 : '#4a4a50'; x.fillRect(px - 30, 240 + k * 38, 60, 10); }
        x.fillStyle = L2; x.fillRect(px - 32, 640, 64, 70); x.strokeStyle = '#4a4a50'; x.lineWidth = 3; x.beginPath(); x.moveTo(px - 20, 700); x.lineTo(px, 650); x.lineTo(px + 20, 700); x.stroke();
        x.fillStyle = '#4a4a50'; x.beginPath(); x.arc(px, 205, 26, 0, 7); x.fill(); x.fillStyle = L1; x.beginPath(); x.arc(px, 205, 14, 0, 7); x.fill(); }
      // torana arch: beaded scroll band with flame points and a kirtimukha crest
      x.strokeStyle = L2; x.lineWidth = 26; x.beginPath(); x.arc(W2 / 2, 230, W2 / 2 - 52, Math.PI, 0); x.stroke();
      x.fillStyle = '#4a4a50'; for (let k = 0; k <= 30; k++) { const a = Math.PI + k * Math.PI / 30; x.beginPath(); x.arc(W2 / 2 + Math.cos(a) * (W2 / 2 - 52), 230 + Math.sin(a) * (W2 / 2 - 52), 6, 0, 7); x.fill();
        const fx = W2 / 2 + Math.cos(a) * (W2 / 2 - 28), fy = 230 + Math.sin(a) * (W2 / 2 - 28); x.beginPath(); x.moveTo(fx + Math.cos(a) * 14, fy + Math.sin(a) * 14); x.lineTo(fx + Math.cos(a + 1.5) * 7, fy + Math.sin(a + 1.5) * 7); x.lineTo(fx + Math.cos(a - 1.5) * 7, fy + Math.sin(a - 1.5) * 7); x.fill(); }
      x.fillStyle = '#4a4a50'; x.beginPath(); x.ellipse(W2 / 2, 62, 40, 30, 0, 0, 7); x.fill(); x.fillStyle = L1; for (const dx of [-14, 14]) { x.beginPath(); x.arc(W2 / 2 + dx, 58, 7, 0, 7); x.fill(); }
      // makara (crocodile-scroll) heads where the arch meets the pillars
      for (const sx of [-1, 1]) { x.strokeStyle = '#4a4a50'; x.lineWidth = 8; x.beginPath(); for (let t = 0; t < 10; t += 0.3) { const rr = 26 * (1 - t / 11), a = sx * t; const px2 = W2 / 2 + sx * (W2 / 2 - 70) + Math.cos(a) * rr, py2 = 250 + Math.sin(a) * rr; t ? x.lineTo(px2, py2) : x.moveTo(px2, py2); } x.stroke(); }
      const col = new THREE.CanvasTexture(cv); col.colorSpace = THREE.SRGBColorSpace; const bump = new THREE.CanvasTexture(cv);
      const rm = new THREE.MeshStandardMaterial({ map: col, bumpMap: bump, bumpScale: 10, metalness: 0.1, roughness: 0.16, name: '__black_carved_panel' });
      const GB = () => M('__idol_black_gloss', 0x0d0d0e);
      // single-material meshes only (the viewer's shadow / material setup expects one material per mesh)
      const pl = new THREE.Mesh(new THREE.BoxGeometry(0.04, ph, pw), GB()); pl.position.set(x1 - 0.03, py + ph / 2, zc); if (!useModel) r.add(pl);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), rm); face.rotation.y = -Math.PI / 2; face.position.set(x1 - 0.0505, py + ph / 2, zc); if (!useModel) r.add(face);
      // 3D beaded arch rim standing proud of the panel (world: the panel face is the plane x = x1 − 0.05)
      if (!useModel) { const ar = (pw / 2 - 0.104), acY = py + ph - 230 / H2 * ph, xf = x1 - 0.07, curve = new THREE.EllipseCurve(0, 0, ar, ar * 1.0, 0, Math.PI, false);
        const pts = curve.getPoints(48).map(p2 => new THREE.Vector3(xf, acY + p2.y, zc + p2.x));
        const tb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.016, 10, false), GB()); r.add(tb);
        for (let k = 0; k <= 24; k++) { const p2 = pts[Math.round(k * 2)]; const bd = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), GB()); bd.position.set(xf - 0.012, p2.y, p2.z); r.add(bd); }
        for (const sz of [-1, 1]) { const pc = new THREE.Mesh(new THREE.BoxGeometry(0.03, acY - py - 0.02, 0.05), GB()); pc.position.set(x1 - 0.065, py + (acY - py) / 2, zc + sz * ar); r.add(pc); } }
      // LED outline (recessed channel round the panel) + glow on the stone
      const lm = led(0xffc87a, 3); moods.strips.push(lm);
      // owner 2026-11-11: no gold LED border round the supplied sculpt
      if (!useModel) for (const [h2, w2, yy, zz] of [[0.012, pw + 0.05, py - 0.02, zc], [0.012, pw + 0.05, py + ph + 0.02, zc], [ph + 0.05, 0.012, py + ph / 2, zc - pw / 2 - 0.022], [ph + 0.05, 0.012, py + ph / 2, zc + pw / 2 + 0.022]]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.01, h2, w2), lm); b.position.set(x1 - 0.008, yy, zz); r.add(b); }
      const gcv = canvasTex(256, 512, (x2, w, h) => { x2.clearRect(0, 0, w, h); const gr = x2.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.9); gr.addColorStop(0, 'rgba(255,200,130,0.0)'); gr.addColorStop(0.45, 'rgba(255,200,130,0.35)'); gr.addColorStop(1, 'rgba(255,200,130,0)'); x2.fillStyle = gr; x2.fillRect(0, 0, w, h); });
      const gm = new THREE.MeshBasicMaterial({ map: gcv, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, name: '__relief_glow' });
      const gp = new THREE.Mesh(new THREE.PlaneGeometry(pw + 0.5, ph + 0.5), gm); gp.rotation.y = -Math.PI / 2; gp.position.set(x1 - 0.006, py + ph / 2, zc);
      // owner 2026-11-11: no background glow behind the idol (the warm wash plane is not added; the LED outline stays)
      parts.relief = { obj: r, moods }; }
    // rough-hewn stone platform (owner 2026-11-11, references/puja/2026-11-11_rough-stone-slab-platform.png): a thick weathered
    // limestone slab with chipped edges on two stone block legs, top at the old cabinet height so the idol + lamps stay put
    { const r = g(), cw = 1.1, cd = 0.42, ch = 0.34, cy = 0.5;
      const stoneM = (() => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const x = cv.getContext('2d');
        let sd = 3; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
        x.fillStyle = '#7d7568'; x.fillRect(0, 0, 256, 256);
        for (let k = 0; k < 3200; k++) { const v = 85 + rnd() * 85; x.fillStyle = `rgba(${v + 6},${v},${v - 10},${0.25 + rnd() * 0.5})`; x.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 3, 1 + rnd() * 3); }
        for (let k = 0; k < 160; k++) { x.fillStyle = rnd() > 0.55 ? 'rgba(222,218,204,0.75)' : (rnd() > 0.5 ? 'rgba(52,48,40,0.55)' : 'rgba(150,140,96,0.45)'); x.beginPath(); x.arc(rnd() * 256, rnd() * 256, 1 + rnd() * 3.5, 0, 7); x.fill(); }
        const col = new THREE.CanvasTexture(cv); col.colorSpace = THREE.SRGBColorSpace; const bump = new THREE.CanvasTexture(cv);
        for (const t of [col, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); }
        return new THREE.MeshStandardMaterial({ map: col, bumpMap: bump, bumpScale: 6, roughness: 0.95, color: 0xcfc7b8, name: '__weathered_limestone' }); })();
      // rough block: subdivided box with its outer vertices jittered (chipped, hand-dressed edges)
      const roughBlock = (w, h, d, seed, amp = 0.012) => { const geo = new THREE.BoxGeometry(w, h, d, 6, 3, 6); const p2 = geo.attributes.position; let sd2 = seed; const rnd2 = () => (sd2 = (sd2 * 9301 + 49297) % 233280) / 233280;
        const key = new Map();
        for (let i = 0; i < p2.count; i++) { const k2 = p2.getX(i).toFixed(4) + ',' + p2.getY(i).toFixed(4) + ',' + p2.getZ(i).toFixed(4); if (!key.has(k2)) key.set(k2, [(rnd2() - 0.5) * amp, (rnd2() - 0.5) * amp, (rnd2() - 0.5) * amp]); const j = key.get(k2); p2.setXYZ(i, p2.getX(i) + j[0], p2.getY(i) + j[1], p2.getZ(i) + j[2]); }
        geo.computeVertexNormals(); return new THREE.Mesh(geo, stoneM); };
      const slabT = 0.1, top = cy + ch + 0.025, slab = roughBlock(cd, slabT, cw, 7, 0.028); slab.position.set(x1 - cd / 2 - 0.01, top - slabT / 2, zc); r.add(slab);
      for (const sz of [-1, 1]) { const leg = roughBlock(0.3, top - slabT, 0.17, sz > 0 ? 11 : 23, 0.024); leg.position.set(x1 - 0.2, (top - slabT) / 2, zc + sz * (cw / 2 - 0.2)); r.add(leg); }
      const ty = top, flame = () => { const fm = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.03, 10), led(0xffb347, 4)); moods.strips.push(fm.material); return fm; };
      const samai = (h, px, pz) => { const s2 = g(); s2.add(cyl(0.05, 0.06, 0.02, BRASS, 0, 0, 0, 20)); s2.add(cyl(0.008, 0.012, h, BRASS, 0, 0.02, 0, 12));
        for (let k = 0; k < 3; k++) { const n = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), BRASS()); n.position.y = 0.06 + k * h / 3; s2.add(n); }
        s2.add(cyl(0.055, 0.03, 0.025, BRASS, 0, h + 0.02, 0, 20)); for (let k = 0; k < 5; k++) { const a = k * 1.2566, f = flame(); f.position.set(Math.cos(a) * 0.045, h + 0.06, Math.sin(a) * 0.045); s2.add(f); }
        s2.add(cyl(0.001, 0.012, 0.07, BRASS, 0, h + 0.045, 0, 10)); s2.position.set(px, ty, pz); return loose(s2); };
      const diya = (px, pz, sc = 1) => { const d2 = g(); d2.add(cyl(0.03 * sc, 0.022 * sc, 0.02, BRASS, 0, 0.03 * sc, 0, 16)); d2.add(cyl(0.012, 0.02, 0.03 * sc, BRASS, 0, 0, 0, 12)); const f = flame(); f.position.set(0.02 * sc, 0.066 * sc, 0); d2.add(f); d2.position.set(px, ty, pz); return loose(d2); };
      r.add(samai(0.42, x1 - 0.2, zc - 0.44)); r.add(samai(0.42, x1 - 0.2, zc + 0.44)); r.add(samai(0.26, x1 - 0.3, zc - 0.34)); r.add(samai(0.26, x1 - 0.3, zc + 0.34));
      // front row of diyas (the idol stands behind them)
      for (let k = 0; k < 7; k++) r.add(diya(x1 - 0.355, zc - 0.27 + k * 0.09, k === 3 ? 1.4 : 1));
      // 3D idol of Sri Venkateswara on the cabinet, facing the doorway, in front of the arched prabhavali panel
      if (!useModel) { const idolB = venkateswaraIdol({ h: 1.25 }); idolB.obj.rotation.y = -Math.PI / 2; idolB.obj.position.set(x1 - 0.2, ty, zc); r.add(idolB.obj); }
      else {
        // owner-supplied sculpt (assets/models/balaji2.glb, CC BY 4.0 kirubakaran320 / Sketchfab): fit ≤ 1.0 m wide × 1.35 m tall,
        // back against the altar wall, standing on the cabinet; one finish over the whole sculpt (the file has no colours)
        const md = model('balaji2'), k = fitM.k;
        const fin = idol === 'sketchfab-brass' ? new THREE.MeshStandardMaterial({ color: 0xc9973f, metalness: 0.85, roughness: 0.3, name: '__idol_brass' })
          : new THREE.MeshStandardMaterial({ color: 0x0f0f10, metalness: 0.1, roughness: 0.15, name: '__idol_black_gloss_model' });
        md.obj.traverse(o => { if (o.isMesh) o.material = fin; });
        md.obj.scale.setScalar(k); md.obj.rotation.y = -Math.PI / 2; md.obj.position.set(x1 - 0.06, ty + 0.005, zc); r.add(md.obj);
      }
      parts.cabinet = { obj: r, moods }; }
    // brass bell hanging from the ceiling
    { const r = g(), bx = x1 - 0.75; r.add(cyl(0.004, 0.004, 0.5, BRASS, bx, ceil - 0.5, zc, 8)); r.add(cyl(0.03, 0.03, 0.01, BRASS, bx, ceil - 0.012, zc, 16));
      const bell = new THREE.Mesh(new THREE.LatheGeometry([[0, 0.12], [0.02, 0.118], [0.03, 0.1], [0.036, 0.05], [0.05, 0.01], [0.055, 0]].map(([a, b]) => new THREE.Vector2(a, b)), 20), BRASS()); bell.material.side = THREE.DoubleSide; bell.position.set(bx, ceil - 0.62, zc); r.add(bell);
      r.add(cyl(0.006, 0.006, 0.12, BRASS, bx, ceil - 0.72, zc, 8)); parts.bell = { obj: r }; }
    // round embroidered pouf with a mandala top
    // pouf half tucked under the floating cabinet (its top 0.36 m < cabinet bottom 0.5 m), clear of both door-leaf swings
    { const r = g(), R = 0.21, H2 = 0.36, px = x1 - 0.6, pz = z0 + 0.27;
      const top = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#e6dcc6'; x.fillRect(0, 0, w, h); const c = w / 2; for (const [rr, col, n] of [[120, '#8a2b1e', 16], [92, '#c7902f', 12], [66, '#9c3a24', 10], [40, '#d9a441', 8]]) { x.fillStyle = col; for (let k = 0; k < n; k++) { const a = k * 2 * Math.PI / n; x.beginPath(); x.ellipse(c + Math.cos(a) * rr * 0.62, c + Math.sin(a) * rr * 0.62, rr * 0.36, rr * 0.13, a, 0, 7); x.fill(); } } x.fillStyle = '#8a2b1e'; x.beginPath(); x.arc(c, c, 16, 0, 7); x.fill(); x.strokeStyle = '#8a6a34'; x.lineWidth = 8; x.beginPath(); x.arc(c, c, 124, 0, 7); x.stroke(); });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H2, 32), M('__pouf_gold_fabric', 0xa8874f)); body.position.set(px, H2 / 2, pz); r.add(loose(body));
      const lid = new THREE.Mesh(new THREE.CircleGeometry(R - 0.004, 40), new THREE.MeshStandardMaterial({ map: top, roughness: 0.85, name: '__pouf_mandala' })); lid.rotation.x = -Math.PI / 2; lid.position.set(px, H2 + 0.002, pz); r.add(loose(lid));
      parts.pouf = { obj: r }; }
    return parts;
  }

  /* ================= Patchwork stone panel puja interior (owner reference 2026-11-11:
     references/puja/2026-11-11_patchwork-stone-panels-venkateswara-interior.png). WORLD coords like pujaStoneShrine.
     Back wall: patchwork of large dark-bronze textured stone panels (plain, gold sunflower / mandala, engraved script-style
     rows), gold inlay strips, small black-and-gold plaques; the owner's Balaji2 sculpt on a black pedestal on a pale stone
     altar with a gold carved band; brass hanging lamps; taupe side walls with lit niches + fluted bronze edges; cream
     ceiling with a perimeter cove light; pale marble floor with a rug. */
  /* ---------- kitchen designs (owner 2026-11-11), both counters, the side-by-side fridge stays ----------
     'teak-blue'     : honey teak raised-panel base + uppers, glass-mullion top tier (lit, crockery), ceramic-insert bronze pulls,
                       blue octagon + dot tile splashback, white quartz top, stainless chimney hood, cone pendant.
     'cashmere-sage' : cashmere matt handle-less base (black gola lines), gloss cashmere uppers, oak open boxes + black-framed
                       glass boxes (lit), oak end column with plants, sage subway tile, grey terrazzo top, white slim hood, toe-kick LED.
     Runs are built in their wall frame (origin on the floor at the wall, +x along the wall, +z into the room).
     Returns { parts: { name: { obj, x, z, ry, label } }, moods }. */
  function kitchenStyled({ style = 'teak-blue', chimney = 'with', eastLen = 3.48, westLen = 2.41, bridgeLen = 0.95, room = { x0: 6.885, x1: 10.28, z0: 1.572, z1: 5.067 } } = {}) {
    // east run starts at the north wall (z 1.58): window local x 0.42–1.92 (z 2.0–3.5), hob centre 1.075, masonry pier x 0.02–0.42
    const WIN = [0.42, 1.92], HOBC = 1.075, PIER = 0.22, HB = 1.72, CHIM = chimney !== 'without';
    // owner models (2026-11-11): granite sink "FIESTA 5149" (yuridiz, CC BY 4.0; cm units → ×0.01, rim top 0.239 above its waste)
    // and a black curved-glass chimney (Chiminey.glb, front +x; ×1.65 → 900 wide, 0.70 tall)
    const SINKM = model('kitchen_sink_fiesta'), CHIMM = CHIM ? model('chimney_hood') : null, SINKX = 3.07;
    // 'sage-walnut' (owner reference 2026-11-11, Image #53) follows the cashmere structure (gola, frame glass, open boxes) with
    // sage fronts, walnut instead of oak, a cream fluted splash panel instead of tile, white speckled quartz, brass cage pendants
    const IS_TEAK = style === 'teak-blue', IS_SAGE = style === 'sage-walnut', moods = { strips: [] };
    // 'oak-sage' (owner reference 2026-11-11, Image #59): light-oak base doors + sage drawers and wall cabinets, black bar handles,
    // black-framed glass top tier, cream quartz + cream stone splash, black plinth, oak open corners + niche over the fridge
    const IS_OAK = style === 'oak-sage', HANDLED = IS_TEAK || IS_OAK, TWO_TIER = IS_TEAK || IS_OAK;
    // 'terracotta-walnut' (owner reference 2026-11-11, Image #60): cashmere structure with terracotta matt gola base, greige top
    // cabinets, walnut-framed reeded-glass boxes + walnut open shelves, sage-grey stone splash, white top, leaf cement-tile floor
    const IS_TERRA = style === 'terracotta-walnut';
    let sd = 5; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    const P = o => new THREE.MeshPhysicalMaterial(o);
    const rep = (t, rx, ry) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const grain = (base, dark, light) => canvasTex(256, 512, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h);
      for (let k = 0; k < 150; k++) { let cx = rnd() * w; x.strokeStyle = (rnd() < 0.6 ? dark : light).replace('A', (0.05 + rnd() * 0.18).toFixed(2)); x.lineWidth = 0.6 + rnd() * 2.4; x.beginPath(); x.moveTo(cx, 0); for (let y = 0; y <= h; y += 32) { cx += (rnd() - 0.5) * 6; x.lineTo(cx, y); } x.stroke(); } });
    const TKm = P({ map: grain('#a1602f', 'rgba(70,32,12,A)', 'rgba(212,146,88,A)'), roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35, name: '__kitchen_teak' });
    const TKd = P({ color: 0x4a2814, roughness: 0.6, name: '__kitchen_teak_groove' });
    const OAKm = IS_SAGE || IS_TERRA ? P({ map: grain('#7a5234', 'rgba(40,22,10,A)', 'rgba(160,110,70,A)'), roughness: 0.5, clearcoat: 0.2, name: '__kitchen_walnut' })
      : P({ map: grain('#c4986a', 'rgba(110,70,35,A)', 'rgba(232,192,142,A)'), roughness: 0.55, name: '__kitchen_oak' });
    const CSM = IS_TERRA ? P({ color: 0xa45f4e, roughness: 0.72, name: '__kitchen_terracotta_matt' }) : IS_OAK ? P({ color: 0x8f9d87, roughness: 0.55, name: '__kitchen_sage_grey_matt' }) : IS_SAGE ? P({ color: 0x9aaa8f, roughness: 0.6, name: '__kitchen_sage_matt' }) : P({ color: 0xcdbfad, roughness: 0.62, name: '__kitchen_cashmere_matt' });
    const CSG = IS_TERRA ? P({ color: 0xc8beb2, roughness: 0.6, name: '__kitchen_greige_matt' }) : IS_OAK ? P({ color: 0x95a38d, roughness: 0.45, clearcoat: 0.15, name: '__kitchen_sage_grey_satin' }) : IS_SAGE ? P({ color: 0xa2b197, roughness: 0.5, clearcoat: 0.2, name: '__kitchen_sage_satin' }) : P({ color: 0xd8ccbd, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.06, name: '__kitchen_cashmere_gloss' });
    const BLK = P({ color: 0x1b1b1c, roughness: 0.45, metalness: 0.4, name: '__kitchen_black_profile' });
    const CARC = P({ color: IS_TEAK ? 0xdcc7a6 : 0xe9e3da, roughness: 0.7, name: '__kitchen_carcass' });
    const INNER = P({ color: IS_TEAK ? 0xd9bf98 : 0xe4d8c8, roughness: 0.55, name: '__kitchen_cabinet_inner' });
    const GLS = P({ color: 0xe8f0ee, roughness: 0.04, transparent: true, opacity: 0.14, depthWrite: false, name: '__kitchen_glass' });
    const STEEL = P({ color: 0xc9ccce, metalness: 1, roughness: 0.3, name: '__kitchen_steel' });
    const BRZ = P({ color: 0x5e4026, metalness: 0.8, roughness: 0.38, name: '__kitchen_bronze' });
    const CER = P({ color: 0xf4f1ea, roughness: 0.2, clearcoat: 0.8, name: '__kitchen_ceramic' });
    const WHT = P({ color: 0xf2f1ee, roughness: 0.3, clearcoat: 0.5, name: '__kitchen_hood_white' });
    const PLINTH = IS_TEAK ? TKd : IS_OAK || IS_TERRA ? BLK : CSM;
    const topMat = (len, d) => P({ map: rep(canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = IS_OAK ? '#e6dac6' : IS_TEAK || IS_SAGE || IS_TERRA ? '#f1f0ec' : '#706b68'; x.fillRect(0, 0, w, h);
      const cols = IS_TERRA ? ['rgba(200,200,195,0.3)'] : IS_OAK ? ['rgba(190,172,145,0.4)', 'rgba(245,238,225,0.5)'] : IS_SAGE ? ['rgba(120,118,112,0.55)', 'rgba(60,58,55,0.45)', 'rgba(200,196,188,0.6)'] : IS_TEAK ? ['rgba(180,180,175,0.35)', 'rgba(220,218,210,0.5)'] : ['rgba(42,40,38,0.7)', 'rgba(217,212,204,0.55)', 'rgba(138,106,85,0.5)', 'rgba(74,69,66,0.6)', 'rgba(167,161,154,0.5)'];
      for (let k = 0; k < (IS_TEAK || IS_OAK || IS_TERRA ? 900 : IS_SAGE ? 2600 : 9000); k++) { x.fillStyle = cols[Math.floor(rnd() * cols.length)]; const s = IS_TEAK || IS_SAGE || IS_OAK || IS_TERRA ? 0.8 + rnd() * 1.8 : 0.6 + rnd() * 1.6; x.beginPath(); x.arc(rnd() * w, rnd() * h, s, 0, 7); x.fill(); } }), len / 0.6, d / 0.6),
      roughness: IS_TEAK || IS_SAGE || IS_OAK || IS_TERRA ? 0.16 : 0.28, clearcoat: 0.6, clearcoatRoughness: 0.1, name: IS_OAK ? '__kitchen_quartz_cream' : IS_SAGE ? '__kitchen_quartz_speckle' : IS_TEAK ? '__kitchen_quartz_white' : '__kitchen_terrazzo_grey' });
    // ---- splashback tile: blue octagon + dot (0.2 m tiles, 0.4 m texture) | sage subway 300 × 75 (0.6 m texture)
    const S = IS_TEAK ? 0.4 : 0.6;
    const tileTex = IS_TEAK ? canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#c7cbc8'; x.fillRect(0, 0, w, h); const C = 256, c = 74, gr = 3;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const a = i * C, b = j * C, v = rnd();
        x.save(); x.beginPath(); x.moveTo(a + c, b + gr); x.lineTo(a + C - c, b + gr); x.lineTo(a + C - gr, b + c); x.lineTo(a + C - gr, b + C - c); x.lineTo(a + C - c, b + C - gr); x.lineTo(a + c, b + C - gr); x.lineTo(a + gr, b + C - c); x.lineTo(a + gr, b + c); x.closePath(); x.clip();
        x.fillStyle = `rgb(${36 + v * 22},${90 + v * 26},${138 + v * 26})`; x.fillRect(a, b, C, C);
        for (let k = 0; k < 70; k++) { const d = rnd() < 0.5; x.fillStyle = d ? 'rgba(18,50,86,0.14)' : 'rgba(120,170,205,0.12)'; x.beginPath(); x.arc(a + rnd() * C, b + rnd() * C, 8 + rnd() * 30, 0, 7); x.fill(); }
        x.restore(); }
      for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) { const cx = i * C, cy = j * C, r = c - gr - 1;
        x.fillStyle = '#7d4b29'; x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r, cy); x.closePath(); x.fill();
        x.fillStyle = '#e3cf9c'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; x.beginPath(); x.ellipse(cx + Math.cos(a) * r * 0.38, cy + Math.sin(a) * r * 0.38, r * 0.3, r * 0.12, a, 0, 7); x.fill(); }
        x.fillStyle = '#1f4f6e'; x.beginPath(); x.arc(cx, cy, r * 0.13, 0, 7); x.fill(); } })
      : canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#d4d9d1'; x.fillRect(0, 0, w, h); const tw = 256, th = 64;
        for (let r = 0; r < 8; r++) for (let k = -1; k < 2; k++) { const a = k * tw + (r % 2 ? tw / 2 : 0), b = r * th, v = rnd();
          x.save(); x.beginPath(); x.rect(a + 2, b + 2, tw - 4, th - 4); x.clip();
          x.fillStyle = `rgb(${104 + v * 26},${146 + v * 22},${130 + v * 20})`; x.fillRect(a, b, tw, th);
          for (let m = 0; m < 12; m++) { x.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(40,80,70,0.08)'; x.beginPath(); x.ellipse(a + rnd() * tw, b + rnd() * th, 20 + rnd() * 50, 6 + rnd() * 14, 0, 0, 7); x.fill(); }
          x.restore(); } });
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
    let TILE = P({ map: tileTex, roughness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.15, name: IS_TEAK ? '__kitchen_tile_blue_octagon' : '__kitchen_tile_sage_subway' });
    if (IS_SAGE) { const flute = (bump) => { const t = canvasTex(512, 64, (x, w, h) => { const n = 24, fw = w / n;   // 25 mm flutes, 0.6 m per texture
        for (let k = 0; k < n; k++) { const gr = x.createLinearGradient(k * fw, 0, (k + 1) * fw, 0);
          if (bump) { gr.addColorStop(0, '#202020'); gr.addColorStop(0.5, '#f0f0f0'); gr.addColorStop(1, '#202020'); }
          else { gr.addColorStop(0, '#d9cfbd'); gr.addColorStop(0.5, '#f1ebdf'); gr.addColorStop(1, '#d6ccba'); }
          x.fillStyle = gr; x.fillRect(k * fw, 0, fw, h); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
      TILE = P({ map: flute(false), bumpMap: flute(true), bumpScale: 2.5, roughness: 0.55, name: '__kitchen_fluted_cream' }); }
    if (IS_OAK) { const st = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#d9c8aa'; x.fillRect(0, 0, w, h);
        for (let k = 0; k < 2600; k++) { x.fillStyle = `rgba(${180 + rnd() * 50},${160 + rnd() * 45},${130 + rnd() * 40},0.18)`; x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2.5, 1 + rnd() * 2.5); }
        for (let k = 0; k < 6; k++) { x.strokeStyle = `rgba(170,150,120,${0.08 + rnd() * 0.1})`; x.lineWidth = 1 + rnd() * 2; x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let s2 = 0; s2 < 6; s2++) { px += 40 + rnd() * 60; py += (rnd() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); } });
      st.wrapS = st.wrapT = THREE.RepeatWrapping; TILE = P({ map: st, roughness: 0.45, name: '__kitchen_cream_stone' }); }   // cream stone splash panel
    if (IS_TERRA) { const st = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#7d877d'; x.fillRect(0, 0, w, h);
        for (let k = 0; k < 900; k++) { const v = rnd() < 0.5 ? -18 : 18; x.fillStyle = `rgba(${125 + v},${135 + v},${125 + v},0.05)`; x.beginPath(); x.arc(rnd() * w, rnd() * h, 10 + rnd() * 40, 0, 7); x.fill(); }
        for (let k = 0; k < 9; k++) { x.strokeStyle = `rgba(215,220,212,${0.12 + rnd() * 0.18})`; x.lineWidth = 0.8 + rnd() * 1.8; x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let s2 = 0; s2 < 7; s2++) { px += (rnd() - 0.3) * 80; py += 30 + rnd() * 50; x.lineTo(px, py); } x.stroke(); } });
      st.wrapS = st.wrapT = THREE.RepeatWrapping; TILE = P({ map: st, roughness: 0.4, name: '__kitchen_sage_grey_stone' }); }   // sage-grey honed stone splash
    const splash = (par, x0, x1, y0, y1) => { const W = x1 - x0, H = y1 - y0, geo = new THREE.PlaneGeometry(W, H), uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + uv.getX(i) * W) / S, (y0 + uv.getY(i) * H) / S);
      const m = new THREE.Mesh(geo, TILE); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.004); par.add(m); };
    // ---- fronts, handles, doors, drawers
    const BLKBAR = P({ color: 0x151515, metalness: 0.5, roughness: 0.35, name: '__kitchen_black_bar' });
    const pull = (par, x, y, zFace, horiz) => { if (!HANDLED) return; const h = g();
      if (IS_OAK) { h.add(cyl(0.006, 0.006, 0.16, BLKBAR, 0, -0.08, 0, 10)); for (const s of [-1, 1]) { const p = cyl(0.004, 0.004, 0.028, BLKBAR, 0, 0, 0, 8); p.rotation.x = Math.PI / 2; p.position.set(0, s * 0.07, -0.014); h.add(p); }
        h.position.set(x, y, zFace + 0.028); if (horiz) h.rotation.z = Math.PI / 2; par.add(h); return; }
      h.add(cyl(0.0045, 0.0045, 0.13, BRZ, 0, -0.065, 0, 10)); h.add(cyl(0.0078, 0.0078, 0.075, CER, 0, -0.0375, 0, 14));
      for (const s of [-1, 1]) { const p = cyl(0.004, 0.004, 0.025, BRZ, 0, 0, 0, 8); p.rotation.x = Math.PI / 2; p.position.set(0, s * 0.055, -0.0125); h.add(p); }
      h.position.set(x, y, zFace + 0.025); if (horiz) h.rotation.z = Math.PI / 2; par.add(h); };
    const panelFront = (w, h, upper, drawerFront) => { const f = g();
      if (IS_TEAK) { const s = Math.min(0.065, w * 0.14, h * 0.2);
        f.add(box(w, h, 0.02, TKm, w / 2, 0, 0, 0.003));
        f.add(box(w - 2 * s + 0.012, h - 2 * s + 0.012, 0.004, TKd, w / 2, s - 0.006, 0.018));
        f.add(box(w - 2 * s, h - 2 * s, 0.012, TKm, w / 2, s, 0.018, 0.005)); }
      else f.add(box(w, h, 0.019, upper ? CSG : IS_OAK && !drawerFront ? OAKm : CSM, w / 2, 0, 0, 0.002));   // oak-sage: oak doors, sage drawers
      return f; };
    // fluted (reeded) glass: real vertical ribs (12 mm pitch, 3 mm deep, computed normals) in a frosted warm glass, so every flute
    // catches the light and the shelves behind blur into soft shapes (owner: "put effort into the fluted glass doors")
    const REEDTEX = IS_TERRA ? (() => { const t = canvasTex(64, 8, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, 0);   // one flute: dark edge → bright crest → dark edge
        gr.addColorStop(0, '#9c968d'); gr.addColorStop(0.35, '#f7f4ee'); gr.addColorStop(0.55, '#ffffff'); gr.addColorStop(1, '#8e887f'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })() : null;
    const REED = IS_TERRA ? P({ map: REEDTEX, color: 0xf3eee6, roughness: 0.42, metalness: 0, transparent: true, opacity: 0.8, clearcoat: 1, clearcoatRoughness: 0.12, depthWrite: false, side: THREE.DoubleSide, name: '__kitchen_fluted_glass' }) : null;
    const flutedPane = (w, h) => { const pitch = 0.015, nF = Math.max(4, Math.round(w / pitch)), seg = nF * 8, geo = new THREE.PlaneGeometry(w, h, seg, 1), pos = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) { const u = (pos.getX(i) + w / 2) / w * nF; pos.setZ(i, 0.004 * Math.sin(Math.PI * (u - Math.floor(u)))); uv.setXY(i, u, uv.getY(i)); }   // texture repeats once per flute
      geo.computeVertexNormals(); return new THREE.Mesh(geo, REED); };
    const glassFront = (w, h) => { const f = g(), fr = IS_TEAK ? TKm : IS_TERRA ? OAKm : BLK, s = IS_TEAK ? 0.05 : IS_TERRA ? 0.035 : 0.022;
      f.add(box(w, s, 0.02, fr, w / 2, 0, 0)); f.add(box(w, s, 0.02, fr, w / 2, h - s, 0)); f.add(box(s, h - 2 * s, 0.02, fr, s / 2, s, 0)); f.add(box(s, h - 2 * s, 0.02, fr, w - s / 2, s, 0));
      if (IS_TEAK) { f.add(box(0.022, h - 2 * s, 0.016, fr, w / 2, s, 0.002)); f.add(box(w - 2 * s, 0.022, 0.016, fr, w / 2, h / 2 - 0.011, 0.002)); }
      const gl = REED ? flutedPane(w - 2 * s + 0.01, h - 2 * s + 0.01) : new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * s + 0.01, h - 2 * s + 0.01), GLS); gl.position.set(w / 2, h / 2, 0.008); f.add(gl); return f; };
    const door = (par, x0, w, y0, h, zf, left, glass, upper, label) => {
      const d = g(), fw = w - 0.004, fh = h - 0.004, f = glass ? glassFront(fw, fh) : panelFront(fw, fh, upper);
      f.position.set(left ? 0.002 : -w + 0.002, 0.002, 0); d.add(f);
      pull(d, left ? w - 0.04 : -w + 0.04, upper ? 0.12 : fh - 0.1, 0.02, false);
      const hx = left ? x0 : x0 + w; d.position.set(hx, y0, zf); par.add(d);
      tagGroup(d, { type: 'cab', hinge: [hx, 0, zf], a1: left ? -Math.PI / 2 : Math.PI / 2, label, fitted: true }); };
    const drawer = (par, x0, w, y0, h, zf, D, label) => { const d = g(), fw = w - 0.004, fh = h - 0.004, f = panelFront(fw, fh, false, true);
      f.position.set(x0 + 0.002, y0 + 0.002, zf); d.add(f);
      pull(d, x0 + w / 2, y0 + fh - Math.min(0.07, fh * 0.32), zf + 0.02, true);
      d.add(box(w - 0.06, 0.012, D - 0.1, CARC, x0 + w / 2, y0 + 0.03, zf - D + 0.08));
      d.add(box(w - 0.06, Math.min(0.12, fh - 0.06), 0.012, CARC, x0 + w / 2, y0 + 0.03, zf - D + 0.08));
      par.add(d); tagGroup(d, { type: 'slide', slide: [0, 0, 0.4], label, fitted: true }); };
    // ---- contents (loose = hidden with "Furniture & appliances")
    const GREENG = P({ color: 0x3f9a3a, roughness: 0.05, transparent: true, opacity: 0.8, name: '__kitchen_glass_green' });
    const JAR = P({ color: 0xdfe8e6, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false, name: '__kitchen_jar_glass' });
    const crockery = (par, x0, w, ys, D, tall) => { ys.forEach((y, li) => { let x = x0 + 0.04, k = li;
      while (x < x0 + w - 0.09) { const kind = k++ % 4;
        if (kind === 0 && x + 0.23 < x0 + w) { for (let n = 0; n < 6; n++) par.add(loose(cyl(0.1, 0.08, 0.015, CER, x + 0.105, y + n * 0.016, D * 0.42, 28))); x += 0.23; }
        else if (kind === 2 && x + 0.16 < x0 + w) { for (let n = 0; n < 3; n++) par.add(loose(cyl(0.07, 0.04, 0.045, CER, x + 0.075, y + n * 0.04, D * 0.5, 24))); x += 0.16; }
        else if (kind === 3 && IS_TEAK && tall) { par.add(loose(cyl(0.04, 0.045, 0.16, GREENG, x + 0.05, y, D * 0.5, 18))); par.add(loose(cyl(0.012, 0.03, 0.06, GREENG, x + 0.05, y + 0.16, D * 0.5, 14))); x += 0.11; }
        else { for (const dz of [0.32, 0.65]) { par.add(loose(cyl(0.035, 0.03, 0.07, CER, x + 0.045, y, D * dz, 18))); } x += 0.1; } } }); };
    const jars = (par, x0, w, ys, D) => { const CAN = P({ color: 0xc9b79c, roughness: 0.6, name: '__kitchen_canister' });
      ys.forEach((y, li) => { let x = x0 + 0.05, k = li;
        while (x < x0 + w - 0.1) { if (k++ % 2) { for (const s of [0.07, 0.055]) { par.add(loose(cyl(s, s, s * 2.2, CAN, x + s, y, D * 0.5, 24))); x += 2 * s + 0.02; } }
          else { for (let n = 0; n < 3; n++) { const c = cyl(0.035, 0.035, 0.12, JAR, x + 0.04, y, D * 0.5, 18); par.add(loose(c)); par.add(loose(cyl(0.03, 0.03, 0.07, () => M('__kitchen_spice_' + n, [0xb0402a, 0xe8e4d8, 0x5b6b2a][n]), x + 0.04, y + 0.004, D * 0.5, 14)));
            par.add(loose(cyl(0.037, 0.037, 0.02, BLK, x + 0.04, y + 0.12, D * 0.5, 18))); x += 0.09; } }
          x += 0.04; } }); };
    const plant = (par, x, y, z, s = 1) => { const p = g(), pot = P({ color: 0xb59a78, roughness: 0.8, name: '__kitchen_pot' }), leaf = P({ color: 0x4f7a32, roughness: 0.7, name: '__kitchen_leaf' });
      p.add(cyl(0.065 * s, 0.05 * s, 0.13 * s, pot, 0, 0, 0, 20));
      for (let k = 0; k < 9; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.045 * s, 10, 8), leaf); const a = k * 2.4; l.scale.set(1, 0.5, 1.6); l.position.set(Math.cos(a) * 0.05 * s, (0.15 + 0.06 * (k % 3)) * s, Math.sin(a) * 0.05 * s); l.rotation.set(0.5, a, 0.3); p.add(l); }
      p.position.set(x, y, z); par.add(loose(p)); };
    // ---- one upper bay (carcass + shelves + lights + doors)
    const bay = (r, xa, w, y0, y1, D, t, n, under, label, hinge) => {
      const xm = xa + w / 2, h = y1 - y0, open = t === 'open', glassy = t === 'glass' || t === 'frame', T = 0.018, outer = open || (IS_TERRA && glassy) ? OAKm : IS_TEAK ? TKm : CSG;
      if (t === 'blind') {   // fixed blind-corner section: carcass + a fixed front, no door (the perpendicular run's doors swing clear of it)
        r.add(box(w, h, D, CARC, xm, y0, 0)); const f = panelFront(w - 0.004, h - 0.004, true); f.position.set(xa + 0.002, y0 + 0.002, D); r.add(f);
        if (under) { const um = led(0xfff0d8, 2.4); moods.strips.push(um); r.add(box(w - 0.04, 0.005, 0.012, um, xm, y0 - 0.005, D - 0.07)); }
        return; }
      r.add(box(w, T, D, outer, xm, y0, 0)); r.add(box(w, T, D, outer, xm, y1 - T, 0));
      r.add(box(T, h, D, outer, xa + T / 2, y0, 0)); r.add(box(T, h, D, outer, xa + w - T / 2, y0, 0));
      r.add(box(w - 2 * T, h - 2 * T, 0.008, glassy || open ? INNER : CARC, xm, y0 + T, 0));
      const shelves = h > 1.0 ? [1, 2, 3].map(k => y0 + k * h / 4) : h > 0.34 ? [y0 + h / 2] : [];
      for (const sy of shelves) r.add(box(w - 2 * T, 0.016, D - 0.03, open ? OAKm : CARC, xm, sy, 0.008));
      if (glassy || open) { const lm = led(0xffd29a, 2.2); moods.strips.push(lm);
        for (const ly of [y1 - T, ...shelves]) r.add(box(w - 0.06, 0.004, 0.008, lm, xm, ly - 0.005, D - 0.07)); }
      if (glassy) crockery(r, xa + T, w - 2 * T, [y0 + T, ...shelves.map(s => s + 0.016)], D - 0.02, h > 0.5);
      if (open && IS_SAGE && w < 0.35) [y0 + T, ...shelves.map(s => s + 0.016)].forEach((ly, k) => plant(r, xm, ly, D * 0.5, k % 2 ? 0.7 : 0.85));   // walnut niche with plants (reference)
      else if (open) jars(r, xa + T, w - 2 * T, [y0 + T, ...shelves.map(s => s + 0.016)], D - 0.02);
      if (!open) { const dn = n || (w > 0.62 ? 2 : 1), dw = w / dn;
        for (let k = 0; k < dn; k++) door(r, xa + k * dw, dw, y0, h, D, dn === 2 ? k === 0 : hinge !== 'r', glassy, true, label); }
      if (under) { const um = led(0xfff0d8, 2.4); moods.strips.push(um); r.add(box(w - 0.04, 0.005, 0.012, um, xm, y0 - 0.005, D - 0.07)); } };
    // Version A chimney: canopy 0.71 m above the hob (bottom 1.72) in front of the window's upper part; the chimney cover
    // runs up to the cabinet line and the duct turns north inside the existing ceiling bulkhead (x 10.04–10.28, y 2.93–3.05)
    // and out through the masonry pier beside the window. The hood is never fixed to the glass: its back hangs on a
    // powder-coated steel flat spanning pier to pier across the window (bolted into both piers), the chimney on the lintel.
    // Two narrow cabinets flank the chimney above the window head so the upper line stays continuous.
    const hood = (r, xa, w, y0, y1, D, label) => { const xm = xa + w / 2, cw = 0.32, fw = (w - cw) / 2, hd = g();
      const canH = IS_TEAK ? 0.08 : 0.13;
      if (CHIMM) { const k = w / CHIMM.size.x; CHIMM.obj.scale.setScalar(k); CHIMM.obj.position.set(xm, HB, 0); hd.add(CHIMM.obj);
        const top = HB + CHIMM.size.y * k, CV = P({ color: 0x141414, roughness: 0.25, clearcoat: 0.8, name: '__kitchen_chimney_cover' });
        hd.add(box(0.3, y1 - top, 0.24, CV, xm, top, 0));   // duct cover up to the cabinet line
        hd.add(box(WIN[1] - WIN[0] + 0.1, 0.04, 0.02, BLK, (WIN[0] + WIN[1]) / 2, HB + 0.1, 0.0));
        r.add(loose(hd)); bay(r, xa, fw, y0, y1, D, TWO_TIER ? 'glass' : 'solid', 1, false, label, 'l'); bay(r, xa + fw + cw, fw, y0, y1, D, TWO_TIER ? 'glass' : 'solid', 1, false, label, 'r'); return; }
      if (IS_TEAK) { hd.add(box(w, canH, 0.5, STEEL, xm, HB, 0, 0.004)); hd.add(box(w - 0.04, 0.004, 0.46, BLK, xm, HB - 0.004, 0.02)); hd.add(box(0.12, 0.012, 0.004, BLK, xm, HB + 0.034, 0.5));
        hd.add(box(cw, y1 - HB - canH, 0.26, STEEL, xm, HB + canH, 0)); }
      else { hd.add(box(w, canH, 0.5, WHT, xm, HB, 0, 0.004)); hd.add(box(w * 0.42, 0.04, 0.004, BLK, xm, HB + 0.05, 0.5));
        for (let k = 0; k < 5; k++) hd.add(box(0.012, 0.012, 0.003, WHT, xm - w * 0.16 + k * 0.035, HB + 0.064, 0.504));
        hd.add(box(cw, y1 - HB - canH, 0.26, CSG, xm, HB + canH, 0)); }
      hd.add(box(WIN[1] - WIN[0] + 0.1, 0.04, 0.02, BLK, (WIN[0] + WIN[1]) / 2, HB + canH, 0.0));   // steel support flat across the window
      const hl = led(0xfff0d8, 2.4); moods.strips.push(hl); hd.add(box(0.5, 0.004, 0.06, hl, xm, HB - 0.006, 0.3));   // hood task light
      r.add(loose(hd));
      bay(r, xa, fw, y0, y1, D, TWO_TIER ? 'glass' : 'solid', 1, false, label, 'l');
      bay(r, xa + fw + cw, fw, y0, y1, D, TWO_TIER ? 'glass' : 'solid', 1, false, label, 'r'); };
    // Version B: no hood; a 230 mm (9") exhaust fan cored through the masonry pier just north of the window (1.9–2.2 m),
    // framed in the splashback tile; the window stays completely clear and opens for cross-ventilation with the utility door.
    const pierFan = (r) => { const f = g(), fr = IS_TEAK ? BRZ : WHT;
      f.add(box(0.28, 0.28, 0.025, fr, PIER, 1.92, 0.004, 0.01)); f.add(cyl(0.118, 0.118, 0.012, BLK, 0, 0, 0, 40));
      f.children[1].rotation.x = Math.PI / 2; f.children[1].position.set(PIER, 2.06, 0.03);
      for (let k = 0; k < 7; k++) f.add(box(0.22, 0.008, 0.012, fr, PIER, 1.96 + k * 0.03, 0.03));
      r.add(f); };
    const oakColumn = (r, xa, w, y0, y1, D) => { const xm = xa + w / 2, T = 0.02;
      r.add(box(w, y1 - y0, 0.012, OAKm, xm, y0, 0)); r.add(box(T, y1 - y0, D, OAKm, xa + w - T / 2, y0, 0)); r.add(box(T, y1 - y0, D, OAKm, xa + T / 2, y0, 0));
      const lm = led(0xffd29a, 2.2); moods.strips.push(lm);
      for (let k = 0; k <= 3; k++) { const sy = y0 + k * (y1 - y0 - T) / 3; r.add(box(w, T, D, OAKm, xm, sy, 0)); if (k > 0) r.add(box(w - 0.06, 0.004, 0.008, lm, xm, sy - 0.005, D - 0.05)); }
      plant(r, xm, y0 + T, D * 0.5, 0.9); plant(r, xm, y0 + 2 * (y1 - y0 - T) / 3 + T, D * 0.5, 0.8); };
    // ---- base run
    const baseRun = (len, bays, label, hole) => {
      const r = g(), D = 0.58, YB = 0.1, YT = 0.93, gola = !HANDLED;   // worktop top 0.97 = the kept v1 hob / sink level
      r.add(box(len - 0.004, YB, 0.018, PLINTH, len / 2, 0, D - 0.07));
      if (gola) { const t = led(0xffd9a0, 1.8); moods.strips.push(t); r.add(box(len - 0.06, 0.005, 0.01, t, len / 2, YB - 0.006, D - 0.045)); }
      r.add(box(len, 0.018, D, CARC, len / 2, YB, 0)); r.add(box(len, YT - YB, 0.012, CARC, len / 2, YB, 0));
      if (hole) {   // worktop with the sink cut-out (shape in x / depth, extruded 40 mm, UVs in metres)
        const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(len, 0); sh.lineTo(len, D + 0.045); sh.lineTo(0, D + 0.045); sh.lineTo(0, 0);
        const ho = new THREE.Path(); ho.moveTo(hole[0], hole[2]); ho.lineTo(hole[0], hole[3]); ho.lineTo(hole[1], hole[3]); ho.lineTo(hole[1], hole[2]); ho.lineTo(hole[0], hole[2]); sh.holes.push(ho);
        const tm = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }), topMat(1, 1)); tm.rotation.x = Math.PI / 2; tm.position.y = YT + 0.04; r.add(tm); }
      else r.add(box(len, 0.04, D + 0.045, topMat(len, D + 0.045), len / 2, YT, 0));
      if (gola) r.add(box(len, 0.032, 0.022, BLK, len / 2, YT - 0.034, D - 0.026));
      const fTop = gola ? YT - 0.036 : YT - 0.004, fBot = YB + 0.004, FH = fTop - fBot;
      let x = 0;
      bays.forEach((b, i) => { const xa = x, xm = x + b.w / 2; x += b.w;
        r.add(box(0.018, YT - YB, D, CARC, i === 0 ? xa + 0.009 : xa, YB, 0));
        if (b.t === 'drawers') { let y = fBot;
          for (const f of [0.38, 0.38, 0.24]) { const h = FH * f, hh = gola && f !== 0.24 ? h - 0.016 : h;
            drawer(r, xa, b.w, y, hh, D, D, label + ' drawer');
            if (hh < h) r.add(box(b.w, 0.016, 0.01, BLK, xm, y + hh, D - 0.012));
            y += h; }
          return; }
        if (b.t === 'filler') { const f = panelFront(b.w - 0.002, FH, false); f.position.set(xa + 0.001, fBot, D); r.add(f); return; }   // 30 mm end filler: doors beside a wall open fully
        if (b.t === 'pullout') { drawer(r, xa, b.w, fBot, FH, D, D, label + ' bottle / spice pull-out'); return; }
        if (b.t !== 'sink') r.add(box(b.w - 0.02, 0.018, D - 0.05, CARC, xm, YB + 0.36, 0.02));
        const n = b.t === 'door1' ? 1 : 2, dw = b.w / n;
        for (let k = 0; k < n; k++) door(r, xa + k * dw, dw, fBot, FH, D, n === 2 ? k === 0 : b.hinge !== 'r', false, false, label + ' cabinet'); });
      r.add(box(0.018, YT - YB, D, CARC, len - 0.009, YB, 0));
      return r; };
    const upperRun = (r, D, tiers, label) => { for (const T of tiers) { let x = 0;
      for (const b of T.bays) { const xa = x; x += b.w; if (b.t === 'skip') continue;
        if (b.t === 'hood') hood(r, xa, b.w, T.y0, T.y1, D, label); else if (b.t === 'oakcol') oakColumn(r, xa, b.w, T.y0, T.y1, D - 0.04);
        else bay(r, xa, b.w, T.y0, T.y1, D, b.t, b.n, T.under, label, b.hinge); } } return r; };
    const YU = 1.55, YW = 2.32, YTOP = 2.9, YMID = 1.95;
    // ---- EAST run (hob under the window, sink to the south): local x = z − 1.79, window x 0.21–1.71, hob centre 0.865
    const east = baseRun(eastLen, [{ w: 0.21, t: 'pullout' }, { w: 0.45, t: 'door1' }, { w: 0.8, t: 'drawers' }, { w: 0.4, t: 'drawers' }, { w: 0.4, t: 'drawers' }, { w: 0.4, t: 'door1', hinge: 'r' }, { w: 0.79, t: 'sink' }, { w: 0.03, t: 'filler' }], 'Kitchen east', SINKM ? [SINKX - 0.2, SINKX + 0.2, 0.17, 0.525] : null);
    // splashback: pier strip north of the window tiled up to the upper line, south of the window up to the cabinets
    splash(east, 0, WIN[0], 0.97, YW); splash(east, WIN[1], eastLen, 0.97, YU);
    if (!CHIM) pierFan(east);
    if (SINKM) { SINKM.obj.scale.setScalar(0.01); SINKM.obj.position.set(SINKX, 0.98 - 0.239, 0.06); east.add(loose(SINKM.obj)); }
    const overWin = CHIM ? { w: 0.9, t: 'hood' } : { w: 0.9, t: TWO_TIER ? 'glass' : 'solid', n: 2 };
    if (TWO_TIER) upperRun(east, 0.35, [
      { y0: YU, y1: YW, under: true, bays: [{ w: 1.97, t: 'skip' }, { w: 0.4485, t: 'solid' }, { w: 0.4485, t: 'solid' }] },
      { y0: YW, y1: YTOP, bays: [{ w: 0.625, t: 'glass', n: 2 }, overWin, { w: 0.445, t: 'glass' }, { w: 0.4485, t: 'glass' }, { w: 0.4485, t: 'glass' }] }], 'Kitchen east upper');
    else { upperRun(east, 0.35, IS_SAGE ? [{ y0: YU, y1: YTOP, under: true, bays: [{ w: 1.97, t: 'skip' }, { w: 0.62, t: 'frame', n: 2 }, { w: 0.277, t: 'open' }] }] : [
      { y0: YU, y1: YMID, under: true, bays: [{ w: 1.97, t: 'skip' }, { w: 0.62, t: 'frame', n: 2 }, { w: 0.277, t: 'open' }] },
      { y0: YMID, y1: YTOP, bays: [{ w: 1.97, t: 'skip' }, { w: 0.62, t: 'solid', n: 2 }, { w: 0.277, t: 'solid' }] }], 'Kitchen east upper');
      upperRun(east, 0.35, [
      { y0: YW, y1: YTOP, bays: [{ w: 0.625, t: 'solid', n: 2 }, overWin, { w: 0.445, t: 'solid' }] }], 'Kitchen east upper');
    }
    // ---- WEST run (prep counter, south wall → fridge): local x = 5.06 − z
    const west = baseRun(westLen, [{ w: 0.03, t: 'filler' }, { w: 0.57, t: 'door2' }, { w: 0.6, t: 'drawers' }, { w: 0.6, t: 'drawers' }, { w: 0.61, t: 'door2' }], 'Kitchen west');
    splash(west, 0, westLen, 0.97, YU);
    const CW = 0.613, four = Array.from({ length: 4 }, () => (westLen - CW) / 4);
    if (TWO_TIER) upperRun(west, 0.35, [{ y0: YU, y1: YW, under: true, bays: [{ w: CW, t: 'skip' }, ...four.map((w, i) => ({ w, t: 'solid', n: 1, hinge: i ? 'l' : 'r' }))] }, { y0: YW, y1: YTOP, bays: [{ w: CW, t: 'skip' }, ...four.map((w, i) => ({ w, t: 'glass', n: 1, hinge: i ? 'l' : 'r' }))] }], 'Kitchen west upper');
    else upperRun(west, 0.35, [{ y0: YU, y1: YMID, under: true, bays: [{ w: CW, t: 'skip' }, { w: 0.59, t: 'open' }, { w: 0.6, t: 'open' }, { w: westLen - CW - 1.19, t: 'frame', n: 2 }] },
      { y0: YMID, y1: YTOP, bays: [{ w: CW, t: 'skip' }, ...four.map((w, i) => ({ w, t: 'solid', n: 1, hinge: i ? 'l' : 'r' }))] }], 'Kitchen west upper');
    // switch plates on the splash line (west: microwave, mixer, prep; east: beside the sink)
    { const PL = P({ color: HANDLED ? 0xf3efe6 : 0x1d1d1f, roughness: 0.35, name: '__kitchen_switch_plate' }), RK = P({ color: HANDLED ? 0xe2ddd2 : 0x333336, roughness: 0.4, name: '__kitchen_switch_rocker' });
      const plate = (par, x) => { par.add(box(0.13, 0.085, 0.01, PL, x, 1.12, 0.004, 0.003)); for (const dx of [-0.025, 0.025]) par.add(box(0.03, 0.045, 0.006, RK, x + dx, 1.14, 0.014, 0.002)); };
      for (const x of [0.34, 0.95, 1.62]) plate(west, x); plate(east, 2.3); }
    // counter styling
    if (HANDLED) { if (IS_OAK) { plant(east, 2.5, 0.97, 0.13, 0.9); plant(west, 1.5, 0.97, 0.1, 0.75); }
      const crock = g(); crock.add(cyl(0.06, 0.055, 0.16, CER, 0, 0, 0, 20)); for (let k = 0; k < 5; k++) { const s = cyl(0.006, 0.006, 0.3, k % 2 ? BLK : () => M('__kitchen_wood_spoon', 0xb88a5a), 0, 0, 0, 6); s.position.set(Math.cos(k * 1.3) * 0.025, 0.25, Math.sin(k * 1.3) * 0.025); s.rotation.set(Math.sin(k) * 0.15, 0, Math.cos(k) * 0.15); crock.add(s); }
      crock.position.set(1.71, 0.97, 0.12); east.add(loose(crock));
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 28, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), CER); bowl.material.side = THREE.DoubleSide; bowl.position.set(1.32, 0.97 + 0.066, 0.15); bowl.scale.y = 0.6; west.add(loose(bowl)); }
    else { if (IS_TERRA) { const v = g(), VS = P({ color: 0x2f2f2d, roughness: 0.7, name: '__kitchen_vase_dark' }); v.add(cyl(0.08, 0.06, 0.24, VS, 0, 0, 0, 24)); for (let k = 0; k < 7; k++) { const st2 = cyl(0.002, 0.002, 0.3, () => M('__dried_stem', 0x4a3f33), 0, 0, 0, 5); st2.position.set(Math.cos(k) * 0.02, 0.37, Math.sin(k) * 0.02); st2.rotation.set(Math.sin(k * 2) * 0.35, 0, Math.cos(k * 3) * 0.35); v.add(st2); } v.position.set(2.15, 0.97, 0.14); east.add(loose(v)); }
      plant(east, 2.45, 0.97, 0.13, 1); plant(east, 2.62, 0.97, 0.11, 0.8);   // beside the sink (the west south end now holds the pantry jars)
      const kb = g(); kb.add(box(0.1, 0.2, 0.12, BLK, 0, 0, 0, 0.006)); for (let k = 0; k < 3; k++) kb.add(box(0.016, 0.07, 0.025, () => M('__kitchen_knife_handle', 0xdddddd), -0.03 + k * 0.03, 0.2, 0.05)); kb.position.set(1.32, 0.97, 0.08); west.add(loose(kb));
      for (const [bx, c] of [[1.63, 0x2d3a1a], [1.71, 0x3a2a12]]) { east.add(loose(cyl(0.032, 0.032, 0.22, () => M('__kitchen_oil_' + c, c), bx, 0.97, 0.08, 16))); east.add(loose(cyl(0.012, 0.03, 0.06, () => M('__kitchen_oil_' + c, c), bx, 1.195, 0.08, 12))); }
      const brd = box(0.3, 0.42, 0.02, OAKm, 3.29, 0.97, 0.03, 0.01); brd.rotation.x = -0.12; east.add(loose(brd)); }
    // ---- bridge cabinet over the fridge + tall end panel (local x = 2.59 − z; 60 mm clear of the west run so its doors open)
    const bridge = g();
    if (IS_TEAK) upperRun(bridge, 0.6, [{ y0: 1.9, y1: YW, bays: [{ w: bridgeLen, t: 'solid', n: 2 }] }, { y0: YW, y1: YTOP, bays: [{ w: bridgeLen, t: 'glass', n: 2 }] }], 'Over-fridge');
    else if (IS_OAK) upperRun(bridge, 0.6, [{ y0: 1.9, y1: YW, bays: [{ w: bridgeLen, t: 'open' }] }, { y0: YW, y1: YTOP, bays: [{ w: bridgeLen, t: 'solid', n: 2 }] }], 'Over-fridge');   // oak niche over the fridge (reference)
    else upperRun(bridge, 0.6, [{ y0: 1.9, y1: YTOP, bays: [{ w: bridgeLen, t: 'solid', n: 2 }] }], 'Over-fridge');
    bridge.add(box(0.02, YTOP, 0.6, IS_TEAK ? TKm : IS_SAGE || IS_OAK ? OAKm : CSM, bridgeLen + 0.01, 0, 0));
    if (IS_SAGE) for (let k = 0; k < 15; k++) { const sl = box(0.016, YTOP - 0.1, 0.024, OAKm, 0, 0.05, 0.02 + k * 0.038, 0.005); sl.position.x = bridgeLen + 0.02 + 0.008; bridge.add(sl); }   // vertical walnut slats on the passage side
    // ---- utility passage (south wall, opening x 8.15–9.05, head 2.18): cabinet band over the opening joins the two upper runs
    // at the same line, matching architrave round the opening, LED under the band — nothing below 2.32 m, the passage stays open
    // corners (owner: "think about the corner cupboards properly"): a diagonal corner wall cabinet in each corner, over the
    // counter end (nothing reaches the floor), 620 × 620 mm with a 380 mm angled door → the corner storage is reachable and
    // no door swings into another; the runs' upper cabinets stop at it and the band over the utility door starts from it
    const ux1 = 9.66, ux0 = 7.505, util = g(), BT = TWO_TIER ? 'glass' : 'solid';
    upperRun(util, 0.35, [{ y0: YW, y1: YTOP, under: true, bays: [{ w: ux1 - 9.05, t: BT, n: 1, hinge: 'r' }, { w: 0.9, t: BT, n: 2 }, { w: 8.15 - ux0, t: BT, n: 1 }] }], 'Over the utility door');
    const cornerUnit = (P5, L, Rt, tiers, label) => { const r = g(), [A, B, C, Dd, E] = P5, w = Math.hypot(Rt[0] - L[0], Rt[1] - L[1]), ry = Math.atan2(-(Rt[1] - L[1]), Rt[0] - L[0]);
      const slab = (y, th, m) => { const sh = new THREE.Shape(); sh.moveTo(A[0], A[1]); for (const p of [B, C, Dd, E]) sh.lineTo(p[0], p[1]); sh.lineTo(A[0], A[1]);
        const ms = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }), m); ms.rotation.x = Math.PI / 2; ms.position.y = y + th; r.add(ms); };
      const sx = A[0] > C[0] ? 1 : -1;
      for (const T of tiers) { const h = T.y1 - T.y0, open = T.kind === 'open', om = open ? OAKm : IS_TEAK ? TKm : CSG;
        slab(T.y0, 0.018, om); slab(T.y1 - 0.018, 0.018, om); if (h > 0.5) slab(T.y0 + h / 2, 0.016, open ? OAKm : CARC);
        r.add(box(0.008, h, Math.abs(A[1] - B[1]), INNER, A[0] - sx * 0.004, T.y0, Math.min(A[1], B[1])));
        r.add(box(Math.abs(A[0] - E[0]), h, 0.008, INNER, (A[0] + E[0]) / 2, T.y0, A[1] - 0.008));
        r.add(box(Math.abs(B[0] - C[0]), h, 0.018, om, (B[0] + C[0]) / 2, T.y0, B[1]));
        r.add(box(0.018, h, Math.abs(E[1] - Dd[1]), om, Dd[0] + sx * 0.009, T.y0, Dd[1]));
        const fr = g(); fr.position.set(L[0], 0, L[1]); fr.rotation.y = ry; r.add(fr);
        const lm = led(0xffd29a, 2.2); moods.strips.push(lm); fr.add(box(w - 0.05, 0.005, 0.01, lm, w / 2, T.y1 - 0.024, -0.05));
        if (T.y0 < 1.6) { const um = led(0xfff0d8, 2.4); moods.strips.push(um); fr.add(box(w - 0.04, 0.005, 0.012, um, w / 2, T.y0 - 0.005, -0.07)); }
        if (T.kind === 'glass') { const cx = (A[0] + C[0] + Dd[0]) / 3, cz = (A[1] + C[1] + Dd[1]) / 3; for (let n = 0; n < 6; n++) r.add(loose(cyl(0.1, 0.08, 0.015, CER, cx, T.y0 + 0.018 + n * 0.016, cz, 28))); }
        if (open) { plant(r, (A[0] + C[0]) / 2, T.y0 + 0.018, (A[1] + Dd[1]) / 2, 0.8); continue; }
        const FL = 0.05, dw = w - 2 * FL, hx = L[0] + (Rt[0] - L[0]) * FL / w, hz = L[1] + (Rt[1] - L[1]) * FL / w;
        for (const fx of [0, w - FL]) { const fl = panelFront(FL - 0.002, h - 0.004, true); fl.position.set(fx + 0.001, T.y0 + 0.002, 0); fr.add(fl); }
        const d = g(), f = T.kind === 'glass' ? glassFront(dw - 0.004, h - 0.004) : panelFront(dw - 0.004, h - 0.004, true); f.position.set(0.002, 0.002, 0); d.add(f);
        pull(d, dw - 0.04, 0.12, 0.02, false); d.position.set(FL, T.y0, 0); fr.add(d);
        tagGroup(d, { type: 'cab', hinge: [hx, 0, hz], a1: -1.25, label, fitted: true, noFront: true }); }   // stops at 72°: clears the neighbours' pulls, the 280 mm opening is fully free
      return r; };
    const ctiers = IS_OAK ? [{ y0: YU, y1: YW, kind: 'open' }, { y0: YW, y1: YTOP, kind: 'glass' }] : IS_TEAK ? [{ y0: YU, y1: YW, kind: 'solid' }, { y0: YW, y1: YTOP, kind: 'glass' }] : [{ y0: YU, y1: YMID, kind: 'open' }, { y0: YMID, y1: YTOP, kind: 'solid' }];
    const cornerSE = cornerUnit([[room.x1, room.z1], [room.x1, 4.447], [room.x1 - 0.35, 4.447], [ux1, room.z1 - 0.35], [ux1, room.z1]], [room.x1 - 0.35, 4.447], [ux1, room.z1 - 0.35], ctiers, 'Corner cabinet');
    const cornerSW = cornerUnit([[room.x0, room.z1], [room.x0, 4.447], [room.x0 + 0.35, 4.447], [ux0, room.z1 - 0.35], [ux0, room.z1]], [ux0, room.z1 - 0.35], [room.x0 + 0.35, 4.447], ctiers, 'Corner cabinet');
    // design continuity (owner 2026-11-11): ONE splashback tile line at the worktop band (0.97 → 1.55) running unbroken over
    // every wall square at the counters — the south-wall returns beside the sink and the prep counter, and the passage wall up
    // to the utility door frame (worktop line as a slim trim, toe-kick skirting below) — never a full-height surround.
    // Flush finishes in their own group (≤ 12 mm, nothing at leg height in the walkway).
    const pw = g();
    for (const [wx0, wx1] of [[room.x0, 8.1], [9.1, room.x1]]) splash(pw, ux1 - wx1, ux1 - wx0, 0.97, YU);
    for (const [wx0, wx1] of [[room.x0 + 0.625, 8.1], [9.1, room.x1 - 0.625]]) { const a = ux1 - wx1, b = ux1 - wx0;
      pw.add(box(b - a, 0.012, 0.008, IS_TEAK ? TKm : BLK, (a + b) / 2, 0.958, 0.004)); pw.add(box(b - a, 0.1, 0.012, PLINTH, (a + b) / 2, 0.056, 0)); }
    // north wall square at the east counter's north end (puja partition side): tiled like the pier strip beside it
    const nret = g(); splash(nret, 8.8, room.x1, 0.97, YU); splash(nret, room.x1 - 0.625, room.x1, YU, YW);
    nret.add(box(room.x1 - 0.625 - 8.8, 0.012, 0.008, IS_TEAK ? TKm : BLK, (8.8 + room.x1 - 0.625) / 2, 0.958, 0.004)); nret.add(box(room.x1 - 0.625 - 8.8, 0.1, 0.012, PLINTH, (8.8 + room.x1 - 0.625) / 2, 0.056, 0));
    { const AR = IS_TEAK ? TKm : OAKm, j0 = ux1 - 9.1, j1 = ux1 - 8.15;
      pw.add(box(0.05, 2.18 - 0.056, 0.025, AR, j0 + 0.025, 0.056, 0)); pw.add(box(0.05, 2.18 - 0.056, 0.025, AR, j1 + 0.025, 0.056, 0));
      pw.add(box(j1 + 0.05 - j0, 0.07, 0.025, AR, (j0 + j1 + 0.05) / 2, 2.13, 0)); }
    // ---- floor (beige marble, 0.8 m slabs) + pendant (teak look)
    const fl = g(), FW = room.x1 - room.x0, FD = room.z1 - room.z0;
    if (IS_TERRA) { const t = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#ece6d6'; x.fillRect(0, 0, w, h); const C = 128;   // 0.2 m cement tiles, 0.8 m texture
        x.strokeStyle = '#5f7a5e'; x.fillStyle = '#5f7a5e'; x.lineWidth = 2;
        for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) { const cx = i * C, cy = j * C;
          for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + dx * C / 2, cy + dy * C / 2); x.stroke();
            for (let k = 1; k < 6; k++) { const px = cx + dx * k * C / 12, py = cy + dy * k * C / 12; x.save(); x.translate(px, py); x.rotate(Math.atan2(dy, dx)); x.beginPath(); x.ellipse(0, 5, 5, 2, 0.5, 0, 7); x.fill(); x.beginPath(); x.ellipse(0, -5, 5, 2, -0.5, 0, 7); x.fill(); x.restore(); } }
          const mx = cx + C / 2, my = cy + C / 2; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; x.beginPath(); x.ellipse(mx + Math.cos(a) * 6, my + Math.sin(a) * 6, 6, 3, a, 0, 7); x.fill(); } }
        x.strokeStyle = 'rgba(150,140,120,0.5)'; x.lineWidth = 1; for (let k = 0; k <= 4; k++) { x.beginPath(); x.moveTo(k * C, 0); x.lineTo(k * C, h); x.moveTo(0, k * C); x.lineTo(w, k * C); x.stroke(); } });
      t.wrapS = t.wrapT = THREE.RepeatWrapping; const geo = new THREE.PlaneGeometry(FW, FD), uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * FW / 0.8, uv.getY(i) * FD / 0.8);
      const m = new THREE.Mesh(geo, P({ map: t, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, name: '__kitchen_cement_tile_leaf' }));
      m.rotation.x = -Math.PI / 2; m.position.set((room.x0 + room.x1) / 2, 0.059, (room.z0 + room.z1) / 2); fl.add(m); }
    else { const t = canvasTex(1024, 1024, (x, w, h) => { x.fillStyle = IS_TEAK ? '#e6d8c2' : '#e2d2b8'; x.fillRect(0, 0, w, h);
        for (let k = 0; k < 1600; k++) { x.fillStyle = `rgba(${170 + rnd() * 60},${140 + rnd() * 50},${100 + rnd() * 40},0.08)`; x.beginPath(); x.arc(rnd() * w, rnd() * h, 4 + rnd() * 30, 0, 7); x.fill(); }
        for (let k = 0; k < 30; k++) { x.strokeStyle = `rgba(150,110,75,${0.1 + rnd() * 0.25})`; x.lineWidth = 0.8 + rnd() * 2.5; x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let s = 0; s < 8; s++) { px += 30 + rnd() * 90; py += (rnd() - 0.5) * 70; x.lineTo(px, py); } x.stroke(); }
        x.fillStyle = 'rgba(160,140,115,0.5)'; x.fillRect(0, 0, w, 2); x.fillRect(0, 0, 2, h); x.fillRect(0, h / 2, w, 2); x.fillRect(w / 2, 0, 2, h); });
      t.wrapS = t.wrapT = THREE.RepeatWrapping; const geo = new THREE.PlaneGeometry(FW, FD), uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * FW / 1.6, uv.getY(i) * FD / 1.6);
      const m = new THREE.Mesh(geo, P({ map: t, roughness: 0.18, clearcoat: 0.5, clearcoatRoughness: 0.12, polygonOffset: true, polygonOffsetFactor: -2, name: '__kitchen_marble_floor' }));
      m.rotation.x = -Math.PI / 2; m.position.set((room.x0 + room.x1) / 2, 0.059, (room.z0 + room.z1) / 2); fl.add(m); }   // v1 kitchen floor finish top = 0.056
    let pend = null;
    if (IS_TEAK) { pend = g(); const px = (room.x0 + room.x1) / 2, pz = 3.3, top = 3.05, y = 2.2;
      pend.add(cyl(0.003, 0.003, top - y - 0.2, BLK, px, y + 0.2, pz, 6)); pend.add(cyl(0.05, 0.05, 0.015, BLK, px, top - 0.015, pz, 16));
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.16, 0.2, 40, 1, true), P({ color: 0xf1ead8, roughness: 0.4, side: THREE.DoubleSide, name: '__kitchen_pendant_shade' })); sh.position.set(px, y + 0.1, pz); pend.add(sh);
      pend.add(cyl(0.02, 0.025, 0.04, BRZ, px, y + 0.19, pz, 16)); const bl = led(0xffd6a0, 3); moods.strips.push(bl); pend.add(cyl(0.14, 0.14, 0.004, bl, px, y + 0.01, pz, 32)); }
    if (IS_OAK) { pend = g(); const DM = P({ color: 0x141414, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide, name: '__kitchen_dome_black' }), BRC = P({ color: 0xb08d57, metalness: 0.9, roughness: 0.3, name: '__kitchen_brass_collar' });
      for (const pz of [2.75, 4.15]) { const px = 9.05, y = 2.1; pend.add(cyl(0.003, 0.003, 3.05 - y - 0.24, BLK, px, y + 0.24, pz, 6)); pend.add(cyl(0.04, 0.04, 0.015, DM, px, 3.035, pz, 16));
        pend.add(cyl(0.03, 0.03, 0.06, BRC, px, y + 0.18, pz, 16)); const dome = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), DM); dome.position.set(px, y, pz); dome.scale.y = 1.2; pend.add(dome);
        const bl = led(0xffc890, 3); moods.strips.push(bl); pend.add(cyl(0.11, 0.11, 0.004, bl, px, y + 0.01, pz, 24)); } }
    if (IS_SAGE) { pend = g(); const BR = P({ color: 0xb08d57, metalness: 0.9, roughness: 0.3, name: '__kitchen_brass_cage' });
      for (const pz of [2.75, 4.15]) { const px = 9.05, y = 2.05; pend.add(cyl(0.003, 0.003, 3.05 - y - 0.3, BLK, px, y + 0.3, pz, 6)); pend.add(cyl(0.04, 0.04, 0.015, BR, px, 3.035, pz, 16));
        const V = [[0.15, 0, 0], [-0.15, 0, 0], [0, 0.2, 0], [0, -0.2, 0], [0, 0, 0.15], [0, 0, -0.15]], cy = y + 0.15;
        for (const [i, j] of [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5]]) {   // geometric brass cage = 12 rods
          const a = new THREE.Vector3(...V[i]), b = new THREE.Vector3(...V[j]), rod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, a.distanceTo(b), 6), BR);
          rod.position.copy(a.clone().add(b).multiplyScalar(0.5)).add(new THREE.Vector3(px, cy, pz)); rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); pend.add(rod); }
        const bl = led(0xffc070, 3.2); moods.strips.push(bl); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), bl); bulb.position.set(px, y + 0.14, pz); pend.add(bulb); }
      const rug = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.006, 2.2), P({ color: 0xb9ab95, roughness: 0.95, name: '__kitchen_runner' })); rug.position.set(8.55, 0.062, 3.6); fl.add(rug); }
    const parts = {
      east: { obj: east, x: room.x1, z: 1.58, ry: -Math.PI / 2, label: 'Kitchen east counter (hob + sink)' },
      west: { obj: west, x: room.x0, z: 5.06, ry: Math.PI / 2, label: 'Kitchen west counter (prep)' },
      bridge: { obj: bridge, x: room.x0, z: 2.59, ry: Math.PI / 2, label: 'Cabinet over the fridge' },
      floor: { obj: fl, x: 0, z: 0, ry: 0, label: 'Kitchen marble floor' },
      utility: { obj: util, x: ux1, z: room.z1, ry: Math.PI, label: 'Cabinet band over the utility door' },
      passage: { obj: pw, x: ux1, z: room.z1, ry: Math.PI, label: 'Splashback tile line, trim, skirting + architrave (south wall)' },
      northTile: { obj: nret, x: 0, z: room.z0, ry: 0, label: 'Splashback tile line (north wall)' },
      cornerSE: { obj: cornerSE, x: 0, z: 0, ry: 0, label: 'Corner cabinet (sink side)' },
      cornerSW: { obj: cornerSW, x: 0, z: 0, ry: 0, label: 'Corner cabinet (prep side)' },
    };
    if (pend) parts.pendant = { obj: pend, x: 0, z: 0, ry: 0, label: 'Kitchen pendant' };
    return { parts, moods };
  }
  /* ---------- owner's current single-door fridge in the side-by-side bay (provisional 600 × 1600 × 680 — measure it) + a removable
     300 mm pull-out larder on castors that fills the rest of the bay today; on the upgrade the larder rolls out and the 912 mm
     side-by-side goes in with no carpentry. Local frame: origin = back centre on the floor, +x along the wall, +z = front. */
  /* owner model "Mixer grinder machine from India" (ASHISH / 3dmodelsmith, Sketchfab, CC BY 4.0): the file lays the motor base and
     its three jars out in a row ≈ 1 m long → re-assembled as it stands on a counter: the medium jar seated on the base, the large
     and the small jar beside it along the wall, cord coiled behind; re-origined to the builder frame (back face, floor, front +z) */
  function mixerGrinder() {
    const src = model('mixer_grinder'); if (!src) return null;
    const h = src.obj, m = h.children[0], V = () => new THREE.Vector3(); h.updateMatrixWorld(true);
    const wbox = o => new THREE.Box3().setFromObject(o);
    // GLTFLoader strips '.' from node names (part.032_low → part032_low)
    const byName = n => h.getObjectByName(n) || h.getObjectByName(n.replace(/\./g, ''));
    const body = byName('mat2part.007_low.019_mat2_0'), jM = byName('part.032_low'), jS = byName('part.004_low'), jL = byName('part.009_low');
    if (!body || !jM || !jS || !jL) return src;
    const bb = wbox(body), bc = bb.getCenter(V());
    const moveTo = (node, cx, y0, cz) => { const b = wbox(node), c = b.getCenter(V()), d = new THREE.Vector3(cx - c.x, y0 - b.min.y, cz - c.z);
      const wp = node.getWorldPosition(V()).add(d); node.parent.worldToLocal(wp); node.position.copy(wp); h.updateMatrixWorld(true); };
    moveTo(jM, bc.x, bb.max.y - 0.012, bc.z);
    const wL = wbox(jL).getSize(V()).x, wS = wbox(jS).getSize(V()).x;
    moveTo(jL, bb.max.x + 0.03 + wL / 2, 0, bc.z - 0.02); moveTo(jS, bb.max.x + 0.06 + wL + wS / 2, 0, bc.z + 0.03);
    const b2 = wbox(m); m.position.x -= (b2.min.x + b2.max.x) / 2; m.position.y -= b2.min.y; m.position.z -= b2.min.z; h.updateMatrixWorld(true);
    return { obj: h, size: wbox(m).getSize(V()), name: src.name };
  }
  /* owner model "Dreamburst - bed" (Brian Trepanier, Sketchfab, CC BY 4.0): tufted wingback bed with bedding. The scan was skewed
     17.3° in its file (squared up with tools/glb_square_up.py) and is undersized: its mattress is ≈ 1.80 × 1.80 m → fitted to the
     owners' 6 × 7 ft mattress (1829 × 2134): width × 1.016, length × 1.186, height as scanned (mattress top ≈ 0.6 m).
     finish 'taupe' (default, coral recoloured — owner rule: no pink bed) | 'coral' (as supplied). Same frame as upholsteredBed:
     origin = headboard back centre on the floor, foot towards +z; returns { obj, size: { w, l } } so the layouts place it the same way. */
  function dreamburstBed({ finish = 'taupe', mattressW = 1.829, mattressL = 2.134, modelMattress = 1.80, floorY = 0.06 } = {}) {
    const src = model(finish === 'coral' ? 'bed_dreamburst' : 'bed_dreamburst_taupe'); if (!src) return null;
    const sx = mattressW / modelMattress, sz = mattressL / modelMattress; src.obj.scale.set(sx, 1, sz); src.obj.position.y = floorY;
    return { obj: src.obj, size: { w: src.size.x * sx, l: src.size.z * sz }, label: finish === 'coral' ? 'Dreamburst tufted wingback bed 6×7 ft (coral, as supplied)' : 'Dreamburst tufted wingback bed 6×7 ft (mushroom taupe)' };
  }
  function fridgeSingleDoor({ w = 0.6, h = 1.6, d = 0.68 } = {}) {
    const root = g(), BODY = new THREE.MeshPhysicalMaterial({ color: 0xb9bdc1, metalness: 0.55, roughness: 0.35, name: '__fridge_single_silver' }), LIN = () => M('__fridge_liner', 0xf3f4f2), t = 0.04, dz = d - 0.05;
    root.add(box(w, t, dz, BODY, 0, 0.06, 0)); root.add(box(w, t, dz, BODY, 0, h - t, 0)); root.add(box(t, h - 0.06, dz, BODY, -w / 2 + t / 2, 0.06, 0)); root.add(box(t, h - 0.06, dz, BODY, w / 2 - t / 2, 0.06, 0));
    root.add(box(w, 0.06, dz - 0.03, () => M('__fridge_base_grille', 0x2c2d30), 0, 0, 0)); root.add(box(w - 2 * t, h - 0.1 - t, 0.02, LIN, 0, 0.1, 0));
    for (const sy of [0.32, 0.62, 0.92, 1.18]) root.add(box(w - 2 * t, 0.006, dz - 0.06, () => M('__fridge_glass_shelf', 0xdfeeee), 0, sy, 0.03));
    root.add(box(w - 2 * t, h - 1.3 - t, dz - 0.04, LIN, 0, 1.3, 0.02));   // freezer box at the top
    const dr = g(); dr.add(box(w - 0.004, h - 0.064, 0.05, BODY, w / 2, 0.062, 0, 0.01));
    const hd = box(0.022, 0.42, 0.03, () => M('__fridge_handle', 0x2b2d31), w - 0.05, 0.95, 0.05, 0.008); dr.add(hd);
    for (const [y0, n] of [[0.25, 3], [1.25, 1]]) for (let k = 0; k < n; k++) dr.add(box(w - 0.12, 0.006, 0.08, LIN, w / 2, y0 + k * 0.3, -0.08));
    dr.position.set(-w / 2, 0, dz); root.add(dr);
    tagGroup(dr, { type: 'cab', hinge: [-w / 2, 0, dz], a1: -Math.PI * 0.55, label: 'refrigerator door', fitted: true });
    return { obj: loose(root) };
  }
  function larderPullout({ w = 0.3, h = 1.78, d = 0.6, style = 'teak-blue' } = {}) {
    const root = g(), un = g(), FRONT = style === 'cashmere-sage' ? new THREE.MeshPhysicalMaterial({ color: 0xcdbfad, roughness: 0.62, name: '__kitchen_cashmere_matt' })
      : style === 'teak-blue' ? M('__kitchen_teak_flat', 0xa1602f) : SAGE, CB = () => M('__kitchen_carcass', 0xe6dfd2);
    un.add(box(0.018, h - 0.05, d - 0.02, CB, -w / 2 + 0.009, 0.05, 0)); un.add(box(0.018, h - 0.05, d - 0.02, CB, w / 2 - 0.009, 0.05, 0));
    for (const sy of [0.06, 0.45, 0.85, 1.25, h - 0.02]) un.add(box(w - 0.036, 0.018, d - 0.04, CB, 0, sy, 0.01));
    un.add(box(w, h - 0.05, 0.02, FRONT, 0, 0.05, d - 0.02, 0.003));
    un.add(box(0.012, 0.3, 0.02, () => M('__kitchen_bronze', 0x5e4026), 0, h - 0.45, d + 0.005, 0.004));
    for (const [cx, cz] of [[-w / 2 + 0.04, 0.06], [w / 2 - 0.04, 0.06], [-w / 2 + 0.04, d - 0.08], [w / 2 - 0.04, d - 0.08]]) { const c = cyl(0.022, 0.022, 0.018, BLACK, 0, 0, 0, 16); c.rotation.z = Math.PI / 2; c.position.set(cx, 0.025, cz); un.add(c); }
    for (const [sy, n] of [[0.078, 2], [0.468, 3], [0.868, 3], [1.268, 2]]) for (let k = 0; k < n; k++) un.add(loose(cyl(0.04, 0.04, 0.16, () => M('__kitchen_jar_' + ((k + n) % 3), [0xd8c39a, 0xb3402a, 0xe9e4d8][(k + n) % 3]), 0, sy, 0.1 + k * 0.15, 18)));
    root.add(un); tagGroup(un, { type: 'slide', slide: [0, 0, 0.45], label: 'pull-out larder (removable)', fitted: true });
    return { obj: root };
  }
  function pujaPanelShrine({ x0 = 8.755, x1 = 10.28, z0 = 0.199, z1 = 1.472, ceil = 2.91, idol = 'sketchfab-black' } = {}) {
    const parts = {}, zc = (z0 + z1) / 2, L = x1 - x0, D = z1 - z0, moods = { strips: [], halos: [] };
    const canvasMat = (cw, chh, draw, opt) => { const cv = document.createElement('canvas'); cv.width = cw; cv.height = chh; const x = cv.getContext('2d'); draw(x, cw, chh);
      const col = new THREE.CanvasTexture(cv); col.colorSpace = THREE.SRGBColorSpace; const bump = new THREE.CanvasTexture(cv);
      for (const t of [col, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
      return new THREE.MeshStandardMaterial({ map: col, bumpMap: bump, ...opt }); };
    let sd = 11; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    const noise = (x, a, b, w, h, base, n = 900) => { for (let k = 0; k < n; k++) { const v = base + (rnd() - 0.5) * 26; x.fillStyle = `rgba(${v + 6},${v + 2},${v - 6},0.45)`; x.fillRect(a + rnd() * w, b + rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); } };
    const plane = (w, h, mat) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    // ---- back wall: patchwork panels (one canvas, 400 px per metre)
    { const r = g(), PX = 400, cw = Math.round(D * PX), chh = Math.round(ceil * PX);
      const mat = canvasMat(cw, chh, (x, w, h) => {
        x.fillStyle = '#1c1915'; x.fillRect(0, 0, w, h);
        const GOLD = '#c8a24e', GOLD2 = '#e6c372';
        const sunflower = (cx, cy, R) => { x.fillStyle = GOLD; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; x.beginPath(); x.ellipse(cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55, R * 0.42, R * 0.14, a, 0, 7); x.fill(); } x.fillStyle = '#7a5c22'; x.beginPath(); x.arc(cx, cy, R * 0.22, 0, 7); x.fill(); };
        const mandala = (cx, cy, R) => { x.strokeStyle = 'rgba(200,162,78,0.55)'; x.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; x.beginPath(); x.arc(cx + Math.cos(a) * R / 2, cy + Math.sin(a) * R / 2, R / 2, 0, 7); x.stroke(); } x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke(); };
        const script = (a, b, w2, h2) => { x.strokeStyle = 'rgba(200,162,78,0.5)'; x.lineWidth = 2.2; for (let row = 0; row < 3; row++) { const yy = b + h2 * (0.3 + row * 0.2); let cx = a + w2 * 0.12; while (cx < a + w2 * 0.88) { x.beginPath(); x.moveTo(cx, yy - 6); x.lineTo(cx + 14, yy - 6); x.moveTo(cx + 4, yy - 6); x.quadraticCurveTo(cx + 2, yy + 6, cx + 10, yy + 4); x.stroke(); cx += 18 + rnd() * 6; if (rnd() < 0.12) cx += 12; } } };
        // panel layout in metres [z from the north wall, y, w, h, kind]
        const P = [[0.0, 0.0, 0.42, 0.95, 'plain'], [0.42, 0.0, 0.43, 0.55, 'mandala'], [0.85, 0.0, 0.42, 0.95, 'sun'],
          [0.42, 0.55, 0.43, 0.4, 'plain'], [0.0, 0.95, 0.3, 0.75, 'sun'], [0.3, 0.95, 0.67, 0.55, 'plain'], [0.97, 0.95, 0.3, 0.75, 'script'],
          [0.3, 1.5, 0.67, 0.6, 'plain'], [0.0, 1.7, 0.3, 0.7, 'script'], [0.97, 1.7, 0.3, 0.7, 'mandala'], [0.3, 2.1, 0.67, 0.4, 'script'],
          [0.0, 2.4, 0.65, 0.51, 'plain'], [0.65, 2.4, 0.62, 0.51, 'sun']];
        for (const [pz, py, pw, ph, kind] of P) { const a = pz * PX, b = h - (py + ph) * PX, w2 = pw * PX, h2 = ph * PX, base = 46 + rnd() * 18;
          x.fillStyle = `rgb(${base + 8},${base + 2},${base - 8})`; x.fillRect(a + 3, b + 3, w2 - 6, h2 - 6); noise(x, a + 3, b + 3, w2 - 6, h2 - 6, base + 10, Math.round(w2 * h2 / 60));
          x.strokeStyle = 'rgba(0,0,0,0.55)'; x.lineWidth = 3; x.strokeRect(a + 3, b + 3, w2 - 6, h2 - 6);
          if (kind === 'sun') for (let k = 0; k < 4; k++) sunflower(a + w2 * (0.3 + (k % 2) * 0.4), b + h2 * (0.28 + Math.floor(k / 2) * 0.44), Math.min(w2, h2) * 0.12);
          if (kind === 'mandala') mandala(a + w2 / 2, b + h2 / 2, Math.min(w2, h2) * 0.3);
          if (kind === 'script') script(a, b, w2, h2); }
        // gold inlay strips (vertical + horizontal)
        x.fillStyle = GOLD2; x.fillRect(0.85 * PX - 4, h - 0.95 * PX, 8, 0.95 * PX - 0.55 * PX); x.fillRect(0.3 * PX - 3, h - 2.4 * PX, 6, 0.7 * PX); x.fillRect(0, h - 0.95 * PX - 3, w, 6);
      }, { bumpScale: 4, roughness: 0.42, metalness: 0.35, name: '__patchwork_bronze_stone' });
      const bw = plane(D, ceil, mat); bw.rotation.y = -Math.PI / 2; bw.position.set(x1 - 0.003, ceil / 2, zc); r.add(bw);
      // small black-and-gold plaques on the back wall (two high, two low)
      const plq = canvasMat(64, 128, (x, w, h) => { x.fillStyle = '#c8a24e'; x.fillRect(0, 0, w, h); x.fillStyle = '#121110'; x.fillRect(6, 6, w - 12, h - 12); x.fillStyle = '#c8a24e'; x.beginPath(); x.moveTo(w / 2, 20); x.lineTo(w / 2 + 10, 44); x.lineTo(w / 2 - 10, 44); x.closePath(); x.fill(); x.beginPath(); x.ellipse(w / 2, 70, 11, 22, 0, 0, 7); x.fill(); x.fillRect(w / 2 - 14, 96, 28, 12); }, { bumpScale: 3, roughness: 0.35, metalness: 0.6, name: '__plaque_black_gold' });
      for (const [pz, py] of [[0.12, 2.15], [1.15, 2.15], [0.12, 1.2], [1.15, 1.2]]) { const pq = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.24, 0.12), plq); pq.position.set(x1 - 0.015, py, z0 + pz); r.add(pq); }
      parts.backwall = { obj: r }; }
    // ---- side walls (taupe stone) with lit niches + fluted bronze edge strips; floor; ceiling with cove light
    { const r = g();
      const taupe = canvasMat(256, 256, (x, w, h) => { x.fillStyle = '#8a7e6c'; x.fillRect(0, 0, w, h); noise(x, 0, 0, w, h, 140, 1600); x.strokeStyle = 'rgba(60,52,40,0.35)'; x.lineWidth = 2; x.strokeRect(0, 0, w, h); }, { bumpScale: 1.5, roughness: 0.55, name: '__taupe_stone' });
      taupe.map.repeat.set(1, 1);
      for (const [zz, ry] of [[z0 + 0.003, 0], [z1 - 0.003, Math.PI]]) { const sw = plane(L, ceil, taupe); sw.rotation.y = ry; sw.position.set((x0 + x1) / 2, ceil / 2, zz); r.add(sw); }
      const fl = canvasMat(256, 256, (x, w, h) => { x.fillStyle = '#d8d2c6'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(150,140,125,0.5)'; x.lineWidth = 1.2; for (let k = 0; k < 9; k++) { x.beginPath(); x.moveTo(rnd() * w, 0); x.bezierCurveTo(rnd() * w, h * 0.3, rnd() * w, h * 0.7, rnd() * w, h); x.stroke(); } }, { bumpScale: 0.5, roughness: 0.25, name: '__pale_marble_floor' });
      const floor = plane(L, D, fl); floor.rotation.x = -Math.PI / 2; floor.position.set((x0 + x1) / 2, 0.058, zc); r.add(floor);
      const rug = canvasMat(256, 160, (x, w, h) => { x.fillStyle = '#6e5a44'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c8b28a'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20); x.lineWidth = 2; x.strokeRect(22, 22, w - 44, h - 44); x.fillStyle = '#c8b28a'; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(48 + k * 40, h / 2, 10, 0, 7); x.fill(); } }, { bumpScale: 1, roughness: 0.95, name: '__puja_rug' });
      const rg = plane(0.55, 0.85, rug); rg.rotation.set(-Math.PI / 2, 0, Math.PI / 2); rg.position.set(x0 + 0.42, 0.062, zc); r.add(loose(rg));
      const cl = plane(L, D, M('__cream_ceiling', 0xe8e0d0)); cl.rotation.x = Math.PI / 2; cl.position.set((x0 + x1) / 2, ceil - 0.004, zc); r.add(cl);
      const cove = led(0xffd29a, 2.4); moods.strips.push(cove);
      for (const [w, d, px, pz] of [[L, 0.012, (x0 + x1) / 2, z0 + 0.03], [L, 0.012, (x0 + x1) / 2, z1 - 0.03], [0.012, D, x1 - 0.03, zc]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(w, 0.01, d), cove); c.position.set(px, ceil - 0.012, pz); r.add(c); }
      for (const pz of [zc - 0.35, zc + 0.35]) { const dl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 20), led(0xffe2b0, 2.6)); moods.strips.push(dl.material); dl.position.set(x1 - 0.25, ceil - 0.008, pz); r.add(dl); }
      // fluted bronze edge strips on the side walls at the opening (20 mm proud — door leaves fold over them)
      const flute = M('__fluted_bronze', 0x3a3128);
      for (const [zz, sz] of [[z0, 1], [z1, -1]]) for (let k = 0; k < 6; k++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, ceil - 0.1, 10), flute); f.position.set(x0 + 0.06 + k * 0.026, ceil / 2, zz + sz * 0.012); r.add(f); }
      // lit niches on both side walls beside the altar (beyond the door-leaf reach, x ≥ 9.42)
      const nicheBack = M('__niche_bronze', 0x2e2822), shelfM = M('__niche_shelf_stone', 0xcfc6b6), led2 = led(0xffcf8a, 2.6); moods.strips.push(led2);
      const brassPot = (px, py, pz) => { const pg = g(); pg.add(cyl(0.03, 0.022, 0.06, BRASS, 0, 0, 0, 16)); const b = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10), BRASS()); b.position.y = 0.07; b.scale.y = 0.8; pg.add(b); pg.position.set(px, py, pz); return loose(pg); };
      const plant = (px, py, pz) => { const pg = g(); pg.add(cyl(0.035, 0.028, 0.07, () => M('__pot_cream', 0xd9cfbd), 0, 0, 0, 16)); for (let k = 0; k < 9; k++) { const a = k * 2.4, lf = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), M('__leaf_green', 0x5f7d3e)); lf.scale.set(1, 0.4, 0.6); lf.position.set(Math.cos(a) * 0.025, 0.08 + (k / 9) * 0.1, Math.sin(a) * 0.025); pg.add(lf); } pg.position.set(px, py, pz); return loose(pg); };
      for (const [zz, sz] of [[z0, 1], [z1, -1]]) { const nx0 = 9.45, nx1 = 9.98, ny0 = 1.0, ny1 = 2.3;
        const bk = new THREE.Mesh(new THREE.BoxGeometry(nx1 - nx0, ny1 - ny0, 0.006), nicheBack); bk.position.set((nx0 + nx1) / 2, (ny0 + ny1) / 2, zz + sz * 0.006); r.add(bk);
        for (const [w, h, px, py] of [[nx1 - nx0 + 0.06, 0.03, (nx0 + nx1) / 2, ny0 - 0.015], [nx1 - nx0 + 0.06, 0.03, (nx0 + nx1) / 2, ny1 + 0.015], [0.03, ny1 - ny0, nx0 - 0.015, (ny0 + ny1) / 2], [0.03, ny1 - ny0, nx1 + 0.015, (ny0 + ny1) / 2]]) { const fr = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), shelfM); fr.position.set(px, py, zz + sz * 0.025); r.add(fr); }
        for (const sy of [1.45, 1.9]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(nx1 - nx0, 0.02, 0.1), shelfM); sh.position.set((nx0 + nx1) / 2, sy, zz + sz * 0.05); r.add(sh); const lb = new THREE.Mesh(new THREE.BoxGeometry(nx1 - nx0 - 0.04, 0.006, 0.01), led2); lb.position.set((nx0 + nx1) / 2, sy - 0.013, zz + sz * 0.09); r.add(lb); }
        r.add(brassPot(9.62, 1.46, zz + sz * 0.06)); r.add(plant(9.82, 1.46, zz + sz * 0.06)); r.add(brassPot(9.72, 1.91, zz + sz * 0.06)); r.add(plant(9.6, 1.01, zz + sz * 0.06)); r.add(brassPot(9.85, 1.01, zz + sz * 0.06)); }
      parts.sides = { obj: r, moods }; }
    // ---- altar: pale grey stone block with a recessed plinth, gold carved band, marble top; black pedestal; idol; lamps
    { const r = g(), aw = 1.05, ad = 0.5, ah = 0.72, ax = x1 - ad / 2 - 0.02;
      const greyStone = canvasMat(256, 256, (x, w, h) => { x.fillStyle = '#b9b4ab'; x.fillRect(0, 0, w, h); noise(x, 0, 0, w, h, 185, 1400); x.strokeStyle = 'rgba(110,104,96,0.5)'; x.lineWidth = 2; x.strokeRect(2, 2, w / 2 - 2, h - 4); x.strokeRect(w / 2, 2, w / 2 - 2, h - 4); }, { bumpScale: 2, roughness: 0.6, name: '__altar_grey_stone' });
      const goldBand = canvasMat(512, 64, (x, w, h) => { x.fillStyle = '#9c7a34'; x.fillRect(0, 0, w, h); x.strokeStyle = '#e8c878'; x.lineWidth = 4; for (let k = 0; k < w; k += 48) { x.beginPath(); for (let t = 0; t < 9; t += 0.25) { const rr = 18 * (1 - t / 10); const px = k + 24 + Math.cos(t) * rr, py = h / 2 + Math.sin(t) * rr; t ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); } x.fillStyle = '#e8c878'; x.fillRect(0, 0, w, 5); x.fillRect(0, h - 5, w, 5); }, { bumpScale: 5, roughness: 0.35, metalness: 0.7, name: '__altar_gold_band' });
      goldBand.map.repeat.set(2, 1); goldBand.bumpMap.repeat.set(2, 1);
      const blk = (w, h, d, m, px, py, pz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(d, h, w), m); b.position.set(px, py + h / 2, pz); r.add(b); return b; };
      blk(aw - 0.08, 0.08, ad - 0.06, greyStone, ax + 0.02, 0, zc);
      blk(aw, ah - 0.08 - 0.09 - 0.04, ad, greyStone, ax, 0.08, zc);
      blk(aw + 0.004, 0.09, ad + 0.004, goldBand, ax, ah - 0.13, zc);
      blk(aw + 0.04, 0.04, ad + 0.04, M('__altar_marble_top', 0xe6e1d8), ax - 0.01, ah - 0.04, zc);
      // black stone pedestal for the idol
      const ped = M('__black_pedestal', 0x111111); blk(0.36, 0.2, 0.26, ped, x1 - 0.17, ah, zc); blk(0.4, 0.025, 0.3, M('__altar_gold_trim', 0xc8a24e), x1 - 0.17, ah + 0.2, zc);
      const top = ah + 0.225;
      if (getModel('balaji2')) { const md = model('balaji2'), k = Math.min(1.05 / md.size.y, 0.8 / md.size.x);
        const fin = idol === 'sketchfab-brass' ? new THREE.MeshStandardMaterial({ color: 0xc9973f, metalness: 0.85, roughness: 0.3, name: '__idol_brass' }) : new THREE.MeshStandardMaterial({ color: 0x0f0f10, metalness: 0.1, roughness: 0.15, name: '__idol_black_gloss_model' });
        md.obj.traverse(o => { if (o.isMesh) o.material = fin; }); md.obj.scale.setScalar(k); md.obj.rotation.y = -Math.PI / 2; md.obj.position.set(x1 - 0.06, top, zc); r.add(md.obj); }
      // offerings + diyas on the altar top
      const flame = () => { const fm = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.03, 10), led(0xffb347, 4)); moods.strips.push(fm.material); return fm; };
      const diya = (px, pz) => { const d2 = g(); d2.add(cyl(0.035, 0.024, 0.02, BRASS, 0, 0.025, 0, 16)); d2.add(cyl(0.012, 0.022, 0.025, BRASS, 0, 0, 0, 12)); const f = flame(); f.position.set(0.02, 0.06, 0); d2.add(f); d2.position.set(px, ah, pz); return loose(d2); };
      for (const pz of [zc - 0.42, zc - 0.28, zc + 0.28, zc + 0.42]) r.add(diya(x1 - 0.42, pz));
      { const pl = cyl(0.09, 0.08, 0.015, BRASS, x1 - 0.42, ah, zc, 24); r.add(pl); for (let k = 0; k < 7; k++) { const fr = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 10), M(k % 2 ? '__fruit_orange' : '__fruit_red', k % 2 ? 0xe58a2b : 0xb7372a)); fr.position.set(x1 - 0.42 + Math.cos(k) * 0.04, ah + 0.04, zc + Math.sin(k) * 0.04); r.add(loose(fr)); } }
      for (const pz of [zc - 0.15, zc + 0.15]) { const bowl = cyl(0.045, 0.03, 0.025, BRASS, x1 - 0.42, ah, pz, 20); r.add(bowl); }
      // brass hanging lamps on chains either side of the idol
      for (const pz of [z0 + 0.12, z1 - 0.12]) { const hx = x1 - 0.32; r.add(cyl(0.003, 0.003, ceil - 1.25, BRASS, hx, 1.25, pz, 6));
        const bowl = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.05, 0.005], [0.07, 0.03], [0.072, 0.04]].map(([a, b]) => new THREE.Vector2(a, b)), 20), BRASS()); bowl.material.side = THREE.DoubleSide; bowl.position.set(hx, 1.18, pz); r.add(bowl);
        for (let k = 0; k < 5; k++) { const a = k * 1.2566, f = flame(); f.position.set(hx + Math.cos(a) * 0.055, 1.24, pz + Math.sin(a) * 0.055); r.add(f); } }
      parts.altar = { obj: r, moods }; }
    return parts;
  }

  /* ================= White faceted puja doors (same reference: the crumpled / faceted white 3D door with a brass lever).
     Same local frame as pujaDoors. */
  function facetedDoors({ W = 1.273, H = 2.1, ceil = 2.91 } = {}) {
    const root = g(), jamb = 0.045, gapC = 0.003, wl = (W - 2 * jamb - 3 * gapC) / 2, zf = -0.05, t = 0.04, WH = () => M('__white_lacquer', 0xeeeae2);
    root.add(box(jamb, H + 0.004, 0.12, WH, -W / 2 + jamb / 2, 0, -0.1, 0.003)); root.add(box(jamb, H + 0.004, 0.12, WH, W / 2 - jamb / 2, 0, -0.1, 0.003));
    root.add(box(W, ceil - H - 0.004, 0.12, WH, 0, H + 0.004, -0.1, 0.003));
    const facetMat = new THREE.MeshStandardMaterial({ color: 0xf1eee8, roughness: 0.55, flatShading: true, name: '__faceted_white' });
    const facets = (w, h, seed) => { const geo = new THREE.PlaneGeometry(w, h, Math.round(w / 0.045), Math.round(h / 0.045)); const p = geo.attributes.position; let sd = seed; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
      for (let i = 0; i < p.count; i++) { const ex = Math.abs(p.getX(i)) > w / 2 - 0.001 || Math.abs(p.getY(i)) > h / 2 - 0.001; p.setXYZ(i, p.getX(i) + (ex ? 0 : (rnd() - 0.5) * 0.02), p.getY(i) + (ex ? 0 : (rnd() - 0.5) * 0.02), ex ? 0 : rnd() * 0.014); }
      return geo.toNonIndexed(); };
    for (const sx of [1, -1]) {
      const L = g(), hx = -sx * (W / 2 - jamb - gapC), cx = sx * wl / 2;
      L.add(box(wl, H - 0.01, t - 0.012, WH, cx, 0.005, zf + 0.006));
      for (const [side, z] of [[1, zf + t - 0.006], [-1, zf + 0.006]]) { const f = new THREE.Mesh(facets(wl - 0.004, H - 0.014, sx > 0 ? 11 + side : 29 + side), facetMat); f.position.set(cx, H / 2, z); if (side < 0) f.rotation.y = Math.PI; L.add(f); }
      // brass lever handle on the meeting edge (both faces)
      for (const [fz, dir] of [[zf + t, 1], [zf, -1]]) { const ux = sx * (wl - 0.06);
        L.add(box(0.03, 0.16, 0.008, BRASS, ux, 0.95, fz + (dir > 0 ? 0.008 : -0.016), 0.003));
        const lv = cyl(0.008, 0.008, 0.12, BRASS, 0, 0, 0, 12); lv.rotation.z = Math.PI / 2; lv.position.set(ux - sx * 0.05, 1.05, fz + dir * 0.045); L.add(lv);
        const st = cyl(0.009, 0.009, 0.04, BRASS, 0, 0, 0, 12); st.rotation.x = Math.PI / 2; st.position.set(ux, 1.05, fz + dir * 0.025); L.add(st); }
      L.position.set(hx, 0, 0);
      tagGroup(L, { type: 'cab', hinge: [hx, 0, zf], a1: sx * Math.PI * 0.5, label: 'puja door', fitted: true });
      root.add(L);
    }
    return { obj: root, moods: { strips: [], halos: [] }, size: { w: W, h: ceil } };
  }

  /* ================= Drain-pipe enclosure (site condition, owner photo 2026-11-11) =================
     Charcoal powder-coated aluminium louvre box, floor to ceiling, against a wall. Local frame: back face centre on the
     floor, +x along the wall, +z = out of the wall. Louvres on the front face and on each free end (endLeft / endRight);
     an end without louvres butts a wall. Inside: the soil / rain-water pipes (seen dimly through the gaps). */
  function pipeEnclosure({ w = 3.1, d = 0.305, h = 3.0, slat = 0.058, gap = 0.032, endLeft = true, endRight = false } = {}) {
    const root = g(), C = () => M('__charcoal_louvre', 0x3a3d41), DARK = () => M('__enclosure_inside', 0x202224), PVC = () => M('__pvc_grey', 0x9c9fa2);
    const post = 0.04, base = 0.06, top = 0.05;
    root.add(box(w, base, d, () => M('__enclosure_kerb', 0x5a3a28), 0, 0, 0, 0.004));              // tiled kerb (as on site)
    root.add(box(w, top, d, C, 0, h - top, 0));                                                     // top channel
    root.add(box(post, h - base - top, post, C, -w / 2 + post / 2, base, d - post));                // front corner posts
    root.add(box(post, h - base - top, post, C, w / 2 - post / 2, base, d - post));
    if (endLeft) root.add(box(post, h - base - top, post, C, -w / 2 + post / 2, base, 0));
    if (endRight) root.add(box(post, h - base - top, post, C, w / 2 - post / 2, base, 0));
    // mid posts every ≈ 1.05 m on the long face
    const nMid = Math.max(0, Math.round(w / 1.05) - 1);
    for (let k = 1; k <= nMid; k++) root.add(box(0.03, h - base - top, 0.03, C, -w / 2 + w * k / (nMid + 1), base, d - 0.035));
    // louvres: tilted 20° so you can't see straight in, air still moves
    const pitch = slat + gap, n = Math.floor((h - base - top - 0.02) / pitch);
    for (let i = 0; i < n; i++) {
      const y = base + 0.02 + i * pitch;
      const f = box(w - 0.004, slat, 0.012, C, 0, 0, 0); f.position.set(0, y + slat / 2, d - 0.012); f.rotation.x = -0.35; root.add(f);
      // end blades: the tilted blade's outer corner stays inside the box line (no overhang into the ½-inch gap)
      for (const [on, sx] of [[endLeft, -1], [endRight, 1]]) if (on) { const e = box(0.012, slat, d - post, C, 0, 0, 0); e.rotation.z = -sx * 0.35; e.position.set(sx * (w / 2 - (0.006 * Math.cos(0.35) + slat / 2 * Math.sin(0.35))), y + slat / 2, (d - post) / 2); root.add(e); }
    }
    // inside: dark back so the louvres read like the photo, and the pipes behind them
    const bk = box(w - 0.02, h - base - top, 0.004, DARK, 0, base, 0.004); root.add(bk);
    for (const [px, r] of [[-w / 2 + 0.35, 0.056], [-w / 2 + 0.55, 0.04], [w / 2 - 0.45, 0.056]]) root.add(cyl(r, r, h - base - top, PVC, px, base, 0.03 + r, 16));
    return { obj: root, size: { w, d, h } };
  }

  /* ================= Low modular sofa with chaise (owner 2026-11-11: replica of the look of a Sketchfab preview the owner liked —
     the model itself is not downloadable; proportions follow IKEA SÖDERHAMN, which is sold in India) =================
     Local frame: back face centre on the floor, +z = front. Seat modules left → right, the chaise is the right-most module. */
  function modularSofa({ seats = 3, modW = 0.93, depth = 0.99, chaiseL = 1.51, chaise = 'right', fabric = 0xe9e4d2 } = {}) {
    const root = g(), FAB = () => M('__sofa_cream_weave', fabric), CHROME = () => M('__chrome_leg', 0xc8ccd0), arm = 0.1;
    const W = seats * modW + 2 * arm, x0 = -W / 2 + arm;
    const legs = (cx, w, d) => { for (const sx of [-1, 1]) for (const zz of [0.07, d - 0.07]) root.add(cyl(0.011, 0.009, 0.13, CHROME, cx + sx * (w / 2 - 0.07), 0, zz, 12)); };
    for (let i = 0; i < seats; i++) {
      const cx = x0 + modW * (i + 0.5), isCh = (chaise === 'right' && i === seats - 1) || (chaise === 'left' && i === 0), d = isCh ? chaiseL : depth;
      legs(cx, modW, d);
      root.add(box(modW - 0.006, 0.13, d, FAB, cx, 0.13, 0, 0.03));                                         // upholstered base
      root.add(box(modW - 0.02, 0.19, d - 0.13, FAB, cx, 0.26, 0.12, 0.08));   // deep seat cushion
      root.add(box(modW - 0.01, 0.56, 0.13, FAB, cx, 0.26, 0, 0.06));                                       // thin rounded back panel
    }
    // thin rounded arm panels at both ends (the chaise side runs its full length)
    const lD = chaise === 'left' ? chaiseL : depth, rD = chaise === 'right' ? chaiseL : depth;
    root.add(box(arm, 0.5, lD, FAB, -W / 2 + arm / 2, 0.13, 0, 0.045)); root.add(box(arm, 0.5, rD, FAB, W / 2 - arm / 2, 0.13, 0, 0.045));
    legs(-W / 2 + arm / 2, arm, lD); legs(W / 2 - arm / 2, arm, rD);
    // cushions: cream pair on the left, cream + two blues in the right corner (as in the preview)
    const pillow = (cx, z, c, s2, ry, rx = -0.25) => { const p = box(0.46 * s2, 0.46 * s2, 0.13, () => M('__cushion_' + c.toString(16), c), 0, 0, 0, 0.055); p.position.set(cx, 0.45 + 0.23 * s2, z); p.rotation.set(rx, ry, 0); root.add(loose(p)); };
    pillow(x0 + 0.3, 0.2, 0xe6e2d4, 1, 0.15); pillow(x0 + 0.42, 0.28, 0xece8dc, 0.85, 0.05, -0.15);
    pillow(W / 2 - arm - 0.28, 0.2, 0x8a98e6, 1.05, -0.2); pillow(W / 2 - arm - 0.42, 0.26, 0xd8d0b6, 0.9, -0.1, -0.15); pillow(W / 2 - arm - 0.22, 0.34, 0x2f4cc0, 0.85, -0.35, -0.1);
    // blue-and-white geometric throw draped from the back top over the second seat to the front
    const tW = 1.25, path = [[0.06, 0.84], [0.14, 0.86], [0.2, 0.62], [0.32, 0.47], [0.6, 0.465], [0.9, 0.46], [0.995, 0.4], [1.005, 0.22]], segs = path.length - 1;
    const geo = new THREE.BufferGeometry(), pos = [], uv = [], idx = [], nx = 16; let acc = 0; const lens = [0]; for (let k = 1; k < path.length; k++) { acc += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]); lens.push(acc); }
    for (let k = 0; k <= segs; k++) for (let j = 0; j <= nx; j++) { const u = j / nx, xx = -tW / 2 + u * tW, wob = 0.012 * Math.sin(u * 9 + k); pos.push(xx, path[k][1] + 0.012 + wob * (k > 1 ? 1 : 0), path[k][0]); uv.push(u, 1 - lens[k] / acc); }
    for (let k = 0; k < segs; k++) for (let j = 0; j < nx; j++) { const a = k * (nx + 1) + j; idx.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2); }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const tex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#f4f3ef'; x.fillRect(0, 0, w, h); x.fillStyle = '#0f2f8f'; const c2 = 128;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const cx = c * c2, cy = r * c2, k = (r * 3 + c * 5) % 4; x.beginPath(); if (k === 0) { x.arc(cx + c2 / 2, cy + c2, c2 / 2, Math.PI, 0); } else if (k === 1) { x.arc(cx, cy + c2 / 2, c2 / 2, -Math.PI / 2, Math.PI / 2); } else if (k === 2) { x.arc(cx + c2 / 2, cy, c2 / 2, 0, Math.PI); } else { x.ellipse(cx + c2 / 2, cy + c2 / 2, c2 / 2, c2 / 3, 0, 0, 7); } x.fill(); } });
    const throwM = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide, name: '__throw_blue_geometric' })); throwM.position.x = x0 + modW * 1.15; root.add(loose(throwM));
    return { obj: root, size: { w: W, d: chaiseL } };
  }
  /* ================= Master toilet restyles (owner references 2026-11-10, references/master-toilet/) =================
     Owner rule: the commode, wash basin and shower area keep the ORIGINAL placements. World coordinates (each part is added
     at the origin, ry 0, as its own group → thin footprints): room x 3.818–6.785, z 3.242–5.067; shower x 3.818–4.79 full depth;
     basin x 4.89–5.61 on the south wall; WC centred x 6.18 on the south wall facing north; door on the north wall x 4.97–5.77. */
  /* Owner models for the master-toilet vanity (2026-11-11): 'sink_cabinet_a' (cirno, CC BY 4.0; 0.874 W × 0.512 D, basin rim
     0.858 above the floor finish, 2 drawers = slide movers, fitted) on the original basin centre and 'mirror_faceted_round'
     (ocelotlmx, CC BY 4.0; Ø 0.80, real size) centred over the basin, bottom 0.15 m above the tap top = 0.30 m above the rim (1.15 → 1.95 m
     above the finish). World coordinates; the cabinet's back and the mirror's back stand at zw (just in front of the south wall
     face), both face north (ry π). vx = basin centre, fy = floor-finish height. null when the models are not loaded. */
  function bathVanityModels({ vx = 5.25, zw = 5.055, fy = 0.066 } = {}) {
    const sk = model('sink_cabinet_a'), mr = model('mirror_faceted_round'); if (!sk || !mr) return null;
    const sink = sk.obj, mirror = mr.obj;
    sink.traverse(o => { if (!o.isMesh) return; const mt = o.material = o.material.clone();
      // the file's top uses metalness 0.83 (Sketchfab export) → reads as grey metal; a resin / ceramic top is not metallic
      if (/Contertop/i.test(mt.name)) { mt.metalnessMap = null; mt.metalness = 0; mt.roughnessMap = null; mt.roughness = 0.22; } });
    for (const [n, lab] of [['drawer_top', 'vanity top drawer'], ['drawer_bottom', 'vanity bottom drawer']]) { const d = sink.getObjectByName(n); if (d) tagGroup(d, { type: 'slide', slide: [0, 0, -0.32], label: lab, fitted: true }); }
    sink.rotation.y = Math.PI; sink.position.set(vx, fy, zw);
    const top = fy + sk.size.y;      // tap top
    mirror.traverse(o => { if (o.isMesh && /espejo|glass/i.test(o.material.name + ' ' + o.name)) o.material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.02, name: '__mirror_reflective' }); });
    mirror.rotation.y = Math.PI; mirror.position.set(vx, top + 0.15, zw);
    return { sink, mirror, rim: fy + 0.858, mirrorY: [top + 0.15, top + 0.15 + mr.size.y] };
  }
  function masterBath({ style = 'pebble', ceiling = 3.05 } = {}) {
    const X0 = 3.818, X1 = 6.785, Z0 = 3.242, Z1 = 5.067, SX = 4.79, parts = {}, moods = { strips: [], halos: [] };
    const PEB = style === 'pebble', TEAL = style === 'teal', STONE = style === 'stone', CHAR = style === 'charcoal', GSL = style === 'grey-slats';
    const rep = (draw, W2, H2, tw, th, px = 256, py = 256, opts = {}) => { const t = canvasTex(px, py, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W2 / tw, H2 / th); return new THREE.MeshStandardMaterial({ map: t, roughness: opts.r ?? 0.6, metalness: opts.m ?? 0, name: opts.name || '__bath_tile' }); };
    const porcelain = (W2, H2) => rep((x, w, h) => { x.fillStyle = CHAR ? '#47474a' : GSL ? '#6c6c6e' : '#8c857c'; x.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { x.fillStyle = CHAR ? `rgba(${50 + Math.random() * 40},${50 + Math.random() * 40},${52 + Math.random() * 40},0.15)` : GSL ? (v9 => `rgba(${v9},${v9},${v9 + 2},0.12)`)(95 + Math.random() * 45) : `rgba(${110 + Math.random() * 60},${105 + Math.random() * 55},${95 + Math.random() * 50},0.12)`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 14, 0, 7); x.fill(); } x.strokeStyle = CHAR ? '#2f2f31' : '#6f6962'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2); }, W2, H2, 1.2, 0.6, 512, 256, { r: 0.45, name: '__porcelain_grey_large' });
    const pebble = (W2, H2) => rep((x, w, h) => { x.fillStyle = '#4a443d'; x.fillRect(0, 0, w, h); for (let r = 0; r < 14; r++) for (let c = 0; c < 14; c++) { const cx = c * 37 + (r % 2) * 18 + Math.random() * 8, cy = r * 37 + Math.random() * 8, rw = 14 + Math.random() * 6, rh = 11 + Math.random() * 5; const v = 150 + Math.random() * 60;
      const gr = x.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, rw); gr.addColorStop(0, `rgb(${v + 30},${v + 22},${v})`); gr.addColorStop(1, `rgb(${v - 40},${v - 45},${v - 55})`); x.fillStyle = gr; x.beginPath(); x.ellipse(cx, cy, rw, rh, Math.random(), 0, 7); x.fill(); } }, W2, H2, 0.5, 0.5, 512, 512, { r: 0.75, name: '__pebble_mosaic' });
    const ledgestone = (W2, H2) => rep((x, w, h) => { x.fillStyle = '#5e564c'; x.fillRect(0, 0, w, h); let y = 0; while (y < h) { const rh = 18 + Math.random() * 26; let xx = -Math.random() * 40; while (xx < w) { const rw = 40 + Math.random() * 90, v = 160 + Math.random() * 55;
      const gr = x.createLinearGradient(0, y, 0, y + rh); gr.addColorStop(0, `rgb(${v + 25},${v + 15},${v - 5})`); gr.addColorStop(1, `rgb(${v - 30},${v - 38},${v - 50})`); x.fillStyle = gr; x.beginPath(); x.roundRect(xx + 2, y + 2, rw - 4, rh - 4, 6); x.fill(); xx += rw; } y += rh; } }, W2, H2, 0.8, 0.8, 512, 512, { r: 0.85, name: '__ledgestone_natural' });
    const herring = (W2, H2) => rep((x, w, h) => { x.fillStyle = '#1f4a46'; x.fillRect(0, 0, w, h); const L = 64, T = 16; x.strokeStyle = '#163834'; x.lineWidth = 2;
      for (let r = -4; r < 12; r++) for (let c = -4; c < 12; c++) { const ox = c * 2 * T + r * 0, oy = r * 2 * T + c * 2 * T; for (const flip of [0, 1]) { x.save(); x.translate(ox + flip * T, oy); x.rotate(flip ? -Math.PI / 4 : Math.PI / 4); const v = 30 + Math.random() * 20; x.fillStyle = `rgb(${v},${v + 45},${v + 40})`; x.fillRect(0, 0, L, T); x.strokeRect(0, 0, L, T); x.restore(); } } }, W2, H2, 0.5, 0.5, 256, 256, { r: 0.12, m: 0.05, name: '__teal_herringbone_glossy' });
    const brick = (W2, H2) => rep((x, w, h) => { x.fillStyle = '#5a5a5c'; x.fillRect(0, 0, w, h); const bh = 32, bw = 96; for (let r = 0; r < h / bh; r++) for (let c = -1; c < w / bw + 1; c++) { const v = 120 + Math.random() * 45; x.fillStyle = `rgb(${v},${v},${v + 3})`; x.beginPath(); x.roundRect(c * bw + (r % 2) * bw / 2 + 3, r * bh + 3, bw - 6, bh - 6, 4); x.fill();
      for (let k = 0; k < 6; k++) { x.fillStyle = `rgba(230,230,232,${Math.random() * 0.25})`; x.fillRect(c * bw + (r % 2) * bw / 2 + 6 + Math.random() * 70, r * bh + 6 + Math.random() * 16, 10 + Math.random() * 20, 3); } } }, W2, H2, 0.8, 0.5, 512, 256, { r: 0.85, name: '__whitewashed_brick_grey' });
    const white = () => M('__bath_white_plaster', 0xeeeae3), warmPlaster = () => M('__bath_warm_plaster', 0xe6dccb);
    const FX = TEAL ? BRASS : () => M('__fixture_black_matte', 0x161616);
    // wall skin planes (rotation so they face into the room); feature finish inside the shower alcove
    const skin = (name, x0, x1, y0, y1, wall, matFn) => { const w2 = wall === 'n' || wall === 's' ? x1 - x0 : x1 - x0, h2 = y1 - y0, m = new THREE.Mesh(new THREE.PlaneGeometry(w2, h2), matFn(w2, h2)), o = 0.006;
      if (wall === 'n') m.position.set((x0 + x1) / 2, (y0 + y1) / 2, Z0 + o); else if (wall === 's') { m.rotation.y = Math.PI; m.position.set((x0 + x1) / 2, (y0 + y1) / 2, Z1 - o); }
      else if (wall === 'w') { m.rotation.y = Math.PI / 2; m.position.set(X0 + o, (y0 + y1) / 2, (x0 + x1) / 2); } else { m.rotation.y = -Math.PI / 2; m.position.set(X1 - o, (y0 + y1) / 2, (x0 + x1) / 2); }
      const g2 = g(); g2.add(m); (parts[name] = parts[name] || { obj: g(), moods: { strips: [], halos: [] } }).obj.add(g2); };
    const plainWall = (w2, h2) => (PEB || CHAR || GSL) ? porcelain(w2, h2) : (TEAL ? white() : warmPlaster());
    const feature = (w2, h2) => (PEB || CHAR || GSL) ? porcelain(w2, h2) : TEAL ? herring(w2, h2) : ledgestone(w2, h2);
    // west wall (shower back wall): pebble above a ledge for 'pebble'; teal / stone full height otherwise
    if (PEB) { skin('wall-west', Z0, Z1, 0, 1.02, 'w', porcelain); skin('wall-west', Z0, Z1, 1.02, ceiling, 'w', pebble); }
    else skin('wall-west', Z0, Z1, 0, ceiling, 'w', feature);
    // north wall (door wall): shower part feature, door opening x 4.97–5.77 below 2.1 left open
    skin('wall-north', X0, SX, 0, ceiling, 'n', feature); skin('wall-north', SX, 4.97, 0, ceiling, 'n', plainWall); skin('wall-north', 4.97, 5.77, 2.1, ceiling, 'n', plainWall); skin('wall-north', 5.77, X1, 0, ceiling, 'n', plainWall);
    // south wall: shower part feature; ventilator window x 6.08–6.78, y 1.85–2.4 left open
    skin('wall-south', X0, SX, 0, ceiling, 's', feature);
    if (CHAR) { skin('wall-south', SX, 5.8, 0, ceiling, 's', brick); skin('wall-south', 5.8, 6.08, 0, ceiling, 's', plainWall); } else skin('wall-south', SX, 6.08, 0, ceiling, 's', plainWall); skin('wall-south', 6.08, X1, 0, 1.85, 's', plainWall); skin('wall-south', 6.08, X1, 2.4, ceiling, 's', plainWall);
    skin('wall-east', Z0, Z1, 0, ceiling, 'e', plainWall);
    // floors: shower floor (tray / tiles / mosaic) + room floor tiles
    const fl = g(); const showerTop = TEAL ? 0.1 : 0.075;
    const sf = new THREE.Mesh(new THREE.BoxGeometry(SX - X0 - 0.012, showerTop - 0.06, Z1 - Z0 - 0.012), TEAL ? M('__shower_tray_white', 0xf4f2ee) : STONE ? rep((x, w, h) => { x.fillStyle = '#b8a888'; x.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) { const v = 175 + Math.random() * 40; x.fillStyle = `rgb(${v},${v - 12},${v - 35})`; x.fillRect(c * 16 + 1, r * 16 + 1, 14, 14); } }, SX - X0, Z1 - Z0, 0.3, 0.3, 256, 256, { r: 0.7, name: '__mosaic_beige' }) : porcelain(SX - X0, Z1 - Z0));
    sf.position.set((X0 + SX) / 2, (0.06 + showerTop) / 2, (Z0 + Z1) / 2); fl.add(sf);
    fl.add(box(0.7, 0.004, 0.06, () => M('__linear_drain', 0x2a2a2a), (X0 + SX) / 2, showerTop, Z1 - 0.15));
    if (CHAR) { const TK = () => M('__teak_deck', 0xa8743e); for (let x = X0 + 0.04; x < SX - 0.03; x += 0.055) fl.add(box(0.04, 0.022, Z1 - Z0 - 0.08, TK, x, showerTop, Z0 + 0.04, 0.004)); for (const zz of [Z0 + 0.06, (Z0 + Z1) / 2, Z1 - 0.1]) fl.add(box(SX - X0 - 0.06, 0.012, 0.04, TK, (X0 + SX) / 2, showerTop - 0.006, zz)); }
    const rf = new THREE.Mesh(new THREE.BoxGeometry(X1 - SX - 0.012, 0.006, Z1 - Z0 - 0.012), STONE ? rep((x, w, h) => { x.fillStyle = '#d9cdb8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#bfb29c'; x.lineWidth = 3; x.strokeRect(1, 1, w - 2, h - 2); }, X1 - SX, Z1 - Z0, 0.6, 0.6, 256, 256, { r: 0.5, name: '__floor_travertine' }) : TEAL ? M('__floor_ivory_stone', 0xece6dc) : porcelain(X1 - SX, Z1 - Z0));
    rf.position.set((SX + X1) / 2, 0.063, (Z0 + Z1) / 2); fl.add(rf);
    parts['floor'] = { obj: fl, moods: { strips: [] } };
    // shower: glass screen (x = SX, z 4.0 → wall) with frame, rain shower + mixer + hand shower on the west wall, niche, wash light
    const sh = g(), shM = { strips: [], halos: [] };
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(Z1 - 4.0 - 0.01, 2.0, 1, 6), new THREE.MeshPhysicalMaterial({ color: 0xe8eef0, transparent: true, opacity: 0.16, roughness: 0.04, side: THREE.DoubleSide, depthWrite: false, name: '__shower_glass' }));
    glass.rotation.y = Math.PI / 2; glass.position.set(SX, showerTop + 1.0, (4.0 + Z1) / 2); sh.add(glass);
    for (const [zz, w3] of [[4.0, 0.02], [Z1 - 0.012, 0.012]]) sh.add(box(0.02, 2.0, w3, FX, SX, showerTop, zz - w3 / 2));
    sh.add(box(0.02, 0.02, Z1 - 4.0, FX, SX, showerTop + 2.0, 4.0)); sh.add(box(0.02, 0.02, Z1 - 4.0, FX, SX, showerTop, 4.0));
    if (!TEAL) sh.add(box(SX - X0, 0.02, 0.02, FX, (X0 + SX) / 2, showerTop + 2.0, 4.0 - 0.01));                       // black ceiling-side stabiliser bar
    const armZ = 4.55; const arm = cyl(0.012, 0.012, 0.42, FX, 0, 0, 0, 10); arm.rotation.z = Math.PI / 2; arm.position.set(X0 + 0.21, 2.2, armZ); sh.add(arm);
    sh.add(cyl(0.012, 0.012, 0.12, FX, X0 + 0.42, 2.08, armZ, 10)); if (CHAR) sh.add(box(0.25, 0.012, 0.25, FX, X0 + 0.42, 2.07, armZ - 0.125, 0.004)); else sh.add(cyl(0.13, 0.13, 0.012, FX, X0 + 0.42, 2.07, armZ, 32));
    sh.add(box(0.012, 0.16, 0.16, FX, X0 + 0.012, 1.05, 4.2, 0.004)); for (const dz of [-0.04, 0.04]) { const k = cyl(0.018, 0.018, 0.05, FX, 0, 0, 0, 14); k.rotation.z = Math.PI / 2; k.position.set(X0 + 0.045, 1.13, 4.2 + dz); sh.add(k); }
    const hb = cyl(0.008, 0.008, 0.8, FX, X0 + 0.03, 0.75, 4.05, 8); sh.add(hb); const hs2 = cyl(0.016, 0.022, 0.24, FX, X0 + 0.06, 1.2, 4.05, 12); hs2.rotation.z = 0.15; sh.add(hs2);
    const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(X0 + 0.05, 0.85, 4.12), new THREE.Vector3(X0 + 0.1, 0.55, 4.1), new THREE.Vector3(X0 + 0.06, 1.2, 4.05)]), 24, 0.006, 6, false), FX()); sh.add(hose);
    // niche: pebble = full-width ledge; teal = brass-trimmed niche; stone = wood-lined niche — shallow frame on the wall + bottles
    const LIT = CHAR || GSL, nz0 = (PEB || LIT) ? Z0 + 0.15 : 4.35, nz1 = (PEB || LIT) ? Z1 - 0.15 : 4.95, ny0 = PEB ? 1.02 : 1.15, ny1 = PEB ? 1.5 : LIT ? 1.42 : 1.45;
    sh.add(box(0.05, 0.03, nz1 - nz0, PEB ? () => M('__ledge_stone', 0x9a9187) : (STONE || LIT) ? OAK : BRASS, X0 + 0.025, ny0 - 0.03, nz0));
    if (LIT) { const back = new THREE.Mesh(new THREE.PlaneGeometry(nz1 - nz0, ny1 - ny0), M('__niche_charcoal', 0x2a2a2c)); back.rotation.y = Math.PI / 2; back.position.set(X0 + 0.008, (ny0 + ny1) / 2, (nz0 + nz1) / 2); sh.add(back); const nl = led(0xffc27a, 2.6); shM.strips.push(nl); sh.add(box(0.01, 0.006, nz1 - nz0 - 0.04, nl, X0 + 0.03, ny1 - 0.01, nz0 + 0.02)); }
    if (!PEB && !LIT) { const back = new THREE.Mesh(new THREE.PlaneGeometry(nz1 - nz0, ny1 - ny0), STONE ? OAK() : M('__niche_dark_teal', 0x163834)); back.rotation.y = Math.PI / 2; back.position.set(X0 + 0.008, (ny0 + ny1) / 2, (nz0 + nz1) / 2); sh.add(back);
      for (const [a, b2, c] of [[ny1, 0.02, 1], [ny0, 0.02, 1]]) sh.add(box(0.05, b2, nz1 - nz0, STONE ? OAK : BRASS, X0 + 0.025, a - (c ? 0.01 : 0), nz0)); for (const zz of [nz0, nz1]) sh.add(box(0.05, ny1 - ny0, 0.02, STONE ? OAK : BRASS, X0 + 0.025, ny0, zz - 0.01)); }
    for (let k = 0; k < 4; k++) sh.add(loose(cyl(0.022, 0.025, 0.14 + (k % 2) * 0.03, () => M('__bottle_' + k, [0x2a2a2a, 0xc98a3a, 0xefefef, 0x3a2a1f][k]), X0 + 0.03, ny0, nz0 + 0.12 + k * 0.08, 12)));
    const ww = ledStrip({ w: Z1 - Z0 - 0.1, wash: 1.4, dir: 'down', alpha: PEB || STONE ? 0.5 : 0.3, colour: 0xffd9a0 }); ww.obj.rotation.y = Math.PI / 2; ww.obj.position.set(X0 + 0.02, ceiling - 0.04, (Z0 + Z1) / 2); sh.add(ww.obj); shM.strips.push(...ww.moods.strips); shM.halos.push(...ww.moods.halos);
    parts['shower'] = { obj: sh, moods: shM };
    // vanity on the original basin spot (x 4.89–5.61, south wall), mirror + light above
    const vx = 5.25, vW = 0.72, vD = 0.48, vz = Z1 - vD, va = g(), vaM = { strips: [] };
    // owner models (2026-11-11): sink cabinet + round mirror replace every style's own vanity and mirror (bathVanityModels)
    const VM = bathVanityModels({ vx, zw: Z1 - 0.012, fy: 0.066 });
    if (VM) { va.add(VM.sink); va.add(VM.mirror); }
    else if (GSL) {    // two floating oak shelves: basin shelf + towel shelf, wall-mounted black taps
      va.add(box(vW + 0.1, 0.05, vD, OAK, vx, 0.8, vz, 0.005)); va.add(box(vW + 0.1, 0.05, vD, OAK, vx, 0.33, vz, 0.005));
      const ob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 12), M('__basin_white', 0xf6f5f2)); ob.scale.set(1.35, 0.32, 0.9); ob.position.set(vx, 0.88, vz + 0.24); va.add(ob);
      for (const dx of [-0.09, 0, 0.09]) { const tp = cyl(0.012, 0.012, dx ? 0.05 : 0.16, FX, 0, 0, 0, 10); tp.rotation.x = Math.PI / 2; tp.position.set(vx + dx, 1.1, Z1 - (dx ? 0.03 : 0.08)); va.add(tp); }
      for (let k = 0; k < 2; k++) va.add(loose(box(0.3, 0.07, 0.25, () => M('__towel_white', 0xeeeae2), vx - 0.15, 0.38 + k * 0.07, vz + 0.1, 0.03)));
      va.add(loose(box(0.2, 0.02, 0.14, () => M('__tray_wood', 0x8a6a4a), vx + 0.18, 0.38, vz + 0.15))); va.add(loose(cyl(0.05, 0.05, 0.1, () => M('__jar_wood', 0x9c7a4e), vx + 0.32, 0.38, vz + 0.12, 16)));
      for (const [dx, h4] of [[-0.38, 0.12], [0.36, 0.08]]) va.add(loose(cyl(0.025, 0.03, h4, () => M('__bottle_ceramic', 0xd9cdb9), vx + dx, 0.85, vz + 0.2, 12))); }
    else if (CHAR) {   // oak vanity: two drawers over an open shelf with wicker baskets, dark top, round vessel, black deck tap
      va.add(box(vW, 0.2, vD - 0.02, OAK, vx, 0.62, vz + 0.02, 0.004)); for (const sx of [-1, 1]) va.add(box(vW / 2 - 0.006, 0.18, 0.02, OAK, vx + sx * vW / 4, 0.63, Z1 - 0.02, 0.003)); va.add(box(vW, 0.02, vD - 0.04, OAK, vx, 0.3, vz + 0.02)); for (const sx of [-1, 1]) va.add(box(0.02, 0.34, vD - 0.02, OAK, vx + sx * (vW / 2 - 0.01), 0.3, vz + 0.02));
      for (const sx of [-1, 1]) va.add(loose(box(0.28, 0.2, 0.3, () => M('__wicker_basket', 0x9c7a4e), vx + sx * 0.17, 0.32, vz + 0.1, 0.02)));
      va.add(box(vW + 0.02, 0.03, vD, () => M('__dark_stone_top', 0x2e2b28), vx, 0.82, vz, 0.003)); va.add(cyl(0.19, 0.16, 0.12, () => M('__basin_white', 0xf6f5f2), vx, 0.85, vz + 0.26, 40));
      va.add(cyl(0.012, 0.012, 0.24, FX, vx + 0.22, 0.85, Z1 - 0.07, 10)); const sp2 = cyl(0.01, 0.01, 0.12, FX, 0, 0, 0, 8); sp2.rotation.x = Math.PI / 2; sp2.position.set(vx + 0.22, 1.08, Z1 - 0.12); va.add(sp2); }
    else if (PEB) { va.add(box(vW, 0.36, vD - 0.02, () => M('__zebrano_walnut', 0x8a6a4a), vx, 0.46, vz + 0.02, 0.004)); va.add(box(vW, 0.035, vD, () => M('__dark_stone_top', 0x2e2b28), vx, 0.82, vz, 0.003));
      va.add(box(0.5, 0.13, 0.36, () => M('__basin_white', 0xf6f5f2), vx, 0.855, vz + 0.06, 0.025)); va.add(box(0.44, 0.005, 0.3, () => M('__basin_inner', 0xe8e6e2), vx, 0.98, vz + 0.09)); va.add(cyl(0.012, 0.012, 0.22, FX, vx + 0.2, 0.855, Z1 - 0.06, 10)); }
    else if (TEAL) { va.add(box(vW + 0.08, 0.045, vD - 0.06, OAK, vx, 0.8, vz + 0.06, 0.006)); const b3 = cyl(0.2, 0.17, 0.13, () => M('__basin_white', 0xf6f5f2), vx, 0.845, vz + 0.27, 40); va.add(b3);
      const sp = cyl(0.012, 0.012, 0.16, BRASS, 0, 0, 0, 10); sp.rotation.x = Math.PI / 2; sp.position.set(vx, 1.08, Z1 - 0.08); va.add(sp); va.add(cyl(0.012, 0.012, 0.04, BRASS, vx, 1.03, Z1 - 0.16, 10));
      va.add(cyl(0.02, 0.02, 0.28, BRASS, vx, 0.52, vz + 0.27, 12)); const tr = cyl(0.018, 0.018, 0.2, BRASS, 0, 0, 0, 12); tr.rotation.x = Math.PI / 2; tr.position.set(vx, 0.52, vz + 0.17); va.add(tr);
      for (const sx of [-1, 1]) { const br = cyl(0.008, 0.008, 0.3, BRASS, 0, 0, 0, 8); br.rotation.x = Math.PI / 2; br.position.set(vx + sx * 0.32, 0.7, vz + 0.2); va.add(br); } }
    else { va.add(box(vW + 0.08, 0.05, vD, OAK, vx, 0.82, vz, 0.005)); va.add(box(vW + 0.08, 0.2, 0.025, OAK, vx, 0.62, Z1 - 0.025 - vD + 0.02)); for (const sx of [-1, 1]) va.add(box(0.04, 0.82, vD, OAK, vx + sx * (vW / 2 + 0.02), 0, vz));
      va.add(box(vW, 0.035, vD - 0.04, OAK, vx, 0.12, vz + 0.02)); for (let k = 0; k < 3; k++) va.add(loose(box(0.2, 0.07, 0.3, () => M('__towel_white', 0xeeeae2), vx - 0.22 + k * 0.22, 0.155, vz + 0.1, 0.03)));
      const ob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 12), M('__basin_white', 0xf6f5f2)); ob.scale.set(1.4, 0.3, 0.9); ob.position.set(vx, 0.9, vz + 0.26); va.add(ob);
      for (const dx of [-0.08, 0, 0.08]) { const tp = cyl(0.012, 0.012, 0.12, FX, 0, 0, 0, 10); tp.rotation.x = Math.PI / 2; tp.position.set(vx + dx, 1.1, Z1 - 0.06); va.add(tp); } }
    const plant = g(); plant.add(cyl(0.06, 0.05, 0.12, () => M('__pot_stone', 0xb8a890), 0, 0, 0, 16)); for (let k = 0; k < 10; k++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), M('__leaf_green', 0x5f7d3e)); lf.scale.set(0.5, 1.8, 0.3); lf.rotation.set(0.4 * Math.cos(k), k, 0.4 * Math.sin(k)); lf.position.set(Math.cos(k) * 0.03, 0.18, Math.sin(k) * 0.03); plant.add(lf); }
    plant.position.set(vx + 0.3, TEAL ? 0.845 : PEB ? 0.855 : 0.87, vz + 0.1); if (!CHAR && !GSL && !VM) va.add(loose(plant));
    // mirror + light
    if (GSL) {    // capsule mirror (thin bronze frame) between two Edison-bulb pendants, warm wash on the wall
      if (!VM) { const mw = 0.42, mh = 0.75, ms = new THREE.Shape(); rrShape(mw, mh, mw / 2, 0, 0, ms); const ih = new THREE.Path(); rrShape(mw - 0.02, mh - 0.02, mw / 2 - 0.01, 0, 0, ih); ms.holes.push(ih);
        const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(ms, { depth: 0.015, bevelEnabled: false, curveSegments: 24 }), M('__frame_bronze_thin', 0x8a6a3a)); fr.rotation.y = Math.PI; fr.position.set(vx, 1.55, Z1 - 0.005); va.add(fr);
        const mg = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(ih.getPoints(40))), M('__mirror_glass', 0x9aa4a8)); mg.rotation.y = Math.PI; mg.position.set(vx, 1.55, Z1 - 0.01); va.add(mg); }
      for (const dx of VM ? [0.52] : [-0.4, 0.4]) { const pd = g(); pd.add(cyl(0.003, 0.003, ceiling - 1.75, FX, 0, 1.75, 0, 6)); pd.add(cyl(0.015, 0.015, 0.04, FX, 0, 1.72, 0, 10)); const pb = led(0xffb860, 2.6); vaM.strips.push(pb); const glb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false, name: '__edison_glass' })); glb.scale.y = 1.3; glb.position.y = 1.64; pd.add(glb); const fil = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), pb); fil.position.y = 1.64; pd.add(fil); pd.position.set(vx + dx, 0, Z1 - 0.2); va.add(loose(pd)); }
      const cw3 = ledStrip({ w: 1.0, wash: 1.1, dir: 'down', alpha: 0.35, colour: 0xffd9a0 }); cw3.obj.rotation.y = Math.PI; cw3.obj.position.set(vx, ceiling - 0.04, Z1 - 0.02); va.add(cw3.obj); vaM.strips.push(...cw3.moods.strips); (vaM.halos = vaM.halos || []).push(...cw3.moods.halos); }
    else if (CHAR) {   // round backlit mirror (LED halo) + slim black pendant with an Edison bulb, ceiling wash on the brick
      if (!VM) { const mr = 0.33, my = 1.55, halo = led(0xffd9a0, 2.6); vaM.strips.push(halo); const ring = new THREE.Mesh(new THREE.TorusGeometry(mr + 0.005, 0.012, 10, 64), halo); ring.position.set(vx, my, Z1 - 0.02); va.add(ring);
      const hm = new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (x, w, h) => { const gr = x.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }), color: 0xffd9a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, name: '__mirror_halo_glow' });
      (vaM.halos = vaM.halos || []).push(hm); const hp = new THREE.Mesh(new THREE.PlaneGeometry(mr * 2.9, mr * 2.9), hm); hp.rotation.y = Math.PI; hp.position.set(vx, my, Z1 - 0.008); va.add(hp);
      const mg = new THREE.Mesh(new THREE.CircleGeometry(mr, 48), M('__mirror_glass', 0x9aa4a8)); mg.rotation.y = Math.PI; mg.position.set(vx, my, Z1 - 0.03); va.add(mg); va.add(cyl(mr - 0.01, mr - 0.01, 0.02, () => M('__mirror_back', 0x1a1a1a), 0, 0, 0, 32)); va.children[va.children.length - 1].rotation.x = Math.PI / 2; va.children[va.children.length - 1].position.set(vx, my, Z1 - 0.018); }
      const pd = g(); pd.add(cyl(0.003, 0.003, ceiling - 1.75, FX, 0, 1.75, 0, 6)); const pb = led(0xffb860, 2.8); vaM.strips.push(pb); pd.add(cyl(0.02, 0.02, 0.1, FX, 0, 1.65, 0, 12)); const bb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), pb); bb.scale.y = 1.6; bb.position.y = 1.6; pd.add(bb); pd.position.set(vx + (VM ? 0.52 : -0.48), 0, Z1 - 0.18); va.add(loose(pd));
      const cw2 = ledStrip({ w: 1.0, wash: 1.2, dir: 'down', alpha: 0.45, colour: 0xffd9a0 }); cw2.obj.rotation.y = Math.PI; cw2.obj.position.set((SX + 5.8) / 2, ceiling - 0.04, Z1 - 0.02); va.add(cw2.obj); vaM.strips.push(...cw2.moods.strips); (vaM.halos = vaM.halos || []).push(...cw2.moods.halos);
      if (!VM) for (const [dx, c] of [[-0.3, 0x5f7d3e], [0.3, 0x7d9a52]]) { const pp = g(); pp.add(cyl(0.05, 0.04, 0.1, () => M('__pot_white', 0xf2eee8), 0, 0, 0, 14)); for (let k = 0; k < 12; k++) { const lf = cyl(0.003, 0.003, 0.22, () => M('__leaf_' + c.toString(16), c), 0, 0, 0, 4); lf.rotation.set(0.5 * Math.cos(k), 0, 0.5 * Math.sin(k)); lf.position.set(0, 0.1, 0); pp.add(lf); } pp.position.set(vx + dx, 0.85, vz + 0.12); va.add(loose(pp)); } }
    else if (TEAL) { if (!VM) { const mw = 0.5, mh = 0.8, ms = new THREE.Shape(); rrShape(mw, mh, 0.14, 0, 0, ms); const ih = new THREE.Path(); rrShape(mw - 0.04, mh - 0.04, 0.12, 0, 0, ih); ms.holes.push(ih);
        const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(ms, { depth: 0.02, bevelEnabled: false, curveSegments: 16 }), BRASS()); fr.rotation.y = Math.PI; fr.position.set(vx, 1.6, Z1 - 0.005); va.add(fr);
        const mg = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(ih.getPoints(30))), M('__mirror_glass', 0x9aa4a8)); mg.rotation.y = Math.PI; mg.position.set(vx, 1.6, Z1 - 0.012); va.add(mg); }
      const blx = vx + (VM ? 0.48 : -0.33), bar = led(0xffe2b8, 2.4); vaM.strips.push(bar); for (const dy of [-0.14, 0.14]) va.add(cyl(0.018, 0.018, 0.22, bar, blx, 1.6 + dy - 0.11, Z1 - 0.07, 12)); va.add(box(0.03, 0.4, 0.04, BRASS, blx, 1.4, Z1 - 0.045)); }
    else { const mw = PEB ? 0.6 : 0.78, mh = PEB ? 0.8 : 0.85; if (!VM) { va.add(box(mw + 0.04, mh + 0.04, 0.025, PEB ? () => M('__frame_black_slim', 0x151515) : OAK, vx, 1.15, Z1 - 0.025)); const mg = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), M('__mirror_glass', 0x9aa4a8)); mg.rotation.y = Math.PI; mg.position.set(vx, 1.15 + (mh + 0.04) / 2, Z1 - 0.026); va.add(mg); }
      if (PEB && VM) { const cw4 = ledStrip({ w: 1.0, wash: 1.2, dir: 'down', alpha: 0.4, colour: 0xffd9a0 }); cw4.obj.rotation.y = Math.PI; cw4.obj.position.set(vx, ceiling - 0.04, Z1 - 0.02); va.add(cw4.obj); vaM.strips.push(...cw4.moods.strips); vaM.halos = cw4.moods.halos; }
      else if (PEB) { const hl = ledStrip({ w: mw, wash: 0.2, dir: 'up', alpha: 0.5 }); hl.obj.rotation.y = Math.PI; hl.obj.position.set(vx, 1.15 + mh + 0.04, Z1 - 0.003); va.add(hl.obj); vaM.strips.push(...hl.moods.strips); vaM.halos = hl.moods.halos; }
      else { const sc = g(); sc.add(box(0.06, 0.06, 0.02, FX, 0, 0, 0)); const arm2 = cyl(0.006, 0.006, 0.14, FX, 0, 0, 0, 8); arm2.rotation.x = Math.PI / 2; arm2.position.set(0, 0.03, 0.08); sc.add(arm2); const bm = led(0xffd9a0, 2.4); vaM.strips.push(bm); const shd = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.08, 16, 1, true), FX()); shd.material.side = THREE.DoubleSide; shd.position.set(0, 0.0, 0.15); sc.add(shd); const bb = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), bm); bb.position.set(0, -0.02, 0.15); sc.add(bb); sc.rotation.y = Math.PI; sc.position.set(vx + (VM ? 0.52 : 0.25), VM ? 1.72 : 2.1, Z1 - 0.01); va.add(loose(sc)); } }
    parts['vanity'] = { obj: va, moods: vaM };
    // wall-hung WC on the original WC spot (centre x 6.18, back on the south wall, faces north), flush plate, roll holder on the east wall
    const wc = g(), wx = 6.18;
    wc.add(box(0.36, 0.34, 0.2, () => M('__wc_white', 0xf6f5f2), wx, 0.28, Z1 - 0.2, 0.06)); const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.19, 28, 16), M('__wc_white', 0xf6f5f2)); bowl.scale.set(0.95, 0.7, 1.45); bowl.position.set(wx, 0.38, Z1 - 0.33); wc.add(bowl);
    wc.add(box(0.36, 0.02, 0.48, () => M('__wc_seat', 0xf2f1ee), wx, 0.48, Z1 - 0.53, 0.008));
    wc.add(box(0.24, 0.16, 0.012, FX, wx, 1.0, Z1 - 0.012, 0.004)); for (const dx of [-0.05, 0.05]) { const bt = cyl(0.04, 0.04, 0.008, TEAL ? BRASS : () => M('__flush_button', 0x2a2a2a), 0, 0, 0, 20); bt.rotation.x = Math.PI / 2; bt.position.set(wx + dx, 1.08, Z1 - 0.016); wc.add(bt); }
    const rh = cyl(0.008, 0.008, 0.14, FX, 0, 0, 0, 8); rh.rotation.x = Math.PI / 2; rh.position.set(X1 - 0.07, 0.75, 4.55); rh.rotation.set(0, 0, Math.PI / 2); wc.add(rh); const roll = cyl(0.055, 0.055, 0.1, () => M('__tissue', 0xfbfbfa), 0, 0, 0, 20); roll.rotation.z = Math.PI / 2; roll.position.set(X1 - 0.08, 0.75, 4.55); wc.add(loose(roll));
    const wcM = { strips: [], halos: [] };
    if (GSL) { const lx0 = 5.75, ld = 0.14; wc.add(box(X1 - lx0, 1.0, ld, (w5, h5) => porcelain(X1 - lx0, 1.0), (lx0 + X1) / 2, 0, Z1 - ld)); wc.add(box(X1 - lx0 + 0.01, 0.03, ld + 0.02, () => M('__ledge_top_grey', 0x5e5e60), (lx0 + X1) / 2, 1.0, Z1 - ld - 0.02, 0.003));
      for (let x = lx0 + 0.02; x < 6.07; x += 0.045) wc.add(box(0.03, ceiling - 1.03, 0.03, WOOD, x, 1.03, Z1 - 0.035, 0.003));
      for (let x = 6.1; x < X1 - 0.01; x += 0.045) wc.add(box(0.03, ceiling - 2.42, 0.03, WOOD, x, 2.42, Z1 - 0.035, 0.003));
      const sw = ledStrip({ w: X1 - lx0, wash: 1.0, dir: 'down', alpha: 0.4, colour: 0xffd9a0 }); sw.obj.rotation.y = Math.PI; sw.obj.position.set((lx0 + X1) / 2, ceiling - 0.04, Z1 - 0.05); wc.add(sw.obj); wcM.strips.push(...sw.moods.strips); wcM.halos.push(...sw.moods.halos);
      for (const [px, sc2] of [[5.9, 1.3], [6.55, 1]]) { const pp = g(); pp.add(cyl(0.07 * sc2, 0.055 * sc2, 0.12 * sc2, () => M('__pot_clay', 0xb89a7a), 0, 0, 0, 16)); for (let k = 0; k < 14; k++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.03 * sc2, 8, 6), M('__leaf_green', 0x5f7d3e)); lf.scale.set(0.5, 2.2, 0.3); lf.rotation.set(0.7 * Math.cos(k), k, 0.7 * Math.sin(k)); lf.position.set(Math.cos(k) * 0.04, 0.2 * sc2, Math.sin(k) * 0.04); pp.add(lf); } pp.position.set(px, 1.03, Z1 - 0.08); wc.add(loose(pp)); }
      // flush plate: inside the ledge top here (as in the reference) — hide the wall plate + buttons
      wc.children.slice().forEach(ch => { if (ch.material && /__fixture_black_matte|__flush_button/.test(ch.material.name) && ch.position.y > 0.95 && ch.position.y < 1.2 && Math.abs(ch.position.x - wx) < 0.2) wc.remove(ch); });
      wc.add(box(0.2, 0.004, 0.08, FX, wx, 1.031, Z1 - 0.1));
    }
    parts['wc'] = { obj: wc, moods: wcM };
    // bath mat
    const mat2 = g(); mat2.add(box(0.7, 0.012, 0.45, () => M('__bath_mat', STONE ? 0xe8e2d6 : 0x8a8e93), 5.15, 0.066, 3.95, 0.004)); parts['mat'] = { obj: loose(mat2), moods: { strips: [] } };
    return parts;
  }
  /* ================= Walk-in wardrobe fronts (owner references 2026-11-10, references/walk-in/) =================
     Replaces the three v1 greige sliders (same three bypass tracks) — the v1 interior (rails, shelves, drawers, loft) stays.
     Local frame: origin = centre of the carcass front line, +x east, +z into the dressing room (south), floor y 0.
     style 'bronze-fluted': black frames + bronze fluted glass, warm LED lines glowing through, cove band at the top.
     style 'grey-reeded': light-grey wardrobe, reeded grey glass + solid grey band in thin brass frames (to 2.2 m) and a
     four-door loft above with brass pull bars. */
  function walkinFronts({ style = 'bronze-fluted', W = 2.79, top = 2.95, bottom = 0.12 } = {}) {
    const root = g(), moods = { strips: [], halos: [] }, GREY = style === 'grey-reeded', WALN = style === 'walnut-smoked';
    const FR = GREY ? () => M('__wardrobe_light_grey', 0xd6d6d2) : WALN ? WOOD : () => M('__frame_black_bronze', 0x1c1714), EDGE = GREY ? BRASS : WALN ? () => M('__frame_black_bronze', 0x1c1714) : FR;
    const fluteTex = (light, dark) => { const t = canvasTex(64, 8, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, dark); gr.addColorStop(0.35, light); gr.addColorStop(0.55, light); gr.addColorStop(1, dark); x.fillStyle = gr; x.fillRect(0, 0, w, h); }); t.wrapS = THREE.RepeatWrapping; return t; };
    const smoked = () => new THREE.MeshPhysicalMaterial({ color: 0x3a3532, transparent: true, opacity: 0.42, roughness: 0.08, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false, name: '__smoked_glass' });
    const glassMat = (w) => { if (WALN) return smoked(); const t = fluteTex(GREY ? '#e6eaec' : '#d9a86a', GREY ? '#7d8489' : '#3a2410'); t.repeat.set(w / 0.014, 1);
      return new THREE.MeshPhysicalMaterial({ map: t, color: GREY ? 0xc9d0d4 : 0xb07a3c, transparent: true, opacity: GREY ? 0.42 : 0.58, roughness: 0.22, metalness: 0.05, side: THREE.DoubleSide, depthWrite: false, name: GREY ? '__reeded_grey_glass' : '__fluted_bronze_glass' }); };
    if (style === 'navy-arched') {   // owner reference: navy panelled wardrobe — arched antique-glass doors, fluted glass + muntins, drawers, brass pulls, walnut fluted frieze
      const NAVY = () => M('__navy_lacquer', 0x23304a), WALT = WOOD, crown = 2.62, nL = 4, wL = 0.42, wR = (W - nL * wL) / 2, xR0 = -W / 2 + nL * wL;
      const antique = new THREE.MeshPhysicalMaterial({ map: canvasTex(128, 256, (x, w, h) => { x.fillStyle = '#6b6258'; x.fillRect(0, 0, w, h); for (let k = 0; k < 500; k++) { x.fillStyle = `rgba(${150 + Math.random() * 80},${140 + Math.random() * 70},${120 + Math.random() * 60},${0.08 + Math.random() * 0.15})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 7, 0, 7); x.fill(); } }), color: 0xbdb2a4, transparent: true, opacity: 0.55, roughness: 0.15, metalness: 0.3, side: THREE.DoubleSide, depthWrite: false, name: '__antique_glass' });
      const fluted = (w) => { const t = fluteTex('#e6c79a', '#5a3f22'); t.repeat.set(w / 0.014, 1); return new THREE.MeshPhysicalMaterial({ map: t, color: 0xd9b07a, transparent: true, opacity: 0.5, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false, name: '__fluted_amber_glass' }); };
      const panelTex = canvasTex(64, 128, (x, w, h) => { x.fillStyle = '#23304a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = 2; x.strokeRect(9, 9, w - 18, h - 18); x.strokeStyle = 'rgba(0,0,0,0.35)'; x.strokeRect(12, 12, w - 24, h - 24); });
      const panelMat = () => new THREE.MeshStandardMaterial({ map: panelTex, roughness: 0.6, name: '__navy_panel_moulding' });
      // fixed frame: walnut skirting, side posts, fluted walnut frieze + cornice above the doors
      root.add(box(W + 0.06, bottom, 0.06, WALT, 0, 0, 0)); for (const sx of [-1, 1]) root.add(box(0.03, crown, 0.05, NAVY, sx * (W / 2 + 0.015), 0, 0));
      root.add(box(W + 0.06, top - crown, 0.03, WALT, 0, crown, 0.02)); for (let x = -W / 2 + 0.015; x < W / 2; x += 0.028) root.add(cyl(0.009, 0.009, top - crown - 0.09, WALT, x, crown + 0.03, 0.055, 8));
      root.add(box(W + 0.1, 0.05, 0.1, WALT, 0, top - 0.05, 0.01, 0.006)); root.add(box(W + 0.06, 0.025, 0.07, WALT, 0, crown, 0.02, 0.004));
      // hinged leaf with an optional rounded window (a real hole: you see through the glass)
      const leaf = (x0, w, y0, y1, left, label, win, glassMat, muntins) => { const d = g(), sg = left ? 1 : -1, lw = w - 0.006, hx = left ? x0 + 0.002 : x0 + w - 0.002, hh = y1 - y0;
        const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(lw, 0); sh.lineTo(lw, hh); sh.lineTo(0, hh); sh.lineTo(0, 0);
        if (win) { const hp = new THREE.Path(); rrShape(lw - 0.12, win[1] - win[0], 0.07, lw / 2, (win[0] + win[1]) / 2, hp); sh.holes.push(hp); }
        const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: false, curveSegments: 12 }), NAVY()); m.scale.x = sg; m.position.set(0, y0, 0); d.add(m);
        if (win) { const ring = new THREE.Shape(); rrShape(lw - 0.11, win[1] - win[0] + 0.01, 0.075, lw / 2, (win[0] + win[1]) / 2, ring); const ih = new THREE.Path(); rrShape(lw - 0.13, win[1] - win[0] - 0.01, 0.065, lw / 2, (win[0] + win[1]) / 2, ih); ring.holes.push(ih);
          const rm = new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth: 0.006, bevelEnabled: false, curveSegments: 12 }), BRASS()); rm.scale.x = sg; rm.position.set(0, y0, 0.022); d.add(rm);
          const gm = new THREE.Mesh(new THREE.PlaneGeometry(lw - 0.12, win[1] - win[0]), glassMat); gm.position.set(sg * lw / 2, y0 + (win[0] + win[1]) / 2, 0.011); d.add(gm);
          if (muntins) { for (let k = 1; k < 4; k++) d.add(box(lw - 0.12, 0.016, 0.012, NAVY, sg * lw / 2, y0 + win[0] + k * (win[1] - win[0]) / 4, 0.008)); d.add(box(0.016, win[1] - win[0], 0.012, NAVY, sg * lw / 2, y0 + win[0], 0.008)); } }
        const lowTop = win ? win[0] - 0.08 : hh - 0.08; if (lowTop > 0.25) { const pm = new THREE.Mesh(new THREE.PlaneGeometry(lw - 0.1, lowTop - 0.08), panelMat()); pm.position.set(sg * lw / 2, y0 + 0.08 + (lowTop - 0.08) / 2, 0.0225); d.add(pm); }
        d.position.set(hx, 0, 0.05); tagGroup(d, { type: 'cab', hinge: [hx, 0, 0.05], a1: left ? -Math.PI * 0.5 : Math.PI * 0.5, label, fitted: true }); root.add(d); return { d, sg, lw }; };
      const pull = (L, y) => { const pz = 0.022 + 0.02; L.d.add(cyl(0.008, 0.008, 0.34, BRASS, L.sg * (L.lw - 0.035), y, pz, 10)); L.d.add(box(0.012, 0.18, 0.006, () => M('__pearl_inlay', 0xe8e4dc), L.sg * (L.lw - 0.035), y + 0.08, pz + 0.006)); };
      for (let k = 0; k < nL; k++) { const L = leaf(-W / 2 + k * wL, wL, bottom + 0.003, crown - 0.006, k % 2 === 0, 'wardrobe door', [1.0, 2.38], antique); if (k === 1 || k === 2) pull(L, 0.85);
        const kb = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), BRASS()); kb.position.set(L.sg * (L.lw - 0.04), 1.0, 0.03); if (k === 0 || k === 3) L.d.add(kb); }
      const dTop = 0.93, gTop = 2.05;
      for (let k = 0; k < 2; k++) { const L = leaf(xR0 + k * wR, wR, dTop + 0.006, gTop - 0.006, k === 0, 'glass wardrobe door', [0.06, gTop - dTop - 0.07], fluted(wR - 0.12), true); pull(L, dTop + 0.55);
        leaf(xR0 + k * wR, wR, gTop + 0.006, crown - 0.006, k === 0, 'loft door'); }
      const dh = (dTop - bottom) / 2; for (let k = 0; k < 2; k++) { const dr = g(); dr.add(box(2 * wR - 0.008, dh - 0.008, 0.022, NAVY, xR0 + wR, bottom + k * dh + 0.004, 0.05, 0.002)); const pm = new THREE.Mesh(new THREE.PlaneGeometry(2 * wR - 0.1, dh - 0.09), panelMat()); pm.position.set(xR0 + wR, bottom + k * dh + dh / 2, 0.0725); dr.add(pm);
        for (const sx of [-1, 1]) { const kb = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), BRASS()); kb.position.set(xR0 + wR + sx * 0.25, bottom + k * dh + dh / 2, 0.085); dr.add(kb); }
        dr.add(box(2 * wR - 0.08, 0.01, 0.4, OAK, xR0 + wR, bottom + k * dh + 0.03, -0.34)); tagGroup(dr, { type: 'slide', slide: [0, 0, 0.3], label: 'wardrobe drawer', fitted: true }); root.add(dr); }
      for (const yy of [0.95, 1.41, 1.87, 2.31]) { const l = led(0xffc27a, 2.6); moods.strips.push(l); root.add(box(W - 0.1, 0.008, 0.01, l, 0, yy, -0.05)); }
      return { obj: root, moods };
    }
    if (style === 'organic-inlay') {   // owner reference: dark doors, brass grooves with rounded panel corners + a flowing bronze wave band continuous across all doors
      const H = top - bottom, PX = 700, cw = Math.round(W * PX), chh = Math.round(H * PX), X = m => m * PX, Y = m => chh - m * PX;   // canvas in metres (from the wardrobe's bottom-left)
      const wave = x => 0.86 + 0.11 * Math.sin(x / 1.35 * Math.PI * 2 + 0.7) + 0.035 * Math.sin(x / 0.55 * Math.PI * 2);
      const loftY = 2.2, nCol = 6, colW = W / nCol, gap = 0.012, brass = '#c49a5a', r = 0.11, band = 0.055;
      const tex = canvasTex(cw, chh, (x) => { x.fillStyle = '#2b2522'; x.fillRect(0, 0, cw, chh);
        for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(${60 + Math.random() * 20},${50 + Math.random() * 15},${45 + Math.random() * 12},0.25)`; x.fillRect(Math.random() * cw, Math.random() * chh, 2 + Math.random() * 30, 1); }
        // bronze wave band (filled) with bright brass edges
        x.beginPath(); for (let px = 0; px <= cw; px += 4) x.lineTo(px, Y(wave(px / PX) + band)); for (let px = cw; px >= 0; px -= 4) x.lineTo(px, Y(wave(px / PX) - band)); x.closePath();
        const gr = x.createLinearGradient(0, Y(1.1), 0, Y(0.7)); gr.addColorStop(0, '#8a6232'); gr.addColorStop(0.5, '#b88a4e'); gr.addColorStop(1, '#6b4a26'); x.fillStyle = gr; x.fill();
        x.strokeStyle = brass; x.lineWidth = 5; for (const off of [band, -band]) { x.beginPath(); for (let px = 0; px <= cw; px += 4) x.lineTo(px, Y(wave(px / PX) + off)); x.stroke(); }
        // panel outlines per column: upper panel (wave → loft), lower panel (floor → wave), loft panel — rounded corners hugging the wave
        x.lineWidth = 4;
        for (let c = 0; c < nCol; c++) { const x0 = c * colW + 0.035, x1 = (c + 1) * colW - 0.035;
          const yU0 = Math.max(wave(x0), wave(x1)) + band + 0.05, yL1 = Math.min(wave(x0), wave(x1)) - band - 0.05;
          for (const [a, b] of [[yU0, loftY - 0.05], [0.12, yL1], [loftY + 0.05, H - 0.07]]) { if (b - a < 2 * r) continue; x.beginPath(); x.roundRect(X(x0), Y(b), X(x1 - x0), X(b - a), X(r)); x.stroke(); } }
        // dark groove between the door columns and above the loft row
        x.fillStyle = '#151210'; for (let c = 1; c < nCol; c++) x.fillRect(X(c * colW) - 3, 0, 6, chh); x.fillRect(0, Y(loftY) - 3, cw, 6); });
      const slice = (u0, v0, w, h) => { const t = tex.clone(); t.needsUpdate = true; t.offset.set(u0 / W, v0 / H); t.repeat.set(w / W, h / H); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.15, name: '__organic_inlay_door' }); };
      root.add(box(W + 0.06, 0.05, 0.05, () => M('__wardrobe_dark', 0x2b2522), 0, top, 0)); root.add(box(W + 0.06, bottom, 0.05, () => M('__wardrobe_dark', 0x2b2522), 0, 0, 0));
      for (const sx of [-1, 1]) root.add(box(0.03, top + 0.05, 0.05, () => M('__wardrobe_dark', 0x2b2522), sx * (W / 2 + 0.015), 0, 0));
      for (let c = 0; c < nCol; c++) for (const [y0, y1, lbl] of [[0, loftY - gap / 2, 'wardrobe door'], [loftY + gap / 2, H, 'loft door']]) {
        const left = c % 2 === 0, x0 = -W / 2 + c * colW, hx = left ? x0 + 0.002 : x0 + colW - 0.002, sg = left ? 1 : -1, lw = colW - 0.006, d = g();
        d.add(box(lw, y1 - y0 - 0.006, 0.022, () => M('__wardrobe_dark', 0x2b2522), sg * lw / 2, bottom + y0 + 0.003, 0));
        const face = new THREE.Mesh(new THREE.PlaneGeometry(lw, y1 - y0 - 0.006), slice(c * colW + 0.003, y0 + 0.003, lw, y1 - y0 - 0.006)); face.position.set(sg * lw / 2, bottom + (y0 + y1) / 2, 0.0225); if (!left) face.scale.x = 1; d.add(face);
        d.position.set(hx, 0, 0.05); tagGroup(d, { type: 'cab', hinge: [hx, 0, 0.05], a1: left ? -Math.PI * 0.5 : Math.PI * 0.5, label: lbl, fitted: true }); root.add(d); }
      const fl = ledStrip({ w: W, wash: 0.5, dir: 'floor', alpha: 0.55 }); fl.obj.position.set(0, 0.066, 0.08); root.add(fl.obj); moods.strips.push(...fl.moods.strips); moods.halos.push(...fl.moods.halos);
      for (const yy of [0.49, 0.95, 1.41, 1.87, 2.31, 2.48]) { const l = led(0xffc27a, 2.6); moods.strips.push(l); root.add(box(W - 0.1, 0.008, 0.01, l, 0, yy, -0.05)); }
      return { obj: root, moods };
    }
    if (style === 'graphite-hinged') {   // owner reference: graphite hinged doors (4 solid + loft) | 2 glass doors | open lit column with 3 drawers
      const GR = () => M('__graphite_matte', 0x3d3f42), BAR = () => M('__bar_black', 0x121212), dz = 0.02, lb = 2.3;
      const xs0 = -W / 2, solidW = 0.37, glassW = 0.43, openW = W - 4 * solidW - 2 * glassW, xg0 = xs0 + 4 * solidW, xo0 = xg0 + 2 * glassW;
      root.add(box(W + 0.06, 0.05, 0.05, GR, 0, top - 0.05, 0)); root.add(box(W + 0.06, bottom, 0.05, GR, 0, 0, 0));          // top fascia + plinth
      for (const sx of [-1, 1]) root.add(box(0.03, top, 0.05, GR, sx * (W / 2 + 0.015), 0, 0));
      root.add(box(0.02, top - bottom - 0.05, 0.05, GR, xo0, bottom, 0)); root.add(box(0.02, top - bottom - 0.05, 0.05, GR, xg0, bottom, 0));
      root.add(box(4 * solidW, 0.02, 0.05, GR, xs0 + 2 * solidW, lb - 0.01, 0));                                               // loft divider
      const leaf = (x0, w, y0, y1, left, label, glass) => { const d = g(), sg = left ? 1 : -1, hx = left ? x0 + 0.002 : x0 + w - 0.002, lw = w - 0.006;
        if (glass) { for (const [w2, h2, ox, oy] of [[lw, 0.03, lw / 2, 0], [lw, 0.03, lw / 2, y1 - y0 - 0.03], [0.03, y1 - y0, 0.015, 0], [0.03, y1 - y0, lw - 0.015, 0]]) d.add(box(w2, h2, 0.022, BAR, sg * ox, y0 + oy, 0));
          const gm = new THREE.Mesh(new THREE.PlaneGeometry(lw - 0.06, y1 - y0 - 0.06), new THREE.MeshPhysicalMaterial({ color: 0x2f3236, transparent: true, opacity: 0.32, roughness: 0.06, side: THREE.DoubleSide, depthWrite: false, name: '__smoked_glass_clear' })); gm.position.set(sg * lw / 2, (y0 + y1) / 2, 0.011); d.add(gm); }
        else d.add(box(lw, y1 - y0, 0.022, GR, sg * lw / 2, y0, 0, 0.002));
        d.position.set(hx, 0, dz + 0.03); tagGroup(d, { type: 'cab', hinge: [hx, 0, dz + 0.03], a1: left ? -Math.PI * 0.5 : Math.PI * 0.5, label, fitted: true }); root.add(d); return { d, sg, lw }; };
      for (let k = 0; k < 4; k++) { const left = k % 2 === 0, x0 = xs0 + k * solidW, L = leaf(x0, solidW, bottom + 0.003, lb - 0.012, left, 'wardrobe door'); if (!left || k === 0 || k === 2) { /* bar handles on the meeting edges */ }
        if (!left) L.d.add(box(0.018, 0.9, 0.025, BAR, -(L.lw - 0.04), 0.55, 0.022, 0.004)); else L.d.add(box(0.018, 0.9, 0.025, BAR, L.lw - 0.04, 0.55, 0.022, 0.004));
        leaf(x0, solidW, lb + 0.012, top - 0.053, left, 'loft door'); }
      for (let k = 0; k < 2; k++) leaf(xg0 + k * glassW, glassW, bottom + 0.003, top - 0.053, k === 0, 'glass wardrobe door', true);
      // open column: lit shelves + three drawers
      const ocx = xo0 + openW / 2; for (const yy of [1.05, 1.5, 1.95, 2.4]) { root.add(box(openW - 0.03, 0.02, 0.5, GR, ocx, yy, -0.48)); const sl = led(0xffc27a, 2.6); moods.strips.push(sl); root.add(box(openW - 0.08, 0.006, 0.01, sl, ocx, yy - 0.008, -0.03)); }
      const dh = (0.85 - bottom) / 3; for (let k = 0; k < 3; k++) { const dr = g(); dr.add(box(openW - 0.03, dh - 0.008, 0.022, GR, ocx, bottom + k * dh + 0.004, dz + 0.03, 0.002)); dr.add(box(0.12, 0.012, 0.016, BAR, ocx, bottom + k * dh + dh * 0.62, dz + 0.052)); dr.add(box(openW - 0.08, 0.01, 0.4, GR, ocx, bottom + k * dh + 0.03, -0.38));
        tagGroup(dr, { type: 'slide', slide: [0, 0, 0.3], label: 'wardrobe drawer', fitted: true }); root.add(dr); }
      root.add(box(openW - 0.03, 0.02, 0.5, GR, ocx, 0.85, -0.48));
      const vase = g(); vase.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), M('__vase_black', 0x1a1a1a))); vase.children[0].position.y = 0.06; for (let k = 0; k < 6; k++) { const st = cyl(0.002, 0.002, 0.2, () => M('__dried_branch', 0xb79c6a), (k - 2.5) * 0.01, 0.12, 0, 5); st.rotation.z = (k - 2.5) * 0.2; vase.add(st); } vase.position.set(ocx, 0.87, -0.2); root.add(loose(vase));
      for (const [yy, c] of [[1.07, 0xe9e1d4], [1.52, 0xd8cdbd], [1.97, 0xefe9df], [2.42, 0xe9e1d4]]) root.add(loose(box(openW - 0.12, 0.14, 0.3, () => M('__storage_box_' + c.toString(16), c), ocx, yy + 0.02, -0.4, 0.01)));
      for (const yy of [0.49, 0.95, 1.41, 1.87, 2.31]) { const l = led(0xffc27a, 2.6); moods.strips.push(l); root.add(box(2 * glassW - 0.06, 0.008, 0.01, l, xg0 + glassW, yy, -0.05)); }
      const tb = ledStrip({ w: W, wash: 0.35, dir: 'up', alpha: 0.45 }); tb.obj.position.set(0, top + 0.005, 0.06); root.add(tb.obj); moods.strips.push(...tb.moods.strips); moods.halos.push(...tb.moods.halos);
      return { obj: root, moods };
    }
    const sTop = GREY ? 2.2 : WALN ? 2.28 : top, H = sTop - bottom;
    // frame: top + bottom track, side jambs
    root.add(box(W + 0.06, 0.05, 0.27, FR, 0, sTop - 0.05, 0)); root.add(box(W + 0.06, 0.03, 0.27, FR, 0, bottom - 0.03, 0));
    for (const sx of [-1, 1]) root.add(box(0.03, top - bottom + 0.03, 0.27, FR, sx * (W / 2 + 0.015), bottom - 0.03, 0));
    // three bypass sliders on the v1 tracks (back / middle / front), same travel as the v1 panels
    const cx = [-0.915, -0.005, 0.91], tz = [0.02, 0.1, 0.18], dir = [1, -1, -1], pw = 0.96;
    for (let i = 0; i < 3; i++) {
      const p = g(), f = GREY ? 0.012 : 0.03, x0 = cx[i];
      for (const [w2, h2, ox, oy] of [[pw, f, 0, 0], [pw, f, 0, H - f], [f, H, -pw / 2 + f / 2, 0], [f, H, pw / 2 - f / 2, 0]]) p.add(box(w2, h2, 0.04, EDGE, x0 + ox, bottom + oy, tz[i], 0.002));
      const glassPart = (y0, y1) => { const gm = new THREE.Mesh(new THREE.PlaneGeometry(pw - 2 * f, y1 - y0), glassMat(pw - 2 * f)); gm.position.set(x0, (y0 + y1) / 2, tz[i] + 0.02); p.add(gm); };
      if (GREY) { const b0 = bottom + 0.98, b1 = bottom + 1.18; glassPart(bottom + f, b0); glassPart(b1, bottom + H - f); p.add(box(pw - 2 * f, b1 - b0, 0.03, FR, x0, b0, tz[i] + 0.005)); for (const yy of [b0 - 0.012, b1]) p.add(box(pw - 2 * f, 0.012, 0.035, BRASS, x0, yy, tz[i] + 0.004)); }
      else if (WALN) {   // walnut top + bottom, smoked-glass window in the middle edged in thin black lines
        const g0 = bottom + 0.62, g1 = bottom + 1.62; p.add(box(pw - 2 * f, g0 - bottom - f, 0.025, WOOD, x0, bottom + f, tz[i] + 0.005)); p.add(box(pw - 2 * f, bottom + H - f - g1, 0.025, WOOD, x0, g1, tz[i] + 0.005));
        glassPart(g0, g1); for (const yy of [g0 - 0.01, g1]) p.add(box(pw - 2 * f, 0.01, 0.03, EDGE, x0, yy, tz[i] + 0.004)); }
      else glassPart(bottom + f, bottom + H - f);
      p.add(box(0.016, 0.5, 0.02, GREY ? BRASS : () => M('__pull_bronze', 0x6b4a2a), x0 + (i === 0 ? pw / 2 - 0.05 : -pw / 2 + 0.05), bottom + H * 0.42, tz[i] + 0.04, 0.004));
      tagGroup(p, { type: 'slide', slide: [dir[i] * 0.8685, 0, 0], label: 'wardrobe slider', fitted: true }); root.add(p);
    }
    // warm LED lines inside (on the shelf / loft fronts) glowing through the glass
    for (const yy of [0.49, 0.95, 1.41, 1.87, 2.31, 2.48]) { if ((GREY && yy > 2.19) || (WALN && yy > 2.27 && yy < 2.4)) continue; const l = led(0xffc27a, 2.6); moods.strips.push(l); root.add(box(W - 0.1, 0.008, 0.01, l, 0, yy, -0.05)); }
    if (GREY) {   // four-door loft above the sliders (light-grey linen fronts, brass pull bars in pairs), warm line under it
      const lw = W / 4, lb = sTop + 0.01, lh = top - lb, lin = new THREE.MeshStandardMaterial({ roughness: 0.85, name: '__grey_linen_front', map: canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#d9d9d5'; x.fillRect(0, 0, w, h); for (let k = 0; k < 400; k++) { x.fillStyle = `rgba(${150 + Math.random() * 60},${150 + Math.random() * 60},${150 + Math.random() * 60},0.12)`; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 6, 1); } }) });
      root.add(box(W, lh, 0.02, FR, 0, lb, 0.18));
      for (let k = 0; k < 4; k++) { const left = k % 2 === 0, hx = -W / 2 + k * lw + (left ? 0.002 : lw - 0.002), sg = left ? 1 : -1, d = g();
        d.add(box(lw - 0.006, lh - 0.006, 0.022, () => lin, sg * (lw - 0.006) / 2, lb + 0.003, 0)); d.add(box(0.014, 0.16, 0.018, BRASS, sg * (lw - 0.06), lb + lh * 0.25, 0.022, 0.004));
        d.position.set(hx, 0, 0.2); tagGroup(d, { type: 'cab', hinge: [hx, 0, 0.2], a1: left ? -Math.PI * 0.5 : Math.PI * 0.5, label: 'loft cupboard', fitted: true }); root.add(d); }
      const ul = ledStrip({ w: W - 0.1, wash: 0.25, dir: 'down', alpha: 0.4 }); ul.obj.position.set(0, sTop - 0.052, 0.23); root.add(ul.obj); moods.strips.push(...ul.moods.strips); moods.halos.push(...ul.moods.halos);
    } else if (WALN) {   // glazed loft: walnut frame, two smoked-glass sliding doors on their own tracks, warm light inside
      const lb = sTop + 0.01, lh = top - lb; root.add(box(W, 0.04, 0.27, WOOD, 0, lb, 0)); root.add(box(W, 0.04, 0.27, WOOD, 0, top - 0.04, 0));
      const lt = led(0xffc27a, 2.8); moods.strips.push(lt); root.add(box(W - 0.1, 0.008, 0.01, lt, 0, top - 0.06, -0.05));
      for (let k = 0; k < 2; k++) { const d = g(), dw = W / 2 + 0.02, dx = k ? W / 4 - 0.01 : -W / 4 + 0.01, dz = k ? 0.2 : 0.14;
        for (const [w2, h2, ox, oy] of [[dw, 0.02, 0, 0.04], [dw, 0.02, 0, lh - 0.06], [0.02, lh - 0.08, -dw / 2 + 0.01, 0.04], [0.02, lh - 0.08, dw / 2 - 0.01, 0.04]]) d.add(box(w2, h2, 0.025, EDGE, dx + ox, lb + oy, dz));
        const gm = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.04, lh - 0.12), smoked()); gm.position.set(dx, lb + 0.04 + (lh - 0.08) / 2, dz + 0.012); d.add(gm);
        tagGroup(d, { type: 'slide', slide: [k ? -(W / 2 - 0.05) : (W / 2 - 0.05), 0, 0], label: 'loft glass slider', fitted: true }); root.add(d); }
    } else {      // bronze: warm light band along the top (ceiling bulkhead) like the reference
      const tb = ledStrip({ w: W, wash: 0.35, dir: 'up', alpha: 0.5 }); tb.obj.position.set(0, top + 0.005, 0.28); root.add(tb.obj); moods.strips.push(...tb.moods.strips); moods.halos.push(...tb.moods.halos);
    }
    return { obj: root, moods };
  }
  /* ================= Sliding wardrobe, full carcass + interior (owner 2026-11-11, references/bedroom-2/2026-11-11_sliding-wardrobe-sage-gloss.png) =================
     style 'sage-gloss': pale-oak carcass + top, slim pale-gold top track, recessed sage plinth, two bypass sliders in high-gloss sage
     lacquer, each split into four panels by thin oak-brass inlay lines (same heights on both doors), long oak-brass bar pulls on the
     outer edges. Interior: left bay = two shelves of folded clothes, shirt rail, 5-drawer stack over a shoe tier; right bay = shelves +
     long-hang rail (dresses, coats) over a shoe tier; warm LED under the first shelf of each bay.
     Local frame: origin = floor, centre of the back face, +x along the wall, +z = front. y 0 = finished floor.
     W, D = carcass width / depth; top = carcass top (under a bulkhead); ceil + fasZ = optional closed header from top up to the ceiling
     over the front part (local z > fasZ) where the ceiling is higher than the bulkhead. */
  function slidingWardrobe({ style = 'sage-gloss', W = 2.4, D = 0.69, top = 2.85, ceil = 0, fasZ = 0.24 } = {}) {
    const root = g(), moods = { strips: [], halos: [] };
    const P = o => new THREE.MeshPhysicalMaterial(o);
    // pale maple / light natural oak like the reference (the photo 'pale oak' veneer rendered too brown): soft low-contrast grain
    let gs = 7; const grnd = () => (gs = (gs * 9301 + 49297) % 233280) / 233280;
    const mapleTex = canvasTex(256, 512, (x, w, h) => { x.fillStyle = '#dcc597'; x.fillRect(0, 0, w, h);
      for (let k = 0; k < 120; k++) { let cx = grnd() * w; x.strokeStyle = grnd() < 0.6 ? `rgba(170,130,80,${(0.04 + grnd() * 0.1).toFixed(2)})` : `rgba(245,228,190,${(0.08 + grnd() * 0.14).toFixed(2)})`;
        x.lineWidth = 0.6 + grnd() * 2.2; x.beginPath(); x.moveTo(cx, 0); for (let y = 0; y <= h; y += 32) { cx += (grnd() - 0.5) * 5; x.lineTo(cx, y); } x.stroke(); } });
    const MAPLE = new THREE.MeshPhysicalMaterial({ map: mapleTex, roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.4, name: '__wardrobe_pale_maple' });
    const OAKP = () => MAPLE;
    const SAGEG = P({ color: 0x94a28e, roughness: 0.1, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, name: '__wardrobe_sage_gloss' });
    const SAGEM = P({ color: 0x8a9884, roughness: 0.6, name: '__wardrobe_sage_plinth' });
    const INLAY = P({ color: 0xd8b880, roughness: 0.32, metalness: 0.45, name: '__oak_brass_inlay' });
    const TRACK = P({ color: 0xc8b48c, roughness: 0.35, metalness: 0.6, name: '__wardrobe_track' });
    const GROOVE = P({ color: 0x5a4a35, roughness: 0.7, name: '__drawer_groove' });
    const t = 0.025, Wi = W - 2 * t, zc = D - 0.085, base = 0.105, inTop = top - t, sd = zc - 0.009;
    // ---- carcass: sides, top, back, divider, base on a recessed sage plinth
    for (const sx of [-1, 1]) root.add(box(t, top, D, OAKP, sx * (W / 2 - t / 2), 0, 0));
    root.add(box(W, t, D, OAKP, 0, inTop, 0));
    root.add(box(Wi, 0.08, D - 0.05, SAGEM, 0, 0, 0));
    root.add(box(Wi, base - 0.08, D, OAKP, 0, 0.08, 0));
    root.add(box(Wi, inTop - base, 0.009, OAKP, 0, base, 0));
    root.add(box(0.018, inTop - base, sd, OAKP, 0, base, 0.009));
    if (ceil > top + 0.01) root.add(box(W, ceil - top - 0.002, D - fasZ, OAKP, 0, top, fasZ));   // closed header to the ceiling (front part)
    // slim top track (pale gold channel) + two bottom track strips
    root.add(box(Wi, 0.03, D - zc - 0.004, TRACK, 0, inTop - 0.03, zc));
    // ---- two bypass sliders: front door (−x half) slides +x, rear door (+x half) slides −x; 13 mm between the door faces
    const dw = Wi / 2 + 0.015, yb = base + 0.004, Hd = inTop - 0.03 - 0.003 - yb, run = Wi - dw;
    const zF = D - 0.033, zR = D - 0.068;   // back faces (door thickness 22 mm → front faces D−0.011 / D−0.046)
    for (const z of [zF, zR]) root.add(box(Wi, 0.004, 0.006, TRACK, 0, base, z + 0.008));
    const LINES = [0.24, 0.43, 0.72];
    for (let i = 0; i < 2; i++) {
      const p = g(), cx = i === 0 ? -Wi / 2 + dw / 2 : Wi / 2 - dw / 2, zb = i === 0 ? zF : zR;
      p.add(box(dw, Hd, 0.022, SAGEG, cx, yb, zb, 0.002));
      for (const f of LINES) p.add(box(dw - 0.004, 0.008, 0.002, INLAY, cx, yb + f * Hd - 0.004, zb + 0.022));
      for (const yy of [yb + 0.004, yb + Hd - 0.01]) p.add(box(dw - 0.004, 0.006, 0.002, INLAY, cx, yy, zb + 0.022));
      // long oak-brass bar pull on the outer edge: the front door's stands proud (nothing passes in front of it); the rear door's
      // is a flush bar in a dark groove (4 mm proud) so it passes behind the front door (13 mm gap)
      const px = i === 0 ? cx - dw / 2 + 0.055 : cx + dw / 2 - 0.055, py = yb + 0.47 * Hd - 0.24;
      if (i === 0) { p.add(box(0.02, 0.48, 0.016, INLAY, px, py, zb + 0.032, 0.004)); for (const dy of [0.04, 0.42]) p.add(box(0.01, 0.02, 0.012, INLAY, px, py + dy, zb + 0.021)); }
      else { p.add(box(0.026, 0.5, 0.002, GROOVE, px, py - 0.01, zb + 0.0215)); p.add(box(0.016, 0.48, 0.004, INLAY, px, py, zb + 0.022, 0.0015)); }
      tagGroup(p, { type: 'slide', slide: [i === 0 ? run : -run, 0, 0], label: 'wardrobe slider', fitted: true }); root.add(p);
    }
    // ---- interior helpers: folded stacks, hanging garments on wooden hangers, sneakers
    const cloth = new Map(), CL = c => { if (!cloth.has(c)) cloth.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, name: '__cloth_' + c.toString(16) })); return cloth.get(c); };
    let sd0 = 11; const rnd = () => (sd0 = (sd0 * 9301 + 49297) % 233280) / 233280;
    const stack = (x, y, z, n, cols, w = 0.3, d = 0.27) => { let yy = y; for (let k = 0; k < n; k++) { const h = 0.035 + rnd() * 0.02; root.add(loose(box(w - rnd() * 0.02, h, d - rnd() * 0.02, CL(cols[k % cols.length]), x + (rnd() - 0.5) * 0.012, yy, z + (rnd() - 0.5) * 0.01, 0.012))); yy += h; } };
    const hangerMat = OAKP;
    const garment = (x, railY, zMid, len, col, long) => {
      const gr = g(), sh = new THREE.Shape(), hw = long ? 0.24 : 0.225;
      sh.moveTo(-0.065, -0.045); sh.lineTo(-hw + 0.01, -0.095); sh.lineTo(-hw, -0.13); sh.lineTo(-hw + (long ? -0.01 : 0.012), -len + 0.03);
      sh.lineTo(-hw + 0.03, -len); sh.lineTo(hw - 0.03, -len); sh.lineTo(hw - (long ? -0.01 : 0.012), -len + 0.03); sh.lineTo(hw, -0.13); sh.lineTo(hw - 0.01, -0.095);
      sh.lineTo(0.065, -0.045); sh.quadraticCurveTo(0, -0.085, -0.065, -0.045);
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: long ? 0.035 : 0.022, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2, curveSegments: 6 }), CL(col));
      m.rotation.y = Math.PI / 2; m.position.set(-0.015, 0, 0); gr.add(m);
      // collar band (shirts) / lapel tone (coats)
      if (!long) { const c2 = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 6, 16, Math.PI), CL(col)); c2.rotation.set(Math.PI / 2, Math.PI / 2, 0); c2.position.set(0, -0.05, 0); gr.add(c2); }
      // wooden hanger: two arms + hook
      for (const s of [-1, 1]) { const a = cyl(0.006, 0.006, 0.22, hangerMat, 0, 0, 0, 6); a.position.set(0, -0.06, s * 0.105); a.rotation.x = -s * 1.25; gr.add(a); }
      const hk = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.0025, 6, 12, Math.PI * 1.3), TRACK); hk.rotation.y = Math.PI / 2; hk.position.set(0, 0.0, 0); gr.add(hk);
      const st = cyl(0.0025, 0.0025, 0.03, TRACK, 0, -0.035, 0, 6); gr.add(st);
      gr.position.set(x, railY, zMid); gr.rotation.y = (rnd() - 0.5) * 0.12; root.add(loose(gr));
    };
    const sneaker = (x, y, z, col) => { const s = g();
      for (const dx of [-0.055, 0.055]) { s.add(box(0.095, 0.03, 0.27, CL(0xf3f1ec), dx, 0, 0, 0.012)); s.add(box(0.085, 0.075, 0.17, CL(col), dx, 0.025, 0.0, 0.03)); s.add(box(0.08, 0.04, 0.1, CL(col), dx, 0.025, 0.16, 0.018)); }
      s.position.set(x, y, z); root.add(loose(s)); };
    const rail = (x0, x1, y) => { const r = cyl(0.012, 0.012, x1 - x0 - 0.01, TRACK, 0, 0, 0, 12); r.rotation.z = Math.PI / 2; r.position.set((x0 + x1) / 2, y, 0.009 + sd / 2); root.add(r);
      for (const x of [x0 + 0.012, x1 - 0.012]) root.add(box(0.012, 0.05, 0.04, TRACK, x, y - 0.03, 0.009 + sd / 2 - 0.02)); };
    const shelf = (x0, x1, y) => root.add(box(x1 - x0, 0.022, sd, OAKP, (x0 + x1) / 2, y, 0.009));
    const ledUnder = (x0, x1, y) => { const l = led(0xffc890, 2.4); moods.strips.push(l); root.add(box(x1 - x0 - 0.06, 0.006, 0.01, l, (x0 + x1) / 2, y - 0.007, zc - 0.03)); };
    const zMid = 0.009 + sd / 2;
    // ---- left bay (−x): shelves with folded clothes, shirt rail, 5-drawer stack over a shoe tier
    const L0 = -Wi / 2, L1 = -0.009, R0 = 0.009, R1 = Wi / 2, S1 = 2.06, S2 = 2.42, RAIL = 1.95;
    shelf(L0, L1, S1); shelf(L0, L1, S2); ledUnder(L0, L1, S1);
    stack(L0 + 0.22, S1 + 0.022, 0.2, 5, [0xf2f0ea, 0xe9e6de]); stack(L0 + 0.58, S1 + 0.022, 0.2, 4, [0xd9d6cf, 0xc9c6bf]); stack(L0 + 0.94, S1 + 0.022, 0.2, 4, [0x5b7fa6, 0x4d6f96]);
    stack(L0 + 0.22, S2 + 0.022, 0.2, 6, [0xf3f1ec]); stack(L0 + 0.6, S2 + 0.022, 0.2, 5, [0xe6dccb, 0xd9cdb8]);
    rail(L0, L1, RAIL);
    const shirts = [0xf4f3ef, 0xb9cde4, 0x2b3a55, 0xf4f3ef, 0x7d9cc0, 0x1f2a40, 0xd8d4cc, 0x9fb7d3, 0xeeeae2];
    shirts.forEach((c, k) => garment(L0 + 0.1 + k * (L1 - L0 - 0.18) / (shirts.length - 1), RAIL, zMid, 0.7, c, false));
    const dsw = 0.62, dx0 = L0, dx1 = L0 + dsw, dcx = (dx0 + dx1) / 2, dTop = 1.06, shoeY = 0.3, nD = 5, dh = (dTop - shoeY - 0.022) / nD;
    root.add(box(0.018, dTop + 0.022 - base, sd, OAKP, dx1 + 0.009, base, 0.009));   // drawer-stack side panel
    shelf(L0, L1, shoeY);                                                                // shoe tier across the bay
    root.add(box(dsw, 0.022, sd, OAKP, dcx, dTop, 0.009));                               // drawer-stack top
    stack(dcx - 0.1, dTop + 0.022, 0.24, 3, [0x3f6fa8, 0x355f93]);                       // blue knitwear on the drawer top (reference)
    for (let k = 0; k < nD; k++) {
      const y0 = shoeY + 0.022 + k * dh, dr = g(), fz = zc - 0.018, dd = 0.5;
      dr.add(box(dsw - 0.006, dh - 0.006, 0.018, OAKP, dcx, y0 + 0.003, fz, 0.002));
      dr.add(box(dsw * 0.5, 0.01, 0.003, GROOVE, dcx, y0 + dh - 0.03, fz + 0.018));       // finger-groove line (flush, 3 mm)
      dr.add(box(dsw - 0.05, 0.012, dd, OAKP, dcx, y0 + 0.02, fz - dd));
      for (const sx of [-1, 1]) dr.add(box(0.012, dh - 0.05, dd, OAKP, dcx + sx * (dsw / 2 - 0.031), y0 + 0.02, fz - dd));
      dr.add(box(dsw - 0.05, dh - 0.05, 0.012, OAKP, dcx, y0 + 0.02, fz - dd));
      dr.add(loose(box(0.24, Math.min(0.06, dh - 0.08), 0.3, CL([0xe9e6de, 0x8a8f96, 0x2b3a55, 0xd8c8b0, 0xf2f0ea][k]), dcx - 0.12, y0 + 0.032, fz - 0.42, 0.01)));
      dr.add(loose(box(0.24, Math.min(0.05, dh - 0.08), 0.3, CL([0x9fb7d3, 0xf2f0ea, 0x6e7651, 0x4d6f96, 0xc9c6bf][k]), dcx + 0.13, y0 + 0.032, fz - 0.42, 0.01)));
      tagGroup(dr, { type: 'slide', slide: [0, 0, 0.36], label: 'wardrobe drawer', fitted: true }); root.add(dr);
    }
    sneaker(dcx - 0.15, base, 0.2, 0xf3f1ec); sneaker(dcx + 0.14, base, 0.2, 0xd9cfc0);
    sneaker(dx1 + 0.03 + (L1 - dx1) / 2 - 0.12, base, 0.2, 0x2b2d31); sneaker(dx1 + 0.03 + (L1 - dx1) / 2 + 0.12, shoeY + 0.022, 0.2, 0xf3f1ec);
    // ---- right bay (+x): shelves with folded linen + baskets, long-hang rail, shoe tier
    shelf(R0, R1, S1); shelf(R0, R1, S2); ledUnder(R0, R1, S1);
    stack(R0 + 0.2, S1 + 0.022, 0.2, 5, [0xf3f1ec, 0xe9e6de]); stack(R0 + 0.56, S1 + 0.022, 0.2, 4, [0x8a8f96, 0x9a9fa6]); stack(R0 + 0.92, S1 + 0.022, 0.2, 5, [0xd8c8b0]);
    const BASK = () => M('Handwoven jute', 0xb59a6a);
    for (const bx of [R0 + 0.25, R0 + 0.63, R0 + 0.98]) root.add(loose(box(0.3, 0.26, 0.38, BASK, bx, S2 + 0.022, 0.08, 0.02)));
    rail(R0, R1, RAIL);
    const longs = [[0xc8b08a, 1.15], [0x2b2d31, 1.2], [0xf2efe8, 1.25], [0x6e7651, 1.05], [0x8a8f96, 0.95], [0x4a3428, 1.1], [0xe6dccb, 1.2]];
    longs.forEach(([c, len], k) => garment(R0 + 0.11 + k * (R1 - R0 - 0.2) / (longs.length - 1), RAIL, zMid, len, c, true));
    shelf(R0, R1, shoeY);
    [0xf3f1ec, 0x6b4a32, 0x2b2d31].forEach((c, k) => sneaker(R0 + 0.2 + k * 0.38, base, 0.2, c));
    [0xd9cfc0, 0xf3f1ec].forEach((c, k) => sneaker(R0 + 0.2 + k * 0.38, shoeY + 0.022, 0.2, c));
    return { obj: root, moods };
  }
  /* ================= Bedroom 2 study wall (owner 2026-11-10, references/bedroom-2/2026-11-10_dark-study-slat-wall.png) =================
     South (desk) wall, end to end, desk + chair untouched. Local frame: origin at the EAST end of the wall (door corner), +x runs WEST,
     +z into the room (placed with ry = π). Door-leaf zone: x < leafTo below leafTop → only flat (≤ 7 mm) finishes. */
  function studyWallDark({ length = 3.1, leafTo = 1.0, leafTop = 2.32, ceiling = 2.98, desk = [1.40, 3.0] } = {}) {
    const root = g(), moods = { strips: [], halos: [] }, WAL = WOOD, DARKW = () => M('__study_dark_green', 0x2f3532), SK = 0.004;
    root.add(box(length, ceiling, SK, DARKW, length / 2, 0, 0));
    // slats: flat 3 mm slat-look veneer in the door zone, real 35 mm slats above the door, a tall real panel at the west end
    for (let x = 0.03; x < leafTo - 0.02; x += 0.06) { root.add(box(0.04, leafTop - 0.02, 0.003, WAL, x, 0.01, SK)); root.add(box(0.04, ceiling - leafTop - 0.01, 0.03, WAL, x, leafTop, SK, 0.003)); }
    root.add(box(leafTo, 0.012, 0.035, () => M('__study_slat_rail', 0x1d1f1e), leafTo / 2, leafTop - 0.006, SK));
    const tw0 = length - 0.52, tw1 = length - 0.06;                                  // tall slat panel (west end), desk top → 2.3 m
    root.add(box(tw1 - tw0, 2.3 - 0.75, 0.01, () => M('__slat_backing', 0x1b1714), (tw0 + tw1) / 2, 0.75, SK));
    for (let x = tw0 + 0.025; x < tw1 - 0.01; x += 0.055) root.add(box(0.035, 2.3 - 0.76, 0.035, WAL, x, 0.755, SK + 0.01, 0.003));
    // long walnut shelf on top of the tall panel, with plant, books, brass orb + LED wash down the slats
    root.add(box(1.0, 0.04, 0.24, WAL, length - 0.55, 2.3, SK, 0.004));
    const pp = g(); pp.add(cyl(0.06, 0.05, 0.12, () => M('__pot_black', 0x1a1a1a), 0, 0, 0, 18)); for (let k = 0; k < 9; k++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), M('__leaf_green', 0x5f7d3e)); lf.scale.set(0.5, 1.6, 0.25); lf.rotation.set(0.5 * Math.cos(k), k * 0.7, 0.45 * Math.sin(k)); lf.position.set(Math.cos(k * 0.7) * 0.04, 0.2, Math.sin(k * 0.7) * 0.04); pp.add(lf); }
    pp.position.set(length - 0.2, 2.34, 0.12); root.add(loose(pp));
    for (let k = 0; k < 4; k++) root.add(loose(box(0.2, 0.03, 0.15, () => M('__book_study_d' + k, [0x6b4a32, 0x2e3f5c, 0xc9a77a, 0x3a3631][k]), length - 0.65, 2.34 + k * 0.03, 0.05)));
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 18, 12), BRASS()); orb.position.set(length - 0.45, 2.385, 0.12); root.add(loose(orb));
    const sw = ledStrip({ w: 0.95, wash: 0.9, dir: 'down', alpha: 0.4 }); sw.obj.position.set(length - 0.55, 2.295, SK + 0.05); root.add(sw.obj); moods.strips.push(...sw.moods.strips); moods.halos.push(...sw.moods.halos);
    // hanging planter from a black bracket under the shelf's east end
    const hb = g(); hb.add(box(0.03, 0.03, 0.22, () => M('__bracket_black', 0x141414), 0, 0, 0)); for (const sx of [-1, 1]) { const rope = cyl(0.002, 0.002, 0.35, () => M('__jute_rope', 0xc9b48a), sx * 0.04, -0.35, 0.2, 5); rope.rotation.z = sx * 0.1; hb.add(rope); }
    hb.add(cyl(0.07, 0.05, 0.11, () => M('__pot_black', 0x1a1a1a), 0, -0.46, 0.2, 18)); for (let k = 0; k < 10; k++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), M('__leaf_green', 0x5f7d3e)); lf.scale.set(1, 0.4, 0.7); lf.position.set(Math.cos(k * 2.1) * 0.07, -0.33 - (k % 4) * 0.05, 0.2 + Math.sin(k * 2.1) * 0.06); hb.add(lf); }
    hb.position.set(desk[0] + 1.1, 2.28, SK); root.add(loose(hb));
    // framed sci-fi blueprints (original line art) above the monitor
    const blueprint = seed => (x, w, h) => { x.fillStyle = '#16191b'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d9b76a'; x.lineWidth = 2; x.strokeRect(10, 10, w - 20, h - 20);
      x.lineWidth = 1.6; const cx = w / 2, cy = h * 0.55; x.beginPath(); if (seed === 0) { x.arc(cx, cy, w * 0.28, 0, 7); x.moveTo(cx + w * 0.28, cy); x.lineTo(cx + w * 0.4, cy - 30); x.lineTo(cx + w * 0.4, cy + 30); x.closePath(); x.moveTo(cx - 20, cy); x.arc(cx, cy, 20, Math.PI, 3 * Math.PI); }
      else { x.moveTo(cx - w * 0.3, cy - h * 0.2); x.lineTo(cx - w * 0.3, cy + h * 0.2); x.moveTo(cx + w * 0.3, cy - h * 0.2); x.lineTo(cx + w * 0.3, cy + h * 0.2); x.moveTo(cx - w * 0.3, cy); x.lineTo(cx + w * 0.3, cy); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); } x.moveTo(cx + 28, cy); x.arc(cx, cy, 28, 0, 7); }
      x.stroke(); x.fillStyle = '#d9b76a'; x.font = '14px monospace'; x.fillText(seed ? 'TWIN-ION SCOUT  · SCALE 1:72' : 'LIGHT FREIGHTER  · SCALE 1:144', 18, 34); for (let k = 0; k < 6; k++) x.fillRect(18, h - 60 + k * 7, 60 + (k * 37) % 90, 2); };
    const bpFrame = (w2, h2, seed, x2, y2) => { const f = g(); f.add(box(w2, h2, 0.025, () => M('__frame_black', 0x111111), 0, 0, 0, 0.003)); const pl = new THREE.Mesh(new THREE.PlaneGeometry(w2 - 0.04, h2 - 0.04), new THREE.MeshStandardMaterial({ map: canvasTex(320, Math.round(320 * h2 / w2), blueprint(seed)), roughness: 0.8, name: '__blueprint_' + seed })); pl.position.set(0, h2 / 2, 0.026); f.add(pl); f.position.set(x2, y2, SK); root.add(f); };
    bpFrame(0.42, 0.62, 1, desk[0] + 0.22, 1.55); bpFrame(0.42, 0.62, 0, desk[0] + 0.72, 1.55);   // above the monitor, clear of the planter and lamp
    // between the desk and the door zone: short slat panel under a small shelf (retro radio, succulent), column of three small prints above
    const r0 = leafTo + 0.02, r1 = desk[0] - 0.02, rc = (r0 + r1) / 2;
    root.add(box(r1 - r0, 0.5, 0.01, () => M('__slat_backing', 0x1b1714), rc, 1.0, SK)); for (let x = r0 + 0.02; x < r1 - 0.01; x += 0.05) root.add(box(0.032, 0.5, 0.03, WAL, x, 1.0, SK + 0.01, 0.003));
    root.add(box(r1 - r0 + 0.04, 0.035, 0.2, WAL, rc, 1.5, SK, 0.004)); const sl = led(0xffc88a, 2.2); moods.strips.push(sl); root.add(box(r1 - r0 - 0.04, 0.006, 0.01, sl, rc, 1.494, 0.17));
    const radio = g(); radio.add(box(0.2, 0.12, 0.1, () => M('__radio_wood', 0x6b3f22), 0, 0, 0, 0.012)); radio.add(box(0.12, 0.07, 0.004, () => M('__speaker_grille_brass', 0xa8915f), -0.03, 0.025, 0.1)); radio.add(cyl(0.012, 0.012, 0.01, BRASS, 0.065, 0.06, 0.1, 12));
    radio.position.set(rc - 0.04, 1.535, 0.05); root.add(loose(radio)); const suc = g(); suc.add(cyl(0.03, 0.025, 0.05, () => M('__pot_white', 0xf2eee8), 0, 0, 0, 14)); suc.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), M('__leaf_green', 0x5f7d3e))); suc.children[1].position.y = 0.06; suc.position.set(rc + 0.12, 1.535, 0.1); root.add(loose(suc));
    for (let k = 0; k < 3; k++) { const f = g(); f.add(box(0.28, 0.36, 0.02, () => M('__frame_black', 0x111111), 0, 0, 0, 0.003)); const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.32), new THREE.MeshStandardMaterial({ map: canvasTex(160, 214, (x, w, h) => { x.fillStyle = '#16191b'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d9b76a'; x.lineWidth = 1.5; x.beginPath(); x.arc(w / 2, h * 0.4, 30 - k * 4, 0, 7); x.moveTo(w / 2 - 30, h * 0.4); x.lineTo(w / 2 + 30, h * 0.4); x.moveTo(w / 2, h * 0.4 - 30); x.lineTo(w / 2, h * 0.75); x.stroke(); x.fillStyle = '#d9b76a'; x.fillRect(20, h - 30, 80, 2); }), roughness: 0.8, name: '__mini_print_' + k })); pl.position.set(0, 0.18, 0.021); f.add(pl); f.position.set(rc, 1.62 + k * 0.4, SK); root.add(f); }
    // wall-mounted industrial pipe lamp with an Edison bulb (no floor room beside the desk)
    const pl = g(), PIPE = () => M('__pipe_black', 0x1c1c1c); pl.add(cyl(0.035, 0.035, 0.012, PIPE, 0, 0, 0.006, 16)); pl.children[0].rotation.x = Math.PI / 2;
    const arm = cyl(0.012, 0.012, 0.3, PIPE, 0, 0, 0, 10); arm.rotation.x = Math.PI / 2; arm.position.set(0, 0, 0.16); pl.add(arm); const elb = cyl(0.012, 0.012, 0.12, PIPE, 0, -0.12, 0.31, 10); pl.add(elb);
    const bm = led(0xffb860, 2.8); moods.strips.push(bm); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 12), new THREE.MeshPhysicalMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.35, roughness: 0.05, name: '__edison_glass', depthWrite: false })); bulb.scale.y = 1.25; bulb.position.set(0, -0.19, 0.31); pl.add(bulb);
    const fil = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), bm); fil.position.set(0, -0.19, 0.31); pl.add(fil);
    pl.position.set(length - 0.3, 1.55, SK); root.add(loose(pl));
    const cove = ledStrip({ w: length - 0.05, wash: 0.5, dir: 'down', alpha: 0.28 }); cove.obj.position.set(length / 2, ceiling - 0.03, SK + 0.01); root.add(cove.obj); moods.strips.push(...cove.moods.strips); moods.halos.push(...cove.moods.halos);
    return { obj: root, moods };
  }
  /* ================= Teak heritage room (master option 4, owner 2026-11-10: the heritage TV wall's vibe on every wall) ================= */
  const HTEAK = () => M('__teak_dark', 0x4e2c18), HWALL = () => M('__heritage_offwhite', 0xe6dccd);
  const hFrame = (w, h, draw, frame = 0x4e2c18, matName) => { const f = g(); f.add(box(w, h, 0.03, () => M('__frame_' + frame.toString(16), frame), 0, 0, 0, 0.004));
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.07, h - 0.07), new THREE.MeshStandardMaterial({ map: canvasTex(384, Math.round(384 * h / w), draw), roughness: 0.9, name: matName || ('__heritage_art_' + Math.random().toString(36).slice(2, 7)) })); pl.position.set(0, h / 2, 0.031); f.add(pl); return f; };
  const pichwai = (x, w, h) => { const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#1f3b4d'); sky.addColorStop(1, '#2f5a4a'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 40; k++) { x.fillStyle = k % 2 ? '#e8b4b8' : '#f3e9d8'; x.beginPath(); x.ellipse(Math.random() * w, h * 0.72 + Math.random() * h * 0.25, 10, 6, 0, 0, 7); x.fill(); }   // lotus pond
    for (const [cx, cy, s2] of [[w * 0.3, h * 0.55, 1], [w * 0.68, h * 0.58, 0.85]]) { x.fillStyle = '#f4efe6'; x.beginPath(); x.ellipse(cx, cy, 58 * s2, 30 * s2, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx + 52 * s2, cy - 22 * s2, 18 * s2, 14 * s2, 0, 0, 7); x.fill();   // cows
      x.fillStyle = '#c0392b'; x.fillRect(cx - 20 * s2, cy - 30 * s2, 40 * s2, 8 * s2); x.strokeStyle = '#f4efe6'; x.lineWidth = 6 * s2; for (const lx of [-35, -15, 15, 35]) { x.beginPath(); x.moveTo(cx + lx * s2, cy + 20 * s2); x.lineTo(cx + lx * s2, cy + 52 * s2); x.stroke(); } }
    x.fillStyle = '#2d6a3e'; for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(w * (0.1 + k * 0.16), h * 0.2, 30, 0, 7); x.fill(); }
    x.strokeStyle = '#c9a54a'; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16); };
  const miniature = i => (x, w, h) => { x.fillStyle = ['#e9d9b4', '#d9c49a', '#e4cfa6'][i]; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a2e1e'; x.lineWidth = 10; x.strokeRect(12, 12, w - 24, h - 24);
    x.fillStyle = ['#2f5a4a', '#8a2e1e', '#2e3f5c'][i]; x.beginPath(); x.moveTo(w * 0.5, h * 0.18); x.quadraticCurveTo(w * 0.85, h * 0.25, w * 0.75, h * 0.55); x.lineTo(w * 0.25, h * 0.55); x.quadraticCurveTo(w * 0.15, h * 0.25, w * 0.5, h * 0.18); x.fill();   // arch / palace
    x.fillStyle = '#c9a54a'; x.beginPath(); x.arc(w * 0.5, h * 0.42, w * 0.08, 0, 7); x.fill(); x.fillStyle = '#3a2416'; x.fillRect(w * 0.3, h * 0.6, w * 0.4, h * 0.22); };
  const brassLota = (s2 = 1) => { const l = g(); const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s2, 18, 12), BRASS()); b1.scale.y = 0.85; b1.position.y = 0.055 * s2; l.add(b1); l.add(cyl(0.025 * s2, 0.035 * s2, 0.06 * s2, BRASS, 0, 0.1 * s2, 0, 14)); l.add(cyl(0.04 * s2, 0.03 * s2, 0.012 * s2, BRASS, 0, 0.16 * s2, 0, 14)); return loose(l); };
  /* east wall (heritage): off-white, teak skirting + dado rail, teak-panelled hidden walk-in door (cane inset, brass ring pull),
     carved teak jharokha arch with a brass diya shelf, pichwai painting over a teak shelf of brass lotas, picture light. Local frame = panelWall. */
  function heritageEastWall({ length = 3.7, door = [1.03, 2.0], ceiling = 2.85, jharokhaAt = 0.5, artAt = 2.85 } = {}) {
    const root = g(), moods = { strips: [], halos: [] }, d = 0.025;
    for (const [a, b] of [[0, door[0]], [door[1], length]]) root.add(box(b - a, ceiling, 0.008, HWALL, (a + b) / 2, 0, 0));
    for (const [a, b] of [[0, door[0]], [door[1], length]]) root.add(box(b - a, 0.1, 0.022, HTEAK, (a + b) / 2, 0, 0));
    const jx0 = jharokhaAt - 0.33, jx1 = jharokhaAt + 0.33;                         // dado rail stops at the jharokha frame
    for (const [a, b] of [[0, jx0], [jx1, door[0]], [door[1], length]]) if (b - a > 0.02) root.add(box(b - a, 0.035, 0.03, HTEAK, (a + b) / 2, 0.9, 0, 0.004));
    // hidden walk-in door = a teak panelled door with a cane inset and a brass ring pull (push-to-open, opens into the closet)
    const dw = door[1] - door[0], dr = g();
    dr.add(box(dw - 0.006, ceiling - 0.006, d, HTEAK, dw / 2, 0.003, 0));
    for (const [y0, h0] of [[0.18, 0.75], [1.05, 1.45]]) { dr.add(box(dw - 0.2, h0, 0.008, () => M('__teak_panel_raised', 0x5e3820), dw / 2, y0, d)); }
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.32, 1.2), caneTex()); cp.position.set(dw / 2, 1.05 + 0.725, d + 0.0095); dr.add(cp);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.006, 8, 24), BRASS()); ring.position.set(dw - 0.12, 1.0, d + 0.02); dr.add(ring); dr.add(cyl(0.015, 0.015, 0.012, BRASS, dw - 0.12, 1.04, d + 0.006, 12));
    dr.position.set(door[0], 0, 0); tagGroup(dr, { type: 'cab', hinge: [door[0], 0, 0], a1: Math.PI * 0.5, label: 'hidden walk-in door', fitted: true }); root.add(dr);   // fitted: a room door, no cupboard interior (the auto hole cut the shared teak material away)
    // carved teak jharokha (arched window frame, 30 mm relief) with a brass diya shelf, warm backlight
    const jw = 0.62, jh = 1.5, jy = 0.65, ar = jw / 2, js = new THREE.Shape(); js.moveTo(-jw / 2, 0); js.lineTo(jw / 2, 0); js.lineTo(jw / 2, jh - ar); js.absarc(0, jh - ar, ar, 0, Math.PI, false); js.lineTo(-jw / 2, 0);
    const jin = new THREE.Path(), iw = jw / 2 - 0.06; jin.moveTo(-iw, 0.06); jin.lineTo(iw, 0.06); jin.lineTo(iw, jh - ar); for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI, rr = iw * (k % 2 ? 0.9 : 1); jin.lineTo(Math.cos(a) * rr, jh - ar + Math.sin(a) * rr); } jin.lineTo(-iw, 0.06); js.holes.push(jin);   // cusped inner arch
    const jm = new THREE.Mesh(new THREE.ExtrudeGeometry(js, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 24 }), HTEAK()); jm.position.set(jharokhaAt, jy, 0.008); root.add(jm);
    const glow = led(0xffb870, 1.2); moods.strips.push(glow); const gm = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(jin.getPoints(30)), 20), glow); gm.position.set(jharokhaAt, jy, 0.009); root.add(gm);
    root.add(box(0.4, 0.025, 0.14, HTEAK, jharokhaAt, jy + 0.55, 0.008, 0.004));
    const dy = g(); const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), BRASS()); bowl.position.y = 0.04; dy.add(bowl); const fl = led(0xffb060, 2.8); moods.strips.push(fl); const flame = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), fl); flame.scale.y = 1.8; flame.position.set(0.025, 0.055, 0); dy.add(flame); dy.position.set(jharokhaAt, jy + 0.575, 0.08); root.add(loose(dy));
    // pichwai painting over a floating teak shelf with brass lotas + urli; brass picture light
    const art = hFrame(1.1, 0.8, pichwai, 0x4e2c18, '__pichwai'); art.position.set(artAt, 1.25, 0.008); root.add(art);
    const pl = led(0xffd2a0, 2.4); moods.strips.push(pl); root.add(box(0.5, 0.02, 0.06, BRASS, artAt, 2.1, 0.02)); root.add(box(0.46, 0.006, 0.01, pl, artAt, 2.095, 0.07));
    root.add(box(1.2, 0.04, 0.24, HTEAK, artAt, 0.95, 0.008, 0.004));
    for (const [lx, s2] of [[-0.42, 1], [-0.3, 0.75], [0.36, 0.9]]) { const lt = brassLota(s2); lt.position.set(artAt + lx, 0.99, 0.12); root.add(lt); }
    const urli = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), BRASS()); urli.scale.y = 0.35; urli.position.set(artAt, 1.035, 0.13); root.add(loose(urli));
    for (const [a, b] of [[0.05, jx0], [jx1, door[0] - 0.02], [door[1] + 0.02, length - 0.05]]) if (b - a > 0.1) { const up = ledStrip({ w: b - a, wash: 0.5, dir: 'up', alpha: 0.35 }); up.obj.position.set((a + b) / 2, 0.94, 0.035); root.add(up.obj); moods.strips.push(...up.moods.strips); moods.halos.push(...up.moods.halos); }   // dado up-light skips the door + jharokha
    return { obj: root, moods };
  }
  const caneTex = () => new THREE.MeshStandardMaterial({ roughness: 0.75, name: '__cane_webbing_door', map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#d9bf8f'; x.fillRect(0, 0, w, h); x.fillStyle = '#5a4630'; for (let r = 0; r < 17; r++) for (let c = 0; c < 17; c++) { x.beginPath(); x.arc(c * 16 + (r % 2) * 8, r * 16, 4.2, 0, 7); x.fill(); } }) });
  /* west wall (heritage): teak panelled wainscot to 1.0 m with woven insets, teak rail, off-white plaster, three miniature paintings,
     brass bell sconces over the bed. Local frame = softWall (centred, length along x). Depth ≤ 40 mm (the bed side stands against it). */
  function heritageWestWall({ length = 4.03, ceiling = 2.85, art = [-0.9, 0.0, 0.9], sconces = [] } = {}) {
    const root = g(), moods = { strips: [], halos: [] }, wH = 1.0, weave = new THREE.MeshStandardMaterial({ roughness: 0.9, name: '__diamond_weave_wall', map: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#e9e4da'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8f8a82'; x.lineWidth = 3; for (let r = -1; r < 9; r++) for (let c = -1; c < 9; c++) { const cx2 = c * 32 + (r % 2) * 16, cy2 = r * 32; x.beginPath(); x.moveTo(cx2, cy2 - 14); x.lineTo(cx2 + 14, cy2); x.lineTo(cx2, cy2 + 14); x.lineTo(cx2 - 14, cy2); x.closePath(); x.stroke(); } }) });
    root.add(box(length, ceiling, 0.006, HWALL, 0, 0, 0));
    root.add(box(length, wH, 0.018, HTEAK, 0, 0, 0.006));
    const n = Math.round(length / 0.6), pw = length / n;
    for (let k = 0; k < n; k++) { const cx = -length / 2 + pw / 2 + k * pw; root.add(box(pw - 0.12, wH - 0.3, 0.004, HTEAK, cx, 0.17, 0.024)); const wp = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.18, wH - 0.36), weave); wp.position.set(cx, 0.17 + (wH - 0.3) / 2, 0.0285); root.add(wp); }
    root.add(box(length, 0.04, 0.035, HTEAK, 0, wH, 0.006, 0.005));
    art.forEach((ax, i) => { const f = hFrame(0.42, 0.56, miniature(i), 0x4e2c18, '__miniature_' + i); f.position.set(ax, 1.38, 0.006); root.add(f); });
    for (const sx of sconces) { const sc = g(); sc.add(box(0.08, 0.14, 0.02, BRASS, 0, 0, 0, 0.006)); const arm = cyl(0.006, 0.006, 0.14, BRASS, 0, 0, 0, 8); arm.rotation.x = Math.PI / 2; arm.position.set(0, 0.1, 0.08); sc.add(arm);
      const bm = led(0xffd9a0, 2.4); moods.strips.push(bm); const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.1, 20, 1, true), BRASS()); bell.material.side = THREE.DoubleSide; bell.position.set(0, 0.06, 0.15); sc.add(bell); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), bm); bulb.position.set(0, 0.035, 0.15); sc.add(bulb);
      sc.position.set(sx, 1.55, 0.006); root.add(loose(sc)); }
    const up = ledStrip({ w: length - 0.1, wash: 0.45, dir: 'up', alpha: 0.35 }); up.obj.position.set(0, wH + 0.04, 0.04); root.add(up.obj); moods.strips.push(...up.moods.strips); moods.halos.push(...up.moods.halos);
    return { obj: root, moods };
  }
  /* teak ceiling beams running east–west (parallel to the TV wall: they never cross the projector screen cassette or the beam) */
  function heritageBeams({ width = 3.658, zs = [1.5, 2.6, 3.7], ceiling = 2.85, plateZ = [] } = {}) {
    const root = g(), moods = { strips: [], halos: [] };
    for (const z of zs) { root.add(box(width, 0.15, 0.12, HTEAK, width / 2, ceiling - 0.15, z - 0.06, 0.006)); for (const bx of [0.06, width - 0.06]) root.add(box(0.1, 0.12, 0.14, HTEAK, bx, ceiling - 0.27, z - 0.07, 0.01)); }
    for (const z of plateZ) root.add(box(width, 0.14, 0.12, HTEAK, width / 2, ceiling - 0.14, z - 0.06, 0.006));
    return { obj: root, moods };
  }
  /* hand-woven dhurrie rug (rust / indigo / ochre, tasselled ends) */
  function dhurrieRug({ w = 2.4, l = 2.0 } = {}) {
    const t = canvasTex(512, 428, (x, W, H) => { x.fillStyle = '#e9dcc3'; x.fillRect(0, 0, W, H); const cols = ['#8a3b22', '#2e3f5c', '#c9963a'];
      for (let k = 0; k < 6; k++) { x.fillStyle = cols[k % 3]; x.fillRect(0, 30 + k * 66, W, 10); }
      for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { const cx = 40 + c * 72, cy = 70 + r * 66; x.fillStyle = cols[(r + c) % 3]; x.beginPath(); x.moveTo(cx, cy - 18); x.lineTo(cx + 18, cy); x.lineTo(cx, cy + 18); x.lineTo(cx - 18, cy); x.fill(); }
      x.strokeStyle = '#8a3b22'; x.lineWidth = 12; x.strokeRect(6, 6, W - 12, H - 12); });
    const root = g(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.008, l), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, name: '__dhurrie' })); m.position.set(0, 0.004, l / 2); root.add(m);
    for (const zz of [-0.02, l + 0.02]) for (let x = -w / 2 + 0.03; x < w / 2; x += 0.05) root.add(box(0.012, 0.004, 0.05, () => M('__tassel', 0xe2d5bd), x, 0, zz - 0.025));
    return { obj: loose(root) };
  }
  /* brass jaali lantern pendant (short: hangs above the projector beam) */
  function brassLantern({ ceiling = 2.85, drop = 0.3 } = {}) {
    const root = g(), moods = { strips: [] }; root.add(cyl(0.003, 0.003, drop, BRASS, 0, ceiling - drop, 0, 6));
    const jaali = new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.8, roughness: 0.35, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, name: '__brass_jaali', alphaMap: canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#000'; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { x.beginPath(); x.arc(c * 16 + 8, r * 16 + 8, 4, 0, 7); x.fill(); } }) });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.26, 16, 1, true), jaali); body.position.y = ceiling - drop - 0.13; root.add(body);
    root.add(cyl(0.02, 0.1, 0.05, BRASS, 0, ceiling - drop, 0, 16)); root.add(cyl(0.13, 0.05, 0.03, BRASS, 0, ceiling - drop - 0.29, 0, 16));
    const bl = led(0xffc070, 3); moods.strips.push(bl); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), bl); bulb.position.y = ceiling - drop - 0.13; root.add(bulb);
    return { obj: loose(root), moods };
  }
  /* west wall: upholstered linen channel wainscot + oak rail + warm plaster + two framed prints */
  function softWall({ length = 4.1, ceiling = 2.85, prints = [1.4, 2.6] } = {}) {
    const root = g(), linen = () => M('__linen_wainscot', 0xcdbfa8), plaster = () => M('__warm_plaster', 0xd8cab4), wH = 1.12;
    root.add(box(length, ceiling, 0.006, plaster, 0, 0, 0));
    const n = Math.floor(length / 0.2); const cw = length / n;
    for (let k = 0; k < n; k++) root.add(box(cw - 0.008, wH - 0.08, 0.035, linen, -length / 2 + cw / 2 + k * cw, 0.07, 0.006, 0.015));
    root.add(box(length, 0.07, 0.03, PS5B, 0, 0, 0.006)); root.add(box(length, 0.035, 0.06, OAK, 0, wH - 0.01, 0.006, 0.005));
    prints.forEach((px, i) => { const t2 = canvasTex(300, 400, (x, w, h) => { x.fillStyle = '#efe7da'; x.fillRect(0, 0, w, h); x.fillStyle = ['#8a9a6c', '#b38b6d'][i]; x.beginPath(); x.ellipse(w / 2, h * 0.45, 90, 130, i ? 0.4 : -0.3, 0, 7); x.fill(); x.strokeStyle = '#3b2f27'; x.lineWidth = 3; x.beginPath(); x.moveTo(w / 2, h * 0.9); x.quadraticCurveTo(w * (0.3 + i * 0.4), h * 0.5, w / 2, h * 0.12); x.stroke(); });
      root.add(box(0.64, 0.84, 0.03, PS5B, px - length / 2, 1.45, 0.006)); const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.78), new THREE.MeshStandardMaterial({ map: t2, roughness: 0.9, name: '__print_' + i })); pm.position.set(px - length / 2, 1.87, 0.037); root.add(pm); });
    return { obj: root };
  }
  /* free-standing upholstered channel headboard wall (bed back towards the balcony sliders); local front +z = bed side */
  function headboardWallFS({ w = 2.95, h = 1.45, bedW = 1.95, fabric = () => M('__boucle_oat', 0xb7a994) } = {}) {
    const root = g(), moods = { strips: [] };
    root.add(box(w, h, 0.1, OAK, 0, 0, 0, 0.006));
    const n = Math.round(w / 0.16), cw = w / n;
    for (let k = 0; k < n; k++) root.add(box(cw - 0.01, h - 0.2, 0.06, fabric, -w / 2 + cw / 2 + k * cw, 0.12, 0.1, 0.025));
    root.add(box(w + 0.04, 0.04, 0.22, OAK, 0, h, -0.06, 0.006));                                     // ledge (books, phones)
    const wash = led(0xffc890, 2.4), path = led(0xffc890, 2), up = led(0xffc890, 2.2); moods.strips.push(wash, path, up);
    root.add(box(w - 0.06, 0.008, 0.012, wash, 0, h - 0.012, 0.15));                                // washes the channels
    root.add(box(w - 0.06, 0.008, 0.012, up, 0, h + 0.04, -0.05));                                  // up-light onto the curtains
    root.add(box(w - 0.1, 0.008, 0.012, path, 0, 0.05, -0.005));                                    // path light in the balcony walkway
    for (const sx of [-1, 1]) {                                                                     // cantilevered bedside drawers
      const nx = sx * (bedW / 2 + 0.03 + 0.21);
      root.add(box(0.42, 0.16, 0.38, OATL, nx, 0.42, 0.1, 0.01));
      const dr = g(); dr.add(box(0.4, 0.13, 0.018, OATL, nx, 0.435, 0.48, 0.004)); dr.add(box(0.12, 0.01, 0.012, BRASS, nx, 0.52, 0.498));
      tagGroup(dr, { type: 'slide', slide: [0, 0, 0.26], label: 'bedside drawer' }); root.add(dr);
      const arm = g(); arm.add(box(0.06, 0.1, 0.02, PS5B, 0, 0, 0)); const rod = cyl(0.006, 0.006, 0.3, PS5B, 0, 0, 0, 8); rod.rotation.x = Math.PI / 2; rod.position.set(0, 0.06, 0.16); arm.add(rod);
      arm.add(cyl(0.03, 0.035, 0.07, PS5B, 0, 0, 0.3, 16)); arm.children[arm.children.length - 1].position.y = 0.02; arm.add(box(0.03, 0.004, 0.03, led(0xffd6a0, 3), 0, 0.016, 0.285));
      arm.position.set(nx, 1.0, 0.16); root.add(loose(arm));
    }
    return { obj: root, moods };
  }
  /* CNC wood cut-out (jali) screen wall, full height, standing 40 mm off the wall / curtains: arch + circle motif,
     warm backlight glowing through the cut-outs where solid wall is behind (glow: [from, to] in local x), LED top & toe.
     Local frame: back at z 0, front +z, centred on x. */
  function jaliWall({ length = 2.75, height = 2.85, panels = 5, standoff = 0.04, glow = null, wood = WOOD } = {}) {
    const root = g(), moods = { strips: [] }, gap = 0.006, t = 0.018, pw = (length - gap * (panels - 1)) / panels, x0 = -length / 2;
    const archHole = (cx, y, w, h) => { const p = new THREE.Path(); p.moveTo(cx - w / 2, y); p.lineTo(cx + w / 2, y); p.lineTo(cx + w / 2, y + h - w / 2); p.absarc(cx, y + h - w / 2, w / 2, 0, Math.PI, false); p.lineTo(cx - w / 2, y); return p; };
    const circHole = (cx, cy, r) => { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); return p; };
    const woodM = typeof wood === 'function' ? wood() : wood;
    for (let k = 0; k < panels; k++) {
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(pw, 0); sh.lineTo(pw, height); sh.lineTo(0, height); sh.lineTo(0, 0);
      const cols = 2, hw = 0.11, hh = 0.3, rowH = 0.44, y0 = 0.22;
      for (let r = 0; y0 + r * rowH + hh < height - 0.2; r++) {
        const off = (r % 2) * 0.5;
        for (let c = 0; c < cols; c++) {
          const cx = pw * ((c + 0.5 + off * (c === 0 ? 1 : -1) * 0) / cols);
          sh.holes.push(archHole(cx, y0 + r * rowH, hw, hh));
          if (y0 + r * rowH + hh + 0.09 < height - 0.2) sh.holes.push(circHole(cx, y0 + r * rowH + hh + 0.07, 0.035));
        }
        if (r % 2) sh.holes.push(circHole(pw / 2, y0 + r * rowH + hh / 2, 0.045));
      }
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 10 }), woodM);
      m.position.set(x0 + k * (pw + gap), 0.02, standoff); root.add(m);
    }
    root.add(box(length + 0.04, 0.07, standoff + t + 0.02, wood, 0, height + 0.02, 0, 0.004));          // top fascia
    root.add(box(length, 0.02, standoff + t, PS5B, 0, 0, 0));                                              // shadow-gap plinth
    const top = led(0xffc880, 2.4), toe = led(0xffc880, 2); moods.strips.push(top, toe);
    root.add(box(length - 0.04, 0.008, 0.01, top, 0, height - 0.01, standoff - 0.012));
    root.add(box(length - 0.04, 0.006, 0.006, toe, 0, 0.026, standoff + t + 0.004));
    if (glow) {   // warm backlit panel behind the cut-outs where there is solid wall (glass areas get daylight through the sheer)
      const gm = led(0xffb870, 0.9); moods.strips.push(gm);
      root.add(box(glow[1] - glow[0], height - 0.12, 0.004, gm, (glow[0] + glow[1]) / 2, 0.06, 0.006));
    }
    return { obj: root, moods, z: z0 + depth, xs, top, headY };
  }

  /* LED strip + its soft light wash (additive gradient plane): dir 'up' / 'down' on the wall plane, 'floor' on the floor
     (spreading towards +z). The wash material is registered as a mood 'halo' so it follows Normal / Gaming / Movie / Off. */
  function ledStrip({ w = 1, colour = 0xffc880, power = 2.6, wash = 0.35, dir = 'up', alpha = 0.6 } = {}) {
    const root = g(), moods = { strips: [], halos: [] }, m = led(colour, power); moods.strips.push(m);
    root.add(box(w, 0.008, 0.012, m, 0, 0, 0));
    if (wash > 0) {
      const hm = new THREE.MeshBasicMaterial({ color: colour, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, name: '__led_wash' });
      const seg = 24, pos = [], col = [], idx = [];
      for (let k = 0; k <= seg; k++) { const x = -w / 2 + w * k / seg, e = Math.min(1, Math.min(k, seg - k) / 3);
        if (dir === 'floor') pos.push(x, 0.002, 0, x, 0.002, wash); else pos.push(x, 0.004, 0.004, x, dir === 'up' ? wash : -wash, 0.004);
        col.push(1, 1, 1, alpha * e, 1, 1, 1, 0);
        if (k < seg) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); geo.setIndex(idx);
      const hp = new THREE.Mesh(geo, hm); hp.castShadow = false; root.add(hp); moods.halos.push(hm);
    }
    return { obj: root, moods };
  }

  /* carved sandstone relief wall (owner reference 2026-11-10: references/passage/2026-11-10_carved-sandstone-elephant-wall.png)
     Large-format sand-stone panels with fine joints; caparisoned elephants, temple-style corner brackets and a framed
     panel carved as REAL relief (a displaced, subdivided plane, ≈ 30 mm deep) so grazing light models it; ceiling wall
     washers graze the stone. Local frame: centred on x, back at z 0, front +z, floor at y 0. */
  function carvedStoneWall({ w = 2.94, h = 3.0, relief = 0.03, washers = 4 } = {}) {
    const root = g(), moods = { strips: [], halos: [] }, PX = 260, cw = Math.round(w * PX), chh = Math.round(h * PX);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = chh; const x = cv.getContext('2d');
    const X = m => m * PX, Y = m => chh - m * PX;                      // metres (from bottom-left) → canvas px
    x.fillStyle = '#000'; x.fillRect(0, 0, cw, chh);
    const shade = (v) => `rgb(${v},${v},${v})`;
    // ---- elephant (side view, facing +1 right / −1 left), x0/y0 = feet line centre, s = length in metres ----
    function elephant(cx, cy, s, dir, tower) {
      x.save(); x.translate(X(cx), Y(cy)); x.scale(dir * X(s) / 100, X(s) / 100);    // drawing units: body ≈ 100 long, feet at y 0, up = −y
      const B = shade(150);
      // legs first (tapered, rounded feet); far legs slightly lower relief
      const leg = (lx, top, wTop, wFoot, v) => { x.fillStyle = shade(v); x.beginPath(); x.moveTo(lx - wTop / 2, top); x.quadraticCurveTo(lx - wTop / 2 - 1, -18, lx - wFoot / 2, -4); x.quadraticCurveTo(lx - wFoot / 2, 0, lx - wFoot / 2 + 3, 0); x.lineTo(lx + wFoot / 2 - 3, 0); x.quadraticCurveTo(lx + wFoot / 2, 0, lx + wFoot / 2, -4); x.quadraticCurveTo(lx + wTop / 2 + 1, -18, lx + wTop / 2, top); x.fill();
        x.fillStyle = shade(v + 30); x.fillRect(lx - wFoot / 2, -9, wFoot, 3); };
      leg(-24, -44, 15, 13, 132); leg(26, -44, 15, 13, 132); leg(-36, -44, 16, 14, 150); leg(14, -44, 16, 14, 150);
      // body: back highest at the shoulders, belly sag, rump
      x.fillStyle = B; x.beginPath(); x.moveTo(-46, -46); x.bezierCurveTo(-50, -70, -30, -80, -4, -78); x.bezierCurveTo(18, -78, 34, -82, 42, -74);
      x.bezierCurveTo(48, -60, 44, -40, 34, -34); x.bezierCurveTo(14, -28, -14, -28, -34, -32); x.bezierCurveTo(-44, -34, -46, -40, -46, -46); x.fill();
      // head + domed forehead
      x.beginPath(); x.ellipse(44, -66, 17, 19, 0.15, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(48, -82, 9, 6, 0.2, 0, Math.PI * 2); x.fill();
      // trunk: tapering chain of discs along a curve, curled tip
      const tp = t => { const u = 1 - t; return [u * u * u * 54 + 3 * u * u * t * 68 + 3 * u * t * t * 66 + t * t * t * 58, u * u * u * -62 + 3 * u * u * t * -44 + 3 * u * t * t * -18 + t * t * t * -6]; };
      for (let k = 0; k <= 30; k++) { const t = k / 30, [px, py] = tp(t); x.beginPath(); x.arc(px, py, 7.5 - 4.5 * t, 0, Math.PI * 2); x.fill(); }
      x.lineWidth = 2.5; x.strokeStyle = B; x.beginPath(); x.arc(61, -7, 3, Math.PI * 0.2, Math.PI * 1.6); x.stroke();
      for (let k = 2; k < 28; k += 3) { const [px, py] = tp(k / 30); x.strokeStyle = shade(125); x.lineWidth = 0.8; x.beginPath(); x.moveTo(px - 5, py); x.lineTo(px + 5, py); x.stroke(); }   // trunk folds
      x.lineWidth = 4; x.strokeStyle = shade(220); x.lineCap = 'round'; x.beginPath(); x.moveTo(52, -52); x.quadraticCurveTo(62, -44, 72, -48); x.stroke();      // tusk
      x.fillStyle = shade(172); x.beginPath(); x.moveTo(34, -78); x.bezierCurveTo(22, -76, 20, -54, 28, -44); x.bezierCurveTo(36, -40, 42, -52, 40, -64); x.closePath(); x.fill();   // big soft ear
      x.fillStyle = shade(110); x.beginPath(); x.arc(49, -68, 1.6, 0, 7); x.fill();                                    // eye
      x.lineWidth = 2; x.strokeStyle = B; x.beginPath(); x.moveTo(-45, -52); x.quadraticCurveTo(-54, -38, -51, -24); x.stroke(); x.fillStyle = B; x.beginPath(); x.ellipse(-51, -22, 2.5, 4, 0, 0, 7); x.fill();   // tail + tuft
      x.strokeStyle = shade(200); x.lineWidth = 2; x.beginPath(); x.moveTo(30, -40); x.quadraticCurveTo(38, -32, 44, -46); x.stroke();          // chest chain
      for (let k = 0; k < 5; k++) { x.fillStyle = shade(205); x.beginPath(); x.arc(31 + k * 3, -38 + Math.sin(k) * 2, 1.4, 0, 7); x.fill(); }
      x.fillStyle = shade(205); x.beginPath(); x.moveTo(-26, -76); x.lineTo(24, -78); x.lineTo(26, -40); x.quadraticCurveTo(0, -36, -28, -40); x.closePath(); x.fill();   // caparison
      x.fillStyle = shade(225); for (let i = -26; i < 26; i += 4) { x.beginPath(); x.moveTo(i, -40); x.lineTo(i + 2, -34); x.lineTo(i + 4, -40); x.fill(); }   // fringe
      x.strokeStyle = shade(240); x.lineWidth = 1.6; for (let i = -24; i < 24; i += 6) for (let j = -70; j < -38; j += 6) x.strokeRect(i, j, 4, 4);
      x.fillStyle = shade(225); x.fillRect(-27, -76, 52, 3);
      x.fillStyle = shade(195); x.beginPath(); x.ellipse(42, -78, 7, 5, 0.2, Math.PI, 0); x.fill();       // head ornament
      if (tower) { x.fillStyle = shade(195); x.fillRect(-12, -100, 26, 22); for (let i = -10; i < 14; i += 6) x.fillRect(i, -120, 3, 20); x.fillRect(-14, -124, 30, 5); x.beginPath(); x.moveTo(-10, -124); x.lineTo(1, -142); x.lineTo(12, -124); x.fill(); }
      else { x.fillStyle = shade(195); x.fillRect(-14, -88, 30, 10); x.beginPath(); x.ellipse(1, -90, 12, 6, 0, Math.PI, 0); x.fill(); }
      x.restore();
    }
    // ---- carved temple border band + corner bracket ----
    function scrollBand(x0, y0, x1, y1, v = 160) {   // rectangle in metres, filled with a row of rosettes / vines
      x.fillStyle = shade(v - 30); x.fillRect(X(x0), Y(y1), X(x1 - x0), X(y1 - y0));
      const horiz = (x1 - x0) > (y1 - y0), n = Math.max(2, Math.round((horiz ? x1 - x0 : y1 - y0) / Math.min(x1 - x0, y1 - y0)));
      for (let k = 0; k < n; k++) { const cx = horiz ? x0 + (k + 0.5) * (x1 - x0) / n : (x0 + x1) / 2, cy = horiz ? (y0 + y1) / 2 : y0 + (k + 0.5) * (y1 - y0) / n, r = Math.min(x1 - x0, y1 - y0) * 0.36;
        x.fillStyle = shade(v + 40); x.beginPath(); for (let p = 0; p < 8; p++) { const a = p * Math.PI / 4; x.ellipse(X(cx) + Math.cos(a) * X(r) * 0.5, Y(cy) - Math.sin(a) * X(r) * 0.5, X(r) * 0.42, X(r) * 0.2, a, 0, Math.PI * 2); } x.fill();
        x.fillStyle = shade(v + 70); x.beginPath(); x.arc(X(cx), Y(cy), X(r) * 0.28, 0, 7); x.fill(); }
    }
    function bracket(x0, y0, wd, ht, flip) {          // L-shaped carved corner frame (vertical pillar + lintel + scrolled corbel)
      const sx = flip ? -1 : 1, px = flip ? x0 - 0.16 : x0;
      scrollBand(px, y0, px + 0.16, y0 + ht);                                              // pillar
      scrollBand(flip ? x0 - wd : x0, y0 + ht - 0.14, flip ? x0 : x0 + wd, y0 + ht);         // lintel
      scrollBand(flip ? x0 - wd : x0, y0 + ht - 0.22, flip ? x0 : x0 + wd, y0 + ht - 0.15, 130);
      x.fillStyle = shade(185); x.beginPath(); const cx0 = X(x0 + sx * 0.16), cy0 = Y(y0 + ht - 0.22); x.moveTo(cx0, cy0); x.quadraticCurveTo(cx0 + sx * X(0.18), cy0, cx0 + sx * X(0.2), cy0 - X(0.0)); x.lineTo(cx0 + sx * X(0.2), cy0 + X(0.05)); x.quadraticCurveTo(cx0 + sx * X(0.06), cy0 + X(0.06), cx0, cy0 + X(0.22)); x.fill();
    }
    // composition after the reference (mirrored in place by the option): bracket top-left, elephant with temple tower top-right,
    // framed elephant middle-left, elephant bottom-right, bracket bottom-right
    bracket(0.12, 1.95, 0.85, 0.95, false);
    elephant(2.05, 2.02, 0.95, -1, true);
    scrollBand(0.12, 0.98, 0.26, 1.82); scrollBand(0.12, 1.68, 1.05, 1.82); scrollBand(0.12, 0.98, 0.95, 1.08, 140); scrollBand(0.82, 1.55, 1.05, 1.68, 150);
    elephant(0.62, 1.1, 0.68, 1, false);
    elephant(1.95, 0.42, 0.9, -1, false);
    bracket(2.78, 0.1, 0.55, 0.7, true);
    // panel joints (grooves) — large-format slabs, staggered like the reference
    x.strokeStyle = shade(0); x.lineWidth = 2;
    const joints = [[0, 0.65, 2.94, 0.65], [0, 1.9, 2.94, 1.9], [0, 2.55, 2.94, 2.55], [0.95, 0, 0.95, 0.65], [1.6, 0.65, 1.6, 1.9], [2.25, 1.9, 2.25, 3.0], [0.75, 1.9, 0.75, 3.0], [2.4, 0, 2.4, 0.65], [2.1, 1.25, 2.94, 1.25]];
    // blur for a soft carved edge; joints after (crisp)
    const hc = document.createElement('canvas'); hc.width = cw; hc.height = chh; const hx = hc.getContext('2d'); hx.filter = 'blur(1.5px)'; hx.drawImage(cv, 0, 0);
    hx.filter = 'none'; hx.strokeStyle = '#000'; hx.lineWidth = 2; joints.forEach(([a, b, c, d]) => { hx.beginPath(); hx.moveTo(X(a), Y(b)); hx.lineTo(X(c), Y(d)); hx.stroke(); });
    const hd = hx.getImageData(0, 0, cw, chh).data;
    // displaced plane: 1 cm grid; height = relief × brightness, joints cut 3 mm in
    const sxN = Math.round(w * 100), syN = Math.round(h * 100), geo = new THREE.PlaneGeometry(w, h, sxN, syN), pos = geo.attributes.position;
    const jointAt = (px, py) => joints.some(([a, b, c, d]) => (a === c ? Math.abs(px - X(a)) < 1.5 && py >= Y(Math.max(b, d)) && py <= Y(Math.min(b, d)) : Math.abs(py - Y(b)) < 1.5 && px >= X(Math.min(a, c)) && px <= X(Math.max(a, c))));
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + w / 2) / w, v = (pos.getY(i) + h / 2) / h, px = Math.min(cw - 1, Math.max(0, Math.round(u * (cw - 1)))), py = Math.min(chh - 1, Math.max(0, Math.round((1 - v) * (chh - 1))));
      const hv = hd[(py * cw + px) * 4] / 255; pos.setZ(i, hv * relief - (hv === 0 && jointAt(px, py) ? 0.003 : 0));
    }
    geo.translate(0, h / 2, 0.006); geo.computeVertexNormals();
    // sandstone colour: warm sand, soft mottling, slightly lighter carved surfaces, dark joints
    const tc = document.createElement('canvas'); tc.width = cw; tc.height = chh; const t = tc.getContext('2d');
    t.fillStyle = '#c9b49a'; t.fillRect(0, 0, cw, chh);
    for (let k = 0; k < 9000; k++) { t.fillStyle = `rgba(${150 + Math.random() * 60},${130 + Math.random() * 50},${105 + Math.random() * 40},0.12)`; t.beginPath(); t.arc(Math.random() * cw, Math.random() * chh, 1 + Math.random() * 6, 0, 7); t.fill(); }
    t.globalAlpha = 0.18; t.drawImage(hc, 0, 0); t.globalAlpha = 1;
    t.strokeStyle = 'rgba(70,55,40,0.55)'; t.lineWidth = 2; joints.forEach(([a, b, c, d]) => { t.beginPath(); t.moveTo(X(a), Y(b)); t.lineTo(X(c), Y(d)); t.stroke(); });
    const map = new THREE.CanvasTexture(tc); map.colorSpace = THREE.SRGBColorSpace;
    const wall = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, roughness: 0.92, name: '__carved_sandstone' })); root.add(wall);
    root.add(box(w + 0.02, 0.02, 0.05, () => M('__sandstone_edge', 0xbda68a), 0, 0, 0));        // base reveal
    // ceiling wall-washers grazing the carving
    for (let k = 0; k < washers; k++) { const wx = -w / 2 + w * (k + 0.5) / washers, dm = led(0xfff0d8, 3); moods.strips.push(dm);
      const d2 = cyl(0.035, 0.035, 0.004, dm, wx, h - 0.004, 0.25, 20); root.add(d2);
      const ws = ledStrip({ w: 0.7, wash: 1.6, dir: 'down', alpha: 0.32, colour: 0xffe2b8 }); ws.obj.position.set(wx, h - 0.02, 0.04); root.add(ws.obj); moods.halos.push(...ws.moods.halos); }
    return { obj: root, moods };
  }

  /* building corridor outside the main door (assumed size — owner to confirm): parts are separate so each gets its own
     thin collision footprint. World coordinates; corridor runs along z outside the flat's west wall (face x0w). */
  function entranceCorridor({ xw = -2.0, xf = -0.2, z0 = -6.4, z1 = 1.2, h = 2.85, floorY = 0.062, lift = [-5.6, -4.4], walls = true } = {}) {
    const parts = {}, W = xf - xw, L = z1 - z0, cxm = (xw + xf) / 2, czm = (z0 + z1) / 2;
    // floor: black / white striped marble across the corridor (owner foyer reference)
    const fl = canvasTex(512, 4096, (x, w, h2) => { const n = Math.round(L / 0.6); for (let k = 0; k < n; k++) { const y0 = k * h2 / n, dark = k % 2; x.fillStyle = dark ? '#1c1c1e' : '#f1efea'; x.fillRect(0, y0, w, h2 / n);
      x.strokeStyle = dark ? 'rgba(235,235,235,0.35)' : 'rgba(120,120,120,0.25)'; for (let v = 0; v < 5; v++) { x.lineWidth = 0.6 + Math.random() * 1.4; x.beginPath(); let px = Math.random() * w, py = y0 + Math.random() * h2 / n; x.moveTo(px, py); for (let s2 = 0; s2 < 5; s2++) { px += (Math.random() - 0.3) * 120; py += (Math.random() - 0.5) * 30; x.lineTo(px, py); } x.stroke(); } } });
    const fr = g(); const fm = new THREE.Mesh(new THREE.BoxGeometry(W, 0.02, L), new THREE.MeshStandardMaterial({ map: fl, roughness: 0.25, name: '__corridor_marble' })); fm.position.set(0, floorY - 0.01, 0); fr.add(fm); fr.position.set(cxm, 0, czm); parts.floor = { obj: fr };
    const cr = g(), moods = { strips: [] }; cr.add(box(W, 0.02, L, () => M('__corridor_ceiling', 0xf3f1ec), 0, h, -L / 2));
    for (let x = -W / 2 + 0.9; x < W / 2 - 0.3; x += 1.8) for (let z = -L / 2 + 0.8; z < L / 2 - 0.4; z += 1.4) { const dl = led(0xfff0d8, 3); moods.strips.push(dl); const d2 = cyl(0.04, 0.04, 0.004, dl, x, h - 0.004, z, 20); cr.add(d2); }   // downlight grid
    const cove = led(0xffc880, 2.2); moods.strips.push(cove); cr.add(box(0.01, 0.01, L - 0.2, cove, -W / 2 + 0.04, h - 0.05, -L / 2 + 0.1));
    cr.position.set(cxm, 0, czm); parts.ceiling = { obj: cr, moods };
    if (!walls) return parts;                     // owner: no walls blocking the view
    // opposite wall (greige with a dark skirting) + a pair of brushed-steel lift doors with call button and indicator
    const ww = g(); ww.add(box(L, h, 0.12, () => M('__corridor_greige', 0xcfc6b8), 0, 0, -0.12)); ww.add(box(L, 0.1, 0.01, PS5B, 0, floorY, 0));
    const steel = () => M('__brushed_steel', 0x9ea3a8), lc = (lift[0] + lift[1]) / 2 - czm;
    ww.add(box(1.32, 2.28, 0.04, () => M('__lift_portal', 0x3a3a3c), -lc, floorY, 0)); for (const sx of [-1, 1]) ww.add(box(0.58, 2.12, 0.01, steel, -lc + sx * 0.3, floorY + 0.06, 0.04));
    ww.add(box(0.08, 0.14, 0.012, steel, -lc - 0.85, 1.1, 0)); const cb = led(0xffffff, 1.5); moods.strips.push(cb); ww.add(cyl(0.012, 0.012, 0.006, cb, -lc - 0.85, 1.16, 0.014, 12));
    ww.add(box(0.3, 0.08, 0.012, PS5B, -lc, 2.42, 0));
    ww.position.set(xw, 0, czm); ww.rotation.y = Math.PI / 2; parts.wallW = { obj: ww };
    for (const [nm, z, ry] of [['endN', z0, 0], ['endS', z1, Math.PI]]) { const e = g(); e.add(box(W, h, 0.12, () => M('__corridor_greige', 0xcfc6b8), 0, 0, -0.12)); e.position.set(cxm, 0, z); e.rotation.y = ry; parts[nm] = { obj: e }; }
    return parts;
  }

  /* entrance foyer wall (owner reference 2026-11-10: references/entrance/2026-11-10_wavy-backlit-foyer-wall.png)
     Local frame: wall along x (−L/2 … +L/2, +L/2 = door end), back on the wall, +z into the room, floor y 0.
     Terracotta paint; wavy textured-white plaster panel with an LED-lit wavy edge (high at the door, stepping down);
     floating grey shoe cabinet with rounded top + cane doors and cane drawers; long timber bench with a turned leg and a
     grey upholstered backrest; geometric engraved terracotta panels at the far end; black globe pendant; plants. */
  function foyerWall({ L = 3.0, H = 2.98 } = {}) {
    const root = g(), moods = { strips: [], halos: [] }, x0 = -L / 2, x1 = L / 2;
    const TERRA = () => M('__terracotta_paint_deep', 0x86563f), GREY = () => M('__slate_grey_lacquer', 0x5d636b), TIMBER = () => M('__bench_walnut', 0x7a5236);
    root.add(box(L, H, 0.006, TERRA, 0, 0, 0));
    // geometric engraved panels (far end): 0.3 m tiles with arcs and line patterns
    const gx0 = x0, gx1 = x0 + 0.75, geo = canvasTex(300, 1200, (x, w, h) => { x.fillStyle = '#a47058'; x.fillRect(0, 0, w, h); x.strokeStyle = '#6e4636'; x.lineWidth = 2;
      for (let r = 0; r < 12; r++) for (let c = 0; c < 3; c++) { const px = c * 100, py = r * 100, k = (r * 3 + c) % 5; x.strokeRect(px + 1, py + 1, 98, 98);
        if (k === 0) { x.beginPath(); x.arc(px + 50, py + 100, 40, Math.PI, 0); x.stroke(); }
        if (k === 1) for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(px + 20 + i * 15, py + 10); x.lineTo(px + 20 + i * 15, py + 90); x.stroke(); }
        if (k === 2) for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(px + 100, py + 100, 30 + i * 12, Math.PI, 1.5 * Math.PI); x.stroke(); }
        if (k === 3) for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(px + 10, py + 30 + i * 12); x.lineTo(px + 90, py + 30 + i * 12); x.stroke(); }
        if (k === 4) { x.beginPath(); x.moveTo(px + 50, py); x.lineTo(px + 50, py + 100); x.stroke(); } } });
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(gx1 - gx0, H - 0.04), new THREE.MeshStandardMaterial({ map: geo, roughness: 0.85, name: '__engraved_terracotta' })); gm.position.set((gx0 + gx1) / 2, 0.02 + (H - 0.04) / 2, 0.02); root.add(gm);
    root.add(box(gx1 - gx0, H - 0.04, 0.012, TERRA, (gx0 + gx1) / 2, 0.02, 0.006));
    // wavy textured-white plaster panel, high over the cabinet (door end), stepping down towards the far end
    const wx0 = gx1 + 0.06, wx1 = x1 - 0.03, prof = [[0, 1.55], [0.18, 1.62], [0.32, 1.95], [0.45, 2.02], [0.58, 2.28], [0.7, 2.42], [0.82, 2.46], [1, 2.46]];
    const curve = new THREE.SplineCurve(prof.map(([u, hh]) => new THREE.Vector2(wx0 + u * (wx1 - wx0), hh))), pts = curve.getPoints(80);
    const shp = new THREE.Shape(); shp.moveTo(wx0, 0.02); shp.lineTo(wx1, 0.02); shp.lineTo(wx1, pts[pts.length - 1].y);
    for (let k = pts.length - 1; k >= 0; k--) shp.lineTo(pts[k].x, pts[k].y); shp.lineTo(wx0, 0.02);
    const plaster = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#ece6dc'; x.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { x.strokeStyle = `rgba(150,140,125,${0.05 + Math.random() * 0.08})`; x.lineWidth = 1; x.beginPath(); const px = Math.random() * w, py = Math.random() * h; x.moveTo(px, py); x.lineTo(px + 4 + Math.random() * 10, py + (Math.random() - 0.5) * 3); x.stroke(); } });
    plaster.wrapS = plaster.wrapT = THREE.RepeatWrapping; plaster.repeat.set(4, 4);
    const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(shp, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 4 }), new THREE.MeshStandardMaterial({ map: plaster, roughness: 0.95, name: '__textured_white_plaster' }));
    pm.position.z = 0.03; root.add(pm);
    const el = led(0xffc880, 3); moods.strips.push(el);
    root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, p.y + 0.004, 0.035))), 120, 0.005, 6, false), el));
    { // soft glow on the terracotta just above the wavy edge
      const hm = new THREE.MeshBasicMaterial({ color: 0xffc880, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, name: '__led_wash' });
      const pos = [], col = [], idx = []; pts.forEach((p, k) => { pos.push(p.x, p.y - 0.01, 0.01, p.x, p.y + 0.16, 0.01); col.push(1, 1, 1, 0.55, 1, 1, 1, 0); if (k < pts.length - 1) { const a2 = k * 2; idx.push(a2, a2 + 1, a2 + 2, a2 + 1, a2 + 3, a2 + 2); } });
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); gg.setIndex(idx);
      root.add(new THREE.Mesh(gg, hm)); moods.halos.push(hm);
      const sl = led(0xffc880, 2.6); moods.strips.push(sl); root.add(box(0.008, 2.3, 0.01, sl, wx1 + 0.012, 0.05, 0.03));     // vertical glow at the door end
    }
    // floating shoe cabinet (door end): rounded top, two cane doors; cane drawers below the bench
    const cane = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#eee2ca'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c4ab84'; x.lineWidth = 1.5; for (let i = -w; i < w * 2; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); x.beginPath(); x.moveTo(i, h); x.lineTo(i + h, 0); x.stroke(); } });
    cane.wrapS = cane.wrapT = THREE.RepeatWrapping; cane.repeat.set(3, 10); const caneM = new THREE.MeshStandardMaterial({ map: cane, roughness: 0.85, name: '__cane_foyer_light' });
    const cw = 0.62, cx = x1 - 0.12 - cw / 2, cy0 = 0.5, cy1 = 2.1, cd = 0.36, rr = 0.12;
    const cs = new THREE.Shape(); cs.moveTo(cx - cw / 2, cy0); cs.lineTo(cx + cw / 2, cy0); cs.lineTo(cx + cw / 2, cy1 - rr); cs.absarc(cx + cw / 2 - rr, cy1 - rr, rr, 0, Math.PI / 2, false); cs.lineTo(cx - cw / 2 + rr, cy1); cs.absarc(cx - cw / 2 + rr, cy1 - rr, rr, Math.PI / 2, Math.PI, false); cs.lineTo(cx - cw / 2, cy0);
    const cab = new THREE.Mesh(new THREE.ExtrudeGeometry(cs, { depth: cd, bevelEnabled: false, curveSegments: 12 }), GREY()); cab.position.z = 0.04; root.add(cab);
    for (const sx of [-1, 1]) { const dr = g(), pw = cw / 2 - 0.05; dr.add(box(pw - 0.04, cy1 - cy0 - 0.2, 0.008, caneM, sx * (pw / 2 + 0.005), cy0 + 0.06, 0.008));
      dr.add(box(0.012, 0.22, 0.02, PS5B, sx * 0.025, cy0 + 0.7, 0.016)); dr.position.set(cx, 0, 0.04 + cd); tagGroup(dr, { type: 'cab', hinge: [cx + sx * (cw / 2 - 0.03), 0, 0.04 + cd], a1: sx * Math.PI * 0.5, label: 'shoe cabinet' });
      for (const ch of dr.children) ch.position.x -= sx * 0.0; root.add(dr); }
    root.add(box(cw, 0.24, cd, GREY, cx, 0.16, 0.04, 0.03));                                                     // drawer block under the bench
    for (const sx of [-1, 1]) { const m2 = new THREE.Mesh(new THREE.PlaneGeometry(cw / 2 - 0.06, 0.18), caneM); m2.position.set(cx + sx * (cw / 4), 0.28, 0.04 + cd + 0.002); root.add(m2); root.add(cyl(0.012, 0.012, 0.01, PS5B, cx + sx * (cw / 4), 0.27, 0.04 + cd + 0.004, 10)); }
    // long timber bench at 450 mm with a turned leg, grey upholstered backrest
    const bx0 = wx0 + 0.05, bx1 = x1 - 0.02;
    root.add(box(bx1 - bx0, 0.04, 0.4, TIMBER, (bx0 + bx1) / 2, 0.43, 0.02, 0.006));
    const leg2 = cyl(0.022, 0.016, 0.43, TIMBER, bx0 + 0.06, 0, 0.36, 12); root.add(leg2); root.add(cyl(0.03, 0.03, 0.03, TIMBER, bx0 + 0.06, 0.2, 0.36, 12));
    root.add(box(cx - cw / 2 - 0.08 - (bx0 + 0.15), 0.2, 0.06, () => M('__grey_upholstery', 0x6b7077), (bx0 + 0.15 + cx - cw / 2 - 0.08) / 2, 0.7, 0.04, 0.02));
    // black globe pendant on an oval frame + plants
    const pend = g(); pend.add(cyl(0.004, 0.004, H - 1.95, PS5B, 0, 1.95, 0, 6)); const glob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), led(0xfff1d8, 2.4)); glob.position.y = 1.86; pend.add(glob); moods.strips.push(glob.material);
    const oval = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.006, 8, 40), PS5B()); oval.scale.set(1, 2.2, 1); oval.position.y = 1.86; pend.add(oval); pend.position.set(wx0 - 0.02, 0, 0.22); root.add(loose(pend));
    const pot = g(); pot.add(cyl(0.11, 0.09, 0.32, () => M('__white_ribbed_pot', 0xeeeae2), 0, 0, 0, 24)); for (let k = 0; k < 9; k++) { const lf = box(0.012, 0.5 + (k % 3) * 0.1, 0.06, () => M('__leaf_green', 0x5d7a3e), 0, 0.3, 0); lf.rotation.z = (k - 4) * 0.12; lf.rotation.y = k; pot.add(lf); }
    pot.position.set(x1 - 0.13, 0.47, 0.18); root.add(loose(pot));
    const hang = g(); for (let k = 0; k < 8; k++) { const v = box(0.01, 0.3 + (k % 4) * 0.08, 0.04, () => M('__leaf_green', 0x5d7a3e), (k - 4) * 0.02, -0.3 - (k % 4) * 0.08, 0); hang.add(v); } hang.position.set(wx0 + 0.02, 1.62, 0.12); root.add(loose(hang));
    return { obj: root, moods };
  }

  /* ten switchable styles for the bed (balcony) wall — all keep the same frame + header over the sliders (sliders open),
     and differ in material and the feature on the solid section. Local x 0 … 1.28 = solid section (mirrored in place). */
  const BED_WALL_STYLES = ['walnut-moon', 'oak-flute', 'upholstered', 'limewash-arch', 'cane', 'travertine', 'mural', 'plaster-arches', 'moody', 'library',
    'deco-fan', 'floating-beam', 'oak-fringe', 'lattice-arch', 'cubbies', 'bronze-fins', 'mughal', 'bauhaus', 'sun-relief', 'fabric-canopy'];
  function bedWallStyled({ style = 'walnut-moon', length = 3.658, solidTo = 1.28, headY = 2.15 } = {}) {
    const N = { x: 0.255, w: 0.4, y0: 0.66, y1: 2.25 }, MO = { x: 0.9, y: 1.88, r: 0.28 };
    const tex = (w, h, draw) => canvasTex(w, h, draw);
    const lime = () => M('__limewash_sand', 0xd8c3a4), cream = () => M('__plaster_cream', 0xe6dccb);
    const stone = () => { const t = tex(512, 512, (x, w, h) => { x.fillStyle = '#d9ccb6'; x.fillRect(0, 0, w, h); for (let k = 0; k < 140; k++) { x.strokeStyle = `rgba(${150 + Math.random() * 40},${125 + Math.random() * 30},${95 + Math.random() * 25},${0.15 + Math.random() * 0.25})`; x.lineWidth = 1 + Math.random() * 3; const y = Math.random() * h; x.beginPath(); x.moveTo(0, y); for (let xx = 0; xx <= w; xx += 32) x.lineTo(xx, y + Math.sin(xx * 0.02 + k) * 6); x.stroke(); } for (let k = 0; k < 400; k++) { x.fillStyle = 'rgba(140,115,85,0.25)'; x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1 + Math.random() * 2); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, name: '__travertine' }); };
    const xeP = length - 0.08, cxS = (solidTo + xeP) / 2;
    const poly = (pts) => { const p = new THREE.Path(); p.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) p.lineTo(q[0], q[1]); p.lineTo(pts[0][0], pts[0][1]); return p; };
    const extraHoles = [];
    if (style === 'deco-fan') for (let k = 0; k < 15; k++) { const t = Math.PI * (k + 0.5) / 15, c = Math.cos(t), sn = Math.sin(t), r0 = 0.16, r1 = 0.62, hw = 0.016;   // sunburst slots in the header
      const pt = (r, o) => [cxS + c * r - sn * o, 2.16 + sn * r + c * o]; extraHoles.push(poly([pt(r0, -hw), pt(r1, -hw * 2.2), pt(r1, hw * 2.2), pt(r0, hw)])); }
    if (style === 'lattice-arch') { const rx = (xeP - solidTo) / 2, ry = 0.66; for (let y = 2.12; y < 2.78; y += 0.11) for (let x = solidTo + 0.08; x < xeP - 0.06; x += 0.11) { const ox = (x + ((y * 100 | 0) % 2 ? 0.055 : 0) - cxS) / (rx + 0.06), oy = (y - 2.02) / (ry + 0.06);
      const xx = x + (Math.round((y - 2.12) / 0.11) % 2 ? 0.055 : 0); if (((xx - cxS) / (rx + 0.06)) ** 2 + ((y - 2.02) / (ry + 0.06)) ** 2 > 1 && xx < xeP - 0.06) extraHoles.push(poly([[xx, y - 0.04], [xx + 0.035, y], [xx, y + 0.04], [xx - 0.035, y]])); } }
    if (style === 'cubbies') for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const x0 = 0.08 + c * 0.38, y0 = 1.35 + r * 0.36; if (c > 0 && r < 1) continue; extraHoles.push(poly([[x0, y0], [x0 + 0.32, y0], [x0 + 0.32, y0 + 0.3], [x0, y0 + 0.3]])); }
    const opts = {
      // each style: its own cut over the sliders (edge) + its own composition on the solid section
      'walnut-moon': { edge: 'quarter' },
      'oak-flute': { edge: 'semi', wood: OAK, moon: null, grooves: false },
      'upholstered': { edge: 'scallop', niche: null, moon: null, grooves: false },
      'limewash-arch': { edge: 'gothic', wood: lime, niche: null, moon: null, grooves: false },
      'cane': { edge: 'straight', headY: 2.2, wood: OAK, niche: null, moon: null, grooves: false },
      'travertine': { edge: 'notch', wood: stone(), grooves: false, niche: null, moon: { x: 0.66, y: 1.74, r: 0.46 },
        moonMat: new THREE.MeshStandardMaterial({ color: 0xf1e2c8, emissive: new THREE.Color(0xffc98a), emissiveIntensity: 0.55, roughness: 0.9, name: '__moongate_glow' }) },
      'mural': { edge: 'wave', niche: null, moon: null, grooves: false },
      'plaster-arches': { edge: 'segmental', wood: cream, niche: null, moon: null, grooves: false },
      'moody': { edge: 'chevron', wood: CHARL, niche: null, grooves: false, moon: { x: 0.66, y: 1.85, r: 0.36 } },
      'library': { edge: 'straight', headY: 2.22, niche: null, moon: null, grooves: false },
      'deco-fan': { edge: 'straight', headY: 2.16, wood: DARK, niche: null, moon: null, grooves: false },
      'floating-beam': { edge: 'none', wood: (() => { const t = tex(512, 512, (x, w, h) => { x.fillStyle = '#e9e1d4'; x.fillRect(0, 0, w, h); const cs = ['#b98c6b', '#7d8a6a', '#cfc3ae', '#8e6e57', '#e2b48f', '#5c5550']; for (let k = 0; k < 2200; k++) { x.fillStyle = cs[k % cs.length]; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 1 + Math.random() * 5, 1 + Math.random() * 4, Math.random() * 3, 0, 7); x.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 4); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, name: '__terrazzo' }); })(), niche: null, moon: null, grooves: false },
      'oak-fringe': { edge: 'fringe', wood: OAK, niche: null, moon: null, grooves: false },
      'lattice-arch': { edge: 'semi', wood: WOOD, niche: { x: 0.64, w: 0.86, y0: 0.62, y1: 2.6 }, moon: null, grooves: false, nicheMat: () => M('__lattice_glow_back', 0xd8b48c) },
      'cubbies': { edge: 'pelmet', wood: DARK, niche: null, moon: null, grooves: false },
      'bronze-fins': { edge: 'fins', wood: CHARL, niche: null, moon: null, grooves: false },
      'mughal': { edge: 'multifoil', wood: () => M('__ivory_lacquer', 0xece2cf), niche: null, moon: null, grooves: false },
      'bauhaus': { edge: 'bauhaus', wood: cream, niche: null, moon: null, grooves: false },
      'sun-relief': { edge: 'twin', wood: () => M('__microcement_greige', 0xc9bba6), niche: null, moon: null, grooves: false },
      'fabric-canopy': { edge: 'scallop7', wood: () => M('__boucle_oat', 0xb7a994), niche: null, moon: null, grooves: false },
    }[style] || {};
    if (style === 'moody') opts.moonMat = (() => { const t = tex(256, 256, (x, w, h) => { const gr = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, '#ffd9a0'); gr.addColorStop(1, '#c4782f'); x.fillStyle = gr; x.fillRect(0, 0, w, h); for (let k = 0; k < 60; k++) { x.strokeStyle = 'rgba(255,240,210,0.25)'; x.lineWidth = 1 + Math.random() * 2; x.beginPath(); x.moveTo(Math.random() * w, 0); x.bezierCurveTo(Math.random() * w, h * 0.3, Math.random() * w, h * 0.7, Math.random() * w, h); x.stroke(); } }); return new THREE.MeshStandardMaterial({ map: t, emissive: new THREE.Color(0xffa850), emissiveMap: t, emissiveIntensity: 1.1, roughness: 0.4, name: '__onyx_backlit' }); })();
    const base = balconyWallFrame({ length, solidTo, headY, niche: N, moon: MO, ...opts, holes: extraHoles });
    const edgePts = base.edge, xe = length - 0.08;
    const root = base.obj, z = 0.13 + 0.025, xs = solidTo, moods = base.moods;   // front face of the frame (standoff + panel depth)
    const addLed = (w, x, y, zz, c = 0xffc880, p = 2.4) => { const m = led(c, p); moods.strips.push(m); root.add(box(w, 0.006, 0.01, m, x, y, zz)); };
    const archRing = (cx, w, y0, y1, t, mat, dz) => { const outer = new THREE.Shape(), hw = w / 2; outer.moveTo(cx - hw, y0); outer.lineTo(cx + hw, y0); outer.lineTo(cx + hw, y1 - hw); outer.absarc(cx, y1 - hw, hw, 0, Math.PI, false); outer.lineTo(cx - hw, y0);
      const ih = hw - t, inner = new THREE.Path(); inner.moveTo(cx - ih, y0); inner.lineTo(cx + ih, y0); inner.lineTo(cx + ih, y1 - hw); inner.absarc(cx, y1 - hw, ih, 0, Math.PI, false); inner.lineTo(cx - ih, y0); outer.holes.push(inner);
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: dz, bevelEnabled: false, curveSegments: 24 }), typeof mat === 'function' ? mat() : mat); m.position.z = z; root.add(m); return m; };
    if (style === 'oak-flute') {                                                               // fine oak flutes + brass-ringed niche
      for (let x = 0.03; x < xs - 0.02; x += 0.032) if (Math.abs(x - N.x) > N.w / 2 + 0.03) { const f = cyl(0.011, 0.011, 2.78, OAK, x, 0.04, z + 0.004, 10); root.add(f); }
      archRing(N.x, N.w + 0.05, N.y0 - 0.025, N.y1 + 0.025, 0.02, BRASS, 0.012);
    }
    if (style === 'upholstered') {                                                             // full-height channel upholstery + walnut ledge with up-light
      const fab = () => M('__boucle_oat', 0xb7a994), n = 8, cw = (xs - 0.06) / n;
      for (let k = 0; k < n; k++) root.add(box(cw - 0.01, 2.36, 0.06, fab, 0.03 + cw / 2 + k * cw, 0.06, z, 0.025));
      root.add(box(xs - 0.02, 0.04, 0.16, WOOD, xs / 2, 2.44, z, 0.005)); addLed(xs - 0.1, xs / 2, 2.485, z + 0.06);
    }
    if (style === 'limewash-arch') {                                                           // walnut arch outline, floating oak shelves inside
      const pointed = (cx, w, y0, hs, t) => { const sh = new THREE.Shape(), R = w, sp = y0 + hs, hw = w / 2;   // equilateral pointed arch ring
        sh.moveTo(cx - hw, y0); sh.lineTo(cx + hw, y0); sh.lineTo(cx + hw, sp); sh.absarc(cx - hw, sp, R, 0, Math.PI / 3, false); sh.absarc(cx + hw, sp, R, 2 * Math.PI / 3, Math.PI, false); sh.lineTo(cx - hw, y0);
        const iw = hw - t, Ri = R - 2 * t, hole = new THREE.Path(); hole.moveTo(cx - iw, y0); hole.lineTo(cx + iw, y0); hole.lineTo(cx + iw, sp); hole.absarc(cx + iw - Ri, sp, Ri, 0, Math.PI / 3, false); hole.absarc(cx - iw + Ri, sp, Ri, 2 * Math.PI / 3, Math.PI, false); hole.lineTo(cx - iw, y0); sh.holes.push(hole);
        const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false, curveSegments: 24 }), WOOD()); m.position.z = z; root.add(m); };
      pointed(0.64, 0.98, 0.05, 1.72, 0.06);
      for (const sy of [1.45, 1.9]) { root.add(box(0.8, 0.03, 0.2, OAK, 0.64, sy, z)); addLed(0.76, 0.64, sy - 0.006, z + 0.15); }
      const v = g(); v.add(cyl(0.05, 0.065, 0.2, () => M('__vase_cream', 0xe9dfcf), 0, 0, 0, 20)); v.position.set(0.45, 1.93, z + 0.1); root.add(loose(v));
      root.add(loose(box(0.22, 0.05, 0.15, () => M('__books_stack', 0x8a6f58), 0.8, 1.93, z + 0.03, 0.004)));
    }
    if (style === 'cane') {                                                                    // three oak-framed cane panels
      const cane = tex(256, 256, (x, w, h) => { x.fillStyle = '#d8b98c'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8f6a3e'; x.lineWidth = 3; for (let i = -w; i < w * 2; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); x.beginPath(); x.moveTo(i, h); x.lineTo(i + h, 0); x.stroke(); } x.fillStyle = 'rgba(60,40,20,0.35)'; for (let a = 8; a < w; a += 16) for (let b = 8; b < h; b += 16) { x.beginPath(); x.arc(a, b, 3.5, 0, 7); x.fill(); } });
      cane.wrapS = cane.wrapT = THREE.RepeatWrapping; cane.repeat.set(2, 10);
      const cm = new THREE.MeshStandardMaterial({ map: cane, roughness: 0.8, name: '__cane_weave' });
      for (const cx of [0.22, 0.64, 1.06]) { root.add(box(0.36, 1.95, 0.03, OAK, cx, 0.55, z)); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.89), cm); p.position.set(cx, 0.55 + 0.975, z + 0.031); root.add(p);
        for (let gy = 0.55 + 0.3; gy < 2.45; gy += 0.3) root.add(box(0.3, 0.014, 0.016, OAK, cx, gy, z + 0.032));                  // shoji-style lattice
        root.add(box(0.014, 1.89, 0.016, OAK, cx, 0.58, z + 0.032)); }
      addLed(xs - 0.1, xs / 2, 2.55, z + 0.02);
      for (const [ly, lz] of [[2.28, 0.05], [2.46, 0.035], [2.64, 0.02]]) root.add(box(xe - xs, 0.05, lz, OAK, (xs + xe) / 2, ly, z));    // layered louvres over the sliders
    }
    if (style === 'travertine') {                                                              // stone-look feature + backlit horizontal reveal
      addLed(xs - 0.04, xs / 2, 1.1, z + 0.004, 0xffc880, 2.8);
      root.add(box(xs - 0.04, 0.025, 0.12, WOOD, xs / 2, 1.11, z));                                     // walnut ledge under the moon gate
    }
    if (style === 'mural') {                                                                   // arched dusk-landscape mural in a walnut frame
      const mur = tex(320, 640, (x, w, h) => { const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#e8c9a8'); sky.addColorStop(0.55, '#d9a37f'); sky.addColorStop(1, '#8f7a63'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
        x.fillStyle = '#f3dcc0'; x.beginPath(); x.arc(w * 0.62, h * 0.42, 40, 0, 7); x.fill();
        [['#b48a6c', 0.55], ['#9a775e', 0.65], ['#7f6553', 0.75], ['#6b5747', 0.86]].forEach(([c, yy], i) => { x.fillStyle = c; x.beginPath(); x.moveTo(0, h); for (let xx = 0; xx <= w; xx += 10) x.lineTo(xx, h * yy + Math.sin(xx * 0.02 + i * 2) * 26); x.lineTo(w, h); x.fill(); });
        x.strokeStyle = '#4a3a2e'; x.lineWidth = 2; for (let k = 0; k < 6; k++) { const bx = 40 + k * 44, by = h * 0.86; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx, by - 60 - k * 6); x.stroke(); } });
      const sh2 = new THREE.Shape(), cx = 0.64, hw = 0.5, y0 = 0.62, y1 = 2.62; sh2.moveTo(cx - hw, y0); sh2.lineTo(cx + hw, y0); sh2.lineTo(cx + hw, y1 - hw); sh2.absarc(cx, y1 - hw, hw, 0, Math.PI, false); sh2.lineTo(cx - hw, y0);
      const geo = new THREE.ShapeGeometry(sh2, 24); const uv = geo.attributes.uv, pos = geo.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - (cx - hw)) / (2 * hw), (pos.getY(i) - y0) / (y1 - y0));
      const mm = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: mur, roughness: 0.9, name: '__mural_dusk' })); mm.position.z = z + 0.004; root.add(mm);
      archRing(cx, 2 * hw + 0.06, y0 - 0.03, y1 + 0.03, 0.035, WOOD, 0.02);
    }
    if (style === 'plaster-arches') {                                                          // tone-on-tone nested plaster arches, grazing light
      archRing(0.64, 1.1, 0.05, 2.62, 0.07, cream, 0.04); archRing(0.64, 0.82, 0.05, 2.36, 0.06, cream, 0.03); archRing(0.64, 0.54, 0.05, 2.1, 0.05, cream, 0.02);
      addLed(xs - 0.04, xs / 2, 2.78, z + 0.03, 0xffc880, 2.8);
      for (const [dy, rr] of [[0.07, 0.014], [0.15, 0.01]]) { const pts = edgePts.filter(([, py]) => py > 1.5).map(([px, py]) => new THREE.Vector3(px, py + dy, z + 0.006));
        root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, rr, 8, false), cream())); }                       // stepped plaster reveals
    }
    if (style === 'moody') {                                                                   // charcoal + brass inlays around a backlit onyx disc
      for (const x of [0.12, 1.2]) root.add(box(0.006, 2.7, 0.004, BRASS, x, 0.06, z));
      for (let cy = 0.4; cy < 2.6; cy += 0.36) for (const sg of [-1, 1]) { const b2 = box(0.006, 0.42, 0.004, BRASS, 0, 0, 0); b2.position.set(0.66 + sg * 0.15, cy, z); b2.rotation.z = sg * Math.PI / 4; if (Math.hypot(0.66 + sg * 0.15 - 0.66, cy + 0.2 - 1.85) > 0.5) root.add(b2); }
      root.add(box(length - 0.1, 0.012, 0.004, BRASS, length / 2, headY + 0.03, z));
    }
    if (style === 'library') {                                                                 // arched built-in shelving above the headboard + nightstand column
      const sx0 = 0.04, sx1 = xs - 0.04, d = 0.24, W2 = WOOD;
      archRing((sx0 + sx1) / 2, sx1 - sx0, 1.38, 2.75, 0.04, W2, d);
      root.add(box(sx1 - sx0, 0.03, d, W2, (sx0 + sx1) / 2, 1.38, z));
      for (const sy of [1.8, 2.2]) { root.add(box(sx1 - sx0 - 0.08, 0.025, d - 0.02, W2, (sx0 + sx1) / 2, sy, z)); addLed(sx1 - sx0 - 0.12, (sx0 + sx1) / 2, sy - 0.006, z + d - 0.04); }
      addLed(sx1 - sx0 - 0.12, (sx0 + sx1) / 2, 1.38 - 0.006, z + d - 0.04);
      const cols = [0x6e4f3a, 0x9b7b5b, 0x3f4a3b, 0xb79a75, 0x5d3f33, 0x8a8a7a, 0xc3a986];
      for (const sy of [1.41, 1.825]) { let x = sx0 + 0.08; while (x < sx1 - 0.25) { const bw = 0.025 + Math.random() * 0.025, bh = 0.2 + Math.random() * 0.1; root.add(loose(box(bw, bh, 0.16, () => M('__book_' + cols[(x * 100 | 0) % cols.length].toString(16), cols[(x * 100 | 0) % cols.length]), x, sy, z + 0.03))); x += bw + 0.004; if (Math.random() < 0.12) x += 0.12; } }
      const v = g(); v.add(cyl(0.05, 0.06, 0.18, () => M('__vase_cream', 0xe9dfcf), 0, 0, 0, 20)); v.position.set(sx1 - 0.15, 2.225, z + 0.12); root.add(loose(v));
      // shelf bridge: the bookshelf continues over the sliders (books + decor between dividers), lit underneath
      root.add(box(xe - xs, 0.03, d, W2, (xs + xe) / 2, 2.2, z)); addLed(xe - xs - 0.1, (xs + xe) / 2, 2.194, z + d - 0.04);
      for (let x = xs + 0.6; x < xe - 0.1; x += 0.6) root.add(box(0.025, 0.6, d, W2, x, 2.23, z));
      for (let x = xs + 0.06; x < xe - 0.3; x += 0.6) { let bx = x; for (let k = 0; k < 8; k++) { const bw = 0.03 + (k % 3) * 0.008, bh = 0.2 + ((k * 7) % 5) * 0.02; root.add(loose(box(bw, bh, 0.16, () => M('__book_' + cols[k % cols.length].toString(16), cols[k % cols.length]), bx, 2.23, z + 0.03))); bx += bw + 0.004; } }
    }
    const glowBack = (x0, x1, y0, y1, p = 1.0) => { const m = led(0xffbf78, p); moods.strips.push(m); root.add(box(x1 - x0, y1 - y0, 0.004, m, (x0 + x1) / 2, y0, z - 0.045)); };
    if (style === 'deco-fan') {                                                               // backlit sunburst header + brass fan above the headboard
      glowBack(solidTo + 0.05, xeP - 0.05, 2.17, 2.8, 1.2);
      for (let k = 0; k <= 12; k++) { const t = Math.PI * k / 12, b2 = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.62, 0.005), BRASS()); b2.geometry.translate(0, 0.31, 0); b2.position.set(0.64, 1.31, z + 0.003); b2.rotation.z = t - Math.PI / 2; root.add(b2); }   // fan rays from one point
      root.add(box(1.24, 0.012, 0.006, BRASS, 0.64, 1.31, z));
      const quilt = () => M('__boucle_oat', 0xb7a994); for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) root.add(box(0.29, 0.33, 0.05, quilt, 0.17 + c * 0.31, 0.6 + r * 0.35, z, 0.03));
    }
    if (style === 'floating-beam') {                                                          // full-width floating walnut beam, washed up and down; glowing slit in terrazzo
      root.add(box(length - 0.02, 0.14, 0.3, WOOD, length / 2, 2.26, 0.02, 0.01));
      for (const [d, y] of [['up', 2.41], ['down', 2.25]]) { const L2 = ledStrip({ w: length - 0.1, wash: d === 'up' ? 0.4 : 0.5, dir: d, alpha: 0.55 }); L2.obj.position.set(length / 2, y, 0.03); root.add(L2.obj); moods.strips.push(...L2.moods.strips); (moods.halos = moods.halos || []).push(...L2.moods.halos); }
      const sl = led(0xffc070, 2.4); moods.strips.push(sl); root.add(box(0.05, 1.5, 0.006, sl, 1.08, 0.55, z));
    }
    if (style === 'oak-fringe') {                                                             // 3D wave relief of oak ribs on the solid wall
      for (let x = 0.03, k = 0; x < xs - 0.02; x += 0.055, k++) { const d = 0.02 + 0.06 * (0.5 + 0.5 * Math.sin(k * 0.45)); root.add(box(0.035, 2.72, d, OAK, x, 0.06, z, 0.006)); }
      for (let x = solidTo + 0.06; x < xeP; x += 0.092) root.add(box(0.004, 0.6, 0.003, PS5B, x, 2.2, z));     // slat lines on the fringe
    }
    if (style === 'lattice-arch') {                                                           // backlit lattice spandrels + arched jharokha screen
      glowBack(solidTo + 0.05, xeP - 0.05, 2.05, 2.8, 1.1);
      const sc = new THREE.Shape(), cx = 0.64, hw = 0.43, y0 = 0.62, y1 = 2.6; sc.moveTo(cx - hw, y0); sc.lineTo(cx + hw, y0); sc.lineTo(cx + hw, y1 - hw); sc.absarc(cx, y1 - hw, hw, 0, Math.PI, false); sc.lineTo(cx - hw, y0);
      for (let y = y0 + 0.1; y < y1 - 0.12; y += 0.1) for (let x = cx - hw + 0.08; x < cx + hw - 0.06; x += 0.1) { const xx = x + (Math.round((y - y0) / 0.1) % 2 ? 0.05 : 0); if (y > y1 - hw && Math.hypot(xx - cx, y - (y1 - hw)) > hw - 0.07) continue; if (xx > cx + hw - 0.05) continue; sc.holes.push(poly([[xx, y - 0.035], [xx + 0.03, y], [xx, y + 0.035], [xx - 0.03, y]])); }
      const scr = new THREE.Mesh(new THREE.ExtrudeGeometry(sc, { depth: 0.02, bevelEnabled: false, curveSegments: 20 }), WOOD()); scr.position.z = z - 0.03; root.add(scr);
      const gl = led(0xffbf78, 1.4); moods.strips.push(gl); root.add(box(0.8, 1.9, 0.004, gl, cx, y0 + 0.02, z - 0.07));
    }
    if (style === 'cubbies') {                                                                // lit display cubbies + deep box pelmet with downlights over the sliders
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { if (c > 0 && r < 1) continue; const x0 = 0.08 + c * 0.38, y0 = 1.35 + r * 0.36;
        root.add(box(0.32, 0.3, 0.004, () => M('__clay_plaster_niche', 0xbf927a), x0 + 0.16, y0, z - 0.1)); for (const [w2, h2, dx, dy] of [[0.32, 0.01, 0, 0], [0.32, 0.01, 0, 0.29], [0.01, 0.3, -0.155, 0], [0.01, 0.3, 0.155, 0]]) root.add(box(w2, h2, 0.1, WOOD, x0 + 0.16 + dx, y0 + dy, z - 0.1));
        const l2 = led(0xffc880, 2.2); moods.strips.push(l2); root.add(box(0.28, 0.006, 0.01, l2, x0 + 0.16, y0 + 0.28, z - 0.02));
        if ((r + c) % 2 === 0) root.add(loose(cyl(0.03, 0.04, 0.12, () => M('__vase_cream', 0xe9dfcf), x0 + 0.16, y0 + 0.01, z - 0.06, 16))); else root.add(loose(box(0.16, 0.08, 0.08, () => M('__books_stack', 0x8a6f58), x0 + 0.16, y0 + 0.01, z - 0.09, 0.004))); }
      root.add(box(xeP - solidTo, 0.2, 0.26, DARK, (solidTo + xeP) / 2, 2.1, z - 0.02, 0.006));
      for (let x = solidTo + 0.3; x < xeP - 0.2; x += 0.55) { const dl = led(0xfff0d8, 3); moods.strips.push(dl); const d2 = cyl(0.03, 0.03, 0.004, dl, x, 2.098, z + 0.12, 16); root.add(d2); }
    }
    if (style === 'bronze-fins') {                                                            // bronze fins with LEDs between; horizontal fins over the sliders
      const BRZ = () => M('__bronze_satin', 0x6b5137);
      for (let x = 0.05, k = 0; x < xs - 0.03; x += 0.11, k++) { root.add(box(0.018, 2.72, 0.09, BRZ, x, 0.06, z, 0.004)); if (k % 2) { const l3 = led(0xffc070, 2.2); moods.strips.push(l3); root.add(box(0.008, 2.6, 0.006, l3, x - 0.055, 0.12, z + 0.002)); } }
      for (const y of [2.3, 2.46, 2.62]) root.add(box(xeP - solidTo, 0.02, 0.12, BRZ, (solidTo + xeP) / 2, y, z, 0.004));
    }
    if (style === 'mughal') {                                                                 // multifoil arch niche + brass edging on every cusp
      const brassEdge = pts => root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([px, py]) => new THREE.Vector3(px, py, z + 0.004))), Math.max(40, pts.length * 2), 0.008, 6, false), BRASS()));
      brassEdge(edgePts.filter(([, py]) => py > 1.98));
      const nc = 0.64, nw = 0.42, n0 = 0.62, nsp = 1.85, nP = []; for (let i = 0; i <= 90; i++) { const t = Math.PI - Math.PI * i / 90, f = 1 - 0.1 * Math.abs(Math.sin(3.5 * (Math.PI - t))); nP.push([nc + Math.cos(t) * nw * (i > 2 && i < 88 ? f : 1), nsp + Math.sin(t) * 0.55 * f]); }
      const ns = new THREE.Shape(); ns.moveTo(nc - nw, n0); ns.lineTo(nc - nw, nsp); for (const [px, py] of nP) ns.lineTo(px, py); ns.lineTo(nc + nw, n0); ns.lineTo(nc - nw, n0);
      const nm = new THREE.Mesh(new THREE.ExtrudeGeometry(ns, { depth: 0.01, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0xc69a74, emissive: new THREE.Color(0xffb46a), emissiveIntensity: 0.35, roughness: 0.9, name: '__mughal_niche' })); nm.position.z = z; root.add(nm);
      brassEdge([[nc - nw, n0], [nc - nw, nsp], ...nP, [nc + nw, n0]]);
      root.add(box(0.5, 0.025, 0.12, BRASS, nc, 1.15, z)); root.add(loose(cyl(0.035, 0.045, 0.05, () => M('__diya_brass', 0xb08d57), nc, 1.175, z + 0.06, 16)));
    }
    if (style === 'bauhaus') {                                                                // colour blocks + walnut strips
      const TER = () => M('__paint_terracotta', 0xb8664a), SAG = () => M('__paint_sage', 0x8f9a75), MUS = () => M('__paint_mustard', 0xc99a3e);
      const semi = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48, 0, Math.PI), TER()); semi.position.set(0.55, 1.35, z + 0.002); root.add(semi);
      root.add(box(0.5, 0.9, 0.004, SAG, 0.95, 1.35, z)); const dot = new THREE.Mesh(new THREE.CircleGeometry(0.17, 40), MUS()); dot.position.set(0.3, 2.35, z + 0.003); root.add(dot);
      for (const [x, y, w2, h2] of [[0.05, 0.3, 0.03, 2.4], [0.2, 1.33, 1.06, 0.03], [1.2, 0.3, 0.03, 2.4]]) root.add(box(w2, h2, 0.02, WOOD, x + w2 / 2, y, z));
    }
    if (style === 'sun-relief') {                                                             // carved sun in microcement + horizontal grooves
      for (let k = 0; k < 4; k++) { const ring = new THREE.Mesh(new THREE.RingGeometry(0.12 + k * 0.1, 0.16 + k * 0.1, 64), M('__microcement_greige_d' + k, [0xd8ccb8, 0xc2b39b, 0xd8ccb8, 0xc2b39b][k])); ring.position.set(0.64, 1.85, z + 0.002 + k * 0.004); root.add(ring); }
      for (let y = 0.3; y < 1.4; y += 0.14) root.add(box(xs - 0.06, 0.006, 0.004, PS5B, xs / 2, y, z));
      const sg = led(0xffc070, 1.6); moods.strips.push(sg); const sd = new THREE.Mesh(new THREE.CircleGeometry(0.12, 40), sg); sd.position.set(0.64, 1.85, z + 0.02); root.add(sd);
    }
    if (style === 'fabric-canopy') {                                                          // upholstered wall + crown canopy over the bed
      for (let x = 0.05; x < xs - 0.05; x += 0.16) root.add(box(0.006, 2.7, 0.004, () => M('__boucle_seam', 0x9f9180), x, 0.06, z));
      // crown canopy: a quarter-round linen hood from the ceiling line, 0.6 m out over the bed head (profile extruded along the wall)
      const R = 0.6, t2 = 0.02, prof = new THREE.Shape(); prof.moveTo(0, 2.84); prof.absarc(0, 2.84 - R, R, Math.PI / 2, 0, true); prof.lineTo(R - t2, 2.84 - R);
      prof.absarc(0, 2.84 - R, R - t2, 0, Math.PI / 2, false); prof.lineTo(0, 2.84);
      const pts = prof.getPoints(32).map(p => new THREE.Vector2(-p.x, p.y)); const hood = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 2.0, bevelEnabled: false }), M('__canopy_linen', 0xe7ddcc));
      hood.rotation.y = Math.PI / 2; hood.position.set(0.42, 0, z); root.add(hood);                      // shape −x → +z (out from the wall), extrusion → +x (along the wall)
      const cl = ledStrip({ w: 2.0, wash: 0.5, dir: 'down', alpha: 0.5 }); cl.obj.position.set(1.42, 2.84 - R - 0.005, z + R - 0.03); root.add(cl.obj); moods.strips.push(...cl.moods.strips); (moods.halos = moods.halos || []).push(...cl.moods.halos);
    }
    // same lighting soul on every style: vertical LED profiles at the solid edge + far pilaster, top cove washing down
    moods.halos = moods.halos || [];
    const prof = led(0xffc880, 2.4); moods.strips.push(prof);
    root.add(box(0.012, Math.max(0.5, edgePts[0][1] - 0.12), 0.008, prof, xs - 0.025, 0.06, z + 0.002));
    root.add(box(0.012, Math.max(0.5, edgePts[edgePts.length - 1][1] - 0.12), 0.008, prof, xe + 0.02, 0.06, z + 0.002));
    const cove = ledStrip({ w: length - 0.06, wash: 0.55, dir: 'down', alpha: 0.45 }); cove.obj.position.set(length / 2, 2.8, z + 0.01); root.add(cove.obj);
    moods.strips.push(...cove.moods.strips); moods.halos.push(...cove.moods.halos);
    return { obj: root, moods };
  }

  /* arched timber valance across the TOP of a wall (owner 2026-11-10: wood cut-out over the top of the passage only,
     semi-arch shapes, nothing blocking below): walnut band from the ceiling down to `bottom`, its lower edge a row of
     semi-arches, a row of small round cut-outs above them, slim pilasters at both ends, LED tracing the arch edges.
     Local frame: centred on x, back at z 0 (stands `standoff` off the wall/curtains), front +z. */
  function archValance({ length = 3.6, top = 2.85, bottom = 2.05, arches = 4, standoff = 0.13, depth = 0.03, pilaster = 0.09, wood = WOOD } = {}) {
    const root = g(), moods = { strips: [] }, x0 = -length / 2, inner = length - 2 * pilaster, aw = inner / arches, r = aw / 2 - 0.035;
    const sh = new THREE.Shape(); sh.moveTo(x0, top); sh.lineTo(x0 + length, top); sh.lineTo(x0 + length, bottom);
    const edge = [];                                                                       // arch edge points (for the LED)
    for (let k = arches - 1; k >= 0; k--) {
      const cx = x0 + pilaster + aw * (k + 0.5);
      sh.lineTo(cx + r, bottom); sh.absarc(cx, bottom, r, 0, Math.PI, false); sh.lineTo(x0 + pilaster + aw * k, bottom);
      const seg = []; for (let i = 0; i <= 24; i++) { const a2 = Math.PI * i / 24; seg.push(new THREE.Vector3(cx + Math.cos(a2) * r, bottom + Math.sin(a2) * r, 0)); } edge.push(seg);
    }
    sh.lineTo(x0, bottom); sh.lineTo(x0, top);
    const band0 = bottom + r + 0.08, band1 = top - 0.08;                                   // round cut-outs above the arches
    if (band1 - band0 > 0.1) for (let k = 0; k < arches * 3; k++) { const hx = x0 + pilaster + inner * (k + 0.5) / (arches * 3), hy = (band0 + band1) / 2; const hp = new THREE.Path(); hp.absarc(hx, hy, Math.min(0.045, (band1 - band0) / 3), 0, Math.PI * 2, true); sh.holes.push(hp); }
    const woodM = typeof wood === 'function' ? wood() : wood;
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1, curveSegments: 24 }), woodM);
    m.position.z = standoff; root.add(m);
    for (const sx of [-1, 1]) root.add(box(pilaster, top, depth + 0.01, wood, sx * (length / 2 - pilaster / 2), 0, standoff - 0.005));   // pilasters to the floor
    root.add(box(length, 0.02, standoff + depth, wood, 0, top - 0.02, 0));                             // returns to the wall at the ceiling
    const glow = led(0xffc880, 2.8), cove = led(0xffc880, 2.2); moods.strips.push(glow, cove);
    for (const seg of edge) root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seg.map(v => new THREE.Vector3(v.x, v.y + 0.006, standoff + depth * 0.4))), 48, 0.005, 6, false), glow));
    root.add(box(length - 2 * pilaster, 0.008, 0.01, cove, 0, top - 0.035, standoff - 0.02));             // up-light behind onto the ceiling
    return { obj: root, moods };
  }

  /* balcony wall frame (owner 2026-11-10): the solid part of the wall is finished floor-to-ceiling in walnut with a
     backlit clay arch niche (+ oak shelves) and a backlit plaster 'moon'; the same walnut continues as a header over the
     sliding doors down to headY, meeting the solid part and the far end with quarter-arch curves (one arched frame
     round the sliders), slim pilaster at the far end, LED under the header and at the floor. The frame stands in front
     of the curtain track (it hides the track; open curtains tuck behind the solid panel).
     Local frame: x from 0 (wall end at the solid side) to length; back at z 0 (wall), front +z. */
  function balconyWallFrame({ length = 3.658, solidTo = 1.28, headY = 2.15, top = 2.85, r = 0.38, pil = 0.08, standoff = 0.13, depth = 0.025,
    niche = { x: 0.26, w: 0.42, y0: 0.66, y1: 2.25 }, moon = { x: 0.9, y: 1.85, r: 0.3 }, grooves = true, moonMat = null, nicheMat = null, edge = 'quarter', holes = [], wood = WOOD } = {}) {
    const root = g(), moods = { strips: [] }, xs = solidTo, xe = length, z0 = standoff;
    // the header's lower edge over the sliders (from the solid side xs to the pilaster xe − pil): each style its own cut
    const ep = headerEdge(edge, xs, xe - pil, headY, r);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(xs, 0);
    if (edge === 'none') { sh.lineTo(xs, top); sh.lineTo(0, top); sh.lineTo(0, 0); }          // solid section only (no header)
    else { for (const [px, py] of ep) sh.lineTo(px, py); sh.lineTo(xe - pil, 0); sh.lineTo(xe, 0); sh.lineTo(xe, top); sh.lineTo(0, top); sh.lineTo(0, 0); }
    for (const h of holes) sh.holes.push(h);
    const archPath = (cx, w, y0, y1, grow = 0) => { const p = new THREE.Path(), hw = w / 2 + grow; p.moveTo(cx - hw, y0 - grow); p.lineTo(cx + hw, y0 - grow); p.lineTo(cx + hw, y1 - hw); p.absarc(cx, y1 - hw, hw, 0, Math.PI, false); p.lineTo(cx - hw, y0 - grow); return p; };
    if (niche) sh.holes.push(archPath(niche.x, niche.w, niche.y0, niche.y1));
    if (moon) { const mh = new THREE.Path(); mh.absarc(moon.x, moon.y, moon.r, 0, Math.PI * 2, true); sh.holes.push(mh); }
    const woodM = typeof wood === 'function' ? wood() : wood;
    const panel = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 28 }), woodM);
    panel.position.z = z0; root.add(panel);
    if (grooves) for (let x = 0.32; x < xs - 0.05; x += 0.32) if ((!niche || Math.abs(x - niche.x) > niche.w / 2 + 0.02) && (!moon || Math.abs(x - moon.x) > moon.r + 0.02)) root.add(box(0.004, top - 0.02, 0.003, PS5B, x, 0.01, z0 + depth));   // V-grooves
    // returns to the wall (no see-through gaps): solid edge up to the arch, ceiling band, far pilaster
    if (edge === 'none') { root.add(box(0.02, top, z0, wood, xs - 0.01, 0, 0)); root.add(box(xs, 0.02, z0, wood, xs / 2, top - 0.02, 0)); }
    else { root.add(box(0.02, ep[0][1], z0, wood, xs - 0.01, 0, 0)); root.add(box(xe, 0.02, z0, wood, xe / 2, top - 0.02, 0)); root.add(box(pil, top, z0, wood, xe - pil / 2, 0, 0)); }
    // clay plaster inside the niche + moon, each with a warm halo just behind the cut edge
    const clay = nicheMat || (() => M('__clay_plaster_niche', 0xbf927a)), halo = led(0xffc27a, 2.4); moods.strips.push(halo);
    if (niche) {
    const nh = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(archPath(niche.x, niche.w, niche.y0, niche.y1, 0.012).getPoints(40))), halo); nh.position.z = z0 - 0.02; root.add(nh);
    root.add(box(niche.w - 0.01, niche.y1 - niche.y0, 0.01, clay, niche.x, niche.y0, z0 - 0.05));
    for (const sy of [1.25, 1.72]) root.add(box(niche.w - 0.02, 0.022, 0.12, OAK, niche.x, sy, z0 - 0.05));
    const vz = g(); vz.add(cyl(0.04, 0.05, 0.16, () => M('__vase_cream', 0xe9dfcf), 0, 0, 0, 20)); vz.add(cyl(0.003, 0.003, 0.26, () => M('__dried_stem', 0x8c7a5c), 0.008, 0.16, 0, 6));
    vz.position.set(niche.x, 1.272, z0); root.add(loose(vz));
    root.add(loose(box(0.14, 0.18, 0.025, () => M('__frame_print', 0xd8c7b0), niche.x, 1.742, z0 - 0.03, 0.004)));
    }
    if (moon) {
    const mg = new THREE.Mesh(new THREE.CircleGeometry(moon.r + 0.015, 48), halo); mg.position.set(moon.x, moon.y, z0 - 0.02); root.add(mg);
    const md = new THREE.Mesh(new THREE.CylinderGeometry(moon.r - 0.01, moon.r - 0.01, 0.02, 48), new THREE.MeshStandardMaterial({ color: 0xe8dccb, roughness: 0.95, name: '__moon_plaster' }));
    if (moonMat) md.material = moonMat;
    md.rotation.x = Math.PI / 2; md.position.set(moon.x, moon.y, z0 - 0.005); root.add(md);
    }
    // header soffit light (washes the curtains) + floor line under the solid panel
    const soff = led(0xffc880, 2.6), toe = led(0xffc880, 2); moods.strips.push(soff, toe);
    const lp = ep.filter(([, py]) => py > 1.5).map(([px, py]) => new THREE.Vector3(px, py - 0.008, z0 + 0.006));   // LED follows the cut edge
    if (edge !== 'none' && lp.length > 1) root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lp, false, 'centripetal'), Math.max(16, lp.length * 3), 0.004, 6, false), soff));
    root.add(box(xs - 0.04, 0.006, 0.006, toe, xs / 2, 0.02, z0 + depth + 0.004));
    return { obj: root, moods, edge: ep };
  }
  // lower-edge contours for the header over the sliders, listed from a (solid side) to b (far pilaster)
  function headerEdge(kind, a, b, headY = 2.15, r = 0.38) {
    const P = [], arc = (cx, cy, rad, t0, t1, n = 24) => { for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; P.push([cx + Math.cos(t) * rad, cy + Math.sin(t) * rad]); } };
    const W = b - a, cx = (a + b) / 2;
    switch (kind) {
      case 'semi': { const sp = 2.02, ry = 0.66, rx = W / 2; for (let i = 0; i <= 48; i++) { const t = Math.PI - Math.PI * i / 48; P.push([cx + Math.cos(t) * rx, sp + Math.sin(t) * ry]); } break; }
      case 'scallop': { const n = 5, w = W / n, sp = 2.16; for (let k = 0; k < n; k++) arc(a + w * (k + 0.5), sp, w / 2, Math.PI, 0, 16); break; }
      case 'gothic': { const n = 3, w = W / n, sp = 2.02; for (let k = 0; k < n; k++) { const ai = a + w * k, bi = ai + w; arc(bi, sp, w, Math.PI, Math.PI / 3, 14); arc(ai, sp, w, 2 * Math.PI / 3, 0, 14); } break; }
      case 'straight': P.push([a, headY], [b, headY]); break;
      case 'notch': { const y = 2.1, rn = 0.42; P.push([a, y], [cx - rn, y]); arc(cx, y, rn, Math.PI, 0, 28); P.push([b, y]); break; }
      case 'wave': { const base = 2.22, amp = 0.13; for (let i = 0; i <= 60; i++) { const t = i / 60; P.push([a + W * t, base + amp * Math.sin(Math.PI * 2 * 2.25 * t + 0.4)]); } break; }
      case 'segmental': { const sp = 2.06, sag = 0.34, R = (W * W / 4 + sag * sag) / (2 * sag), cy = sp + sag - R, h = Math.asin((W / 2) / R); arc(cx, cy, R, Math.PI / 2 + h, Math.PI / 2 - h, 40); break; }
      case 'chevron': { const sp = 2.0, pk = 2.42, d = 0.42; P.push([a, sp], [a + d, pk], [cx - 0.18, pk], [cx, pk + 0.14], [cx + 0.18, pk], [b - d, pk], [b, sp]); break; }
      case 'none': P.push([a, 2.85], [b, 2.85]); break;
      case 'fringe': { const n = 26, w = W / n; for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, y = 2.02 + 0.42 * Math.pow(Math.abs(2 * t - 1), 1.6) * -1 + 0.42 - 0.06 * (k % 2); P.push([a + w * k, y], [a + w * (k + 1), y]); } break; }
      case 'multifoil': { const sp = 2.0, rx = W / 2, ry = 0.7; for (let i = 0; i <= 140; i++) { const t = Math.PI - Math.PI * i / 140, f = 1 - 0.07 * Math.abs(Math.sin(4.5 * (Math.PI - t))); P.push([cx + Math.cos(t) * rx * (t > 0.05 && t < Math.PI - 0.05 ? f : 1), sp + Math.sin(t) * ry * f]); } break; }
      case 'bauhaus': { const y = 2.15, rb = 0.45; P.push([a, y]); arc(a + 0.35 + rb, y, rb, Math.PI, 0, 28); P.push([b, y]); break; }
      case 'twin': { const n = 2, w = W / n, sp = 2.0; for (let k = 0; k < n; k++) { const c2 = a + w * (k + 0.5); for (let i = 0; i <= 32; i++) { const t = Math.PI - Math.PI * i / 32; P.push([c2 + Math.cos(t) * (w / 2), sp + Math.sin(t) * 0.5]); } } break; }
      case 'scallop7': { const n = 7, w = W / n, sp = 2.3; for (let k = 0; k < n; k++) arc(a + w * (k + 0.5), sp, w / 2, Math.PI, 0, 12); break; }
      case 'pelmet': P.push([a, 2.3], [b, 2.3]); break;
      case 'fins': P.push([a, 2.25], [b, 2.25]); break;
      case 'quarter': default: arc(a + r, headY - r, r, Math.PI, Math.PI / 2, 14); arc(b - r, headY - r, r, Math.PI / 2, 0, 14); break;
    }
    return P;
  }

  /* 1.5 TR inverter split AC indoor unit (≈ 1000 × 300 × 230 mm, e.g. Daikin / LG / Panasonic 1.5 T): wall-mounted,
     top ≥ 150 mm below the ceiling for return air; pipes + drain + power leave from the back into a concealed wall chase */
  function splitAC({ w = 1.0, h = 0.3, d = 0.23, top = 2.72 } = {}) {
    const root = g(), y = top - h, white = () => M('__ac_white', 0xf3f3f1);
    root.add(box(w, h, d, white, 0, y, 0, 0.03));
    root.add(box(w - 0.06, 0.006, 0.004, () => M('__ac_seam', 0xd9d9d6), 0, y + h * 0.55, d));        // front panel seam
    root.add(box(w - 0.12, 0.05, 0.01, PS5B, 0, y + 0.02, d - 0.03));                                    // air outlet + louvre
    const louv = box(w - 0.14, 0.004, 0.06, white, 0, y + 0.03, d - 0.045); louv.rotation.x = 0.5; root.add(louv);
    root.add(box(0.05, 0.012, 0.002, led(0x9fe0ff, 1.2), w / 2 - 0.12, y + 0.1, d + 0.001));            // display
    return { obj: loose(root) };
  }

  /* slatted oak ceiling canopy over the bed head with a cove glow (projector lift hides in it) */
  function ceilingCanopy({ w = 2.6, d = 0.95, y = 2.82 } = {}) {
    const root = g(), moods = { strips: [] };
    root.add(box(w, 0.012, d, PS5B, 0, y + 0.03, 0));
    for (let x = -w / 2 + 0.02; x < w / 2 - 0.01; x += 0.05) root.add(box(0.03, 0.03, d, OAK, x, y, 0));
    const cove = led(0xffc890, 2.6); moods.strips.push(cove);
    for (const sz of [0, d]) root.add(box(w, 0.006, 0.01, cove, 0, y - 0.004, sz));
    return { obj: loose(root), moods };
  }
  function bedBench({ w = 1.5, d = 0.42, h = 0.45, fabric = () => M('__bed_upholstery_8f8378', 0x8f8378) } = {}) {
    const root = g(); root.add(box(w, 0.16, d, fabric, 0, h - 0.16, 0, 0.03)); root.add(box(w - 0.04, 0.2, d - 0.04, OAK, 0, h - 0.36, 0.02, 0.01));
    for (const sx of [-1, 1]) for (const sz of [0.04, d - 0.04]) root.add(cyl(0.012, 0.012, h - 0.36, PS5B, sx * (w / 2 - 0.06), 0, sz, 10));
    return { obj: loose(root) };
  }

  /* ---------- cream two-drawer nightstand (hollow carcass, drawers with trays, round dark knobs) ---------- */
  function nightstand({ legs = true, w = 0.42, d = 0.4, h = 0.56, body = () => M('__cream_lacquer', 0xe9e1cf), knob = () => M('__knob_bronze', 0x3a3430) } = {}) {
    const root = g(), t = 0.016, legH = 0.06, bodyH = h - legH, inner = () => M('__carcass_liner', 0xece6da);
    if (legs) for (const sx of [-1, 1]) for (const sz of [0.04, d - 0.06]) root.add(cyl(0.012, 0.01, legH, knob, sx * (w / 2 - 0.04), 0, sz, 10));
    root.add(box(w, t, d, body, 0, legH, 0)); root.add(box(w, t, d, body, 0, h - t, 0));
    root.add(box(t, bodyH, d, body, -w / 2 + t / 2, legH, 0)); root.add(box(t, bodyH, d, body, w / 2 - t / 2, legH, 0));
    root.add(box(w - 2 * t, bodyH, t, inner, 0, legH, 0));
    const dh = (bodyH - 2 * t - 0.006) / 2;
    for (let k = 0; k < 2; k++) {
      const y = legH + t + k * (dh + 0.006), dr = g();
      dr.add(box(w - 0.006, dh - 0.004, 0.018, body, 0, y, d - 0.018, 0.003));
      dr.add(cyl(0.013, 0.013, 0.02, knob, 0, 0, 0, 16)); const kb = dr.children[dr.children.length - 1]; kb.rotation.x = Math.PI / 2; kb.position.set(0, y + dh / 2, d + 0.008);
      const tw = w - 2 * t - 0.01, tD = d - 0.06, th = dh - 0.04;
      dr.add(box(tw, 0.008, tD, inner, 0, y + 0.012, d - 0.018 - tD)); dr.add(box(tw, th, 0.008, inner, 0, y + 0.012, d - 0.018 - tD));
      dr.add(box(0.008, th, tD, inner, -tw / 2, y + 0.012, d - 0.018 - tD)); dr.add(box(0.008, th, tD, inner, tw / 2, y + 0.012, d - 0.018 - tD));
      tagGroup(dr, { type: 'slide', slide: [0, 0, 0.28], label: 'nightstand drawer' }); root.add(dr);
    }
    return { obj: root };
  }
  // cone pendant (reference: white wide cone on a long cord)
  function pendant({ drop = 1.25, ceiling = 2.9, dia = 0.42 } = {}) {
    const root = g(), y = ceiling - drop;
    root.add(cyl(0.002, 0.002, drop - 0.12, () => M('__cord_black', 0x111111), 0, y + 0.12, 0, 6));
    root.add(cyl(0.035, 0.035, 0.012, () => M('__cord_black', 0x111111), 0, ceiling - 0.012, 0, 16));
    const shade = new THREE.Mesh(new THREE.ConeGeometry(dia / 2, 0.13, 40, 1, true), M('__shade_white', 0xf3efe6)); shade.material.side = THREE.DoubleSide; shade.position.y = y + 0.065; root.add(shade);
    root.add(box(0.05, 0.03, 0.05, led(0xffd6a0, 3), 0, y + 0.04, -0.025));
    return { obj: loose(root) };
  }
  function wallSconce({ y = 1.25 } = {}) {
    const root = g(), blk = () => M('__matte_black', 0x141414);
    root.add(box(0.07, 0.11, 0.015, blk, 0, y - 0.055, 0, 0.004));
    const arm = cyl(0.008, 0.008, 0.12, blk, 0, 0, 0, 10); arm.rotation.x = Math.PI / 2; arm.position.set(0, y, 0.07); root.add(arm);
    const head = cyl(0.025, 0.03, 0.08, blk, 0, 0, 0, 20); head.position.set(0, y - 0.04, 0.13); root.add(head);
    root.add(box(0.03, 0.004, 0.03, led(0xffd6a0, 3), 0, y - 0.085, 0.115));
    return { obj: loose(root) };
  }
  function vasePlant({ h = 0.5 } = {}) {
    const root = g(), terr = () => M('__terracotta', 0xc0785a), leaf = () => M('__leaf_green', 0x6f8a4a);
    root.add(cyl(0.06, 0.075, 0.22, terr, 0, 0, 0.1, 24)); root.add(cyl(0.035, 0.06, 0.04, terr, 0, 0.22, 0.1, 24));
    for (let k = 0; k < 7; k++) { const st = cyl(0.003, 0.003, h * (0.6 + 0.4 * ((k * 37) % 10) / 10), leaf, 0, 0, 0, 5); st.position.set(0, 0.26 + st.geometry.parameters.height / 2, 0.1); st.rotation.z = (k - 3) * 0.12; st.rotation.x = ((k * 13) % 5 - 2) * 0.08; root.add(st);
      const lf = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), leaf()); lf.scale.set(1, 0.4, 0.6); lf.position.set(Math.sin((k - 3) * 0.12) * -st.geometry.parameters.height, 0.26 + st.geometry.parameters.height * 0.95, 0.1); root.add(lf); }
    return { obj: loose(root) };
  }

  /* ---------- ceiling cassette + roll-down projector screen ---------- */
  function projectorScreen({ width = 2.21, imageH = 1.243, drop = 0.5, ceiling = 3.05 } = {}) {
    const root = g();
    root.add(box(width + 0.12, 0.11, 0.12, SCREEN, 0, ceiling - 0.11, -0.06, 0.01));
    const roll = g();
    roll.add(box(width, drop, 0.003, BLACK, 0, -drop, 0));
    roll.add(box(width, imageH, 0.003, SCREEN, 0, -drop - imageH, 0));
    roll.add(box(width + 0.02, 0.03, 0.02, GRAPH, 0, -drop - imageH - 0.03, -0.008));
    // projected picture: invisible until the projector is on (the app fades it in and swaps the texture)
    const imgMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, name: '__projector_image' });
    const img = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.05, imageH - 0.05), imgMat); img.position.set(0, -drop - imageH / 2, 0.0045); roll.add(img);
    roll.position.y = ceiling - 0.11;
    tagGroup(roll, { type: 'roll', label: 'projector screen', hinge: [0, ceiling - 0.11, 0] });
    root.add(roll);
    // light the room from the screen while a picture is showing
    const glow = new THREE.RectAreaLight(0xdfe6ff, 0, width - 0.05, imageH - 0.05);
    glow.position.set(0, ceiling - 0.11 - drop - imageH / 2, 0.02); glow.lookAt(0, ceiling - 0.11 - drop - imageH / 2, 1); root.add(glow);
    return { obj: root, moods: { projectorScreen: { imgMat, light: glow, width: width - 0.05, imageH: imageH - 0.05 } } };
  }
  // projector on a motorised ceiling lift: at rest it sits in the false-ceiling void with its bottom plate flush with
  // the ceiling; the app lowers it (slide mover, 'projector lift') before switching on
  function projector({ ceiling = 2.9, drop = 0.36 } = {}) {
    const root = g(), body = g(), y0 = ceiling;            // plate bottom = ceiling line when retracted
    body.add(box(0.44, 0.012, 0.36, SCREEN, 0, y0 - 0.012, -0.18, 0.003));                 // flush ceiling plate
    body.add(box(0.33, 0.12, 0.26, IVORY, 0, y0, -0.13, 0.015));                         // projector standing on it
    const lens = cyl(0.035, 0.035, 0.02, BLACK, 0, 0, 0); lens.rotation.x = Math.PI / 2; lens.position.set(0, y0 + 0.06, 0.135); body.add(lens);
    for (const sx of [-1, 1]) for (const sz of [-0.15, 0.13]) body.add(box(0.01, drop, 0.01, GRAPH, sx * 0.19, y0, sz));   // lift rods
    tagGroup(body, { type: 'slide', slide: [0, -drop, 0], label: 'projector lift' });
    root.add(body);
    return { obj: loose(root), moods: { projectorLift: { lens: [0, y0 + 0.06, 0.15], drop } } };
  }

  /* ---------- multifunction wall: desk + concealed vented mini-fridge + wall cabinets + tall sliding storage ---------- */
  function workWall({ cornerLeft = false, width = 2.72, deskW = 1.0, fridgeW = 0.62, tallW = null, depth = 0.55, wallCab = true, loft = false } = {}) {
    const root = g(), moods = { strips: [] }, x0 = -width / 2;
    const tall = tallW ?? width - deskW - fridgeW;
    // desk: floating top, drawer, modesty panel
    const dx = x0 + deskW / 2;
    if (deskW > 0) {
    root.add(box(deskW, 0.03, depth - 0.05, WOOD, dx, 0.72, 0, 0.004));
    root.add(box(deskW, 0.6, 0.018, OAK, dx, 0.12, 0));
    const drw = g(); drw.add(box(0.5, 0.11, 0.42, OAK, 0, 0.6, 0.06)); drw.add(box(0.52, 0.12, 0.018, WOOD, 0, 0.595, depth - 0.07)); drw.position.x = dx + 0.2;
    tagGroup(drw, { type: 'slide', slide: [0, 0, 0.32], label: 'desk drawer' }); root.add(drw);
    root.add(loose(box(0.33, 0.012, 0.23, GRAPH, dx - 0.1, 0.75, 0.15)));                                // laptop base
    const lid = loose(box(0.33, 0.22, 0.008, GRAPH, dx - 0.1, 0.758, 0.15)); lid.rotation.x = -0.25; root.add(lid);
    }
    // concealed mini fridge: carcass, vented door (top + plinth slots), fridge body inside
    const fx = x0 + deskW + fridgeW / 2, fh = 0.88;
    if (fridgeW > 0) {
    root.add(box(fridgeW, fh, depth, WOOD, fx, 0, 0));
    root.add(box(fridgeW - 0.04, fh - 0.12, depth - 0.05, BLACK, fx, 0.08, 0.01));
    root.add(loose(box(0.47, 0.62, 0.5, FRIDGE, fx, 0.1, 0.02, 0.01)));                                  // ≈45 L mini fridge 470×620×500
    const fdoor = g();
    fdoor.add(box(fridgeW - 0.006, fh - 0.1, 0.018, WOOD, fridgeW / 2 - 0.003, 0.08, 0));
    for (let i = 0; i < 6; i++) fdoor.add(box(0.012, 0.09, 0.004, BLACK, 0.12 + i * 0.07, fh - 0.17, 0.016));   // vent slots
    for (let i = 0; i < 6; i++) fdoor.add(box(0.012, 0.05, 0.004, BLACK, 0.12 + i * 0.07, 0.11, 0.016));
    fdoor.add(box(0.012, 0.18, 0.02, BRASS, fridgeW - 0.05, 0.5, 0.018));
    fdoor.position.set(fx - fridgeW / 2, 0, depth - 0.018);
    tagGroup(fdoor, { type: 'cab', hinge: [fx - fridgeW / 2, 0, depth - 0.018], a1: -Math.PI * 0.55, label: 'mini-fridge cabinet' });
    root.add(fdoor);
    root.add(box(fridgeW, 0.06, 0.4, BLACK, fx, 0.0, depth - 0.42));                              // plinth vent channel
    }
    // wall cabinets with under-LED over desk + fridge
    if (wallCab && deskW + fridgeW > 0.3) {
      const ww = deskW + fridgeW, wx = x0 + ww / 2, wy = 1.55, wh = 0.8, wd = 0.35;
      root.add(box(ww, wh, wd, WOOD, wx, wy, 0));
      const nD = 3, dWd = ww / nD;
      for (let i = 0; i < nD; i++) {
        // pairs hinged on their outer edges; a leaf next to a pair shares the partition line with it
        // cornerLeft: the unit's left end meets a wall finish → its first leaf hinges on the right so it cannot swing into it
        const left = i % 2 === 0 && !(cornerLeft && i === 0), sd = left ? 1 : -1, d = g(), hx = x0 + i * dWd + (left ? 0 : dWd);
        d.add(box(dWd - 0.006, wh - 0.006, 0.018, SAGE, sd * (dWd / 2), wy + 0.003, 0));
        d.add(box(0.012, 0.14, 0.02, BRASS, sd * (dWd - 0.04), wy + 0.04, 0.018));
        d.position.set(hx, 0, wd);
        tagGroup(d, { type: 'cab', hinge: [hx, 0, wd], a1: -sd * Math.PI * 0.5, label: 'wall cabinet' }); root.add(d);
      }
      const ul = led(0xffd7a8, 2); root.add(box(ww - 0.06, 0.008, 0.01, ul, wx, wy - 0.01, wd - 0.04)); moods.strips.push(ul);
      const task = new THREE.RectAreaLight(0xffe2bd, 5, ww - 0.1, 0.12); task.position.set(wx, wy - 0.02, wd - 0.08); task.lookAt(wx, 0, wd - 0.08); root.add(task);
    }
    // tall storage with two sliding shutters
    if (tall > 0.4) {
      const tx = x0 + deskW + fridgeW + tall / 2, th = 2.45;
      root.add(box(tall, th, depth, WOOD, tx, 0, 0));
      for (const [k, sx] of [[0, -1], [1, 1]]) {
        const s = g(); s.add(box(tall / 2 + 0.01, th - 0.04, 0.02, GREIGE, sx * tall / 4, 0.02, depth + 0.004 + k * 0.024));
        s.add(box(0.012, 0.5, 0.02, BRASS, sx * (tall / 4) - sx * (tall / 4 - 0.05), 0.9, depth + 0.026 + k * 0.024));
        s.position.x = tx; tagGroup(s, { type: 'slide', slide: [-sx * tall / 2 * 0.95, 0, 0], label: 'sliding storage' }); root.add(s);
      }
      root.add(box(tall, 0.5, depth, WOOD, tx, th + 0.05, 0));                                     // loft
    }
    if (loft) {                                                                                     // full-width loft with shutters
      root.add(box(width, 0.5, 0.45, WOOD, 0, 2.47, 0));
      const n = Math.round(width / 0.6), sw = width / n;
      for (let i = 0; i < n; i++) root.add(box(sw - 0.006, 0.48, 0.018, SAGE, x0 + sw * (i + 0.5), 2.48, 0.45));
    }
    return { obj: root, moods };
  }

  /* ---------- seating ---------- */
  // tapered solid-wood leg, splayed slightly outwards
  function leg(x, z, h, sx, sz, m = WOOD) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.011, h, 16), typeof m === 'function' ? m() : m);
    l.position.set(x, h / 2, z); l.rotation.z = -sx * 0.07; l.rotation.x = sz * 0.07; return l;
  }
  // upholstered lounge armchair: plump seat + back cushions, padded arms, tapered teak legs (≈ 600–700 W)
  function loungeChair({ w = 0.7, d = 0.76, seatH = 0.44, fabric = OLIVE } = {}) {
    const root = g(), legH = 0.17;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) root.add(leg(sx * (w / 2 - 0.07), sz < 0 ? 0.08 : d - 0.08, legH, sx, sz));
    root.add(box(w, 0.16, d - 0.02, fabric, 0, legH, 0.01, 0.045));                                 // upholstered base
    root.add(box(w - 0.17, 0.13, d - 0.17, fabric, 0, seatH - 0.12, 0.13, 0.06));                  // seat cushion
    const back = box(w - 0.12, 0.48, 0.17, fabric, 0, seatH - 0.08, 0.03, 0.075); back.rotation.x = -0.2; root.add(back);
    for (const sx of [-1, 1]) root.add(box(0.085, 0.27, d - 0.04, fabric, sx * (w / 2 - 0.043), legH + 0.1, 0.02, 0.04));   // padded arms
    return { obj: root, seat: true };
  }
  // upholstered dining/desk chair with tapered legs
  function deskChair({ fabric = LINEN } = {}) {
    const root = g();
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) root.add(leg(sx * 0.19, sz < 0 ? 0.05 : 0.42, 0.43, sx, sz));
    root.add(box(0.47, 0.08, 0.47, fabric, 0, 0.42, 0.0, 0.035));
    const back = box(0.45, 0.36, 0.06, fabric, 0, 0.52, -0.01, 0.028); back.rotation.x = -0.12; root.add(back);
    return { obj: root, seat: true };
  }
  function sideTable({ dia = 0.42, h = 0.5 } = {}) {
    const root = g();
    root.add(cyl(dia / 2, dia / 2, 0.025, WOOD, 0, h - 0.025, dia / 2, 48));
    root.add(cyl(0.025, 0.025, h - 0.05, BRASS, 0, 0.025, dia / 2));
    root.add(cyl(0.14, 0.15, 0.025, BRASS, 0, 0, dia / 2));
    return { obj: root };
  }
  function floorLamp({ h = 1.55 } = {}) {
    const root = g();
    root.add(cyl(0.13, 0.14, 0.02, BRASS, 0, 0, 0.18)); root.add(cyl(0.01, 0.01, h - 0.3, BRASS, 0, 0.02, 0.18));
    root.add(cyl(0.16, 0.2, 0.28, LINEN, 0, h - 0.3, 0.18, 40));
    const l = new THREE.PointLight(0xffc98f, 1.2, 3.5, 2); l.position.set(0, h - 0.15, 0.18); root.add(l);
    return { obj: root, lamp: l };
  }
  /* ---------- soft furnishings: draped duvet, plump pillows, throw ---------- */
  // sheet covering a w × l rectangle (centred on the origin, top at `top`), rolling over the long sides and the foot (−z) edge and hanging `hang` down
  function drapeGeo(w, l, top, { r = 0.055, hang = 0.27, puff = 0.025, wrinkle = 0.005, seg = 72, foot = true } = {}) {
    const W = w + 2 * hang, L = l + (foot ? hang : 0);
    const geo = new THREE.PlaneGeometry(W, L, seg, seg); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, arc = r * Math.PI / 2;
    const bend = t => t <= 0 ? [t, 0] : t < arc ? [r * Math.sin(t / r), r * (1 - Math.cos(t / r))] : [r, r + (t - arc)];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i) + (foot ? -hang / 2 : 0) * -1 - (foot ? hang : 0);
      const tx = Math.abs(x) - w / 2, tz = foot ? -z - l / 2 : -1;
      const [ox, dx] = bend(tx), [oz, dz] = bend(tz);
      const nx = tx > 0 ? Math.sign(x) * (w / 2 + ox) : x, nz = tz > 0 ? -(l / 2 + oz) : z;
      const crown = tx > 0 || tz > 0 ? 0 : puff * (1 - Math.min(1, (Math.abs(x) / (w / 2)) ** 4)) * (1 - Math.min(1, Math.max(0, (-z - l / 2 + 0.15) / 0.15)) ** 2);
      const y = top - dx - dz + crown + wrinkle * (Math.sin(x * 23 + z * 7) * Math.sin(z * 17 - x * 5) + 0.5 * Math.sin(x * 41 - z * 29));
      pos.setXYZ(i, nx, y, nz);
    }
    geo.computeVertexNormals(); return geo;
  }
  function drape(w, l, top, m, opts) { const mat = (typeof m === 'function' ? m() : m); const mesh = new THREE.Mesh(drapeGeo(w, l, top, opts), mat); return mesh; }
  // superellipsoid pillow: flat-ish faces, soft rounded edges
  function pillow(sx, sy, sz, m, e = [0.32, 0.65, 0.32]) {
    const geo = new THREE.SphereGeometry(1, 48, 28), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = [p.getX(i), p.getY(i), p.getZ(i)].map((c, k) => Math.sign(c) * Math.abs(c) ** e[k]);
      const pinch = 1 - 0.18 * Math.max(Math.abs(v[0]), Math.abs(v[2])) ** 6;           // thinner towards the seams
      p.setXYZ(i, v[0] * sx, v[1] * sy * pinch, v[2] * sz);
    }
    geo.computeVertexNormals(); return new THREE.Mesh(geo, typeof m === 'function' ? m() : m);
  }
  // full bed dressing for a mattress footprint w × l (origin = floor under the mattress centre, head end = +z)
  function bedding({ w = 1.8, l = 2.0, top = 0.62, duvet = OLIVE, sheet = IVORY, accent = () => M('Approved B1 sage cotton', 0x8f9a7d), throwM = () => M('Terracotta handloom', 0xa4553a), upright = false } = {}) {
    const root = g();
    root.add(box(w, 0.2, l, IVORY, 0, top - 0.2, -l / 2, 0.045));                                        // mattress
    const cover = l - 0.5;                                                                               // duvet stops below the pillows
    const d = drape(w, cover, top + 0.035, duvet, { hang: 0.3, wrinkle: 0.004 }); d.position.z = -l / 2 + cover / 2; root.add(d);
    const fold = drape(w + 0.03, 0.26, top + 0.068, sheet, { hang: 0.315, foot: false, puff: 0.012, wrinkle: 0.002 }); fold.position.z = -l / 2 + cover - 0.12; root.add(fold);
    const thr = drape(w + 0.02, 0.48, top + 0.07, throwM, { hang: 0.32, puff: 0.01, wrinkle: 0.007 }); thr.position.z = -l / 2 + 0.2; root.add(thr);
    if (upright) {   // hotel-style: two big white pillows standing against the headboard, square accent cushions in front, small white lumbar
      for (const sx of [-1, 1]) {
        const pl = pillow(0.36, 0.25, 0.09, IVORY); pl.position.set(sx * w / 4.2, top + 0.24, l / 2 - 0.1); pl.rotation.x = 0.2; root.add(pl);
        const cu = pillow(0.22, 0.21, 0.08, accent); cu.position.set(sx * w / 4.6, top + 0.2, l / 2 - 0.25); cu.rotation.x = 0.3; root.add(cu);
      }
      const lum2 = pillow(0.2, 0.13, 0.07, IVORY); lum2.position.set(0, top + 0.13, l / 2 - 0.36); lum2.rotation.x = 0.35; root.add(lum2);
      return { obj: root };
    }
    for (const sx of [-1, 1]) {
      const pl = pillow(0.37, 0.085, 0.25, IVORY); pl.position.set(sx * w / 4, top + 0.085, l / 2 - 0.3); pl.rotation.x = -0.22; root.add(pl);
      const eu = pillow(0.3, 0.3, 0.08, accent); eu.position.set(sx * w / 4, top + 0.31, l / 2 - 0.1); eu.rotation.x = 0.28; root.add(eu);
    }
    const lum = pillow(0.27, 0.15, 0.07, throwM); lum.position.set(0, top + 0.2, l / 2 - 0.27); lum.rotation.x = 0.3; root.add(lum);
    return { obj: root };
  }
  // real product model (Amazon Berkeley Objects): re-origined to the builders' frame (floor, centre of the back face, front = +z)
  function model(key) {
    const src = getModel(key); if (!src) return null;
    const holder = g(), m = src.scene.clone(true);
    if (src.front === '+x') m.rotation.y = -Math.PI / 2; else if (src.front === '-x') m.rotation.y = Math.PI / 2; else if (src.front === '-z') m.rotation.y = Math.PI;
    // models exported lying down (e.g. Sketchfab STL reliefs): stand them up first (degrees about x)
    if (src.rotX) m.rotation.x = src.rotX * Math.PI / 180;
    holder.add(m); holder.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(m);
    m.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, -b.min.z);
    return { obj: holder, size: b.getSize(new THREE.Vector3()), name: src.name };
  }
  return { mat: M, bathVanityModels, dreamburstBed, mixerGrinder, fridgeSingleDoor, larderPullout, kitchenStyled, pujaPanelShrine, venkateswaraIdol, pujaStoneShrine, facetedDoors, keralaDoors, templeDoors, pujaDoors, pipeEnclosure, modularSofa, masterBath, walkinFronts, slidingWardrobe, studyWallDark, heritageEastWall, heritageWestWall, heritageBeams, dhurrieRug, brassLantern, model, entranceCorridor, foyerWall, carvedStoneWall, ledStrip, BED_WALL_STYLES, bedWallStyled, balconyWallFrame, archValance, splitAC, jaliWall, gamingWall, panelWall, softWall, headboardWallFS, ceilingCanopy, bedBench, waveWall, upholsteredBed, chevronRug, nightstand, pendant, wallSconce, vasePlant, fridgeSideBySide, tvWall, projectorScreen, projector, workWall, loungeChair, deskChair, sideTable, floorLamp, bedding, box, led };
}
