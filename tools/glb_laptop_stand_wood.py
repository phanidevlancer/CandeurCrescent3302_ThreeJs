# Usage: Blender -b --factory-startup --python tools/glb_laptop_stand_wood.py -- assets/models/originals/wood_laptop_stand.glb assets/models/laptop_stand_wood.glb
# Wood laptop stand: bake transforms, true size (mesh units are cm → ×0.9 of the Sketchfab-normalised import), lip/front → −Y
# (three +z), centred x/y, bottom z 0.
import bpy, sys, numpy as np
src, out = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in obs: o.select_set(True)
bpy.context.view_layer.objects.active = obs[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
def V(o):
    n = len(o.data.vertices); v = np.empty(n*3, np.float32); o.data.vertices.foreach_get('co', v); return v.reshape(-1, 3)
vs = {o: V(o) * 0.9 for o in obs}
for o, v in vs.items(): x, y = v[:, 0].copy(), v[:, 1].copy(); v[:, 0] = y; v[:, 1] = -x   # rot Z −90°: +x → −y
A = np.concatenate(list(vs.values())); lo, hi = A.min(0), A.max(0); c = (lo + hi) / 2
for o, v in vs.items():
    v[:, 0] -= c[0]; v[:, 1] -= c[1]; v[:, 2] -= lo[2]; o.data.vertices.foreach_set('co', v.astype(np.float32).ravel()); o.data.update()
print('STAND SIZE', (hi - lo).round(4))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB')
