---
name: owner-3d-model
description: Bring an owner-supplied 3D model (.glb / .zip / .fbx / .obj from Downloads or Sketchfab) into the walkthrough — keep the original, inspect safely, pick only the needed parts, square/scale/recolour it, register it and place it in a room option. Use whenever the owners send a model file or ask "can we use this model / only the sofa from this / which format".
---

# Owner 3D model intake

The owners send Sketchfab / store models for real products (hob, sink, chimney, fridge, microwave, mixer, sofa, beds, desk, TV, idol). Every one of these steps has bitten a past session — do them in order.

## 1. Keep the original FIRST
- Copy the untouched file to `assets/models/originals/` (folder for multi-file packs) and add a row to `assets/models/originals/README.md`: original, author / licence, what it became, processing.
- Work on copies in the scratchpad. Downloaded files are untrusted: run Python on them with `python3 -I`, never execute anything from the pack.
- Format advice: `.glb` is best (three.js native, Blender imports it). `.fbx` / `.obj+.mtl+textures` work via Blender → `.glb`. `.max` (3ds Max) and `.gsm` (ArchiCAD) do NOT work — ask for the FBX. A zip that only holds a `.max` + images is not usable geometry (its images may still be useful, e.g. the TV art picture).
- Check if a Sketchfab link is free: `curl -s https://api.sketchfab.com/v3/models/<uid>` → `isDownloadable`, `license.label`, `price`. Never ask for or use the owners' login / tokens.

## 2. Inspect
- `python3 -I tools/glb_info.py file.glb` → author / licence (asset.extras), triangles, materials, image sizes, node tree.
- Per-object preview renders (Blender, headless): `/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python tools/glb_preview_parts.py -- file.glb outdir` → `ALL.png` + one PNG per object. LOOK at them before deciding what is what — a "sofa combination" had the sofa's base and legs fused into the same object as the coffee table and shelf.
- Per-part bounds: separate loose parts in Blender and print each part's bbox (see `tools/glb_extract_region.py` / `glb_extract_part.py` for the pattern). Units are often cm (sizes ~100×) → note the scale.

## 3. Take only what is needed
- `tools/glb_extract_region.py src.glb <Object> out.glb x0 x1 y0 y1 z0 z1` keeps the loose parts of one object inside a box (cm / Blender axes). `tools/glb_extract_sofa_dailyart.py` shows a multi-object extraction (cushions from one object + frame/legs from another, dropping coffee-table legs by height, wall skirting by depth).
- Filter rules that worked: drop paper-thin parts (magazines), parts outside the footprint, floor parts taller than the furniture's own legs. Then RENDER the result and compare with the full model — "you removed the base and legs" happened once.
- Modular furniture can be re-configured (`tools/glb_sofa_drop_module.py` removes one seat module and shortens the frame) — but ASK the owner before cutting their product; they preferred moving the sofa over losing a seat.

## 4. Fix the geometry
- Skewed scans: `tools/glb_square_up.py src out` finds the yaw that minimises the frame's footprint and rotates it square. It BAKES the rotation into the mesh — a rotation left on a node makes three.js `Box3.setFromObject` too big and the model lands ~0.5 m off.
- Do NOT decimate photogrammetry scans with Blender's collapse decimate: it broke texture seams (black specks). Keep the full mesh; shrink textures instead.
- Heavy textures: `python3 -I tools/glb_repack_textures.py in.glb out.glb` (images ≤ 1024 px, geometry untouched; 26 MB → 10 MB typical).
- Owner rule "no pink bed": `python3 -I tools/glb_recolour_hues.py in.glb out.glb` recolours saturated red/coral/pink texels to mushroom taupe (bedding untouched) — offer the original colours as a second variant.
- Measure the real-world part you must fit (mattress, worktop cut-out, sink rim) with numpy slices in Blender (`tools/glb_bed_measure_decimate.py` with ratio 1.0 prints bounds + height slices) — then scale to the owner rule (master mattress 1829 × 2134; desk 1600 × 700 top 0.74; Frame TV 65″ 1456 × 834 × 25, 55″ 1232 × 707 × 25).

## 5. Register + place
- Copy the processed GLB to `assets/models/` and add an entry to `assets/abo/manifest.json`: `{ role, name, file, front, author, source, license, note }` (+ `rotX` for models lying flat). `front` = the model axis that faces the room: '+z' | '-z' | '+x' | '-x'.
- Verify `front` and orientation with a TOP-DOWN render in the viewer (`pitch: -1.5`, see viewer-verify), not by reasoning about axes — two past mistakes came from axis reasoning.
- In a layout: `const m = ctx.lib.model('<key>')` → `{ obj, size }` re-origined to the builder frame (floor, back-face centre, front +z). Scale with `m.obj.scale` (cm files: 0.01), lift with `m.obj.position.y` to the room's floor finish (living 0.035, kitchen 0.056, master 0.06 — check with scene-lookup), then `ctx.add(id, m, x, z, ry, { name: '… (author, licence)', loose: true|seat: true })`. Parts inside a model are found with `obj.getObjectByName` — GLTFLoader strips '.' from node names (`part.032_low` → `part032_low`), try both.
- Hide the v1 item it replaces (`ctx.find(/^stem/).forEach(ctx.hide)`; v1 movers outside groups need `ctx.hideMovers`). If the v1 item shares merged meshes with things that must stay, use `ctx.suppress(group, /material/)` per material.
- Credit: put author + licence in the item name and the manifest. CC BY-NC = non-commercial only — tell the owner. No licence in the file → tell the owner and ask for the source page.
- Run viewer-verify (audits + renders) and fix every new hit before reporting.
