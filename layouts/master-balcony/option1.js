// Master balcony · Option 1 — owner 2026-11-11.
// (a) the two outdoor chairs → the owners' wicker armchair model (balcony-chairs.js); BOTH REMOVED by the owner 2026-11-11 (west-wall feature). Old chairs (outward-movable#0 / #1):
//     x 0.045–0.595 and 0.65–1.20, backs against the bedroom wall (fluted timber panel front z 5.31), facing south. Only 1.27 m
//     of solid wall lies west of the slider frame (x 1.27) → ×1.15 (0.61 m wide each); a 1 cm gap between them.
// (b) owner: "use only the seating with the cushion without the backrest … start from the pipe enclosure, use it as the back
//     rest, continue till the east wall; at the end of the enclosure extend the depth to touch the north (bathroom) wall; L shape
//     to touch the south (railing) side". Model 'balcony_bench_seat' = the backless seat of draakon_4d's bench (CC BY 4.0):
//     2.398 W × 0.591 D, cushion top 0.548 in the file → lowered to a 0.45 m sitting height (planks only, ×0.82 vertical).
//     Measured (viewer ray-casts 2026-11-11): bathroom wall face z 5.267; enclosure front z 5.572 (x 3.68 → 6.0398);
//     east wall (utility divider) face x 6.825; railing base rail face z 7.167; balcony floor 0.056; toilet ventilator
//     x 6.052–6.798, sill 1.85 (glass from 1.872) — far above the seat.
//     Pieces (each = one model module, scaled only along its length, depth kept 0.591 except the deep filler):
//       north  x 3.68 → 6.234, back on the enclosure (z 5.572), front z 6.163   (2.554 long, ×1.065)
//       east   z 5.267 → 7.167 along the east wall (back x 6.825), front x 6.234 (1.900 long, ×0.792)
//       filler x 6.0398 → 6.234 × z 5.267 → 5.572: the deep part beyond the enclosure end, back to the bathroom wall
// (c) owner: "make the west and east walls of the master bedroom balcony touch the ceiling" — the west return is a 1.10 m
//     plaster parapet (x −0.16…0) and the east utility divider a 1.40 m one (x 6.825…6.905), both z 5.267 → 7.327; the balcony
//     slab is 3.11 (underside) → 3.20 (top). Each is continued in the same '01 Warm ivory lime plaster' from 2 mm inside its
//     top up to the slab top, same thickness and length (tagged 'arch' so room-view cutaway / clearances treat it as wall).
// The old outward four-seat bench set (site.js BUNDLE: bench, back, cushions, toe LED, tea table + tray + glass) is removed.
import { chairOption } from '../balcony-chairs.js';
import { BUNDLES } from '../site.js';
import { buildCosy, COSY_REF } from './cosy.js';
import { buildWestWall, WEST_REF, WW } from './westwall.js';

// ⇄ East wall (owner 2026-11-11, reference references/master-balcony/2026-11-11_east-wall-cosy-teal.png: "design the east
// balcony wall this way"): 'plain' = the L-seat as first built (owners' model modules, green quilted cushion);
// 'cosy-teal' (default) = the reference's whole look on the same L-seat footprint (see cosy.js).
const EAST_WALL = [
  { id: 'cosy-teal', ref: COSY_REF, name: 'Cosy teal corner · oak bench, wall grid + art, string lights, plants',
    summary: 'The L-seat on a light-oak plank storage base with cream cushions, teal velvet + block-print back cushions; on the east wall a black wire grid with a hanging pothos, an oak-framed leaf print and a floating oak shelf (plant + candle lantern); festoon string lights across the east wall and along the railing; jute rug in front of the seat corner; railing planter (no floor plants or floor candles — owner 2026-11-11).',
    search: ['small balcony bench teal cushions string lights', 'balcony wall grid planter framed leaf print', 'cosy balcony jute rug lanterns plants', 'balcony storage bench light oak cream cushion'] },
  { id: 'plain', name: 'Plain L-seat (as first built)',
    summary: 'The owners\u2019 backless bench-seat model as the L-seat (timber plank box, green quilted cushion); bare east wall.',
    search: ['balcony L shaped built in bench cushion', 'backless banquette balcony wooden'] },
];

// ⇄ West wall (owner 2026-11-11, reference references/master-balcony/2026-11-11_west-wall-arch-niche.png: "design this on the
// west wall of the master bed room balcony"): 'arch-niche' (default, westwall.js) | 'plain' (bare lime-plaster wall as before).
const WEST_WALL = [
  { id: 'arch-niche', ref: WEST_REF, name: 'Walnut slats + backlit arch niche · shelves, marble console, fern planter',
    summary: 'Floor-to-ceiling vertical walnut slats across the whole west wall with a centred round-top arch niche (0.80 × 2.20 m) in rough trowelled sand plaster, warm LED along the arch edge; three floating walnut shelves with LED under each (white donut + bottle vases, pothos trailing down, small ferns, framed fern prints, reed diffusers, books); a floating 3-drawer walnut console with a white marble top and under-glow; below it a long cream curved-corner planter of ferns in white pebbles with an LED floor cove; two recessed downlights over the wall.',
    search: ['walnut slat wall arch niche backlit shelves', 'arched niche textured plaster LED floating shelves', 'balcony feature wall wooden slats arch planter', 'floating console marble top arch niche wall', 'fern planter box LED cove wall'] },
  { id: 'plain', name: 'Plain lime-plaster wall (as before)',
    summary: 'The west wall left as the warm ivory lime-plaster parapet raised to the ceiling; nothing on it.',
    search: ['minimal balcony wall lime plaster'] },
];

