// Bedroom 1 · Option 1 — the owners' "Bed 01" model (owner 2026-11-11: "use this bed in bedroom1, but the wall should have the fluted
// wood same like now, just take the bed, mattress and pillow and match colour of the current vibe").
// Model: "Bed 01" by 5th Dimension (Sketchfab, CC BY 4.0, assets/models/originals/bed_01.glb) → only the low bed base, mattress,
// pillows and duvet (tools/glb_extract_bed01.py), then fitted to exactly the v1 bed's footprint and heights. Its tall upholstered
// headboard, four-poster frame, sconces and floor strips are dropped: the room's oak fluted panel stays the headboard.
// Recoloured with the v1 bed's own materials: oiled-teak frame, ivory cotton mattress + pillows, cream quilted cotton duvet.
// Owner (same day): the old bed is removed completely (no 'original' bed choice) and the green throw + cushions go too.
// owner 2026-11-11 ("same rule with bedroom1"): the model takes EXACTLY the v1 bed's size and place — overall footprint of the v1
// bed-only parts (teak frame + ivory / cream bedding; measured at runtime, ≈ x 7.905–9.655 × z −6.78…−4.62 = 1.75 × 2.16 m), head
// against the south (fluted panel) wall, foot to the north; y is scaled so the duvet top matches the v1 bed's (ray-cast at its centre).
const FLOOR = 0.056;              // bedroom 1 floor finish top (ray-cast)
const CX = 8.78;
export default {
  id: 'option1',
  name: 'Option 1 · Teak platform bed (owner model)',
  layoutLabel: 'Bedroom 1 design',
  summary: 'Same room as the original — sage cane wardrobe, oak fluted headboard panel with the botanical prints and brass sconces, handloom rug, full-wall curtains — with the owners\' Bed 01 model as the bed: low oiled-teak platform, ivory mattress and pillows, cream quilted duvet; the owners\' 3-drawer wooden bedside tables either side.',
  search: ['sage green bedroom oak fluted headboard', 'low platform bed cream sage bedding', 'cane wardrobe sage bedroom'],
  facts: [
    ['Bed', '"Bed 01" by 5th Dimension (Sketchfab, CC BY 4.0): base, mattress, pillows, duvet only; scaled to exactly the v1 bed: 1.75 × 2.16 m overall, mattress top 0.63 m, same place'],
    ['Bedside tables', '"Wooden bedside table" by Manuel López (Sketchfab, CC BY 4.0), 3 drawers, scaled to the old nightstands: left 0.36 × 0.40 m, right 0.42 × 0.40 m, top 0.59 m; the book, vase, bowl and plant stay on the tops'],
    ['Kept', 'oak fluted headboard panel, prints, sconces, rug, wardrobe, curtains'],
    ['Removed', 'the whole v1 bed (frame, mattress, bedding) and the green throw, euro shams and lumbar cushion (owner)'],
    ['Clearance', 'unchanged from the original bed (same footprint): 1.75 m between the nightstands (1.80 m gap)'],
  ],
  apply(ctx) {
    const v1 = ctx.one('bedroom-1#0');
    if (!v1) return {};
    const bm = ctx.lib.model('bed1_bed01'); if (!bm) return {};
    const T = ctx.THREE;
    const matOf = re => { const m = v1.meshes.find(x => re.test(x.material.name)); return m && m.material; };
    const fb = (c, r) => new T.MeshStandardMaterial({ color: c, roughness: r });
    const pick = { Wood: matOf(/Oiled teak/) || fb(0x9a6a42, 0.5), Fabric: matOf(/Ivory cotton/) || fb(0xefe8dc, 0.9), 'Fabric_Plain.001': matOf(/cream quilted/) || fb(0xe6dccb, 0.95) };
    bm.obj.traverse(o => { if (o.isMesh) { const p = pick[o.material.name] || pick[(o.material.name || '').replace(/\.\d+$/, '')]; if (p) o.material = p; } });
    bm.obj.position.y = FLOOR;
    const vb = new T.Box3(); v1.meshes.filter(m => /Oiled teak|Ivory cotton|cream quilted/.test(m.material.name)).forEach(m => vb.expandByObject(m));
    // duvet-top height: ray-cast the v1 bedding at the bed centre; the GLB's duvet top is 0.643 m above its base at scale 1
    const rc = new T.Raycaster(new T.Vector3((vb.min.x + vb.max.x) / 2, 3, (vb.min.z + vb.max.z) / 2), new T.Vector3(0, -1, 0));
    const hit = rc.intersectObjects(v1.meshes.filter(m => /Ivory cotton|cream quilted/.test(m.material.name)), false)[0];
    const sy = hit ? (hit.point.y - FLOOR) / 0.643 : 1;
    bm.obj.scale.set((vb.max.x - vb.min.x) / bm.size.x, sy, (vb.max.z - vb.min.z) / bm.size.z);
    // v1 bed out (frame + bedding); its 'Handwoven jute' mesh is the rug field on the floor and stays
    ctx.suppress(v1, /Oiled teak|Ivory cotton|cream quilted/);
    // owner 2026-11-11: "remove the green blanket and green cushions" → sage throw, euro shams and lumbar cushion go
    ['approved-b1-sage#2', 'approved-b1-sage#3', 'approved-b1-sage#4'].forEach(id => { const g = ctx.one(id); if (g) ctx.hide(g); });
    // builder frame: back face at the origin, foot towards +z → ry π puts the head on the south wall (v1 max z), foot north
    ctx.add('bed', bm, (vb.min.x + vb.max.x) / 2, vb.max.z, Math.PI, { name: 'Teak platform bed 1.75 × 2.16 m ("Bed 01" by 5th Dimension, CC BY 4.0)', seat: true });
    // owner 2026-11-11: "replace both the bedside tables with this, keep the size same as current table sizes" →
    // "Wooden bedside table" by Manuel López (CC BY 4.0), drawers closed, one per v1 nightstand at that table's exact box
    // (v1 oak legs/carcass + drawer box = 'Light natural timber'; left 0.36 × 0.395, right 0.42 × 0.395, top 0.59).
    // Top stays at the v1 top so the book, vase + branch (left) and bowl + plant (right) still sit on it; drawers face north.
    [['approved-b1-nightstand#0', 'left'], ['approved-b1-nightstand#1', 'right']].forEach(([gid, side]) => {
      const ns = ctx.one(gid); if (!ns) return;
      const nb = new T.Box3(); ns.meshes.filter(m => /Light natural timber/.test(m.material.name)).forEach(m => nb.expandByObject(m));
      if (nb.isEmpty()) return;
      const tm = ctx.lib.model('bedside_table_wood'); if (!tm) return;
      tm.obj.scale.set((nb.max.x - nb.min.x) / tm.size.x, (nb.max.y - FLOOR) / tm.size.y, (nb.max.z - nb.min.z) / tm.size.z);
      tm.obj.position.y = FLOOR;
      // the file paints the bottom drawer front red-brown → same varnished spruce as the other drawers (room palette)
      let varn = null; tm.obj.traverse(m => { if (m.isMesh && /spruce_wood_varnished/.test(m.material.name)) varn = m.material; });
      if (varn) tm.obj.traverse(m => { if (m.isMesh && /Painted_wood/.test(m.material.name)) m.material = varn; });
      // the left group also holds the book on its top (Ivory cotton) → suppress only the table's own timber
      ctx.suppress(ns, /Light natural timber/);
      // back face on the fluted-panel side (v1 max z), drawer front north (ry π = south wall)
      ctx.add('nightstand-' + side, tm, (nb.min.x + nb.max.x) / 2, nb.max.z, Math.PI, { name: 'Bedside table, ' + side + ' ("Wooden bedside table" by Manuel López, CC BY 4.0)', loose: true });
    });
    return { bed: 'bed' };
  },
};
