# recolour saturated reds / oranges / pinks in a GLB's embedded textures to a target colour (keeps shading); geometry untouched
# usage: python3 -I tools/glb_recolour_hues.py in.glb out.glb  (target = mushroom taupe, PALETTE.bed 0x8f8378)
import json, struct, sys, io, colorsys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
TH, TS = 26 / 360, 0.16          # taupe hue / saturation
b = open(src, 'rb').read(); off = 12; js = None; binc = None
while off < len(b):
    cl, ct = struct.unpack('<I4s', b[off:off+8])
    if ct == b'JSON': js = json.loads(b[off+8:off+8+cl])
    elif ct == b'BIN\x00': binc = b[off+8:off+8+cl]
    off += 8 + cl
bv = js['bufferViews']; repl = {}
for im in js['images']:
    v = bv[im['bufferView']]; data = binc[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
    I = Image.open(io.BytesIO(data)).convert('RGB'); H, Sx, V = I.convert('HSV').split()
    h = H.load(); s_ = Sx.load(); vv = V.load(); W, Hh = I.size; n = 0
    for y in range(Hh):
        for x in range(W):
            hu = h[x, y] / 255
            if (s_[x, y] > 95 and (hu < 28 / 360 or hu > 320 / 360)) or (s_[x, y] > 140 and hu < 42 / 360):
                h[x, y] = int(TH * 255); s_[x, y] = int(TS * 255); vv[x, y] = int(min(255, vv[x, y] * 0.66)); n += 1
    out = Image.merge('HSV', (H, Sx, V)).convert('RGB'); o = io.BytesIO(); out.save(o, 'JPEG', quality=88); im['mimeType'] = 'image/jpeg'; repl[im['bufferView']] = o.getvalue()
    print('recoloured', n, 'of', W * Hh, 'pixels')
outb = bytearray()
for i, v in enumerate(bv):
    data = repl.get(i) or binc[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
    while len(outb) % 4: outb.append(0)
    v['byteOffset'] = len(outb); v['byteLength'] = len(data); outb += data
while len(outb) % 4: outb.append(0)
js['buffers'] = [{'byteLength': len(outb)}]
j = json.dumps(js, separators=(',', ':')).encode()
while len(j) % 4: j += b' '
open(dst, 'wb').write(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(j) + 8 + len(outb)) + struct.pack('<I4s', len(j), b'JSON') + j + struct.pack('<I4s', len(outb), b'BIN\x00') + bytes(outb))
print('bytes', 12 + 8 + len(j) + 8 + len(outb))
