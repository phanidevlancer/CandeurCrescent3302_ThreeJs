// Master balcony · east wall 'cosy-teal' (owner reference 2026-11-11:
// references/master-balcony/2026-11-11_east-wall-cosy-teal.png — "design the east balcony wall this way").
// The WHOLE look of the reference on our balcony, keeping the owners' L-seat footprint exactly as built:
//   L-seat → light-oak plank storage base (3 boards, flap joints, finger-pull groove under the top board, recessed dark plinth)
//            + cream boucle box cushions (top 0.45 m) — same three pieces / footprints as option1's model modules
//   back cushions: teal velvet + cream block-print on the east wall, one of each against the pipe enclosure
//   east wall: black wire grid with a hanging pothos, oak-framed botanical leaf print (white mat), floating oak shelf with a
//              potted plant and a black candle lantern
//   festoon string lights: one swag across the east wall + one run along the railing side to the west wall (hooks 2.86 m)
//   jute rug 1.30 × 0.80 in front of the L-seat corner. The reference's black folding bistro table + chair were built and then
//              REMOVED at the owner's request (2026-11-11: "remove the folded chair and folded table").
//   black railing planter hung on the handrail (the two black floor candle lanterns were removed by the owner 2026-11-11) (the reference's floor plants — teal pot + tall
//   grass — were removed at the owner's request 2026-11-11: no plants on the balcony floor, keep the railing planter)
// Measured 2026-11-11 (viewer ray-casts): floor 0.056; timber ceiling underside 3.008; east wall face x 6.825; bathroom wall
// z 5.267; base rail (kerb) face z 7.167, top 0.32; glass z 7.238; handrail top 1.145 at z ≈ 7.232.
export const COSY_REF = 'references/master-balcony/2026-11-11_east-wall-cosy-teal.png';

