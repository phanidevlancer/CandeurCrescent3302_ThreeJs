"""Export the Blender home to the three.js walkthrough.
Usage: Blender -b <home.blend> --python export_home.py -- <walkthrough_dir> <architecture.json>
Never saves the .blend. Writes home.glb, rooms.json, lights.json, walls.json, grid.npy, grid_meta.json.
Coordinates: three (x, y, z) = Blender (x, z, -y)."""
import bpy, json, numpy as np, mathutils, sys, os, re, math
from mathutils.bvhtree import BVHTree
argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
ARCH = argv[1] if len(argv) > 1 else os.path.join(os.path.dirname(OUT), 'architecture.json')
EXCL = ("00 ", "31b", "31c", "37 ", "38 ", "39b", "81 ", "85 ", "86 ", "91 ", "94 ")
vl = bpy.context.view_layer
def walk(lc):
    yield lc
    for c in lc.children: yield from walk(c)
inc = set()
for lc in walk(vl.layer_collection):
    if lc.name == vl.layer_collection.name: continue
    if lc.name.startswith(EXCL): lc.exclude = True
    else:
        lc.exclude = False; lc.hide_viewport = False; lc.collection.hide_viewport = False
        inc.add(lc.collection.name)
bpy.ops.object.select_all(action='DESELECT')
objs = []
for o in bpy.data.objects:
    if o.type in ('MESH', 'CURVE') and o.name in vl.objects and any(c.name in inc for c in o.users_collection):
        o.hide_set(False); o.hide_viewport = False; o.select_set(True); objs.append(o)
dg = bpy.context.evaluated_depsgraph_get()

def T(v): return [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]          # Blender → three
def bb(o):
    pts = [o.matrix_world @ mathutils.Vector(v) for v in o.bound_box]
    return (min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts), max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts))
def col(o): return o.users_collection[0].name if o.users_collection else ''
def cat(o):
    for c in [c.name for c in o.users_collection]:
        if c.startswith(("01 ", "02 ", "03 ")): return "arch"
        if c.startswith("04 "): return "floor"
        if c.startswith("90 "): return "ceiling"
        if c.startswith("92 "): return "ceilfix"
        if c.startswith("95 "): return "exterior"
    return "furn"
def base(n): return re.sub(r"\.\d+$", "", n)
def stem(o):
    w = base(o.name).split()
    # names like "Approved H1 sectional ..." / "Approved dining ..." need a third word, or whole rooms merge into one group
    n = 3 if w and w[0].lower() == 'approved' else 2
    return " ".join(w[:n]).lower()
def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip('-')

arch = json.load(open(ARCH)); R = arch['rooms']; rn = list(R)
boxes = {o.name: bb(o) for o in objs}
for o in objs:
    b = boxes[o.name]; c = cat(o); o["cat"] = c; o["col"] = col(o)[:3].strip()
    cx = (b[0] + b[3]) / 2; cy = (b[1] + b[4]) / 2; rooms = []
    if c == "furn":
        cand = [(r, (R[r]['bounds'][2] - R[r]['bounds'][0]) * (R[r]['bounds'][3] - R[r]['bounds'][1])) for r in rn
                if R[r]['bounds'][0] - 0.05 <= cx <= R[r]['bounds'][2] + 0.05 and R[r]['bounds'][1] - 0.05 <= cy <= R[r]['bounds'][3] + 0.05]
        if cand: rooms = [min(cand, key=lambda t: t[1])[0]]
        else:
            def dist(r):
                x0, y0, x1, y1 = R[r]['bounds']; return max(x0 - cx, 0, cx - x1) ** 2 + max(y0 - cy, 0, cy - y1) ** 2
            rooms = [min(rn, key=dist)]
    elif c in ("arch", "floor", "ceiling", "ceilfix"):
        for r in rn:
            x0, y0, x1, y1 = R[r]['bounds']
            if b[0] < x1 + .25 and b[3] > x0 - .25 and b[1] < y1 + .25 and b[4] > y0 - .25: rooms.append(r)
    o["rooms"] = "|".join(rooms)

# ---------- BVH of static geometry (for hinge/front tests and wall survey) ----------
def bvh_of(obs):
    vs, fs = [], []
    for o in obs:
        me = o.evaluated_get(dg).to_mesh()
        if me is None: continue
        mw = o.matrix_world; off = len(vs)
        vs += [mw @ v.co for v in me.vertices]; fs += [[off + i for i in p.vertices] for p in me.polygons]
        o.evaluated_get(dg).to_mesh_clear()
    return BVHTree.FromPolygons(vs, fs)
