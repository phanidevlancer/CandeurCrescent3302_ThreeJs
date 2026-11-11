// YouTube-style home tour for tools/record_tour.mjs (--style youtube).
//   node tools/record_tour.mjs --style youtube --plan                 timeline + chapter times only
//   node tools/record_tour.mjs --style youtube --stills 10,42 --frames DIR   check frames
//   node tools/record_tour.mjs --style youtube --frames DIR           full render → tour/home_tour_youtube.mp4 (+ 720p copy,
//                                                                      chapters.txt, thumbnail.jpg, music)
//   node tools/record_tour.mjs --style youtube --thumb                 thumbnail only
// Everything here is additive: the page overlay (lower thirds, cards, dissolves) is injected by OVERLAY_JS, the viewer
// itself (app.js ?tour=1 → window.__tour) is unchanged. Camera keyframes are in three.js metres (x east, z south, y up).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeMusic } from './tour_music.mjs';

const ROOTDIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ROOMS = JSON.parse(fs.readFileSync(path.join(ROOTDIR, 'rooms.json'), 'utf8'));
const ftin = mm => { const inch = Math.round(mm / 25.4), f = Math.floor(inch / 12), i = inch % 12; return `${f}′${i ? i + '″' : ''}`; };
const size = room => { const [a, b] = ROOMS[room].mm; return `${ftin(a)} × ${ftin(b)}`; };

/* ---------------- page overlay (injected once) ---------------- */
export const OVERLAY_JS = String.raw`(()=>{ if (window.__yt) return 'ok';
const st = document.createElement('style');
st.textContent = ` + '`' + String.raw`
#ytXf{position:fixed;inset:0;width:100vw;height:100vh;object-fit:cover;opacity:0;z-index:30;pointer-events:none}
#ytShade{position:fixed;left:0;bottom:0;width:62vw;height:42vh;opacity:0;z-index:38;pointer-events:none;
  background:radial-gradient(ellipse 85% 95% at 0% 100%,rgba(8,8,10,.62) 0%,rgba(8,8,10,.38) 38%,rgba(8,8,10,0) 72%)}
#ytLT{position:fixed;left:104px;bottom:96px;z-index:40;color:#fff;font-family:"Avenir Next","Helvetica Neue",Helvetica,Arial,sans-serif;opacity:0;pointer-events:none;
  text-shadow:0 2px 14px rgba(0,0,0,.45)}
#ytLT .k{font-size:17px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:#e3c48d;margin-bottom:12px}
#ytLT .bar{height:3px;background:#d8b46f;border-radius:2px;margin-bottom:16px}
#ytLT .t{font-size:54px;font-weight:600;line-height:1.05;letter-spacing:.005em}
#ytLT .s{font-size:24px;font-weight:500;line-height:1.35;opacity:.93;margin-top:12px;max-width:1100px;letter-spacing:.01em}
#ytBug{position:fixed;right:56px;top:44px;z-index:39;color:#fff;font:600 15px/1 "Avenir Next","Helvetica Neue",sans-serif;letter-spacing:.3em;text-transform:uppercase;opacity:0;
  text-shadow:0 1px 8px rgba(0,0,0,.5);pointer-events:none}
#ytCard{position:fixed;inset:0;z-index:42;display:flex;align-items:center;justify-content:center;flex-direction:column;opacity:0;pointer-events:none;color:#fff;
  font-family:"Avenir Next","Helvetica Neue",Helvetica,Arial,sans-serif;text-align:center}
#ytCard .over{font-size:22px;letter-spacing:.55em;text-transform:uppercase;font-weight:500;color:#ecd7ae;margin-bottom:26px}
#ytCard .big{font-family:Didot,"Bodoni 72",Baskerville,Georgia,serif;font-size:118px;font-weight:400;line-height:1;letter-spacing:.01em}
#ytCard .line{height:2px;background:#d8b46f;margin:34px auto 30px}
#ytCard .sub{font-size:26px;letter-spacing:.42em;text-transform:uppercase;font-weight:500}
#ytCard .note{font-size:19px;opacity:.75;margin-top:22px;letter-spacing:.06em}
#ytCard.credits{justify-content:flex-start;padding-top:70px}
#ytCard .ch{font-family:Didot,"Bodoni 72",Georgia,serif;font-size:56px;margin-bottom:8px}
#ytCard .cols{display:flex;gap:70px;text-align:left;margin-top:30px;max-width:1720px}
#ytCard .col{flex:1}
#ytCard .grp{font-size:16px;letter-spacing:.3em;text-transform:uppercase;color:#e3c48d;margin:16px 0 8px;font-weight:600}
#ytCard .it{font-size:19px;line-height:1.45;opacity:.93}
#ytCard .it b{font-weight:600}
#ytCard .foot{position:absolute;bottom:46px;left:0;right:0;font-size:16px;opacity:.7;letter-spacing:.04em}
` + '`' + String.raw`;
document.head.appendChild(st);
const mk = (id, tag='div') => { const e = document.createElement(tag); e.id = id; document.body.appendChild(e); return e; };
const xf = mk('ytXf', 'img'), shade = mk('ytShade'), lt = mk('ytLT'), bug = mk('ytBug'), card = mk('ytCard');
bug.textContent = 'Candeur Crescent 3302 · Home tour';
let ltKey = '', cardKey = '';
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const sm = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
window.__yt = {
  async xfSrc(url) { xf.src = url; try { await xf.decode(); } catch (e) {} return true; },
  apply(s) {
    xf.style.opacity = s.xf ? s.xf.a : 0;
    // lower third
    if (s.lt) {
      const k = s.lt.title + '|' + s.lt.sub + '|' + s.lt.kicker;
      if (k !== ltKey) { ltKey = k; lt.innerHTML = (s.lt.kicker ? '<div class="k">' + esc(s.lt.kicker) + '</div>' : '') + '<div class="bar"></div><div class="t">' + esc(s.lt.title) + '</div>' + (s.lt.sub ? '<div class="s">' + esc(s.lt.sub) + '</div>' : ''); }
      const a = s.lt.a, u = s.lt.u;
      lt.style.opacity = a; lt.style.transform = 'translateX(' + ((1 - sm(u / 0.9)) * -26).toFixed(1) + 'px)';
      lt.querySelector('.bar').style.width = (12 + 76 * sm((u - 0.15) / 0.9)).toFixed(1) + 'px';
      shade.style.opacity = a;
    } else { lt.style.opacity = 0; shade.style.opacity = 0; }
    // cards
    if (s.card) {
      const c = s.card, d = c.data || {}, k = c.kind + JSON.stringify(d);
      if (k !== cardKey) {
        cardKey = k; card.className = c.kind;
        if (c.kind === 'title') card.innerHTML = '<div class="over">' + esc(d.over || '') + '</div><div class="big">' + esc(d.title) + '</div><div class="line"></div><div class="sub">' + esc(d.sub || '') + '</div>' + (d.note ? '<div class="note">' + esc(d.note) + '</div>' : '');
        else if (c.kind === 'credits') card.innerHTML = '<div class="ch">' + esc(d.title) + '</div><div class="cols">' + d.cols.map(col => '<div class="col">' + col.map(g => '<div class="grp">' + esc(g[0]) + '</div>' + g[1].map(x => '<div class="it">' + x + '</div>').join('')).join('') + '</div>').join('') + '</div><div class="foot">' + esc(d.foot || '') + '</div>';
        else if (c.kind === 'thumb') card.innerHTML = '<div style="position:absolute;left:96px;bottom:110px;text-align:left"><div class="over" style="font-size:30px;letter-spacing:.45em">' + esc(d.over) + '</div><div class="big" style="font-size:124px;text-shadow:0 4px 30px rgba(0,0,0,.5)">' + esc(d.title) + '</div><div class="line" style="width:140px;margin:30px 0 26px;height:4px"></div><div class="sub" style="font-size:34px">' + esc(d.sub) + '</div></div>';
      }
      const bgA = c.kind === 'title' ? 0.34 : c.kind === 'thumb' ? 0 : 0.93;
      card.style.background = c.kind === 'thumb' ? 'linear-gradient(0deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.35) 38%,rgba(0,0,0,0) 62%)' : 'radial-gradient(ellipse at 50% 50%,rgba(10,10,12,' + (bgA * 0.8) + '),rgba(10,10,12,' + Math.min(1, bgA * 1.25) + '))';
      card.style.opacity = c.a;
      const ln = card.querySelector('.line'); if (ln && c.kind === 'title') ln.style.width = (40 + 260 * sm((c.u - 0.6) / 1.6)).toFixed(1) + 'px';
      const big = card.querySelector('.big'); if (big && c.kind === 'title') { big.style.letterSpacing = (0.06 - 0.05 * sm(c.u / c.dur)).toFixed(4) + 'em'; }
    } else card.style.opacity = 0;
    bug.style.opacity = (s.card || s.orbit) ? 0 : 0.55;
    // aerial shots: soft studio backdrop instead of the dark plan-view void, corridor slabs hidden
    const sc = __app.scene(), G = __app.groups;
    for (const id of ['formal-hall/option1/corridor-ceiling', 'formal-hall/option1/corridor-floor']) { const g = G.get(id); if (g) g.pivot.visible = !s.orbit; }
    if (s.orbit) sc.background.setHex(s.dark ? 0x1b2230 : 0xcfd3d6);
    return true;
  },
};
return 'ok'; })()`;

