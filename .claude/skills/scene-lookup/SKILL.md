---
name: scene-lookup
description: Measure the real geometry of the home in the running viewer before placing anything — room bounds, wall faces, openings/doors/jambs/windows (sill/head), floor-finish heights, what a v1 group is made of (materials, bounds), which v1 movers sit outside groups. Use before positioning furniture, joinery or models, and when something "goes into the wall" or "blocks the way".
---

# Scene lookup recipes (run with `node tools/headless.mjs --eval '…'`)

Coordinates are three.js metres: x east, z south, y up; rooms in `rooms.json` (e.g. Kitchen x 6.885–10.28, z 1.572–5.067; Living x 3.838–10.28, z −4.303–0; Master x 0–3.658, z 0.2–5.067; Bedroom 2 x 1.68–4.78, z −8.313…−4.503).

- Room's groups with bounds: URL `?tour=1&dump=<Room name>` → `document.getElementById("dump").textContent` (id, name, Loose/Built, visible, x0 x1 y0 y1 z0 z1).
- Scene root: `let sc=__app.groups.values().next().value.pivot; while(sc.parent) sc=sc.parent; sc.updateMatrixWorld(true);` (the camera is NOT in the scene).
- Walls / openings: raycast along a wall at several heights with arch meshes only (`m.userData.cat==="arch"`), print the hit object name + distance, compress runs of equal hits. Names tell you piers, lintels, sills, jambs (`D1_bedroom_1_jamb`), window glass/frames. Openings show as long distances or other-room hits.
- Floor finish height: raycast down at a few points against `cat==="floor"` meshes (living 0.035, kitchen 0.056, master ≈ 0.06). Lift models to it.
- Ceiling: raycast up (kitchen 3.05; bulkheads/fascias show as `*_ceiling_side_fascia`).
- What a v1 group contains: `__app.groups.get(id).meshes` → material name + per-mesh bounds. Merged groups share meshes per material (e.g. Bedroom 2's bed + wardrobe + fluted wall are one group) → use `ctx.suppress(group, /material/)` or a triangle cut, not `ctx.hide`.
- v1 movers by position: `__app.items()` meshes with `userData.mov`, bounds in a region → ids like `20-overhead-…` that `ctx.hide` does not remove (`ctx.hideMovers(regex)`).
- Things by name anywhere: filter `[...__app.groups.values()]` by `/pouf|ottoman|tv|screen/i.test(g.id+" "+g.name)` — the visible "orange pouf" was `dedicated-child#0`, not `child-ottoman#0`.
- Known site facts: Hall 2 north wall solid only x 6.8–10.28 (bedroom passage x 4.95–6.5, entry column 6.6–6.8 sticks out to z −4.24); Hall 2 east wall is glazed z −4.27…−0.07 (keep 0.6 m clear unless the owner says otherwise — they preferred a full sofa 15 cm from it); TVs: formal hall north wall x 1.32–2.88, Hall 2 south wall x 7.89–9.35, master per option (55″).