def ray(tree, org, d, far=10):
    h = tree.ray_cast(mathutils.Vector(org), mathutils.Vector(d), far); return h[3] if h[0] else None

# ---------- movable parts: doors, wardrobe/cabinet fronts, drawers, sliders ----------
RX_DOOR = re.compile(r"teak leaf$|door slab OPEN$")
RX_CAB = re.compile(r"wardrobe door$|loft door$|sage front$|lower front$|Overhead .*door$|Flush concealed electronics door$|mirror door oak bead frame$")
RX_SLIDE = re.compile(r"Slider \d greige panel$|sliding full-height fr|sliding door glass$")
RX_DRAWER = re.compile(r"drawer front$")
prim = []
for o in objs:
    n = base(o.name)
    t = 'door' if RX_DOOR.search(n) else 'cab' if RX_CAB.search(n) else 'slide' if RX_SLIDE.search(n) else 'drawer' if RX_DRAWER.search(n) else None
    if t: prim.append((o, t))
primset = {o.name for o, _ in prim}
static = [o for o in objs if o.name not in primset and o["cat"] not in ("floor", "ceiling", "ceilfix", "exterior")]
attached = {}
def contained(a, b, e):  # bbox a inside b expanded by e (per-axis)
    return all(a[i] >= b[i] - e[i] and a[i + 3] <= b[i + 3] + e[i] for i in range(3))
for o, t in prim:
    b = boxes[o.name]; s = [b[3] - b[0], b[4] - b[1], b[5] - b[2]]
    thin = 0 if s[0] < s[1] else 1
    e = [0.01, 0.01, 0.01]; e[thin] = 0.07
    for q in objs:
        if q.name in primset or q.name in attached or col(q) != col(o): continue
        qb = boxes[q.name]; qn = base(q.name)
        if t == 'drawer':
            if 'drawer' in qn.lower() and qb[0] < b[3] + .05 and qb[3] > b[0] - .05 and qb[1] < b[4] + .05 and qb[4] > b[1] - .05 and qb[2] < b[5] + .02 and qb[5] > b[2] - .02:
                attached[q.name] = o.name
        elif t == 'slide' and re.match(r"Slider \d", base(o.name)):
            if qn.split(' ')[:2] == base(o.name).split(' ')[:2]: attached[q.name] = o.name
        elif contained(qb, b, e) and max(qb[3] - qb[0], qb[4] - qb[1]) <= max(s[0], s[1]) * 1.05:
            attached[q.name] = o.name
