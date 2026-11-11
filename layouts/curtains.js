// Ceiling-to-floor, wall-to-wall curtains for every room with a window / balcony slider (owner rule, 2026-11-04):
// "curtains should start from the ceiling and occupy the walls end to end".
// Each wall gets a ceiling-mounted double track, a full-width sheer (window side) and a heavier drape (room side),
// both split in two halves that gather towards the wall ends (click / E to open or close; type 'gather' movers).
// Not part of any layout option: they stay whatever option is chosen. v1 curtains/rails in those rooms are retired.
import * as THREE from 'three';

// three.js coords. line = wall face, a→b = wall end to wall end (stopped by fixed joinery), into = +1/-1 room direction
// on the axis normal to the wall. hem = bottom of the fabric above the floor.
export const CURTAIN_WALLS = [
  { room: 'Master bedroom', axis: 'z', line: 5.067, into: -1, a: 0.0, b: 3.658, drape: /^master-curtain/, retire: /^master-curtain/ },
  { room: 'Bedroom 1', axis: 'x', line: 10.28, into: -1, a: -8.313, b: -4.503, retire: /^(linen-curtain|curtain-rail)/ },
  // bed 2's headboard sits against this wall (in its original place), so the hem clears it: 0.81 cleared the v1 low headboard
  // (0.79); the owners' bed model (2026-11-11, same size + place as the v1 bed) has a shelf headboard to 1.21 m → hem 1.24
  // (the window sill is at 0.85, so below the hem the headboard covers the glass anyway)
  { room: 'Bedroom 2', axis: 'z', line: -8.313, into: 1, a: 1.68, b: 4.78, hem: 1.24, depth: 0.1 },
  { room: 'Living and dining', axis: 'x', line: 10.28, into: -1, a: -4.27, b: -0.07, drape: /^approved-h2-floor/, retire: /^approved-h2-(floor|ceiling-curtain|wall-to-wall)/ },
];

const SHEER = new THREE.MeshPhysicalMaterial({ name: '__curtain_sheer', color: 0xf3eee4, roughness: 0.9, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xffffff), transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
const TRACK = new THREE.MeshStandardMaterial({ name: '__curtain_track', color: 0xd9d6cf, roughness: 0.45, metalness: 0.6 });
const DRAPE_FB = new THREE.MeshPhysicalMaterial({ name: '__curtain_drape', color: 0xb8a990, roughness: 1, sheen: 0.8, sheenRoughness: 0.65, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide });

// ripple-fold panel in the builder frame: x from x0 to x1, y from hem to top, waving in z around zc
function panel(x0, x1, hem, top, zc, amp, wave, mat) {
  const w = Math.abs(x1 - x0), nx = Math.max(8, Math.ceil(w / wave * 8)), ny = 6;
  const geo = new THREE.PlaneGeometry(w, top - hem, nx, ny), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + w / 2, y = p.getY(i) + (top + hem) / 2;
    const sway = (1 - (y - hem) / (top - hem)) * 0.006 * Math.sin(u * 7.3);        // slight irregular hang near the hem
    p.setXYZ(i, Math.min(x0, x1) + u, y, zc + amp * Math.sin(u / wave * Math.PI * 2) + sway);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

// build one wall's curtains in the builder frame (+x along the wall, +z into the room, origin = wall centre on the floor)
export function buildCurtainWall(len, ceil, { hem = 0.012, depth = 0.13, drapeMat = DRAPE_FB, gatherSheer = 0.16, gatherDrape = 0.2 } = {}) {
  const root = new THREE.Group(), half = len / 2, top = ceil - 0.035;
  const t = new THREE.Mesh(new THREE.BoxGeometry(len, 0.03, depth - 0.01), TRACK); t.position.set(0, ceil - 0.015, depth / 2); root.add(t);
  const zs = depth * 0.3, zd = depth * 0.72, as = Math.min(0.022, depth * 0.17), ad = Math.min(0.03, depth * 0.22);
  let id = 0;
  for (const side of [-1, 1]) {
    const end = side * half;                       // wall end this half gathers towards
    const sheer = panel(end, 0, hem + 0.01, top, zs, as, 0.1, SHEER);
    sheer.userData.moverSpec = { id: 'cs' + (++id), type: 'gather', hinge: [end, 0, 0], min: gatherSheer, label: 'sheer curtain' };
    const drape = panel(end, 0, hem, top, zd, ad, 0.14, drapeMat);
    drape.userData.moverSpec = { id: 'cd' + (++id), type: 'gather', hinge: [end, 0, 0], min: gatherDrape, start: 1, label: 'curtain' };
    root.add(sheer, drape);
  }
  return { obj: root };
}

// ry so that builder +z points into the room
export function wallPose(w) {
  const mid = (w.a + w.b) / 2;
  if (w.axis === 'z') return { x: mid, z: w.line, ry: w.into > 0 ? 0 : Math.PI };
  return { x: w.line, z: mid, ry: w.into > 0 ? Math.PI / 2 : -Math.PI / 2 };
}
