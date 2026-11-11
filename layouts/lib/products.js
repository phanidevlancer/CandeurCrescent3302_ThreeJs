// Helpers for placing real product models (assets/abo/manifest.json) with a fallback when a model is unavailable.
// Every product is placed by the centre of its BACK face; ry: 0 = front faces +z (south), π = north, π/2 = east, −π/2 = west.
export function placeProduct(ctx, key, id, label, x, z, ry, opts = {}) {
  const m = ctx.lib.model(key);
  if (!m) return null;
  return ctx.add(id, m, x, z, ry, { name: label, ...opts });
}
