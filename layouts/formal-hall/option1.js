// Formal (drawing) hall — real products. Room: x 0–3.838, z −4.303 (north, TV console wall) … 0 (south wall).
import { placeProduct } from '../lib/products.js';
// switchable main entrance OUTSIDE the flat (owner 2026-11-10: "I meant outside the flat" + "add a corridor to walk and feel the entrance"):
// a walkable building corridor (assumed 1.8 × 7.6 m — confirm) and the foyer design on the outer face of the entrance wall
const ENTRANCE = [
  { id: 'wavy-foyer', ref: 'references/entrance/2026-11-10_wavy-backlit-foyer-wall.png', name: 'Wavy backlit foyer (corridor side)', summary: 'Owner reference (references/entrance/2026-11-10_wavy-backlit-foyer-wall.png), outside the main door: terracotta wall, a wavy textured-white plaster panel with a warm LED edge (high at the door, stepping down), floating grey shoe cabinet with a rounded top and cane doors + cane drawers, long timber bench with a turned leg and grey backrest, engraved geometric terracotta panels, black globe pendant, plants — in a walkable corridor with a black/white striped marble floor, downlights and the lift lobby (corridor size assumed).', search: ['entrance foyer wall design with bench', 'wavy backlit wall panel', 'cane shoe cabinet entryway', 'terracotta foyer wall', 'geometric engraved wall panels', 'floating bench shoe rack foyer'] },
  { id: 'plain', name: 'Plain corridor', summary: 'The corridor outside the main door with a plain wall (no foyer design).', search: ['apartment entrance door decor ideas'] },
];
export default {
  id: 'option1',
  slots: [{ id: 'entrance', label: 'Main entrance (outside)', anchor: [-0.75, 2.5, -2.4], default: 'wavy-foyer', variants: ENTRANCE }],
  name: 'Option 1 · Real products',
  summary: 'Same layout as the original, furnished with real catalogue products (3D models from Amazon Berkeley Objects): an emerald velvet tufted sofa facing the TV wall, a solid-wood coffee table and a pair of tufted wood-frame armchairs.',
  facts: [
    ['Sofa', 'Rivet Brooke mid-century tufted velvet sofa, emerald — 2090 × 870 × 790'],
    ['Armchairs (×2)', 'Stone & Beam Laurel rounded accent chair, sand linen, wood frame — 710 × 760 × 770'],
    ['Coffee table', 'Alkove Hayes solid-wood coffee table — 1100 × 600 × 400'],
    ['Note', 'Stand-ins chosen for look and size; the shopping list (bom.md) still prices the IKEA LANDSKRONA / EKENÄSET / KRAGSTA picks. Tell me if you want the list switched to these.'],
  ],
  apply(ctx) {
    ctx.find(/^(approved-h1-sectional|approved-h1-olive|approved-h1-travertine|approved-h1-fluted|guest-lounge|approved-h1-chaise|approved-h1-cushion)/).forEach(ctx.hide);
    placeProduct(ctx, 'B082VN4F4K', 'sofa', 'Rivet Brooke velvet sofa (emerald)', 1.81, -0.06, Math.PI, { seat: true });
    placeProduct(ctx, 'B07K7NY646', 'coffee-table', 'Alkove Hayes solid-wood coffee table', 1.81, -1.95, 0, { loose: true });
    placeProduct(ctx, 'B075X4N3JH', 'armchair-west', 'Stone & Beam Laurel armchair', 0.08, -1.65, Math.PI / 2, { seat: true });
    // corridor outside the main door (separate parts → thin collision footprints, walkable)
    // owner: 3× wider (9 m) and 3× longer (≈ 22.8 m, centred on the old span), no walls blocking the view
    const cor = ctx.lib.entranceCorridor({ xw: -9.2, xf: -0.2, z0: -14.0, z1: 8.8, walls: false });
    for (const [k, part] of Object.entries(cor)) { ctx.add('corridor-' + k, part, 0, 0, 0, { name: 'Corridor ' + k }); if (part.moods) ctx.mood(part.moods); }
    if (ctx.slot('entrance') === 'wavy-foyer') {
      const fw = ctx.lib.foyerWall({ L: 3.0 }); fw.obj.scale.x = -1;   // mirrored so the cabinet end sits next to the door (north)
      ctx.add('foyer-wall', fw, -0.2, -1.56, -Math.PI / 2, { name: 'Main entrance foyer (corridor side)' }); ctx.mood(fw.moods);
    }
    placeProduct(ctx, 'B075X4N3JH', 'armchair-east', 'Stone & Beam Laurel armchair', 3.6, -1.65, -Math.PI / 2, { seat: true });
    return {};
  },
};
