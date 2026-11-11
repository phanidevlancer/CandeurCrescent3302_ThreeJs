// Master balcony · west wall 'arch-niche' (owner reference 2026-11-11:
// references/master-balcony/2026-11-11_west-wall-arch-niche.png — "design this on the west wall of the master bed room balcony").
// The WHOLE look of the reference, built in WORLD coordinates (every piece is added at (0, 0) with ry 0):
//   - full-height vertical walnut slats (40 mm, 14 mm dark gaps, 24 mm proud of a 10 mm dark backing) from the bedroom wall's
//     fluted panel (z 5.315) to the railing kerb face (z 7.165), floor (0.056) → slab underside (3.108)
//   - centred tall round-top arch niche (0.80 wide, 0.40 → 2.60 m) in rough trowelled cream/sand plaster: a 1 cm-grid plane
//     displaced from a canvas heightmap (≈ 7 mm relief) + colour + bump map; warm LED line in the reveal along the whole arch
//     edge with an additive wash lying ON the plaster (and a faint spill onto the slats)
//   - three floating walnut shelves inside the arch, LED strip under each washing the plaster below; decor: white vases
//     (bottle + two donut vases), pothos in white pots (one trailing down the niche), small ferns, a dark pot with a trailing
//     plant, framed fern prints, reed diffusers, stacked books
//   - floating walnut 3-drawer console (1.10 m, white marble top 0.80 m) across the arch's foot, LED under it
//   - low long cream curved-corner planter box (1.66 m, wider than the console as in the reference) with ferns + white pebbles on a recessed dark plinth, LED floor cove
//   - two recessed downlights in the timber ceiling over the wall with light pools on the slats
// NOT built: the reference's tall bird-of-paradise floor plant (owner 2026-11-11: no plants on the balcony floor; the planter is
// part of the wall unit — to be confirmed by the owner).
// Measured 2026-11-11 (viewer ray-casts): west wall face x 0 (y 0 → 3.2, z 5.267 → 7.25); floor 0.056; covered-ceiling slab
// underside 3.110 for x < 0.075, timber ceiling 3.008 beyond; bedroom wall fluted timber panel front z 5.31; railing kerb face
// z 7.167 (top 0.32), glass z 7.238. Both wicker armchairs were removed (owner 2026-11-11), so the whole west end is free.
export const WEST_REF = 'references/master-balcony/2026-11-11_west-wall-arch-niche.png';

export const WW = { ZA: 5.315, ZB: 7.165, FL: 0.056, TOP: 3.108, ZC: 6.24, R: 0.40, AB: 0.40, SPRING: 2.20 };

