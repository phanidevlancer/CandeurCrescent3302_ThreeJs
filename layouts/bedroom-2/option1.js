// Bedroom 2 · Option 1 — dark study wall (owner 2026-11-10: "in bedroom 2 for the computer wall, without changing the table and
// chair, give this wall as one of the options"; "make sure the wall is designed end to end without blocking the movement of the door").
// The owners' desk (1600 × 700), chair, monitor arm, lamp and desk gear stay exactly as they are; only the wall behind them changes.
// 2026-11-11 (owner): the bed = their "Bed" model by Doaa Sheha (Sketchfab, CC BY 4.0) in its own colours; the room's wall and the
// east wardrobe stay (the v1 bed shares merged meshes with them → bed-only materials suppressed + bed-frame triangles cut).
// The desk = their "Computer Desk" model (draakon_4d, CC BY 4.0) at exactly the owners' desk size and place (1600 × 700, top 0.74).
// v1 bed (world): mattress x 1.81–3.33, z −8.25…−6.27; frame + runner x 1.79–3.37 (+ teak / jute bits to x 4.06), y ≤ 0.85.
// The east wardrobe starts at x 4.07 and the room's north wall is z −8.313.
const BED_CUT = [[1.70, -0.05, -8.40], [4.065, 0.86, -5.90]];
// owner 2026-11-11: "use the same bed dimensions as before, only replace with the 3d model" → the model is scaled non-uniformly to
// EXACTLY the v1 bed (bed-only parts measured in the viewer: frame + headboard + bedding x 1.787–3.374, z −8.302…−6.250, i.e.
// 1.587 × 2.052 m; duvet top 0.742 at the centre) and stands exactly where it stood (head on the north wall, same orientation).
// Model at scale 1: 1.988 × 2.335 m over the bedding, duvet top 0.594 above its base → sy = (0.742 − 0.056) / 0.594.
const V1BED = { x0: 1.787, x1: 3.374, z0: -8.302, z1: -6.250 }, MODEL_TOP = 0.594, V1_TOP = 0.742, FLOOR = 0.056;
// Wardrobe slot (owner 2026-11-11 "give this as another sliding wardrobe option for bedroom 2"). The v1 east wardrobe (measured in the
// viewer): teak carcass x 4.155–4.758, z −8.193…−5.767, top 2.977; three ivory-plaster bypass sliders on a brass track at x 4.067–4.139,
// fronts 0.135–2.925; carcass + track + fronts are merged into bedroom-2#1 (with the bed), rails = bedroom-2#4/#5. Ceiling 3.05 over the
// front part, a bulkhead (fascia) down to 2.91 at x ≥ 4.54 → the new carcass stops at 2.905 and a closed oak header runs up to the
// ceiling over the front 0.52 m. Same footprint: x 4.067 → 4.758 (0.691 deep), z −8.193 → −5.767 (2.426 wide).
const WARD = { x0: 4.067, x1: 4.758, z0: -8.193, z1: -5.767, top: 2.905, ceil: 3.048, fascia: 4.54 }, WFLOOR = 0.056;
const WARDROBE = [
  { id: 'current', name: 'Ivory plaster sliders (as built)', summary: 'The existing 2.4 m east wardrobe: three ivory lime-plaster sliding fronts with a teak band and recessed bronze pulls on a brass track.', search: ['ivory sliding wardrobe teak band', 'lime plaster wardrobe doors'] },
  { id: 'sage-gloss-slider', ref: 'references/bedroom-2/2026-11-11_sliding-wardrobe-sage-gloss.png', name: 'Sage gloss sliders + pale oak frame',
    summary: 'Owner reference: the same 2.43 m wardrobe rebuilt floor to ceiling in pale oak (sides, top, header to the ceiling, slim pale-gold top track) on a recessed sage plinth, with two 1.2 m bypass sliders in high-gloss sage lacquer, each divided into four panels by thin oak-brass inlay lines at the same heights on both doors, and long oak-brass bar pulls on the outer edges. Inside (pale oak): left bay = two shelves of folded clothes, a shirt rail, a 5-drawer stack with blue knitwear on top and a shoe tier below; right bay = shelves with folded linen and jute baskets, a long-hang rail (dresses, coats) and a two-tier shoe shelf; warm LED under the first shelf of each bay. Not added: the reference\u2019s floor plants and stump vase (the 0.70 m path between the bed and the wardrobe must stay clear).',
    search: ['sage green sliding wardrobe', 'sage green gloss wardrobe oak frame', 'sliding wardrobe brass inlay lines', 'two door sliding wardrobe green lacquer', 'oak wardrobe interior drawers shelves rail'] },
];
export default {
  id: 'option1',
  ref: 'references/bedroom-2/2026-11-10_dark-study-slat-wall.png',
  name: 'Option 1 · Dark study wall (walnut slats + blueprints)',
  summary: 'The south (desk) wall finished end to end in the owner reference\'s look: deep charcoal-green wall, a tall walnut slat panel at the west end with a long walnut shelf (plant, books, brass orb) and a hanging planter, two framed sci-fi blueprints above the monitor, a short slat panel under a small shelf (retro radio, succulent) with a column of three small prints between the desk and the door, a black industrial pipe lamp with an Edison bulb, slats continuing over the door. The desk is the owners\' black sit/stand desk model at exactly their 1600 × 700 size and place; chair and desk gear untouched; the owners\' 32-inch LG monitor on its stand. Bed: the owners\' white storage bed model. Where the open bedroom door rests (east 0.96 m, up to 2.32 m) everything is flat (3 mm slat-look veneer), real slats only above the door, so the door opens and closes fully.',
  search: ['dark green study wall wood slats', 'gaming desk setup wall shelves slats', 'blueprint posters office wall', 'industrial pipe lamp edison bulb', 'walnut slat wall desk'],
  slots: [
    { id: 'wardrobe', label: 'Wardrobe', default: 'current', anchor: [3.98, 2.45, (WARD.z0 + WARD.z1) / 2], variants: WARDROBE },
  ],
  facts: [
    ['Kept', 'owners\' desk size + place 1600 × 700 (top 0.74), task lamp — unchanged'],
    ['PC', 'open-frame water-cooled showcase PC shown at 0.6 × ≈ 355 × 390 × 209 mm (Daniel Cardona, CC BY 4.0) sideways on the desk\'s east end, glass towards the chair; replaces the table lamp'],
    ['Laptop', 'MacBook Pro 14 (closed, real size 312 × 221 mm) on a wooden riser stand ("Wood laptop stand" by nurlumustafa, CC BY-NC 4.0, 270 × 254 × 172 mm) at the right (west) end of the desk; replaces the v1 laptop + vertical dock'],
    ['Monitor', '32-inch LG on its stand ("32 inch LG monitor" by gazchad1, Sketchfab, CC BY 4.0), real size 0.72 × 0.49 m, replaces the v1 27-inch + arm'],
    ['Keyboard + mouse', 'Logitech full-size keyboard (blue backlit) + wireless mouse (by Vertex_Bro, Sketchfab, CC BY 4.0) on the felt mat'],
    ['Desk', 'black sit/stand desk model "Computer Desk" by draakon_4d (Sketchfab, CC BY 4.0), fitted to exactly 1600 × 700 × 740'],
    ['Bed', '"Bed" by Doaa Sheha (Sketchfab, CC BY 4.0), own colours; scaled to exactly the v1 bed: 1.59 × 2.05 m, duvet top 0.74 m, same place and orientation'],
    ['Removed', 'the v1 high cupboard over the desk and its plant (the wall is now open shelving + slats)'],
    ['Door', 'the bedroom door is hinged in the south-east corner and folds onto this wall: x 3.82 → 4.78 m stays flat below 2.32 m (slat-look veneer), real slats above'],
    ['Lighting', 'cove wash, LED under the shelves (washing the slats), Edison pipe lamp'],
  ],
  apply(ctx) {
    ['bedroom-2#0', 'plant#16'].forEach(id => { const g = ctx.one(id); if (g) ctx.hide(g); });
    const w = ctx.lib.studyWallDark({ length: 4.78 - 1.68, leafTo: 4.78 - 3.80, leafTop: 2.32, ceiling: 2.98, desk: [4.78 - 3.38, 4.78 - 1.78] });
    ctx.add('study-wall', w, 4.78, -4.503, Math.PI, { name: 'Dark study wall (walnut slats, shelves, blueprints)' }); ctx.mood(w.moods);

    // ---- desk: owner model at exactly the v1 desk's size and place (v1 owned-desk#0: x 1.78–3.38, z −5.24…−4.54, top 0.74)
    const dm = ctx.lib.model('computer_desk_draakon');
    if (dm) {
      ctx.find(/^(owned-desk|desk-adjustable)#/).forEach(ctx.hide);   // the old top/frame + its leg glides (the model has its own feet)
      // owner 2026-11-11 ("did you leave any old table components?"): every part of the OLD desk goes — its height controller,
      // LED display + memory button (the new desk has its own keypad), cable tray, cable sleeve, hidden power strip, felt mat
      ctx.find(/^(desk-four-memory|desk-led|desk-memory|desk-cable-management|desk-concealed|desk-hidden|desk-warm)#/).forEach(ctx.hide);
      ctx.add('desk', dm, 2.58, -4.54, Math.PI, { name: 'Sit/stand desk 1600 × 700 ("Computer Desk" by draakon_4d, CC BY 4.0)' });
    }
    // ---- monitor (owner 2026-11-11 "use this monitor"): 32-inch LG on its own stand, real size 0.72 × 0.49 × 0.18, on the desk top
    // (0.74), centred where the v1 screen was (x 2.33–2.91 → 2.62), back of the stand 6 cm off the wall, screen facing the chair
    const mm = ctx.lib.model('lg_monitor_32');
    if (mm) {
      ctx.find(/^(desk-monitor|desk-27inch)#/).forEach(ctx.hide);   // v1 screen, bezel and monitor arm (the arm would float behind it)
      const T = ctx.THREE, cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
      const c2 = cv.getContext('2d'), gr = c2.createLinearGradient(0, 0, 512, 512);
      gr.addColorStop(0, '#0d1b2a'); gr.addColorStop(0.55, '#1b3a4b'); gr.addColorStop(1, '#3a2c4f'); c2.fillStyle = gr; c2.fillRect(0, 0, 512, 512);
      for (const [x, y, r, col] of [[150, 330, 170, 'rgba(64,145,108,0.35)'], [360, 180, 150, 'rgba(255,183,77,0.22)'], [300, 400, 120, 'rgba(120,160,220,0.25)']]) {
        const rg = c2.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); c2.fillStyle = rg; c2.fillRect(0, 0, 512, 512);
      }
      const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
      const screen = new T.MeshPhysicalMaterial({ name: 'monitor screen', color: 0x050608, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.55 });
      mm.obj.traverse(o => { if (o.isMesh && /screen/i.test(o.material.name)) o.material = screen; });
      mm.obj.position.y = 0.74;
      ctx.add('monitor', mm, 2.62, -4.60, Math.PI, { name: '32-inch LG monitor ("32 inch LG monitor" by gazchad1, CC BY 4.0)', loose: true });
    }
    // ---- keyboard + mouse (owner 2026-11-11 "use this mouse and keyboard", Logitech by Vertex_Bro, CC BY 4.0) on the desk top
    // (0.74), square to the desk's front edge (z −5.24) facing the chair: keyboard centred on the monitor (x 2.62), its front edge
    // 17 cm in from the desk edge; mouse 8 cm to the seated user's right (the user faces +z, so right = −x), palm end towards the user
    const kb = ctx.lib.model('logitech_keyboard'), ms = ctx.lib.model('logitech_mouse');
    if (kb && ms) {
      ctx.find(/^(desk-wireless|desk-keycap)#/).forEach(ctx.hide);
      const kFront = -5.24 + 0.17, kBack = kFront + kb.size.z, kMid = (kFront + kBack) / 2;
      kb.obj.position.y = 0.74; ms.obj.position.y = 0.74;   // straight on the desk top (the old felt mat is gone)
      ctx.add('keyboard', kb, 2.62, kBack, Math.PI, { name: 'Logitech keyboard (by Vertex_Bro, CC BY 4.0)', loose: true });
      ctx.add('mouse', ms, 2.62 - kb.size.x / 2 - 0.08 - ms.size.x / 2, kMid + ms.size.z / 2, Math.PI, { name: 'Logitech mouse (by Vertex_Bro, CC BY 4.0)', loose: true });
    }

    // ---- laptop (owner 2026-11-11: "place this macbook CLOSED on the wooden laptop stand towards the right side, replace the
    // existing laptop and the laptop stand"): wooden riser stand (nurlumustafa, CC BY-NC 4.0) at the desk's west end (the seated
    // user faces +z, so right = −x), lip towards the user; the MacBook Pro 14 (Apple User, Sketchfab Standard licence), lid shut
    // in the file, lies on the stand's two 22° bracket edges with its front edge just short of the lip.
    const st = ctx.lib.model('laptop_stand_wood'), mb = ctx.lib.model('macbook_pro_14');
    if (st && mb) {
      ctx.find(/^(desk-docked|desk-vertical)#/).forEach(ctx.hide);   // v1 laptop + vertical dock
      const T = ctx.THREE, wood = new T.MeshStandardMaterial({ name: 'laptop stand walnut', color: 0x8a5a3a, roughness: 0.55, metalness: 0 });
      st.obj.traverse(o => { if (o.isMesh) o.material = wood; });
      // stand frame (file measured): straight top edge at 22.0°; laptop's bottom-front corner rests on it at depth 0.228, h 0.088
      // (the lip's inner face is at depth 0.2332; the laptop's front face leans 22° towards it → corner kept 5 mm back)
      const TILT = Math.atan(0.4041), ZF = 0.228, YF = 0.088, D = mb.size.z;
      const tilt = new T.Group(); tilt.add(mb.obj); tilt.rotation.x = TILT;
      tilt.position.set(0, 0.74 + YF + D * Math.sin(TILT), ZF - D * Math.cos(TILT));
      // stand + laptop = one desk item (moves as one; the laptop rests on the two thin bracket edges, which the floating audit's
      // centre/±35 % down-rays would miss if it were its own group)
      const set = new T.Group(); set.add(st.obj, tilt);
      st.obj.position.y = 0.74;
      // back of the stand 6 cm off the wall (z −4.60); centre x 1.99 → stand 1.855–2.125, laptop 1.834–2.146 (5.4 cm in from the
      // desk's west end, 11 cm clear of the monitor stand, 10 cm clear of the mouse)
      ctx.add('laptop-stand', { obj: set, size: st.size }, 1.99, -4.60, Math.PI, { name: 'MacBook Pro 14 closed on a wooden laptop stand (MacBook: Apple User, Sketchfab Standard; stand: nurlumustafa, CC BY-NC 4.0)', loose: true });
    }
    // ---- PC (owner 2026-11-11 "replace table lamp with this cpu"): open-frame water-cooled showcase PC ("Dream computer setup"
    // by Daniel Cardona, CC BY 4.0), file size 0.591 W × 0.65 H × 0.349 D. Owner 2026-11-11 "reduce the cpu size by 0.4": shown at
    // 0.6 × (uniform) = 0.355 W × 0.39 H × 0.209 D. It stands SIDEWAYS on the desk's east end: glass face west towards the chair,
    // back 2 cm in from the desk end (x 3.151–3.36, 17 cm clear of the monitor at x 2.98), towards the back of the desk
    // (z −4.978…−4.623) so the desk front stays free
    const pc = ctx.lib.model('pc_tower');
    if (pc) {
      ctx.find(/^desk-task#/).forEach(ctx.hide);   // v1 table lamp
      // scale the holder about its origin (floor, back-face centre) → bottom stays on the desk top
      pc.obj.scale.setScalar(0.6);
      pc.size.multiplyScalar(0.6);
      pc.obj.position.y = 0.74;
      ctx.add('pc', pc, 3.36, -4.80, -Math.PI / 2, { name: 'Open-frame water-cooled PC ("Dream computer setup" by Daniel Cardona, CC BY 4.0)', loose: true });
    }
    // ---- office chair (owner 2026-11-11): IKEA MARKUS (Graham Rust, Sketchfab Standard licence) replaces the v1 task chair in its
    // exact place (v1 bedroom-2#3: x 2.32–2.90, z −5.55…−4.97), backrest to the room, seat facing the desk (south, +z), real size
    const ch = ctx.lib.model('ikea_markus_chair');
    if (ch) { const v1c = ctx.one('bedroom-2#3'); if (v1c) ctx.hide(v1c); ch.obj.position.y = 0.01;
      ctx.add('chair', ch, 2.61, -5.6, 0, { name: 'IKEA MARKUS office chair (model by Graham Rust)', seat: true }); }

    // ---- wardrobe slot (east wall): same footprint as the v1 wardrobe, carcass to the bulkhead, header up to the ceiling
    if (ctx.slot('wardrobe') === 'sage-gloss-slider') {
      const v1w = ctx.one('bedroom-2#1');
      if (v1w) {
        // the v1 wardrobe lives in the bed's merged group: fronts / track / pulls / LED profile by material, the teak carcass by triangle box,
        // and the three slider movers' teak bands (movers keep their own meshes)
        ctx.suppress(v1w, /Warm ivory lime plaster|Aged brushed brass|Warm 2850K LED/);
        ctx.suppress({ meshes: v1w.meshes.filter(m => /^33-bedroom-2-east-wardrobe/.test(m.userData.mov || '')) }, /./);
        ctx.cutGroup(v1w, [4.05, -0.1, -8.30], [4.80, 3.1, -5.70], /Oiled teak/);
      }
      ['bedroom-2#4', 'bedroom-2#5'].forEach(id => { const g = ctx.one(id); if (g) ctx.hide(g); });   // v1 hanging rails
      // rug motifs that sit fully under the carcass (the v1 rug already ran under the wardrobe) go; the v1 downlight at x 4.28 that the
      // ceiling-high header would bury moves 0.45 m west, in front of the sliders (wardrobe wash light)
      ['woven-geometric#28', 'woven-geometric#30'].forEach(id => { const g = ctx.one(id); if (g) ctx.hide(g); });
      ctx.rigid(['recessed-downlight#3', 'warm-downlight#3'].map(ctx.one).filter(Boolean), { x: 0, z: 0 }, { x: -0.45, z: 0 }, 0);
      const W = WARD.z1 - WARD.z0, D = WARD.x1 - WARD.x0;
      const wr = ctx.lib.slidingWardrobe({ style: 'sage-gloss', W, D, top: WARD.top - WFLOOR, ceil: WARD.ceil - WFLOOR, fasZ: WARD.x1 - WARD.fascia + 0.02 });
      wr.obj.position.y = WFLOOR;
      // east wall: ry −π/2 → local +x runs south, local +z faces west into the room; origin = centre of the back face
      ctx.add('wardrobe', wr, WARD.x1, (WARD.z0 + WARD.z1) / 2, -Math.PI / 2, { name: 'Sage gloss sliding wardrobe, pale oak frame (owner reference)' }); ctx.mood(wr.moods);
    }

    // ---- bed
    const v1 = ctx.one('bedroom-2#1'); let bedAdded = false;
    const bm = v1 ? ctx.lib.model('bed2_doaa') : null;
    if (bm) {
      // the scan ships an unlit material (KHR_materials_unlit) → re-light it with the same textures
      const lit = new Map();
      bm.obj.traverse(o => {
        if (!o.isMesh) return; const m = o.material;
        if (!lit.has(m)) lit.set(m, new ctx.THREE.MeshStandardMaterial({ name: 'bed2 ' + m.name, map: m.map, color: m.color, roughness: 0.9, metalness: 0, side: m.side }));
        o.material = lit.get(m);
      });
      bm.obj.position.y = FLOOR;
      bm.obj.scale.set((V1BED.x1 - V1BED.x0) / bm.size.x, (V1_TOP - FLOOR) / MODEL_TOP, (V1BED.z1 - V1BED.z0) / bm.size.z);
      // v1 bed out: its own materials, then only the bed-frame triangles of the teak mesh it shares with the wardrobe
      ctx.suppress(v1, /Muted rose|Ivory cotton|Natural linen|Graphite metal/);
      ctx.cutGroup(v1, BED_CUT[0], BED_CUT[1], /Oiled teak/);
      // (the jute mesh also holds the rug field on the floor: only its runner over the bed, y > 0.15, goes)
      ctx.cutGroup(v1, [BED_CUT[0][0], 0.15, BED_CUT[0][2]], BED_CUT[1], /Handwoven jute/);
      ctx.add('bed', bm, (V1BED.x0 + V1BED.x1) / 2, V1BED.z0, 0, { name: 'White storage bed ("Bed" by Doaa Sheha, CC BY 4.0)', seat: true });
      bedAdded = true;
    }
    return bedAdded ? { bed: 'bed' } : {};
  },
};
