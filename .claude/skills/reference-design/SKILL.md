---
name: reference-design
description: Turn an owner reference image ("this as another option", "apply this to my kitchen/puja/bedroom") into a complete, switchable design in the viewer — save + log the reference, build the whole look as a slot variant with a ⇄ icon, call out what cannot fit, verify, and document. Use whenever the owner pastes a reference image or asks for another option.
---

# Reference image → switchable design

You are the owners' interior designer (DESIGN_BRIEF.md). Owner rules that apply to every reference:
- Deliver the WHOLE look (finishes, joinery, lighting, furniture styling, decor, palette) — never one headline feature. Anything that cannot fit is named with the reason (e.g. breakfast peninsula would block the aisle; tall unit where the fridge bay is).
- Never change fixed constraints: 6×7 master bed, no pink bed, owners' desk size, sink/fridge/window positions (kitchen rule 23), door swings must stay clear, nothing floor-standing in walkways.
- "Another option" = ADD a variant; keep the existing ones (remove only when the owner says so).

## Steps
1. Save the image first: `references/<room-slug>/YYYY-MM-DD_<short-name>.<ext>` (pasted images live in the session's `images/<n>.png`). Check the real file type (`file …`) — pasted images are usually PNG.
2. Study it: list every element (fronts, handles, glass type, tiles/splash, worktop, lighting, open shelves, decor, floor). Map each to the actual room geometry (use scene-lookup for walls, openings, floor height, window positions).
3. Build it as a slot variant in the room's option module (`slots: [{ id, label, default, anchor:[x,y,z], variants:[{ id, ref, name, summary, search:[…] }] }]`). The anchor gives it a ⇄ icon; `ref` gives the 🖼 button; `search` gives Pinterest chips. Prefer extending an existing parametric builder in `layouts/lib/build.js` with a style flag over copy-pasting a new one (kitchen: `kitchenStyled`; puja: `pujaStoneShrine`/`pujaPanelShrine`; master: `bedWallStyled`, `gamingWall`).
4. Real materials, not hints: fluted/reeded glass = actual ribbed geometry (12–15 mm flutes, 3–4 mm deep, computed normals) + frosted material with a per-flute light/shade map; stone = canvas texture with veins/speckle; tiles = canvas pattern with UVs in metres. The owner calls flat stand-ins "lazy".
5. Every mesh gets ONE material (material arrays crash setShadowFlags). Canvas maps multiply the material colour → use white (or a grey multiplier for darkening).
6. Verify (viewer-verify): audits for every variant combination, renders of the same viewpoint as the reference (day + evening when lighting matters), compare side by side, fix what differs.
7. Document: row in `references/README.md` (date, room, file link, what was applied + where in code, what was not and why), `python3 tools/build_reference_index.py` (gallery), the room row in `DESIGN_BRIEF.md`, a dated line at the bottom of `CLAUDE.md`, and a memory note if the owner stated a durable rule.
8. Tell the owner how to reach it (which ⇄ icon / slot), what is in it, and what was left out and why.

## Owner corrections worth remembering
- "Continuity" between surfaces = one consistent element (a tile/finish line at the same height on every wall square), not more cupboards and not tiles all around a door.
- Corners: reachable corner units (diagonal / L with fillers, neighbours hinged away), never blind dead boxes.
- When the owner asks for several things in a row, finish and confirm each — they noticed when a request (the beds) was left waiting behind newer ones.
