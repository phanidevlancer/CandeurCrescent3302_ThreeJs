#!/usr/bin/env python3
"""Find code accidentally swallowed by a // comment on the same line (e.g. `const a = 1;   // note root.add(box(...));`).
This happened twice on 2026-11-10 (a shelf silently vanished). Run after editing JS: python3 tools/lint_swallowed_code.py"""
import pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
PAT = re.compile(r'(\b[a-zA-Z_]\w*\([^)]*\); *\}|\bsetMsg\(|\broot\.add\(|\bconst \w+ = |\blet \w+ = |\bctx\.add\(|\bfor \(|\bif \(|\breturn [^ ]*;|; [a-z]\w*\.[a-z]\w*\()')
bad = 0
for f in [ROOT / 'app.js', *sorted((ROOT / 'layouts').rglob('*.js'))]:
    for i, line in enumerate(f.read_text().splitlines(), 1):
        k = line.find('// ')
        if k < 0: continue
        head = line[:k]
        if head.count("'") % 2 or head.count('`') % 2 or head.count('"') % 2 or head.rstrip().endswith(':'): continue
        if not head.strip(): continue                      # whole-line comment
        if PAT.search(line[k:]):
            print(f'{f.relative_to(ROOT)}:{i}: {line.strip()[:160]}'); bad += 1
print(f'{bad} suspicious line(s)'); sys.exit(1 if bad else 0)
