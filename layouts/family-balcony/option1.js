// Family balcony · Option 1 — the outdoor chair → the owners' wicker armchair model (owner 2026-11-11).
// Old chair (family-balcony#0): x 10.825–11.56, z −1.588…−0.812, back to the west (living-room slider side), facing east
// (the railing). New chair: back face at x 10.825, centred on z −1.20, ry π/2 (front east), ×1.26 = the old footprint.
// The round teak side table and the plants stay.
import { chairOption } from '../balcony-chairs.js';
export default chairOption({
  room: 'Family balcony',
  chairs: [{ id: 'chair', old: 'family-balcony#0', x: 10.825, z: -1.2, ry: Math.PI / 2, scale: 1.26 }],
});
