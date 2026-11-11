import bpy, sys, numpy as np
argv = sys.argv[sys.argv.index('--') + 1:]; src, out, ratio = argv[0], argv[1], float(argv[2])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
P = []
for o in obs:
    n = len(o.data.vertices); a = np.empty(n * 3, dtype=np.float32); o.data.vertices.foreach_get('co', a); a = a.reshape(-1, 3)
    M = np.array(o.matrix_world); a = a @ M[:3, :3].T + M[:3, 3]; P.append(a)
P = np.concatenate(P); lo, hi = P.min(0), P.max(0)
print('BOUNDS', np.round(lo, 3), np.round(hi, 3), 'size', np.round(hi - lo, 3))
z = P[:, 2] - lo[2]; H = hi[2] - lo[2]
tall = P[z > 0.8 * H]; print('HEADBOARD at y ≈', round(float(tall[:, 1].mean()), 3), 'x', round(float(tall[:, 0].min()), 3), round(float(tall[:, 0].max()), 3))
for h in (0.2, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6):
    sl = P[np.abs(z - h) < 0.01]
    if len(sl): print('h %.2f  x %.3f..%.3f  y %.3f..%.3f' % (h, sl[:, 0].min(), sl[:, 0].max(), sl[:, 1].min(), sl[:, 1].max()))
for o in obs:
    m = o.modifiers.new('dec', 'DECIMATE'); m.ratio = ratio
    bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.modifier_apply(modifier='dec')
print('TRIS', sum(len(o.data.polygons) for o in obs))
for img in bpy.data.images:
    if img.size[0] > 2048: img.scale(2048, int(2048 * img.size[1] / img.size[0]))
    print('IMG', img.name, tuple(img.size))
if out != '-': bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=86)
print('DONE')
