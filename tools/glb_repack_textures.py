import json, struct, sys, io
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read(); off = 12; js = None; binc = None
while off < len(b):
    cl, ct = struct.unpack('<I4s', b[off:off+8])
    if ct == b'JSON': js = json.loads(b[off+8:off+8+cl])
    elif ct == b'BIN\x00': binc = b[off+8:off+8+cl]
    off += 8 + cl
bv = js['bufferViews']; repl = {}
for im in js['images']:
    v = bv[im['bufferView']]; data = binc[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
    I = Image.open(io.BytesIO(data)); I.load()
    if max(I.size) > 1024:
        I.thumbnail((1024, 1024), Image.LANCZOS); o = io.BytesIO()
        if I.mode in ('RGBA', 'LA') and I.getextrema()[-1][0] < 255: I.save(o, 'PNG', optimize=True); im['mimeType'] = 'image/png'
        else: I.convert('RGB').save(o, 'JPEG', quality=88); im['mimeType'] = 'image/jpeg'
        repl[im['bufferView']] = o.getvalue()
out = bytearray()
for i, v in enumerate(bv):
    data = repl.get(i) or binc[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
    while len(out) % 4: out.append(0)
    v['byteOffset'] = len(out); v['byteLength'] = len(data); out += data
while len(out) % 4: out.append(0)
js['buffers'] = [{'byteLength': len(out)}]
j = json.dumps(js, separators=(',', ':')).encode()
while len(j) % 4: j += b' '
glb = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(j) + 8 + len(out)) + struct.pack('<I4s', len(j), b'JSON') + j + struct.pack('<I4s', len(out), b'BIN\x00') + bytes(out)
open(dst, 'wb').write(glb); print('bytes', len(glb))