export function buildCosy(ctx, P) {
  const T = ctx.THREE, L = ctx.lib, FL = P.FLOOR;
  const G = () => new T.Group();
  const mat = (o) => new T.MeshStandardMaterial(o);
  const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t; };

  // ---------- materials (one instance each → one merged mesh per material) ----------
  const OAK = L.mat('Approved H1 pale oak veneer', 0xc9a77c);
  const CREAM = L.mat('Approved dining cream boucle', 0xe9e0cf);
  const JUTE = L.mat('Handwoven jute', 0xb89a6a);
  const PLINTH = mat({ color: 0x2a2420, roughness: 0.8, name: '__bench_plinth_shadow' });
  const GROOVE = mat({ color: 0x5a4632, roughness: 0.9, name: '__oak_groove' });
  const BLACK = mat({ color: 0x1c1c1c, roughness: 0.45, metalness: 0.55, name: '__powder_black_metal' });
  const TEALV = new T.MeshPhysicalMaterial({ color: 0x0b4a4c, roughness: 0.82, sheen: 1, sheenColor: new T.Color(0x3a9a98), sheenRoughness: 0.35, name: '__teal_velvet' });
  const PRINT = mat({ roughness: 0.92, name: '__blockprint_cushion', map: canvasTex(256, 192, (x, w, h) => {
    x.fillStyle = '#e6dcc8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a7559'; x.lineWidth = 5; x.lineJoin = 'round';
    // block-print: rows of nested zigzags (like the reference's beige/cream geometric cushion)
    for (let r = 0; r < 7; r++) { const y = 18 + r * 26; x.beginPath(); for (let k = 0; k <= 16; k++) x.lineTo(k * 16, y + (k % 2 ? 9 : -9)); x.stroke(); }
    x.fillStyle = '#8a7559'; for (let r = 0; r < 6; r++) for (let k = 0; k < 16; k++) { x.beginPath(); x.arc(k * 16 + 8, 31 + r * 26, 2.4, 0, 7); x.fill(); }
  }) });
  const CONC = mat({ roughness: 0.95, name: '__light_concrete', map: canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#cdc9c1'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { const v = 170 + Math.floor(Math.random() * 60); x.fillStyle = `rgba(${v},${v - 3},${v - 8},0.5)`; x.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
  }) });
  const WHITEPOT = mat({ color: 0xebe7df, roughness: 0.6, name: '__white_ceramic' });
  const SOIL = mat({ color: 0x3a2c22, roughness: 1, name: '__potting_soil' });
  const LEAF = mat({ color: 0x3f6d2e, roughness: 0.55, side: T.DoubleSide, name: '__leaf_deep' });
  const LEAF2 = mat({ color: 0x6f9a3e, roughness: 0.55, side: T.DoubleSide, name: '__leaf_pothos' });
  const FLOWER = mat({ color: 0xf4f2ea, roughness: 0.7, side: T.DoubleSide, name: '__white_flower' });
  const WAX = mat({ color: 0xf1e7d4, roughness: 0.7, name: '__candle_wax' });
  const GLASS = new T.MeshPhysicalMaterial({ color: 0xf2f4f2, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, name: '__lantern_glass' });
  const ART = mat({ roughness: 0.9, name: '__leaf_print_art', map: canvasTex(256, 330, (x, w, h) => {
    x.fillStyle = '#f6f3ec'; x.fillRect(0, 0, w, h);                                  // white mat
    x.fillStyle = '#efe8d8'; x.fillRect(48, 52, w - 96, h - 104);                     // print paper
    x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 2; x.strokeRect(48, 52, w - 96, h - 104);
    const cx = w / 2, by = h - 80; x.strokeStyle = '#5f7a4a'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, by); x.quadraticCurveTo(cx + 6, by - 90, cx - 4, by - 170); x.stroke();
    const leaf = (px, py, ang, s) => { x.save(); x.translate(px, py); x.rotate(ang); x.fillStyle = '#7f9a62'; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(s * 0.45, -s * 0.5, 0, -s); x.quadraticCurveTo(-s * 0.45, -s * 0.5, 0, 0); x.fill();
      x.strokeStyle = '#5e7848'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -s * 0.92); x.stroke(); x.restore(); };
    for (let k = 0; k < 4; k++) { const t = 0.2 + k * 0.2, py = by - 170 * t; leaf(cx + 2, py, -0.9 - k * 0.05, 38 - k * 4); leaf(cx + 2, py - 14, 0.9 + k * 0.05, 36 - k * 4); }
    leaf(cx - 4, by - 168, 0.05, 34);
  }) });
  const bulbMat = L.led(0xffc890, 2.4), flameMat = L.led(0xffb060, 2.2);
  const glowMat = new T.MeshBasicMaterial({ color: 0xffc890, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, side: T.DoubleSide, name: '__string_glow',
    map: canvasTex(64, 64, (x, w, h) => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }) });
  const moods = { strips: [bulbMat, flameMat], halos: [glowMat] };

  // ---------- geometry helpers ----------
  const box = (w, h, d, m, x = 0, y = 0, z = 0, r = 0) => L.box(w, h, d, m, x, y, z, r);          // x centre, y bottom, z back
  const cyl = (rt, rb, h, m, x = 0, y = 0, z = 0, seg = 24) => { const c = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y + h / 2, z); return c; };
  const bar = (a, b, w, d, m) => { const A = new T.Vector3(...a), B = new T.Vector3(...b), len = A.distanceTo(B), mesh = new T.Mesh(new T.BoxGeometry(w, len, d), m);
    mesh.position.copy(A).add(B).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return mesh; };
  const rod = (a, b, r, m, seg = 8) => { const A = new T.Vector3(...a), B = new T.Vector3(...b), mesh = new T.Mesh(new T.CylinderGeometry(r, r, A.distanceTo(B), seg), m);
    mesh.position.copy(A).add(B).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return mesh; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const lathe = (pts, m, seg = 40) => new T.Mesh(new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg), m);
  const loose = o => { o.traverse(c => { if (c.isMesh) c.userData.loose = true; }); return o; };
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  // pillow: subdivided box whose thickness falls off towards the seams (puffy centre, pinched edges)
  function pillow(w, h, t, m) {
    const geo = new T.BoxGeometry(w, h, t, 14, 14, 2), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const nx = p.getX(i) / (w / 2), ny = p.getY(i) / (h / 2), f = Math.sqrt(Math.max(0, (1 - nx ** 4) * (1 - ny ** 4)));
      p.setZ(i, p.getZ(i) * (0.12 + 0.88 * f)); p.setX(i, p.getX(i) * (1 - 0.035 * (1 - ny * ny))); p.setY(i, p.getY(i) * (1 - 0.035 * (1 - nx * nx))); }
    geo.computeVertexNormals(); return new T.Mesh(geo, m);
  }
  // pillow leaning back against a vertical surface at local z 0 (front +z), sitting on y0
  function leanPillow(root, w, h, t, m, x, y0, lean = 0.24, dz = 0) {
    const pw = pillow(w, h, t, m); pw.rotation.x = -lean;
    pw.position.set(x, y0 + (h / 2) * Math.cos(lean) - 0.01, (h / 2) * Math.sin(lean) + t * 0.42 + 0.012 + dz); root.add(pw); return pw;
  }
  const heart = (() => { const s = new T.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.55, 0.25, 0.6, 0.85, 0.08, 1.0); s.quadraticCurveTo(0, 0.95, -0.08, 1.0); s.bezierCurveTo(-0.6, 0.85, -0.55, 0.25, 0, 0); return new T.ShapeGeometry(s, 6); })();
  const oval = (() => { const s = new T.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.42, 0.45, 0, 1); s.quadraticCurveTo(-0.42, 0.45, 0, 0); return new T.ShapeGeometry(s, 8); })();
  const leafMesh = (geo, size, m, x, y, z, rx, ry, rz) => { const l = new T.Mesh(geo, m); l.scale.setScalar(size); l.position.set(x, y, z); l.rotation.set(rx, ry, rz, 'YXZ'); return l; };
  // leafy bunch (pothos / herb / shelf plant) centred at (x, y, z)
  function bunch(root, x, y, z, r, n, size, geo = heart) {
    for (let k = 0; k < n; k++) { const a = rnd() * Math.PI * 2, rr = r * Math.sqrt(rnd());
      root.add(leafMesh(geo, size * (0.75 + 0.5 * rnd()), k % 3 ? LEAF2 : LEAF, x + Math.cos(a) * rr, y + rnd() * r * 0.8, z + Math.sin(a) * rr, -0.6 - rnd() * 0.8, -a - Math.PI / 2, (rnd() - 0.5) * 0.6)); }
  }
  function lantern(s = 1) {
    const l = G(), w = 0.11 * s, h = 0.20 * s, f = 0.008 * s;
    l.add(box(w + 0.01 * s, 0.012 * s, w + 0.01 * s, BLACK, 0, 0, -(w + 0.01 * s) / 2));
    for (const [px, pz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) l.add(box(f, h, f, BLACK, px * (w / 2 - f / 2), 0.012 * s, pz * (w / 2 - f / 2) - f / 2));
    l.add(box(w + 0.006 * s, 0.012 * s, w + 0.006 * s, BLACK, 0, h, -(w + 0.006 * s) / 2));
    const roof = new T.Mesh(new T.ConeGeometry(w * 0.78, 0.05 * s, 4), BLACK); roof.rotation.y = Math.PI / 4; roof.position.y = h + 0.012 * s + 0.025 * s; l.add(roof);
    const ring = new T.Mesh(new T.TorusGeometry(0.018 * s, 0.003 * s, 6, 16), BLACK); ring.position.y = h + 0.075 * s; l.add(ring);
    for (const [ry, dx, dz] of [[0, 0, 1], [0, 0, -1], [Math.PI / 2, 1, 0], [Math.PI / 2, -1, 0]]) { const p = new T.Mesh(new T.PlaneGeometry(w - f, h - 0.004), GLASS); p.rotation.y = ry; p.position.set(dx * (w / 2 - f / 2), 0.012 * s + h / 2, dz * (w / 2 - f / 2)); l.add(p); }
    l.add(cyl(0.022 * s, 0.022 * s, 0.07 * s, WAX, 0, 0.012 * s, 0, 16));
    const fl = new T.Mesh(new T.SphereGeometry(0.008 * s, 10, 8), flameMat); fl.scale.y = 2; fl.position.y = 0.012 * s + 0.07 * s + 0.016 * s; l.add(fl);
    return l;
  }

  // ---------- L-seat run: oak plank storage base + cream box cushion (local x along the run, back z 0, front +z, floor y 0) ----------
  function benchRun(len, D, { front = true } = {}) {
    const r = G(), PL = 0.07, CAR = 0.30, TOP = 0.02, CU = 0.06;         // plinth, carcass, top board, cushion → 0.45
    r.add(box(len - 0.004, PL, D - 0.05, PLINTH, 0, 0, 0));
    r.add(box(len, CAR, D, OAK, 0, PL, 0));
    r.add(box(len, TOP, D, OAK, 0, PL + CAR, 0));
    if (front) {
      for (const y of [PL + 0.10, PL + 0.20]) r.add(box(len - 0.004, 0.005, 0.004, GROOVE, 0, y, D - 0.0035));          // three boards
      r.add(box(len - 0.004, 0.012, 0.004, PLINTH, 0, PL + CAR - 0.014, D - 0.0035));                                  // finger-pull groove of the lift-up flaps
      const n = Math.max(1, Math.round(len / 0.64));
      for (let k = 1; k < n; k++) r.add(box(0.004, CAR - 0.004, 0.004, GROOVE, -len / 2 + k * len / n, PL + 0.002, D - 0.0035));
    }
    r.add(box(len - 0.012, CU, D - 0.03, CREAM, 0, PL + CAR + TOP, 0.012, 0.022));
    return r;
  }
  const SEAT_TOP = 0.45;

  const out = {};
  // L-seat pieces — exactly the footprints of the model modules in option1 (north / east / deep corner)
  { const o = benchRun(P.WALL_E - P.D - P.ENC_X0, P.D); o.position.y = FL; out.north = { obj: o }; }
  { const o = benchRun(P.RAIL - P.WALL_N, P.D); o.position.y = FL; out.east = { obj: o }; }
  { const o = benchRun(P.WALL_E - P.D - P.ENC_X1, P.ENC_FRONT - P.WALL_N, { front: false }); o.position.y = FL; out.deep = { obj: o }; }

  // back cushions: east run frame (origin = east wall face at the run centre, ry −π/2 → local +x = south, +z = west)
  { const o = G(), y0 = FL + SEAT_TOP;
    leanPillow(o, 0.50, 0.50, 0.17, TEALV, -0.52, y0);
    leanPillow(o, 0.56, 0.38, 0.15, PRINT, 0.02, y0, 0.2, 0.06);
    leanPillow(o, 0.50, 0.50, 0.17, TEALV, 0.56, y0);
    out.eastCushions = { obj: loose(o) }; }
  // two on the north run against the enclosure louvres (north run frame, back = enclosure front)
  { const o = G(), y0 = FL + SEAT_TOP;
    leanPillow(o, 0.50, 0.50, 0.17, TEALV, -0.55, y0);
    leanPillow(o, 0.56, 0.38, 0.15, PRINT, 0.05, y0, 0.2, 0.04);
    out.northCushions = { obj: loose(o) }; }

  // ---------- east wall decor (east wall frame, local x = z − 6.217, local z = distance from the wall, y world) ----------
  { const o = G();
    // black wire grid 0.46 × 0.56 (5 mm wire, 20 mm stand-offs), world z 5.63–6.09, y 1.52–2.08
    const gx = -0.357, gw = 0.46, gh = 0.56, gy0 = 1.52, gz = 0.022;
    const bw = 0.007; o.add(box(gw, bw, bw, BLACK, gx, gy0, gz)); o.add(box(gw, bw, bw, BLACK, gx, gy0 + gh - bw, gz));
    o.add(box(bw, gh, bw, BLACK, gx - gw / 2 + bw / 2, gy0, gz)); o.add(box(bw, gh, bw, BLACK, gx + gw / 2 - bw / 2, gy0, gz));
    for (let k = 1; k < 8; k++) o.add(box(0.004, gh - 0.01, 0.004, BLACK, gx - gw / 2 + k * gw / 8, gy0 + 0.005, gz + 0.0015));
    for (let k = 1; k < 9; k++) o.add(box(gw - 0.01, 0.004, 0.004, BLACK, gx, gy0 + k * gh / 9, gz - 0.002));
    for (const sx of [-1, 1]) for (const sy of [0.08, gh - 0.08]) { const c = cyl(0.005, 0.005, 0.02, BLACK, 0, 0, 0, 8); c.rotation.x = Math.PI / 2; o.add(at(c, gx + sx * 0.18, gy0 + sy, 0.011)); }
    // hanging pothos in a black pot on two S-hooks
    const py = 1.64, pz = 0.15;
    o.add(at(lathe([[0, 0], [0.055, 0], [0.068, 0.10], [0.072, 0.11], [0.066, 0.11], [0, 0.105]], BLACK, 28), gx, py, pz));
    o.add(cyl(0.064, 0.064, 0.004, SOIL, gx, py + 0.098, pz, 20));
    for (const sx of [-1, 1]) o.add(rod([gx + sx * 0.05, py + 0.11, pz - 0.05], [gx + sx * 0.05, py + 0.2, gz + 0.004], 0.0025, BLACK));
    bunch(o, gx, py + 0.11, pz, 0.075, 34, 0.06);
    for (let v = 0; v < 6; v++) {                                                    // trailing vines
      const a = (v / 6) * Math.PI * 2 + 0.3, sx = gx + Math.cos(a) * 0.08, sz = pz + Math.abs(Math.sin(a)) * 0.06, len = 0.28 + rnd() * 0.32;
      const n = Math.round(len / 0.045), pts = [];
      for (let k = 0; k <= n; k++) pts.push(new T.Vector3(sx + Math.sin(k * 0.7 + v) * 0.02 + (sx - gx) * k * 0.08, py + 0.1 - k * 0.045, sz + Math.cos(k * 0.5 + v) * 0.015));
      o.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), n * 3, 0.0018, 4), LEAF));
      pts.forEach((p, k) => { if (k) o.add(leafMesh(heart, 0.045 + rnd() * 0.02, k % 2 ? LEAF2 : LEAF, p.x + (k % 2 ? 0.012 : -0.012), p.y - 0.02, p.z + 0.01, -1.2 - rnd() * 0.4, (k % 2 ? 1 : -1) * 0.9, 0)); });
    }
    // oak-framed botanical leaf print 0.42 × 0.54, white mat; world z 6.43–6.85, y 1.56–2.10
    const fx = 0.423, fw = 0.42, fh = 0.54, fy0 = 1.56, ft = 0.028;
    o.add(box(fw, ft, 0.03, OAK, fx, fy0, 0)); o.add(box(fw, ft, 0.03, OAK, fx, fy0 + fh - ft, 0));
    o.add(box(ft, fh - 2 * ft, 0.03, OAK, fx - fw / 2 + ft / 2, fy0 + ft, 0)); o.add(box(ft, fh - 2 * ft, 0.03, OAK, fx + fw / 2 - ft / 2, fy0 + ft, 0));
    const art = new T.Mesh(new T.PlaneGeometry(fw - 2 * ft, fh - 2 * ft), ART); art.position.set(fx, fy0 + fh / 2, 0.022); o.add(art);
    // floating oak shelf 0.55 × 0.16 (top 1.44, hidden bracket) with a potted plant + black candle lantern
    const sx0 = 0.42, sy = 1.41;
    o.add(box(0.55, 0.03, 0.16, OAK, sx0, sy, 0, 0.003));
    o.add(at(lathe([[0, 0], [0.045, 0], [0.06, 0.1], [0.055, 0.1], [0, 0.095]], CONC, 24), sx0 - 0.15, sy + 0.03, 0.08));
    bunch(o, sx0 - 0.15, sy + 0.13, 0.085, 0.04, 22, 0.042, oval);
    const ln = lantern(1); ln.position.set(sx0 + 0.15, sy + 0.03, 0.08); o.add(ln);
    out.wallDecor = { obj: loose(o) };
  }

  // ---------- festoon string lights (world coordinates) ----------
  { const o = G(), Y = 2.86;
    const span = (a, b, sag, bulbs) => {
      const pts = []; for (let k = 0; k <= 24; k++) { const t = k / 24; pts.push(new T.Vector3(a[0] + (b[0] - a[0]) * t, Y - sag * 4 * t * (1 - t), a[1] + (b[1] - a[1]) * t)); }
      o.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 48, 0.0028, 5), BLACK));
      for (let i = 0; i < bulbs; i++) { const t = (i + 0.5) / bulbs, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, y = Y - sag * 4 * t * (1 - t);
        o.add(cyl(0.0105, 0.0105, 0.03, BLACK, x, y - 0.034, z, 10));
        const bl = new T.Mesh(new T.SphereGeometry(0.021, 14, 10), bulbMat); bl.scale.y = 1.3; bl.position.set(x, y - 0.058, z); o.add(bl);
        for (const r of [0, Math.PI / 2]) { const h = new T.Mesh(new T.PlaneGeometry(0.22, 0.22), glowMat); h.position.set(x, y - 0.058, z); h.rotation.y = r; o.add(h); } }
    };
    const hook = (x, z) => o.add(cyl(0.006, 0.006, 3.006 - Y, BLACK, x, Y, z, 8));            // cup hook from the timber ceiling (3.008)
    const E = [[6.70, 5.42], [6.70, 6.20], [6.70, 6.98]];
    span(E[0], E[1], 0.15, 3); span(E[1], E[2], 0.15, 3);
    const R = [6.70, 5.10, 3.40, 1.70, 0.04].map(x => [x, 6.98]);
    for (let i = 0; i < R.length - 1; i++) span(R[i], R[i + 1], 0.2, 5);
    [...E, ...R.slice(1)].forEach(p => hook(p[0], p[1]));
    out.lights = { obj: o };
  }

  // ---------- jute rug 1.30 × 0.80 with a braided darker border ----------
  { const o = G(), w = 1.30, d = 0.80, BRD = mat({ color: 0x9a7d55, roughness: 1, name: '__jute_border' });
    o.add(box(w, 0.01, d, JUTE, 0, 0, -d / 2));
    o.add(box(w, 0.011, 0.035, BRD, 0, 0, -d / 2)); o.add(box(w, 0.011, 0.035, BRD, 0, 0, d / 2 - 0.035));
    o.add(box(0.035, 0.011, d - 0.07, BRD, -w / 2 + 0.0175, 0, -d / 2 + 0.035)); o.add(box(0.035, 0.011, d - 0.07, BRD, w / 2 - 0.0175, 0, -d / 2 + 0.035));
    o.position.y = FL;
    out.rug = { obj: o };
  }

  // (owner 2026-11-11: "remove the plants placed on the master bed room balcony floor, leave the plant on the railing" →
  //  the deep-teal pot plant on its oak stand and the tall grass in the concrete pot were deleted here)

  // (owner 2026-11-11: "remove the candels from the floor on the master bed room balcony" → the two black floor lanterns were
  //  deleted here; the candle lantern on the east-wall shelf stays)

  // ---------- black railing planter (0.62 × 0.17 × 0.16) hung on the handrail's inner face; local x along the railing ----------
  { const o = G(), w = 0.62, d = 0.17, h = 0.16, top = 1.10, zb = 7.222;
    o.add(box(w, h, d, BLACK, 0, top - h, zb - d));
    o.add(box(w - 0.02, 0.005, d - 0.02, SOIL, 0, top - 0.012, zb - d + 0.01));
    for (const sx of [-0.2, 0.2]) { o.add(box(0.025, 0.07, 0.006, BLACK, sx, top - 0.01, zb - 0.006)); o.add(box(0.025, 0.006, 0.05, BLACK, sx, top + 0.054, zb - 0.006)); o.add(box(0.025, 0.04, 0.006, BLACK, sx, top + 0.02, zb + 0.038)); }
    for (let k = 0; k < 5; k++) bunch(o, -0.24 + k * 0.12, top + 0.01, zb - d / 2, 0.08, 16, 0.06, oval);
    for (let k = 0; k < 9; k++) { const f = leafMesh(oval, 0.03, FLOWER, -0.26 + rnd() * 0.52, top + 0.08 + rnd() * 0.08, zb - d / 2 + (rnd() - 0.5) * 0.1, -1.2, rnd() * 6, 0); o.add(f); }
    for (let v = 0; v < 4; v++) { const x0 = -0.25 + v * 0.17; for (let k = 0; k < 6; k++) o.add(leafMesh(oval, 0.05, LEAF2, x0 + Math.sin(k + v) * 0.02, top - 0.02 - k * 0.04, zb - d - 0.01, 0.2, 0, (k % 2 ? 0.5 : -0.5))); }
    out.railPlanter = { obj: loose(o) };
  }
  out.moods = moods;
  return out;
}
