/* Site-styled replacements for the browser's own widgets (dropdowns, tooltips) and the custom cursor. */
const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CHEVRON = '<svg class="dd-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* ---------------- dropdowns ----------------
   The real <select> stays in the page (hidden) so forms and existing code keep working;
   people use a button + listbox drawn in the site's own style. */
let ddSeq = 0;
let openDD = null;
function label(sel, btn) {
    const o = sel.options[sel.selectedIndex];
    btn.innerHTML = `<span class="dd-val">${esc(o?.textContent ?? '')}</span>${CHEVRON}`;
    const named = sel.getAttribute('aria-label');
    if (named)
        btn.setAttribute('aria-label', `${named}: ${o?.textContent ?? ''}`);
}
export function enhanceSelects(root = document) {
    root.querySelectorAll('select:not([data-dd])').forEach(sel => {
        sel.dataset.dd = String(++ddSeq);
        const wrap = document.createElement('span');
        wrap.className = 'dd';
        sel.parentNode.insertBefore(wrap, sel);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dd-btn';
        btn.setAttribute('aria-haspopup', 'listbox');
        btn.setAttribute('aria-expanded', 'false');
        wrap.append(btn, sel);
        sel.tabIndex = -1;
        sel.setAttribute('aria-hidden', 'true');
        sel.classList.add('dd-native');
        label(sel, btn);
        btn.addEventListener('click', () => (openDD?.sel === sel ? closeDD(true) : openList(sel, btn)));
        btn.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            openList(sel, btn);
        } });
        sel.addEventListener('change', () => label(sel, btn));
    });
}
export function syncDropdowns() {
    document.querySelectorAll('select[data-dd]').forEach(sel => { const b = sel.parentElement?.querySelector('.dd-btn'); if (b)
        label(sel, b); });
}
function openList(sel, btn) {
    closeDD(false);
    const id = `dd-${sel.dataset.dd}`;
    const list = document.createElement('ul');
    list.className = 'dd-list';
    list.id = id;
    list.setAttribute('role', 'listbox');
    list.tabIndex = -1;
    list.innerHTML = Array.from(sel.options).map((o, i) => `<li role="option" id="${id}-${i}" data-i="${i}" aria-selected="${i === sel.selectedIndex}" style="--d:${Math.min(i, 8)}">${CHECK}<span>${esc(o.textContent ?? '')}</span></li>`).join('');
    document.body.appendChild(list);
    place(list, btn, true);
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-controls', id);
    btn.classList.add('open');
    openDD = { sel, btn, list, active: Math.max(0, sel.selectedIndex), typed: '', typedT: 0 };
    setActive(openDD.active, false);
    requestAnimationFrame(() => list.classList.add('in'));
    list.focus({ preventScroll: true });
    list.addEventListener('click', e => { const li = e.target.closest('[role="option"]'); if (li)
        choose(+li.dataset.i); });
    list.addEventListener('pointermove', e => { const li = e.target.closest('[role="option"]'); if (li && openDD)
        setActive(+li.dataset.i, false); });
    list.addEventListener('keydown', onListKey);
}
/** Puts the list under (or, when there's no room, over) its button. */
function place(list, btn, first = false) {
    const r = btn.getBoundingClientRect();
    if (first)
        list.style.minWidth = `${Math.max(r.width, 200)}px`;
    const h = Math.min(list.scrollHeight, 340);
    const below = innerHeight - r.bottom - 12, above = r.top - 12;
    const up = first ? below < Math.min(h, 240) && above > below : list.classList.contains('up');
    list.style.left = `${Math.max(8, Math.min(r.left, innerWidth - list.offsetWidth - 8))}px`;
    list.style.top = up ? `${Math.max(8, r.top - Math.min(h, above) - 6)}px` : `${r.bottom + 6}px`;
    if (first)
        list.style.maxHeight = `${Math.max(140, Math.min(340, up ? above : below))}px`;
    list.classList.toggle('up', up);
}
function setActive(i, scroll = true) {
    if (!openDD)
        return;
    const n = openDD.sel.options.length;
    i = Math.max(0, Math.min(n - 1, i));
    openDD.active = i;
    openDD.list.querySelectorAll('[role="option"]').forEach((li, k) => li.classList.toggle('active', k === i));
    openDD.list.setAttribute('aria-activedescendant', `${openDD.list.id}-${i}`);
    if (scroll)
        openDD.list.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });
}
function choose(i) {
    if (!openDD)
        return;
    const { sel } = openDD;
    if (sel.selectedIndex !== i) {
        sel.selectedIndex = i;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    closeDD(true);
}
function onListKey(e) {
    if (!openDD)
        return;
    const n = openDD.sel.options.length;
    const k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Home' || k === 'End' || k === 'PageDown' || k === 'PageUp') {
        e.preventDefault();
        setActive(k === 'Home' ? 0 : k === 'End' ? n - 1 : openDD.active + (k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : k === 'PageDown' ? 5 : -5));
    }
    else if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        choose(openDD.active);
    }
    else if (k === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeDD(true);
    }
    else if (k === 'Tab') {
        closeDD(false);
    }
    else if (k.length === 1) { // type to jump
        openDD.typed += k.toLowerCase();
        clearTimeout(openDD.typedT);
        openDD.typedT = window.setTimeout(() => { if (openDD)
            openDD.typed = ''; }, 600);
        const opts = Array.from(openDD.sel.options);
        const hit = opts.findIndex(o => (o.textContent ?? '').toLowerCase().startsWith(openDD.typed));
        if (hit >= 0)
            setActive(hit);
    }
}
export function closeDD(focusBtn) {
    if (!openDD)
        return;
    const { btn, list } = openDD;
    openDD = null;
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('open');
    list.classList.remove('in');
    list.classList.add('out');
    setTimeout(() => list.remove(), 180);
    if (focusBtn)
        btn.focus({ preventScroll: true });
}
document.addEventListener('pointerdown', e => { if (openDD && !openDD.list.contains(e.target) && !openDD.btn.contains(e.target))
    closeDD(false); }, true);
