/* Room studio: a real-scale, one-point-perspective room where customers arrange the catalogue.
   Positions are stored in centimetres (x from the left wall, z = depth from the back wall, or height for wall items),
   so a layout survives room-size changes and can be shared as a short link. */
import { drawInner, decor, shade, type ArtType, type Colors } from './art.js';
import { PRODUCTS, CATS, SEP, type Product, type Lang } from './data.js';

export interface StudioApi {
  t: (k: string) => string; lang: () => Lang; money: (n: number) => string; esc: (s: string) => string;
  reduced: boolean; colorsOf: (p: Product, i: number) => Colors; theme: () => 'light' | 'dark';
  openOverlay: (el: HTMLElement, replace?: boolean) => void; requestClose: (el: HTMLElement) => void;
  addMany: (lines: { key: string; color: number; qty: number }[]) => { added: number; capped: boolean };
  openCart: () => void; toast: (m: string) => void;
  load: (k: string) => unknown; save: (k: string, v: unknown) => void;
}
export interface OpenOpts { preset?: string; add?: { id: string; c: number }; sep?: string; shared?: string; origin?: Element | null; replace?: boolean }

/* ---------- geometry ---------- */
const NS = 'http://www.w3.org/2000/svg';
const VW = 1200, VH = 760, HZ = 200, FL = 520, CAM = 700, PX = 2, CEIL = 270, ZMAX = 285, MAXP = 40;
const sc = (z: number) => CAM / (CAM - z);
const yOf = (z: number) => HZ + (FL - HZ) * sc(z);
const zOfY = (y: number) => CAM * (1 - (FL - HZ) / Math.max(y - HZ, 1));
const xOf = (fx: number, z: number, W: number) => VW / 2 + (fx - W / 2) * PX * sc(z);
const fxOf = (x: number, z: number, W: number) => W / 2 + (x - VW / 2) / (PX * sc(z));
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const r1 = (n: number) => Math.round(n * 10) / 10;

/* ---------- catalogue of placeable things ---------- */
type Place = 'floor' | 'wall' | 'flat';
type L3 = Record<Lang, string>;
interface Sw { m: string; name: L3 }
interface Item { id: string; place: Place; w: number; d: number; span: number; ax: number; ay: number; cat: string; product?: Product; name: L3; sw: Sw[]; svg: (c: number) => string; lamp?: boolean; h0?: number; thumb: (c: number) => string }

const SPAN: Record<ArtType, number> = { sofa: 324, sofaWide: 368, armchair: 216, bed: 340, bedset: 392, wardrobe3: 232, wardrobe4: 292, kidwardrobe: 232, dresser: 232, dining: 364, chair: 128, kitchen: 372, kitchenCorner: 370, desk: 304, officechair: 158, bunkbed: 266, shelf: 184, tvstand: 320, coffeetable: 264 };
/** What the drawing shows is sometimes wider than the headline size (a bed with nightstands, a table with its chairs). */
const OVR: Record<string, [number, number]> = { gulsara: [280, 200], dasturxon: [270, 90], bog: [230, 80], quvnoq: [200, 90], ravon: [280, 60], zilol: [240, 60] };
const C3 = (uz: string, ru: string, en: string): L3 => ({ uz, ru, en });
const DC: Record<string, Sw> = {
  pom: { m: '#B8293F', name: C3('Anor', 'Гранат', 'Pomegranate') }, indigo: { m: '#3E4E8C', name: C3('Indigo', 'Индиго', 'Indigo') },
  sage: { m: '#7E9A7A', name: C3('Shalfey', 'Шалфей', 'Sage') }, sand: { m: '#DCCDB3', name: C3('Qum', 'Песок', 'Sand') },
  mustard: { m: '#D9A441', name: C3('Xantal', 'Горчица', 'Mustard') }, milk: { m: '#F1ECE2', name: C3('Sut rang', 'Молочный', 'Milk') },
};
const clock = (c: string) => `<circle r="44" fill="#F8F9F6" stroke="${c}" stroke-width="8"/>${[0, 1, 2, 3].map(i => `<rect x="-2" y="-38" width="4" height="9" fill="${c}" transform="rotate(${i * 90})"/>`).join('')}<path d="M0 0V-26M0 0L18 10" stroke="#19224A" stroke-width="5" stroke-linecap="round"/><circle r="4" fill="#B8293F"/>`;
const thumbSvg = (vb: string, inner: string) => `<svg viewBox="${vb}" aria-hidden="true">${inner}</svg>`;

/* ---------- room looks ---------- */
const WALLS = ['#F1EEE7', '#D3DEC6', '#CCDAE6', '#E9DAC0', '#ECCFCB', '#3F4A7C'];
const FLOORS = [{ b: '#C9A57A', l: '#B08A5F', k: 'plank' }, { b: '#7E5539', l: '#62402A', k: 'plank' }, { b: '#E8E4DC', l: '#CFC8BA', k: 'tile' }, { b: '#A3ABBF', l: '#939CB2', k: 'carpet' }];
type Win = 'l' | 'r' | 'n';
interface Piece { u: number; id: string; c: number; x: number; z: number; f: boolean }
interface State { w: number; wall: number; floor: number; win: Win; eve: boolean; ps: Piece[] }
type Row = [string, number, number, number, number?];
interface Preset { id: string; w: number; wall: number; floor: number; win: Win; rows: Row[] }
const PRESETS: Preset[] = [
  { id: 'living', w: 480, wall: 0, floor: 0, win: 'l', rows: [['d-rug', 0, 250, 150], ['samarqand', 0, 250, 60], ['oqsaroy', 0, 250, 160], ['lola', 0, 405, 120], ['javon', 0, 435, 20], ['d-lamp', 0, 100, 40], ['d-plant', 0, 35, 30], ['d-art', 0, 250, 165]] },
  { id: 'bedroom', w: 440, wall: 1, floor: 0, win: 'r', rows: [['d-rug', 1, 230, 240], ['marvarid', 0, 230, 100], ['nafis', 0, 62, 23], ['d-plant', 2, 415, 30], ['d-art', 1, 230, 185]] },
  { id: 'dining', w: 520, wall: 0, floor: 2, win: 'r', rows: [['zilol', 0, 150, 30], ['dasturxon', 2, 370, 190], ['d-clock', 0, 150, 205], ['d-plant', 0, 495, 30]] },
  { id: 'kids', w: 440, wall: 2, floor: 3, win: 'l', rows: [['d-rug', 2, 220, 210], ['quvnoq', 0, 330, 48], ['kitobxon', 0, 95, 30], ['d-clock', 1, 220, 200]] },
  { id: 'office', w: 400, wall: 3, floor: 1, win: 'r', rows: [['rahbar', 0, 170, 40], ['qulay', 0, 170, 110], ['javon', 0, 45, 18], ['d-plant', 0, 375, 30], ['d-art', 2, 170, 175]] },
  { id: 'empty', w: 420, wall: 0, floor: 0, win: 'l', rows: [] },
];

