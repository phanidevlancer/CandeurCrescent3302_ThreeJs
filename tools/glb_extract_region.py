# keep, from one object of a GLB, the loose parts whose bbox lies inside a region (cm, Blender axes); export to a GLB
import bpy, sys, mathutils
a = sys.argv[sys.argv.index('--') + 1:]; src, nm, out = a[:3]; x0, x1, y0, y1, z0, z1 = map(float, a[3:9])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.context.scene.objects):
    if o.type == 'MESH' and o.name != nm: bpy.data.objects.remove(o, do_unlink=True)
ob = bpy.data.objects[nm]; bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
keep = []
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    pts = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
    lo = [min(p[i] for p in pts) for i in range(3)]; hi = [max(p[i] for p in pts) for i in range(3)]
    if x0 <= lo[0] and hi[0] <= x1 and y0 <= lo[1] and hi[1] <= y1 and z0 <= lo[2] and hi[2] <= z1: keep.append(o)
    else: bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
for o in keep: o.select_set(True)
bpy.context.view_layer.objects.active = keep[0]; bpy.ops.object.join(); o = bpy.context.view_layer.objects.active
pts = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
print('KEPT', len(keep), 'lo', [round(min(p[i] for p in pts), 1) for i in range(3)], 'hi', [round(max(p[i] for p in pts), 1) for i in range(3)])
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=88)
print('DONE')
