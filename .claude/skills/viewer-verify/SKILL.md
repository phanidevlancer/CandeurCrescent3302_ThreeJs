---
name: viewer-verify
description: Verify any change to the walkthrough viewer before reporting it done — syntax + swallowed-code lint, headless audits (clashes, door leaves, floating) compared against the previous variant, and renders you actually look at (including a top-down orientation check). Use after every edit to app.js, layouts/**, or a new model/design.
---

# Verify a viewer change

## 1. Static checks (every edit)
- Syntax: copy the file to the scratchpad with an `.mjs` extension and `node --check` it (layout files are ES modules).
- `python3 tools/lint_swallowed_code.py` → must print `0 suspicious line(s)`. A `// comment` appended mid-line by a python/sed replace has silently swallowed code at least four times (shelves vanished, vase stems broke the build).
- Strings inside layout files: an apostrophe in a single-quoted summary ("set's") breaks the module — use ’ or rephrase.

## 2. Headless audits — `tools/headless.mjs`
Server on :8000 must be running (`python3 tools/serve.py 8000`, background). The tool retries automatically when the viewer never reports ready.
```
node tools/headless.mjs --eval '(async()=>{ await __app.setRoomLayout("Kitchen","option1"); __app.setVariant("Kitchen","teak-blue","design");
  const a=__app.audit(), f=__app.auditFloating(), d=__app.auditDoorLeaves();
  return { hits:(a.hits||a).filter(h=>JSON.stringify(h).includes("kitchen")), floating:(f.floating||f).filter(x=>x.id.startsWith("kitchen")).map(x=>x.id), doorLeaves:d.length } })()'
```
- ALWAYS compare against the state before your change (e.g. the 'original' / previous variant) — many flags (projector screens, canopies, ceiling lamps, desk chair vs work-wall) pre-exist; only NEW ones are yours to fix.
- Check every variant combination you touched (design × chimney × fridge for the kitchen; all 4 master options for a bed).
- Audit false positives come from bounding boxes: a flush finish (tile, skirting) grouped with cabinets makes the group's box swallow door swings → put flush finishes in their own group. Angled (45°) cab leaves need `noFront: true` in their mover spec.
- Gotchas in `--eval` / template strings: never `\/` inside a regex literal (it becomes `/` → "Invalid regular expression flags"); use `startsWith` / `===`. `process.env` does not exist in the page — interpolate on the Node side.

## 3. Renders you look at
```
echo '[{"name":"east","view":{"x":7.7,"z":3.32,"yaw":-1.5708,"pitch":0.03,"eye":1.5},"fov":75},
       {"name":"top","view":{"x":1.6,"z":3.3,"yaw":0,"pitch":-1.5,"eye":2.85},"fov":75}]' > shots.json
node tools/headless.mjs --setup '(async()=>{await __app.setRoomLayout("Master bedroom","option1");return "ok"})()' --shots shots.json --out <scratch>/renders
```
- yaw 0 = facing north (−z), π/2 = west, π = south, −π/2 = east; pitch −1.5 = plan view. Use the plan view for ORIENTATION (headboard against the bed wall, sofa back to the wall, nothing rotated/skewed) — perspective thumbnails hid a 90°/17° mistake.
- Look at every image yourself (Read the jpg); stitch several with PIL into one grid to save context. Check: things in walls, items floating, blocked passages/doors, leftovers of hidden v1 items (pattern pieces, cushions, pots), z-fighting floors, orientation.
- For the owner's comparisons, render matching camera views per variant (same shots.json).

## 4. Report honestly
State which audits ran, what was pre-existing vs fixed, and anything left. Never claim a variant works without rendering it.
