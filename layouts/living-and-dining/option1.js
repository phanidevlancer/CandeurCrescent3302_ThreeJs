// Living + dining — real products. Room: x 3.838–10.28, z −4.303 (north) … 0 (south).
// Dining stays centred where the original was (table centre x 5.45, z −2.10, long axis north–south).
import { placeProduct } from '../lib/products.js';
import { TV_WALLS, TVWALL_ANCHOR, buildTvWall } from './tvwall.js';
const TX = 5.45, TZ = -2.10, HALF_L = 0.805, HALF_W = 0.405, CH_D = 0.54, TUCK = 0.12;
const SOFAS = [
  { id: 'westcott', name: 'Stone & Beam Westcott (cream)', summary: 'The current family sofa: Stone & Beam Westcott contemporary sofa, haze — 2420 × 970 × 870 (visual stand-in).', search: ['cream contemporary sofa living room'] },
  { id: 'modular-cream', ref: 'references/living-and-dining/2026-11-11_modular-cream-sofa-sketchfab-preview.jpg', name: 'Low modular sofa + chaise (cream)', summary: 'Owner pick (Sketchfab "Modern modular sofa" by DVORA — that model is not downloadable, so this is a built replica of its look): low, deep cream modular sofa — three 0.93 m seat modules with thin rounded back and arm panels, deep seat cushions, thin chrome legs and a 1.51 m chaise on the balcony (east) end (sofa centred 0.34 m west so 0.6 m stays free to the balcony slider; the coffee table moves west in front of the seats), cream + blue cushions and a blue-and-white geometric throw. Proportions follow IKEA SÖDERHAMN (3-seat + chaise, sold in India) — about 2.99 m wide, seats 4 adults + the chaise.', search: ['ikea soderhamn sofa chaise cream', 'low modular sofa cream chaise', 'scandinavian modular sofa living room', 'blue geometric throw blanket'] },
  { id: 'sectional-dailyart', name: 'Plush sectional + chaise (owner model)', summary: 'Owner-supplied "Sofa combination" by DailyArt (Sketchfab, CC BY-NC 4.0 — credit the author, non-commercial use only): only the sofa was extracted. Plush beige sectional on a wood-legged base, 3 seats + chaise, 3.48 × 1.63 m, 0.83 m high. Against the north wall, 8 cm off it (clear of the entry column), from x 6.65 (15 cm clear of the bedroom-passage opening) to 10.13 (15 cm to the glazed east wall for the curtains; owner: keep all seats, move it east), chaise on the east end; the same set’s oak coffee table and grey flat-weave carpet go with it.', search: ['low plush sectional sofa chaise beige', 'floor lounge sofa modular'] },
];
export default {
  id: 'option1',
  slots: [{ id: 'sofa', label: 'Family sofa', default: 'sectional-dailyart', anchor: [8.52, 1.25, -3.7], variants: SOFAS },
    // owner 2026-11-12: defaults = DailyArt sectional + 'current' TV wall (grey microcement + walnut console)
    // owner 2026-11-11: switchable TV wall (south wall) — 'current' + five reference designs (tvwall.js)
    { id: 'tvwall', label: 'TV wall', default: 'current', anchor: TVWALL_ANCHOR, variants: TV_WALLS }],
  name: 'Option 1 · Real products',
  summary: 'Original layout with real catalogue products: a mid-century walnut dining table with six upholstered dining chairs, and a cream contemporary sofa with a solid-wood coffee table in the family area.',
  facts: [
    ['Dining table', 'Rivet mid-century modern oak dining table, walnut finish — 1610 × 810 × 760 (seats 6)'],
    ['Dining chairs (×6)', 'Rivet contemporary welt-trimmed dining chair, juniper — 530 × 540 × 860'],
    ['Family sofa', 'Stone & Beam Westcott contemporary sofa, haze — 2420 × 970 × 870'],
    ['Coffee table', 'Alkove Hayes solid-wood coffee table — 1100 × 600 × 400'],
    ['Clearance', 'chairs tucked 120 mm under the table; ≈ 0.75 m behind the end chairs'],
  ],
  apply(ctx) {
    // every part of the v1 dining set except its light fittings
    ctx.find(/^approved-dining-(?!.*(chandelier|linear|pendant|glow|light|lamp|canopy|jute))/).forEach(ctx.hide);
    ctx.find(/^(four-adult-sofa|adult-sofa|rounded-stone|walnut-coffee|family-seven|family-tailored|family-modular)/).forEach(ctx.hide);
    // v1 sofa's end cushions (+ their woven stripes) floated beside the new sofa — owner comments #2/#3: remove
    ctx.find(/^(handloom-accent|cushion-woven)/).forEach(ctx.hide);
    // owner 2026-11-11: remove the child ottoman cushion
    ctx.find(/^(child-ottoman|dedicated-child)/).forEach(ctx.hide);
    // rest of the v1 recliner sofa that stayed behind: headrest seams floating at 1.07 m, footrest planks on the floor, side control plates
    ctx.find(/^(family-fine|family-closed|family-discreet|family-recessed)/).forEach(ctx.hide);
    placeProduct(ctx, 'B075YMXWZC', 'dining-table', 'Rivet walnut dining table', TX - HALF_W, TZ, Math.PI / 2, { loose: true });   // back face = west long side
    const sideX = HALF_W + CH_D - TUCK, endZ = HALF_L + CH_D - TUCK;
    const chairs = [[TX - sideX, TZ - 0.42, Math.PI / 2], [TX - sideX, TZ + 0.42, Math.PI / 2], [TX + sideX, TZ - 0.42, -Math.PI / 2], [TX + sideX, TZ + 0.42, -Math.PI / 2],
      [TX, TZ - endZ, 0], [TX, TZ + endZ, Math.PI]];
    chairs.forEach(([x, z, r], i) => placeProduct(ctx, 'B07QFRSC92', 'dining-chair-' + (i + 1), 'Rivet dining chair (juniper)', x, z, r, { seat: true }));
    const SEC = ctx.slot('sofa') === 'sectional-dailyart', secM = SEC ? ctx.lib.model('sofa_sectional_dailyart') : null;
    if (secM) { secM.obj.scale.setScalar(0.01); secM.obj.position.y = 0.035; }   // source cm units; living floor finish top = 0.035
    if (secM) ctx.add('family-sofa', secM, 8.39, -4.22, 0, { name: 'Plush sectional + chaise (DailyArt, CC BY-NC 4.0)', seat: true });
    else if (ctx.slot('sofa') === 'modular-cream') { const so = ctx.lib.modularSofa({ seats: 3, chaise: 'right' }); ctx.add('family-sofa', so, 8.18, -4.27, 0, { name: 'Low modular sofa + chaise (cream)', seat: true }); }
    else placeProduct(ctx, 'B07HYY8ZGY', 'family-sofa', 'Stone & Beam Westcott sofa', 8.52, -4.27, 0, { seat: true });
    // the chaise reaches z -2.76 at x 8.67-9.68 → with the modular sofa the coffee table moves west in front of the three seats
    // owner (2026-11-11): with the DailyArt sofa use the same set's coffee table + carpet (CC BY-NC 4.0, non-commercial):
    // table 0.5 m in front of the seats (clear of the chaise, ≈ 0.8 m from the dining chairs); carpet ×0.86 → 3.29 × 1.69 m
    // under the sofa's front legs, west edge just short of the dining chairs; v1 handloom rug + table decor removed
    const ctM = secM ? ctx.lib.model('coffee_table_dailyart') : null, rgM = secM ? ctx.lib.model('rug_dailyart') : null;
    if (ctM) { ctM.obj.scale.setScalar(0.01); ctM.obj.position.y = 0.035; ctx.add('coffee-table', ctM, 8.0, -2.95, 0, { name: 'Oak coffee table with drawer (DailyArt, CC BY-NC 4.0)', loose: true }); }
    if (rgM) { rgM.obj.scale.setScalar(0.0086); rgM.obj.position.y = 0.036; ctx.add('rug', rgM, 8.39, -3.525, 0, { name: 'Grey flat-weave rug 3.29 × 1.69 (DailyArt, CC BY-NC 4.0)', loose: true }); ctx.find(/^(handloom-rug|woven-geometric)/).forEach(ctx.hide); }   // the v1 rug's woven pattern pieces go with it
    if (ctM) ctx.find(/^(art-book|brass-tray|chai-cup)/).forEach(ctx.hide);
    else { const MOD = ctx.slot('sofa') === 'modular-cream'; placeProduct(ctx, 'B07K7NY646', 'coffee-table', 'Alkove Hayes solid-wood coffee table', MOD ? 7.95 : 8.49, MOD ? -2.3 : -2.4, 0, { loose: true });
      // the v1 book / brass tray / chai cup stand on the table: move them with it
      if (MOD) ctx.rigid(ctx.find(/^(art-book|brass-tray|chai-cup)/), { x: 8.49, z: -2.4 }, { x: 7.95, z: -2.3 }, 0); }
    const tw = ctx.slot('tvwall');
    if (tw && tw !== 'current' && TV_WALLS.some(v => v.id === tw)) buildTvWall(ctx, tw);
    return {};
  },
};
