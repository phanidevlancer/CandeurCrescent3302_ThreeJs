// Kitchen — owner comment #7: remove the wash niche next to the fridge and use a double-door (side-by-side) fridge.
// Room: x 6.885 (west wall) … 10.28, z 1.572 … 5.067; the wash niche sat in a recess north of it (z ≈ 1.17–1.77).
// The fridge stands on the west wall with its south side next to the west counter (counter starts z 2.65).
// Owner 2026-11-11: switchable kitchen designs on both counters (slot 'design'); the side-by-side fridge stays in every design.
// Site: east counter = hob under the 1.5 m window (z 2.0–3.5, sill at worktop height, head 2.28) + sink to the south;
// west counter = prep run z 2.65–5.06; ceiling 3.05 (fascia near the east wall from 2.93).
const FR = { w: 0.912, h: 1.78, d: 0.716 };
const DESIGNS = [
  { id: 'teak-blue', ref: 'references/kitchen/2026-11-11_teak-raised-panel-blue-octagon-tile-kitchen.png', name: 'Teak raised panel + blue octagon tile',
    summary: 'Owner reference, on both counters: honey-teak raised-panel base cabinets and drawer stacks with bronze + white ceramic pulls, a two-tier upper run (raised-panel doors below, glass-mullion doors on top with lit crockery shelves, also over the window), a cabinet bridge over the side-by-side fridge with a tall end panel, blue octagon tiles with brown flower dots as the splashback, white quartz worktops, a stainless chimney hood above the window, under-cabinet lights, a cream cone pendant over the aisle and a beige marble floor. Not added: the corner unit and tall pantry (your kitchen is two straight runs; the fridge takes the tall-unit place) and the ceiling fan.',
    search: ['teak kitchen cabinets raised panel', 'blue octagon tile kitchen backsplash', 'glass upper cabinets wooden kitchen india', 'parallel kitchen teak white quartz', 'ceramic handle kitchen cabinet'] },
  { id: 'cashmere-sage', ref: 'references/kitchen/2026-11-11_cashmere-gloss-sage-subway-kitchen.png', name: 'Cashmere gloss + sage subway tile',
    summary: 'Owner reference (Buildon Studio render), on both counters: cashmere matt handle-less base cabinets and drawers with black gola lines, gloss cashmere upper doors up to the ceiling line, oak open boxes with LED and jars on the prep side, black-framed glass boxes with lit cups and bowls, an oak open end column with plants beside the sink, sage-green subway tiles, grey terrazzo worktops, a white slim hood with a gloss cabinet above it over the window, under-cabinet and toe-kick LED, plants, knife block, oil bottles and boards, and a beige marble floor. Not added: the window blind (the window sits over the hob, so a blind is a fire risk).',
    search: ['cashmere kitchen cabinets gloss', 'sage green subway tile kitchen', 'handleless kitchen gola profile black', 'kitchen open oak shelves led', 'black frame glass kitchen cabinet'] },
  { id: 'sage-walnut', ref: 'references/kitchen/2026-11-11_sage-walnut-fluted-glass-kitchen.png', name: 'Sage + walnut · fluted panel + glass',
    summary: 'Owner reference (Image #53), adapted to the two platforms: sage matt handle-less base and wall cabinets with black gola lines and toe-kick light, tall black-framed glass cabinets with lit shelves on the sink side, walnut open niche with plants, cream vertical-fluted splash panel (continuous line on every wall at the counters), white speckled quartz worktops, the owner black glass chimney (A) or pier fan (B), black tap on the granite sink, a vertical walnut slat panel on the fridge bay end, two brass geometric cage pendants over the aisle and a beige runner rug. Not applied: the breakfast peninsula with bar stools (it would block the 2.1 m aisle and the utility passage — owner rule).',
    search: ['sage green kitchen walnut slats', 'fluted backsplash panel kitchen', 'black frame glass kitchen cabinets led', 'geometric brass pendant kitchen', 'sage handleless kitchen india'] },
  { id: 'oak-sage', ref: 'references/kitchen/2026-11-11_sage-oak-two-tone-kitchen.png', name: 'Sage + light oak two-tone',
    summary: 'Owner reference (Image #59), adapted to the two platforms: light-oak base doors with sage drawer stacks and black bar handles, sage wall cabinets with a black-framed glass top tier (lit), oak open corner shelves with plants and an oak niche over the fridge, cream quartz worktops, cream stone splash panel as the continuous line on every wall square, black plinth, under-cabinet light, two black dome pendants with brass collars, the owner chimney (A) or pier fan (B). Not applied: the breakfast peninsula with bar stools (would block the aisle and the utility passage — owner rule).',
    search: ['sage green and wood kitchen', 'two tone kitchen sage oak', 'black handles sage kitchen cabinets', 'black dome pendant kitchen', 'cream quartz backsplash kitchen'] },
  { id: 'terracotta-walnut', ref: 'references/kitchen/2026-11-11_terracotta-walnut-reeded-kitchen.png', name: 'Terracotta + walnut, reeded glass',
    summary: 'Owner reference (Image #60, Copper Trunk), adapted to the two platforms: terracotta matt handle-less base cabinets with black grip lines and black plinth, greige wall cabinets up to the ceiling line, walnut-framed reeded-glass boxes and walnut open shelves (lit), walnut open corners, sage-grey honed stone splash as the continuous line, white quartz worktops, leaf-pattern cement tile floor, dark vase with dried stems, the owner chimney (A) or pier fan (B). Not applied: the tall reeded-glass crockery unit (the fridge bay takes that wall position).',
    search: ['terracotta kitchen cabinets', 'reeded glass walnut kitchen cabinet', 'green stone backsplash kitchen', 'cement tile floor kitchen leaf pattern', 'handleless terracotta kitchen india'] },
];
const CHIMNEY = [
  { id: 'with', name: 'Version A · with chimney',
    summary: 'Chimney hood 0.71 m above the hob (canopy bottom 1.72 m), centred on the hob in front of the upper part of the window. It is not fixed to the glass: the hood back hangs on a powder-coated steel flat bolted into the piers either side of the window, the chimney cover is fixed to the lintel, and the duct runs up inside the cover, north inside the existing ceiling bulkhead and out through the masonry pier beside the window (≈ 1 m run, 2 bends). Covers ≈ 15 % of the glass seen face-on (chimney stem 0.15 m² + canopy edge 0.07 m² + steel flat 0.06 m² of 1.92 m²); the lower window and both sashes stay usable. Two narrow cabinets flank the chimney above the window head.',
    search: ['kitchen chimney in front of window', 'kitchen hood window installation india'] },
  { id: 'without', name: 'Version B · without chimney',
    summary: 'No hood: the 1.5 m window stays completely clear. Ventilation = a 230 mm (9″) exhaust fan cored through the masonry pier just north of the window (1.9–2.2 m, ≈ 0.35 m from the hob), framed in the splashback tile, plus the openable window and cross-air through the utility door. Cabinets above the window head continue the upper line.',
    search: ['kitchen exhaust fan wall tiles', 'kitchen without chimney window ventilation'] },
];
const FRIDGE = [
  { id: 'side-by-side', name: 'Double-door (side-by-side) fridge', summary: 'The future fridge: side-by-side 912 × 1780 × 716 (≈ 650 L class) in the reserved bay.', search: ['side by side fridge kitchen cabinet'] },
  { id: 'single-now', name: 'Current single-door fridge + removable larder', summary: 'Today: the owners\u2019 single-door fridge (provisional 600 × 1600 × 680 — measure it) at the counter end of the bay, and a 300 mm pull-out larder on castors in the rest, finished like the kitchen. On the upgrade the larder rolls out and the side-by-side slides in — no carpentry.', search: ['single door fridge kitchen cabinet filler pull out'] },
];
export default {
  id: 'option1',
  ref: 'references/kitchen/2026-11-10_sage-shaker-kitchen.png',
  name: 'Option 1 · Double-door fridge',
  summary: 'Kitchen with the small wash niche next to the fridge removed and the single-door fridge replaced by a side-by-side double-door refrigerator against the west wall. Kitchen design (both counters) is switchable with the ⇄ icon over the aisle.',
  facts: [
    ['Refrigerator', 'side-by-side double door, ≈ 650 L class — 912 × 1780 × 716 (e.g. Samsung / LG / Haier side-by-side; confirm exact model size before the carpenter closes the niche)'],
    ['Removed', 'wash niche cabinet, its quartz top, basin and tap (the recess becomes open floor / space for the freezer door to swing)'],
    ['Clearance', 'fridge ↔ west counter ≈ 50 mm; leave ≥ 50 mm behind and 25 mm above for ventilation; aisle between counters ≈ 2.1 m'],
    ['Plumbing', 'niche basin water + drain points must be capped (or reused as the fridge water line)'],
  ],
  search: ['parallel kitchen design india'],
  slots: [{ id: 'design', label: 'Kitchen design', default: 'teak-blue', anchor: [8.58, 2.75, 4.1], variants: DESIGNS },
    { id: 'chimney', label: 'Chimney (A / B)', default: 'with', anchor: [9.75, 2.15, 2.75], variants: CHIMNEY },
    { id: 'fridge', label: 'Fridge bay', default: 'side-by-side', anchor: [7.6, 2.6, 2.1], variants: FRIDGE }],
  apply(ctx) {
    ctx.find(/^(tall-refrigerator|fridge-horizontal|fridge-vertical|kitchen-north|niche-)/).forEach(ctx.hide);
    // fridge bay (owner rule 2026-11-11): reserved for a double-door; clear 0.98 m wide (z 1.67–2.65) × 1.84 m above the finished floor
    // under the bridge cabinet × 0.6 m + the fridge's own depth in front; today's single-door fridge + a removable pull-out larder fill it
    const zSouth = 2.60;   // 50 mm off the counter so the freezer door clears it
    const d0 = ctx.slot('design'), d = ['teak-blue', 'cashmere-sage', 'sage-walnut', 'oak-sage', 'terracotta-walnut'].includes(d0) ? d0 : 'teak-blue';   // 'original' removed (owner 2026-11-11)
    // owner-supplied hob model 2026-11-11: "Gas Stove No.1" by lutz_westerfeld (Sketchfab, CC BY 4.0 — credit the author).
    // The file is ≈ 1.6× real size (1.22 × 0.88 m) → scaled uniformly to a 750 × 545 mm built-in 4-burner glass hob, centred under
    // the window on the hob axis (z 2.655), 40 mm off the wall, knobs on the sink side; replaces the v1 hob, burners, pot and pan.
    { const st = ctx.lib.model('gas_stove_no1');
      if (st) { const k = 0.75 / st.size.x; st.obj.scale.setScalar(k); st.obj.position.y = 0.97;
        ctx.find(/^(four-burner|gas-burner|everyday-cooking|pan-handle)/).forEach(ctx.hide);
        ctx.add('hob', st, 10.28 - 0.04, 2.655, -Math.PI / 2, { name: 'Gas hob 750 × 545 (Gas Stove No.1 by lutz_westerfeld, CC BY 4.0)', loose: true }); } }
    // owner microwave (2026-11-11): "HAIVEN Microwave" by strakacher21 (Sketchfab, CC BY 4.0 — credit the author), real size
    // 523 × 312 × 456; on the west (prep) platform near the fridge end (z 2.72–3.24), back 50 mm off the wall, door to the aisle
    { const t = ctx.lib.model('haiven_microwave'); if (t) { t.obj.position.y = 0.97; ctx.add('microwave', t, 6.885 + 0.05, 4.72, Math.PI / 2, { name: 'Microwave 523 × 312 (HAIVEN by strakacher21, CC BY 4.0)', loose: true }); } }
    // owner mixer grinder (2026-11-11): "Mixer grinder machine from India" by ASHISH / 3dmodelsmith (Sketchfab, CC BY 4.0), re-assembled
    // (jar on the base, two jars beside it) on the west platform between the pantry jars and the chopping board (z ≈ 3.9–4.45);
    // the three v1 brass-lidded pantry jars shift 0.42 m south to make room
    { const t = ctx.lib.mixerGrinder(); if (t) { t.obj.position.y = 0.97;
        ctx.add('mixer-grinder', t, 6.885 + 0.05, 4.11, Math.PI / 2, { name: 'Mixer grinder (ASHISH / 3dmodelsmith, CC BY 4.0)', loose: true }); } }
    // west platform zoning (owner 2026-11-11: "not organised well"), south corner → fridge, everything on one back line:
    // appliance zone (microwave 8 cm off the corner, mixer grinder, each on its own switch plate) · prep zone (board centred,
    // knife block / bowl at the back) · fridge landing zone (front kept clear; the three pantry jars in a row against the wall)
    ctx.rigid(ctx.find(/^(indian-pantry|pantry-jar)/), { x: 7.21, z: 4.33 }, { x: 7.005, z: 2.95 }, 0);
    ctx.rigid(ctx.find(/^teak-chopping/), { x: 7.265, z: 3.485 }, { x: 7.265, z: 3.44 }, 0);
    if (ctx.slot('fridge') === 'single-now') {
      ctx.add('fridge', ctx.lib.fridgeSingleDoor({ w: 0.6, h: 1.6, d: 0.68 }), 6.9, zSouth - 0.3, Math.PI / 2, { name: 'Current single-door refrigerator (provisional 600 × 1600)', loose: true });
      ctx.add('larder', ctx.lib.larderPullout({ w: 0.3, h: 1.78, d: 0.6, style: d }), 6.885, 1.83, Math.PI / 2, { name: 'Pull-out larder on castors (removable for the double-door fridge)', loose: true });
    } else {   // owner model (2026-11-11, jerovdl zip): one static mesh, fitted to 912 × 1780 × 716; the built fridge stays as fallback
      const fm = ctx.lib.model('fridge_sbs');
      if (fm) { fm.obj.scale.set(FR.w / fm.size.x, FR.h / fm.size.y, FR.d / fm.size.z); ctx.add('fridge', fm, 6.9, zSouth - FR.w / 2, Math.PI / 2, { name: 'Side-by-side refrigerator 912 × 1780 (owner model)', loose: true }); }
      else ctx.add('fridge', ctx.lib.fridgeSideBySide(FR), 6.9, zSouth - FR.w / 2, Math.PI / 2, { name: 'Side-by-side refrigerator (912 × 1780)', loose: true });
    }
    {
      // v1 cabinets, tops, tiles, uppers + their contents, hood/riser; the hob, sink, mixer, pots and pantry jars stay
      ctx.find(/^(kitchen-steel|kitchen-inset|kitchen-mixer|east-durable|kitchen-east|kitchen-brass|kitchen-internal|kitchen-reed|kitchen-upper|kitchen-overhead|kitchen-west|kitchen-ivory|kitchen-sage|preparation-backsplash|west-preparation|under-cabinet|kitchen-high|kitchen-concealed)/).forEach(ctx.hide);
      ctx.hideMovers(/^20-(overhead-warm-ivory|kitchen-east-lower|kitchen-west-sage)/);   // v1 upper doors span two groups → not hidden with them
      const { parts, moods } = ctx.lib.kitchenStyled({ style: d, chimney: ctx.slot('chimney') });
      for (const [k, p] of Object.entries(parts)) ctx.add('kitchen-' + k, { obj: p.obj }, p.x, p.z, p.ry, { name: p.label });
      ctx.mood(moods);
    }
    return {};
  },
};
