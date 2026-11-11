// Utility (kitchen utility balcony) · Option 1 — owner 2026-11-11:
//   "extend the east wall height of the kitchen utility balcony till ceiling and add this [sink model] to the east wall"
//   "remove the washing machine and sink on west wall of the utility balcony"
//   "from the [washer/dryer show model] I only want this section: bottom the front-load washing machine, on the top use the
//    dishwasher, and place it on the north wall of the utility area behind the door"
//    (reference references/utility/2026-11-11_washer-tower-section.png)
// Utility door (v1 mover 02-d3-utility-teak-leaf-35): hinge on the WEST jamb (8.144, 5.179), opens into the utility to
// ≈ 108° — the open leaf runs from the hinge to (7.87, 6.06). "Behind the door" = north wall pier x 6.905–8.144.
// Laundry tower: manifest washer_tower ("Front-loading washer/Dryer Show" by MrdT, Sketchfab, CC BY 4.0 — only the owner's
// section: light-wood side frame, white two-door cupboard, stacking shelf, bottom washer; dryer dropped) 0.678 W × 0.657 D ×
// 2.596 H, in the north-west corner (20 mm off the west wall, 10 mm off the north wall), front south; its dryer slot holds
// the owners' dishwasher (manifest dishwasher_compact, misha.yast71, CC BY 4.0; 0.600 × 0.558 × 0.761 m) on the shelf.
// Site (scene lookup 2026-11-11): utility floor x 6.905–10.28, z 5.267–7.167, tile top 0.056. Kitchen passage door in the
// north wall x 8.15–9.05 (teak leaf swings into the utility, reach ≈ 0.9 m). East wall = solid outer parapet
// 'Utility_outer_east_wall' x 10.28–10.44, z 5.267–7.247, top 1.40 (no railing, no opening); the outer south parapet
// x 6.905–10.44, z 7.167–7.327, top 1.40 stays as it is (the open side). Floor drain x 10.07–10.21, z 6.97–7.11.
// The v1 export has NO ceiling over the utility (the laundry rails hung at 2.54 m from nothing). The master balcony next
// door is covered by the slab 3.11 (underside) → 3.20 (top); the same slab is added here, so the raised wall meets a ceiling.
// Sink model: "Sink" by Gerend (Sketchfab, CC BY 4.0 — credit the author), manifest utility_sink_copper: square vessel
// basin + deck-mounted pillar tap, copper-brown; baked at 0.0127 → basin 0.55 × 0.55 m, 0.122 m deep, tap 0.097 m tall.
// The file has no stand → wall-hung black granite counter (top 0.75 above the tile) on charcoal steel brackets, granite
// splash panel, chrome bottle trap + grey waste pipe to the corner floor drain.

const FLOOR = 0.056;                     // utility tile top
const WALL_E = 10.28, WALL_E1 = 10.44;   // east parapet inner / outer face
const WALL_Z0 = 5.267, WALL_Z1 = 7.327;  // north wall face → outer face of the south parapet (closes the corner)
const OLD_TOP = 1.40, SLAB_BOT = 3.11, SLAB_TOP = 3.20;
const SINK_KEY = 'utility_sink_copper';
export const SINK_CREDIT = '"Sink" by Gerend, Sketchfab, CC BY 4.0';
const ZC = 6.45;                         // sink centre along the east wall (clear of the drain at z 6.97, washer spot free)
const TOWER = { x0: 6.905 + 0.02, back: 5.267 + 0.01, w: 0.678 };   // tower east edge 7.603 → 0.27 m clear of the open leaf tip
const DW_ON = 0.909, DW_FRONT = 0.630, DW_D = 0.558;                  // tower-local: shelf top, dishwasher front (side panels 0.641)
export const TOWER_CREDIT = '"Front-loading washer/Dryer Show" by MrdT, Sketchfab, CC BY 4.0';
export const DW_CREDIT = '"Dishwasher" by misha.yast71, Sketchfab, CC BY 4.0';
const CT_W = 0.70, CT_D = 0.60, CT_TOP = 0.75, CT_T = 0.02;   // granite counter (top above the tile)

