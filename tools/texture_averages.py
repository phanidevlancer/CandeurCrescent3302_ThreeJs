"""Adds 'avg' (linear RGB mean) to materials.json (baked Blender colours) and assets/polyhaven/textures.json.
Usage: Blender -b --python texture_averages.py -- <walkthrough_dir>"""
import bpy, json, sys, os, numpy as np
W = sys.argv[sys.argv.index('--') + 1]
def avg(path):
    im = bpy.data.images.load(path); im.colorspace_settings.name = 'sRGB'; im.scale(64, 64)
    a = np.array(im.pixels[:], dtype=np.float32).reshape(-1, 4)[:, :3]; bpy.data.images.remove(im)
    return [round(float(x), 4) for x in a.mean(0)]        # Blender converts sRGB images to linear in pixels[]
for fn, key, base in ((os.path.join(W, 'materials.json'), 'col', os.path.join(W, 'tex')), (os.path.join(W, 'assets/polyhaven/textures.json'), None, W)):
    d = json.load(open(fn))
    for k, v in d.items():
        p = os.path.join(base, v['col']) if key else os.path.join(base, v['files']['diff'])
        v['avg'] = avg(p)
    json.dump(d, open(fn, 'w'), indent=1); print(fn, len(d))