/* ---------------- credits ---------------- */
// manifest keys of the models that are on screen in the DEFAULT design (checked against layouts + groups)
// owner 2026-11-12 re-cut: living = DailyArt sectional set (Westcott sofa gone), master = option3 (no Rivet lounge chairs,
// DualSense model on the gaming wall), puja = Balaji2 sculpt
const SHOWN = ['B082VN4F4K', 'B075X4N3JH', 'B07K7NY646', 'B075YMXWZC', 'B07QFRSC92',
  'sofa_sectional_dailyart', 'coffee_table_dailyart', 'rug_dailyart', 'balaji2', 'ps5_dualsense',
  'gas_stove_no1', 'kitchen_sink_fiesta', 'haiven_microwave', 'mixer_grinder', 'fridge_sbs', 'chimney_hood',
  'utility_sink_copper', 'washer_tower', 'dishwasher_compact',
  'bed1_bed01', 'bedside_table_wood',
  'bed2_doaa', 'computer_desk_draakon', 'lg_monitor_32', 'logitech_keyboard', 'logitech_mouse', 'laptop_stand_wood', 'macbook_pro_14', 'pc_tower', 'ikea_markus_chair',
  'bed_dreamburst_taupe', 'sink_cabinet_a', 'mirror_faceted_round', 'outdoor_chair_wicker'];