export default {
  id: 'option1',
  name: 'Option 1 · Copper sink on the east wall, wall to the ceiling (owner)',
  layoutLabel: 'Utility design',
  layoutIcon: false,
  summary: 'Laundry tower behind the door on the north wall (owners’ washer below, owners’ dishwasher on the stacking shelf, white cupboard on top, light-wood frame). The east parapet is built up in lime plaster to the ceiling slab; the owners’ copper vessel sink with its pillar tap stands on a wall-hung black granite counter on that wall (rim 0.87 m); the old washing machine and the west-wall sink counter are removed.',
  search: ['utility balcony wall hung sink granite counter', 'copper vessel sink utility area india', 'utility balcony wash basin design'],
  facts: [
    ['Sink', SINK_CREDIT + ' — vessel basin 0.55 × 0.55 m, 0.12 m deep, deck pillar tap'],
    ['Counter', 'black granite 0.70 × 0.60 m, top 0.75 m, on two charcoal steel brackets; granite splash 0.45 m'],
    ['Rim height', '0.87 m above the floor tile'],
    ['Position', 'east wall, centre 1.18 m from the kitchen wall; 0.17 m clear of the corner floor drain'],
    ['East wall', 'parapet 1.40 m → continued in lime plaster to the slab (3.20 m)'],
    ['Ceiling', 'slab added over the utility at 3.11 m (same as the master balcony; the old model had none)'],
    ['Laundry tower', TOWER_CREDIT + ' — owner section only: front-load washer below, stacking shelf, white two-door cupboard on top, light-wood side frame; 0.68 W × 0.66 D × 2.60 H m'],
    ['Dishwasher', DW_CREDIT + ' — in the dryer slot on the stacking shelf (0.60 W × 0.56 D × 0.76 H, control panel at 1.6 m)'],
    ['Tower place', 'north wall behind the utility door, north-west corner; 0.27 m clear of the fully open door leaf'],
    ['Removed', 'washing machine (body, door, glass); west-wall sink, brass tap, limestone counter and the olive storage cabinet under it'],
  ],
  apply(ctx) {
    const T = ctx.THREE;
    // owner: remove the washing machine and the west-wall sink (every part)
    for (const id of ['front-loading#0', 'washing-machine#0', 'utility-cleaning#0', 'utility-faucet#0', 'utility-countertop#0', 'utility-storage#0']) {
      const g = ctx.one(id); if (g) ctx.hide(g);
    }

    const plaster = ctx.lib.mat('01 Warm ivory lime plaster', 0xe6dccb);
    const ceilM = new T.MeshStandardMaterial({ color: 0xf1ece2, roughness: 0.9, name: 'Ceiling warm white (utility)' });
    // east wall continued from 2 mm inside the old top up to the slab top
    {
      const y0 = OLD_TOP - 0.002, h = SLAB_TOP - y0, holder = new T.Group();
      const mesh = new T.Mesh(new T.BoxGeometry(WALL_E1 - WALL_E, h, WALL_Z1 - WALL_Z0), plaster);
      mesh.position.set((WALL_E + WALL_E1) / 2, y0 + h / 2, (WALL_Z0 + WALL_Z1) / 2);
      holder.add(mesh);
      const g = ctx.add('east-wall-to-ceiling', { obj: holder }, 0, 0, 0, { name: 'Utility east wall raised to the ceiling (lime plaster)' });
      if (g) g.meshes.forEach(m => { m.userData.cat = 'arch'; });
    }
    // ceiling slab over the utility (upper-floor utility above), same level as the master balcony slab
    {
      const holder = new T.Group();
      const mesh = new T.Mesh(new T.BoxGeometry(WALL_E1 - 6.905, SLAB_TOP - SLAB_BOT, WALL_Z1 - WALL_Z0), ceilM);
      mesh.position.set((6.905 + WALL_E1) / 2, (SLAB_BOT + SLAB_TOP) / 2, (WALL_Z0 + WALL_Z1) / 2);
      holder.add(mesh);
      const g = ctx.add('ceiling-slab', { obj: holder }, 0, 0, 0, { name: 'Utility ceiling slab (3.11 m)' });
      if (g) g.meshes.forEach(m => { m.userData.cat = 'ceiling'; });
    }

    // wall-hung granite counter + splash + brackets + waste (builder frame: back face on the wall, +z into the room)
    const granite = new T.MeshPhysicalMaterial({ color: 0x1b1c1e, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15, name: 'Black granite (utility)' });
    const steel = new T.MeshStandardMaterial({ color: 0x2f3133, roughness: 0.55, metalness: 0.6, name: 'Charcoal steel (utility)' });
    const chrome = new T.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.2, metalness: 1, name: 'Chrome (utility)' });
    const pvc = new T.MeshStandardMaterial({ color: 0x8c8e90, roughness: 0.6, name: 'Grey PVC (utility)' });
    const box = (w, h, d, m, x, y, z) => { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); return b; };
    const cyl = (r, h, m, x, y, z) => { const c = new T.Mesh(new T.CylinderGeometry(r, r, h, 20), m); c.position.set(x, y, z); return c; };
    const top = FLOOR + CT_TOP;
    const ct = new T.Group();
    ct.add(box(CT_W, CT_T, CT_D, granite, 0, top - CT_T / 2, CT_D / 2));
    ct.add(box(CT_W, 0.06, CT_T, granite, 0, top - 0.03, CT_D - CT_T / 2));            // front drop edge
    ct.add(box(CT_W, 0.45, 0.015, granite, 0, top + 0.225, 0.0075));                    // splash panel
    for (const sx of [-0.27, 0.27]) {                                                  // L-brackets
      ct.add(box(0.03, 0.30, 0.006, steel, sx, top - CT_T - 0.15, 0.003));
      ct.add(box(0.03, 0.006, CT_D - 0.06, steel, sx, top - CT_T - 0.003, (CT_D - 0.06) / 2));
      const diag = box(0.03, 0.006, 0.50, steel, sx, top - CT_T - 0.15, 0.2);
      diag.rotation.x = -Math.atan2(0.30, 0.40);
      ct.add(diag);
    }
    // waste: chrome tail + bottle trap under the basin outlet, grey pipe to the wall, down, along the floor to the drain
    const outZ = 0.30;
    ct.add(cyl(0.016, 0.16, chrome, 0, top - CT_T - 0.08, outZ));
    ct.add(cyl(0.032, 0.10, chrome, 0, top - CT_T - 0.21, outZ));
    const arm = cyl(0.016, outZ - 0.03, chrome, 0, top - CT_T - 0.19, (outZ + 0.03) / 2); arm.rotation.x = Math.PI / 2; ct.add(arm);
    ct.add(cyl(0.02, top - CT_T - 0.19 - FLOOR - 0.02, pvc, 0, (top - CT_T - 0.19 + FLOOR + 0.02) / 2, 0.03));
    // along the floor (local +x = south with ry −π/2, towards the drain at z ≈ 7.04)
    const run = 7.0 - ZC, flr = cyl(0.02, run, pvc, run / 2, FLOOR + 0.022, 0.03); flr.rotation.z = Math.PI / 2; ct.add(flr);
    ctx.add('sink-counter', { obj: ct }, WALL_E, ZC, -Math.PI / 2, { name: 'Wall-hung black granite counter, splash, steel brackets + waste' });

    const m = ctx.lib.model(SINK_KEY);
    if (m) {
      m.obj.position.y = top;
      m.obj.traverse(o => { if (o.isMesh && o.material) { o.material = o.material.clone(); o.material.metalness = 0.5; o.material.roughness = 0.35; } });
      // basin back edge 25 mm off the splash panel
      ctx.add('sink', m, WALL_E - 0.04, ZC, -Math.PI / 2, { name: 'Copper vessel sink + pillar tap (' + SINK_CREDIT + ')', follow: 'sink-counter' });
    }

    // laundry tower behind the door + the dishwasher in its dryer slot (one group: the dishwasher sits on the tower shelf)
    const tw = ctx.lib.model('washer_tower');
    if (tw) {
      tw.obj.position.y = FLOOR;
      const dw = ctx.lib.model('dishwasher_compact');
      if (dw) { dw.obj.position.set(0, DW_ON + 0.002, DW_FRONT - DW_D); tw.obj.add(dw.obj); }
      ctx.add('washer-tower', tw, TOWER.x0 + TOWER.w / 2, TOWER.back, 0, { name: 'Laundry tower: washer + dishwasher + cupboard (' + TOWER_CREDIT + '; dishwasher ' + DW_CREDIT + ')' });
    }
    return {};
  },
};
