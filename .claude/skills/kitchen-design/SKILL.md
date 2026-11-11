---
name: kitchen-design
description: Owner's mandatory kitchen rules and how the kitchen designs are built (layouts/kitchen/option1.js + lib.kitchenStyled) — use for any kitchen request: a new kitchen reference/style, chimney vs no-chimney, fridge bay, sink, splash continuity, corners, appliances on the platforms.
---

# Kitchen — rules + architecture

## Owner master rules (DESIGN_BRIEF rule 23 — never break)
- Parallel kitchen: EAST wall = 1.5 m window (z 2.0–3.5, sill at worktop height, head 2.28) with the hob under it (hob axis z 2.655) + sink at the RIGHT/south end of the east wall; WEST wall = prep platform + fridge bay at its right/north end; SOUTH wall = utility opening x 8.15–9.05 (head 2.18) that must stay clear. Never join the platforms (no L/U, no island, no peninsula).
- Every design concept exists as Version A (with chimney: hood 0.71 m over the hob, hung from a steel flat across the window, duct via the ceiling bulkhead to the pier) and Version B (no chimney: window fully clear, 9″ fan in the masonry pier north of the window) — same cabinets/materials/layout; slot `chimney`, same camera views when comparing.
- Fridge bay reserved for a double-door: today's single-door + removable pull-out larder (slot `fridge`).
- One splash line 0.97–1.55 m of the design's splash finish on EVERY wall square at the counters (north wall x 8.8–10.28, counter-end side walls, passage wall to the door frame), worktop-line trim + toe-kick skirting on free wall; no full-height surrounds.
- Corners: diagonal corner wall cabinets (620 × 620, 280 mm angled door between 50 mm fillers, opens 72°, `noFront: true`), runs' upper tiers stop at z 4.447, base runs end in a 30 mm filler at the south wall. Nothing floor-standing in the walkway.
- Appliances (owner models, every design): hob `gas_stove_no1`, sink `kitchen_sink_fiesta` (worktop cut-out), chimney `chimney_hood` (A only), fridge `fridge_sbs`, microwave + mixer on the west platform. West platform zoning: appliance zone at the south corner → prep zone (board centred) → fridge landing zone kept clear (pantry jars against the wall).

## Code map
- `layouts/kitchen/option1.js`: slots `design` (teak-blue | cashmere-sage | sage-walnut | oak-sage | terracotta-walnut; unknown ids fall back to teak-blue), `chimney`, `fridge`; places hob, sink is inside the builder, fridge/larder, microwave, mixer (`lib.mixerGrinder()`), pantry jars via `ctx.rigid`; hides the v1 cabinets/tiles/hood + `ctx.hideMovers(/^20-(overhead-warm-ivory|kitchen-east-lower|kitchen-west-sage)/)`.
- `lib.kitchenStyled({ style, chimney })` in `layouts/lib/build.js` returns `{ parts, moods }` (east, west, bridge, floor, utility band, passage finishes, northTile, cornerSE/SW, pendant). Runs are built in wall frames: east origin (10.28, 1.58) ry −π/2 (local x = z − 1.58), west origin (6.885, 5.06) ry π/2 (local x = 5.06 − z), bridge (6.885, 2.59), utility band on the south wall origin (9.66, 5.067) ry π. Worktop top 0.97; kitchen floor finish 0.056.
- Style flags: IS_TEAK, IS_SAGE (walnut + fluted cream), IS_OAK (HANDLED = bar pulls + no gola; TWO_TIER = solid lower + glass top tier; oak doors / sage drawers via `panelFront(w,h,upper,drawerFront)`), IS_TERRA (terracotta gola + greige uppers + walnut-framed real fluted glass `flutedPane` + leaf cement-tile floor). A new style = a new flag mapping: front/drawer/upper materials (CSM/CSG/OAKm), TILE (splash canvas), topMat, glass frame, tiers per wall, corner tiers, bridge, pendants, decor, floor — then add the variant to DESIGNS and the valid list in option1.js.
- Render checks: views wide {x 8.6, z 5.3, yaw 0}, east {7.7, 3.32, yaw −π/2}, west {9.45, 3.4, yaw π/2}, passage {8.6, 1.75, yaw π}; audit every design × chimney × fridge combination (viewer-verify).
