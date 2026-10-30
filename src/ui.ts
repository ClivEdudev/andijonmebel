/* Site-styled replacements for the browser's own widgets (dropdowns, tooltips) and the custom cursor. */

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const CHEVRON = '<svg class="dd-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------------- dropdowns ----------------
   The real <select> stays in the page (hidden) so forms and existing code keep working;
   people use a button + listbox drawn in the site's own style. */
let ddSeq = 0;
let openDD: { sel: HTMLSelectElement; btn: HTMLButtonElement; list: HTMLElement; active: number; typed: string; typedT: number } | null = null;

function label(sel: HTMLSelectElement, btn: HTMLButtonElement) {
  const o = sel.options[sel.selectedIndex];
  btn.innerHTML = `<span class="dd-val">${esc(o?.textContent ?? '')}</span>${CHEVRON}`;
  const named = sel.getAttribute('aria-label');
  if (named) btn.setAttribute('aria-label', `${named}: ${o?.textContent ?? ''}`);
}
export function enhanceSelects(root: ParentNode = document) {
  root.querySelectorAll<HTMLSelectElement>('select:not([data-dd])').forEach(sel => {
    sel.dataset.dd = String(++ddSeq);
    const wrap = document.createElement('span'); wrap.className = 'dd';
    sel.parentNode!.insertBefore(wrap, sel);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dd-btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    wrap.append(btn, sel);
    sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true'); sel.classList.add('dd-native');
    label(sel, btn);
    btn.addEventListener('click', () => (openDD?.sel === sel ? closeDD(true) : openList(sel, btn)));
    btn.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openList(sel, btn); } });
    sel.addEventListener('change', () => label(sel, btn));
  });
}
export function syncDropdowns() {
  document.querySelectorAll<HTMLSelectElement>('select[data-dd]').forEach(sel => { const b = sel.parentElement?.querySelector<HTMLButtonElement>('.dd-btn'); if (b) label(sel, b); });
}
function openList(sel: HTMLSelectElement, btn: HTMLButtonElement) {
  closeDD(false);
  const id = `dd-${sel.dataset.dd}`;
  const list = document.createElement('ul'); list.className = 'dd-list'; list.id = id; list.setAttribute('role', 'listbox'); list.tabIndex = -1;
  list.innerHTML = Array.from(sel.options).map((o, i) => `<li role="option" id="${id}-${i}" data-i="${i}" aria-selected="${i === sel.selectedIndex}" style="--d:${Math.min(i, 8)}">${CHECK}<span>${esc(o.textContent ?? '')}</span></li>`).join('');
  document.body.appendChild(list);
  place(list, btn, true);
  btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-controls', id); btn.classList.add('open');
  openDD = { sel, btn, list, active: Math.max(0, sel.selectedIndex), typed: '', typedT: 0 };
  setActive(openDD.active, false);
  requestAnimationFrame(() => list.classList.add('in'));
  list.focus({ preventScroll: true });
  list.addEventListener('click', e => { const li = (e.target as Element).closest<HTMLElement>('[role="option"]'); if (li) choose(+li.dataset.i!); });
  list.addEventListener('pointermove', e => { const li = (e.target as Element).closest<HTMLElement>('[role="option"]'); if (li && openDD) setActive(+li.dataset.i!, false); });
  list.addEventListener('keydown', onListKey);
}
/** Puts the list under (or, when there's no room, over) its button. */
function place(list: HTMLElement, btn: HTMLElement, first = false) {
  const r = btn.getBoundingClientRect();
  if (first) list.style.minWidth = `${Math.max(r.width, 200)}px`;
  const h = Math.min(list.scrollHeight, 340);
  const below = innerHeight - r.bottom - 12, above = r.top - 12;
  const up = first ? below < Math.min(h, 240) && above > below : list.classList.contains('up');
  list.style.left = `${Math.max(8, Math.min(r.left, innerWidth - list.offsetWidth - 8))}px`;
  list.style.top = up ? `${Math.max(8, r.top - Math.min(h, above) - 6)}px` : `${r.bottom + 6}px`;
  if (first) list.style.maxHeight = `${Math.max(140, Math.min(340, up ? above : below))}px`;
  list.classList.toggle('up', up);
}
function setActive(i: number, scroll = true) {
  if (!openDD) return; const n = openDD.sel.options.length; i = Math.max(0, Math.min(n - 1, i)); openDD.active = i;
  openDD.list.querySelectorAll('[role="option"]').forEach((li, k) => li.classList.toggle('active', k === i));
  openDD.list.setAttribute('aria-activedescendant', `${openDD.list.id}-${i}`);
  if (scroll) openDD.list.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });
}
function choose(i: number) {
  if (!openDD) return; const { sel } = openDD;
  if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  closeDD(true);
}
function onListKey(e: KeyboardEvent) {
  if (!openDD) return; const n = openDD.sel.options.length;
  const k = e.key;
  if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Home' || k === 'End' || k === 'PageDown' || k === 'PageUp') {
    e.preventDefault(); setActive(k === 'Home' ? 0 : k === 'End' ? n - 1 : openDD.active + (k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : k === 'PageDown' ? 5 : -5));
  } else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(openDD.active); }
  else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); closeDD(true); }
  else if (k === 'Tab') { closeDD(false); }
  else if (k.length === 1) { // type to jump
    openDD.typed += k.toLowerCase(); clearTimeout(openDD.typedT); openDD.typedT = window.setTimeout(() => { if (openDD) openDD.typed = ''; }, 600);
    const opts = Array.from(openDD.sel.options); const hit = opts.findIndex(o => (o.textContent ?? '').toLowerCase().startsWith(openDD!.typed));
    if (hit >= 0) setActive(hit);
  }
}
export function closeDD(focusBtn: boolean) {
  if (!openDD) return; const { btn, list } = openDD; openDD = null;
  btn.setAttribute('aria-expanded', 'false'); btn.classList.remove('open');
  list.classList.remove('in'); list.classList.add('out'); setTimeout(() => list.remove(), 180);
  if (focusBtn) btn.focus({ preventScroll: true });
}
document.addEventListener('pointerdown', e => { if (openDD && !openDD.list.contains(e.target as Node) && !openDD.btn.contains(e.target as Node)) closeDD(false); }, true);
addEventListener('resize', () => closeDD(false));
// Something scrolled (the page, a dialog): keep the list attached to its button, and close it only once the button is out of view.
addEventListener('scroll', e => {
  if (!openDD || openDD.list.contains(e.target as Node)) return;
  const r = openDD.btn.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) closeDD(false); else place(openDD.list, openDD.btn);
}, true);

