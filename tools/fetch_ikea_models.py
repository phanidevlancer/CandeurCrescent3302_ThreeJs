"""Download IKEA's own 3D product models (the GLB used by the product page's 3D viewer) for the IKEA items in
versions/v2/bom.json. For the owner's personal home-planning use only; IKEA content, not redistributable.
Usage: python3 tools/fetch_ikea_models.py   (from the walkthrough folder)"""
import json, re, subprocess, os, hashlib
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
SKIP = re.compile(r'mattress|cord set|handle|towel rail|sink|mixer tap|cushion pad|cover for|roller blind|lamp shade', re.I)
bom = json.load(open('../versions/v2/bom.json'))
def curl(url, out=None):
    cmd = ['curl', '-sfL', '-m', '120', '-A', UA, url]
    if out: subprocess.run(cmd + ['-o', out], check=True); return None
    return subprocess.run(cmd, check=True, capture_output=True).stdout.decode('utf-8', 'ignore')
manifest, seen = {}, {}
for it in bom:
    url = it.get('source_url') or ''
    if 'ikea.com' not in url or SKIP.search(it['name']): continue
    art = re.search(r'-(s?\d{8})/?$', url); key = art.group(1) if art else hashlib.md5(url.encode()).hexdigest()[:8]
    if key in seen: manifest[key]['rooms'].append(it['room']); continue
    seen[key] = 1
    entry = {'name': it['name'], 'url': url, 'rooms': [it['room']], 'w_mm': it.get('w_mm'), 'd_mm': it.get('d_mm'), 'h_mm': it.get('h_mm'), 'glb': None}
    try:
        html = curl(url)
        glbs = sorted(set(re.findall(r'https://web-api\.ikea\.com/dimma/assets/[^"\\\s]+?\.glb[^"\\\s]*', html)))
        if glbs:
            out = f'assets/ikea/{key}.glb'; curl(glbs[0].replace('&amp;', '&'), out)
            entry['glb'] = out; entry['bytes'] = os.path.getsize(out); entry['source_glb'] = glbs[0]; entry['all_glbs'] = len(glbs)
    except subprocess.CalledProcessError as e:
        entry['error'] = str(e)
    manifest[key] = entry
    print(f"{key:10s} {'OK ' if entry['glb'] else '-- '} {entry.get('bytes', 0)//1024:6d} KB  {it['name'][:60]}")
json.dump(manifest, open('assets/ikea/manifest.json', 'w'), indent=1)
open('assets/ikea/README.md', 'w').write('3D models downloaded from IKEA product pages (ikea.com/in) for the owner\'s personal home planning only.\nIKEA content: do not redistribute or publish. Regenerate with tools/fetch_ikea_models.py.\n')
