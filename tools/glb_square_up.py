# square up a scanned model: find the yaw that minimises the footprint box of its low (frame) points, rotate the model by
# minus that yaw about the vertical axis, re-origin, export.   args: src out
import bpy, sys, math, numpy as np, mathutils
src, out = sys.argv[sys.argv.index('--') + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
P = []
for o in obs:
    n = len(o.data.vertices); a = np.empty(n * 3, np.float32); o.data.vertices.foreach_get('co', a); a = a.reshape(-1, 3); M = np.array(o.matrix_world); P.append(a @ M[:3, :3].T + M[:3, 3])
P = np.concatenate(P); z = P[:, 2] - P[:, 2].min(); base = P[(z > 0.08) & (z < 0.32)][:, :2]
best = None
for d in np.arange(-45, 45, 0.1):
    t = math.radians(d); R = np.array([[math.cos(t), -math.sin(t)], [math.sin(t), math.cos(t)]]); q = base @ R.T
    area = np.ptp(q[:, 0]) * np.ptp(q[:, 1])
    if best is None or area < best[0]: best = (area, d)
d = best[1]; print('SKEW_DEG', round(d, 2), 'footprint', round(best[0], 3))
roots = [o for o in bpy.context.scene.objects if o.parent is None]
for o in roots: o.matrix_world = mathutils.Matrix.Rotation(math.radians(d), 4, 'Z') @ o.matrix_world
bpy.context.view_layer.update()
# bake the turn into the mesh data (a rotation left on a node makes three.js' bounding boxes too big → wrong placement)
bpy.ops.object.select_all(action='DESELECT')
for o in obs: o.select_set(True)
bpy.context.view_layer.objects.active = obs[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
P2 = []
for o in obs:
    n = len(o.data.vertices); a = np.empty(n * 3, np.float32); o.data.vertices.foreach_get('co', a); a = a.reshape(-1, 3); M = np.array(o.matrix_world); P2.append(a @ M[:3, :3].T + M[:3, 3])
P2 = np.concatenate(P2); print('NEW size', np.round(np.ptp(P2, 0), 3))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=86)
print('DONE')