/* ---------------- tooltips ---------------- */
export function initTips() {
  const tip = document.createElement('div'); tip.className = 'tip'; tip.setAttribute('role', 'tooltip'); tip.id = 'tip'; document.body.appendChild(tip);
  let cur: Element | null = null; let timer = 0;
  const show = (el: Element) => {
    const text = el.getAttribute('data-tip'); if (!text) return;
    tip.textContent = text; tip.classList.remove('below');
    const r = el.getBoundingClientRect(); const w = tip.offsetWidth, h = tip.offsetHeight;
    let top = r.top - h - 10; if (top < 8) { top = r.bottom + 10; tip.classList.add('below'); }
    tip.style.left = `${Math.round(Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)))}px`; tip.style.top = `${Math.round(top)}px`;
    tip.classList.add('show');
  };
  const hide = () => { clearTimeout(timer); tip.classList.remove('show'); cur = null; };
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const el = (e.target as Element).closest?.('[data-tip]') ?? null; if (el === cur) return;
    hide(); cur = el; if (el) timer = window.setTimeout(() => show(el), 380);
  }, { passive: true });
  document.addEventListener('focusin', e => { const el = (e.target as Element).closest?.('[data-tip]'); if (el && (e.target as HTMLElement).matches(':focus-visible')) { hide(); cur = el; show(el); } });
  document.addEventListener('focusout', hide); document.addEventListener('pointerdown', hide, true); addEventListener('scroll', hide, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && tip.classList.contains('show')) hide(); });
}

/* ---------------- custom cursor ----------------
   A tufted upholstery button for the pointer, trailed by a stitched ring that changes with what's underneath:
   it wraps round buttons it lands on, opens into a "View" badge over furniture, offers a grip over things you
   can drag, and becomes a slim caret over text fields. Mouse/trackpad only; touch and reduced motion keep the system cursor. */
