// Option 4 — Teak heritage master bedroom (owner 2026-11-10: "create a 4th bedroom option to match the same vibe on all the
// walls of Teak heritage: drums, beads + woven console"). Same plan as option 3 (bed in the west corner, no nightstands,
// projector, AC on the west wall, hidden walk-in door) but every surface in the heritage language: off-white walls, dark teak,
// cane / diamond weave, brass, block print, Indian art.
import { clearV1, BED_SET, clearZones } from './common.js';
import { BED, PALETTE, V1_BEDSIDE, projectorSet, airCon, masterBed, BED_SLOT } from './style.js';

const HEAD = 4.905 - 0.012;      // front of the Mughal bed-wall frame
export default {
  id: 'option4',
  slots: [BED_SLOT],
  ref: 'references/master-bedroom/2026-11-10_teak-heritage-drums-tv-wall.png',
  name: 'Option 4 · Teak heritage (whole room)',
  summary: 'The Teak heritage TV wall carried round the whole room: off-white walls, dark teak, cane and diamond weave, brass and Indian art. North: the full-width heritage TV wall (drums, bead chain, woven console, teak beam, high shelf + block-print panel over the door zone). East: teak skirting and dado rail, the hidden walk-in door as a teak panelled door with a cane inset and brass ring pull, a carved teak jharokha arch with a brass diya, a pichwai painting over a teak shelf of brass lotas and an urli. West (beside the bed): teak panelled wainscot with woven insets, three miniature paintings, a brass bell reading sconce. South: ivory-and-brass Mughal multifoil bed wall. Ceiling: three teak beams on brackets (east–west, clear of the projector screen and its beam). Hand-woven dhurrie rug, rust storage bench, brass jaali lantern over the bed.',
  search: ['indian heritage bedroom teak', 'pichwai painting bedroom wall', 'jharokha wall niche', 'teak ceiling beams bedroom', 'dhurrie rug bedroom', 'brass lantern bedroom', 'cane door indian home'],
  facts: [
    ['Plan', 'as option 3: 6×7 ft bed in the west corner (no nightstands), ≈ 1.6 m clear route east of the bed to the balcony, projector screen in front of the TV, AC on the west wall'],
    ['North (TV wall)', 'Teak heritage, full width; door-leaf zone kept flat (shelf above the door, block-print textile + inlay below)'],
    ['East', 'teak skirting + dado, teak panelled hidden walk-in door (cane inset, brass ring), carved jharokha + brass diya, pichwai + teak shelf with brass lotas and urli, picture light'],
    ['West', 'teak wainscot 1.0 m with diamond-weave insets (≤ 40 mm deep — the bed side stands against it), three miniature paintings, brass bell reading sconce near the pillows'],
    ['South (bed wall)', 'Mughal multifoil arch in ivory lacquer traced in brass, brass diya shelf'],
    ['Ceiling', 'teak beams at 1.4 / 2.4 / 3.95 m from the TV wall, east–west: they never cross the screen cassette (0.7 m) or the projector beam; the AC sits between two beams'],
    ['Lighting', 'beam wall-wash, lit shelves, jharokha glow, diya flames, picture light, wainscot up-light, brass lantern (kept west of the projector beam), under-bed glow'],
  ],
  apply(ctx) {
    const { lib } = ctx;
    clearV1(ctx);
    ctx.find(BED_SET).forEach(ctx.hide); ctx.find(V1_BEDSIDE).forEach(ctx.hide);
    ctx.find(/^(walk-in-entrance|walk-in-fixed|walk-in-narrow|walk-in-concealed)/).forEach(ctx.hide);
    ctx.hideMovers(/^31d-/);
    clearZones(ctx, [[0, 0.2, 3.658, 5.0]]);
    if (ctx.hideStatic) ctx.hideStatic(/discreet_split_AC/i);
    if (ctx.cutStatic) ctx.cutStatic([0, -0.3, 0.15], [0.9, 0.6, 0.9], ['ceilfix']);
    // north: the full-width heritage TV wall
    const gw = lib.gamingWall({ tvInch: 55, backdrop: 'heritage' });
    ctx.add('gaming-wall', gw, 0, 0.2, 0, { name: 'Teak heritage TV wall (drums, beads, woven console)' }); ctx.mood(gw.moods);
    // east: heritage wall with the hidden walk-in door (same frame as option 3's panel wall)
    const ew = lib.heritageEastWall({ length: 3.7, door: [2.27 - 1.24, 3.24 - 1.24], jharokhaAt: 0.5, artAt: 2.85 });
    ctx.add('east-heritage', ew, 3.658, 1.24, -Math.PI / 2, { name: 'East wall: teak door, jharokha, pichwai' }); ctx.mood(ew.moods);
    // west: teak wainscot + miniatures + reading sconce near the pillows (local x → world z = 2.835 − x)
    const ww = lib.heritageWestWall({ length: 4.03, art: [-0.6, 0.2, 1.0], sconces: [-1.55] });
    ctx.add('west-heritage', ww, 0, (0.82 + 4.85) / 2, Math.PI / 2, { name: 'West wall: teak wainscot + miniatures' }); ctx.mood(ww.moods);
    // south: Mughal multifoil bed wall (ivory + brass)
    const bw = lib.bedWallStyled({ style: 'mughal', length: 3.658, solidTo: 1.28, headY: 2.15 });
    bw.obj.scale.x = -1;
    ctx.add('balcony-wall', bw, 0, 5.067, Math.PI, { name: 'Bed wall: Mughal multifoil arch' }); ctx.mood(bw.moods);
    ctx.hide(ctx.one('master-king#0') || { pivot: {} });
    const bed = masterBed(ctx, { mattressW: BED.mattressW, mattressL: BED.mattressL, hbH: 1.25, fabricColour: PALETTE.bed });
    const bW = bed.size.w, XBc = 0.047 + 0.015 + bW / 2, foot = HEAD - bed.size.l;
    ctx.add('bed', bed, XBc, HEAD, Math.PI, { name: bed.label, seat: true });
    ctx.add('bench', lib.bedBench({ w: 1.5, fabric: () => new ctx.THREE.MeshStandardMaterial({ color: 0x8a4a2e, roughness: 0.92, name: '__bench_rust_linen' }) }), XBc, foot, Math.PI, { name: 'Storage bench (rust)', seat: true, follow: 'bed' });
    const halo = lib.ledStrip({ w: bW - 0.14, wash: 0.42, dir: 'up', alpha: 0.55 }); halo.obj.position.y = 1.235;
    ctx.add('headboard-halo', halo, XBc, HEAD - 0.002, Math.PI, { name: 'Headboard halo LED', follow: 'bed' }); ctx.mood(halo.moods);
    for (const [nm, w, x, z, ry] of [['foot', bW - 0.2, XBc, foot + 0.09, Math.PI], ['side-e', bed.size.l - 0.3, XBc + bW / 2 - 0.09, HEAD - bed.size.l / 2, Math.PI / 2]]) {
      const ub = lib.ledStrip({ w, wash: 0.22, dir: 'floor', alpha: 0.5, power: 2 }); ub.obj.position.y = 0.075;
      ctx.add('underbed-' + nm, ub, x, z, ry, { name: 'Under-bed glow', follow: 'bed' }); ctx.mood(ub.moods);
    }
    const rug = lib.dhurrieRug({ w: 2.4, l: 2.0 }); rug.obj.position.y = 0.062;
    ctx.add('rug', rug, Math.max(XBc, 0.08 + 1.2), HEAD - 0.6, Math.PI, { name: 'Hand-woven dhurrie (rust / indigo / ochre)', loose: true, follow: 'bed' });
    // ceiling: teak beams east–west, clear of the screen cassette, the projector and its beam; AC between two of them
    const beams = lib.heritageBeams({ width: 3.658, zs: [1.4, 2.4, 3.95] });
    ctx.add('ceiling-beams', beams, 0, 0, 0, { name: 'Teak ceiling beams' });
    ctx.add('lantern', lib.brassLantern({ ceiling: 2.85, drop: 0.25 }), 0.6, 2.9, 0, { name: 'Brass jaali lantern (west of the projector beam)' });
    projectorSet(ctx, gw.tvCx, 0.2 + gw.screenZ, 0, gw.tvCx, HEAD - 0.5, Math.PI, 2.21, { ceiling: 2.82 });
    airCon(ctx, 0, 3.0, Math.PI / 2);   // west wall, between the beams at 2.4 and 3.95
    return { bed: 'option4/bed', ignore: '^master-bedroom/(compact|bedside|linen-shade|handloom|woven|master-handloom|master-small)', view: { from: [XBc, HEAD - 0.3], to: [gw.tvCx, 0.3] }, screen: { from: [XBc, HEAD - 0.3], to: [gw.tvCx, 0.7] } };
  },
};
