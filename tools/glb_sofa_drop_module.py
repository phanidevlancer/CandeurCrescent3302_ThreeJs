# modular sofa: take out one seat module (x range in cm, Blender axes) and close the gap; long frame pieces are shortened
import bpy, sys, mathutils
a = sys.argv[sys.argv.index('--') + 1:]; src, out = a[:2]; m0, m1 = float(a[2]), float(a[3]); W = m1 - m0
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
ob = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
dele = mov = sca = 0
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    pts = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]; lo = min(p.x for p in pts); hi = max(p.x for p in pts)
    if lo >= m0 - 2 and hi <= m1 + 2: bpy.data.objects.remove(o, do_unlink=True); dele += 1          # the module's cushions / seams
    elif lo >= m1 - 2: o.location.x -= W; mov += 1                                                     # everything beyond it slides in
    elif hi > m1 + 2 and lo < m1:                                                                      # frame panels crossing it: shorten
        inv = o.matrix_world.inverted()
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            if w.x > m1 - 1: w.x -= W
            elif w.x > m0: w.x = m0
            v.co = inv @ w
        sca += 1
bpy.ops.object.select_all(action='DESELECT'); rest = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in rest: o.select_set(True)
bpy.context.view_layer.objects.active = rest[0]; bpy.ops.object.join(); o = bpy.context.view_layer.objects.active; o.name = 'sofa'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
pts = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
print('RESULT deleted', dele, 'moved', mov, 'shortened', sca, 'x', round(min(p.x for p in pts), 1), round(max(p.x for p in pts), 1), 'y', round(min(p.y for p in pts), 1), round(max(p.y for p in pts), 1))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=88)
print('DONE')