type Mode = 'default' | 'link' | 'snap' | 'view' | 'add' | 'grab' | 'grabbing' | 'text' | 'disabled';
export function initCursor(t: (k: string) => string) {
  const ok = matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches && !matchMedia('(forced-colors: active)').matches;
  if (!ok) return;
  const root = document.documentElement;
  const dot = document.createElement('div'); dot.className = 'cur-dot'; dot.setAttribute('aria-hidden', 'true');
  const ring = document.createElement('div'); ring.className = 'cur-ring'; ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<span class="cur-label"></span>';
  document.body.append(ring, dot); root.classList.add('has-cursor');
  const lab = ring.firstElementChild as HTMLElement;

  let mx = -100, my = -100; let shown = false; let mode: Mode = 'default'; let snapEl: HTMLElement | null = null; let snapR = 0; let downOn: Element | null = null;
  const g = { x: -100, y: -100, w: 34, h: 34, r: 17 };
  let raf = 0; let idle = 0;
  const SIZE: Record<Mode, number> = { default: 34, link: 52, snap: 0, view: 96, add: 74, grab: 60, grabbing: 46, text: 20, disabled: 30 };

  function classify(el: Element | null): { m: Mode; s?: HTMLElement; l?: string } {
    if (!el) return { m: 'default' };
    if (el.closest('iframe')) return { m: 'default' };
    const dis = el.closest('button:disabled, [aria-disabled="true"]'); if (dis) return { m: 'disabled' };
    if (el.closest('#stSvg .sp')) return { m: 'grab' };
    if (el.closest('input:not([type]), input[type="text"], input[type="tel"], input[type="search"], input[type="email"], textarea')) return { m: 'text' };
    const v = el.closest<HTMLElement>('.card-art, .is-scene, .st-preset, .panel-art, .pm-art');
    if (v) return { m: 'view', l: v.matches('.is-scene') ? t('cur.try') : v.matches('.st-preset') ? t('cur.open') : t('cur.view') };
    if (el.closest('.st-item')) return { m: 'add', l: t('cur.add') };
    const s = el.closest<HTMLElement>('.icon-btn, .cart-btn, .close, .st-btn, .st-tool-btns button, .lang button, .sw, .qty button, .chip');
    if (s) return { m: 'snap', s };
    if (el.closest('a, button, [role="button"], [role="option"], [role="tab"], label.radio, label.check, input[type="range"], input[type="radio"], input[type="checkbox"], summary')) return { m: 'link' };
    return { m: 'default' };
  }
  function setMode(c: { m: Mode; s?: HTMLElement; l?: string }) {
    if (snapEl && snapEl !== c.s) { snapEl.style.translate = ''; }
    mode = c.m; snapEl = c.m === 'snap' ? c.s ?? null : null;
    if (snapEl) snapR = parseFloat(getComputedStyle(snapEl).borderTopLeftRadius) || 12;
    root.dataset.cur = mode; lab.textContent = c.l ?? '';
    kick();
  }
  const kick = () => { idle = 0; if (!raf) raf = requestAnimationFrame(loop); };
  function loop() {
    raf = 0;
    let tx: number, ty: number, tw: number, th: number, tr: number;
    if (mode === 'snap' && snapEl && snapEl.isConnected) {
      const r = snapEl.getBoundingClientRect(); const pad = 5;
      // magnetic: the button leans a little towards the pointer
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = Math.max(-6, Math.min(6, (mx - cx) * .18)), dy = Math.max(-6, Math.min(6, (my - cy) * .18));
      snapEl.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      tx = r.left - pad + dx; ty = r.top - pad + dy; tw = r.width + pad * 2; th = r.height + pad * 2; tr = Math.min(snapR + pad, th / 2);
    } else {
      const s = SIZE[mode] || 34; tx = mx - s / 2; ty = my - s / 2; tw = s; th = s; tr = s / 2;
      if (mode === 'text') { tw = 4; th = 30; tx = mx - 2; ty = my - 15; tr = 2; }
    }
    const k = mode === 'snap' ? .32 : .2;
    g.x += (tx - g.x) * k; g.y += (ty - g.y) * k; g.w += (tw - g.w) * k; g.h += (th - g.h) * k; g.r += (tr - g.r) * k;
    ring.style.transform = `translate3d(${g.x.toFixed(2)}px, ${g.y.toFixed(2)}px, 0)`;
    ring.style.width = `${g.w.toFixed(2)}px`; ring.style.height = `${g.h.toFixed(2)}px`; ring.style.borderRadius = `${g.r.toFixed(2)}px`;
    const moving = Math.abs(tx - g.x) + Math.abs(ty - g.y) + Math.abs(tw - g.w) + Math.abs(th - g.h) > .3;
    if (moving || mode === 'snap') { if (++idle < 600 || moving) raf = requestAnimationFrame(loop); }
  }
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    if (!shown) { shown = true; root.classList.add('cur-on'); g.x = mx - 17; g.y = my - 17; }
    kick();
  }, { passive: true });
  document.addEventListener('pointerover', e => { if ((e as PointerEvent).pointerType === 'mouse' && !downOn) setMode(classify(e.target as Element)); });
  document.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    downOn = e.target as Element; root.classList.add('cur-down');
    if (mode === 'grab') setMode({ m: 'grabbing' });
    if (mode !== 'text') ripple(e.clientX, e.clientY);
  }, true);
  addEventListener('pointerup', e => {
    if (e.pointerType !== 'mouse') return;
    downOn = null; root.classList.remove('cur-down');
    setMode(classify(document.elementFromPoint(e.clientX, e.clientY)));
  }, true);
  document.addEventListener('pointerout', e => { if (!(e as PointerEvent).relatedTarget && (e as PointerEvent).pointerType === 'mouse') { shown = false; root.classList.remove('cur-on'); if (snapEl) snapEl.style.translate = ''; } });
  // Over an embedded map the page can't draw its cursor, so hand it back to the system.
  document.addEventListener('pointerover', e => { if ((e.target as Element).tagName === 'IFRAME') { root.classList.remove('cur-on'); shown = false; } });
  addEventListener('scroll', kick, { passive: true });
  addEventListener('blur', () => { root.classList.remove('cur-on'); shown = false; });

  function ripple(x: number, y: number) {
    const r = document.createElement('span'); r.className = 'cur-ripple'; r.style.left = `${x}px`; r.style.top = `${y}px`;
    document.body.appendChild(r); r.addEventListener('animationend', () => r.remove(), { once: true }); setTimeout(() => r.remove(), 900);
  }
}