export function buildWestWall(ctx) {
  const T = ctx.THREE, L = ctx.lib, { ZA, ZB, FL, TOP, ZC, R, AB, SPRING } = WW;
  const G = () => new T.Group();
  const mat = (o) => new T.MeshStandardMaterial(o);
  const canvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  const texOf = (cv) => { const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t; };
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const loose = o => { o.traverse(c => { if (c.isMesh) c.userData.loose = true; }); return o; };

  // ---------- materials ----------
  const WALNUT = L.mat('Approved mid walnut veneer', 0x6b4a32);
  const GAP = mat({ color: 0x1d140e, roughness: 0.9, name: '__slat_gap_dark' });
  const CREAM = mat({ color: 0xeee4d0, roughness: 0.85, name: '__cream_planter' });
  const PLINTH = mat({ color: 0x2a2420, roughness: 0.85, name: '__planter_plinth' });
  const CERAMIC = new T.MeshPhysicalMaterial({ color: 0xf3f0e9, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.3, name: '__white_ceramic_gloss' });
  const MATTE = mat({ color: 0xece7dd, roughness: 0.75, name: '__white_matte_pot' });
  const DARKPOT = mat({ color: 0x2c2b29, roughness: 0.5, name: '__charcoal_pot' });
  const AMBER = new T.MeshPhysicalMaterial({ color: 0x5a2a0c, roughness: 0.08, clearcoat: 1, name: '__amber_glass' });
  const REED = mat({ color: 0x3a2a1c, roughness: 0.9, name: '__rattan_reed' });
  const SOIL = mat({ color: 0x3a2c22, roughness: 1, name: '__potting_soil' });
  const PEBBLE = mat({ color: 0xf4f1ea, roughness: 0.55, name: '__white_pebble' });
  const LEAF = mat({ color: 0x3f6d2e, roughness: 0.55, side: T.DoubleSide, name: '__leaf_deep' });
  const LEAF2 = mat({ color: 0x6f9a3e, roughness: 0.55, side: T.DoubleSide, name: '__leaf_pothos' });
  const FERN = mat({ color: 0x4f8a2c, roughness: 0.6, side: T.DoubleSide, name: '__fern_frond' });
  const BOOK1 = mat({ color: 0xf1ede4, roughness: 0.8, name: '__book_white' }), BOOK2 = mat({ color: 0xd9cdb8, roughness: 0.8, name: '__book_sand' });
  const MARBLE = mat({ roughness: 0.22, name: '__white_marble_top', map: (() => {
    const cv = canvas(512, 128), x = cv.getContext('2d'); x.fillStyle = '#f2efea'; x.fillRect(0, 0, 512, 128);
    for (let k = 0; k < 9; k++) { x.strokeStyle = `rgba(150,145,140,${0.15 + rnd() * 0.25})`; x.lineWidth = 0.6 + rnd() * 1.6; x.beginPath(); let px = rnd() * 512, py = 0; x.moveTo(px, py);
      while (py < 128) { px += (rnd() - 0.4) * 40; py += 8 + rnd() * 14; x.lineTo(px, py); } x.stroke(); }
    return texOf(cv); })() });
  const PRINT = mat({ roughness: 0.9, name: '__fern_print_art', map: (() => {
    const cv = canvas(200, 260), x = cv.getContext('2d'); x.fillStyle = '#f7f4ee'; x.fillRect(0, 0, 200, 260);
    x.fillStyle = '#efe9dc'; x.fillRect(34, 40, 132, 180); x.strokeStyle = '#4f7a3a'; x.lineWidth = 2.2;
    const cx = 100; x.beginPath(); x.moveTo(cx, 205); x.quadraticCurveTo(cx + 8, 130, cx - 4, 60); x.stroke();
    for (let k = 0; k < 13; k++) { const t = k / 13, py = 195 - t * 132, l = 34 * Math.sin(Math.PI * (0.2 + 0.8 * t)) * (1 - 0.35 * t); x.fillStyle = '#5d8a44';
      for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + 3 * (1 - t), py); x.quadraticCurveTo(cx + s * l * 0.6, py - 10, cx + s * l, py - 6); x.quadraticCurveTo(cx + s * l * 0.5, py - 1, cx + 3 * (1 - t), py); x.fill(); } }
    return texOf(cv); })() });
  const ledA = L.led(0xffbe78, 2.4);
  const moods = { strips: [ledA], halos: [], glow: [] };
  // real warm light under each shelf / the console (intensity follows the mood: normal 4, off 0)
  const areaDown = (root, w, x, y, zc) => { const l = new T.RectAreaLight(0xffc078, 4, 0.12, w); l.position.set(x, y, zc); l.lookAt(x, 0, zc); root.add(l); moods.glow.push(l); };
  const glowMat = (name, colour = 0xffc078) => { const m = new T.MeshBasicMaterial({ color: colour, vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false, name }); moods.halos.push(m); return m; };
  // ledStrip along the wall (z) at world (x, y, zc); its wash plane stays parallel to the wall, ≈ 1 cm in front of it
  const strip = (root, w, x, y, zc, wash, dir = 'down', alpha = 0.5) => { const s = L.ledStrip({ w, wash, dir, alpha }); s.obj.rotation.y = Math.PI / 2; s.obj.position.set(x, y, zc); root.add(s.obj); moods.strips.push(...s.moods.strips); moods.halos.push(...s.moods.halos); return s; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const cyl = (rt, rb, h, m, x, y, z, seg = 24) => at(new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), m), x, y + h / 2, z);
  const lathe = (pts, m, seg = 36) => new T.Mesh(new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg), m);
  // world box from extents
  const wbox = (x0, x1, y0, y1, z0, z1, m, r = 0) => L.box(x1 - x0, y1 - y0, z1 - z0, m, (x0 + x1) / 2, y0, z0, r);
  const archY = (z, r) => { const d = Math.abs(z - ZC); return d >= r ? -Infinity : SPRING + Math.sqrt(r * r - d * d); };

  const out = {};

  // =============== 1. slat cladding + plaster arch + arch LED + downlights ===============
  { const o = G(), BK = 0.010, SL = 0.034, SW = 0.040, GW = 0.014, P = SW + GW, RO = R + 0.012;   // opening incl. LED reveal
    o.add(wbox(0, BK, FL, TOP, ZA, ZB, GAP));
    const n = Math.floor((ZB - ZA + GW) / P), off = (ZB - ZA - (n * P - GW)) / 2;
    const slat = (z0, z1, curved) => {
      if (z1 - z0 < 0.004) return;
      if (!curved) { o.add(wbox(BK, SL, FL, TOP, z0, z1, WALNUT)); return; }
      const geo = new T.BoxGeometry(SL - BK, 1, z1 - z0, 1, 1, 6), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const zw = (z0 + z1) / 2 + p.getZ(i); p.setY(i, p.getY(i) > 0 ? TOP : Math.max(AB, archY(zw, RO))); p.setX(i, p.getX(i) + (BK + SL) / 2); p.setZ(i, zw); }
      geo.computeVertexNormals(); o.add(new T.Mesh(geo, WALNUT));
    };
    const o0 = ZC - RO, o1 = ZC + RO;
    for (let k = 0; k < n; k++) {
      const z0 = ZA + off + k * P, z1 = z0 + SW;
      if (z1 <= o0 || z0 >= o1) slat(z0, z1, false);
      else { slat(z0, Math.min(z1, o0), false); slat(Math.max(z0, o1), z1, false); slat(Math.max(z0, o0), Math.min(z1, o1), true); }
    }
    // slats below the arch opening (the niche starts at AB): plain slats from the floor to AB
    for (let k = 0; k < n; k++) { const z0 = ZA + off + k * P, z1 = z0 + SW, a = Math.max(z0, o0), b = Math.min(z1, o1); if (b > a + 0.004) o.add(wbox(BK, SL, FL, AB, a, b, WALNUT)); }

    // plaster: subdivided plane in the z–y plane, vertices above the arch curve pulled down onto it, displaced along +x
    const PX = 220, W = 2 * R, H = SPRING + R - AB, cw = Math.round(W * PX), ch = Math.round(H * PX);
    const hcv = canvas(cw, ch), hx = hcv.getContext('2d'); hx.fillStyle = '#808080'; hx.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 1400; i++) { const px = rnd() * cw, py = rnd() * ch, rw = 6 + rnd() * 26, rh = 4 + rnd() * 14, v = 70 + Math.floor(rnd() * 120);
      const gr = hx.createRadialGradient(px, py, 0, px, py, rw); gr.addColorStop(0, `rgba(${v},${v},${v},0.55)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
      hx.save(); hx.translate(px, py); hx.rotate(rnd() * Math.PI); hx.scale(1, rh / rw); hx.translate(-px, -py); hx.fillStyle = gr; hx.beginPath(); hx.arc(px, py, rw, 0, 7); hx.fill(); hx.restore(); }
    for (let i = 0; i < 260; i++) { const px = rnd() * cw, py = rnd() * ch, l = 10 + rnd() * 40, a = rnd() * Math.PI; hx.strokeStyle = `rgba(${rnd() < 0.5 ? 40 : 210},${rnd() < 0.5 ? 40 : 210},${rnd() < 0.5 ? 40 : 210},0.35)`; hx.lineWidth = 1 + rnd() * 2.5;
      hx.beginPath(); hx.moveTo(px, py); hx.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + 6, py + Math.sin(a) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); hx.stroke(); }
    const bcv = canvas(cw, ch), bx = bcv.getContext('2d'); bx.filter = 'blur(1.5px)'; bx.drawImage(hcv, 0, 0);
    const hd = bx.getImageData(0, 0, cw, ch).data, hAt = (u, v) => { const ix = Math.min(cw - 1, Math.max(0, Math.round(u * (cw - 1)))), iy = Math.min(ch - 1, Math.max(0, Math.round((1 - v) * (ch - 1)))); return hd[(iy * cw + ix) * 4] / 255; };
    const ccv = canvas(cw, ch), cx2 = ccv.getContext('2d'), cd = cx2.createImageData(cw, ch);
    for (let i = 0; i < cw * ch; i++) { const h = hd[i * 4] / 255, n2 = (rnd() - 0.5) * 10; const hc = Math.min(1, Math.max(0, (h - 0.5) * 2.2 + 0.5)); cd.data[i * 4] = 170 + hc * 70 + n2; cd.data[i * 4 + 1] = 140 + hc * 66 + n2; cd.data[i * 4 + 2] = 98 + hc * 58 + n2; cd.data[i * 4 + 3] = 255; }
    cx2.putImageData(cd, 0, 0);
    const bump = new T.CanvasTexture(bcv);
    const PLASTER = mat({ map: texOf(ccv), bumpMap: bump, bumpScale: 16, roughness: 0.96, name: '__sand_trowel_plaster' });
    const sx = Math.round(W / 0.01), sy = Math.round(H / 0.01), pg = new T.PlaneGeometry(W, H, sx, sy), pp = pg.attributes.position, uv = pg.attributes.uv;
    for (let i = 0; i < pp.count; i++) {
      const lz = pp.getX(i), ly = pp.getY(i) + H / 2 + AB, zw = ZC - lz;          // plane x → world −z (normal +x)
      let y = ly; const top = archY(zw, R); if (y > SPRING && y > top) y = Math.max(SPRING, top === -Infinity ? SPRING : top);
      const u = (lz + W / 2) / W, v = (y - AB) / H; uv.setXY(i, u, v);
      pp.setXYZ(i, lz, y, 0.010 + 0.011 * hAt(u, v));
    }
    pg.computeVertexNormals();
    const pl = new T.Mesh(pg, PLASTER); pl.rotation.y = Math.PI / 2; pl.position.set(0, 0, ZC); o.add(pl);   // local z → world +x
    // plaster sides of the reveal hidden by the backing: niche back = plaster; slat ends form the reveal (24 mm)

    // arch LED: tube in the reveal along the edge (both sides + semicircle) + wash ON the plaster (inward) + faint slat spill
    const path = []; const RL = R + 0.004;
    for (let k = 0; k <= 10; k++) path.push([ZC + RL, AB + 0.02 + (SPRING - AB - 0.02) * k / 10]);
    for (let k = 1; k < 40; k++) { const a = Math.PI * k / 40; path.push([ZC + RL * Math.cos(a), SPRING + RL * Math.sin(a)]); }
    for (let k = 10; k >= 0; k--) path.push([ZC - RL, AB + 0.02 + (SPRING - AB - 0.02) * k / 10]);
    const pts = path.map(([z, y]) => new T.Vector3(0.024, y, z));
    o.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 160, 0.005, 6), ledA));
    const ribbon = (xw, width, alpha, inward, name) => {
      const pos = [], col = [], idx = [];
      path.forEach(([z, y], k) => { let nz = ZC - z, ny = y > SPRING ? SPRING - y : 0; if (y <= SPRING) ny = 0; const l = Math.hypot(nz, ny) || 1; nz /= l; ny /= l; const s = inward ? 1 : -1;
        const e = Math.min(1, Math.min(k, path.length - 1 - k) / 4);
        pos.push(xw, y, z, xw, y + ny * width * s, z + nz * width * s); col.push(1, 1, 1, alpha * e, 1, 1, 1, 0);
        if (k < path.length - 1) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 4)); geo.setIndex(idx);
      const m = new T.Mesh(geo, glowMat(name)); m.castShadow = false; o.add(m); };
    ribbon(0.0225, 0.16, 0.5, true, '__arch_glow_wash');
    ribbon(0.0228, 0.05, 0.95, true, '__arch_glow_core');
    ribbon(0.0355, 0.09, 0.45, false, '__arch_spill_glow');

    // two recessed downlights in the timber ceiling (x 0.30) + light pools on the slat faces
    const poolMat = new T.MeshBasicMaterial({ transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, color: 0xffc890, name: '__downlight_pool', map: (() => {
      const cv = canvas(128, 256), x = cv.getContext('2d'); for (let py = 0; py < 256; py++) { const t = py / 256, half = 14 + t * 50, a = Math.pow(1 - t, 1.6) * 0.55;
        const gr = x.createLinearGradient(64 - half, 0, 64 + half, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(64 - half, py, half * 2, 1); }
      return new T.CanvasTexture(cv); })() });
    moods.halos.push(poolMat);
    const TRIM = mat({ color: 0xf0ede6, roughness: 0.5, name: '__downlight_trim' });
    for (const zd of [ZC - 0.62, ZC + 0.62]) {
      o.add(cyl(0.045, 0.045, 0.004, TRIM, 0.30, 3.008 - 0.004, zd, 28));
      o.add(cyl(0.032, 0.032, 0.002, ledA, 0.30, 3.008 - 0.0055, zd, 24));
      const pm = new T.Mesh(new T.PlaneGeometry(0.60, 1.5), poolMat); pm.rotation.y = Math.PI / 2; pm.position.set(SL + 0.003, 3.0 - 0.75, zd); o.add(pm);
    }
    out.wall = { obj: o };
  }

  // ---------- decor helpers ----------
  const heart = (() => { const s = new T.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.55, 0.25, 0.6, 0.85, 0.08, 1.0); s.quadraticCurveTo(0, 0.95, -0.08, 1.0); s.bezierCurveTo(-0.6, 0.85, -0.55, 0.25, 0, 0); return new T.ShapeGeometry(s, 6); })();
  const leafMesh = (size, m, x, y, z, rx, ry, rz) => { const l = new T.Mesh(heart, m); l.scale.setScalar(size); l.position.set(x, y, z); l.rotation.set(rx, ry, rz, 'YXZ'); return l; };
  function pothos(root, x, y, z, r, n, size) {
    for (let k = 0; k < n; k++) { const a = rnd() * Math.PI * 2, rr = r * Math.sqrt(rnd());
      root.add(leafMesh(size * (0.75 + 0.5 * rnd()), k % 3 ? LEAF2 : LEAF, x + Math.cos(a) * rr, y + rnd() * r * 0.7, z + Math.sin(a) * rr, -0.5 - rnd() * 0.8, -a - Math.PI / 2, (rnd() - 0.5) * 0.6)); }
  }
  // trailing vine: from the pot rim (x, y, z) over to zHang (past the shelf ends) and down `len`, 4–7 cm off the plaster
  function vine(root, x, y, z, zHang, len) {
    const n = Math.round(len / 0.05), pts = [new T.Vector3(x, y, z), new T.Vector3((x + 0.06) / 2, y + 0.01, (z + zHang) / 2)];
    for (let k = 0; k <= n; k++) { const t = k / n; pts.push(new T.Vector3(0.06 + Math.sin(k * 0.9) * 0.012, y - 0.03 - t * len, zHang + Math.sin(k * 0.6) * 0.015)); }
    root.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), n * 3, 0.0018, 4), LEAF));
    pts.forEach((p, k) => { if (k) root.add(leafMesh(0.04 + rnd() * 0.018, k % 2 ? LEAF2 : LEAF, p.x + 0.01, p.y - 0.015, p.z + (k % 2 ? 0.012 : -0.012), -0.2, Math.PI / 2 + (k % 2 ? 0.7 : -0.7), (rnd() - 0.5) * 0.5)); });
  }
  // Boston fern: arching fronds with paired pinnae, one BufferGeometry per fern
  function fern(root, x, y, z, h, n, maxR = 9) {
    const pos = [], idx = [], up = new T.Vector3(0, 1, 0);
    for (let f = 0; f < n; f++) {
      const az = (f / n) * Math.PI * 2 + rnd() * 0.5, el = 0.75 + rnd() * 0.65, Lf = h * (0.9 + rnd() * 0.5), droop = 0.55 + rnd() * 0.3;
      const dir = new T.Vector3(Math.cos(az), 0, Math.sin(az)), spine = [];
      for (let k = 0; k <= 14; k++) { const t = k / 14; spine.push(new T.Vector3(x, y, z).addScaledVector(dir, Lf * t * Math.cos(el)).addScaledVector(up, Lf * t * Math.sin(el) - droop * Lf * t * t * Math.sin(el) * 1.1)); }
      for (let k = 1; k < 14; k++) {
        const t = k / 14, p = spine[k], tan = spine[k + 1].clone().sub(spine[k - 1]).normalize(), side = new T.Vector3().crossVectors(tan, up).normalize();
        const l = Lf * 0.17 * Math.sin(Math.PI * (0.12 + 0.88 * t)) * (1 - 0.3 * t), w = l * 0.28;
        for (const s of [-1, 1]) {
          const tip = p.clone().addScaledVector(side, s * l).addScaledVector(tan, l * 0.35).addScaledVector(up, -l * 0.15), a = p.clone().addScaledVector(tan, w), b = p.clone().addScaledVector(tan, -w * 0.3);
          const mid = p.clone().lerp(tip, 0.45).addScaledVector(up, 0.006);
          const i0 = pos.length / 3; [b, a, mid, tip].forEach(v => pos.push(v.x, v.y, v.z)); idx.push(i0, i0 + 2, i0 + 1, i0 + 1, i0 + 2, i0 + 3, i0, i0 + 3, i0 + 2);
        }
      }
      const i0 = pos.length / 3; spine.forEach(v => pos.push(v.x, v.y, v.z)); for (let k = 0; k < 14; k++) idx.push(i0 + k, i0 + k + 1, i0 + k);
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    // clamp: no frond tip behind the wall finish
    const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) if (pa.getX(i) < 0.045) pa.setX(i, 0.045 + (0.045 - pa.getX(i)) * 0.15);
    root.add(new T.Mesh(geo, FERN));
  }
  const whitePot = (root, x, y, z, r, h, m = MATTE) => { root.add(at(lathe([[0, 0], [r * 0.82, 0], [r, h * 0.85], [r * 1.02, h], [r * 0.9, h], [0, h * 0.95]], m), x, y, z)); root.add(cyl(r * 0.9, r * 0.9, 0.004, SOIL, x, y + h * 0.9, z, 20)); return y + h * 0.92; };
  const donut = (root, x, y, z, R2, r2) => { const t = new T.Mesh(new T.TorusGeometry(R2, r2, 20, 40), CERAMIC); t.rotation.y = Math.PI / 2; t.position.set(x, y + R2 + r2, z); root.add(t); root.add(cyl(r2 * 0.8, r2 * 0.9, 0.012, CERAMIC, x, y, z, 16)); root.add(cyl(0.013, 0.016, 0.03, CERAMIC, x, y + 2 * (R2 + r2) - 0.008, z, 14)); };
  const bottle = (root, x, y, z, s = 1) => root.add(at(lathe([[0, 0], [0.04 * s, 0], [0.052 * s, 0.05 * s], [0.05 * s, 0.10 * s], [0.03 * s, 0.13 * s], [0.016 * s, 0.15 * s], [0.018 * s, 0.17 * s], [0, 0.17 * s]].map(([a, b]) => [a, b]), CERAMIC), x, y, z));
  const diffuser = (root, x, y, z) => { root.add(cyl(0.028, 0.03, 0.085, AMBER, x, y, z, 18)); root.add(cyl(0.008, 0.012, 0.02, AMBER, x, y + 0.085, z, 10));
    for (let k = 0; k < 7; k++) { const a = k * 0.9, t = 0.12 + rnd() * 0.12, h = 0.23 + rnd() * 0.04, s = new T.Mesh(new T.CylinderGeometry(0.0018, 0.0018, h, 5), REED);
      s.position.set(x + Math.cos(a) * Math.sin(t) * h / 2, y + 0.09 + Math.cos(t) * h / 2, z + Math.sin(a) * Math.sin(t) * h / 2); s.rotation.set(Math.sin(a) * t, 0, -Math.cos(a) * t); root.add(s); } };
  const books = (root, x, y, z, list) => { let yy = y; for (const [w, d, h, m, r] of list) { const b = wbox(x - d / 2, x + d / 2, yy, yy + h, z - w / 2, z + w / 2, m); b.rotation.y = r || 0; root.add(b); yy += h; } return yy; };
  // framed print leaning on the plaster: local frame (x along the wall, facing +z) → rotation.y π/2 → faces east
  const frame = (root, x, y, z, w, h) => { const f = G(), ft = 0.016, d = 0.018;
    f.add(L.box(w, ft, d, WALNUT, 0, 0, 0)); f.add(L.box(w, ft, d, WALNUT, 0, h - ft, 0)); f.add(L.box(ft, h - 2 * ft, d, WALNUT, -w / 2 + ft / 2, ft, 0)); f.add(L.box(ft, h - 2 * ft, d, WALNUT, w / 2 - ft / 2, ft, 0));
    const a = new T.Mesh(new T.PlaneGeometry(w - 2 * ft, h - 2 * ft), PRINT); a.position.set(0, h / 2, d * 0.6); f.add(a); f.add(L.box(w - 2 * ft, h - 2 * ft, 0.004, BOOK1, 0, ft, 0.002));
    f.rotation.set(-0.1, Math.PI / 2, 0, 'YXZ'); f.position.set(x, y, z); root.add(f); };

  // =============== 2. three floating walnut shelves inside the arch + LEDs + decor ===============
  { const o = G(), SD = 0.22, SH = 0.04, sw = 0.56, z0 = ZC - sw / 2, z1 = ZC + sw / 2, X0 = 0.020, X1 = X0 + SD;
    const shelves = [1.18, 1.58, 1.98];
    for (const y of shelves) { o.add(wbox(X0, X1, y, y + SH, z0, z1, WALNUT, 0.003)); strip(o, sw - 0.06, X0 + 0.012, y - 0.005, ZC, 0.30, 'down', 0.4); areaDown(o, sw - 0.08, X0 + 0.06, y - 0.01, ZC); }
    const [s1, s2, s3] = shelves.map(y => y + SH), xm = 0.12;          // shelf tops, mid-depth
    // high shelf (seen from the balcony, left = south = +z): pothos in a big white pot (trails), small plant, white bottle
    { const t = whitePot(o, xm, s3, ZC + 0.20, 0.075, 0.12, CERAMIC); pothos(o, xm, t, ZC + 0.20, 0.09, 34, 0.06);
      for (const [zh, len] of [[0.32, 0.85], [0.35, 0.55], [0.30, 0.40]]) vine(o, xm - 0.02, t, ZC + 0.24, ZC + zh, len);
      const t2 = whitePot(o, xm, s3, ZC - 0.02, 0.05, 0.08); pothos(o, xm, t2, ZC - 0.02, 0.05, 18, 0.042);
      bottle(o, xm, s3, ZC - 0.22, 1.0); }
    // middle shelf: small plant in a white pot, books + mini vase, donut vase, dark pot with a trailing plant (right end)
    { const t = whitePot(o, xm, s2, ZC + 0.20, 0.05, 0.08); pothos(o, xm, t, ZC + 0.20, 0.05, 18, 0.042);
      const tb = books(o, xm, s2, ZC + 0.07, [[0.13, 0.17, 0.018, BOOK1], [0.12, 0.16, 0.014, BOOK2]]); bottle(o, xm, tb, ZC + 0.07, 0.45);
      donut(o, xm, s2, ZC - 0.08, 0.055, 0.03);
      const t3 = whitePot(o, xm, s2, ZC - 0.21, 0.055, 0.10, DARKPOT); pothos(o, xm, t3, ZC - 0.21, 0.06, 22, 0.05);
      for (const [zh, len] of [[-0.32, 0.62], [-0.35, 0.42]]) vine(o, xm - 0.02, t3, ZC - 0.25, ZC + zh, len); }
    // low shelf: framed fern print, small fern in a white pot, reed diffuser on books, donut vase
    { frame(o, 0.06, s1, ZC + 0.17, 0.17, 0.22);
      const t = whitePot(o, xm, s1, ZC + 0.03, 0.05, 0.075); fern(o, xm, t, ZC + 0.03, 0.12, 16);
      const tb = books(o, xm, s1, ZC - 0.10, [[0.13, 0.15, 0.016, BOOK1]]); diffuser(o, xm, tb, ZC - 0.10);
      donut(o, xm, s1, ZC - 0.19, 0.045, 0.026); }
    out.shelves = { obj: loose(o) };
  }

  // =============== 3. floating walnut 3-drawer console, white marble top, LED under ===============
  { const o = G(), CW = 1.10, z0 = ZC - CW / 2, z1 = ZC + CW / 2, X0 = 0.034, X1 = 0.37, Y0 = 0.56, Y1 = 0.78, MT = 0.022;
    o.add(wbox(X0, X1 - 0.02, Y0, Y1, z0, z1, WALNUT));                                             // carcass
    const dw = (CW - 0.004 * 4) / 3;
    for (let k = 0; k < 3; k++) { const a = z0 + 0.004 + k * (dw + 0.004); o.add(wbox(X1 - 0.02, X1, Y0 + 0.004, Y1 - 0.004, a, a + dw, WALNUT, 0.002)); }
    o.add(wbox(X1 - 0.021, X1 - 0.019, Y0, Y1, z0, z1, GAP));                                       // shadow lines between fronts
    o.add(wbox(X0, X1 + 0.012, Y1, Y1 + MT, z0 - 0.012, z1 + 0.012, MARBLE, 0.003));
    strip(o, CW - 0.1, X0 + 0.015, Y0 - 0.005, ZC, 0.30, 'down', 0.7); areaDown(o, CW - 0.15, X0 + 0.08, Y0 - 0.01, ZC);
    const top = Y1 + MT, xm = 0.17;
    // decor (left = south): donut vase + reed diffuser on books, framed fern print (centre), fern in a white round pot (right)
    donut(o, xm, top, ZC + 0.42, 0.065, 0.034);
    const tb = books(o, xm + 0.03, top, ZC + 0.26, [[0.16, 0.20, 0.02, BOOK1], [0.15, 0.19, 0.016, BOOK2]]); diffuser(o, xm + 0.03, tb, ZC + 0.26);
    frame(o, 0.06, top, ZC - 0.02, 0.24, 0.30);
    o.add(at(lathe([[0, 0], [0.06, 0], [0.095, 0.05], [0.10, 0.10], [0.085, 0.15], [0.07, 0.155], [0, 0.15]], CERAMIC), xm + 0.01, top, ZC - 0.33));
    fern(o, xm + 0.01, top + 0.15, ZC - 0.33, 0.24, 22);
    out.console = { obj: loose(o) };
  }

  // =============== 4. low cream curved-corner planter box with ferns + white pebbles, LED floor cove ===============
  { const o = G(), PW = 1.66, z0 = ZC - PW / 2, z1 = ZC + PW / 2, X0 = 0.040, X1 = 0.30, PB = 0.05, Y1 = FL + 0.30;
    o.add(wbox(X0 + 0.03, X1 - 0.04, FL, FL + PB, z0 + 0.04, z1 - 0.04, PLINTH));                   // recessed plinth
    o.add(wbox(X0, X1, FL + PB, Y1, z0, z1, CREAM, 0.06));
    o.add(wbox(X0 + 0.02, X1 - 0.02, Y1 - 0.03, Y1 - 0.01, z0 + 0.025, z1 - 0.025, SOIL));
    const pg = new T.SphereGeometry(1, 8, 6);
    for (let i = 0; i < 240; i++) { const p = new T.Mesh(pg, PEBBLE), r = 0.011 + rnd() * 0.012; p.scale.set(r * (0.9 + rnd() * 0.4), r * 0.55, r);
      p.position.set(X0 + 0.03 + rnd() * (X1 - X0 - 0.06), Y1 - 0.008, z0 + 0.035 + rnd() * (PW - 0.07)); p.rotation.y = rnd() * 3; o.add(p); }
    for (let k = 0; k < 5; k++) fern(o, (X0 + X1) / 2 + (rnd() - 0.5) * 0.04, Y1 - 0.01, z0 + 0.14 + k * (PW - 0.28) / 4, 0.26 + rnd() * 0.06, 24);
    const cove = L.ledStrip({ w: PW - 0.12, wash: 0.35, dir: 'floor', alpha: 0.55 }); cove.obj.rotation.y = Math.PI / 2; cove.obj.position.set(X1 - 0.045, FL + 0.004, ZC); o.add(cove.obj);
    moods.strips.push(...cove.moods.strips); moods.halos.push(...cove.moods.halos);
    out.planter = { obj: o };
  }
  out.moods = moods;
  return out;
}
