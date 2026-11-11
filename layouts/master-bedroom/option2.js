// Option 2 — TV on the north wall shared with the living area; bed faces north with a free-standing headboard
// in front of the balcony slider (passage kept behind it).
import { ROOM, clearV1, placeBedSet, clearZones, loungeChair } from './common.js';
import { BED, WAVE, V1_BEDSIDE, styledBed, rug, vase, projectorSet , airCon, BED_SLOT } from './style.js';

export default {
  id: 'option2',
  slots: [BED_SLOT],
  name: 'Option 2 · TV on Hall 1 wall (north)',
  summary: 'Bed faces the north (living-room) wall with a free-standing headboard 0.85 m in front of the balcony slider. Gaming TV wall and a 100″ screen on the north wall; desk + mini-fridge on the bathroom-shared east wall; tall storage between the entry door and the walk-in; two compact lounge chairs against the west wall.',
  facts: [
    ['AC', '1.5 T split high on the west wall above the lounge chairs (top 2.72 m), blowing east across the room, not onto the bed; pipes + drain concealed to the master balcony (≈ 4 m run in the false ceiling)'],
    ['Bed (6 × 7 ft upholstered, mushroom taupe)', 'against a free-standing wave-top oak slat screen (finished both sides, LED edge); ≈ 0.7 m passage to the balcony curtains behind it'],
    ['Styling (same reference as option 1)', 'cream bedding, lavender throw, upright white pillows + sage cushions; cream 2-drawer nightstand + black sconce + vase (west, high side), wall-hung cream drawer unit + cone pendant (east, keeps the desk-chair side clear), chevron rug'],
    ['Bed → west wall / → desk', '≈ 0.55 m / ≈ 0.55 m (desk chair blocks that side while in use)'],
    ['Bed foot → TV console', '≈ 1.42 m'],
    ['Pillow → TV distance / angle', '≈ 3.6 m, centred on the bed (0°)'],
    ['Projector screen', '100″ (2.21 m) cassette in front of the TV wall; projector above the bed, throw ≈ 2.8 m'],
    ['Lounge seating', '2 compact chairs against the west wall in the foot zone, side-on to the screen (≈ 50–60° head turn); chair 2 sits at the mouth of the 0.55 m west bed-side passage'],
    ['Workspace', '0.95 m desk on the bathroom-shared wall; only 0.55 m between desk front and bed'],
    ['Mini-fridge', '≈ 45 L in a 620 mm vented cabinet next to the desk; its door hits the bed at ≈ 60° (0.55 m gap)'],
    ['Storage', '1.05 m tall sliding unit between the door swing and the walk-in, + wall cabinets over the desk'],
    ['Watch-outs', '≈ 3 m² strip behind the headboard is circulation only; bed-side and desk share the same 0.55 m gap'],
  ],
  apply(ctx) {
    const { lib } = ctx;
    clearV1(ctx);
    const v1bed = placeBedSet(ctx, { cx: 1.58, cz: 4.22 - 1.11, rot: 0 });
    ctx.find(V1_BEDSIDE).forEach(ctx.hide);
    // free-standing wave screen behind the bed: two slat faces back to back (north face towards the bed, south face
    // towards the balcony passage), stops before the desk on the east wall
    const SZ = 4.2, x0 = 0.1, x1 = 3.05, L = x1 - x0, xc = (x0 + x1) / 2;
    const front = lib.waveWall({ length: L, profile: WAVE, halo: false });
    ctx.add('headboard-screen', front, xc, SZ, Math.PI, { name: 'Wave slat headboard screen (honey oak + LED edge)', follow: 'bed' });
    ctx.mood(front.moods);
    const back = lib.waveWall({ length: L, profile: WAVE.map(([u, h]) => [1 - u, h]).reverse(), halo: false });
    ctx.add('headboard-screen-back', back, xc, SZ, 0, { name: 'Wave slat screen (balcony side)', follow: 'bed' });
    const BX = 1.58;   // bed centre (the fitted Dreamburst bed is 1.99 m wide, ≈ the built bed's 1.95 m)
    const size = styledBed(ctx, v1bed, BX, SZ - 0.04, Math.PI);
    const bed = 'option2/bed';
    const xW = BX - size.w / 2, xE = BX + size.w / 2;
    ctx.add('nightstand-west', lib.nightstand({ w: 0.45, d: 0.42, h: 0.58 }), xW - 0.03 - 0.225, SZ - 0.04, Math.PI, { name: 'Nightstand (cream, 2 drawers)', loose: true, follow: 'bed' });
    const hung = lib.nightstand({ legs: false, w: 0.4, d: 0.32, h: 0.36 }); hung.obj.position.y = 0.22;
    ctx.add('nightstand-east', hung, xE + 0.03 + 0.2, SZ - 0.04, Math.PI, { name: 'Wall-hung drawer unit on the screen (cream)', follow: 'bed' });
    // seen from the foot of the bed (facing south) the wave is low on the left (east) and high on the right (west), as in
    // the reference: pendant + vase on the low east side, sconce on the slats on the high west side
    ctx.add('pendant', lib.pendant({ drop: 1.3, ceiling: 2.9 }), xE + 0.23, SZ - 0.2, 0, { name: 'Cone pendant', loose: true });
    ctx.add('sconce', lib.wallSconce({ y: 1.25 }), xW - 0.03 - 0.225, SZ - 0.04, Math.PI, { name: 'Wall sconce (black)', loose: true, follow: 'bed' });
    vase(ctx, xW - 0.03 - 0.33, SZ - 0.04, Math.PI, 0.58);   // on the west nightstand: the mini-fridge door swings past the east unit
    rug(ctx, 1.58, SZ - 0.5, Math.PI, 2.4, 2.0);
    clearZones(ctx, [[0, 0.2, 2.75, 0.75], [0, 0.6, 0.85, 2.0], [3.1, 1.18, 3.658, 2.27], [3.1, 3.24, 3.658, 5.067]]);
    // gaming TV wall on the north wall (living-room side), centred on the bed, clear of the entry door
    const tv = lib.tvWall({ width: 2.2, height: 2.9, consoleW: 1.9, tvCentreY: 1.1 });
    ctx.add('tv-wall', tv, 1.58, 0.2, 0, { name: 'Gaming TV wall (65″)' });
    ctx.mood(tv.moods);
    projectorSet(ctx, 1.58, 0.66, 0, 1.58, 3.45, Math.PI);   // lens faces the screen (north)
    airCon(ctx, 0, 1.28, Math.PI / 2);   // west wall above the lounge chairs
    // bathroom-shared east wall: desk + vented mini-fridge + wall cabinets (no tall unit here)
    const work = lib.workWall({ width: 1.6, deskW: 0.95, fridgeW: 0.62, tallW: 0, depth: 0.5 });
    ctx.add('work-wall', work, 3.658, 4.12, -Math.PI / 2, { name: 'Desk & fridge wall' });
    ctx.mood(work.moods);
    ctx.add('desk-chair', lib.deskChair(), 2.95, 3.8, Math.PI / 2, { name: 'Desk chair', seat: true });
    // tall sliding storage between the door swing and the walk-in opening
    const store = lib.workWall({ width: 1.05, deskW: 0, fridgeW: 0, tallW: 1.05, depth: 0.5, wallCab: false });
    ctx.add('tall-storage', store, 3.658, 1.725, -Math.PI / 2, { name: 'Tall sliding storage' });
    // two compact lounge chairs against the west wall in the foot zone, facing east (≈ 50–60° turn to watch)
    loungeChair(ctx, 'lounge-chair-1', 'Rivet Stacey lounge chair (his)', 0.03, 0.92, Math.PI / 2);
    loungeChair(ctx, 'lounge-chair-2', 'Rivet Stacey lounge chair (hers)', 0.03, 1.64, Math.PI / 2);
    return { bed, ignore: '^master-bedroom/(compact|bedside|linen-shade|handloom|woven|master-handloom|master-small)', view: { from: [1.58, 3.95], to: [1.58, 0.27] }, screen: { from: [1.58, 3.95], to: [1.58, 0.66] } };
  },
};
