# usage: Blender -b --factory-startup --python tools/glb_bake_transforms.py -- in.glb out.glb [scale]
# keeps only mesh objects, bakes every node transform into the mesh data (three.js boxes stay tight), optional uniform scale
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]; src, out = a[:2]; k = float(a[2]) if len(a) > 2 else 1.0
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in ms:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
if k != 1.0:
    for o in ms:
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        o.scale = (k, k, k); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in ms:
    v = [x.co for x in o.data.vertices]; print('OBJ', o.name, [round(min(p[i] for p in v), 3) for i in range(3)], [round(max(p[i] for p in v), 3) for i in range(3)], 'uv' if o.data.uv_layers else 'no-uv')
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='AUTO')
print('DONE')
