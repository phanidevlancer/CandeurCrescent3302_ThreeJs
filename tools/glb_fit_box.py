# Fit a whole model into an exact box (metres, Blender axes: X width, Y depth, Z height): bakes every transform into the mesh,
# scales each axis to the target, centres X/Y, bottom at Z 0, exports a GLB.   args: src out W D H
import bpy, sys, numpy as np
a = sys.argv[sys.argv.index('--') + 1:]; src, out = a[:2]; W, D, H = map(float, a[2:5])
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in obs: o.select_set(True)
bpy.context.view_layer.objects.active = obs[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
P = []
for o in obs:
    n = len(o.data.vertices); v = np.empty(n * 3, np.float32); o.data.vertices.foreach_get('co', v); P.append(v.reshape(-1, 3))
P = np.concatenate(P); lo, hi = P.min(0), P.max(0); s = np.array([W, D, H]) / (hi - lo); c = (lo + hi) / 2
for o in obs:
    n = len(o.data.vertices); v = np.empty(n * 3, np.float32); o.data.vertices.foreach_get('co', v); v = v.reshape(-1, 3)
    v[:, 0] = (v[:, 0] - c[0]) * s[0]; v[:, 1] = (v[:, 1] - c[1]) * s[1]; v[:, 2] = (v[:, 2] - lo[2]) * s[2]
    o.data.vertices.foreach_set('co', v.ravel()); o.data.update()
print('FIT', np.round(hi - lo, 3), '->', W, D, H, 'scale', np.round(s, 3))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='AUTO')
print('DONE')
