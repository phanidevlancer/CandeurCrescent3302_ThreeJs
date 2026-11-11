// Puja — switchable door on the open west side of the alcove (owner 2026-11-11). The alcove is 1525 × 1273 mm; the open
// side (x 8.755, z 0.199–1.472) faces the passage to the kitchen. Doors swing INTO the puja (passage stays clear): each leaf
// (≈ 0.58 m) folds flat against a side wall at 90°, 0.3 m short of the raised altar platform (x 9.665).
const DOORS = [
  { id: 'open', name: 'Open alcove (original)', summary: 'No door — the puja stays an open alcove as on the plan.', search: ['open puja alcove design'] },
  { id: 'teak-brass-grid', ref: 'references/puja/2026-11-11_teak-glass-brass-grid-cane-puja-doors.png', name: 'Teak doors · reeded glass, brass grid + stars, cane',
    summary: 'Owner reference, built as it is: a pair of teak doors in a teak frame with a teak head panel up to the ceiling and a downlight in the frame head. Each leaf: reeded (fluted) glass behind a brass grid with eight-point brass stars (the puja glows through it), a deep-teal enamel band with brass Shanku · Namam · Chakra emblems, and a cane (rattan) panel in a moulded frame below; long brass pulls with finials on the meeting stiles. The doors open inward and fold against the side walls.',
    search: ['pooja room door design glass brass', 'puja door teak cane panel', 'mandir door fluted glass brass grid', 'shanku chakra namam door design', 'pooja room double door'] },
  { id: 'temple-brass', ref: 'references/puja/2026-11-11_temple-brass-surround-glass-puja-doors.png', name: 'Temple front · brass surround + glass doors',
    summary: 'Owner reference, built as it is (within the 1.27 m opening): stepped teak gopuram tiers up to the ceiling with a downlight in front, an ornate brass frieze (lattice, scroll ends, a Shanku · Namam · Chakra plaque, a row of kalasa finials), brass side pilasters with stacked lotus / kalasa motifs, a moulded dark-teak door frame and threshold, and two frameless clear glass doors with brass patch fittings and a brass lotus medallion split across the meeting edge — the altar stays fully visible. Doors open inward.',
    search: ['temple design pooja room door brass', 'pooja room brass frame glass door', 'gopuram design pooja room entrance', 'mandir entrance brass border teak', 'south indian pooja room door'] },
  { id: 'kerala-mandapam', ref: 'references/puja/2026-11-11_kerala-tiled-roof-carved-teak-puja-doors.png', name: 'Kerala mandapam · tiled roof + carved teak doors',
    summary: 'Owner reference, built as it is (within the 1.27 m opening): a terracotta Mangalore-tiled half-hip roof over the opening with ridge caps and a brass finial, a fretwork (jaali) valance under the eaves, a carved gilt scroll frieze, turned teak pillars on square plinths, a teak frame and threshold, and two carved teak doors — chakra (left) / shankha (right) top panels, a narrow glass slit on the meeting side, a quatrefoil jaali panel, a scroll panel and a large peacock panel — with long brass pulls and a brass tower bolt. Doors open inward.',
    search: ['kerala style pooja room door', 'pooja room door with tiled roof', 'carved teak pooja door peacock', 'mandapam pooja room design', 'traditional wooden pooja door brass'] },
  { id: 'white-faceted', ref: 'references/puja/2026-11-11_black-stone-balaji-relief-shrine.png', name: 'White faceted 3D doors + brass levers',
    summary: 'From the black-stone shrine reference: white doors with a crumpled / faceted 3D surface (catches the light like the reference), white frame and head panel, brass lever handles on both faces. Doors open inward. Pairs with the Black stone shrine interior.',
    search: ['3d textured white door', 'faceted wall panel white', 'pooja room white door brass handle'] },
];
const IDOLS = [
  // owner 2026-11-11: the idol built in code was rejected ("drawn uglyly") → only the supplied Balaji2 sculpt is offered
  { id: 'sketchfab-black', ref: 'assets/models/balaji2.glb', name: 'Balaji2 sculpt · glossy black', summary: 'Owner-supplied 3D model "Balaji2" by kirubakaran320 (Sketchfab, CC BY 4.0 — credit the author). Detailed sculpt (198k triangles) with no colours of its own, finished here in glossy black stone.', search: ['venkateswara black stone idol'] },
  { id: 'sketchfab-brass', ref: 'assets/models/balaji2.glb', name: 'Balaji2 sculpt · brass', summary: 'Same owner-supplied model (kirubakaran320, Sketchfab, CC BY 4.0) finished in polished brass.', search: ['venkateswara brass idol'] },
];
const WALLS = [
  { id: 'charcoal', ref: 'references/puja/2026-11-11_charcoal-carved-stone-mandapa.png', name: 'Charcoal honed stone + carved frieze', summary: 'Dark honed charcoal stone in 0.6 m blocks with fine joints on the walls, floor and ceiling, with a carved floral scroll band round the top.', search: ['black granite wall cladding pooja room', 'charcoal stone wall carved border'] },
  { id: 'facade', ref: 'references/puja/2026-11-11_rough-stone-slab-platform.png', name: 'Facade stone (rubble limestone)', summary: 'Owner reference 2026-11-11 ("facade stone"): random rubble limestone in cream, beige and grey courses with recessed mortar on the three walls; floor and ceiling stay charcoal.', search: ['facade stone wall cladding', 'natural stone facade wall interior', 'rubble stone wall pooja room', 'stacked stone wall cladding beige'] },
  { id: 'splitface', ref: 'references/puja/2026-11-11_black-stone-balaji-relief-shrine.png', name: 'Black split-face stone', summary: 'The earlier black split-face stone tiles on the three walls (shrine reference); floor and ceiling stay charcoal.', search: ['black split face stone wall'] },
];
const INTERIORS = [
  { id: 'original', name: 'Original altar (teak, brass posts, Ganesha)', summary: 'The original puja: raised stone platform, teak altar cabinet, marble top, carved brass posts and arch, Ganesha, diyas and bells.', search: ['pooja room teak altar'] },
  { id: 'black-stone', ref: ['references/puja/2026-11-11_black-stone-balaji-relief-shrine.png', 'references/puja/2026-11-11_venkateswara-black-gold-panel.png'], name: 'Black stone shrine + 3D Sri Venkateswara',
    summary: 'Owner references, built as they are: honed charcoal stone in large blocks with fine joints on all three walls, the floor and the ceiling, with a carved floral scroll frieze round the top (owner reference 2026-11-11), the owner-supplied 3D sculpt of Sri Venkateswara ("Balaji2" by kirubakaran320, Sketchfab, CC BY 4.0) in glossy black or brass, standing on the cabinet against the altar wall inside a warm LED outline, a rough-hewn weathered limestone platform (thick chipped slab on two stone block legs, owner reference 2026-11-11) carrying brass samai lamps and diyas (lit), a brass bell hanging from the ceiling and a round embroidered mandala pouf. Not added: the split AC in the reference (the alcove is 1.5 × 1.3 m and open to the passage).',
    search: ['black stone pooja room', 'balaji brass relief wall panel pooja', 'venkateswara wall panel backlit', 'floating pooja unit white brass diyas', 'split face black stone wall cladding'] },
  { id: 'panel-shrine', ref: 'references/puja/2026-11-11_patchwork-stone-panels-venkateswara-interior.png', name: 'Patchwork stone panels + stone altar',
    summary: 'Owner reference, built as it is (within the 1.5 × 1.3 m alcove): back wall of large dark-bronze textured stone panels — plain, gold sunflower and mandala motifs, engraved script-style rows — with gold inlay strips and small black-and-gold plaques; the Balaji2 sculpt (owner model, CC BY 4.0 kirubakaran320) on a black pedestal on a pale grey stone altar with a gold carved band and marble top; brass diyas, offering plates, two brass hanging lamps; taupe side walls with lit niches (brass pots, small plants) and fluted bronze edges; cream ceiling with a perimeter cove light and downlights; pale marble floor with a rug. Not added: the floor plant pots beside the altar (the altar fills the 1.27 m width).',
    search: ['pooja room stone wall panels gold', 'venkateswara pooja room design', 'luxury pooja room tiles', 'pooja room niches brass', 'stone altar pooja unit gold border'] },
];
export default {
  id: 'option1',
  name: 'Option 1 · Puja doors',
  layoutLabel: 'Puja',
  // only the two element switches (door, interior + idol) get ⇄ icons; Original stays reachable from the room panel
  layoutIcon: false,
  summary: 'The puja alcove with a switchable door on its open side and a switchable interior. Use the ⇄ icons at the opening and on the altar wall.',
  search: ['pooja room door design'],
  slots: [{ id: 'door', label: 'Puja door', default: 'teak-brass-grid', anchor: [8.55, 2.35, 0.835], variants: DOORS },
    { id: 'interior', label: 'Puja interior', default: 'original', anchor: [10.0, 2.55, 0.835], variants: INTERIORS },
    { id: 'idol', label: 'Idol', default: 'sketchfab-black', variants: IDOLS },
    { id: 'walls', label: 'Puja walls (black stone shrine)', default: 'charcoal', variants: WALLS }],
  apply(ctx) {
    const inside = ctx.slot('interior');
    if (inside === 'panel-shrine') {
      ctx.find(/^(deity|diya|ganesha|puja-)/).forEach(ctx.hide);
      const parts = ctx.lib.pujaPanelShrine({ x0: 8.755, x1: 10.28, z0: 0.199, z1: 1.472, ceil: 2.91, idol: ctx.slot('idol') });
      for (const [k, p] of Object.entries(parts)) { ctx.add('panels-' + k, p, 0, 0, 0, { name: 'Puja panels: ' + k }); if (p.moods) ctx.mood(p.moods); }
    }
    if (inside === 'black-stone') {
      // the whole original altar set is replaced (downlights stay)
      ctx.find(/^(deity|diya|ganesha|puja-)/).forEach(ctx.hide);
      const parts = ctx.lib.pujaStoneShrine({ x0: 8.755, x1: 10.28, z0: 0.199, z1: 1.472, ceil: 2.91, idol: ctx.slot('idol'), wall: ctx.slot('walls') });
      for (const [k, p] of Object.entries(parts)) { ctx.add('shrine-' + k, p, 0, 0, 0, { name: 'Puja shrine: ' + k, loose: k === 'pouf' }); if (p.moods) ctx.mood(p.moods); }
    }
    const st = ctx.slot('door'); if (!st || st === 'open') return {};
    // local +z faces the passage (west, −x): same facing as an east-wall item → ry −π/2
    const BUILD = {
      'temple-brass': () => [ctx.lib.templeDoors({ W: 1.273, ceil: 2.91 }), 'Puja temple front (teak tiers, brass surround, glass doors)'],
      'kerala-mandapam': () => [ctx.lib.keralaDoors({ W: 1.273, ceil: 2.91 }), 'Puja mandapam (tiled roof, turned pillars, carved teak doors)'],
      'teak-brass-grid': () => [ctx.lib.pujaDoors({ W: 1.273, H: 2.1, ceil: 2.91, swing: 'in' }), 'Puja doors (teak, reeded glass, brass, cane)'],
      'white-faceted': () => [ctx.lib.facetedDoors({ W: 1.273, H: 2.1, ceil: 2.91 }), 'Puja doors (white faceted 3D, brass levers)'],
    };
    const [d, nm] = (BUILD[st] || BUILD['teak-brass-grid'])();
    ctx.add('puja-doors', d, 8.755, 0.8355, -Math.PI / 2, { name: nm });
    ctx.mood(d.moods);
    return {};
  },
};
