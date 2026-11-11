# Sink cabinet A (cirno, CC BY 4.0): keep frame_0 (integrated top + tap + props), close the open bottom drawer using the
# frame_1 cabinet (same mesh, other drawer open), split carcass / top drawer / bottom drawer, bake transforms, re-origin
# (floor, back face centre, front = Blender -Y = three +Z).
import bpy, sys, bmesh, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]; src, out = argv
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ob = {o.name: o for o in bpy.context.scene.objects}
root = [o for o in ob.values() if o.parent is None][0]; R = root.matrix_world.copy()
c0, c1 = ob['Object_10'].data, ob['Object_4'].data
assert len(c0.vertices) == len(c1.vertices)
top_v, bot_v = set(), set(); dmax = 0
for i, (a, b) in enumerate(zip(c0.vertices, c1.vertices)):
    pa, pb = R @ a.co, R @ b.co; d = pa - pb
    if d.length < 1e-5: continue
    dmax = max(dmax, abs(d.x) + abs(d.z))
    if pa.y > pb.y: top_v.add(i)      # frame_0 further back = closed → top drawer (open in frame_1)
    else: bot_v.add(i)                # frame_0 further front = bottom drawer open in frame_0
print('top verts', len(top_v), 'bottom verts', len(bot_v), 'xz drift', dmax)
# shift of the bottom drawer: closed - open in Blender-local coords of the mesh
shift_local = None
for i in bot_v:
    shift_local = c1.vertices[i].co - c0.vertices[i].co; break
print('bottom drawer local shift', shift_local, 'root', (R.to_3x3() @ shift_local))
# close the bottom drawer in frame_0 mesh
for i in bot_v: c0.vertices[i].co = c1.vertices[i].co.copy()
# towels inside the open bottom drawer (Object_11 parts below the counter) move with it
f0 = ob['Object_11']; bm = bmesh.new(); bm.from_mesh(f0.data); bm.verts.ensure_lookup_table()
seen = set(); towels = []
for v in bm.verts:
    if v.index in seen: continue
    st = [v]; comp = []; seen.add(v.index)
    while st:
        a = st.pop(); comp.append(a.index)
        for e in a.link_edges:
            b = e.other_vert(a)
            if b.index not in seen: seen.add(b.index); st.append(b)
    zmax = max((R @ bm.verts[k].co).z for k in comp)
    if zmax < 0.6: towels += comp
bm.free()
for k in towels: f0.data.vertices[k].co += shift_local
print('towel verts moved', len(towels))
# split helpers
def split(src_obj, vset, name):
    me = src_obj.data; new = src_obj.copy(); new.data = me.copy(); new.name = name; bpy.context.collection.objects.link(new)
    bmA = bmesh.new(); bmA.from_mesh(new.data); bmA.verts.ensure_lookup_table()
    bmesh.ops.delete(bmA, geom=[v for v in bmA.verts if v.index not in vset], context='VERTS'); bmA.to_mesh(new.data); bmA.free()
    return new
car = ob['Object_10']
dt = split(car, top_v, 'drawer_top'); db = split(car, bot_v, 'drawer_bottom')
bmC = bmesh.new(); bmC.from_mesh(car.data); bmC.verts.ensure_lookup_table()
bmesh.ops.delete(bmC, geom=[v for v in bmC.verts if v.index in top_v or v.index in bot_v], context='VERTS'); bmC.to_mesh(car.data); bmC.free(); car.name = 'carcass'
tw = split(f0, set(towels), 'drawer_bottom_towels')
bmP = bmesh.new(); bmP.from_mesh(f0.data); bmP.verts.ensure_lookup_table()
bmesh.ops.delete(bmP, geom=[v for v in bmP.verts if v.index in set(towels)], context='VERTS'); bmP.to_mesh(f0.data); bmP.free(); f0.name = 'props'
ob['Object_9'].name = 'top'
for n in ['Object_4', 'Object_5', 'Object_6']: bpy.data.objects.remove(ob[n], do_unlink=True)
keep = [car, dt, db, tw, f0, ob['Object_9']]
for o in keep:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
for o in list(bpy.context.scene.objects):
    if o not in keep: bpy.data.objects.remove(o, do_unlink=True)
for o in keep: o.select_set(True)
bpy.context.view_layer.objects.active = car
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# towels belong to the bottom drawer: join them into it
bpy.ops.object.select_all(action='DESELECT'); tw.select_set(True); db.select_set(True); bpy.context.view_layer.objects.active = db; bpy.ops.object.join()
keep = [o for o in bpy.context.scene.objects if o.type == 'MESH']
pts = [o.matrix_world @ v.co for o in keep for v in o.data.vertices]
lo = [min(p[i] for p in pts) for i in range(3)]; hi = [max(p[i] for p in pts) for i in range(3)]
off = mathutils.Vector((-(lo[0] + hi[0]) / 2, -hi[1], -lo[2]))   # back face (max Blender y) at 0, floor at 0
for o in keep:
    for v in o.data.vertices: v.co += off
for o in keep:
    p = [v.co for v in o.data.vertices]
    l = [min(q[i] for q in p) for i in range(3)]; h = [max(q[i] for q in p) for i in range(3)]
    print('PART', o.name, 'x', round(l[0], 3), round(h[0], 3), 'depth(front -y)', round(l[1], 3), round(h[1], 3), 'z', round(l[2], 3), round(h[2], 3), 'tris', sum(len(f.vertices) - 2 for f in o.data.polygons))
print('TOTAL', [round(h - l, 3) for l, h in zip(lo, hi)])
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=False, export_image_format='AUTO', export_extras=True)
print('DONE')
