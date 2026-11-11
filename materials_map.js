// Blender material name → photographic Poly Haven material (CC0, files in assets/polyhaven/).
// The photo supplies the weave / grain / plaster relief; the colour is re-tinted to the designed colour
// (average of the baked Blender material, materials.json), so the palette stays the same.
// kind: fabric (cloth sheen), rug, wood, plaster, leather.  nstr = normal-map strength.
export const PBR_MAP = {
  // upholstery & soft furnishings
  '04 Natural linen upholstery': { ph: 'rough_linen', kind: 'fabric' },
  'Ivory cotton': { ph: 'rough_linen', kind: 'fabric' },
  'Approved B1 cream quilted cotton': { ph: 'rough_linen', kind: 'fabric' },
  'Approved B1 sage cotton': { ph: 'rough_linen', kind: 'fabric' },
  'Muted olive green textile': { ph: 'rough_linen', kind: 'fabric' },
  'Muted rose textile': { ph: 'rough_linen', kind: 'fabric' },
  'Indigo cotton': { ph: 'rough_linen', kind: 'fabric' },
  'Approved H2 taupe linen drape': { ph: 'rough_linen', kind: 'fabric' },
  'Approved dining cream boucle': { ph: 'curly_teddy_natural', kind: 'fabric', nstr: 1.2 },
  'Approved H1 cream sectional upholstery': { ph: 'curly_teddy_natural', kind: 'fabric', nstr: 1.0 },
  // rugs
  'Approved H1 beige wool rug': { ph: 'poly_wool_herringbone', kind: 'rug' },
  'Terracotta handloom': { ph: 'poly_wool_herringbone', kind: 'rug' },
  'Handwoven jute': { ph: 'hessian_230', kind: 'rug' },
  'Approved natural cane weave': { ph: 'hessian_230', kind: 'rug', nstr: 1.3 },
  // timber
  '02 Oiled teak - directional grain': { ph: 'teak_veneer', kind: 'wood' },
  'Approved mid walnut veneer': { ph: 'american_walnut_veneer', kind: 'wood' },
  'Dark walnut': { ph: 'american_walnut_veneer', kind: 'wood' },
  'Smoked walnut - master feature wall': { ph: 'smoked_walnut_veneer', kind: 'wood' },
  'Light natural timber': { ph: 'oak_veneer_01', kind: 'wood' },
  'Approved H1 pale oak veneer': { ph: 'oak_veneer_01', kind: 'wood' },
  // walls
  '01 Warm ivory lime plaster': { ph: 'plastered_wall', kind: 'plaster' },
  'Approved H1 warm beige wall': { ph: 'plastered_wall', kind: 'plaster' },
  'Approved H2 soft cream wall': { ph: 'plastered_wall', kind: 'plaster' },
  'Vestibule charcoal plaster': { ph: 'plastered_wall', kind: 'plaster' },
};
export const KIND = {
  fabric: { nstr: 1.0, sheen: 0.8, sheenRough: 0.65, rough: 1.0 },
  rug: { nstr: 1.1, sheen: 0.4, sheenRough: 0.8, rough: 1.0 },
  wood: { nstr: 0.55, sheen: 0, rough: 0.85, clearcoat: 0.12 },
  plaster: { nstr: 0.3, sheen: 0, rough: 1.0 },
  leather: { nstr: 0.8, sheen: 0, rough: 0.9 },
};