const SEAT_KEY = 'balcony_bench_seat';
const SEAT_CREDIT = '"Furniture outdoor and coffee table" by draakon_4d, Sketchfab, CC BY 4.0';
const FLOOR = 0.056, SEAT_H = 0.45, FILE_W = 2.398, FILE_D = 0.591, FILE_H = 0.548, KY = SEAT_H / FILE_H;
const WALL_N = 5.267, ENC_FRONT = 5.267 + 0.305, ENC_X0 = 3.68, ENC_X1 = 6.0525 - 0.0127, WALL_E = 6.825, RAIL = 7.167;
const FRONT_N = ENC_FRONT + FILE_D, FRONT_E = WALL_E - FILE_D;
const SLAB_TOP = 3.20;
const PARAPETS = [
  { id: 'west-wall-to-ceiling', name: 'West balcony wall raised to the ceiling (lime plaster)', x0: -0.16, x1: 0, top: 1.10 },
  { id: 'east-wall-to-ceiling', name: 'East balcony wall (utility divider) raised to the ceiling (lime plaster)', x0: 6.825, x1: 6.905, top: 1.40 },
];
const WALL_Z0 = 5.267, WALL_Z1 = 7.327;

const base = chairOption({
  room: 'Master balcony',
  chairs: [
    // owner 2026-11-11: "also remove both the chairs from the master bed room balcony towards the west wall" → no armchairs
    // here any more; their v1 originals stay hidden (the west-wall arch niche + console + planter take the west end)
    { id: 'chair-1', old: 'outward-movable#0', x: 0.345, z: 5.315, ry: 0, scale: 1.15, remove: true },
    { id: 'chair-2', old: 'outward-movable#1', x: 0.962, z: 5.315, ry: 0, scale: 1.15, remove: true },
  ],
  extraFacts: [['Armchairs', 'both wicker armchairs removed (owner 2026-11-11); the west end now holds the west-wall feature']],
});

// one model module: length L along its local x, depth D (model depth stretched only for the filler), cushion top 0.45
function seatModule(ctx, L, D = FILE_D) {
  const m = ctx.lib.model(SEAT_KEY); if (!m) return null;
  m.obj.scale.set(L / FILE_W, KY, D / FILE_D);
  m.obj.position.y = FLOOR;
  return m;
}

