#!/usr/bin/env python3
"""Rebuild references/index.html: a one-click gallery of every owner reference image in references/<room>/.
Run after saving a new reference:  python3 tools/build_reference_index.py"""
import html, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'references')
EXT = ('.png', '.jpg', '.jpeg', '.webp', '.gif')

def main():
    rooms = sorted(d for d in os.listdir(ROOT) if os.path.isdir(os.path.join(ROOT, d)))
    parts = []
    for room in rooms:
        files = sorted((f for f in os.listdir(os.path.join(ROOT, room)) if f.lower().endswith(EXT)), reverse=True)
        if not files:
            continue
        cards = []
        for f in files:
            m = re.match(r'(\d{4}-\d{2}-\d{2})_(.+)\.\w+$', f)
            date, name = (m.group(1), m.group(2).replace('-', ' ')) if m else ('', f)
            src = html.escape(f'{room}/{f}')
            cards.append(f'<a class="card" href="{src}" target="_blank" rel="noopener"><img src="{src}" alt="{html.escape(name)}" loading="lazy"><span><b>{html.escape(name)}</b><small>{date}</small></span></a>')
        parts.append(f'<h2>{html.escape(room.replace("-", " ").title())}</h2><div class="grid">{"".join(cards)}</div>')
    page = f'''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Owner references</title>
<style>body{{margin:0;padding:20px 16px 40px;background:#16181d;color:#efe7dd;font:14px system-ui,sans-serif}}h1{{font-size:22px;margin:0 0 4px}}p{{color:#9aa0a8;margin:0 0 18px}}
h2{{font-size:15px;color:#e0a24a;margin:22px 0 10px;text-transform:uppercase;letter-spacing:.08em}}.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:14px}}
.card{{display:grid;gap:6px;color:inherit;text-decoration:none;background:#1f232a;border:1px solid #333a44;border-radius:10px;overflow:hidden}}.card:hover{{border-color:#e0a24a}}
.card img{{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}}.card span{{padding:0 10px 10px;display:grid}}.card b{{text-transform:capitalize}}.card small{{color:#9aa0a8}}</style>
<h1>Owner references</h1><p>Every image you shared, by room. Click one to open the original. What was applied where: README.md in this folder.</p>
{"".join(parts)}'''
    with open(os.path.join(ROOT, 'index.html'), 'w') as fh:
        fh.write(page)
    print('references/index.html:', sum(p.count('class="card"') for p in parts), 'images')

if __name__ == '__main__':
    main()
