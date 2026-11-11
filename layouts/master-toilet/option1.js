// Master toilet — switchable bathroom designs (owner 2026-11-10). Owner rule: "do not change the placements of the commode,
// wash basin and bath area from my original design" → every design keeps the v1 positions (shower x 3.82–4.79 full depth,
// basin on the south wall x 4.89–5.61, WC centred x 6.18 on the south wall); only finishes, fittings and furniture change.
const BATH = [
  { id: 'original', name: 'As built (original)', summary: 'The original master toilet.', search: ['modern bathroom design'] },
  { id: 'pebble', ref: 'references/master-toilet/2026-11-10_pebble-stone-shower-bathroom.png', name: 'Pebble stone shower + grey porcelain', summary: 'Owner reference: large-format warm-grey porcelain on every wall and floor, a pebble-mosaic feature wall over a stone ledge at the back of the shower grazed by a warm wall-wash, frameless glass screen with black profile, matte-black rain shower, mixer and hand shower, wall-hung walnut-zebrano vanity with dark stone top and white rectangular vessel basin, slim black mirror with halo, wall-hung WC with black flush plate, grey bath mat.', search: ['pebble stone shower wall', 'grey porcelain bathroom black fixtures', 'walk in shower pebble mosaic niche', 'zebrano vanity vessel basin'] },
  { id: 'teal', ref: 'references/master-toilet/2026-11-10_teal-herringbone-brass-bathroom.png', name: 'Teal herringbone + brass', summary: 'Owner reference: deep-teal glossy herringbone tiles across the shower, white walls, brass-framed glass screen, brass rain + hand shower and mixer, brass-trimmed niche, white shower tray, oak floating shelf with a round vessel basin, brass wall spout and exposed brass trap, brass rounded mirror with a brass bar light, wall-hung WC with brass flush plate.', search: ['teal herringbone shower tiles brass', 'green bathroom brass fixtures', 'oak floating shelf vessel basin', 'brass rounded mirror bathroom'] },
  { id: 'stone', ref: 'references/master-toilet/2026-11-10_natural-stone-shower-oak-vanity.png', name: 'Natural stacked stone + oak', summary: 'Owner reference: natural beige ledgestone across the shower alcove with a wood-lined niche, beige mosaic shower floor, glass screen with black profile and stabiliser bar, matte-black rain shower and mixer, warm plaster walls and travertine-look floor, open oak vanity with a white oval vessel, wall-mounted black taps and folded towels below, large oak-framed mirror with a black sconce, wall-hung WC.', search: ['natural stone shower wall', 'stacked stone bathroom oak vanity', 'rustic spa bathroom stone', 'open shelf wooden vanity vessel sink'] },
  { id: 'charcoal', ref: 'references/master-toilet/2026-11-10_charcoal-brick-teak-bathroom.png', name: 'Charcoal tiles + grey brick + teak', summary: 'Owner reference: dark charcoal large-format tiles on the walls and floor, a whitewashed grey brick wall behind the vanity washed by a ceiling LED, a round backlit mirror with a warm halo and a slim black pendant with an Edison bulb, oak vanity with two drawers over an open shelf of wicker baskets, dark stone top, round white vessel and black tap, plants; in the shower a teak slatted floor deck, black-framed glass, square black rain shower with slide rail and a long warm-lit niche; wall-hung WC with a black plate.', search: ['charcoal bathroom brick wall round mirror', 'teak shower floor deck', 'backlit round mirror bathroom', 'oak vanity wicker baskets', 'dark grey bathroom wood accents'] },
  { id: 'grey-slats', ref: 'references/master-toilet/2026-11-10_grey-tile-walnut-slats-floating-oak.png', name: 'Grey tiles + walnut slats + floating oak', summary: 'Owner reference: mid-grey large-format tiles on walls and floor, a tiled ledge (concealed cistern) behind the wall-hung WC carrying plants, walnut vertical slats above it and over the window, washed by a warm ceiling light; two floating oak shelves for the basin (white oval vessel, wall-mounted black taps) and towels below; capsule mirror with a thin bronze frame between two Edison-bulb pendants; grey shower with black fittings and a lit niche.', search: ['grey bathroom walnut slats', 'floating wood shelf vanity vessel sink', 'oval mirror edison pendant bathroom', 'wall hung toilet ledge plants', 'dark grey tiles wood bathroom'] },
];
export default {
  id: 'option1',
  name: 'Option 1 · Bathroom designs',
  layoutLabel: 'Bathroom',
  summary: 'Switchable bathroom designs on the original layout (shower, basin and WC stay where they are). Use the ⇄ icon in the toilet.',
  search: ['small bathroom design walk in shower', 'master bathroom ideas'],
  slots: [{ id: 'bath', label: 'Bathroom', default: 'original', anchor: [5.3, 2.4, 4.2], variants: BATH }],
  apply(ctx) {
    const st = ctx.slot('bath');
    // owner 2026-11-11: "use this sink" + "use this mirror" → the owner's sink cabinet + round mirror in EVERY design, incl.
    // the original (there only the v1 vanity cabinet + brass mirror are replaced; v1 tiles stop in front at z 5.046, floor 0.056)
    if (!st || st === 'original') {
      const VM = ctx.lib.bathVanityModels({ vx: 5.25, zw: 5.04, fy: 0.056 }); if (!VM) return {};
      ctx.find(/^master-vanity/).forEach(ctx.hide);
      const va = new ctx.THREE.Group(); va.add(VM.sink); va.add(VM.mirror);
      ctx.add('bath-vanity', { obj: va }, 0, 0, 0, { name: 'Bathroom: vanity (Sink cabinet A by cirno + mirror by ocelotlmx, CC BY 4.0)' });
      return {};
    }
    ctx.find(/^(master-shower|master-vanity|master-wc|master-toilet)/).forEach(ctx.hide);
    const parts = ctx.lib.masterBath({ style: st });
    for (const [k, p] of Object.entries(parts)) { ctx.add('bath-' + k, p, 0, 0, 0, { name: 'Bathroom: ' + k + (k === 'vanity' ? ' (Sink cabinet A by cirno + mirror by ocelotlmx, CC BY 4.0)' : '') }); if (p.moods) ctx.mood(p.moods); }
    return {};
  },
};
