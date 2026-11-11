import bpy, sys, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]; src, out, keep = argv
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.context.scene.objects):
    if o.type == 'MESH' and o.name != keep: bpy.data.objects.remove(o, do_unlink=True)
ob = bpy.data.objects[keep]
bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
parts = [o for o in bpy.context.scene.objects if o.type == 'MESH']
def dims(o):
    pts = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
    lo = [min(p[i] for p in pts) for i in range(3)]; hi = [max(p[i] for p in pts) for i in range(3)]
    return lo, hi
info = []
for o in parts:
    lo, hi = dims(o); info.append((o, lo, hi))
zmin = min(l[2] for _, l, _ in info)
for o, lo, hi in sorted(info, key=lambda t: -((t[2][0]-t[1][0])*(t[2][1]-t[1][1])*(t[2][2]-t[1][2])))[:40]:
    print('P', o.name, [round(h - l, 1) for l, h in zip(lo, hi)], 'z0', round(lo[2] - zmin, 1), 'c', [round((l + h) / 2, 1) for l, h in zip(lo, hi)])
# keep only the sofa's own pieces: cushions, back, arms, base (all ≥ 10 cm in every direction or long trims inside the
# footprint); drop paper-thin parts (magazines / book covers / pages) and anything whose centre is in front of the chaise
big = [(o, lo, hi) for o, lo, hi in info if min(h - l for l, h in zip(lo, hi)) >= 10]
fx0 = min(l[0] for _, l, _ in big) - 2; fx1 = max(h[0] for _, _, h in big) + 2; fy0 = min(l[1] for _, l, _ in big) - 2; fy1 = max(h[1] for _, _, h in big) + 2
inside = lambda lo, hi: fx0 <= lo[0] and hi[0] <= fx1 and fy0 <= lo[1] and hi[1] <= fy1
drop = [o for o, lo, hi in info if min(h - l for l, h in zip(lo, hi)) < 1.5 or not inside(lo, hi) or (max(h - l for l, h in zip(lo, hi)) < 35 and (hi[2]-lo[2]) < 6 and min(h - l for l, h in zip(lo, hi)) < 6)]
print('FOOT', round(fx0), round(fx1), round(fy0), round(fy1), 'KEEP', len(info) - len(drop))
print('DROPSIZES', [[round(h - l, 1) for l, h in zip(lo, hi)] + [round(lo[2]-zmin,1)] for o, lo, hi in info if o in drop])
for o in drop: bpy.data.objects.remove(o, do_unlink=True)
rest = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in rest: o.select_set(True)
bpy.context.view_layer.objects.active = rest[0]; bpy.ops.object.join()
o = bpy.context.view_layer.objects.active; o.name = 'sofa'
lo, hi = dims(o); print('KEPT', [round(h - l, 3) for l, h in zip(lo, hi)], 'tris', sum(len(p.vertices) - 2 for p in o.data.polygons))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=False, export_image_format='JPEG', export_jpeg_quality=88)
print('DONE')
