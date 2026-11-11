// Bedroom 1 balcony · Option 1 — the outdoor chair → the owners' wicker armchair model (owner 2026-11-11).
// Old chair (bedroom-1#0 in this balcony): x 10.91–11.69, z −7.995…−7.26, back to the north parapet, facing south.
// New chair: back face at z −7.995, centred on x 11.30, ry 0 (front south), ×1.26 = the old footprint. The plant stays.
import { chairOption } from '../balcony-chairs.js';
export default chairOption({
  room: 'Bedroom 1 balcony',
  chairs: [{ id: 'chair', old: 'bedroom-1#0', x: 11.3, z: -7.995, ry: 0, scale: 1.26 }],
});
