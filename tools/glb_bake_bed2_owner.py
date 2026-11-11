# usage: Blender -b --factory-startup --python tools/glb_bake_bed2_owner.py -- assets/models/originals/bed2_owner.glb out.glb
# "Bed" by Doaa Sheha: all 7 objects kept (the scan's layers fill each other's holes), transforms baked, cm → m
import bpy, sys
src, out = sys.argv[sys.argv.index('--') + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in ms:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
for o in ms:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    o.rotation_mode = 'XYZ'; o.scale = (0.01, 0.01, 0.01); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
lo = [min(v.co[i] for o in ms for v in o.data.vertices) for i in range(3)]; hi = [max(v.co[i] for o in ms for v in o.data.vertices) for i in range(3)]
print('OUT', [round(v, 3) for v in lo], [round(v, 3) for v in hi])
for o in ms:
    v = [x.co for x in o.data.vertices]; print('OBJ', o.name, [round(min(p[i] for p in v), 3) for i in range(3)], [round(max(p[i] for p in v), 3) for i in range(3)])
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='AUTO')
print('DONE')