addEventListener('resize', () => closeDD(false));
// Something scrolled (the page, a dialog): keep the list attached to its button, and close it only once the button is out of view.
addEventListener('scroll', e => {
    if (!openDD || openDD.list.contains(e.target))
        return;
    const r = openDD.btn.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight)
        closeDD(false);
    else
        place(openDD.list, openDD.btn);
}, true);
/* ---------------- tooltips ---------------- */
export function initTips() {
    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.setAttribute('role', 'tooltip');
    tip.id = 'tip';
    document.body.appendChild(tip);
    let cur = null;
    let timer = 0;
    const show = (el) => {
        const text = el.getAttribute('data-tip');
        if (!text)
            return;
        tip.textContent = text;
        tip.classList.remove('below');
        const r = el.getBoundingClientRect();
        const w = tip.offsetWidth, h = tip.offsetHeight;
        let top = r.top - h - 10;
        if (top < 8) {
            top = r.bottom + 10;
            tip.classList.add('below');
        }
        tip.style.left = `${Math.round(Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)))}px`;
        tip.style.top = `${Math.round(top)}px`;
        tip.classList.add('show');
    };
    const hide = () => { clearTimeout(timer); tip.classList.remove('show'); cur = null; };
    document.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse' || e.buttons)
            return;
        const el = e.target.closest?.('[data-tip]') ?? null;
        if (el === cur)
            return;
        hide();
        cur = el;
        if (el)
            timer = window.setTimeout(() => show(el), 380);
    }, { passive: true });
    document.addEventListener('focusin', e => { const el = e.target.closest?.('[data-tip]'); if (el && e.target.matches(':focus-visible')) {
        hide();
        cur = el;
        show(el);
    } });
    document.addEventListener('focusout', hide);
    document.addEventListener('pointerdown', hide, true);
    addEventListener('scroll', hide, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && tip.classList.contains('show'))
        hide(); });
}
const NONE = { kind: 'none', el: null, box: null, label: '' };
const INTERACTIVE = 'a[href], button:not(:disabled), [role="button"], [role="option"], [role="tab"], [role="radio"], label.radio, label.check, input:not([type="hidden"]), textarea, summary';
const TEXTY = 'input:not([type]), input[type="text"], input[type="tel"], input[type="search"], input[type="email"], textarea';
/** Buttons that spend money, remove things or send the order must be hit on purpose. */
const NO_MAGNET = '[data-add], [data-add-modal], [data-add-sep], #stAddAll, #coNext, #toCheckout, [data-rm], [data-lq], [data-st-act="del"], [data-st-clear], .danger, #addRoom';
const SURFACE = '.dd-list, .modal-panel, .drawer-panel, .studio, .menu.open, .top, main, footer';
const MAGNET = 18;
export function initPointer(t) {
    const ZONES = [['.card', '[data-open]', 'cur.view'], ['.panel', '[data-cat]', 'cur.view'], ['.bundle', '[data-try-sep]', 'studio.try']];
    const BIG = [['.is-scene', 'cur.try'], ['.st-preset', 'cur.open'], ['.st-item', 'cur.add']];
    function nearest(x, y, hit) {
        const surf = hit.closest(SURFACE);
        let best = null;
        let bd = Infinity;
        const d = MAGNET, e = Math.round(MAGNET * .72);
        for (const [ox, oy] of [[d, 0], [-d, 0], [0, d], [0, -d], [e, e], [-e, e], [e, -e], [-e, -e]]) {
            const c = document.elementFromPoint(x + ox, y + oy)?.closest(INTERACTIVE);
            if (!c || c.matches(NO_MAGNET) || c.matches(TEXTY) || c.closest('#stSvg') || c.closest(SURFACE) !== surf)
                continue;
            if (c.matches('.card-art') || BIG.some(([b]) => c.matches(b)))
                continue;
            const r = c.getBoundingClientRect();
            const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
            const dist = Math.hypot(dx, dy);
            if (dist < bd) {
                bd = dist;
                best = c;
            }
        }
        return bd <= MAGNET ? best : null;
    }
    /** What the pointer at (x, y) would use, and what the outline should wrap. */
    function resolve(x, y, magnet) {
        const hit = document.elementFromPoint(x, y);
        if (!hit || hit.tagName === 'IFRAME')
            return NONE;
        const sp = hit.closest('#stSvg .sp');
        if (sp)
            return { kind: 'grab', el: sp, box: sp, label: t('cur.drag') };
        if (hit.closest('#stSvg'))
            return NONE;
        const tx = hit.closest(TEXTY);
        if (tx)
            return { kind: 'text', el: tx, box: tx.closest('.tel, .search') ?? tx, label: '' };
        const dis = hit.closest('button:disabled');
        if (dis)
            return { kind: 'disabled', el: null, box: dis, label: '' };
        const direct = hit.closest(INTERACTIVE);
        if (direct) {
            if (direct.matches('.card-art')) {
                const card = direct.closest('.card');
                return { kind: 'zone', el: direct, box: card ?? direct, label: t('cur.view') };
            }
            for (const [b, k] of BIG)
                if (direct.matches(b))
                    return { kind: 'zone', el: direct, box: direct, label: t(k) };
            return { kind: 'snap', el: direct, box: direct, label: '' };
        }
        if (magnet) {
            const n = nearest(x, y, hit);
            if (n)
                return { kind: 'snap', el: n, box: n, label: '' };
        }
        for (const [z, p, k] of ZONES) {
            const zone = hit.closest(z);
            const prim = zone?.querySelector(p);
            if (zone && prim)
                return { kind: 'zone', el: prim, box: zone, label: t(k) };
        }
        return NONE;
    }
    /* -- click assist: a click on the empty part of a card (or a near miss beside a small control) does what the outline shows -- */
    let lastType = 'mouse';
    let cursorOn = false;
    document.addEventListener('pointerdown', e => { lastType = e.pointerType; }, true);
    document.addEventListener('click', e => {
        if (e.detail === 0 || e.defaultPrevented)
            return; // keyboard or our own forwarded click
        const t0 = e.target;
        if (!(t0 instanceof Element))
            return;
        if (t0.closest(INTERACTIVE) || t0.closest('#stSvg, .backdrop, iframe, input, textarea, select, .dd-list'))
            return;
        if ((getSelection()?.toString() ?? '').trim())
            return; // the visitor was selecting text
        const h = resolve(e.clientX, e.clientY, cursorOn && lastType === 'mouse');
        if ((h.kind === 'zone' || h.kind === 'snap') && h.el && !h.el.contains(t0)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            h.el.click();
        }
    }, true);
    /* -- the cursor itself -- */
    const ok = matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches && !matchMedia('(forced-colors: active)').matches;
    if (!ok)
        return;
    cursorOn = true;
    const root = document.documentElement;
    const dot = document.createElement('div');
    dot.className = 'cur-dot';
    dot.setAttribute('aria-hidden', 'true');
    const ring = document.createElement('div');
    ring.className = 'cur-ring';
    ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = '<span class="cur-label"></span>';
    document.body.append(ring, dot);
    root.classList.add('has-cursor');
    const lab = ring.firstElementChild;
    let mx = -100, my = -100, shown = false, dirty = true, down = false, raf = 0, still = 0;
    let cur = NONE;
    let radius = 14;
    const g = { x: -100, y: -100, w: 30, h: 30, r: 15 };
    const radiusOf = (el) => { const v = parseFloat(getComputedStyle(el).borderTopLeftRadius); return Number.isFinite(v) ? v : 12; };
    function apply(h) {
        if (h.kind === cur.kind && h.box === cur.box && h.el === cur.el)
            return;
        cur = h;
        root.dataset.cur = h.kind;
        if (h.label)
            lab.textContent = h.label;
        root.classList.toggle('cur-labelled', !!h.label);
        radius = h.box ? (h.kind === 'grab' ? 18 : radiusOf(h.box)) : 15;
    }
    /** Small hysteresis so the outline doesn't flicker in the gaps between neighbouring things. */
    function keepCurrent(next) {
        if (next.kind !== 'none' || !cur.box || (cur.kind !== 'zone' && cur.kind !== 'snap'))
            return false;
        const r = cur.box.getBoundingClientRect();
        const pad = cur.kind === 'zone' ? 14 : MAGNET + 6;
        return mx > r.left - pad && mx < r.right + pad && my > r.top - pad && my < r.bottom + pad && cur.box.isConnected;
    }
    const kick = () => { still = 0; if (!raf)
        raf = requestAnimationFrame(loop); };
    function loop() {
        raf = 0;
        if (dirty && !down) {
            dirty = false;
            const n = resolve(mx, my, true);
            if (!keepCurrent(n))
                apply(n);
        }
        let tx, ty, tw, th, tr;
        const box = cur.box && cur.box.isConnected ? cur.box : null;
        if (box && cur.kind !== 'none' && cur.kind !== 'disabled') {
            const r = box.getBoundingClientRect();
            const pad = cur.kind === 'zone' || cur.kind === 'grab' ? 8 : cur.kind === 'text' ? 4 : 6;
            tx = r.left - pad;
            ty = r.top - pad;
            tw = r.width + pad * 2;
            th = r.height + pad * 2;
            tr = Math.min(radius + pad, Math.min(tw, th) / 2);
        }
        else {
            const s = 30;
            tx = mx - s / 2;
            ty = my - s / 2;
            tw = s;
            th = s;
            tr = s / 2;
        }
        const k = .26;
        g.x += (tx - g.x) * k;
        g.y += (ty - g.y) * k;
        g.w += (tw - g.w) * k;
        g.h += (th - g.h) * k;
        g.r += (tr - g.r) * k;
        ring.style.translate = `${g.x.toFixed(1)}px ${g.y.toFixed(1)}px`;
        ring.style.width = `${g.w.toFixed(1)}px`;
        ring.style.height = `${g.h.toFixed(1)}px`;
        ring.style.borderRadius = `${g.r.toFixed(1)}px`;
        const moving = Math.abs(tx - g.x) + Math.abs(ty - g.y) + Math.abs(tw - g.w) + Math.abs(th - g.h) > .4;
        if (moving || down || dirty)
            still = 0;
        if (++still < 30)
            raf = requestAnimationFrame(loop); // a few calm frames after settling, then rest
    }
    addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse')
            return;
        mx = e.clientX;
        my = e.clientY;
        dirty = true;
        dot.style.translate = `${mx}px ${my}px`;
        if (!shown) {
            shown = true;
            root.classList.add('cur-on');
            g.x = mx - 15;
            g.y = my - 15;
        }
        kick();
    }, { passive: true });
    document.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'mouse')
            return;
        down = true;
        root.classList.add('cur-down');
        if (cur.kind === 'grab')
            root.dataset.cur = 'grabbing';
        if (cur.kind !== 'text')
            ripple(e.clientX, e.clientY);
        kick();
    }, true);
    addEventListener('pointerup', e => {
        if (e.pointerType !== 'mouse')
            return;
        down = false;
        root.classList.remove('cur-down');
        dirty = true;
        cur = { ...cur, kind: cur.kind };
        root.dataset.cur = cur.kind;
        kick();
    }, true);
    document.addEventListener('pointerout', e => { if (!e.relatedTarget && e.pointerType === 'mouse') {
        shown = false;
        root.classList.remove('cur-on');
    } });
    document.addEventListener('pointerover', e => { if (e.target.tagName === 'IFRAME') {
        shown = false;
        root.classList.remove('cur-on');
    } });
    addEventListener('scroll', () => { dirty = true; kick(); }, { passive: true });
    addEventListener('blur', () => { shown = false; root.classList.remove('cur-on'); });
    // things open and close under a still pointer (menus, dialogs): re-check what's underneath
    new MutationObserver(() => { dirty = true; kick(); }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class', 'hidden'] });
    function ripple(x, y) {
        const r = document.createElement('span');
        r.className = 'cur-ripple';
        r.style.left = `${x}px`;
        r.style.top = `${y}px`;
        document.body.appendChild(r);
        r.addEventListener('animationend', () => r.remove(), { once: true });
        setTimeout(() => r.remove(), 800);
    }
}
