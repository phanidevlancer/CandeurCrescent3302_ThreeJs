// Shared rules for master-bedroom options.
// Room (three.js metres): x 0 → 3.658 (west → east), z 0.2 → 5.067 (north wall shared with the living area → south/balcony wall).
// Fixed openings: entry door on the north wall x 2.75–3.73 (hinged at x 3.73, sweeps z 0.2–1.18 along the east wall);
// walk-in opening on the east wall z 2.27–3.24; east wall z 3.24–5.067 is shared with the master toilet;
// balcony slider on the south wall x 1.28–3.66.
export const ROOM = { x0: 0, x1: 3.658, z0: 0.2, z1: 5.067, door: { x0: 2.75, x1: 3.73, sweep: 0.98 }, walkIn: [2.27, 3.24], bathWall: [3.24, 5.067], slider: [1.28, 3.66] };
export const BED_SET = /^(master-king|compact-floating|compact-bedside|bedside-brass|linen-shade|master-handloom|handloom-rug|woven-geometric|master-small)/;

// v1 pieces replaced in every v2 option: the north-wall media unit (collections 34–36) and the east-wall clock/sage feature
export function clearV1(ctx) {
  ctx.byCol(['34', '35', '36']).forEach(ctx.hide);
  ctx.hideMovers(/^3[456]-/);   // its two flush electronics doors are separate movers (owner comments #4/#5)
  ctx.find(/^(master-clock|master-sage|master-balcony-side|master-ledge|sculptural|ivory-niche|display-column|one-understated|concealed-laptop)/).forEach(ctx.hide);   // laptop pull-out belonged to the v1 TV console
}
// move the bed with its bedside tables, lamps and rug as one rigid set
export function placeBedSet(ctx, { cx, cz, rot }) {
  const bed = ctx.one('master-king#0'); if (!bed) return null;
  const b = ctx.box(bed), cOld = { x: (b.min.x + b.max.x) / 2, z: (b.min.z + b.max.z) / 2 };
  ctx.rigid(ctx.find(BED_SET), cOld, { x: cx, z: cz }, rot);
  // v1 floor lamps (tall linen shades) would land in walkways once the bed moves: drop them, keep bedside lamps
  for (const g of ctx.find(/^linen-shade/)) { const b = ctx.box(g); if (b.max.y > 1.3 || b.max.x - b.min.x > 0.3 || b.max.z - b.min.z > 0.3) ctx.hide(g); }
  return bed;
}
// keep plants/odd items out of the new furniture zones
export function clearZones(ctx, zones) {
  const keep = new RegExp(BED_SET.source.replace('^(', '^(master-curtain|recessed|warm-downlight|'));
  for (const z of zones) ctx.clearZone(z[0], z[1], z[2], z[3], { keep });
}

// replace the v1 slab bedding (mattress/pillows 'Ivory cotton', duvet 'Muted olive', runner 'Handwoven jute') with soft dressing
export function dressBed(ctx, bed) {
  const old = /^(Ivory cotton|Muted olive green textile|Handwoven jute)$/;
  const lb = ctx.localBox(bed, /^Ivory cotton$/);
  if (lb.isEmpty()) return;
  ctx.suppress(bed, old);
  const w = Math.min(1.83, lb.max.x - lb.min.x), l = 2.0;
  ctx.dress(bed, ctx.lib.bedding({ w, l, top: 0.6 }), (lb.min.x + lb.max.x) / 2, lb.min.z + l / 2);
}

// real product bed (Stone & Beam Rylee acacia king, 2120 × 2170, ABO model) at the v1 bed's new spot; falls back to the dressed v1 bed
export function realBed(ctx, bed, x, z, ry) {
  const m = ctx.lib.model('B07HSL882C');
  if (!m) { dressBed(ctx, bed); return 'master-king#0'; }
  ctx.hide(bed);
  ctx.add('bed', m, x, z, ry, { name: 'Stone & Beam Rylee king bed (acacia)', seat: true });
  return 'OPT/bed';   // caller substitutes its option id
}
// real lounge chair (Rivet Stacey, 700 × 660) or the built fallback
export function loungeChair(ctx, name, label, x, z, ry) {
  const m = ctx.lib.model('B07QFP52NG') || ctx.lib.loungeChair({ w: 0.6, d: 0.66 });
  ctx.add(name, m, x, z, ry, { name: label, seat: true });
}
