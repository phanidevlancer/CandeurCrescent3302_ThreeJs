# usage: Blender -b --factory-startup --python tools/glb_extract_bed01.py -- assets/models/originals/bed_01.glb out.glb (then glb_repack_textures.py)
# bed_01.glb → bed base frame (Object_2 parts in front of the headboard frame) + Object_6 duvet + Object_8 mattress/pillows,
# transforms baked, scaled to a 1600 × 2000 mattress, rotated so the foot points to Blender −Y (three +z)
import bpy, sys, mathutils, math
src, out = sys.argv[sys.argv.index('--') + 1:][:2]
SX, SL, SH = 1.60 / 5.611, 2.00 / 7.81, 0.443   # IKEA IDANAS 160 x 200 (bom.md); heights match the v1 bed 1 (mattress top 0.63 incl. 0.056 floor)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
keepN = {'Object_2', 'Object_6', 'Object_8'}
for o in list(bpy.context.scene.objects):
    if o.type == 'MESH' and o.name not in keepN: bpy.data.objects.remove(o, do_unlink=True)
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
fr = bpy.data.objects['Object_2']; bpy.ops.object.select_all(action='DESELECT'); fr.select_set(True); bpy.context.view_layer.objects.active = fr
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
parts = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.data.materials[0].name == 'Wood']
keep = []
for o in parts:
    xs = [(o.matrix_world @ mathutils.Vector(c)).x for c in o.bound_box]; zs = [(o.matrix_world @ mathutils.Vector(c)).z for c in o.bound_box]
    if min(xs) >= 0.13 and max(zs) <= 1.0: keep.append(o)
    else: bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
for o in keep: o.select_set(True)
bpy.context.view_layer.objects.active = keep[0]; bpy.ops.object.join(); bpy.context.view_layer.objects.active.name = 'BedFrame'
names = {'Object_6': 'Duvet', 'Object_8': 'MattressPillows'}
for o in list(bpy.context.scene.objects):
    if o.name in names: o.name = names[o.name]
for o in bpy.context.scene.objects:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    o.rotation_mode = 'XYZ'; o.scale = (SL, SX, SH); o.rotation_euler = (0, 0, -math.pi / 2)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    pts = [v.co for v in o.data.vertices]
    print('OUT', o.name, [round(min(p[i] for p in pts), 3) for i in range(3)], [round(max(p[i] for p in pts), 3) for i in range(3)], len(o.data.polygons))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=88)
print('DONE')