function credits() {
  const man = JSON.parse(fs.readFileSync(path.join(ROOTDIR, 'assets/abo/manifest.json'), 'utf8'));
  const e = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const lic = l => /CC BY-NC/.test(l) ? 'CC BY-NC 4.0' : /CC BY/.test(l) ? 'CC BY 4.0' : /Standard/.test(l) ? 'Sketchfab Standard licence' : 'licence not stated (owner-supplied)';
  const auth = a => String(a || 'unknown').replace(/\s*\(.*$/, '');
  const short = n => String(n).replace(/^Amazon Brand\s*[–-]\s*/i, '').replace(/\s*\(3D model\)/, '').replace(/,.*$/, '').replace(/\s*—.*$/, '').slice(0, 58);
  const abo = [], third = [];
  for (const k of SHOWN) {
    const v = man[k]; if (!v) { console.warn('credits: manifest has no', k); continue; }
    if (/ABO|Amazon Berkeley/.test(v.source || '')) abo.push(e(short(v.name)));
    else third.push(`<b>${e(short(v.name))}</b> — ${e(auth(v.author))} · ${e(lic(v.license || ''))}`);
  }
  const half = Math.ceil(third.length / 2);
  return {
    title: 'Credits',
    cols: [
      [['Design & walkthrough', ['Interior design concept for Candeur Crescent 3302', 'Rendered in real time in the browser with three.js (MIT)']],
       ['3D models via Sketchfab (owner-supplied)', third.slice(0, half)]],
      [['3D models via Sketchfab (continued)', third.slice(half)],
       ['Amazon Berkeley Objects (ABO) · CC BY-NC 4.0', [abo.join(' · ')]],
       ['Textures & plants', ['Poly Haven photo textures and potted plants · CC0', 'Other furniture, joinery and decor modelled for this project']],
       ['Music', ['Ambient score generated procedurally for this video']]],
    ],
    foot: 'Non-commercial visualisation · models used under their licences (CC BY / CC BY-NC 4.0, Sketchfab Standard) · not for monetised use',
  };
}

/* ---------------- the tour ---------------- */
export async function buildYoutube({ C, Tour, makePlanner, FPS, yawTo, PITCH }) {
  // states used while planning walks: sliders open, sheers gathered, main + puja doors open, the two bedroom toilets closed
  const occ = await C.ev(`(()=>{const T=window.__tour;
    T.movers('sliding-door',1);T.movers('fixed/curtains:cs',1);T.movers('d2-bedroom-(1|2)-toilet',0);T.movers('puja-doors',1);T.movers('main-entrance',1);T.movers('east-panels:m9',1);
    const o=T.occupancy();
    T.movers('sliding-door',0);T.movers('fixed/curtains:cs',0);T.movers('puja-doors',0);T.movers('main-entrance',0);T.movers('east-panels:m9',0);return o})()`);
  // the flush splash/skirting group on the kitchen's south wall (kitchen-passage) has a footprint box that spans the utility
  // doorway; clear that strip so the walk can pass (the wall itself is still in the grid on both sides of the opening)
  const clearBox = (xa, xb, za, zb) => { let d = occ.data.split(''); for (let j = 0; j < occ.ny; j++) for (let i = 0; i < occ.nx; i++) {
    const x = occ.x0 + (i + 0.5) * occ.cell, z = -(occ.y0 + (j + 0.5) * occ.cell); if (x > xa && x < xb && z > za && z < zb) d[j * occ.nx + i] = '0'; } occ.data = d.join(''); };
  clearBox(8.2, 9.0, 4.95, 5.3);
  const P = makePlanner(occ);
  const seat = await C.ev(`window.__tour.seat('formal-hall/option1/sofa')`);
  const seatL = await C.ev(`window.__tour.seat('living-and-dining/option1/family-sofa')`);   // DailyArt sectional (owner 2026-11-12)
  const T = new Tour(P, [-4.6, 2.4, -0.6]);
  T.limitYaw = true;   // gimbal feel: pans ≤ ~24°/s (moves slow down, turns lengthen)
  const V = (p, at, fov) => ({ p, at, fov });
  T.mv = (to, o = {}) => T.move(to, { gaze: 'blend', ...o });
  const W = 58, D = 40;   // walking / detail vertical field of view (deg)
  let chap = 0; const K = name => `${String(++chap).padStart(2, '0')}  ·  ${name}`;
  const walkPose = (x, z, look, eye = 1.55, pitch = PITCH, fov = W) => ({ x, z, yaw: Array.isArray(look) ? yawTo([x, z], look) : look, pitch, eye, fov });

  // world state at t = 0
  T.set('light', 'day', 'day').set('movers:main-entrance', 0, 0).set('movers:d2-bedroom-(1|2)-toilet', 0, 0).set('movers:puja-doors', 0, 0)
    .set('movers:sliding-door', 0, 0).set('movers:fixed/curtains:cs', 0, 0).set('mood:Master bedroom', 'normal', 'normal')
    // master option3 (owner 2026-11-12): study cabinet doors start closed (opened on camera), hidden walk-in panel door closed
    .set('movers:master-bedroom/option3/gaming-wall:m[34]', 0, 0).set('movers:master-bedroom/option3/east-panels:m9', 0, 0);

  /* ---- intro: title over the aerial ---- */
  T.chapter('Intro');
  T.card('title', 10.5, { over: 'Welcome to', title: 'Candeur Crescent 3302', sub: 'Home tour', note: '3 BHK · interior design walkthrough' }, { fadeIn: 1.4, fadeOut: 1.2 });
  T.la(16, V([20.5, 13.5, 9.5], [5.6, 0.2, -0.8], 42), V([17.5, 10.5, -11.5], [5.6, 0.2, -1.2], 42), { orbit: true, e: u => 0.15 * u + 0.85 * u * u * (3 - 2 * u) });

  /* ---- entrance corridor + foyer ---- */
  T.xf(1.0).chapter('Entrance & foyer');
  T.la(8, V([-5.2, 1.6, 3.4], [-0.4, 1.35, -1.6], W), V([-3.1, 1.58, 0.9], [-0.3, 1.3, -1.7], W), { label: 'corridor' });
  T.lt('Entrance foyer', 'Wavy backlit plaster wall · cane shoe cabinet · timber bench · terracotta relief tiles', { kicker: K('Arrival'), dur: 6.5, delay: 1.2 });
  T.xf(0.6).la(4.5, V([-2.25, 1.9, -0.25], [-0.25, 2.1, -1.4], 46), V([-2.05, 1.8, -0.95], [-0.25, 2.0, -1.5], 46), { label: 'wavy panel' });
  T.xf(0.6).set('movers:foyer-wall:m', 0, 1, 2.4, 0.8).la(5, V([-2.1, 1.25, -2.3], [-0.4, 1.15, -2.65], 46), V([-1.9, 1.2, -2.85], [-0.4, 1.1, -2.65], 46), { label: 'shoe cabinet' });
  T.set('movers:foyer-wall:m', 1, 0, 1.6, 0.2);
  T.xf(0.6).la(4.5, V([-2.4, 0.75, -1.0], [-0.45, 0.45, -1.4], D), V([-2.1, 0.7, -1.9], [-0.45, 0.42, -1.5], D), { label: 'bench low' });
  // main door opens on camera, then walk in
  T.xf(0.7).cutTo(walkPose(-2.9, -3.7, [0.5, -3.7]));
  T.hold(0.8).set('movers:main-entrance', 0, 1, 3.0).hold(3.2, { drift: 0.06 });
  T.mv([-0.75, -3.7], { look: [1.5, -3.7], speed: 0.55, direct: true });

  /* ---- formal hall ---- */
  T.chapter('Formal hall');
  T.mv([1.35, -2.9], { look: [2.0, -0.4], speed: 0.55 });
  T.lt('Formal hall', `${size('Formal hall')} · emerald velvet sofa · Laurel armchairs · pale-oak TV wall`, { kicker: K('Living'), dur: 6.5 });
  T.turn([2.6, -0.6], 3.5, { pitch: -0.1 }).hold(1.5, { drift: 0.05 });
  T.xf(0.6).la(5, V([0.55, 1.05, -2.6], [1.8, 0.55, -0.45], D), V([1.25, 0.95, -2.75], [1.95, 0.55, -0.45], D), { label: 'sofa detail' });
  T.xf(0.6).la(4.5, V([2.1, 0.7, -2.95], [1.0, 0.45, -1.5], 46), V([2.5, 0.75, -2.75], [1.2, 0.45, -1.4], 46), { label: 'coffee table' });
  T.xf(0.6).la(5.5, V([1.2, 1.5, -1.6], [2.2, 1.45, -4.25], 52), V([2.4, 1.5, -1.7], [2.3, 1.45, -4.25], 52), { label: 'tv wall' });
  T.xf(0.6).la(4.5, V([2.8, 1.85, -3.3], [3.15, 1.9, -4.25], D), V([2.95, 1.6, -3.35], [3.2, 1.65, -4.25], D), { label: 'tv shelves' });
  // seated on the sofa
  T.xf(0.7).cutTo({ x: seat.x, z: seat.z, yaw: seat.yaw + 0.35, pitch: -0.05, eye: seat.eye, fov: W }, { snap: false });
  T.lt('Seated view', 'Eye height 1.12 m from the sofa', { dur: 4.5, delay: 0.6 });
  T.turn(seat.yaw - 0.35, 6, { pitch: -0.04 });

  /* ---- living & dining (owner 2026-11-12: Option 1 · Real products, DailyArt sectional + chaise, 'Current' grey microcement TV wall) ---- */
  T.xf(0.8).chapter('Living & dining');
  T.cutTo(walkPose(3.0, -3.55, [6.5, -1.8]));
  T.mv([4.3, -3.4], { look: [7.5, -1.0], speed: 0.5 });
  T.lt('Living & dining', `${size('Living and dining')} open plan · walnut table for six · plush sectional with chaise`, { kicker: K('Living'), dur: 6.5 });
  T.turn([9.5, -0.8], 4).hold(1.2, { drift: 0.05 });
  T.xf(0.6).la(6, V([4.25, 1.05, -2.75], [5.45, 1.75, -2.1], 56), V([4.35, 1.05, -1.5], [5.45, 1.75, -2.1], 56), { label: 'chandelier' });
  T.xf(0.6).la(5, V([6.55, 1.2, -3.2], [5.45, 0.75, -2.0], D), V([6.6, 1.15, -2.3], [5.45, 0.75, -2.1], D), { label: 'dining' });
  T.lt('Buddha relief', 'Sandstone panel framed by walnut flutes at the bedroom passage', { dur: 4.5, delay: 0.8 });
  T.xf(0.6).la(6, V([5.2, 1.5, -1.2], [5.2, 1.55, 1.03], 50), V([5.2, 1.5, -0.45], [5.2, 1.6, 1.03], 50), { label: 'buddha' });
  // family area: the owner-model sectional, a seat on it, the TV wall it faces
  T.lt('Plush sectional + chaise', 'Owner-picked sectional · oak coffee table with a drawer · grey flat-weave rug', { dur: 5.8, delay: 0.5 });
  T.xf(0.6).la(6.5, V([7.2, 1.45, -0.95], [8.3, 0.6, -3.6], 56), V([8.7, 1.4, -1.0], [8.6, 0.6, -3.6], 56), { label: 'sectional' });
  T.xf(0.6).la(4.5, V([10.0, 1.1, -1.75], [9.3, 0.5, -3.2], D), V([9.95, 1.0, -2.2], [9.0, 0.5, -3.4], D), { label: 'chaise' });
  T.xf(0.7).cutTo({ x: seatL.x, z: seatL.z, yaw: seatL.yaw + 0.05, pitch: -0.05, eye: seatL.eye, fov: W }, { snap: false });
  T.lt('Seated view', 'From the sectional: TV wall, dining and the balcony light', { dur: 4.5, delay: 0.6 });
  T.turn(seatL.yaw - 0.45, 6, { pitch: -0.04 });
  T.lt('TV wall', 'Grey microcement · floating walnut console · walnut niche pillar with lit shelves', { dur: 5, delay: 0.5 });
  T.xf(0.6).la(5.5, V([8.6, 1.5, -2.45], [8.6, 1.3, 0], 56), V([8.6, 1.45, -1.85], [8.6, 1.3, 0], 52), { label: 'tv wall' });
  T.xf(0.6).la(5, V([7.0, 1.5, -1.7], [7.0, 1.6, -0.3], 44), V([7.0, 1.45, -1.3], [7.0, 1.55, -0.3], 44), { label: 'niche pillar' });

  /* ---- family balcony ---- */
  T.xf(0.7).chapter('Family balcony');
  T.cutTo(walkPose(9.6, -2.15, -Math.PI / 2));
  T.set('movers:living-and-dining/fixed/curtains:cs', 0, 1, 3.2, 0.4).set('movers:family-balcony-sliding-door', 0, 1, 2.4, 2.6).hold(5.0, { drift: 0.04 });
  T.lt('Family balcony', `${size('Family balcony')} · wicker armchair · greenery`, { kicker: K('Outdoors'), dur: 5.5, delay: 1.5 });
  T.la(8, V([9.6, 1.55, -2.15], [11.5, 1.2, -2.1], W), V([11.2, 1.5, -3.6], [11.25, 0.7, -1.1], W), { label: 'family balcony' });
  T.hold(1.5, { drift: 0.04 });

  /* ---- puja (owner 2026-11-12: black stone shrine + Balaji2 sculpt in glossy black + charcoal honed stone walls) ---- */
  T.xf(0.8).chapter('Puja room');
  T.la(4, V([8.0, 1.3, 1.25], [8.76, 1.15, 0.85], D), V([8.1, 1.25, 0.6], [8.76, 1.1, 0.85], D), { label: 'puja pulls' });
  T.xf(0.6).cutTo(walkPose(7.25, 0.84, -Math.PI / 2, 1.5, -0.03));
  T.lt('Puja room', `${size('Puja')} · teak doors with reeded glass and brass grid · black stone shrine`, { kicker: K('Sacred space'), dur: 6 });
  T.hold(1.2).set('movers:puja-doors', 0, 1, 3.4).hold(3.6);
  T.lt('Sri Venkateswara', 'Balaji2 sculpt in glossy black on a rough-hewn limestone slab', { dur: 5.5, delay: 1.5 });
  T.la(7.5, V([7.25, 1.5, 0.84], [10.1, 1.3, 0.84], W), V([8.55, 1.42, 0.84], [10.1, 1.45, 0.84], 44), { label: 'puja push', e: u => u * u * (3 - 2 * u) });
  T.xf(0.6).la(6, V([9.15, 1.2, 1.15], [10.0, 0.95, 0.8], D), V([9.15, 1.15, 0.6], [10.0, 0.95, 0.88], D), { label: 'samai + diyas' });
  T.lt('Carved stone', 'Honed charcoal stone blocks · carved scroll frieze · brass bell under two downlights', { dur: 5, delay: 0.5 });
  // tilt from the idol's crown up past the bell to the carved frieze and the downlight discs
  T.xf(0.6).la(6.5, V([8.95, 1.6, 0.84], [10.25, 1.9, 0.84], 50), V([8.95, 1.7, 0.84], [10.25, 2.75, 0.84], 50), { label: 'frieze tilt' });

  /* ---- kitchen ---- */
  // mover numbers are global (load order): the 2026-11-12 defaults shifted them by −4 → re-check after any default change
  T.xf(0.8).chapter('Kitchen');
  T.cutTo(walkPose(8.2, 0.9, [8.5, 4.5]));
  T.mv([8.35, 2.75], { look: [9.9, 3.3], speed: 0.5 });
  T.lt('Kitchen', `${size('Kitchen')} · teak raised-panel cabinets · blue octagon tiles · chimney + 4-burner hob`, { kicker: K('Cook'), dur: 6.5 });
  T.turn([7.2, 4.6], 6).turn([7.1, 2.1], 4).hold(1);
  T.xf(0.6).la(5, V([9.0, 1.45, 2.65], [10.1, 1.2, 2.65], 50), V([9.1, 1.55, 2.4], [10.1, 1.3, 2.7], 50), { label: 'hob + chimney' });
  T.xf(0.6).la(4.5, V([9.15, 1.55, 3.6], [10.0, 0.95, 4.05], D), V([9.15, 1.5, 4.3], [10.0, 0.95, 4.0], D), { label: 'sink' });
  T.xf(0.6).set('movers:kitchen-east:m(1[89]|2[0-6])', 0, 1, 2.2, 0.6).la(5.5, V([8.55, 1.25, 2.55], [9.9, 0.5, 3.05], 46), V([8.6, 1.2, 3.5], [9.9, 0.5, 3.1], 46), { label: 'drawers' });
  T.set('movers:kitchen-east:m(1[89]|2[0-6])', 1, 0, 1.5, 0.3);
  T.xf(0.6).la(5, V([8.1, 1.35, 3.55], [6.95, 1.1, 4.4], D), V([8.1, 1.35, 4.35], [6.95, 1.1, 4.0], D), { label: 'microwave + mixer' });
  T.xf(0.6).set('movers:kitchen-west:m(49|5[0-6])', 0, 1, 2.2, 0.8).la(5, V([8.6, 1.55, 3.0], [7.2, 2.2, 3.6], 50), V([8.6, 1.5, 3.9], [7.2, 2.2, 3.5], 50), { label: 'uppers' });
  T.set('movers:kitchen-west:m(49|5[0-6])', 1, 0, 1.4, 0.2);
  T.xf(0.6).la(4.5, V([8.9, 1.5, 3.3], [7.2, 1.1, 2.0], 50), V([8.7, 1.5, 2.9], [7.2, 1.1, 2.05], 50), { label: 'fridge' });

  /* ---- utility ---- */
  T.xf(0.7).chapter('Utility balcony');
  T.cutTo(walkPose(8.3, 4.3, [8.15, 6.5]));
  T.mv([8.4, 6.35], { look: [10.0, 6.4], speed: 0.45 });
  T.lt('Utility balcony', `${size('Utility')} · copper vessel sink · laundry tower · ceiling drying rails`, { kicker: K('Utility'), dur: 6 });
  T.turn([7.0, 5.7], 6).hold(1);
  T.xf(0.6).la(4.5, V([9.0, 1.25, 6.1], [9.95, 1.0, 6.45], 46), V([9.0, 1.2, 6.8], [9.95, 0.95, 6.45], 46), { label: 'copper sink' });
  T.xf(0.6).la(4.5, V([8.5, 1.5, 6.95], [7.25, 1.2, 5.6], 50), V([8.2, 1.5, 6.9], [7.25, 1.3, 5.6], 50), { label: 'laundry' });

  /* ---- bedroom 1 + balcony ---- */
  T.xf(0.8).chapter('Bedroom 1');
  T.cutTo(walkPose(6.2, -3.3, [6.7, -5.2]));   // owner 2026-11-12: the sectional now fills the old start (7.1, −3.3)
  T.mv([7.2, -6.0], { look: [9.0, -5.2], speed: 0.5 });
  T.lt('Bedroom 1', `${size('Bedroom 1')} · teak platform bed · sage arched wardrobe · fluted headboard wall`, { kicker: K('Bedrooms'), dur: 6.5 });
  T.turn([9.8, -7.6], 5).hold(1, { drift: 0.04 });
  T.xf(0.6).set('movers:b1-sage-wardrobe-door-(9|10|11)', 0, 1, 2.2, 0.7).la(5, V([8.95, 1.55, -6.45], [7.6, 1.2, -7.7], 54), V([9.0, 1.5, -6.6], [7.9, 1.2, -7.7], 54), { label: 'wardrobe' });
  T.set('movers:b1-sage-wardrobe-door-(9|10|11)', 1, 0, 1.5, 0.2);
  T.xf(0.6).la(4.5, V([7.15, 0.95, -5.75], [7.7, 0.55, -4.75], D), V([7.25, 1.1, -5.45], [7.7, 0.65, -4.7], D), { label: 'bedside' });
  T.xf(0.6).la(5, V([7.3, 1.35, -6.3], [8.8, 0.75, -5.2], D + 6), V([7.3, 1.3, -5.4], [8.8, 0.7, -5.4], D + 6), { label: 'bed' });
  T.xf(0.7).cutTo(walkPose(9.95, -6.4, -Math.PI / 2));
  T.set('movers:bedroom-1/fixed/curtains:cs', 0, 1, 3.0, 0.3).set('movers:bedroom-1-balcony-sliding-door', 0, 1, 2.2, 2.4).hold(4.8, { drift: 0.03 });
  T.lt('Bedroom 1 balcony', `${size('Bedroom 1 balcony')} · wicker armchair · morning sun`, { kicker: K('Outdoors'), dur: 5, delay: 1.2 });
  T.la(8, V([9.95, 1.55, -6.4], [11.6, 1.3, -6.6], W), V([11.2, 1.5, -5.3], [11.3, 0.65, -7.6], W), { label: 'b1 balcony' });
  T.hold(1, { drift: 0.03 });

  /* ---- bedroom 2 ---- */
  T.xf(0.8).chapter('Bedroom 2 & study');
  T.cutTo(walkPose(4.5, -3.4, [4.2, -6.0]));
  T.mv([4.0, -5.55], { look: [2.4, -7.6], speed: 0.45 });
  T.lt('Bedroom 2 & study', `${size('Bedroom 2')} · dark walnut study wall · storage bed · sliding wardrobe`, { kicker: K('Bedrooms'), dur: 6.5 });
  T.turn([2.6, -4.6], 6, { pitch: -0.12 }).hold(1);
  T.lt('Study desk', '32″ LG monitor · water-cooled PC · MacBook Pro on a walnut riser · Logitech keys', { dur: 5.2, delay: 0.6 });
  T.xf(0.6).la(6, V([2.62, 1.75, -6.0], [2.62, 0.95, -4.65], 48), V([2.62, 1.7, -5.9], [2.62, 0.98, -4.65], 48), { label: 'desk wide' });
  T.xf(0.6).la(4.5, V([2.8, 1.3, -5.38], [2.62, 0.76, -4.98], D - 2), V([2.45, 1.3, -5.38], [2.62, 0.76, -4.98], D - 2), { label: 'keyboard' });
  T.xf(0.6).la(4, V([2.85, 1.15, -5.45], [3.26, 0.95, -4.8], D - 4), V([2.75, 1.0, -5.3], [3.26, 0.92, -4.8], D - 4), { label: 'pc' });
  T.xf(0.6).la(4, V([2.45, 1.1, -5.4], [1.99, 0.85, -4.72], D - 4), V([2.25, 1.0, -5.35], [1.99, 0.83, -4.72], D - 4), { label: 'macbook' });
  T.xf(0.6).set('movers:bedroom-2.*(wardrobe|slid)', 0, 1, 2.4, 0.8).la(5.5, V([2.9, 1.6, -5.3], [4.4, 1.25, -6.9], 56), V([3.0, 1.55, -5.5], [4.4, 1.25, -7.3], 56), { label: 'b2 wardrobe' });
  T.set('movers:bedroom-2.*(wardrobe|slid)', 1, 0, 1.6, 0.2);
  T.xf(0.6).la(5, V([3.75, 1.3, -6.0], [2.5, 0.7, -7.6], D + 6), V([3.75, 1.15, -7.0], [2.4, 0.75, -7.6], D + 6), { label: 'b2 bed' });

  /* ---- master bedroom (owner 2026-11-12: Option 3 · gaming wall on the Hall 1 wall + walnut balcony wall,
     TV wall 'Beige S-curve + study cabinet', bed 'Dreamburst tufted wingback · mushroom taupe') ---- */
  T.xf(0.8).chapter('Master bedroom');
  T.cutTo(walkPose(3.85, -1.3, [3.2, 2.0]));
  T.mv([3.05, 1.15], { look: [1.3, 3.7], speed: 0.48 });
  T.lt('Master bedroom', `${size('Master bedroom')} · 6 × 7 ft tufted wingback bed · walnut balcony wall · gaming wall`, { kicker: K('Master suite'), dur: 7 });
  T.hold(1.5, { drift: 0.04 });
  T.mv([3.1, 3.25], { look: [1.2, 0.6], speed: 0.4 });
  T.hold(1.5, { drift: 0.03 });
  T.lt('Study cabinet', 'Fold-out work niche with lit shelves · swivel chair · upper cupboards', { dur: 5.2, delay: 0.5 });
  T.xf(0.6).set('movers:master-bedroom/option3/gaming-wall:m[34]', 0, 1, 2.4, 1.0).la(6, V([2.45, 1.5, 2.65], [0.4, 1.4, 0.75], 50), V([2.05, 1.45, 2.5], [0.4, 1.4, 0.75], 50), { label: 'study cabinet' });
  T.lt('Gaming wall', 'Beige S-curve plaster · walnut slats · PS5 and DualSense dock in the console bay', { dur: 5, delay: 0.4 });
  T.xf(0.6).la(5.5, V([1.0, 1.05, 1.95], [1.6, 0.55, 0.4], 44), V([2.2, 1.0, 1.95], [1.6, 0.55, 0.4], 44), { label: 'console' });
  T.lt('Dreamburst wingback bed', 'Tufted wingback in mushroom taupe · 6 × 7 ft mattress · under-bed glow', { dur: 5, delay: 0.4 });
  T.xf(0.6).la(5.5, V([2.95, 1.3, 3.0], [1.66, 0.95, 4.25], 44), V([2.95, 1.2, 3.65], [1.66, 0.95, 4.25], 44), { label: 'bed' });
  T.lt('Walnut balcony wall', 'Rounded walnut header over the sliders · lit clay arch niche · plaster moon · oak canopy', { dur: 5.5, delay: 0.4 });
  T.xf(0.6).la(6, V([2.9, 1.55, 1.9], [0.9, 1.7, 4.9], 54), V([3.0, 1.5, 2.6], [1.2, 2.35, 4.6], 54), { label: 'balcony wall' });

  /* ---- walk-in: through the hidden panel door in the east wall ---- */
  T.xf(0.7).chapter('Walk-in wardrobe');
  T.cutTo(walkPose(3.0, 3.6, [3.75, 2.4], 1.55, PITCH, 66), { snap: false });
  T.hold(0.8).set('movers:master-bedroom/option3/east-panels:m9', 0, 1, 2.4).hold(2.6);
  // direct: the east-panels group's footprint box spans its own doorway in the obstacle map
  T.mv([3.25, 2.75], { look: [6.7, 2.7], speed: 0.4, direct: true });
  T.mv([4.4, 2.75], { look: [6.7, 2.6], speed: 0.45, direct: true });
  T.lt('Walk-in wardrobe', `${size('Dress')} · hidden panel door in the bedroom wall · full-height mirror · greige sliding wardrobe`, { kicker: K('Master suite'), dur: 6 });
  T.hold(2.0, { drift: 0.05 });
  T.xf(0.6).set('movers:31a-slider', 0, 1, 2.6, 0.8).la(6, V([6.35, 1.55, 2.85], [4.2, 1.3, 1.6], 56), V([6.1, 1.5, 2.9], [4.0, 1.25, 1.7], 56), { label: 'sliders' });
  T.set('movers:31a-slider', 1, 0, 1.5, 0.2).hold(1.6);

  /* ---- master bathroom ---- */
  T.xf(0.7).chapter('Master bathroom');
  T.cutTo(walkPose(5.75, 2.45, [5.6, 4.6]));
  T.mv([5.45, 3.8], { look: [4.4, 4.6], speed: 0.4 });
  T.lt('Master bathroom', `${size('Master toilet')} · sink cabinet · faceted round mirror · walk-in shower`, { kicker: K('Master suite'), dur: 6 });
  T.hold(1.2, { drift: 0.03 });
  T.xf(0.6).la(5.5, V([6.4, 1.6, 3.6], [4.4, 1.2, 4.7], W), V([6.2, 1.55, 3.75], [4.6, 1.1, 4.8], W), { label: 'bath wide' });
  T.xf(0.6).set('movers:bath-vanity:m12', 0, 1, 1.4, 0.9).la(4.5, V([5.25, 1.35, 3.85], [5.25, 1.35, 5.04], 46), V([5.25, 1.2, 4.1], [5.25, 1.05, 5.04], 46), { label: 'vanity' });
  T.set('movers:bath-vanity:m12', 1, 0, 1.2, 0.2);

  /* ---- master balcony (day) ---- */
  T.xf(0.8).chapter('Master balcony');
  // option 3: look over the bed at the walnut balcony wall while the sheers gather and the slider opens, then step out east of the bed
  T.cutTo({ x: 1.7, z: 1.3, yaw: Math.PI, pitch: -0.06, eye: 1.6, fov: W }, { snap: false });
  T.set('movers:master-bedroom/fixed/curtains:cs', 0, 1, 3.0, 0.3).set('movers:master-balcony-sliding-door', 0, 1, 2.4, 2.4).hold(5.0, { drift: 0.0 });
  T.xf(0.6).cutTo(walkPose(2.95, 4.45, Math.PI, 1.55), { snap: false });
  T.mv([2.5, 6.3], { look: [6.5, 6.0], speed: 0.45, direct: true });
  T.lt('Master balcony', `${size('Master balcony')} · teal cosy L-seat · backlit arch niche · festoon lights`, { kicker: K('Outdoors'), dur: 6.5 });
  T.mv([4.3, 6.75], { look: [6.6, 6.0], speed: 0.4 });
  T.xf(0.6).la(4.5, V([5.2, 1.0, 6.7], [6.6, 0.75, 6.1], D), V([5.4, 1.1, 6.4], [6.65, 0.8, 5.8], D), { label: 'cushions' });
  T.xf(0.6).la(5, V([2.0, 1.55, 6.3], [0.1, 1.6, 6.25], 50), V([1.3, 1.5, 6.25], [0.1, 1.55, 6.25], 50), { label: 'arch west' });

  /* ---- evening ---- */
  T.xf(1.0).chapter('Evening');
  T.set('light', 'evening', 'evening');
  T.lt('Golden hour', 'Festoon lights, backlit arch and warm LED lines after sunset', { kicker: K('Evening'), dur: 5.5, delay: 1.0 });
  T.la(7, V([1.0, 1.5, 6.75], [6.5, 1.5, 5.9], W), V([1.6, 1.5, 6.4], [6.5, 1.35, 5.9], W), { label: 'balcony eve' });
  T.xf(0.6).la(4.5, V([1.2, 1.4, 6.4], [0.1, 1.5, 6.25], 46), V([0.9, 1.6, 6.3], [0.1, 1.7, 6.25], 46), { label: 'arch eve' });
  T.xf(0.8).set('movers:master-balcony-sliding-door', 1, 0).set('movers:master-bedroom/fixed/curtains:cs', 1, 0).set('movers:master-bedroom/option3/gaming-wall:m[34]', 1, 0);
  // from the bed (option 3): game night on the gaming wall, then the screen drops for a movie
  T.cutTo({ x: 1.66, z: 3.75, yaw: 0.12, pitch: -0.06, eye: 1.2, fov: W }, { snap: false });
  T.set('mood:Master bedroom', 'normal', 'gaming', 0, 0.2);
  T.lt('Game night', 'Gaming mood: the TV backlight and LED lines follow the game', { kicker: K('Evening'), dur: 5, delay: 0.4 });
  T.hold(5.5, { drift: 0.0 });
  T.set('projector:Master bedroom', 'on', 'on');
  T.lt('Movie night', '100″ drop-down screen · projector lowers from the canopy', { dur: 5.5, delay: 0.3 });
  T.turn(0, 4, { pitch: 0.14, fov: 50 }).hold(3);
  T.xf(0.8).set('projector:Master bedroom', 'off', 'off').set('mood:Master bedroom', 'normal', 'normal');
  // living & dining at night: the TV wall's cove glow, then on to the formal hall
  T.lt('Living room at night', 'Warm cove light over the microcement TV wall · lit niche shelves', { dur: 5, delay: 0.5 });
  T.la(6.5, V([6.3, 1.5, -2.95], [8.6, 1.35, 0], 56), V([6.9, 1.45, -2.4], [8.8, 1.3, 0], 56), { label: 'living eve' });
  T.xf(0.7).cutTo(walkPose(4.1, -3.5, [8.8, -0.5]));
  T.mv([4.9, -3.1], { look: [9.2, -0.6], speed: 0.35 });
  T.turn([1.6, -0.6], 7);
  T.xf(0.8).la(6, V([2.9, 1.5, -3.6], [1.5, 0.6, -0.6], W), V([3.4, 1.5, -2.3], [1.2, 0.6, -0.6], W), { label: 'formal eve' });

  /* ---- outro ---- */
  T.xf(1.2).chapter('Outro & credits');
  T.set('light', 'day', 'day');
  T.card('title', 7.5, { over: 'Thank you for watching', title: 'Candeur Crescent 3302', sub: 'Home tour', note: 'Every room shown in its current default design' }, { fadeIn: 1.2, fadeOut: 1.0 });
  T.la(9, V([17.5, 11.5, -11.0], [5.6, 0.2, -1.0], 42), V([21.0, 14.5, 7.5], [5.6, 0.2, -0.6], 42), { orbit: true });
  T.card('credits', 12, credits(), { fadeIn: 1.0, fadeOut: 1.2 });
  T.la(12, V([21.0, 14.5, 7.5], [5.6, 0.2, -0.6], 42), V([16.0, 18.5, 12.5], [5.6, 0.2, -0.6], 42), { orbit: true });
  return T;
}

/* ---------------- thumbnail ---------------- */
// hero frame = the living & dining establishing view (time in the timeline), with the title on the left
export const THUMB_T = 85.4;
export const THUMB_CARD = { kind: 'thumb', a: 1, u: 5, dur: 10, data: { over: 'Home tour', title: 'Candeur Crescent 3302', sub: '3 BHK · every room in detail' } };

/* ---------------- encode: music + 1080p + 720p + chapters ---------------- */
export async function finish({ FFMPEG, FRAMES, OUT, FPS, dur }) {
  const wav = path.join(FRAMES, 'music.wav');
  writeMusic(wav, dur);
  console.log('music →', wav);
  const run = a => { const r = spawnSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...a], { stdio: 'inherit' }); if (r.status) throw new Error('ffmpeg failed'); };
  run(['-framerate', String(FPS), '-i', path.join(FRAMES, 'f_%05d.jpg'), '-i', wav,
    // JPEG frames are full-range (yuvj420p): convert to TV range so phones / WhatsApp show correct contrast
    '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', '-color_range', 'tv',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT]);
  const small = OUT.replace(/\.mp4$/, '_720p.mp4');
  run(['-i', OUT, '-vf', 'scale=1280:720:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-maxrate', '1700k', '-bufsize', '3400k',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', small]);
  console.log('wrote', small);
}