export function initStudio(api: StudioApi) {
  const t = api.t;
  const L = () => api.lang();

  /* ---------- items ---------- */
  const ITEMS = new Map<string, Item>();
  for (const p of PRODUCTS) {
    const n = (p.dims.match(/\d+/g) ?? []).map(Number);
    const [w, d] = OVR[p.id] ?? [n[0] ?? 100, p.dims.includes('Ø') ? n[0] : (n[1] ?? 50)];
    ITEMS.set(p.id, {
      id: p.id, place: 'floor', w, d, span: SPAN[p.art], ax: 200, ay: 262, cat: p.cat, product: p, name: p.name,
      sw: p.swatches.map(s => ({ m: s.m, name: s.name })), svg: c => drawInner(p.art, api.colorsOf(p, c)),
      thumb: c => thumbSvg('0 0 400 280', drawInner(p.art, api.colorsOf(p, c))),
    });
  }
  const dec = (it: Omit<Item, 'cat' | 'thumb'> & { vb: string }) => ITEMS.set(it.id, { ...it, cat: 'decor', thumb: c => thumbSvg(it.vb, it.svg(c)) });
  dec({ id: 'd-rug', place: 'flat', w: 240, d: 160, span: 660, ax: 0, ay: 0, name: C3('Gilam', 'Ковёр', 'Rug'), sw: [DC.pom, DC.indigo, DC.sage], vb: '-340 -70 680 140', svg: c => decor.rug().replace('fill="#B8293F"', `fill="${[DC.pom, DC.indigo, DC.sage][c].m}"`) });
  dec({ id: 'd-plant', place: 'floor', w: 50, d: 50, span: 68, ax: 0, ay: 70, name: C3('Gul', 'Растение', 'Plant'), sw: [DC.pom, DC.indigo, DC.sand], vb: '-90 -170 180 250', svg: c => decor.plant().replace('fill="#B8293F"', `fill="${[DC.pom, DC.indigo, DC.sand][c].m}"`) });
  dec({ id: 'd-lamp', place: 'floor', w: 45, d: 45, span: 72, ax: 0, ay: 209, lamp: true, name: C3('Torshyer', 'Торшер', 'Floor lamp'), sw: [DC.sand, DC.mustard, DC.milk], vb: '-110 -80 220 300', svg: c => decor.lamp().replace('class="glow"', 'opacity="0"').replace('fill="#DCCDB3"', `fill="${[DC.sand, DC.mustard, DC.milk][c].m}"`) });
  dec({ id: 'd-art', place: 'wall', w: 100, d: 0, span: 188, ax: 0, ay: 0, h0: 165, name: C3('Rasm', 'Картина', 'Picture'), sw: [DC.pom, DC.indigo, DC.mustard], vb: '-110 -80 220 160', svg: c => decor.art().replace('fill="#B8293F"', `fill="${[DC.pom, DC.indigo, DC.mustard][c].m}"`) });
  dec({ id: 'd-clock', place: 'wall', w: 40, d: 0, span: 96, ax: 0, ay: 0, h0: 200, name: C3('Soat', 'Часы', 'Clock'), sw: [DC.indigo, DC.pom], vb: '-60 -60 120 120', svg: c => clock([DC.indigo, DC.pom][c].m) });
  const item = (id: string) => ITEMS.get(id)!;

  /* ---------- state ---------- */
  let uid = 0;
  const fresh = (pr: Preset, eve = api.theme() === 'dark'): State => ({ w: pr.w, wall: pr.wall, floor: pr.floor, win: pr.win, eve, ps: pr.rows.map(([id, c, x, z, f]) => clampPiece({ u: ++uid, id, c, x, z, f: !!f }, pr.w)) });
  function clampPiece(p: Piece, W: number): Piece {
    const it = item(p.id);
    if (it.place === 'wall') p.z = clamp(p.z, 40, CEIL - 25);
    else p.z = clamp(p.z, it.place === 'flat' ? 20 : Math.min(it.d / 2, ZMAX), ZMAX);
    p.x = it.w >= W ? W / 2 : clamp(p.x, it.w / 2, W - it.w / 2);
    p.c = Number.isInteger(p.c) && p.c >= 0 && p.c < it.sw.length ? p.c : 0;
    return p;
  }
  /** Accepts anything (storage, a link someone sent) and returns a safe, valid room. */
  function sanitize(raw: unknown): State | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
    const w = Math.round(clamp(num(o.w, 420), 250, 700) / 10) * 10;
    const s: State = { w, wall: clamp(Math.round(num(o.wall, 0)), 0, WALLS.length - 1), floor: clamp(Math.round(num(o.floor, 0)), 0, FLOORS.length - 1), win: (['l', 'r', 'n'] as Win[]).includes(o.win as Win) ? o.win as Win : 'l', eve: o.eve === true, ps: [] };
    if (Array.isArray(o.ps)) for (const it of o.ps.slice(0, MAXP)) {
      if (!it || typeof it !== 'object') continue; const q = it as Record<string, unknown>;
      if (typeof q.id !== 'string' || !ITEMS.has(q.id)) continue;
      s.ps.push(clampPiece({ u: ++uid, id: q.id, c: Math.round(num(q.c, 0)), x: num(q.x, w / 2), z: num(q.z, 100), f: q.f === true }, w));
    }
    return s;
  }
  const encode = (s: State) => ['1', s.w, s.wall, s.floor, s.win, s.eve ? 1 : 0, s.ps.map(p => [p.id, p.c, Math.round(p.x), Math.round(p.z), p.f ? 1 : 0].join('.')).join('~')].join('_');
  function decode(code: string): State | null {
    const parts = String(code).slice(0, 2000).split('_'); if (parts[0] !== '1' || parts.length < 6) return null;
    const ps = (parts[6] ?? '').split('~').filter(Boolean).map(r => { const [id, c, x, z, f] = r.split('.'); return { id, c: +c, x: +x, z: +z, f: f === '1' }; });
    return sanitize({ w: +parts[1], wall: +parts[2], floor: +parts[3], win: parts[4], eve: parts[5] === '1', ps });
  }

  let state: State = sanitize(api.load('rm-studio')) ?? fresh(PRESETS[0]);
  let past: string[] = []; let future: string[] = [];
  let selected: number | null = null;
  const snap = () => JSON.stringify(state);
  const pieceOf = (u: number | null) => state.ps.find(p => p.u === u) ?? null;
  let saveT = 0;
  const persist = () => { clearTimeout(saveT); saveT = window.setTimeout(() => api.save('rm-studio', state), 250); };
  function commit(before: string) { if (before === snap()) return; past.push(before); if (past.length > 80) past.shift(); future = []; persist(); syncChrome(); }
  function restore(json: string) { const s = sanitize(JSON.parse(json)); if (!s) return; state = s; selected = null; buildRoom(); buildPieces(); syncChrome(); persist(); }

  /* ---------- placement ---------- */
  function place(p: Piece, W = state.w) {
    const it = item(p.id);
    if (it.place === 'wall') return { x: xOf(p.x, 0, W), y: FL - p.z * PX, k: it.w * PX / it.span, s: 1 };
    const s = sc(p.z); return { x: xOf(p.x, p.z, W), y: yOf(p.z), k: it.w * PX * s / it.span, s };
  }
  const sortKey = (p: Piece) => { const it = item(p.id); return it.place === 'wall' ? -2000 + p.x / 1000 : it.place === 'flat' ? -1000 + p.z : p.z; };
  const foot = (p: Piece) => { const it = item(p.id); return { x0: p.x - it.w / 2, x1: p.x + it.w / 2, z0: p.z - it.d / 2, z1: p.z + it.d / 2 }; };
  function autoPlace(p: Piece) {
    const it = item(p.id); const W = state.w;
    if (it.place === 'wall') {
      const winX = state.win === 'n' ? -999 : (state.win === 'l' ? W * .26 : W * .74);
      let best = { x: W / 2, sc: Infinity };
      for (let x = it.w / 2; x <= W - it.w / 2; x += 10) {
        let s = Math.abs(x - W / 2) * .05 + (Math.abs(x - winX) < 60 + it.w / 2 ? 1000 : 0);
        for (const q of state.ps) if (item(q.id).place === 'wall' && Math.abs(q.x - x) < (item(q.id).w + it.w) / 2 + 10) s += 500;
        if (s < best.sc) best = { x, sc: s };
      }
      p.x = best.x; p.z = it.h0 ?? 160; return;
    }
    if (it.place === 'flat') { p.x = W / 2; p.z = 150; return; }
    const others = state.ps.filter(q => q !== p && item(q.id).place === 'floor').map(foot);
    let best = { x: W / 2, z: it.d / 2 + 20, sc: Infinity };
    for (let z = Math.min(it.d / 2, ZMAX); z <= ZMAX; z += 20) for (let x = it.w / 2; x <= Math.max(it.w / 2, W - it.w / 2); x += 15) {
      const f = { x0: x - it.w / 2, x1: x + it.w / 2, z0: z - it.d / 2, z1: z + it.d / 2 };
      let ov = 0; for (const o of others) ov += Math.max(0, Math.min(f.x1, o.x1) - Math.max(f.x0, o.x0)) * Math.max(0, Math.min(f.z1, o.z1) - Math.max(f.z0, o.z0));
      const s = ov * 10 + Math.abs(x - W / 2) * .4 + Math.abs(z - (it.d / 2 + 40)) * .6;
      if (s < best.sc) best = { x, z, sc: s };
    }
    p.x = best.x; p.z = best.z;
  }

  /* ---------- scene markup (shared by the live studio, previews and the picture export) ---------- */
  function roomMarkup(s: State, P: string) {
    const W = s.w, half = W * PX / 2, xl = VW / 2 - half, xr = VW / 2 + half, top = FL - CEIL * PX;
    const E = (x: number, y: number) => `${r1(VW / 2 + (x - VW / 2) * 14)},${r1(HZ + (y - HZ) * 14)}`;
    const wall = WALLS[s.wall], fl = FLOORS[s.floor];
    const dark = s.wall === WALLS.length - 1;
    let m = `<defs><clipPath id="${P}-fc"><polygon points="${xl},${FL} ${xr},${FL} ${E(xr, FL)} ${E(xl, FL)}"/></clipPath>
      <radialGradient id="${P}-glow"><stop offset="0" stop-color="#FFD98A" stop-opacity=".9"/><stop offset=".45" stop-color="#FFC56B" stop-opacity=".35"/><stop offset="1" stop-color="#FFC56B" stop-opacity="0"/></radialGradient></defs>`;
    m += `<polygon data-k="ceil" points="${xl},${top} ${xr},${top} ${E(xr, top)} ${E(xl, top)}" style="fill:${shade(wall, .35)}"/>`;
    m += `<rect data-k="back" x="${xl}" y="${top}" width="${xr - xl}" height="${FL - top}" style="fill:${wall}"/>`;
    m += `<polygon data-k="left" points="${xl},${top} ${xl},${FL} ${E(xl, FL)} ${E(xl, top)}" style="fill:${shade(wall, -.07)}"/>`;
    m += `<polygon data-k="right" points="${xr},${top} ${xr},${FL} ${E(xr, FL)} ${E(xr, top)}" style="fill:${shade(wall, -.13)}"/>`;
    m += `<polygon data-k="floor" points="${xl},${FL} ${xr},${FL} ${E(xr, FL)} ${E(xl, FL)}" style="fill:${fl.b}"/>`;
    // floor pattern in true perspective
    let lines = '';
    if (fl.k === 'plank') {
      const step = 18; const cols = Math.ceil(W / step);
      for (let i = 0; i <= cols; i++) { const x0 = xOf(Math.min(i * step, W), 0, W); lines += `<line x1="${r1(x0)}" y1="${FL}" x2="${E(x0, FL).split(',')[0]}" y2="${E(x0, FL).split(',')[1]}"/>`; }
      for (let i = 0; i < cols; i++) for (let z = (i % 3) * 32 + 20; z < ZMAX + 60; z += 96) {
        const a = Math.min(i * step, W), b = Math.min((i + 1) * step, W), y = r1(yOf(Math.min(z, 400)));
        if (z > ZMAX + 50) continue;
        lines += `<line x1="${r1(xOf(a, z, W))}" y1="${y}" x2="${r1(xOf(b, z, W))}" y2="${y}"/>`;
      }
    } else if (fl.k === 'tile') {
      for (let fx = 0; fx <= W; fx += 50) { const x0 = xOf(fx, 0, W); const e = E(x0, FL).split(','); lines += `<line x1="${r1(x0)}" y1="${FL}" x2="${e[0]}" y2="${e[1]}"/>`; }
      for (let z = 50; z <= ZMAX + 50; z += 50) { const y = r1(yOf(Math.min(z, 400))); lines += `<line x1="${r1(xOf(0, z, W))}" y1="${y}" x2="${r1(xOf(W, z, W))}" y2="${y}"/>`; }
    } else {
      for (let z = 30; z <= ZMAX + 40; z += 60) { const y = r1(yOf(z)); lines += `<line x1="${r1(xOf(0, z, W))}" y1="${y}" x2="${r1(xOf(W, z, W))}" y2="${y}" opacity=".35"/>`; }
    }
    m += `<g clip-path="url(#${P}-fc)" stroke="${fl.l}" stroke-width="1.6" fill="none" data-k="lines">${lines}</g>`;
    // baseboards and corners
    const base = shade(wall, dark ? .12 : -.2);
    m += `<rect x="${xl}" y="${FL - 12}" width="${xr - xl}" height="12" style="fill:${base}" data-k="base"/>`;
    m += `<polygon points="${xl},${FL - 12} ${xl},${FL} ${E(xl, FL)} ${E(xl, FL - 12)}" style="fill:${shade(base, -.05)}" data-k="base"/>`;
    m += `<polygon points="${xr},${FL - 12} ${xr},${FL} ${E(xr, FL)} ${E(xr, FL - 12)}" style="fill:${shade(base, -.1)}" data-k="base"/>`;
    m += `<path d="M${xl} ${top}V${FL}M${xr} ${top}V${FL}M${xl} ${FL}L${E(xl, FL).replace(',', ' ')}M${xr} ${FL}L${E(xr, FL).replace(',', ' ')}" stroke="#19224A" stroke-opacity=".12" stroke-width="2" fill="none"/>`;
    // window
    if (s.win !== 'n') {
      const ww = Math.min(110, W * .24), fxw = s.win === 'l' ? W * .26 : W * .74;
      const x0 = r1(xOf(fxw - ww / 2, 0, W)), x1 = r1(xOf(fxw + ww / 2, 0, W)), rr = r1((x1 - x0) / 2), sill = FL - 90 * PX, tw = sill - 150 * PX;
      const arch = `M${x0} ${sill}V${tw + rr}A${rr} ${rr} 0 0 1 ${x1} ${tw + rr}V${sill}Z`;
      const stars = [[.2, .25], [.7, .18], [.45, .4], [.15, .55], [.8, .5], [.55, .65]].map(([a, b], i) => `<circle cx="${r1(x0 + a * (x1 - x0))}" cy="${r1(tw + b * (sill - tw))}" r="${i % 2 ? 2 : 2.8}" fill="#fff"/>`).join('');
      m += `<defs><clipPath id="${P}-wc"><path d="${arch}"/></clipPath>
        <linearGradient id="${P}-sd" gradientUnits="userSpaceOnUse" x1="0" y1="${tw}" x2="0" y2="${sill}"><stop offset="0" stop-color="#9DBBD6"/><stop offset="1" stop-color="#E8EEF0"/></linearGradient>
        <linearGradient id="${P}-se" gradientUnits="userSpaceOnUse" x1="0" y1="${tw}" x2="0" y2="${sill}"><stop offset="0" stop-color="#0C1135"/><stop offset="1" stop-color="#4B3B70"/></linearGradient></defs>
        <g clip-path="url(#${P}-wc)"><rect x="${x0}" y="${tw}" width="${x1 - x0}" height="${sill - tw}" fill="url(#${P}-sd)"/>
        <rect data-k="skye" x="${x0}" y="${tw}" width="${x1 - x0}" height="${sill - tw}" fill="url(#${P}-se)" style="opacity:${s.eve ? 1 : 0}"/>
        <g data-k="stars" style="opacity:${s.eve ? 1 : 0}">${stars}</g>
        <circle data-k="sun" cx="${r1(x1 - rr * .6)}" cy="${r1(tw + rr * .85)}" r="${r1(rr * .24)}" fill="#F2D27A" style="opacity:${s.eve ? 0 : 1}"/>
        <g data-k="moon" style="opacity:${s.eve ? 1 : 0}"><circle cx="${r1(x1 - rr * .6)}" cy="${r1(tw + rr * .85)}" r="${r1(rr * .24)}" fill="#F4E8C1"/><circle cx="${r1(x1 - rr * .5)}" cy="${r1(tw + rr * .78)}" r="${r1(rr * .22)}" fill="url(#${P}-se)"/></g>
        <path d="M${x0} ${sill - 40}q${r1(rr * .7)} -${r1(rr * .6)} ${r1(rr * 1.1)} -${r1(rr * .2)}q${r1(rr * .5)} -${r1(rr * .45)} ${r1(rr * .9)} -${r1(rr * .05)}V${sill}H${x0}z" fill="#9FB0A0"/></g>
        <path d="${arch}" fill="none" stroke="#FAFAF7" stroke-width="10"/><line x1="${r1((x0 + x1) / 2)}" y1="${tw}" x2="${r1((x0 + x1) / 2)}" y2="${sill}" stroke="#FAFAF7" stroke-width="5"/><rect x="${x0 - 14}" y="${sill - 4}" width="${x1 - x0 + 28}" height="12" fill="#FAFAF7"/>
        <polygon data-k="patch" points="${x0},${FL} ${x1},${FL} ${r1(xOf(fxw + ww / 2 + 70, 170, W))},${r1(yOf(170))} ${r1(xOf(fxw - ww / 2 + 30, 170, W))},${r1(yOf(170))}" fill="#FFF6DE" style="opacity:${s.eve ? 0 : .3}"/>`;
    }
    // width ruler under the ceiling line
    const ra = clamp(xl + 6, 12, VW - 12), rb = clamp(xr - 6, 12, VW - 12), lbl = fmtLen(W);
    m += `<g class="st-ruler" data-k="ruler"><path d="M${ra} 26H${rb}M${ra} 18V34M${rb} 18V34" stroke="#19224A" stroke-opacity=".45" stroke-width="2" fill="none"/>
      <rect x="${VW / 2 - 46}" y="12" width="92" height="28" rx="14" fill="#19224A"/><text x="${VW / 2}" y="31" text-anchor="middle" fill="#F8F9F6" font-size="17" font-weight="600" font-family="Onest, Arial, sans-serif">${lbl}</text></g>`;
    return m;
  }
  const innerOf = (p: Piece) => { const it = item(p.id); return `<g class="sp-anim"><g class="sp-art" transform="translate(${-it.ax} ${-it.ay})">${it.svg(p.c)}</g></g>`; };
  const tfOf = (p: Piece, W = state.w) => { const { x, y, k } = place(p, W); return `translate(${r1(x)} ${r1(y)}) scale(${(p.f ? -k : k).toFixed(4)} ${k.toFixed(4)})`; };
  function glowMarkup(s: State, P: string) {
    return s.ps.filter(p => item(p.id).lamp).map(p => { const { x, y, k } = place(p, s.w); const cy = y + (-28 - 209) * k, r = 250 * k; return `<ellipse cx="${r1(x)}" cy="${r1(cy)}" rx="${r1(r)}" ry="${r1(r * .95)}" fill="url(#${P}-glow)"/>`; }).join('');
  }
  const dimStyle = (eve: boolean) => `fill:#1A2257;mix-blend-mode:multiply;opacity:${eve ? .6 : 0}`;
  /** In the evening furniture dims a little instead of being washed over, so lamp light stays behind it. */
  const pieceFilter = (eve: boolean) => (eve ? 'brightness(.8) saturate(.9)' : 'none');
  /** A complete still picture of a room (used for the homepage teaser and the preset cards). */
  function sceneMarkup(s: State, P: string, demoId?: string) {
    const ps = s.ps.slice().sort((a, b) => sortKey(a) - sortKey(b));
    const pieces = ps.map(p => { const g = `<g class="sp" transform="${tfOf(p, s.w)}">${innerOf(p)}</g>`; return p.id === demoId ? `<g class="demo-move">${g}</g>` : g; }).join('');
    return `${roomMarkup(s, P)}<rect width="${VW}" height="${VH}" style="${dimStyle(s.eve)}"/><g style="mix-blend-mode:screen;opacity:${s.eve ? 1 : 0}">${glowMarkup(s, P)}</g><g style="filter:${pieceFilter(s.eve)}">${pieces}</g>`;
  }

  /* ---------- live studio DOM ---------- */
  const rootEl = document.getElementById('studio')!;
  const svg = document.getElementById('stSvg') as unknown as SVGSVGElement;
  const stage = document.getElementById('stStage')!;
  svg.innerHTML = `<g id="stRoom"></g><rect id="stDim" width="${VW}" height="${VH}"/><g id="stGlow" style="mix-blend-mode:screen"></g><g id="stPieces"></g><g id="stGuides"></g>
    <rect id="stSel" rx="14" fill="none" stroke="#B8293F" stroke-width="3" stroke-dasharray="10 8" visibility="hidden"/>`;
  const roomG = svg.querySelector('#stRoom') as SVGGElement, piecesG = svg.querySelector('#stPieces') as SVGGElement;
  const dimR = svg.querySelector('#stDim') as SVGRectElement, glowG = svg.querySelector('#stGlow') as SVGGElement, guideG = svg.querySelector('#stGuides') as SVGGElement, selR = svg.querySelector('#stSel') as SVGRectElement;
  const tool = document.getElementById('stTool')!, emptyEl = document.getElementById('stEmpty')!, hintEl = document.getElementById('stHint')!, live = document.getElementById('stLive')!;
  const els = new Map<number, SVGGElement>();
  const announce = (m: string) => { live.textContent = ''; requestAnimationFrame(() => { live.textContent = m; }); };

  function buildRoom() {
    roomG.innerHTML = roomMarkup(state, 'st');
    dimR.setAttribute('style', dimStyle(state.eve));
    glowG.style.opacity = state.eve ? '1' : '0'; piecesG.style.filter = pieceFilter(state.eve);
  }
  /** Wall colour and lighting change in place so they fade instead of jumping. */
  function paintRoom() {
    const wall = WALLS[state.wall]; const set = (k: string, f: string) => roomG.querySelectorAll<SVGElement>(`[data-k="${k}"]`).forEach(e => { e.style.fill = f; });
    set('back', wall); set('left', shade(wall, -.07)); set('right', shade(wall, -.13)); set('ceil', shade(wall, .35));
    const base = shade(wall, state.wall === WALLS.length - 1 ? .12 : -.2); const bases = roomG.querySelectorAll<SVGElement>('[data-k="base"]');
    bases.forEach((e, i) => { e.style.fill = i === 0 ? base : shade(base, i === 1 ? -.05 : -.1); });
    const op = (k: string, v: number) => roomG.querySelectorAll<SVGElement>(`[data-k="${k}"]`).forEach(e => { e.style.opacity = String(v); });
    op('skye', state.eve ? 1 : 0); op('stars', state.eve ? 1 : 0); op('moon', state.eve ? 1 : 0); op('sun', state.eve ? 0 : 1); op('patch', state.eve ? 0 : .3);
    dimR.style.opacity = state.eve ? '.6' : '0'; glowG.style.opacity = state.eve ? '1' : '0'; piecesG.style.filter = pieceFilter(state.eve);
  }
  function makeEl(p: Piece) {
    const g = document.createElementNS(NS, 'g') as SVGGElement;
    g.setAttribute('class', 'sp'); g.dataset.u = String(p.u); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
    g.innerHTML = innerOf(p); label(g, p); g.setAttribute('transform', tfOf(p));
    els.set(p.u, g); return g;
  }
  const label = (g: SVGGElement, p: Piece) => g.setAttribute('aria-label', `${item(p.id).name[L()]}. ${t('studio.aria')}`);
  function buildPieces(drop = false) {
    piecesG.innerHTML = ''; els.clear();
    const sorted = state.ps.slice().sort((a, b) => sortKey(a) - sortKey(b));
    sorted.forEach((p, i) => { const g = makeEl(p); piecesG.appendChild(g); if (drop) dropIn(g, i * 70); });
    glows(); select(selected && pieceOf(selected) ? selected : null, false);
    emptyEl.hidden = state.ps.length > 0;
  }
  function order() {
    const sorted = state.ps.slice().sort((a, b) => sortKey(a) - sortKey(b));
    const cur = Array.from(piecesG.children);
    if (sorted.some((p, i) => cur[i] !== els.get(p.u))) sorted.forEach(p => { const g = els.get(p.u); if (g) piecesG.appendChild(g); });
  }
  const glows = () => { glowG.innerHTML = glowMarkup(state, 'st'); };
  function dropIn(g: SVGGElement, delay = 0) {
    if (api.reduced) return;
    (g.querySelector('.sp-anim') as SVGGElement).animate([{ transform: 'translateY(-320px)', opacity: 0 }, { transform: 'translateY(10px)', opacity: 1, offset: .72 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 560, delay, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' });
  }

  /* ---------- selection, toolbar, measurements ---------- */
  function boxOf(p: Piece) {
    const g = els.get(p.u); if (!g) return null;
    const art = g.querySelector('.sp-art') as SVGGElement; const bb = art.getBBox(); const it = item(p.id); const { x, y, k } = place(p);
    const sx = p.f ? -k : k; const xa = x + (bb.x - it.ax) * sx, xb = x + (bb.x + bb.width - it.ax) * sx;
    return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: y + (bb.y - it.ay) * k, y1: y + (bb.y + bb.height - it.ay) * k };
  }
  function select(u: number | null, focus = false) {
    selected = u; els.forEach((g, id) => g.classList.toggle('sel', id === u));
    const p = pieceOf(u);
    if (!p) { selR.setAttribute('visibility', 'hidden'); tool.hidden = true; guideG.innerHTML = ''; return; }
    drawSel(p); renderTool(); if (focus) els.get(p.u)?.focus({ preventScroll: true });
  }
  function drawSel(p: Piece) {
    const b = boxOf(p); if (!b) return; const pad = 10;
    selR.setAttribute('x', String(r1(b.x0 - pad))); selR.setAttribute('y', String(r1(b.y0 - pad)));
    selR.setAttribute('width', String(r1(b.x1 - b.x0 + pad * 2))); selR.setAttribute('height', String(r1(b.y1 - b.y0 + pad * 2)));
    selR.setAttribute('visibility', 'visible');
  }
  function fmtLen(cm: number) {
    const v = Math.max(0, Math.round(cm));
    if (v < 100) return `${v} ${t('cm')}`;
    const m = (v / 100).toFixed(v % 100 === 0 ? 0 : 1); return `${L() === 'en' ? m : m.replace('.', ',')} ${t('m')}`;
  }
  const pill = (x0: number, y: number, text: string, hot = false) => { const w = text.length * 9.4 + 24; const x = clamp(x0, w / 2 + 8, VW - w / 2 - 8); return `<g><rect x="${r1(x - w / 2)}" y="${r1(y - 15)}" width="${r1(w)}" height="30" rx="15" fill="${hot ? '#B8293F' : '#19224A'}"/><text x="${r1(x)}" y="${r1(y + 6)}" text-anchor="middle" fill="#fff" font-size="16" font-weight="600" font-family="Onest, Arial, sans-serif">${api.esc(text)}</text></g>`; };
  /** Distance lines to both side walls (and to the back wall / floor) while moving something. */
  function guides(p: Piece) {
    const it = item(p.id); const W = state.w; let m = '';
    const lineY = it.place === 'wall' ? FL - p.z * PX : yOf(p.z);
    const z = it.place === 'wall' ? 0 : p.z;
    const gl = p.x - it.w / 2, gr = W - p.x - it.w / 2;
    const xa = xOf(0, z, W), xb = xOf(p.x - it.w / 2, z, W), xc = xOf(p.x + it.w / 2, z, W), xd = xOf(W, z, W);
    const seg = (a: number, b: number, gap: number) => {
      if (b - a < 4) return `<circle cx="${r1(a)}" cy="${r1(lineY)}" r="7" fill="#B8293F"/>`;
      return `<path d="M${r1(a)} ${r1(lineY)}H${r1(b)}M${r1(a)} ${r1(lineY - 9)}V${r1(lineY + 9)}M${r1(b)} ${r1(lineY - 9)}V${r1(lineY + 9)}" stroke="${gap < 1 ? '#B8293F' : '#19224A'}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/>${b - a > 70 ? pill((Math.max(a, 0) + Math.min(b, VW)) / 2, lineY - 22, fmtLen(gap)) : ''}`;
    };
    m += seg(xa, xb, gl) + seg(xc, xd, gr);
    const b = boxOf(p);
    if (b) {
      const note = it.place === 'wall' ? `${t('studio.fromFloor')} ${fmtLen(p.z - it.w * (it.span > 150 ? .34 : .5))}` : it.place === 'flat' ? '' : `${t('studio.fromWall')} ${fmtLen(p.z - it.d / 2)}`;
      if (note) m += pill((b.x0 + b.x1) / 2, Math.max(28, b.y0 - 34), note, it.place === 'floor' && p.z - it.d / 2 < 1);
    }
    guideG.innerHTML = m;
  }
  const ICON = {
    flip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M8 7L3 12l5 5V7zM16 7l5 5-5 5V7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    dup: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    done: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    del: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  function renderTool() {
    const p = pieceOf(selected); if (!p) { tool.hidden = true; return; }
    const it = item(p.id);
    const meta = it.product ? `${api.money(it.product.price)} · ${it.w} × ${it.d} ${t('cm')}` : `${t('studio.decorFree')} · ${it.w} ${t('cm')}`;
    tool.innerHTML = `<div class="st-tool-head"><b>${api.esc(it.name[L()])}</b><span>${meta}</span></div>
      ${it.w > state.w ? `<p class="st-warn">${t('studio.tooWide')}</p>` : ''}
      <div class="st-tool-row"><div class="swatches" role="radiogroup" aria-label="${t('card.color')}">${it.sw.map((s, k) => `<button class="sw" role="radio" aria-checked="${k === p.c}" aria-label="${s.name[L()]}" title="${s.name[L()]}" data-st-sw="${k}" style="--c:${s.m}"></button>`).join('')}</div>
      <div class="st-tool-btns"><button data-st-act="flip" title="${t('studio.flip')}" aria-label="${t('studio.flip')}">${ICON.flip}</button><button data-st-act="dup" title="${t('studio.dup')}" aria-label="${t('studio.dup')}">${ICON.dup}</button><button data-st-act="del" class="danger" title="${t('studio.del')}" aria-label="${t('studio.del')}">${ICON.del}</button><button data-st-act="done" class="ok" title="${t('studio.done')}" aria-label="${t('studio.done')}">${ICON.done}</button></div></div>`;
    tool.hidden = false; positionTool();
  }
  const mq = matchMedia('(max-width: 980px)');
  const mobile = () => mq.matches;
  const side = rootEl.querySelector('.st-side') as HTMLElement;
  const dockTool = () => { if (mobile()) side.prepend(tool); else stage.appendChild(tool); positionTool(); };
  mq.addEventListener?.('change', dockTool);
  function positionTool() {
    if (tool.hidden || mobile()) { tool.style.left = ''; tool.style.top = ''; return; }
    const p = pieceOf(selected); if (!p) return; const b = boxOf(p); const m = svg.getScreenCTM(); if (!b || !m) return;
    const sr = stage.getBoundingClientRect();
    const a = new DOMPoint(b.x0, b.y0).matrixTransform(m), c = new DOMPoint(b.x1, b.y1).matrixTransform(m);
    const tw = tool.offsetWidth, th = tool.offsetHeight;
    let left = (a.x + c.x) / 2 - sr.left - tw / 2, top = a.y - sr.top - th - 18;
    if (top < 10) top = c.y - sr.top + 14;
    left = clamp(left, 10, sr.width - tw - 10); top = clamp(top, 10, sr.height - th - 10);
    tool.style.left = `${Math.round(left)}px`; tool.style.top = `${Math.round(top)}px`;
  }

  /* ---------- actions ---------- */
  function addItem(id: string, c = 0, at?: { x: number; y: number }) {
    if (!ITEMS.has(id)) return;
    if (state.ps.length >= MAXP) { api.toast(t('studio.limit')); return; }
    const before = snap();
    const p: Piece = { u: ++uid, id, c, x: state.w / 2, z: 120, f: false };
    state.ps.push(p);
    if (at) moveTo(p, at.x, at.y); else autoPlace(p);
    clampPiece(p, state.w);
    const g = makeEl(p); piecesG.appendChild(g); order(); glows(); dropIn(g);
    emptyEl.hidden = true; select(p.u); commit(before);
    announce(`${t('studio.added1')}: ${item(id).name[L()]}`);
  }
  function removeSel() {
    const p = pieceOf(selected); if (!p) return; const before = snap(); const g = els.get(p.u);
    state.ps = state.ps.filter(q => q !== p); els.delete(p.u); select(null); glows();
    const done = () => { g?.remove(); emptyEl.hidden = state.ps.length > 0; };
    if (g && !api.reduced) (g.querySelector('.sp-anim') as SVGGElement).animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.2) translateY(-60px)', opacity: 0 }], { duration: 260, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = done; else done();
    commit(before); announce(`${t('studio.removed')}: ${item(p.id).name[L()]}`);
  }
  function flipSel() {
    const p = pieceOf(selected); if (!p) return; const before = snap(); p.f = !p.f;
    const g = els.get(p.u)!; g.setAttribute('transform', tfOf(p));
    if (!api.reduced) (g.querySelector('.sp-anim') as SVGGElement).animate([{ transform: 'scaleX(-1)' }, { transform: 'scaleX(1)' }], { duration: 420, easing: 'cubic-bezier(.3,1.3,.5,1)' });
    drawSel(p); commit(before);
  }
  function dupSel() {
    const p = pieceOf(selected); if (!p) return;
    if (state.ps.length >= MAXP) { api.toast(t('studio.limit')); return; }
    const before = snap(); const it = item(p.id);
    const q: Piece = { ...p, u: ++uid, x: p.x + Math.max(30, it.w * .6), z: it.place === 'wall' ? p.z : p.z + 15 };
    clampPiece(q, state.w); if (Math.abs(q.x - p.x) < 5) { autoPlace(q); clampPiece(q, state.w); }
    state.ps.push(q); const g = makeEl(q); piecesG.appendChild(g); order(); glows(); dropIn(g); select(q.u); commit(before);
  }
  function recolor(k: number) {
    const p = pieceOf(selected); if (!p || p.c === k || !item(p.id).sw[k]) return; const before = snap(); p.c = k;
    const g = els.get(p.u)!; const anim = g.querySelector('.sp-anim')!; const old = anim.querySelector('.sp-art')!;
    anim.insertAdjacentHTML('beforeend', `<g class="sp-art" transform="translate(${-item(p.id).ax} ${-item(p.id).ay})">${item(p.id).svg(k)}</g>`);
    if (api.reduced) old.remove(); else old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => old.remove();
    tool.querySelectorAll('.sw').forEach((b, i) => b.setAttribute('aria-checked', String(i === k)));
    commit(before);
  }
  function moveTo(p: Piece, bx: number, by: number) {
    const it = item(p.id); const W = state.w;
    if (it.place === 'wall') { p.z = clamp((FL - by) / PX, 40, CEIL - 25); p.x = fxOf(bx, 0, W); }
    else { p.z = clamp(zOfY(by), it.place === 'flat' ? 20 : Math.min(it.d / 2, ZMAX), ZMAX); p.x = fxOf(bx, p.z, W); }
    p.x = it.w >= W ? W / 2 : clamp(p.x, it.w / 2, W - it.w / 2);
    // gentle snapping: walls are magnetic within 6 cm
    if (it.place !== 'flat') {
      if (p.x - it.w / 2 < 6) p.x = it.w / 2; if (W - p.x - it.w / 2 < 6) p.x = W - it.w / 2;
      if (it.place === 'floor' && p.z - it.d / 2 < 6) p.z = Math.min(it.d / 2, ZMAX);
    }
  }
  function nudge(dx: number, dz: number) {
    const p = pieceOf(selected); if (!p) return;
    if (!kbBefore) kbBefore = snap();
    const it = item(p.id); p.x += dx; p.z += it.place === 'wall' ? -dz : dz; clampPiece(p, state.w);
    els.get(p.u)!.setAttribute('transform', tfOf(p)); order(); glows(); drawSel(p); guides(p); positionTool();
    clearTimeout(kbT); kbT = window.setTimeout(() => { if (kbBefore) commit(kbBefore); kbBefore = null; guideG.innerHTML = ''; }, 900);
  }
  let kbBefore: string | null = null, kbT = 0;
  function undo() { if (!past.length) return; future.push(snap()); restore(past.pop()!); }
  function redo() { if (!future.length) return; past.push(snap()); restore(future.pop()!); }
  function loadState(s: State, animate = true) {
    if (state.ps.length) { past.push(snap()); if (past.length > 80) past.shift(); future = []; }
    state = s; selected = null; buildRoom(); buildPieces(animate); syncChrome(); persist();
  }
  function arrangeSep(id: string) {
    const b = SEP.find(x => x.id === id); if (!b) return;
    const w = clamp(Math.round((b.items.reduce((a, i) => a + item(i).w, 0) * .62 + 120) / 10) * 10, 380, 700);
    const s: State = { w, wall: 0, floor: 0, win: 'l', eve: api.theme() === 'dark', ps: [] };
    const prev = state; state = s;
    for (const iid of b.items) { const p: Piece = { u: ++uid, id: iid, c: 0, x: w / 2, z: 100, f: false }; s.ps.push(p); autoPlace(p); clampPiece(p, w); }
    state = prev; loadState(s);
  }

  /* ---------- drag on the stage (mouse, pen, touch) ---------- */
  let drag: { u: number; pid: number; ox: number; oy: number; sx: number; sy: number; moved: boolean; before: string } | null = null;
  const toSvg = (e: { clientX: number; clientY: number }) => { const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 }; const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); return { x: pt.x, y: pt.y }; };
  svg.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const g = (e.target as Element).closest('.sp') as SVGGElement | null;
    if (!g) { select(null); return; }
    e.preventDefault();
    const p = pieceOf(+g.dataset.u!); if (!p) return;
    select(p.u); const pt = toSvg(e); const { x, y } = place(p);
    drag = { u: p.u, pid: e.pointerId, ox: pt.x - x, oy: pt.y - y, sx: pt.x, sy: pt.y, moved: false, before: snap() };
    try { svg.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  });
  svg.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pid) return;
    const pt = toSvg(e); const p = pieceOf(drag.u); if (!p) return;
    if (!drag.moved && Math.hypot(pt.x - drag.sx, pt.y - drag.sy) < 5) return;
    if (!drag.moved) { drag.moved = true; tool.hidden = true; els.get(p.u)?.classList.add('dragging'); hideHint(); }
    moveTo(p, pt.x - drag.ox, pt.y - drag.oy);
    els.get(p.u)!.setAttribute('transform', tfOf(p)); order(); glows(); drawSel(p); guides(p);
  });
  const endDrag = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const p = pieceOf(drag.u); els.get(drag.u)?.classList.remove('dragging');
    if (drag.moved && p) { commit(drag.before); guideG.innerHTML = ''; renderTool(); announce(`${item(p.id).name[L()]}: ${fmtLen(p.x - item(p.id).w / 2)} · ${fmtLen(state.w - p.x - item(p.id).w / 2)}`); }
    drag = null;
  };
  svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('focusin', e => { const g = (e.target as Element).closest?.('.sp') as SVGGElement | null; if (g && +g.dataset.u! !== selected) select(+g.dataset.u!); });

  /* ---------- palette: tap to add, or drag straight into the room ---------- */
  let pdrag: { id: string; pid: number; sx: number; sy: number; on: boolean; ghost: HTMLElement | null; type: string } | null = null; let suppressClick = false;
  const grid = document.getElementById('stGrid')!;
  grid.addEventListener('pointerdown', e => {
    const b = (e.target as Element).closest<HTMLElement>('[data-st-add]'); if (!b || e.button > 0) return;
    pdrag = { id: b.dataset.stAdd!, pid: e.pointerId, sx: e.clientX, sy: e.clientY, on: false, ghost: null, type: e.pointerType };
  });
  addEventListener('pointermove', e => {
    if (!pdrag || e.pointerId !== pdrag.pid) return;
    const dx = e.clientX - pdrag.sx, dy = e.clientY - pdrag.sy;
    if (!pdrag.on) {
      const go = pdrag.type === 'mouse' ? Math.hypot(dx, dy) > 6 : mobile() ? (dy < -10 && Math.abs(dy) > Math.abs(dx)) : (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy));
      if (!go) return;
      pdrag.on = true; const it = item(pdrag.id);
      const gh = document.createElement('div'); gh.className = 'st-ghost'; gh.innerHTML = it.thumb(0); document.body.appendChild(gh); pdrag.ghost = gh;
      try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch { /* ignore */ }
    }
    e.preventDefault();
    const gh = pdrag.ghost!; gh.style.transform = `translate(${e.clientX - 60}px, ${e.clientY - 70}px)`;
    const r = svg.getBoundingClientRect(); const over = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
    gh.classList.toggle('over', over); stage.classList.toggle('dropping', over);
  }, { passive: false });
  const endPal = (e: PointerEvent) => {
    if (!pdrag || e.pointerId !== pdrag.pid) return;
    const d = pdrag; pdrag = null; stage.classList.remove('dropping');
    if (!d.on) return;
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 50);
    d.ghost?.remove();
    const r = svg.getBoundingClientRect();
    if (e.type === 'pointerup' && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) { const pt = toSvg(e); addItem(d.id, 0, pt); }
  };
  addEventListener('pointerup', endPal); addEventListener('pointercancel', endPal);

  /* ---------- chrome: palette, room panel, bar, presets ---------- */
  let palCat = 'all';
  function renderPalette() {
    const cats = [{ id: 'all', n: t('cat.all') }, ...CATS.map(c => ({ id: c.id, n: c.name[L()] })), { id: 'decor', n: t('studio.decor') }];
    document.getElementById('stCats')!.innerHTML = cats.map(c => `<button class="chip" data-st-cat="${c.id}" aria-pressed="${palCat === c.id}">${api.esc(c.n)}</button>`).join('');
    const list = [...ITEMS.values()].filter(it => palCat === 'all' || it.cat === palCat);
    grid.innerHTML = list.map(it => `<button class="st-item" data-st-add="${it.id}" title="${api.esc(it.name[L()])}"><span class="st-thumb">${it.thumb(0)}</span><span class="st-name">${api.esc(it.name[L()])}</span><span class="st-meta">${it.w} ${t('cm')}${it.product ? ` · <b>${api.money(it.product.price)}</b>` : ''}</span></button>`).join('');
  }
  function renderRoomPanel() {
    const panel = document.getElementById('stPanelRoom')!;
    const hasLamp = state.ps.some(p => item(p.id).lamp);
    panel.innerHTML = `
      <div class="st-field"><label class="st-label" for="stW"><span>${t('studio.width')}</span><output id="stWOut">${fmtLen(state.w)}</output></label>
        <input type="range" id="stW" min="250" max="700" step="10" value="${state.w}"><div class="st-scale"><span>2,5 ${t('m')}</span><span>7 ${t('m')}</span></div></div>
      <div class="st-field"><span class="st-label">${t('studio.wall')}</span><div class="st-walls" role="radiogroup" aria-label="${t('studio.wall')}">${WALLS.map((c, i) => `<button class="sw" role="radio" aria-checked="${state.wall === i}" data-st-wall="${i}" style="--c:${c}" aria-label="${t('studio.wall' + i)}" title="${t('studio.wall' + i)}"></button>`).join('')}</div></div>
      <div class="st-field"><span class="st-label">${t('studio.floor')}</span><div class="st-floors" role="radiogroup" aria-label="${t('studio.floor')}">${FLOORS.map((f, i) => `<button role="radio" aria-checked="${state.floor === i}" data-st-floor="${i}"><i style="--c:${f.b};--l:${f.l}" class="fl-${f.k}"></i>${t('studio.floor' + i)}</button>`).join('')}</div></div>
      <div class="st-field"><span class="st-label">${t('studio.window')}</span><div class="st-seg" role="radiogroup" aria-label="${t('studio.window')}">${(['l', 'r', 'n'] as Win[]).map(w => `<button role="radio" aria-checked="${state.win === w}" data-st-win="${w}">${t('studio.win' + w.toUpperCase())}</button>`).join('')}</div></div>
      <div class="st-field"><span class="st-label">${t('studio.light')}</span><div class="st-seg" role="radiogroup" aria-label="${t('studio.light')}"><button role="radio" aria-checked="${!state.eve}" data-st-eve="0">${t('studio.day')}</button><button role="radio" aria-checked="${state.eve}" data-st-eve="1">${t('studio.eve')}</button></div>
        <p class="st-tip" id="stTip" ${state.eve && !hasLamp ? '' : 'hidden'}>${t('studio.lampTip')} <button class="link" data-st-add-lamp>${t('studio.addLamp')}</button></p></div>
      <div class="st-field"><span class="st-label">${t('studio.samples')}</span><div class="st-presets small">${presetCards()}</div></div>
      <button class="btn btn-line wide" data-st-clear ${state.ps.length ? '' : 'disabled'}>${t('studio.clear')}</button>`;
  }
  /** Reflect the current room in the panel without rebuilding it (keeps keyboard focus where it is). */
  function syncPanel() {
    const P = document.getElementById('stPanelRoom')!; if (!P.firstElementChild) { renderRoomPanel(); return; }
    const w = P.querySelector('#stW') as HTMLInputElement | null; if (w && document.activeElement !== w) w.value = String(state.w);
    const o = P.querySelector('#stWOut'); if (o) o.textContent = fmtLen(state.w);
    P.querySelectorAll<HTMLElement>('[data-st-wall]').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.stWall! === state.wall)));
    P.querySelectorAll<HTMLElement>('[data-st-floor]').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.stFloor! === state.floor)));
    P.querySelectorAll<HTMLElement>('[data-st-win]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.stWin === state.win)));
    P.querySelectorAll<HTMLElement>('[data-st-eve]').forEach(b => b.setAttribute('aria-checked', String((b.dataset.stEve === '1') === state.eve)));
    const tip = P.querySelector<HTMLElement>('#stTip'); if (tip) tip.hidden = !(state.eve && !state.ps.some(p => item(p.id).lamp));
    const clr = P.querySelector<HTMLButtonElement>('[data-st-clear]'); if (clr) clr.disabled = !state.ps.length;
  }
  const presetName = (id: string) => t('studio.p.' + id);
  const previewCache = new Map<number, string>();
  function presetCards() {
    return PRESETS.map((pr, i) => {
      if (!previewCache.has(i)) previewCache.set(i, sceneMarkup(fresh(pr, false), 'pp' + i));
      return `<button class="st-preset" data-st-preset="${pr.id}"><svg viewBox="0 0 ${VW} ${VH}" aria-hidden="true">${previewCache.get(i)}</svg><span>${presetName(pr.id)}</span></button>`;
    }).join('');
  }
  function renderEmpty() {
    emptyEl.innerHTML = `<div class="st-empty-in"><h3>${t('studio.emptyTitle')}</h3><p>${t('studio.emptySub')}</p><div class="st-presets">${presetCards()}</div></div>`;
    emptyEl.hidden = state.ps.length > 0;
  }
  let addedT = 0;
  function renderBar() {
    const prods = state.ps.filter(p => item(p.id).product);
    const total = prods.reduce((a, p) => a + item(p.id).product!.price, 0);
    document.getElementById('stCount')!.textContent = prods.length ? `${t('studio.inRoom')}: ${prods.length} ${t('rail.items')}` : t('studio.nothing');
    document.getElementById('stTotal')!.textContent = prods.length ? api.money(total) : '';
    const groups = new Map<string, { n: number; u: number }>(); for (const p of prods) { const k = p.id; const g = groups.get(k); if (g) g.n++; else groups.set(k, { n: 1, u: p.u }); }
    document.getElementById('stChips')!.innerHTML = [...groups].map(([id, g]) => `<button class="st-chip" data-st-pick="${g.u}">${api.esc(item(id).name[L()])}${g.n > 1 ? ` <b>×${g.n}</b>` : ''}</button>`).join('');
    const btn = document.getElementById('stAddAll') as HTMLButtonElement;
    if (!btn.dataset.done) { btn.textContent = t('studio.addAll'); btn.disabled = !prods.length; }
    (document.getElementById('stUndo') as HTMLButtonElement).disabled = !past.length;
    (document.getElementById('stRedo') as HTMLButtonElement).disabled = !future.length;
  }
  function syncChrome() { renderBar(); syncPanel(); if (selected) renderTool(); }
  function refresh() { previewCache.clear(); renderPalette(); renderRoomPanel(); renderEmpty(); renderBar(); buildRoom(); els.forEach((g, u) => { const p = pieceOf(u); if (p) label(g, p); }); if (selected) renderTool(); renderIntro(); }

  /* ---------- room panel interactions ---------- */
  let wBefore: string | null = null;
  rootEl.addEventListener('input', e => {
    const el = e.target as HTMLInputElement; if (el.id !== 'stW') return;
    if (!wBefore) wBefore = snap();
    state.w = +el.value; state.ps.forEach(p => clampPiece(p, state.w));
    (document.getElementById('stWOut') as HTMLOutputElement).textContent = fmtLen(state.w);
    buildRoom(); state.ps.forEach(p => els.get(p.u)?.setAttribute('transform', tfOf(p))); glows();
    const p = pieceOf(selected); if (p) { drawSel(p); renderTool(); }
  });
  rootEl.addEventListener('change', e => { if ((e.target as HTMLElement).id === 'stW' && wBefore) { commit(wBefore); wBefore = null; } });

  rootEl.addEventListener('click', e => {
    const tg = e.target as HTMLElement;
    const q = <T extends HTMLElement = HTMLElement>(s: string) => tg.closest<T>(s);
    let b: HTMLElement | null;
    if ((b = q('[data-st-add]'))) { if (suppressClick) return; addItem(b.dataset.stAdd!); if (mobile()) b.blur(); return; }
    if ((b = q('[data-st-cat]'))) { palCat = b.dataset.stCat!; renderPalette(); return; }
    if ((b = q('[data-sttab]'))) { const tab = b.dataset.sttab!; rootEl.querySelectorAll('[data-sttab]').forEach(x => x.setAttribute('aria-selected', String(x === b))); document.getElementById('stPanelItems')!.hidden = tab !== 'items'; document.getElementById('stPanelRoom')!.hidden = tab !== 'room'; return; }
    if ((b = q('[data-st-sw]'))) { recolor(+b.dataset.stSw!); return; }
    if ((b = q('[data-st-act]'))) { const a = b.dataset.stAct; if (a === 'flip') flipSel(); else if (a === 'dup') dupSel(); else if (a === 'done') select(null); else removeSel(); return; }
    if ((b = q('[data-st-wall]'))) { const before = snap(); state.wall = +b.dataset.stWall!; paintRoom(); rootEl.querySelectorAll('[data-st-wall]').forEach(x => x.setAttribute('aria-checked', String(x === b))); commit(before); return; }
    if ((b = q('[data-st-floor]'))) { const before = snap(); state.floor = +b.dataset.stFloor!; buildRoom(); commit(before); return; }
    if ((b = q('[data-st-win]'))) { const before = snap(); state.win = b.dataset.stWin as Win; buildRoom(); commit(before); return; }
    if ((b = q('[data-st-eve]'))) { const before = snap(); state.eve = b.dataset.stEve === '1'; paintRoom(); commit(before); return; }
    if (q('[data-st-add-lamp]')) { addItem('d-lamp'); return; }
    if ((b = q('[data-st-preset]'))) { const pr = PRESETS.find(x => x.id === b!.dataset.stPreset); if (pr) loadState(fresh(pr)); return; }
    if (q('[data-st-clear]')) { const before = snap(); state.ps = []; selected = null; buildPieces(); commit(before); api.toast(t('studio.cleared')); return; }
    if ((b = q('[data-st-pick]'))) { select(+b.dataset.stPick!, true); return; }
    if (q('#stUndo')) { undo(); return; }
    if (q('#stRedo')) { redo(); return; }
    if (q('#stShare')) { share(); return; }
    if (q('#stPhoto')) { photo(); return; }
    if ((b = q('#stAddAll'))) {
      if (b.dataset.done) { api.openCart(); return; }
      const lines = new Map<string, { key: string; color: number; qty: number }>();
      for (const p of state.ps) { if (!item(p.id).product) continue; const k = `${p.id}:${p.c}`; const l = lines.get(k); if (l) l.qty++; else lines.set(k, { key: p.id, color: p.c, qty: 1 }); }
      const r = api.addMany([...lines.values()]);
      if (r.capped) api.toast(t('toast.max'));
      b.dataset.done = '1'; b.textContent = t('studio.addedAll'); b.classList.add('done');
      clearTimeout(addedT); addedT = window.setTimeout(() => { delete b!.dataset.done; b!.classList.remove('done'); renderBar(); }, 5000);
      return;
    }
  });

  /* ---------- keyboard ---------- */
  addEventListener('keydown', e => {
    if (!rootEl.classList.contains('open') || rootEl.inert) return;
    const tag = (e.target as HTMLElement).tagName; const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return; }
    if (e.key === 'Escape' && selected) { e.preventDefault(); e.stopImmediatePropagation(); select(null); return; }
    if (!selected || typing) return;
    const step = e.shiftKey ? 25 : 5;
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (map[e.key]) { e.preventDefault(); nudge(...map[e.key]); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSel(); return; }
    if (e.key.toLowerCase() === 'f') { e.preventDefault(); flipSel(); return; }
    if (e.key.toLowerCase() === 'd') { e.preventDefault(); dupSel(); return; }
  }, true);
  addEventListener('resize', () => { if (rootEl.classList.contains('open')) positionTool(); });

  /* ---------- share & picture ---------- */
  const shareUrl = () => `${location.origin}${location.pathname}#studio=${encode(state)}`;
  async function share() {
    const url = shareUrl(); const text = `${t('studio.shareText')}${state.ps.some(p => item(p.id).product) ? ' — ' + document.getElementById('stTotal')!.textContent : ''}`;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share && mobile()) { try { await nav.share({ title: 'Robiya mebellari', text, url }); return; } catch (err) { if ((err as Error).name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(url); api.toast(t('studio.linkCopied')); return; } catch { /* clipboard blocked */ }
    const ta = document.createElement('textarea'); ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; } ta.remove();
    api.toast(ok ? t('studio.linkCopied') : url);
  }
  async function photo() {
    const btn = document.getElementById('stPhoto') as HTMLButtonElement; btn.disabled = true;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelector('#stGuides')?.remove(); clone.querySelector('#stSel')?.remove();
    clone.setAttribute('xmlns', NS); clone.setAttribute('width', String(VW * 2)); clone.setAttribute('height', String(VH * 2));
    const xml = new XMLSerializer().serializeToString(clone);
    const prods = state.ps.filter(p => item(p.id).product); const total = prods.reduce((a, p) => a + item(p.id).product!.price, 0);
    try {
      const img = new Image(); img.decoding = 'async';
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('img')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml); });
      const cw = VW * 2, ch = VH * 2 + 150; const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
      const g = cv.getContext('2d')!; g.fillStyle = '#19224A'; g.fillRect(0, 0, cw, ch); g.drawImage(img, 0, 0, cw, VH * 2);
      g.fillStyle = '#B8293F'; g.beginPath(); g.moveTo(80, VH * 2 + 40); g.lineTo(104, VH * 2 + 75); g.lineTo(80, VH * 2 + 110); g.lineTo(56, VH * 2 + 75); g.closePath(); g.fill();
      g.fillStyle = '#F8F9F6'; g.font = '700 46px Unbounded, Onest, Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText('Robiya mebellari', 130, VH * 2 + 60);
      g.font = '500 30px Onest, Arial, sans-serif'; g.fillStyle = '#BFC6DE'; g.fillText(`${t('studio.title')} · ${fmtLen(state.w)}`, 130, VH * 2 + 108);
      if (prods.length) { g.textAlign = 'right'; g.fillStyle = '#F28597'; g.font = '700 48px Onest, Arial, sans-serif'; g.fillText(api.money(total), cw - 70, VH * 2 + 60); g.fillStyle = '#BFC6DE'; g.font = '500 30px Onest, Arial, sans-serif'; g.fillText(`${prods.length} ${t('rail.items')}`, cw - 70, VH * 2 + 108); }
      const blob: Blob = await new Promise((res, rej) => cv.toBlob(b => (b ? res(b) : rej(new Error('blob'))), 'image/png'));
      const file = new File([blob], 'robiya-xona.png', { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean; share?: (d: ShareData) => Promise<void> };
      if (mobile() && nav.canShare?.({ files: [file] })) { try { await nav.share!({ files: [file], title: 'Robiya mebellari' }); return; } catch (err) { if ((err as Error).name === 'AbortError') return; } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'robiya-xona.png'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000); api.toast(t('studio.photoSaved'));
    } catch {
      // Some browsers refuse to turn SVG into pixels; hand over the picture as SVG instead.
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' })); a.download = 'robiya-xona.svg'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000); api.toast(t('studio.photoSaved'));
    } finally { btn.disabled = false; }
  }

  /* ---------- first-time hint ---------- */
  let hintT = 0;
  function showHint() {
    if (api.load('rm-studio-hint') || !state.ps.length) return;
    hintEl.textContent = t('studio.hint'); hintEl.hidden = false; clearTimeout(hintT); hintT = window.setTimeout(hideHint, 7000);
  }
  function hideHint() { if (hintEl.hidden) return; hintEl.hidden = true; api.save('rm-studio-hint', 1); }

  /* ---------- open / close ---------- */
  const ROOM_FOR: Record<string, string> = { living: 'living', bedroom: 'bedroom', storage: 'bedroom', kitchen: 'dining', dining: 'dining', kids: 'kids', office: 'office' };
  function open(o: OpenOpts = {}) {
    if (o.add && !api.load('rm-studio')) { const cat = item(o.add.id)?.cat ?? 'living'; const pr = PRESETS.find(x => x.id === ROOM_FOR[cat]) ?? PRESETS[0]; const s = fresh(pr); s.ps = s.ps.filter(p => p.id.startsWith('d-')); state = s; past = []; future = []; }
    if (o.shared) { const s = decode(o.shared); if (s) { loadState(s, false); api.toast(t('studio.shared')); } }
    else if (o.preset) { const pr = PRESETS.find(x => x.id === o.preset) ?? PRESETS[0]; loadState(fresh(pr), false); }
    else if (o.sep) arrangeSep(o.sep);
    buildRoom(); buildPieces(); renderPalette(); renderRoomPanel(); renderEmpty(); renderBar();
    api.openOverlay(rootEl, !!o.replace);
    if (!api.reduced && o.origin) {
      const r = o.origin.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      rootEl.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] }, { duration: 650, easing: 'cubic-bezier(.7,0,.2,1)' });
    }
    piecesG.querySelectorAll<SVGGElement>('.sp').forEach((g, i) => dropIn(g, 220 + i * 60));
    if (o.add) setTimeout(() => addItem(o.add!.id, o.add!.c), api.reduced ? 0 : 520);
    setTimeout(showHint, 1200);
  }
  function onClose() { select(null); hideHint(); api.save('rm-studio', state); }

  /* ---------- homepage teaser ---------- */
  function renderIntro() {
    const el = document.getElementById('introScene'); if (!el) return;
    const s = fresh(PRESETS[0], api.theme() === 'dark');
    const lola = s.ps.find(p => p.id === 'lola')!; const { x, y, k } = place(lola, s.w);
    el.innerHTML = sceneMarkup(s, 'is', 'lola') + `<g transform="translate(${r1(x + 10)} ${r1(y - 120 * k)}) scale(1.6)" aria-hidden="true"><g class="demo-cursor"><path d="M0 0l0 46 12-11 9 21 9-4-9-20 16-1z" fill="#fff" stroke="#19224A" stroke-width="3.5" stroke-linejoin="round"/></g></g>`;
  }

  dockTool();
  return { open, onClose, refresh, renderIntro, isOpen: () => rootEl.classList.contains('open') };
}
