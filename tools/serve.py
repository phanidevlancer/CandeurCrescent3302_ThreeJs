"""Local server for the walkthrough (caching disabled) + a tiny comments API.
Usage: python3 tools/serve.py [port]   (run from the walkthrough folder; listens on 127.0.0.1 only)

Comments are stored in comments.json (screenshots in comments/<id>.jpg) so agents can read and answer them.
  GET  /api/comments                      -> {"comments": [...]}
  POST /api/comments  {"action": "add", "comment": {...}, "image": "data:image/jpeg;base64,..."}
                      {"action": "update", "id": "...", "status": "open|done", "text": "...", "reply": "..."}
                      {"action": "delete", "id": "..."}
"""
import base64, http.server, json, os, re, sys, threading, time

ROOT = os.path.abspath(os.getcwd())
STORE = os.path.join(ROOT, 'comments.json')
IMG_DIR = os.path.join(ROOT, 'comments')
MAX_BODY = 6 * 1024 * 1024
MAX_TEXT = 4000
LOCK = threading.Lock()
ID_RX = re.compile(r'^c\d{13}[a-z0-9]{0,6}$')


def load():
    try:
        with open(STORE, encoding='utf-8') as f:
            d = json.load(f)
            return d if isinstance(d, dict) and isinstance(d.get('comments'), list) else {'comments': []}
    except (OSError, ValueError):
        return {'comments': []}


def save(d):
    tmp = STORE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(d, f, indent=1, ensure_ascii=False)
    os.replace(tmp, STORE)


def clean_text(v, n=MAX_TEXT):
    return v[:n] if isinstance(v, str) else ''


def clean_comment(c):
    """Keep only expected fields with expected types."""
    out = {'text': clean_text(c.get('text')), 'status': 'open', 'reply': ''}
    for k in ('room', 'option', 'mode'):
        out[k] = clean_text(c.get(k), 200)
    t = c.get('target') if isinstance(c.get('target'), dict) else {}
    out['target'] = {k: clean_text(t.get(k), 300) for k in ('kind', 'id', 'name', 'cat')}
    nums = lambda v, n: [float(x) for x in v[:n]] if isinstance(v, list) and all(isinstance(x, (int, float)) for x in v[:n]) else None
    out['point'] = nums(c.get('point'), 3)
    cam = c.get('camera') if isinstance(c.get('camera'), dict) else {}
    out['camera'] = {k: nums(cam.get(k), 3) for k in ('pos', 'target')}
    for k in ('yaw', 'pitch'):
        out['camera'][k] = float(cam[k]) if isinstance(cam.get(k), (int, float)) else None
    out['camera']['mode'] = clean_text(cam.get('mode'), 20)
    return out


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split('?')[0] == '/api/comments':
            with LOCK:
                return self._json(200, load())
        return super().do_GET()

    def do_POST(self):
        if self.path.split('?')[0] != '/api/comments':
            return self._json(404, {'error': 'not found'})
        try:
            n = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            return self._json(400, {'error': 'bad length'})
        if n <= 0 or n > MAX_BODY:
            return self._json(413, {'error': 'body too large'})
        try:
            req = json.loads(self.rfile.read(n))
        except ValueError:
            return self._json(400, {'error': 'invalid json'})
        if not isinstance(req, dict):
            return self._json(400, {'error': 'invalid request'})
        with LOCK:
            d = load()
            act = req.get('action')
            if act == 'add':
                c = clean_comment(req.get('comment') if isinstance(req.get('comment'), dict) else {})
                if not c['text'].strip():
                    return self._json(400, {'error': 'empty comment'})
                c['id'] = 'c%d' % int(time.time() * 1000)
                c['created'] = time.strftime('%Y-%m-%d %H:%M:%S')
                c['n'] = max([x.get('n', 0) for x in d['comments']] + [0]) + 1
                img = req.get('image')
                if isinstance(img, str) and img.startswith('data:image/jpeg;base64,'):
                    try:
                        raw = base64.b64decode(img.split(',', 1)[1], validate=True)
                        if raw[:3] == b'\xff\xd8\xff' and len(raw) < 4 * 1024 * 1024:
                            os.makedirs(IMG_DIR, exist_ok=True)
                            with open(os.path.join(IMG_DIR, c['id'] + '.jpg'), 'wb') as f:
                                f.write(raw)
                            c['image'] = 'comments/' + c['id'] + '.jpg'
                    except ValueError:
                        pass
                d['comments'].append(c)
                save(d)
                return self._json(200, {'ok': True, 'comment': c})
            cid = req.get('id')
            if not isinstance(cid, str) or not ID_RX.match(cid):
                return self._json(400, {'error': 'bad id'})
            found = next((x for x in d['comments'] if x.get('id') == cid), None)
            if not found:
                return self._json(404, {'error': 'no such comment'})
            if act == 'update':
                if req.get('status') in ('open', 'done'):
                    found['status'] = req['status']
                if isinstance(req.get('text'), str) and req['text'].strip():
                    found['text'] = clean_text(req['text'])
                if isinstance(req.get('reply'), str):
                    found['reply'] = clean_text(req['reply'])
                save(d)
                return self._json(200, {'ok': True, 'comment': found})
            if act == 'delete':
                d['comments'] = [x for x in d['comments'] if x.get('id') != cid]
                p = os.path.join(IMG_DIR, cid + '.jpg')
                if os.path.isfile(p):
                    os.remove(p)
                save(d)
                return self._json(200, {'ok': True})
            return self._json(400, {'error': 'unknown action'})


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
