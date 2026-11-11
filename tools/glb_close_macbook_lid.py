# Owner model 'MacBook Pro 14-inch M5' (Apple User, Sketchfab Standard licence) → closed laptop. Usage:
#   Blender -b --factory-startup --python tools/glb_close_macbook_lid.py -- assets/models/originals/macbook_pro_14-inch_m5.glb out.glb
#   then python3 -I tools/glb_repack_textures.py out.glb assets/models/macbook_pro_14_closed.glb
# Close the MacBook lid: bake transforms, rotate the lid (descendants of node RcexTyyhpuJYATQ_61) about its hinge until it lies
# flat on the base, screen down; centre x/y, bottom z 0; export GLB (metres).
import bpy, sys, numpy as np, math
src, out = sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
lidroot = bpy.data.objects['RcexTyyhpuJYATQ_61']
def under(o, r):
    p = o.parent
    while p:
        if p == r: return True
        p = p.parent
    return False
obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
lid = [o for o in obs if under(o, lidroot)]; base = [o for o in obs if o not in lid]
print('lid', len(lid), 'base', len(base))
bpy.ops.object.select_all(action='DESELECT')
for o in obs: o.select_set(True)
bpy.context.view_layer.objects.active = obs[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.context.scene.objects):
    if o.type != 'MESH': bpy.data.objects.remove(o, do_unlink=True)
def V(o):
    n = len(o.data.vertices); v = np.empty(n*3, np.float32); o.data.vertices.foreach_get('co', v); return v.reshape(-1, 3)
def setV(o, v): o.data.vertices.foreach_set('co', v.astype(np.float32).ravel()); o.data.update()
L = np.concatenate([V(o) for o in lid]); B = np.concatenate([V(o) for o in base])
print('base', B.min(0).round(4), B.max(0).round(4)); print('lid', L.min(0).round(4), L.max(0).round(4))
lo = L[L[:, 2] < L[:, 2].min() + 0.004]; hi = L[L[:, 2] > L[:, 2].max() - 0.004]
d = hi[:, 1:].mean(0) - lo[:, 1:].mean(0); phi = math.radians(70.0); a = math.pi - phi   # display parts PCA: exactly 70 deg open
print('lid dir angle deg', round(math.degrees(phi), 2), 'rotate by', round(math.degrees(a), 2))
piv = lo[:, 1:].mean(0); ca, sa = math.cos(a), math.sin(a)
def rot(v):
    y, z = v[:, 1] - piv[0], v[:, 2] - piv[1]; v = v.copy(); v[:, 1] = piv[0] + ca*y - sa*z; v[:, 2] = piv[1] + sa*y + ca*z; return v
R = rot(L); topB = B[:, 2].max()
# lid front edge flush with the base front edge; the flat panel (away from the hinge barrel) rests 0.3 mm above the base top
dy = B[:, 1].min() - R[:, 1].min(); flat = R[R[:, 1] + dy < B[:, 1].max() - 0.02]; dz = topB + 0.0003 - flat[:, 2].min()
Rs = R + [0, dy, dz]; back = Rs[Rs[:, 1] > B[:, 1].max() - 0.02]
print('barrel region z', back[:, 2].min().round(4), back[:, 2].max().round(4), 'y max', Rs[:, 1].max().round(4))
print('after rot lid', R.min(0).round(4), R.max(0).round(4), 'shift dy dz', round(dy, 4), round(dz, 4))
for o in lid:
    v = rot(V(o)); v[:, 1] += dy; v[:, 2] += dz; setV(o, v)
# screen side check: display mesh should be BELOW the lid shell now
for o in lid:
    v = V(o); print('  lid part', o.name, [m.name for m in o.data.materials][:1], 'z', v[:, 2].min().round(4), v[:, 2].max().round(4))
A = np.concatenate([V(o) for o in obs]); lo3, hi3 = A.min(0), A.max(0); c = (lo3 + hi3) / 2
for o in obs:
    v = V(o); v[:, 0] -= c[0]; v[:, 1] -= c[1]; v[:, 2] -= lo3[2]; setV(o, v)
print('CLOSED SIZE m', (hi3 - lo3).round(4))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='AUTO')
