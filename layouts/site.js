// Site conditions of the real flat that every design must respect (not part of any layout option, survive option switches).
// Owner 2026-11-11 (photo references/master-balcony/2026-11-11_site-photo-pipe-enclosure.png): in the master balcony a
// charcoal louvred enclosure hides the drain pipes (and the master-toilet ventilator) against the toilet wall, from the
// bedroom slider to the utility divider, floor to ceiling, ≈ 1 ft deep — that strip of the balcony is unusable.
// Each fixture: room, name, build(lib, ceil) → built, x/z = back-face centre (three coords), ry (wall facing),
// retire = v1 groups (short id regex) that sat in its volume → hidden, shift = v1 groups moved out of the way.
export const SITE_FIXTURES = [
  {
    room: 'Master balcony', name: 'pipe-enclosure', label: 'Drain-pipe enclosure (site, charcoal louvres, 1 ft deep)',
    // owner 2026-11-11: stops exactly ½ inch (12.7 mm) before the washroom exhaust (master-toilet ventilator frame starts at x 6.0525)
    x0: 3.68, x1: 6.0525 - 0.0127, wallZ: 5.267, depth: 0.305,
    build: (lib, ceil, f) => lib.pipeEnclosure({ w: f.x1 - f.x0, d: f.depth, h: ceil, endLeft: true, endRight: true }),
    // wall finish, ledges, trailing plants and the hanging plant were on the wall that is now enclosed
    retire: /^(balcony-warm|balcony-stone|balcony-ledge|balcony-trailing|balcony-restrained|plant#6$)/,
    // the outward-facing four-seat bench (+ its cushions, toe LED, tea table) moves 1 ft out to stand against the louvres:
    // 0.96 m stays free to the railing
    shift: { re: /^(outward-four-seat|outward-bench|balcony-bench|cushion-woven|handloom-accent|compact-balcony|cantilever-tea|balcony-brass|balcony-tea)/, dz: 0.305 },
  },
];

// Pieces that make up ONE piece of furniture in the v1 export (seat, back, cushions, LED, side table…): grabbing / dragging any
// member moves the whole set (owner 2026-11-11: "the sofa is not moving as a single unit"). re = short group id regex.
export const BUNDLES = [
  { room: 'Master balcony', name: 'outward bench', re: /^(outward-four-seat|outward-bench|balcony-bench|cushion-woven|handloom-accent|compact-balcony|cantilever-tea|balcony-brass|balcony-tea)/ },
];
