// Dress block / walk-in closet — switchable elements (owner 2026-11-10):
//  • Passage wall (where the Buddha relief panel is): Buddha (as built) | carved sandstone elephants
//    (references/passage/2026-11-10_carved-sandstone-elephant-wall.png). Wall x 3.83 → 6.77, face z ≈ 1.10, faces north.
//  • Walk-in wardrobe fronts: original greige sliders | bronze fluted glass (references/walk-in/2026-11-10_bronze-fluted-glass-sliding-wardrobe.png)
//    | grey reeded glass + brass with a loft (references/walk-in/2026-11-10_grey-reeded-glass-brass-wardrobe.png).
//    Wardrobe x 3.88 → 6.67, carcass front z 1.81, three bypass sliders on the v1 tracks; the v1 interior stays.
const PASSAGE = [
  { id: 'buddha', name: 'Buddha relief panel (as built)', summary: 'The original replaceable Buddha relief panel with walnut side flutes and soft halo.', search: ['buddha wall panel relief', 'buddha backlit wall art'] },
  { id: 'carved-stone', ref: 'references/passage/2026-11-10_carved-sandstone-elephant-wall.png', name: 'Carved sandstone elephants', summary: 'Full-bleed carved sandstone feature: large-format slabs with fine joints, three caparisoned elephants (one carrying a temple tower), temple-style corner brackets and a framed carved panel — real ≈ 30 mm relief grazed by four ceiling wall-washers. Replaces the Buddha panel and the walnut side flutes.', search: ['carved sandstone elephant wall', 'stone carving wall panel elephant', 'temple carving wall cladding', 'CNC stone relief wall panel', 'GRC carved wall panel'] },
];
const WARDROBE = [
  { id: 'original', name: 'Greige sliders with bronze frames (as built)', summary: 'The original three greige sliding fronts with bronze frames.', search: ['greige sliding wardrobe bronze frame'] },
  { id: 'bronze-fluted', ref: 'references/walk-in/2026-11-10_bronze-fluted-glass-sliding-wardrobe.png', name: 'Bronze fluted glass sliders', summary: 'Owner reference: three full-height sliders in slim black-bronze frames with bronze-tinted fluted glass, the warm-lit interior (hanging rails, shelves, drawers, loft) glowing through in horizontal light lines, a warm light band along the top, long bronze pulls. Same three bypass tracks and travel as before.', search: ['fluted glass sliding wardrobe bronze', 'reeded glass wardrobe doors black frame', 'walk in closet glass sliding doors LED', 'bronze tinted fluted glass wardrobe'] },
  { id: 'grey-reeded', ref: 'references/walk-in/2026-11-10_grey-reeded-glass-brass-wardrobe.png', name: 'Grey reeded glass + brass, with loft', summary: 'Owner reference: light-grey wardrobe — three sliders to 2.2 m in thin brass frames with clear-grey reeded glass above and below a solid grey band, brass pulls, and a four-door light-grey linen loft above with paired brass pull bars; warm LED lines through the glass and under the loft.', search: ['reeded glass wardrobe gold frame', 'grey wardrobe fluted glass sliding doors', 'wardrobe with loft brass handles', 'glass sliding wardrobe with middle panel'] },
  { id: 'walnut-smoked', ref: 'references/walk-in/2026-11-10_walnut-smoked-glass-wardrobe.png', name: 'Walnut + smoked glass, glazed loft', summary: 'Owner reference: three walnut sliders with a smoked-glass window across the middle (thin black edge lines) so the lit hanging space shows, walnut above and below, and a walnut-framed loft with two smoked-glass sliding doors and a warm light inside. Not applied: the reference\'s open side tower with the curved corner + drawers — the wardrobe already runs wall to wall (2.79 m) and the 0.2 m end niche keeps its slim display shelves.', search: ['walnut wardrobe smoked glass sliding doors', 'wardrobe with glass loft', 'sliding wardrobe glass window panel', 'dark wood wardrobe black frame glass'] },
  { id: 'graphite-hinged', ref: 'references/walk-in/2026-11-10_graphite-hinged-glass-open-column-wardrobe.png', name: 'Graphite hinged doors + glass + open column', summary: 'Owner reference: matte graphite wardrobe — four solid hinged doors (0.37 m, long black bar handles on the meeting edges) with loft doors above, two black-framed clear-smoked glass doors showing the lit shelves, and an open column on the right with warm-lit shelves, storage boxes, a black vase and three graphite drawers at the bottom; warm light band at the top. Narrow leaves keep every door swing inside the closet.', search: ['graphite wardrobe glass doors open shelves', 'dark grey wardrobe black handles', 'wardrobe with glass door section LED', 'walk in wardrobe hinged doors drawers'] },
  { id: 'organic-inlay', ref: 'references/walk-in/2026-11-10_dark-organic-brass-inlay-wardrobe.png', name: 'Dark doors + organic brass inlay', summary: 'Owner reference: chocolate-dark push-to-open doors in six columns with a loft row, brass inlay grooves outlining every panel with soft rounded corners, and a flowing bronze wave band that runs continuously across all the doors (the panels\' corners hug the wave), warm floor glow. Every door is a real hinged leaf; narrow leaves (0.465 m) keep the swing inside the closet.', search: ['wardrobe brass inlay wave design', 'dark wardrobe gold groove organic', 'luxury wardrobe door design curved inlay', 'wavy brass strip wardrobe doors'] },
  { id: 'navy-arched', ref: 'references/walk-in/2026-11-10_navy-arched-panelled-wardrobe.png', name: 'Navy arched panelled wardrobe', summary: 'Owner reference: classic navy lacquer wardrobe — four doors with tall rounded antique-glass windows edged in brass over panelled bases, a pair of doors with amber fluted glass behind navy glazing bars, two panelled drawers with brass knobs, loft doors above, long brass pulls with pearl inlay, a fluted walnut frieze with cornice and a walnut skirting; warm LED inside glows through the glass. Not applied: the ornate gilded ceiling moulding and dark plaster walls of the reference (room finishes).', search: ['navy blue wardrobe glass doors brass', 'classic panelled wardrobe arched glass', 'antique mirror glass wardrobe doors', 'fluted glass wardrobe with muntins', 'wardrobe with fluted wood cornice'] },
];
export default {
  id: 'option1',
  name: 'Option 1 · Walk-in designs (passage wall + wardrobe)',
  layoutLabel: 'Walk-in',
  summary: 'Switchable elements of the dress / walk-in block: the passage wall (Buddha or carved sandstone) and the walk-in wardrobe fronts (original, bronze fluted glass, grey reeded glass + brass). Use the ⇄ icons on the passage wall and on the wardrobe.',
  facts: [
    ['Passage wall', '2.94 × 3.0 m; carved option ≈ ₹1.1–1.7 L (CNC GRC / stone-finish panels)'],
    ['Wardrobe', '2.79 m, three bypass sliders (0.96 m each) on the existing tracks; interior unchanged; glass options need 6 mm toughened fluted / reeded glass in aluminium profiles'],
  ],
  search: ['walk in closet design', 'walk in wardrobe sliding glass'],
  slots: [
    { id: 'passage', label: 'Passage wall', default: 'buddha', anchor: [5.3, 2.35, 0.9], variants: PASSAGE },
    { id: 'wardrobe', label: 'Wardrobe', default: 'original', anchor: [5.3, 2.5, 2.25], variants: WARDROBE },
  ],
  apply(ctx) {
    if (ctx.slot('passage') === 'carved-stone') {
      ctx.find(/^(buddha-original|buddha-panel|buddha-shallow|passage-full|passage-walnut)/).forEach(ctx.hide);
      const wall = ctx.lib.carvedStoneWall({ w: 2.94, h: 3.0 });
      ctx.add('carved-wall', wall, (3.83 + 6.77) / 2, 1.10, Math.PI, { name: 'Carved sandstone elephant wall' }); ctx.mood(wall.moods);
    }
    const wd = ctx.slot('wardrobe');
    if (wd && wd !== 'original') {
      ctx.hideMovers(/^31a-slider/); ctx.find(/^sliding-wardrobe/).forEach(ctx.hide);
      // hinged designs stop 0.13 m short of the east end: the slim display shelves in the end niche stand in front of that strip
      // (their doors / drawers hit the brass dish, vine and diffuser otherwise); a fixed filler closes the gap behind the shelves
      const HINGED = /graphite-hinged|organic-inlay|navy-arched/.test(wd), x0 = 3.88, x1 = HINGED ? 6.67 - 0.13 : 6.67;
      const fr = ctx.lib.walkinFronts({ style: wd, W: x1 - x0 });
      ctx.add('wardrobe-fronts', fr, (x0 + x1) / 2, 1.81, 0, { name: WARDROBE.find(v => v.id === wd).name }); ctx.mood(fr.moods);
      if (HINGED) { const fil = new ctx.THREE.Group(); fil.add(ctx.lib.box(0.13, 2.83, 0.03, new ctx.THREE.MeshStandardMaterial({ color: wd === 'navy-arched' ? 0x23304a : wd === 'organic-inlay' ? 0x2b2522 : 0x3d3f42, roughness: 0.6, name: '__wardrobe_filler' }), 0, 0.12, 0)); ctx.add('wardrobe-filler', { obj: fil }, 6.67 - 0.065, 1.81, 0, { name: 'Wardrobe end filler (behind the display shelves)' }); }
    }
    return {};
  },
};
