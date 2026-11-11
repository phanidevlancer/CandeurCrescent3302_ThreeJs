import json, struct, sys
p = sys.argv[1]
b = open(p, 'rb').read()
magic, ver, length = struct.unpack('<4sII', b[:12])
print('magic', magic, 'version', ver, 'bytes', length)
off = 12; js = None; binlen = 0
while off < len(b):
    cl, ct = struct.unpack('<I4s', b[off:off+8])
    if ct == b'JSON': js = json.loads(b[off+8:off+8+cl])
    elif ct == b'BIN\x00': binlen = cl
    off += 8 + cl
print('asset', js.get('asset'))
print('extensionsUsed', js.get('extensionsUsed'), 'required', js.get('extensionsRequired'))
print('nodes', len(js.get('nodes', [])), 'meshes', len(js.get('meshes', [])), 'materials', len(js.get('materials', [])), 'textures', len(js.get('textures', [])), 'images', len(js.get('images', [])), 'bin', binlen)
tri = 0; vmin = [1e9]*3; vmax = [-1e9]*3
acc = js.get('accessors', [])
for m in js.get('meshes', []):
    for pr in m['primitives']:
        a = acc[pr['attributes']['POSITION']]
        if 'min' in a: vmin = [min(x, y) for x, y in zip(vmin, a['min'])]; vmax = [max(x, y) for x, y in zip(vmax, a['max'])]
        if 'indices' in pr: tri += acc[pr['indices']]['count'] // 3
        else: tri += a['count'] // 3
print('triangles', tri)
print('mesh-local bounds min', [round(v, 4) for v in vmin], 'max', [round(v, 4) for v in vmax])
for n in js.get('nodes', [])[:12]: print('node', n.get('name'), {k: n[k] for k in ('translation', 'rotation', 'scale', 'matrix', 'mesh', 'children') if k in n})
for m in js.get('materials', [])[:10]: print('mat', m.get('name'), json.dumps(m.get('pbrMetallicRoughness', {}))[:200])
for im in js.get('images', [])[:10]: print('img', im.get('name'), im.get('mimeType'), im.get('uri', '')[:60])
print('extras', js.get('extras'), js.get('asset', {}).get('extras'))