export default {
  ...base,
  slots: [
    { id: 'eastwall', label: 'East wall', default: 'cosy-teal', anchor: [6.6, 2.3, 6.22], variants: EAST_WALL },
    { id: 'westwall', label: 'West wall', default: 'arch-niche', anchor: [0.3, 2.78, WW.ZC], variants: WEST_WALL },
  ],
  name: 'Option 1 · L-seat on the enclosure (owner)',
  summary: 'Backless cushioned L-seat (owners’ model) built along the drain-pipe enclosure, which is its backrest, running to the east wall, deepening to the bathroom wall past the enclosure and turning south along the east wall to the railing; the armchairs are removed (owner); both side walls now reach the ceiling.',
  search: ['balcony L shaped built in bench cushion', 'backless banquette balcony wooden', 'balcony seating against wall cushion'],
  facts: [
    ...base.facts.filter(f => !/^Chair/.test(f[0])),
    ['L-seat', SEAT_CREDIT + ' — only the backless seat (plank box + top board + quilted cushion); backrest + all tables dropped'],
    ['North run', 'x 3.68 → 6.23 m (2.55 m), back on the enclosure, seat 0.59 m deep'],
    ['East run', 'along the east wall from the bathroom wall to the railing (1.90 m), 0.59 m deep'],
    ['Deep corner', 'past the enclosure end the seat reaches back to the bathroom wall (0.90 m deep corner)'],
    ['Seat height', '0.45 m to the cushion top (the file’s 0.55 m lowered; plank box only)'],
    ['Walkway', '1.00 m from the seat front to the railing; bedroom slider fully clear'],
    ['Side walls', 'west (1.10 m) and east (1.40 m) parapets continued in lime plaster up to the ceiling slab'],
  ],
  apply(ctx) {
    const r = base.apply(ctx) || {};
    // old outward bench set (every part of the site BUNDLE) — the new L-seat takes its place
    const bre = BUNDLES.find(b => b.room === 'Master balcony').re;
    ctx.find(bre).forEach(ctx.hide);
    // potted plant in the south-east corner stands where the east run goes (no free spot on this balcony)
    const pl = ctx.one('plant#11'); if (pl) ctx.hide(pl);

    const COSY = ctx.slot('eastwall') !== 'plain';
    const XN = (ENC_X0 + FRONT_E) / 2, ZE = (WALL_N + RAIL) / 2, XD = (ENC_X1 + FRONT_E) / 2;
    if (!COSY) {
      const north = seatModule(ctx, WALL_E - FILE_D - ENC_X0);
      if (north) ctx.add('seat-north', north, XN, ENC_FRONT, 0, { name: 'L-seat north run (' + SEAT_CREDIT + ')', seat: true });
      const east = seatModule(ctx, RAIL - WALL_N);
      if (east) ctx.add('seat-east', east, WALL_E, ZE, -Math.PI / 2, { name: 'L-seat east run (' + SEAT_CREDIT + ')', seat: true, follow: 'seat-north' });
      const fill = seatModule(ctx, FRONT_E - ENC_X1, ENC_FRONT - WALL_N);
      if (fill) ctx.add('seat-deep', fill, XD, WALL_N, 0, { name: 'L-seat deep corner (' + SEAT_CREDIT + ')', seat: true, follow: 'seat-north' });
    } else {
      // same three footprints, built: light-oak plank storage base + cream boucle cushion (seat top 0.45)
      const c = buildCosy(ctx, { FLOOR, WALL_N, ENC_FRONT, ENC_X0, ENC_X1, WALL_E, RAIL, D: FILE_D });
      ctx.add('seat-north', c.north, XN, ENC_FRONT, 0, { name: 'L-seat north run · light-oak storage base, cream cushion', seat: true });
      ctx.add('seat-east', c.east, WALL_E, ZE, -Math.PI / 2, { name: 'L-seat east run · light-oak storage base, cream cushion', seat: true, follow: 'seat-north' });
      ctx.add('seat-deep', c.deep, XD, WALL_N, 0, { name: 'L-seat deep corner · light oak, cream cushion', seat: true, follow: 'seat-north' });
      ctx.add('east-cushions', c.eastCushions, WALL_E, ZE, -Math.PI / 2, { name: 'Back cushions · teal velvet + block print (east wall)', follow: 'seat-north' });
      ctx.add('north-cushions', c.northCushions, XN, ENC_FRONT, 0, { name: 'Back cushions · teal velvet + block print (enclosure)', follow: 'seat-north' });
      ctx.add('east-wall-decor', c.wallDecor, WALL_E, ZE, -Math.PI / 2, { name: 'East wall decor · wire grid + pothos, leaf print, floating oak shelf + lantern' });
      ctx.add('string-lights', c.lights, 0, 0, 0, { name: 'Festoon string lights (east wall + railing side)' });
      // jute rug in front of the L-seat corner (owner 2026-11-11 removed the reference's folding bistro table + chair)
      ctx.add('jute-rug', c.rug, 5.50, 6.64, 0, { name: 'Jute rug 1.30 × 0.80 m', loose: true });
      ctx.add('railing-planter', c.railPlanter, 5.31, 0, 0, { name: 'Black railing planter on the handrail' });
      ctx.mood(c.moods);
    }

    // west wall feature (pieces are built in world coordinates → added at (0, 0), ry 0)
    if (ctx.slot('westwall') !== 'plain') {
      const w = buildWestWall(ctx);
      ctx.add('west-slat-wall', w.wall, 0, 0, 0, { name: 'West wall · walnut slats, backlit sand-plaster arch niche, downlights' });
      ctx.add('west-shelves', w.shelves, 0, 0, 0, { name: 'West arch · 3 floating walnut shelves + LED, vases, plants, prints' });
      ctx.add('west-console', w.console, 0, 0, 0, { name: 'Floating walnut 3-drawer console, white marble top (1.10 m)' });
      ctx.add('west-planter', w.planter, 0, 0, 0, { name: 'Cream curved planter box 1.66 m · ferns, white pebbles, LED cove' });
      ctx.mood(w.moods);
    }

    // side walls to the ceiling
    const T = ctx.THREE, plaster = ctx.lib.mat('01 Warm ivory lime plaster', 0xe6dccb);
    for (const p of PARAPETS) {
      const y0 = p.top - 0.002, h = SLAB_TOP - y0, holder = new T.Group();
      const mesh = new T.Mesh(new T.BoxGeometry(p.x1 - p.x0, h, WALL_Z1 - WALL_Z0), plaster);
      mesh.position.set((p.x0 + p.x1) / 2, y0 + h / 2, (WALL_Z0 + WALL_Z1) / 2);
      holder.add(mesh);
      const g = ctx.add(p.id, { obj: holder }, 0, 0, 0, { name: p.name });
      if (g) g.meshes.forEach(m => { m.userData.cat = 'arch'; });
    }
    return r;
  },
};
