// Option 1 — TV on the east wall shared with the master toilet; bed headboard on the west wall (as in the floor plan).
import { ROOM, clearV1, placeBedSet, clearZones, loungeChair } from './common.js';
import { PALETTE, projectorSet , airCon, masterBed, BED_SLOT } from './style.js';

// Owner reference (2026-11-10): wave-top oak slat wall with LED halo behind the bed on the west wall, warm beige paint,
// cream two-drawer nightstands on the floor (the v1 wall-hung bedsides hung off the v1 headboard and floated once the
// real bed replaced it), cone pendant on the window side, black sconce on the desk side, terracotta vase with greenery.
// v2 (owner: "doesn't feel the same as the reference"): panel now runs wall to wall (curtain → work wall), fine honey-oak
// slats cut to one smooth curve, dark gaps, bright LED edge + strong halo, deeper tan wall, and the reference's bed:
// upholstered dusty-mauve king with a tall square-tufted headboard, cream bedding, lavender throw, sage cushions.
const WALL = { zS: 4.93, zN: 0.78 };            // curtain at the south … side of the work-wall joinery at the north
const BED = { z: 3.45, mattressW: 1.829, mattressL: 2.134, hbH: 1.3 };   // owner: 6×7 ft bed only
function headboardWall(ctx) {
  const { lib } = ctx;
  ctx.find(/^(master-brass|compact-floating|compact-bedside|bedside-brass)/).forEach(ctx.hide);
  const L = WALL.zS - WALL.zN, zc = (WALL.zS + WALL.zN) / 2;
  // wave in wall coordinates (u = 0 at the window end): low beside the window, gentle hump, rises behind the headboard,
  // high plateau over the desk-side bedside, as in the reference
  const profile = [[0, 0.9], [0.08, 0.96], [0.17, 1.12], [0.26, 1.2], [0.35, 1.36], [0.45, 1.66], [0.55, 1.93], [0.65, 2.03], [0.76, 1.95], [0.87, 2.03], [1, 2.1]];
  const wave = lib.waveWall({ length: L, profile, paint: { from: -(4.94 - zc), to: zc - 0.77, h: 2.88, colour: 0xcbb596 }, cove: { from: -(4.94 - zc), to: zc - 0.77, y: 2.88 } });
  ctx.add('headboard-wall', wave, 0, zc, Math.PI / 2, { name: 'Wave slat headboard wall (honey oak + LED)' });
  ctx.mood(wave.moods);
  return wave;
}
function bedAndBedside(ctx, v1bed) {
  const { lib } = ctx;
  if (v1bed) ctx.hide(v1bed);
  const b = masterBed(ctx, { mattressW: BED.mattressW, mattressL: BED.mattressL, hbH: BED.hbH, fabricColour: PALETTE.bed });
  ctx.add('bed', b, 0.045, BED.z, Math.PI / 2, { name: b.label, seat: true });
  const zN = BED.z - b.size.w / 2, zS = BED.z + b.size.w / 2;          // bed sides
  const nN = { w: Math.min(0.5, zN - 0.03 - 1.3), d: 0.42, h: 0.58 }, nS = { w: Math.min(0.5, 4.93 - zS - 0.03), d: 0.42, h: 0.58 };
  ctx.add('nightstand-north', lib.nightstand(nN), 0.045, zN - 0.03 - nN.w / 2, Math.PI / 2, { name: 'Nightstand (cream, 2 drawers)', loose: true, follow: 'bed' });
  ctx.add('nightstand-south', lib.nightstand(nS), 0.045, zS + 0.03 + nS.w / 2, Math.PI / 2, { name: 'Nightstand (cream, 2 drawers)', loose: true, follow: 'bed' });
  ctx.add('pendant', lib.pendant({ drop: 1.3, ceiling: 2.9 }), 0.27, zS + 0.03 + nS.w / 2, 0, { name: 'Cone pendant', loose: true });
  ctx.add('sconce', lib.wallSconce({ y: 1.25 }), 0.045, zN - 0.03 - nN.w / 2, Math.PI / 2, { name: 'Wall sconce (black)', loose: true, follow: 'bed' });
  // chevron flat-weave rug under the lower two-thirds of the bed (replaces the v1 handloom rug)
  ctx.find(/^(master-handloom|handloom-rug|woven-geometric)/).forEach(ctx.hide);
  const rug = lib.chevronRug({ w: 2.7, l: 2.0 }); rug.obj.position.y = 0.062;   // floor finish top is ≈ 60 mm above 0
  ctx.add('rug', rug, 0.85, BED.z, Math.PI / 2, { name: 'Chevron flat-weave rug (2.0 × 2.7 m)', loose: true, follow: 'bed' });
  const vase = lib.vasePlant({ h: 0.42 }); vase.obj.position.y = nS.h;
  ctx.add('vase', vase, 0.045, zS + 0.03 + nS.w / 2 + 0.08, Math.PI / 2, { name: 'Terracotta vase with greenery', loose: true, follow: 'bed' });
}
export default {
  id: 'option1',
  slots: [BED_SLOT],
  ref: 'references/master-bedroom/2026-11-10_wave-slat-headboard-wall.png',
  name: 'Option 1 · TV on toilet-shared wall (east)',
  summary: 'Bed headboard on the west wall as drawn in the floor plan, facing a gaming TV wall on the bathroom-shared east wall (flush smoked-walnut veneer, no fluting). The north side becomes a lounge + work zone: desk, concealed vented mini-fridge, wall cabinets and loft along the north wall, and two compact lounge chairs facing the screen.',
  facts: [
    ['AC', '1.5 T split high on the west wall at the window end (top 2.72 m), louvre set towards the foot of the bed — not onto the pillows, clear of the projector lift; pipes + drain concealed to the outdoor unit on the master balcony (≈ 1.5 m run)'],
    ['Bed (6 × 7 ft: mattress 1829 × 2134; frame 1.95 × 2.29, headboard 1.3 m)', 'mushroom-taupe, square-tufted headboard on the west wall, centred 3.45 m from the north wall; cream bedding, lavender throw, upright white pillows, sage cushions (owner reference)'],
    ['Rug', 'cream/beige chevron flat-weave, 2.0 × 2.7 m under the lower two-thirds of the bed'],
    ['Not used from the reference', 'foot-of-bed bench: with a 7 ft bed only ≈ 0.9 m is left to the TV console — a bench would block the walkway'],
    ['Headboard wall', 'wall-to-wall wave-top honey-oak slats (22 mm slats, 34 mm pitch, tops cut to the curve) on a dark backing, 0.9 → 2.1 m high, warm LED edge + wall halo; rest of the wall warm tan; cream 2-drawer nightstands, cone pendant, black sconce'],
    ['Bed → south wall (balcony side)', '≈ 0.59 m'],
    ['Bed foot → TV console', '≈ 0.9 m'],
    ['Pillow → TV', 'TV 0.7 m right of the bed axis (≈ 13°)'],
    ['Projector screen', '100″ (2.21 m) ceiling cassette in front of the TV wall, centred on the bed; covers the hidden walk-in door only while lowered'],
    ['Projector throw', 'ceiling above the headboard → ≈ 2.8 m (throw ratio ≈ 1.27)'],
    ['Lounge seating', '2 Rivet Stacey lounge chairs (700 × 660) side by side north of the bed, facing the screen (≈ 27° head turn); ≈ 0.95 m chairs → bed, ≈ 0.6 m entry path east of them'],
    ['Workspace', '1.0 m desk with drawer, task light; desk chair tucks in'],
    ['Mini-fridge', '≈ 45 L, in a 620 mm vented cabinet (top + plinth slots, 50 mm rear gap)'],
    ['Storage', '1.6 m of wall cabinets, 2.7 m loft, 2 console drawers; recommend a hydraulic storage king bed (the walk-in holds clothes)'],
    ['Watch-outs', 'TV wall is a 100 mm partition shared with the toilet: wall-mount needs a ply backing frame / proper anchors, and the plumber must confirm no concealed pipes before drilling'],
  ],
  apply(ctx) {
    const { lib } = ctx;
    clearV1(ctx);
    const v1bed = placeBedSet(ctx, { cx: 0.03 + 1.11, cz: 3.45, rot: -Math.PI / 2 });
    headboardWall(ctx);
    bedAndBedside(ctx, v1bed);                 // bed back = front of the slat panel (45 mm off the wall)
    const bed = 'option1/bed';
    clearZones(ctx, [[0, 0.2, 2.75, 2.35], [3.1, ROOM.bathWall[0], 3.658, 5.067], [2.3, 4.5, 3.658, 5.067], [0.4, 4.45, 2.3, 5.067]]);
    // gaming TV wall on the bathroom-shared east wall, facing west
    // owner comment #6 (too much fluting): the whole east wall is now flush smoked-walnut veneer — TV wall panels match the
    // concealed walk-in door, and the v1 light-timber fluted strip north of the walk-in is removed (its flat veneer stays)
    ctx.find(/^walk-in-fixed/).forEach(ctx.hide);
    const tv = lib.tvWall({ width: 1.78, height: 2.9, consoleW: 1.5, tvCentreY: 1.08, finish: 'flush' });
    ctx.add('tv-wall', tv, 3.658, 4.153, -Math.PI / 2, { name: 'Gaming TV wall (65″)' });
    ctx.mood(tv.moods);
    // roll-down 100″ screen in front of the TV wall, centred on the bed; projector on the ceiling above the headboard
    projectorSet(ctx, 3.2, 3.45, -Math.PI / 2, 0.42, 3.45, Math.PI / 2);
    airCon(ctx, 0, 4.2, Math.PI / 2);   // west wall, window end above the south bedside: clear of the projector lift (x 0.42, z 3.45)   // projector lens faces the screen (east)
    // north wall: desk + vented mini-fridge + wall cabinets, full-width loft over it all (stops before the entry door)
    const work = lib.workWall({ width: 2.72, deskW: 1.0, fridgeW: 0.62, tallW: 0, depth: 0.55, loft: true, cornerLeft: true });   // wave wall runs into this corner
    ctx.add('work-wall', work, 1.36, 0.2, 0, { name: 'Work, fridge & loft wall' });
    ctx.mood(work.moods);
    ctx.add('desk-chair', lib.deskChair(), 0.5, 1.22, Math.PI, { name: 'Desk chair', seat: true });
    // two compact lounge chairs side by side, east of the fridge door swing and west of the entry path
    loungeChair(ctx, 'lounge-chair-1', 'Rivet Stacey lounge chair (his)', 1.99, 0.8, 0);
    // 'hers' sits 0.4 m further south: at z 0.8 the entry door (hinge x 3.73, 0.975 m leaf) hit it half-way through its swing
    loungeChair(ctx, 'lounge-chair-2', 'Rivet Stacey lounge chair (hers)', 2.71, 1.2, 0);
    ctx.add('side-table', lib.sideTable({ dia: 0.36, h: 0.48 }), 2.0, 1.55, 0, { name: 'Side table', loose: true });
    return { bed, ignore: '^master-bedroom/(compact|bedside|linen-shade|handloom|woven|master-handloom|master-small)', view: { from: [0.55, 3.45], to: [3.62, 4.153] }, screen: { from: [0.55, 3.45], to: [3.2, 3.45] } };
  },
};
