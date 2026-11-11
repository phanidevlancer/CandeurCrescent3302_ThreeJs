# close the three pulled-out drawers of "Wooden bedside table": slide each drawer node (+y) until its front face is at the carcass front
import bpy, sys, mathutils
src, out = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
def miny(objs): return min((o.matrix_world @ mathutils.Vector(c)).y for o in objs for c in o.bound_box)
ob = {o.name: o for o in bpy.context.scene.objects}
front = miny([ob['Object_4']])
for node, fr in (('Cube.126_1', 'Object_8'), ('Cube.001_2', 'Object_11'), ('Cube.002_3', 'Object_15')):
    d = front - miny([ob[fr]])
    n = ob[node]; n.matrix_world = mathutils.Matrix.Translation((0, d, 0)) @ n.matrix_world
    print('CLOSE', node, round(d, 4))
bpy.context.view_layer.update()
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='AUTO')
