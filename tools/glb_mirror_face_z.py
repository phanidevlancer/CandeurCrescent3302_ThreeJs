import bpy, sys, mathutils, math
argv = sys.argv[sys.argv.index('--') + 1:]; src, out = argv
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in ms:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
names = {'Object_2': 'frame', 'Object_3': 'glass', 'Object_4': 'inlay'}
rot = mathutils.Matrix.Rotation(-math.pi / 2, 4, 'Z')   # model front +X → Blender -Y (= three +Z)
for o in ms:
    o.name = names.get(o.name, o.name); o.matrix_world = rot @ o.matrix_world
for o in ms: o.select_set(True)
bpy.context.view_layer.objects.active = ms[0]; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
pts = [v.co for o in ms for v in o.data.vertices]
lo = [min(p[i] for p in pts) for i in range(3)]; hi = [max(p[i] for p in pts) for i in range(3)]
off = mathutils.Vector((-(lo[0] + hi[0]) / 2, -hi[1], -lo[2]))
for o in ms:
    for v in o.data.vertices: v.co += off
for o in ms:
    p = [v.co for v in o.data.vertices]
    print('PART', o.name, [ (round(min(q[i] for q in p),3), round(max(q[i] for q in p),3)) for i in range(3)])
print('TOTAL', [round(h - l, 3) for l, h in zip(lo, hi)])
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='AUTO')
