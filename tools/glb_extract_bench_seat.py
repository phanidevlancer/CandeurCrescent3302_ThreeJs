# usage: Blender -b --factory-startup --python tools/glb_extract_bench_seat.py -- furniture_outdoor_and_coffee_table.glb out.glb
# Keeps ONLY the backless seat of the "sit_bench_1_4" bench (draakon_4d, CC BY 4.0): base box (Object_24, sit_bench_a),
# top board (Object_22, sit_bench_b) and the quilted cushion (Object_21, sit_bench_leather). Drops the backrest board
# (Object_23, sit_bench_c) and every table / stool / chair. Bakes all transforms, re-origins to the builder frame
# (floor = 0, back face = 0 → glTF: back at −z… front +z after export), no decimation.
import bpy, sys
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]; src, out = a[:2]
KEEP = {'Object_21', 'Object_22', 'Object_24'}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.context.scene.objects):
    if o.type == 'MESH' and o.name not in KEEP: bpy.data.objects.remove(o, do_unlink=True)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in ms:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
vs = [o.matrix_world @ v.co for o in ms for v in o.data.vertices]
mn = [min(v[i] for v in vs) for i in range(3)]; mx = [max(v[i] for v in vs) for i in range(3)]
# Blender +y = back (the dropped backrest stood at +y) → glTF −z. Origin: x centre, back face y = max y, floor z = min z.
off = Vector((-(mn[0] + mx[0]) / 2, -mx[1], -mn[2]))
for o in ms:
    for v in o.data.vertices: v.co += off
vs = [v.co for o in ms for v in o.data.vertices]
print('SIZE', [round(max(v[i] for v in vs) - min(v[i] for v in vs), 4) for i in range(3)], [o.name for o in ms])
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=False)
