// Balcony chairs → the owners' wicker armchair model (owner 2026-11-11: "replace all the outdoor chairs with this").
// Model: "Outdoor Chair Scan MEDPOLY" by EFX (Sketchfab, CC BY 4.0 — credit the author), manifest key outdoor_chair_wicker:
// photogrammetry scan of a resin-wicker armchair with grey seat + back cushions on dark metal legs (15.7k tris, not decimated).
// The file is under real size (0.53 W × 0.59 D × 0.60 H m) → each chair is scaled UNIFORMLY to the old chair's footprint.
// Each old chair keeps its place and facing: x / z = centre of the new chair's BACK face (builder frame), ry 0 = front south.
// Old v1 chairs (seat, back, legs, brass arm supports) are hidden completely; nothing else in the balcony changes.
export const CHAIR_KEY = 'outdoor_chair_wicker';
export const CHAIR_CREDIT = '"Outdoor Chair Scan MEDPOLY" by EFX, Sketchfab, CC BY 4.0';
const FLOOR = 0.056;              // balcony tile top (ray-cast, all three balconies)

// chairs: [{ id, old: v1 short group id, x, z, ry, scale, remove }] — remove: true = only hide the old v1 chair (no new chair)
export function chairOption({ room, chairs: all, extraFacts = [] }) {
  const chairs = all.filter(c => !c.remove), n = chairs.length;
  return {
    id: 'option1',
    name: 'Option 1 · Wicker armchair' + (n > 1 ? 's' : '') + ' (owner model)',
    layoutLabel: room + ' design',
    layoutIcon: false,
    summary: 'Same balcony as the original; the ' + (n > 1 ? n + ' outdoor chairs are' : 'outdoor chair is') + ' replaced by the owners’ wicker armchair model (woven resin wicker, grey seat + back cushions, dark metal legs) in the same place, facing the same way.',
    search: ['wicker outdoor armchair balcony', 'rattan balcony chair grey cushion', 'small balcony seating wicker chair'],
    facts: [
      ['Chair', CHAIR_CREDIT + ' (photogrammetry scan); scaled uniformly to the old chair’s footprint'],
      ...chairs.map(c => ['Chair ' + c.id.replace(/^chair-?/, ''), 'scale ×' + c.scale + ' → ' + (0.528 * c.scale).toFixed(2) + ' W × ' + (0.587 * c.scale).toFixed(2) + ' D × ' + (0.598 * c.scale).toFixed(2) + ' H m, seat ≈ ' + (0.30 * c.scale).toFixed(2) + ' m']),
      ...extraFacts,
      ['Removed', 'the old v1 chair' + (all.length > 1 ? 's' : '') + ' (teak legs, linen seat + back, brass arm supports)'],
    ],
    apply(ctx) {
      for (const c of all) {
        const old = ctx.one(c.old);
        if (old) ctx.hide(old);
        if (c.remove) continue;
        const m = ctx.lib.model(CHAIR_KEY);
        if (!m) continue;
        m.obj.scale.setScalar(c.scale);
        m.obj.position.y = FLOOR;
        ctx.add(c.id, m, c.x, c.z, c.ry, { name: 'Wicker armchair (' + CHAIR_CREDIT + ')', seat: true });
      }
      return {};
    },
  };
}
