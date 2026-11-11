"""Bake Blender procedural materials (noise/voronoi + bump) into tileable textures for the web viewer.
Runs on the opened .blend in memory only; never saves the .blend.
Usage: Blender -b home.blend --python bake_materials.py -- <walkthrough_dir>"""
import bpy, bmesh, json, os, sys, numpy as np
OUT = sys.argv[sys.argv.index('--') + 1]
TEX = os.path.join(OUT, 'tex'); os.makedirs(TEX, exist_ok=True)
RES, TILE_M = 1024, 1.5          # texture px, metres covered by one tile in the viewer
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 4; sc.cycles.device = 'CPU'
sc.render.bake.margin = 0
# temp plane 1x1 with UVs (Generated coords on it = 0..1, same as UV)
me = bpy.data.meshes.new('bakeplane'); bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5); uv = bm.loops.layers.uv.new()
for f in bm.faces:
    for l in f.loops: l[uv].uv = (l.vert.co.x + 0.5, l.vert.co.y + 0.5)
bm.to_mesh(me); bm.free()
ob = bpy.data.objects.new('bakeplane', me); sc.collection.objects.link(ob)
for o in list(sc.objects): o.hide_render = o is not ob
bpy.context.view_layer.objects.active = ob
for o in bpy.context.view_layer.objects: o.select_set(o is ob)

def tileable(a):
    h, w = a.shape[:2]
    wx = np.clip(1 - np.abs(np.linspace(-1, 1, w)), 0, 1) ** 0.5
    wy = np.clip(1 - np.abs(np.linspace(-1, 1, h)), 0, 1) ** 0.5
    a = a * wx[None, :, None] + np.roll(a, w // 2, 1) * (1 - wx[None, :, None])
    a = a * wy[:, None, None] + np.roll(a, h // 2, 0) * (1 - wy[:, None, None])
    return a

def bake(mat, kind, noncolor):
    img = bpy.data.images.new(f'{kind}', RES, RES, alpha=False, float_buffer=False)
    img.colorspace_settings.name = 'Non-Color' if noncolor else 'sRGB'
    nt = mat.node_tree; node = nt.nodes.new('ShaderNodeTexImage'); node.image = img
    nt.nodes.active = node; node.select = True
    if kind == 'col': bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_clear=True)
    elif kind == 'rgh': bpy.ops.object.bake(type='ROUGHNESS', use_clear=True)
    else: bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT', use_clear=True)
    px = np.array(img.pixels[:], dtype=np.float32).reshape(RES, RES, 4)
    nt.nodes.remove(node)
    px[..., :3] = tileable(px[..., :3]); px[..., 3] = 1
    img.pixels.foreach_set(px.ravel())
    safe = ''.join(ch if ch.isalnum() else '_' for ch in mat.name)[:48]
    fn = f'{safe}_{kind}.jpg'
    img.filepath_raw = os.path.join(TEX, fn); img.file_format = 'JPEG'
    sc.render.image_settings.quality = 88
    img.save(); bpy.data.images.remove(img)
    return fn, px

manifest = {}
for mat in bpy.data.materials:
    if not mat.node_tree: continue
    types = {n.type for n in mat.node_tree.nodes}
    if not any(t.startswith('TEX_') and t != 'TEX_IMAGE' for t in types): continue
    if not any(mat.name in [s.material.name for s in o.material_slots if s.material] for o in bpy.data.objects if o.type in ('MESH', 'CURVE')): continue
    ob.data.materials.clear(); ob.data.materials.append(mat)
    e = {'tile': TILE_M}
    e['col'], cpx = bake(mat, 'col', False)
    e['rgh'], rpx = bake(mat, 'rgh', True)
    e['rough_mean'] = float(rpx[..., 0].mean())
    if 'BUMP' in types:
        e['nrm'], _ = bake(mat, 'nrm', True)
    manifest[mat.name] = e
    print('BAKED', mat.name, flush=True)
json.dump(manifest, open(os.path.join(OUT, 'materials.json'), 'w'), indent=1)
print('MATERIALS', len(manifest))