static = [o for o in static if o.name not in attached]
print("movable primaries", len(prim), "attached parts", len(attached))
SB = bvh_of(static)
AB = bvh_of([o for o in static if o['cat'] == 'arch'])   # walls/frames only: used to find door jambs
movers = {}
cab_runs = {}
for o, t in prim:
    b = boxes[o.name]; c = mathutils.Vector(((b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2))
    s = [b[3] - b[0], b[4] - b[1]]
    mid = slug(o.users_collection[0].name[:3] + ' ' + base(o.name)) + '-' + str(len(movers))
    parts = [o] + [bpy.data.objects[q] for q, p in attached.items() if p == o.name]
    pulls = [p for p in parts[1:] if re.search(r"handle|pull|knob", p.name, re.I)]
    info = {'type': t}
    if t in ('door', 'cab'):
        th = o.matrix_world.to_euler().z
        if t == 'door':
            if o.dimensions.y > o.dimensions.x: th += math.pi / 2            # leaf modelled along local Y
            L = max(o.dimensions.x, o.dimensions.y); ax = mathutils.Vector((math.cos(th), math.sin(th), 0))
        else:  # axis-aligned cabinet door: long horizontal axis
            L = max(s); ax = mathutils.Vector((1, 0, 0)) if s[0] >= s[1] else mathutils.Vector((0, 1, 0)); th = math.atan2(ax.y, ax.x)
        cc = mathutils.Vector((c.x, c.y, 0))
        e1 = cc + ax * (L / 2); e2 = cc - ax * (L / 2)
        # room doors: the frame's two "<door> jamb" objects give the exact doorway (closed leaf runs jamb → jamb)
        jambs = []
        if t == 'door' and base(o.name).endswith(' teak leaf'):
            jn = base(o.name)[:-len(' teak leaf')] + ' jamb'
            jambs = [mathutils.Vector((q.matrix_world.translation.x, q.matrix_world.translation.y, 0)) for q in bpy.data.objects if base(q.name) == jn]
        if len(jambs) == 2:
            hj = min(jambs, key=lambda j: min((j - e1).length, (j - e2).length)); oj = jambs[1] if hj is jambs[0] else jambs[0]
            hinge = e1 if (e1 - hj).length < (e2 - hj).length else e2
        elif pulls:
            pc = mathutils.Vector(((boxes[pulls[0].name][0] + boxes[pulls[0].name][3]) / 2, (boxes[pulls[0].name][1] + boxes[pulls[0].name][4]) / 2, 0))
            hinge = e1 if (e1 - pc).length > (e2 - pc).length else e2
        else:
            key = (col(o), round(c.y if ax.x else c.x, 1)); cab_runs.setdefault(key, []).append(o.name)
            hinge = e2 if len(cab_runs[key]) % 2 else e1
        free = e1 if hinge is e2 else e2
        fdir = (free - hinge).normalized()
        cur = math.atan2(fdir.y, fdir.x)
        z = 1.0 if t == 'door' else c.z
        if t == 'door' and len(jambs) == 2:
            # closed = along the doorway; open = 90° to the side the leaf is modelled ajar on (the designed swing)
            closed = math.atan2(oj.y - hj.y, oj.x - hj.x)
            diff = math.atan2(math.sin(cur - closed), math.cos(cur - closed))
            sgn = 1 if diff > 0 else -1
            openA = closed + sgn * math.radians(90)
            d0 = math.atan2(math.sin(closed - cur), math.cos(closed - cur)); d1 = math.atan2(math.sin(openA - cur), math.cos(openA - cur))
            info.update(a0=d0, a1=d1, start=1, block=1)
        elif t == 'door':
            dists = []
            for k in range(4):
                a = k * math.pi / 2; d = mathutils.Vector((math.cos(a), math.sin(a), 0))
                h = ray(AB, (hinge.x + d.x * 0.02, hinge.y + d.y * 0.02, z), d, 3); dists.append((h if h is not None else 9, a))
            blocked = min(dists)[1]; closed = blocked + math.pi
            diff = math.atan2(math.sin(cur - closed), math.cos(cur - closed))
            if abs(diff) < math.radians(4):
                l = ray(SB, (free.x, free.y, z), mathutils.Vector((-math.sin(closed), math.cos(closed), 0)), 3) or 9
                r = ray(SB, (free.x, free.y, z), mathutils.Vector((math.sin(closed), -math.cos(closed), 0)), 3) or 9
                sgn = 1 if l > r else -1
            else: sgn = 1 if diff > 0 else -1
            openA = closed + sgn * math.radians(90)
            d0 = math.atan2(math.sin(closed - cur), math.cos(closed - cur)); d1 = math.atan2(math.sin(openA - cur), math.cos(openA - cur))
            info.update(a0=d0, a1=d1, start=1, block=1)
        else:
            n = mathutils.Vector((-ax.y, ax.x, 0))
            f1 = ray(SB, (c.x + n.x * 0.03, c.y + n.y * 0.03, c.z), n, 3) or 9
            f2 = ray(SB, (c.x - n.x * 0.03, c.y - n.y * 0.03, c.z), -n, 3) or 9
            front = n if f1 > f2 else -n
            rot = lambda v, a: mathutils.Vector((v.x * math.cos(a) - v.y * math.sin(a), v.x * math.sin(a) + v.y * math.cos(a), 0))
            sgn = 1 if rot(fdir, math.radians(90)).dot(front) > 0 else -1
            info.update(a0=0.0, a1=sgn * math.radians(100), start=0)
        info.update(hinge=T((hinge.x, hinge.y, 0)), len=L, dir=[round(fdir.x, 4), round(-fdir.y, 4)])
    elif t == 'slide':
        ax = mathutils.Vector((1, 0, 0)) if s[0] >= s[1] else mathutils.Vector((0, 1, 0)); w = max(s)
        sibs = [q for q, tt in prim if tt == 'slide' and q is not o and col(q) == col(o) and abs(((boxes[q.name][1] + boxes[q.name][4]) / 2 if ax.x else (boxes[q.name][0] + boxes[q.name][3]) / 2) - (c.y if ax.x else c.x)) < 0.15
                and abs(((boxes[q.name][0] + boxes[q.name][3]) / 2 if ax.x else (boxes[q.name][1] + boxes[q.name][4]) / 2) - (c.x if ax.x else c.y)) < 1.5 * w]
        if sibs:
            cen = sum((((boxes[q.name][0] + boxes[q.name][3]) / 2 if ax.x else (boxes[q.name][1] + boxes[q.name][4]) / 2) for q in sibs)) / len(sibs)
            sgn = 1 if cen > (c.x if ax.x else c.y) else -1; dist = 0.92 * w
        else: sgn, dist = 1, 0.48 * w
        v = ax * sgn * dist
        info.update(slide=T(v), start=0, block=0 if sibs else 1)
    else:  # drawer
        ax = mathutils.Vector((1, 0, 0)) if s[0] >= s[1] else mathutils.Vector((0, 1, 0)); n = mathutils.Vector((-ax.y, ax.x, 0))
        f1 = ray(SB, (c.x + n.x * 0.03, c.y + n.y * 0.03, c.z), n, 3) or 9
        f2 = ray(SB, (c.x - n.x * 0.03, c.y - n.y * 0.03, c.z), -n, 3) or 9
        front = n if f1 > f2 else -n
        depth = max([min(boxes[p.name][3] - boxes[p.name][0], boxes[p.name][4] - boxes[p.name][1]) for p in parts] + [0.3])
        info.update(slide=T(front * 0.75 * depth), start=0, block=0)
    movers[mid] = info
    for p in parts: p["mov"] = mid
    o["movInfo"] = json.dumps(info)
print("movers", len(movers), {t: sum(1 for m in movers.values() if m['type'] == t) for t in ('door', 'cab', 'slide', 'drawer')})

# ---------- furniture groups (stable, readable ids) ----------
par = {}
def find(a):
    while par[a] != a: par[a] = par[par[a]]; a = par[a]
    return a
bucket = {}
for o in objs:
    if o["cat"] == "furn":
        par[o.name] = o.name; bucket.setdefault((o["rooms"], stem(o)), []).append(o.name)
E = 0.04
for k, names in bucket.items():
    for i in range(len(names)):
        a = boxes[names[i]]
        for j in range(i + 1, len(names)):
            b = boxes[names[j]]
            if a[0] <= b[3] + E and b[0] <= a[3] + E and a[1] <= b[4] + E and b[1] <= a[4] + E and a[2] <= b[5] + E and b[2] <= a[5] + E:
                par[find(names[i])] = find(names[j])
clusters = {}
for o in objs:
    if o["cat"] == "furn": clusters.setdefault(find(o.name), []).append(o)
named = {}
for r, members in clusters.items():
    o0 = members[0]; key = slug(o0["rooms"]) + '/' + slug(stem(o0))
    mn = (round(min(boxes[m.name][0] for m in members), 2), round(min(boxes[m.name][1] for m in members), 2))
    named.setdefault(key, []).append((mn, members))
for key, lst in named.items():
    for i, (mn, members) in enumerate(sorted(lst, key=lambda t: t[0])):
        for m in members: m["grp"] = f"{key}#{i}"
print("furniture groups", sum(len(v) for v in named.values()))

rooms_out = {}
for r in rn:
    x0, y0, x1, y1 = R[r]['bounds']
    rooms_out[r] = dict(x0=x0, x1=x1, z0=-y1, z1=-y0, mm=R[r]['label_mm'])
json.dump(rooms_out, open(os.path.join(OUT, 'rooms.json'), 'w'))

# ---------- wall survey: bare wall spans per room side (for finishes) ----------
WB = bvh_of([o for o in static])
walls = {}
STEP, HTS = 0.05, (0.35, 1.2, 2.0)
for r in rn:
    x0, y0, x1, y1 = R[r]['bounds']; sides = []
    for side, (ax0, ax1, fixed, d) in {'N': ((x0, x1), None, y1, (0, 1)), 'S': ((x0, x1), None, y0, (0, -1)),
                                       'E': ((y0, y1), None, x1, (1, 0)), 'W': ((y0, y1), None, x0, (-1, 0))}.items():
        a0, a1 = ax0; spans = []; cur = None
        n = int((a1 - a0) / STEP)
        for i in range(n + 1):
            t = a0 + i * STEP
            st = 'bare'
            for hz in HTS:
                if d[0] == 0: org = (t, fixed - d[1] * 0.5, hz)
                else: org = (fixed - d[0] * 0.5, t, hz)
                h = ray(WB, org, (d[0], d[1], 0), 1.5)
                if h is None or h > 0.75: st = 'open'; break
                if h < 0.47: st = 'feature' if st != 'open' else st
            if cur and cur[2] == st: cur[1] = t
            else:
                if cur: spans.append(cur)
                cur = [t, t, st]
        if cur: spans.append(cur)
        sides.append({'side': side, 'fixed': fixed, 'spans': [[round(a, 3), round(b, 3), s] for a, b, s in spans if b - a >= 0.1 or s != 'bare']})
    walls[r] = sides
json.dump({'note': 'Blender plan coords: N/S walls run along x at y=fixed; E/W along y at x=fixed. bare = plain wall, feature = existing joinery/cladding in front, open = door/window/opening.', 'rooms': walls},
          open(os.path.join(OUT, 'walls.json'), 'w'), indent=0)

print("EXPORT OBJECTS", len(objs))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'home.glb'), export_format='GLB', use_selection=True, export_apply=True,
    export_cameras=False, export_lights=False, export_yup=True, export_extras=True, export_image_format='JPEG', export_jpeg_quality=85)
