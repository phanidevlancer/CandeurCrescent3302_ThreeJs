// Master-bedroom styling shared by every layout option (owner reference 2026-11-10:
// references/master-bedroom/2026-11-10_wave-slat-headboard-wall.png). Layout options decide WHERE things go;
// this file decides WHAT they look like, so every option shows the same complete, premium design.
export const BED = { mattressW: 1.829, mattressL: 2.134, hbH: 1.3 };       // owner: 6 × 7 ft bed only
export const WAVE = [[0, 0.9], [0.08, 0.96], [0.17, 1.12], [0.26, 1.2], [0.35, 1.36], [0.45, 1.66], [0.55, 1.93], [0.65, 2.03], [0.76, 1.95], [0.87, 2.03], [1, 2.1]];
// bed upholstery: warm mushroom taupe (owner: the dusty-mauve 'pink' bed didn't look good); lavender + sage stay as accents
export const PALETTE = { wall: 0xcbb596, bed: 0x8f8378 };
export const V1_BEDSIDE = /^(master-brass|compact-floating|compact-bedside|bedside-brass|master-handloom|handloom-rug|woven-geometric)/;

// owner 2026-11-11: the master bed is switchable in every option (slot 'bed'); default = the owner's Dreamburst model, recoloured
// mushroom taupe (owner rule: no pink bed); 'dreamburst-coral' = as supplied; 'upholstered' = the built tufted bed
export const BED_SLOT = { id: 'bed', label: 'Bed', default: 'dreamburst-taupe', anchor: [1.25, 1.55, 3.0], variants: [
  { id: 'dreamburst-taupe', name: 'Dreamburst tufted wingback · mushroom taupe', summary: 'Owner model "Dreamburst - bed" by Brian Trepanier (Sketchfab, CC BY 4.0 — credit the author): tufted wingback headboard bed with its own bedding, fitted to the 6 × 7 ft mattress; the coral / pink upholstery recoloured to the room’s mushroom taupe (owner rule: no pink bed).', search: ['tufted wingback bed taupe'] },
  { id: 'dreamburst-coral', name: 'Dreamburst tufted wingback · coral (as supplied)', summary: 'The same owner model in its original coral-red upholstery (pinkish in places — shown for comparison).', search: ['coral tufted bed'] },
  { id: 'upholstered', name: 'Upholstered bed · mushroom taupe (built)', summary: 'The earlier built bed: taupe upholstery, square-tufted headboard, draped bedding.', search: ['upholstered king bed taupe'] },
] };
// the bed for the chosen slot; opts = upholsteredBed options (used for the built bed and as the fallback)
export function masterBed(ctx, opts) {
  const v = ctx.slot('bed') || BED_SLOT.default;
  if (v !== 'upholstered') { const b = ctx.lib.dreamburstBed({ finish: v === 'dreamburst-coral' ? 'coral' : 'taupe', mattressW: BED.mattressW, mattressL: BED.mattressL }); if (b) return b; }
  const b = ctx.lib.upholsteredBed(opts); b.label = 'Upholstered bed 6×7 ft (mushroom taupe, tufted headboard)'; return b;
}
// bed at (x, z) = centre of the headboard back, ry as the layout needs; returns { id, size, sides }
export function styledBed(ctx, v1bed, x, z, ry) {
  if (v1bed) ctx.hide(v1bed);
  const b = masterBed(ctx, { mattressW: BED.mattressW, mattressL: BED.mattressL, hbH: BED.hbH, fabricColour: PALETTE.bed });
  ctx.add('bed', b, x, z, ry, { name: b.label, seat: true });
  return b.size;
}
// projector screen + ceiling-lift projector, registered so the room panel shows a Projector button
export function projectorSet(ctx, sx, sz, sry, px, pz, pry, width = 2.21, projOpts = {}) {
  const sc = ctx.lib.projectorScreen({ width });
  ctx.add('projector-screen', sc, sx, sz, sry, { name: `Projector screen ${Math.round(width / 0.0221)}″`, loose: true }); ctx.mood(sc.moods);
  const pj = ctx.lib.projector(projOpts);
  ctx.add('projector', pj, px, pz, pry, { name: 'Ceiling projector on a lift', loose: true }); ctx.mood(pj.moods);
}
// split AC (owner 2026-11-10: always plan the AC): x, z = centre of the back on the wall, ry = wall facing; top ≤ ceiling − 0.15
export function airCon(ctx, x, z, ry, top = 2.72) {
  ctx.add('ac', ctx.lib.splitAC({ top }), x, z, ry, { name: 'Split AC 1.5 T (pipes, drain & power concealed to the balcony)' });
}
export function rug(ctx, x, z, ry, w = 2.7, l = 2.0) {
  const r = ctx.lib.chevronRug({ w, l }); r.obj.position.y = 0.062;   // floor finish top ≈ 60 mm above 0
  ctx.add('rug', r, x, z, ry, { name: `Chevron flat-weave rug (${l} × ${w} m)`, loose: true, follow: 'bed' });
}
export function vase(ctx, x, z, ry, top) {
  const v = ctx.lib.vasePlant({ h: 0.42 }); v.obj.position.y = top;
  ctx.add('vase', v, x, z, ry, { name: 'Terracotta vase with greenery', loose: true, follow: 'bed' });
}
