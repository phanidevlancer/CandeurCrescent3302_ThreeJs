import bpy, sys, mathutils
argv = sys.argv[sys.argv.index('--') + 1:]; src, out = argv[:2]; MARGIN = float(argv[2]) if len(argv) > 2 else 15
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.context.scene.objects):
    if o.type == 'MESH' and o.name not in ('Object_9', 'Object_6'): bpy.data.objects.remove(o, do_unlink=True)
for nm in ('Object_9', 'Object_6'):
    ob = bpy.data.objects[nm]; bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
def split(nm):
    ob = bpy.data.objects[nm]; bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
    return [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name.startswith(nm)]
def bb(o):
    pts = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
    return [min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)]
P9 = split('Object_9'); info9 = [(o,) + tuple(bb(o)) for o in P9]
big = [(o, lo, hi) for o, lo, hi in info9 if min(h - l for l, h in zip(lo, hi)) >= 10]
fx0 = min(l[0] for _, l, _ in big); fx1 = max(h[0] for _, _, h in big); fy0 = min(l[1] for _, l, _ in big); fy1 = max(h[1] for _, _, h in big); fz0 = min(l[2] for _, l, _ in big)
inside = lambda lo, hi, m: fx0 - m <= lo[0] and hi[0] <= fx1 + m and fy0 - m <= lo[1] and hi[1] <= fy1 + m
keep9 = [o for o, lo, hi in info9 if min(h - l for l, h in zip(lo, hi)) >= 1.5 and inside(lo, hi, 2) and not (max(h - l for l, h in zip(lo, hi)) < 35 and (hi[2]-lo[2]) < 6 and min(h - l for l, h in zip(lo, hi)) < 6)]
P6 = split('Object_6'); info6 = [(o,) + tuple(bb(o)) for o in P6]
# frame + legs of the same sofa: inside its footprint (+ margin for the arms / plinth) and not above the cushion bottoms + 30 cm
# x: footprint + margin (arm panels stand outside the cushions); y: only the sofa's own depth (wall skirting behind and
# the coffee table in front are out); legs: the sofa's are ≈ 8 cm, the coffee table's 18 cm → drop floor parts taller than 12 cm
keep6 = [o for o, lo, hi in info6 if fx0 - MARGIN <= lo[0] and hi[0] <= fx1 + MARGIN and fy0 - 3 <= lo[1] and hi[1] <= fy1 + 3
         and hi[2] <= fz0 + 60 and not (lo[2] < 3 and hi[2] - lo[2] > 12 and max(hi[0] - lo[0], hi[1] - lo[1]) < 10)
         and not (lo[1] >= fy1 - 3 and lo[2] >= 15)]   # coffee-table panels standing at the sofa's front line
print('FOOT', round(fx0), round(fx1), round(fy0), round(fy1), 'z0', round(fz0, 1))
for o, lo, hi in sorted(info6, key=lambda t: -((t[2][0]-t[1][0])*(t[2][1]-t[1][1]))):
    print('P6', 'KEEP' if o in keep6 else 'drop', [round(h - l, 1) for l, h in zip(lo, hi)], 'lo', [round(v, 1) for v in lo], 'hi', [round(v, 1) for v in hi])
for o in list(bpy.context.scene.objects):
    if o.type == 'MESH' and o not in keep9 and o not in keep6: bpy.data.objects.remove(o, do_unlink=True)
rest = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in rest: o.select_set(True)
bpy.context.view_layer.objects.active = rest[0]; bpy.ops.object.join(); o = bpy.context.view_layer.objects.active; o.name = 'sofa'
lo, hi = bb(o); print('KEPT', [round(h - l, 1) for l, h in zip(lo, hi)], 'parts9', len(keep9), 'parts6', len(keep6))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=88)
print('DONE')