lights = []
for o in bpy.data.objects:
    if o.type == 'LIGHT' and any(c.name in inc for c in o.users_collection):
        m = o.matrix_world.translation
        lights.append(dict(x=round(m.x, 3), y=round(m.z, 3), z=round(-m.y, 3), e=o.data.energy, c=[round(v, 3) for v in o.data.color]))
json.dump(lights, open(os.path.join(OUT, 'lights.json'), 'w'))
print("LIGHTS", len(lights))

# ---------- collision grid: walls/architecture only ----------
CELL = 0.05; X0, X1, Y0, Y1 = -1.0, 13.0, -7.6, 9.8
nx = int((X1 - X0) / CELL); ny = int((Y1 - Y0) / CELL)
grid = np.zeros((ny, nx), dtype=np.uint8)
ZLO, ZHI = 0.25, 1.7
for o in objs:
    # furniture (cat furn) collides via per-group footprints in the viewer, so it follows edits; movers collide dynamically
    if o["cat"] in ("floor", "ceiling", "ceilfix", "exterior", "furn") or "mov" in o.keys(): continue
    eo = o.evaluated_get(dg) if o.type != 'MESH' else None
    me = o.data if o.type == 'MESH' else eo.to_mesh()
    if me is None or len(me.polygons) == 0: continue
    me.calc_loop_triangles(); nv = len(me.vertices)
    if nv == 0 or not me.loop_triangles: continue
    co = np.empty(nv * 3, dtype=np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    M = np.array(o.matrix_world, dtype=np.float32); w = co @ M[:3, :3].T + M[:3, 3]
    tr = np.empty(len(me.loop_triangles) * 3, dtype=np.int32); me.loop_triangles.foreach_get('vertices', tr); tr = tr.reshape(-1, 3)
    TT = w[tr]; zmin = TT[:, :, 2].min(1); zmax = TT[:, :, 2].max(1); TT = TT[(zmax > ZLO) & (zmin < ZHI)]
    for t in TT:
        a, b, c = t[:, :2]
        xmn = min(a[0], b[0], c[0]); xmx = max(a[0], b[0], c[0]); ymn = min(a[1], b[1], c[1]); ymx = max(a[1], b[1], c[1])
        i0 = max(int((xmn - X0) / CELL), 0); i1 = min(int((xmx - X0) / CELL), nx - 1); j0 = max(int((ymn - Y0) / CELL), 0); j1 = min(int((ymx - Y0) / CELL), ny - 1)
        if i1 < i0 or j1 < j0: continue
        if i1 - i0 <= 1 and j1 - j0 <= 1: grid[j0:j1 + 1, i0:i1 + 1] = 1; continue
        xs = X0 + (np.arange(i0, i1 + 1) + 0.5) * CELL; ys = Y0 + (np.arange(j0, j1 + 1) + 0.5) * CELL
        PX, PY = np.meshgrid(xs, ys)
        d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if abs(d) < 1e-9:
            for p, q in ((a, b), (b, c), (c, a)):
                for s in np.linspace(0, 1, max(2, int(np.hypot(*(q - p)) / CELL * 2))):
                    x, y = p + (q - p) * s; ii = int((x - X0) / CELL); jj = int((y - Y0) / CELL)
                    if 0 <= ii < nx and 0 <= jj < ny: grid[jj, ii] = 1
            continue
        l1 = ((b[1] - c[1]) * (PX - c[0]) + (c[0] - b[0]) * (PY - c[1])) / d
        l2 = ((c[1] - a[1]) * (PX - c[0]) + (a[0] - c[0]) * (PY - c[1])) / d
        l3 = 1 - l1 - l2; e = CELL * 0.5 / np.sqrt(abs(d))
        grid[j0:j1 + 1, i0:i1 + 1] |= ((l1 >= -e) & (l2 >= -e) & (l3 >= -e)).astype(np.uint8)
np.save(os.path.join(OUT, 'grid.npy'), grid)
json.dump(dict(x0=X0, y0=Y0, cell=CELL, nx=nx, ny=ny), open(os.path.join(OUT, 'grid_meta.json'), 'w'))
print("grid blocked", int(grid.sum()))
