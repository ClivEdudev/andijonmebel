import { draw, drawInner, decor } from './art.js';
import { CATS, PRODUCTS, PRODUCT, SEP, bundleFull, ROOM_SET, ZONES, ASSEMBLY_FEE, STORE } from './data.js';
import { DICT } from './i18n.js';
import { initStudio } from './studio.js';
/* ---------- helpers ---------- */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeInOut = (t) => (t < .5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;
const parse = (s) => { try {
    return s ? JSON.parse(s) : null;
}
catch {
    return null;
} };
const store = {
    raw(k) { try {
        return parse(localStorage.getItem(k));
    }
    catch {
        return null;
    } },
    set(k, v) { try {
        localStorage.setItem(k, JSON.stringify(v));
    }
    catch { /* storage blocked: the site still works, it just won't remember */ } },
};
const LANGS = ['uz', 'ru', 'en'];
const isLang = (v) => LANGS.includes(v);
let lang = (() => { const s = store.raw('rm-lang'); if (isLang(s))
    return s; const n = navigator.language.slice(0, 2); return isLang(n) ? n : 'uz'; })();
const t = (k) => DICT[lang]?.[k] ?? DICT.uz[k] ?? k;
const money = (n) => `${Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ')} ${t('cur')}`;
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const colorsOf = (p, i) => { const s = p.swatches[i] ?? p.swatches[0]; return { m: s.m, d: s.d, w: p.wood }; };
const MAX_QTY = 20, MAX_LINES = 40;
/** Accepts anything (old versions, hand-edited storage, other tabs) and returns a valid cart. */
function sanitizeCart(raw) {
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const it of raw) {
        if (!it || typeof it !== 'object')
            continue;
        const o = it;
        const key = typeof o.key === 'string' ? o.key : '';
        let qty = Math.floor(Number(o.qty));
        let color = Number(o.color);
        if (!Number.isFinite(qty) || qty < 1)
            continue;
        qty = Math.min(qty, MAX_QTY);
        if (key.startsWith('sep-')) {
            if (!SEP.some(b => b.id === key))
                continue;
            color = -1;
        }
        else {
            const p = PRODUCTS.find(x => x.id === key);
            if (!p)
                continue;
            if (!Number.isInteger(color) || color < 0 || color >= p.swatches.length)
                color = 0;
        }
        const ex = out.find(l => l.key === key && l.color === color);
        if (ex)
            ex.qty = Math.min(MAX_QTY, ex.qty + qty);
        else if (out.length < MAX_LINES)
            out.push({ key, color, qty });
    }
    return out;
}
let cart = sanitizeCart(store.raw('rm-cart'));
const sel = {};
const view = { cat: 'all', q: '', sort: 'pop' };
const isSep = (l) => l.key.startsWith('sep-');
const linePrice = (l) => (isSep(l) ? SEP.find(b => b.id === l.key).price : PRODUCT(l.key).price);
const lineName = (l) => (isSep(l) ? SEP.find(b => b.id === l.key).name[lang] : PRODUCT(l.key).name[lang]);
const lineSub = (l) => (isSep(l) ? `${SEP.find(b => b.id === l.key).items.length} ${t('sep.pieces')}` : PRODUCT(l.key).swatches[l.color].name[lang]);
const subtotal = () => cart.reduce((a, l) => a + linePrice(l) * l.qty, 0);
const count = () => cart.reduce((a, l) => a + l.qty, 0);
const sysDark = matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => (root.dataset.theme === 'dark' ? 'dark' : 'light');
function paintTheme(th) {
    root.dataset.theme = th;
    $('meta[name="theme-color"]')?.setAttribute('content', th === 'dark' ? '#10142B' : '#EDEFEA');
    const b = $('#themeBtn');
    b.setAttribute('aria-pressed', String(th === 'dark'));
    studio?.renderIntro();
}
function setTheme(next, origin) {
    store.set('rm-theme', next);
    const doc = document;
    if (reduced || !doc.startViewTransition || !origin) {
        root.classList.add('theming');
        paintTheme(next);
        setTimeout(() => root.classList.remove('theming'), 450);
        return;
    }
    const r = origin.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = doc.startViewTransition(() => paintTheme(next));
    vt.ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] }, { duration: 700, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => { });
}
/* ---------- i18n ---------- */
function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="w"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ');
}
function applyLang() {
    if ($('#checkout').classList.contains('open'))
        captureFields();
    root.lang = lang;
    document.title = t('meta.title');
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    $$('[data-split]').forEach(el => splitWords(el));
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    lastStage = '';
    renderRoomTags();
    renderMarquee();
    renderRail();
    renderChips();
    renderGrid(true);
    renderSep();
    renderZones();
    renderCart();
    renderVisit();
    if ($('#checkout').classList.contains('open') && order.step < 4)
        renderCheckout();
    if (openProduct)
        renderProductModal(openProduct);
    layout();
    if (!reduced)
        syncScene();
    studio?.refresh();
}
const cOf = (id) => colorsOf(PRODUCT(id), 0);
const PIECES = [
    { k: 'rug', svg: decor.rug(), x: 640, y: 682, s: 1, from: [0, 60, 0], range: [.03, .16] },
    { k: 'javon', svg: drawInner('shelf', cOf('javon')), x: 830, y: 303, s: 1.15, from: [380, -40, 14], range: [.1, .26], pid: 'javon', tag: [1060, 330] },
    { k: 'samarqand', svg: drawInner('sofa', cOf('samarqand')), x: 310, y: 266, s: 1.45, from: [-700, 40, -10], range: [.18, .4], pid: 'samarqand', tag: [470, 445] },
    { k: 'art', svg: decor.art(), x: 600, y: 250, s: 1, from: [0, -420, 18], range: [.3, .45] },
    { k: 'lola', svg: drawInner('armchair', cOf('lola')), x: 730, y: 393, s: 1.15, from: [600, 120, 16], range: [.38, .56], pid: 'lola', tag: [930, 520] },
    { k: 'oqsaroy', svg: drawInner('coffeetable', cOf('oqsaroy')), x: 350, y: 444, s: 1.05, from: [0, 380, -8], range: [.5, .66], pid: 'oqsaroy', tag: [395, 712] },
    { k: 'lamp', svg: decor.lamp(), x: 320, y: 440, s: 1, from: [-300, 0, -20], range: [.58, .72] },
    { k: 'plant', svg: decor.plant(), x: 170, y: 610, s: 1, from: [-260, 60, 10], range: [.64, .78] },
    { k: 'pendant', svg: decor.pendant(), x: 600, y: 118, s: 1, from: [0, -360, 0], range: [.7, .82] },
];
function buildRoom() {
    const svg = $('#room');
    let floor = '';
    for (let i = 0; i < 12; i++)
        floor += `<line class="r-fl" x1="${-200 + i * 140}" y1="560" x2="${-520 + i * 200}" y2="760" stroke-width="2"/>`;
    const stars = [[110, 150], [150, 230], [240, 140], [200, 300], [125, 330], [255, 250]].map(([x, y], i) => `<circle class="star" cx="${x}" cy="${y}" r="${i % 2 ? 1.6 : 2.3}" fill="#fff"/>`).join('');
    svg.innerHTML = `
    <defs><clipPath id="arch"><path d="M90 470 V230 Q90 120 180 110 Q270 120 270 230 V470z"/></clipPath>
    <linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="0" y2="480"><stop class="sky0" offset="0"/><stop class="sky1" offset="1"/></linearGradient>
    <radialGradient id="lampGlow"><stop offset="0" stop-color="#FFD98A" stop-opacity=".55"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
    <linearGradient id="coneGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3A3" stop-opacity=".42"/><stop offset="1" stop-color="#FFE3A3" stop-opacity="0"/></linearGradient></defs>
    <rect class="r-wall" width="1200" height="560"/>
    <g class="room-window"><g clip-path="url(#arch)"><rect x="80" y="100" width="200" height="380" fill="url(#sky)"/>${stars}
    <circle class="sun" cx="220" cy="200" r="26"/><circle class="moonbite" cx="234" cy="191" r="23" fill="url(#sky)"/>
    <path class="r-hill" d="M80 420 q60 -60 110 -20 q50 -50 90 -10 v90 h-200z"/></g>
    <path class="r-frame" d="M90 470 V230 Q90 120 180 110 Q270 120 270 230 V470z" fill="none" stroke-width="12"/><line class="r-frame" x1="180" y1="112" x2="180" y2="470" stroke-width="6"/><rect class="r-sill" x="74" y="466" width="212" height="14"/></g>
    <rect class="r-sill" y="548" width="1200" height="14"/>
    <rect class="r-floor" y="560" width="1200" height="200"/>${floor}
    <path class="room-line" d="M0 560 H1200" stroke-width="3" fill="none"/>
    ${PIECES.map(p => `<g class="pc" data-k="${p.k}"><g transform="translate(${p.x} ${p.y}) scale(${p.s})">${p.svg}</g></g>`).join('')}
    <g id="roomTags"></g>`;
}
function renderRoomTags() {
    const g = $('#roomTags');
    if (!g)
        return;
    g.innerHTML = PIECES.filter(p => p.tag).map(p => {
        const label = money(PRODUCT(p.pid).price);
        const w = label.length * 11 + 34;
        return `<g class="tag" data-k="${p.k}" transform="translate(${p.tag[0]} ${p.tag[1]})"><g class="tag-in"><rect x="${-w / 2}" y="-20" width="${w}" height="40" rx="20" fill="#19224A"/><circle cx="${-w / 2 + 18}" cy="0" r="5" fill="#B8293F"/><text x="8" y="6" text-anchor="middle" fill="#F8F9F6" font-size="18" font-family="Onest, sans-serif" font-weight="600">${esc(label)}</text></g></g>`;
    }).join('');
    $('#roomTotal').textContent = money(ROOM_SET.reduce((a, id) => a + PRODUCT(id).price, 0));
    if (reduced)
        $$('#roomTags .tag').forEach(tg => { tg.style.opacity = '1'; });
}
let lastStage = '';
function updateRoom(p) {
    let placedValue = 0;
    let stage = t('room.empty');
    for (const pc of PIECES) {
        const el = $(`.pc[data-k="${pc.k}"]`);
        if (!el)
            continue;
        const raw = clamp((p - pc.range[0]) / (pc.range[1] - pc.range[0]));
        const e = easeBack(raw);
        const inv = 1 - ease(raw);
        el.style.transform = `translate(${pc.from[0] * (1 - e)}px, ${pc.from[1] * (1 - e)}px) rotate(${pc.from[2] * inv}deg) scale(${.7 + .3 * ease(raw)})`;
        el.style.opacity = String(clamp(raw * 3));
        if (raw >= 1 && pc.pid) {
            placedValue += PRODUCT(pc.pid).price;
            stage = PRODUCT(pc.pid).name[lang];
        }
    }
    if (p > .84)
        stage = t('room.done');
    if (stage !== lastStage) {
        lastStage = stage;
        const st = $('#roomStage');
        st.classList.remove('flip');
        void st.offsetWidth;
        st.textContent = stage;
        st.classList.add('flip');
    }
    $('#roomRunning').textContent = money(placedValue);
    $$('#roomTags .tag').forEach((tg, i) => { const k = clamp((p - .84 - i * .02) / .06); tg.style.opacity = String(k); tg.firstElementChild.style.transform = `translateY(${(1 - easeBack(k)) * 16}px)`; });
    $('.room-line').style.strokeDashoffset = String(1200 * (1 - clamp(p / .05)));
    $('.hero').style.setProperty('--p', p.toFixed(3));
}
function updateRoomStatic() {
    $$('.pc').forEach(p => { p.style.opacity = '1'; });
    $$('#roomTags .tag').forEach(tg => { tg.style.opacity = '1'; });
    $('#roomStage').textContent = t('room.done');
    $('#roomRunning').textContent = $('#roomTotal').textContent;
}
/* ---------- marquee ---------- */
const ORN = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l5 10-5 10-5-10z" fill="currentColor"/><path d="M12 7l2.5 5-2.5 5-2.5-5z"/></svg>`;
function renderMarquee() {
    const words = CATS.map(c => c.name[lang]).concat([t('mq.delivery'), t('mq.sep')]);
    const chunk = words.map(w => `<span>${esc(w)}</span>${ORN}`).join('');
    $('#marqueeTrack').innerHTML = chunk + chunk + chunk + chunk;
}
/* ---------- category rail ---------- */
function renderRail() {
    $('#railTrack').innerHTML = CATS.map((c, i) => {
        const items = PRODUCTS.filter(p => p.cat === c.id);
        const from = Math.min(...items.map(p => p.price));
        const sample = items[0];
        return `<article class="panel" style="--h:${i}"><div class="panel-art">${draw(c.art, colorsOf(sample, 0), c.name[lang])}</div>
      <div class="panel-txt"><h3>${c.name[lang]}</h3><p>${c.blurb[lang]}</p>
      <p class="panel-meta"><span>${items.length} ${t('rail.items')}</span><span>${t('rail.from')} ${money(from)}</span></p>
      <button class="btn btn-line" data-cat="${c.id}">${t('rail.see')}</button></div></article>`;
    }).join('');
}
/* ---------- catalogue ---------- */
function renderChips() {
    const chips = [{ id: 'all', label: t('cat.all') }, ...CATS.map(c => ({ id: c.id, label: c.name[lang] }))];
    $('#chips').innerHTML = chips.map(c => `<button class="chip" data-cat="${c.id}" aria-pressed="${view.cat === c.id}">${esc(c.label)}</button>`).join('');
}
const swatchesHTML = (p, i) => `<div class="swatches${''}" role="radiogroup" aria-label="${t('card.color')}">${p.swatches.map((s, k) => `<button class="sw" role="radio" aria-checked="${k === i}" aria-label="${s.name[lang]}" title="${s.name[lang]}" data-sw="${p.id}:${k}" style="--c:${s.m}"></button>`).join('')}</div>`;
function cardHTML(p) {
    const i = sel[p.id] ?? 0;
    const cat = CATS.find(c => c.id === p.cat);
    return `<button class="card-art" data-open="${p.id}" aria-label="${esc(p.name[lang])}: ${t('card.details')}"><span class="card-tilt">${draw(p.art, colorsOf(p, i), p.name[lang])}</span></button>
    ${p.badge ? `<span class="badge badge-${p.badge}">${t('badge.' + p.badge)}</span>` : ''}
    <div class="card-body"><p class="card-cat">${cat.name[lang]}</p><h3>${esc(p.name[lang])}</h3>
    <p class="card-dims">${p.dims} ${t('cm')}</p>${swatchesHTML(p, i)}
    <div class="card-foot"><p class="price">${p.old ? `<s>${money(p.old)}</s>` : ''}<b>${money(p.price)}</b></p>
    <button class="add" data-add="${p.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>${t('card.add')}</button></div></div>`;
}
function visibleProducts() {
    const q = view.q.trim().toLowerCase().slice(0, 60);
    let list = PRODUCTS.filter(p => (view.cat === 'all' || p.cat === view.cat) && (!q || Object.values(p.name).some(n => n.toLowerCase().includes(q)) || Object.values(CATS.find(c => c.id === p.cat).name).some(n => n.toLowerCase().includes(q))));
    if (view.sort === 'asc')
        list = list.slice().sort((a, b) => a.price - b.price);
    else if (view.sort === 'desc')
        list = list.slice().sort((a, b) => b.price - a.price);
    else
        list = list.slice().sort((a, b) => b.pop - a.pop);
    return list;
}
function renderGrid(rebuild = false) {
    const grid = $('#grid');
    if (rebuild || !grid.children.length) {
        grid.innerHTML = PRODUCTS.map(p => `<article class="card" data-id="${p.id}">${cardHTML(p)}</article>`).join('');
        if (finePointer && !reduced)
            $$('.card-art', grid).forEach(attachTilt);
    }
    const cards = $$('.card', grid);
    // Measure where cards are right now (including any animation still running), then stop those animations.
    const before = new Map(cards.filter(c => !c.hidden).map(c => [c, c.getBoundingClientRect()]));
    cards.forEach(c => c.getAnimations().forEach(a => a.cancel()));
    const list = visibleProducts();
    const ids = new Set(list.map(p => p.id));
    cards.forEach(c => { c.hidden = !ids.has(c.dataset.id); });
    list.forEach(p => grid.appendChild(cards.find(c => c.dataset.id === p.id)));
    $('#empty').hidden = list.length > 0;
    $('#count').textContent = `${list.length} ${t('rail.items')}`;
    if (reduced || rebuild || navigating)
        return;
    list.forEach((p, idx) => {
        const c = cards.find(c => c.dataset.id === p.id);
        const a = before.get(c);
        const b = c.getBoundingClientRect();
        if (b.bottom < -200 || b.top > innerHeight + 200)
            return; // off-screen: skip work
        if (a) {
            const dx = a.left - b.left, dy = a.top - b.top;
            if (Math.abs(dx) > .5 || Math.abs(dy) > .5)
                c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
        }
        else {
            c.animate([{ opacity: 0, transform: 'translateY(30px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: Math.min(idx, 8) * 40, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
        }
    });
}
function attachTilt(el) {
    const inner = $('.card-tilt', el);
    el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        inner.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(20px) scale(1.04)`;
    });
    el.addEventListener('pointerleave', () => { inner.style.transform = ''; });
}
function setColor(id, k) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p || !p.swatches[k])
        return;
    if ((sel[id] ?? 0) === k)
        return;
    sel[id] = k;
    const card = $(`.card[data-id="${id}"]`);
    if (card) {
        const wrap = $('.card-tilt', card);
        // Every existing drawing fades out, however fast the swatches are clicked, so they never pile up.
        Array.from(wrap.children).forEach(ch => { if (ch.classList.contains('swap-out'))
            return; ch.classList.remove('swap-in'); ch.classList.add('swap-out'); setTimeout(() => ch.remove(), 420); });
        wrap.insertAdjacentHTML('beforeend', draw(p.art, colorsOf(p, k), p.name[lang]));
        wrap.lastElementChild.classList.add('swap-in');
        $$('.sw', card).forEach((b, i) => b.setAttribute('aria-checked', String(i === k)));
    }
    if (openProduct === id)
        renderProductModal(id);
}
/* ---------- overlays (cart, product, checkout, mobile menu) ---------- */
let openProduct = null;
let modalQty = 1;
const focusBack = new Map();
let ignorePops = 0;
const stack = [];
const openOverlays = () => stack.slice();
function syncLocks() {
    const blocking = stack.some(e => e.id !== 'menu');
    const menu = stack.some(e => e.id === 'menu');
    $('.top').inert = blocking;
    $('main').inert = blocking || menu;
    $('.foot').inert = blocking || menu;
    // Only the top-most layer is interactive (e.g. the cart opened over the studio).
    stack.forEach((e, i) => { if (e.id !== 'menu')
        e.inert = i < stack.length - 1; });
    root.classList.toggle('locked', blocking || menu);
    // Keep the header's blur off until the menu has finished sliding away (the blur would trap the fixed menu inside the header).
    clearTimeout(menuClassTimer);
    if (menu)
        root.classList.add('menu-open');
    else
        menuClassTimer = window.setTimeout(() => root.classList.remove('menu-open'), 520);
}
let menuClassTimer = 0;
function openOverlay(el, replaceHistory = false) {
    focusBack.set(el.id, document.activeElement);
    if (!stack.includes(el))
        stack.push(el);
    $('#toast').classList.remove('show');
    el.classList.add('open');
    if (el.id !== 'menu')
        el.setAttribute('aria-hidden', 'false');
    syncLocks();
    if (el.id === 'menu') {
        $('#menuBtn').setAttribute('aria-expanded', 'true');
    }
    try {
        if (replaceHistory)
            history.replaceState({ ov: el.id }, '');
        else
            history.pushState({ ov: el.id }, '');
    }
    catch { /* history unavailable */ }
    setTimeout(() => (el.id === 'menu' ? $('#menu a') : $('.close', el))?.focus({ preventScroll: true }), 60);
}
function closeOverlay(el, restoreFocus = true) {
    if (!el.classList.contains('open'))
        return;
    const i = stack.indexOf(el);
    if (i >= 0)
        stack.splice(i, 1);
    el.inert = false;
    if (el.id === 'studio')
        studio.onClose();
    el.classList.remove('open');
    if (el.id !== 'menu')
        el.setAttribute('aria-hidden', 'true');
    syncLocks();
    if (el.id === 'pmodal')
        openProduct = null;
    if (el.id === 'menu')
        $('#menuBtn').setAttribute('aria-expanded', 'false');
    if (restoreFocus)
        focusBack.get(el.id)?.focus({ preventScroll: true });
}
/** Close from inside the page (X, Esc, backdrop): also drop the history entry so Back doesn't reopen anything. */
function requestClose(el, restoreFocus = true) {
    closeOverlay(el, restoreFocus);
    if (history.state?.ov === el.id) {
        ignorePops++;
        history.back();
    }
}
addEventListener('popstate', () => {
    if (ignorePops > 0) {
        ignorePops--;
        return;
    }
    const top = stack[stack.length - 1];
    if (top)
        closeOverlay(top);
});
function renderProductModal(id) {
    const p = PRODUCT(id);
    const i = sel[id] ?? 0;
    const cat = CATS.find(c => c.id === p.cat);
    const inCart = cart.find(l => l.key === id && l.color === i)?.qty ?? 0;
    const room = MAX_QTY - inCart;
    modalQty = clamp(modalQty, 1, Math.max(1, room));
    $('#pmBody').innerHTML = `<div class="pm-art">${draw(p.art, colorsOf(p, i), p.name[lang])}</div>
    <div class="pm-info"><p class="card-cat">${cat.name[lang]}</p><h2 id="pmTitle">${esc(p.name[lang])}</h2>
    <p class="price big">${p.old ? `<s>${money(p.old)}</s>` : ''}<b>${money(p.price)}</b></p>
    <p class="pm-desc">${t('desc.' + p.cat)}</p>
    <dl class="pm-spec"><div><dt>${t('pm.size')}</dt><dd>${p.dims} ${t('cm')}</dd></div><div><dt>${t('pm.color')}</dt><dd>${p.swatches[i].name[lang]}</dd></div><div><dt>${t('pm.warranty')}</dt><dd>${t('pm.warrantyV')}</dd></div></dl>
    ${swatchesHTML(p, i).replace('class="swatches"', 'class="swatches lg"')}
    <div class="pm-buy"><div class="qty"><button data-q="-1" aria-label="${t('qty.less')}" ${modalQty <= 1 ? 'disabled' : ''}>−</button><output aria-live="polite">${modalQty}</output><button data-q="1" aria-label="${t('qty.more')}" ${modalQty >= room ? 'disabled' : ''}>+</button></div>
    <button class="btn btn-pom" data-add-modal="${p.id}" ${room <= 0 ? 'disabled' : ''}>${room <= 0 ? t('toast.max') : `${t('card.add')} · ${money(p.price * modalQty)}`}</button></div>
    <button class="btn btn-line wide try-btn" data-try="${p.id}">${CUBE}${t('studio.try')}</button></div>`;
}
const CUBE = '<svg class="cube" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z M3.5 7.3L12 12l8.5-4.7 M12 12v9.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
/* ---------- cart ---------- */
function save() { store.set('rm-cart', cart); }
let lastAddAt = 0;
function addToCart(key, color = 0, qty = 1, from, art) {
    const ex = cart.find(l => l.key === key && l.color === color);
    const room = MAX_QTY - (ex?.qty ?? 0);
    const add = Math.min(qty, room);
    if (add <= 0) {
        toast(t('toast.max'));
        return false;
    }
    if (!ex && cart.length >= MAX_LINES) {
        toast(t('toast.full'));
        return false;
    }
    if (ex)
        ex.qty += add;
    else
        cart.push({ key, color, qty: add });
    save();
    renderCart();
    if (from)
        flyToCart(from, art);
    toast(add < qty ? t('toast.max') : `${t('toast.added')}: ${lineName({ key, color, qty })}`);
    return true;
}
/** Adds a batch of lines at once (from the studio), respecting the per-item and cart limits. */
function addMany(lines) {
    let added = 0, capped = false;
    for (const l of sanitizeCart(lines)) {
        const ex = cart.find(c => c.key === l.key && c.color === l.color);
        const take = Math.min(l.qty, MAX_QTY - (ex?.qty ?? 0));
        if (take < l.qty)
            capped = true;
        if (take <= 0)
            continue;
        if (ex)
            ex.qty += take;
        else if (cart.length < MAX_LINES)
            cart.push({ key: l.key, color: l.color, qty: take });
        else {
            capped = true;
            continue;
        }
        added += take;
    }
    save();
    renderCart();
    if (added)
        $('#cartBtn').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    return { added, capped };
}
function lineArt(l) {
    if (isSep(l)) {
        const p = PRODUCT(SEP.find(x => x.id === l.key).show[0]);
        return draw(p.art, colorsOf(p, 0));
    }
    const p = PRODUCT(l.key);
    return draw(p.art, colorsOf(p, l.color));
}
function renderCart() {
    const n = count();
    const badge = $('#cartCount');
    badge.textContent = n > 99 ? '99+' : String(n);
    badge.hidden = n === 0;
    const list = $('#cartList');
    if (!cart.length) {
        list.innerHTML = `<li class="cart-empty"><p>${t('cart.empty')}</p><a href="#catalog" class="btn btn-line" data-close-cart>${t('cart.browse')}</a></li>`;
    }
    else {
        list.innerHTML = cart.map((l, i) => `<li class="line" data-i="${i}"><div class="line-art">${lineArt(l)}</div><div class="line-info"><p class="line-name">${esc(lineName(l))}</p><p class="line-sub">${lineSub(l)}</p>
      <div class="qty sm"><button data-lq="-1" aria-label="${t('qty.less')}">−</button><output>${l.qty}</output><button data-lq="1" aria-label="${t('qty.more')}" ${l.qty >= MAX_QTY ? 'disabled' : ''}>+</button></div></div>
      <div class="line-end"><b>${money(linePrice(l) * l.qty)}</b><button class="link" data-rm>${t('cart.remove')}</button></div></li>`).join('');
    }
    $('#cartSubtotal').textContent = money(subtotal());
    $('#toCheckout').disabled = !cart.length;
}
/** Removes a line with a short collapse; the line ignores clicks while it leaves, so double-clicks can't hit the next one. */
function removeLine(li) {
    if (li.classList.contains('leaving'))
        return;
    const line = cart[+li.dataset.i];
    if (!line)
        return;
    li.classList.add('leaving');
    const finish = () => { cart = cart.filter(l => l !== line); save(); renderCart(); };
    if (reduced) {
        finish();
        return;
    }
    li.animate([{ height: li.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px' }], { duration: 260, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = finish;
}
function flyToCart(from, art) {
    const btn = $('#cartBtn');
    const bump = () => btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    if (reduced) {
        bump();
        return;
    }
    let src = from.querySelector('svg') ?? from;
    let ghost;
    if (art || !(src instanceof SVGSVGElement)) {
        const tmp = document.createElement('div');
        tmp.innerHTML = art ?? '';
        ghost = tmp.firstElementChild ?? src.cloneNode(true);
    }
    else
        ghost = src.cloneNode(true);
    let a = src.getBoundingClientRect();
    if (!a.width || a.bottom < 0 || a.top > innerHeight || +getComputedStyle(src).opacity < .5) {
        src = $('#addRoom');
        a = src.getBoundingClientRect();
    }
    const b = btn.getBoundingClientRect();
    ghost.classList.add('ghost');
    Object.assign(ghost.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    ghost.animate([
        { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
        { transform: `translate(${dx * .45}px, ${dy * .45 - 140}px) scale(.55) rotate(-12deg)`, opacity: 1, offset: .45 },
        { transform: `translate(${dx}px, ${dy}px) scale(.08) rotate(10deg)`, opacity: .3 },
    ], { duration: 820, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { ghost.remove(); bump(); };
}
let toastTimer = 0;
function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.classList.remove('show'), 2600);
}
/* ---------- sep bundles ---------- */
function renderSep() {
    $('#sepList').innerHTML = SEP.map((b, i) => {
        const full = bundleFull(b);
        return `<article class="bundle${$(`.bundle[data-b="${b.id}"].in`) ? ' in' : ''}" data-b="${b.id}" data-reveal style="--d:${i}"><div class="bundle-art">${b.show.map((id, k) => { const p = PRODUCT(id); return `<div class="ba ba-${k}">${draw(p.art, colorsOf(p, 0))}</div>`; }).join('')}</div>
      <h3>${b.name[lang]}</h3><p class="bundle-note">${b.note[lang]}</p>
      <ul>${b.items.map(id => `<li>${esc(PRODUCT(id).name[lang])}</li>`).join('')}</ul>
      <p class="price big"><s>${money(full)}</s><b>${money(b.price)}</b></p>
      <p class="bundle-save">${t('sep.save')} ${money(full - b.price)}</p>
      <div class="bundle-btns"><button class="btn btn-pom" data-add-sep="${b.id}">${t('sep.add')}</button><button class="btn btn-line try-btn" data-try-sep="${b.id}">${CUBE}${t('studio.try')}</button></div></article>`;
    }).join('');
    observeReveals();
}
/* ---------- delivery & visit ---------- */
function renderZones() {
    $('#zoneList').innerHTML = ZONES.map(z => `<li><span>${z.name[lang]}</span><span class="z-days">${z.days[lang]}</span><b>${z.fee ? money(z.fee) : t('free')}${z.freeFrom ? `<small>${t('zone.freeFrom')} ${money(z.freeFrom)}</small>` : ''}</b></li>`).join('');
}
function renderVisit() { $('#phone').textContent = STORE.phone; }
/* ---------- checkout ---------- */
const order = { step: 1, name: '', phone: '', zone: 'city', address: '', date: '', assembly: false, payment: 'cash', comment: '' };
let submitting = false;
function deliveryFee() { const z = ZONES.find(z => z.id === order.zone) ?? ZONES[1]; return z.freeFrom && subtotal() >= z.freeFrom ? 0 : z.fee; }
const assemblyFee = () => (order.assembly && order.zone !== 'pickup' ? ASSEMBLY_FEE : 0);
function total() { return subtotal() + deliveryFee() + assemblyFee(); }
function dates() {
    const out = [];
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    for (let i = 0; i < 10; i++) {
        const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0');
        const v = `${dd}/${mm}/${d.getFullYear()}`;
        out.push({ v, l: `${v}, ${t('wd.' + d.getDay())}` });
        d.setDate(d.getDate() + 1);
    }
    return out;
}
const phoneDigits = (raw) => { let d = raw.replace(/\D/g, ''); if (d.length > 9 && d.startsWith('998'))
    d = d.slice(3); return d.slice(0, 9); };
const fmtPhone = (raw) => { const d = phoneDigits(raw); return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' '); };
/** Reformats the phone while typing without throwing the caret to the end. */
function onPhoneInput(el) {
    const pos = el.selectionStart ?? el.value.length;
    const pasted998 = el.value.replace(/\D/g, '').length > 9 && el.value.replace(/\D/g, '').startsWith('998');
    let digitsBefore = el.value.slice(0, pos).replace(/\D/g, '').length - (pasted998 ? 3 : 0);
    const out = fmtPhone(el.value);
    el.value = out;
    let idx = 0;
    while (idx < out.length && digitsBefore > 0) {
        if (/\d/.test(out[idx]))
            digitsBefore--;
        idx++;
    }
    try {
        el.setSelectionRange(idx, idx);
    }
    catch { /* some input types don't support selection */ }
}
const hasLetters = (s) => /\p{L}/u.test(s);
function captureFields() {
    const v = (id) => $(`#${id}`);
    if (v('fName'))
        order.name = v('fName').value.trim();
    if (v('fPhone'))
        order.phone = fmtPhone(v('fPhone').value);
    if (v('fAddress'))
        order.address = v('fAddress').value.trim();
    if (v('fDate'))
        order.date = v('fDate').value;
    if (v('fAsm'))
        order.assembly = v('fAsm').checked;
    if (v('fComment'))
        order.comment = v('fComment').value.trim();
}
function renderCheckout() {
    const s = order.step;
    const body = $('#coBody');
    $$('#coSteps li').forEach((li, i) => { li.classList.toggle('on', i + 1 === s); li.classList.toggle('done', i + 1 < s); });
    const ds = dates();
    if (!ds.some(d => d.v === order.date))
        order.date = ds[0].v; // page left open past midnight
    if (order.zone === 'pickup')
        order.assembly = false;
    if (s === 1)
        body.innerHTML = `
    <label class="field"><span>${t('co.name')}</span><input id="fName" autocomplete="name" maxlength="60" value="${esc(order.name)}" required></label>
    <label class="field"><span>${t('co.phone')}</span><span class="tel"><span class="tel-pre">+998</span><input id="fPhone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="90 123 45 67" value="${esc(order.phone)}" required></span></label>
    <p class="hint">${t('co.phoneHint')}</p>`;
    if (s === 2)
        body.innerHTML = `
    <fieldset class="radios"><legend>${t('co.where')}</legend>${ZONES.map(z => { const fee = z.freeFrom && subtotal() >= z.freeFrom ? 0 : z.fee; return `<label class="radio"><input type="radio" name="zone" value="${z.id}" ${order.zone === z.id ? 'checked' : ''}><span class="r-main">${z.name[lang]}<small>${z.days[lang]}</small></span><b>${fee ? money(fee) : t('free')}</b></label>`; }).join('')}</fieldset>
    ${order.zone !== 'pickup' ? `<label class="field"><span>${t('co.address')}</span><textarea id="fAddress" rows="2" maxlength="200" placeholder="${t('co.addressPh')}">${esc(order.address)}</textarea></label>` : `<p class="hint">${t('co.pickupHint')}</p>`}
    <label class="field"><span>${order.zone === 'pickup' ? t('co.datePickup') : t('co.date')}</span><select id="fDate">${ds.map(d => `<option ${d.v === order.date ? 'selected' : ''} value="${d.v}">${d.l}</option>`).join('')}</select></label>
    ${order.zone !== 'pickup' ? `<label class="check"><input type="checkbox" id="fAsm" ${order.assembly ? 'checked' : ''}><span>${t('co.assembly')} <b>${money(ASSEMBLY_FEE)}</b></span></label>` : ''}`;
    if (s === 3)
        body.innerHTML = `
    <fieldset class="radios"><legend>${t('co.pay')}</legend>${['cash', 'card', 'transfer', 'install'].map(m => `<label class="radio"><input type="radio" name="pay" value="${m}" ${order.payment === m ? 'checked' : ''}><span class="r-main">${t('pay.' + m)}<small>${t('pay.' + m + 'Hint')}</small></span></label>`).join('')}</fieldset>
    <label class="field"><span>${t('co.comment')}</span><textarea id="fComment" rows="2" maxlength="500">${esc(order.comment)}</textarea></label>
    <div class="summary"><ul>${cart.map(l => `<li><span>${esc(lineName(l))} × ${l.qty}</span><span>${money(linePrice(l) * l.qty)}</span></li>`).join('')}</ul>
    <p><span>${t('co.delivery')}</span><span>${deliveryFee() ? money(deliveryFee()) : t('free')}</span></p>
    ${assemblyFee() ? `<p><span>${t('co.asmShort')}</span><span>${money(ASSEMBLY_FEE)}</span></p>` : ''}
    <p class="sum-total"><span>${t('co.total')}</span><b>${money(total())}</b></p></div>
    <p class="hint">${t('co.confirmHint')}</p>`;
    if (s === 4)
        return;
    $('#coBack').hidden = s === 1;
    $('#coNext').textContent = s === 3 ? t('co.place') : t('co.next');
    $('#coTotal').textContent = money(total());
    $('#coErr').textContent = '';
}
function readStep() {
    captureFields();
    if (order.step === 1) {
        if (order.name.length < 2 || !hasLetters(order.name))
            return t('err.name');
        if (phoneDigits(order.phone).length !== 9)
            return t('err.phone');
    }
    if (order.step === 2 && order.zone !== 'pickup' && (order.address.length < 5 || !hasLetters(order.address)))
        return t('err.address');
    return null;
}
async function placeOrder() {
    if (submitting)
        return;
    if (!cart.length) {
        $('#coErr').textContent = t('err.emptyCart');
        return;
    }
    submitting = true;
    const id = 'RM-' + Date.now().toString(36).toUpperCase().slice(-6);
    const items = cart.map(l => `[${l.key}] ${lineName(l)}${isSep(l) ? '' : ' (' + PRODUCT(l.key).swatches[l.color].name.uz + ')'} × ${l.qty} = ${linePrice(l) * l.qty}`).join('\n');
    const data = {
        'form-name': 'order', order_id: id, name: order.name, phone: '+998 ' + order.phone, zone: (ZONES.find(z => z.id === order.zone) ?? ZONES[1]).name.uz,
        address: order.address, date: order.date, assembly: assemblyFee() ? 'ha' : 'yoʻq', payment: DICT.uz['pay.' + order.payment] ?? order.payment,
        comment: order.comment, items, subtotal: String(subtotal()), delivery: String(deliveryFee()), total: String(total()), lang, 'bot-field': '',
    };
    const btn = $('#coNext');
    const back = $('#coBack');
    btn.disabled = true;
    back.disabled = true;
    btn.textContent = t('co.sending');
    $('#coErr').textContent = '';
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    try {
        const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString(), signal: ctl.signal });
        if (!res.ok)
            throw new Error(String(res.status));
        const tot = total();
        cart = [];
        save();
        renderCart();
        order.step = 4;
        order.comment = '';
        $$('#coSteps li').forEach(li => { li.classList.remove('on'); li.classList.add('done'); });
        $('#coBody').innerHTML = `<div class="done"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36" fill="none" stroke="#9FB0A0" stroke-width="4"/><path class="tick" d="M24 41l11 11 21-24" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <h3>${t('done.title')}</h3><p>${t('done.num')} <b>${id}</b></p><p>${t('done.text')}</p><p class="done-total">${money(tot)}</p></div>`;
        $('#coFoot').hidden = true;
    }
    catch (err) {
        $('#coErr').textContent = err.name === 'AbortError' ? t('err.timeout') : t('err.send');
        btn.textContent = t('co.place');
    }
    finally {
        clearTimeout(timer);
        btn.disabled = false;
        back.disabled = false;
        submitting = false;
    }
}
/* ---------- reveals ---------- */
let io = null;
function observeReveals() {
    if (reduced || !('IntersectionObserver' in window)) {
        $$('[data-reveal]').forEach(e => e.classList.add('in'));
        return;
    }
    io ?? (io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
    } }), { threshold: .18, rootMargin: '0px 0px -8% 0px' }));
    $$('[data-reveal]:not(.in)').forEach(e => io.observe(e));
}
/* ---------- scroll engine ---------- */
let railLen = 0;
let roadLen = 0;
let lastY = scrollY;
let vel = 0;
let mqX = 0;
let skew = 0;
let mqHalf = 0;
let navigating = false;
let navRaf = 0;
const el = {};
function cacheEls() {
    Object.assign(el, { hero: $('.hero'), rail: $('#rail'), railTrack: $('#railTrack'), railBar: $('#railBar'), marquee: $('#marqueeTrack'), delivery: $('#delivery'), truck: $('#truck'), progress: $('#progress'), pin: $('.rail-pin'), road: $('#road'), roadDone: $('#roadDone') });
    el.stops = $$('.stop');
    el.steps = $$('.steps li');
}
function layout() {
    el.panelArts = $$('.panel-art');
    mqHalf = el.marquee.scrollWidth / 2;
    if (reduced) {
        el.rail.style.height = '';
        return;
    }
    railLen = Math.max(0, el.railTrack.scrollWidth - innerWidth + 40);
    el.rail.style.height = `${railLen + innerHeight}px`;
    roadLen = el.road.getTotalLength();
    el.roadDone.style.strokeDasharray = String(roadLen);
}
function progressOf(e) { const r = e.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); }
/** Everything that is a pure function of the scroll position. Called every frame, except while the navbar is travelling. */
function syncScene() {
    const hr = el.hero.getBoundingClientRect();
    if (hr.bottom > -50)
        updateRoom(progressOf(el.hero));
    const rp = progressOf(el.rail);
    el.railTrack.style.transform = `translate3d(${-rp * railLen}px,0,0)`;
    el.panelArts.forEach((a, i) => { a.style.transform = `translateX(${(rp * 120 - i * 18) * .4}px)`; });
    el.railBar.style.transform = `scaleX(${rp})`;
    const r = el.delivery.getBoundingClientRect();
    const dp = clamp((innerHeight - r.top) / (r.height * .9 + innerHeight * .2));
    if (roadLen) {
        const L = dp * roadLen;
        const pt = el.road.getPointAtLength(L);
        const pt2 = el.road.getPointAtLength(Math.min(roadLen, L + 2));
        const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
        el.truck.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${ang})`);
        el.roadDone.style.strokeDashoffset = String(roadLen - L);
        const marks = [.04, .36, .66, .96];
        el.stops.forEach((s, i) => s.classList.toggle('hit', dp >= marks[i]));
        el.steps.forEach((s, i) => s.classList.toggle('hit', dp >= marks[i]));
    }
}
function frame() {
    const y = scrollY;
    let dy = y - lastY;
    lastY = y;
    if (Math.abs(dy) > innerHeight)
        dy = 0; // a jump (keyboard focus, reload, anchor), not a swipe: don't whip the marquee
    vel = navigating ? vel * .85 : vel + (dy - vel) * .2;
    const max = root.scrollHeight - innerHeight;
    el.progress.style.transform = `scaleX(${max > 0 ? clamp(y / max) : 0})`;
    document.body.classList.toggle('scrolled', y > 30);
    if (!reduced) {
        if (!navigating)
            syncScene();
        mqX -= .6 + Math.abs(vel) * .35;
        if (mqHalf && -mqX > mqHalf)
            mqX += mqHalf;
        skew += (clamp(vel * .5, -14, 14) - skew) * .15;
        el.marquee.style.transform = `translate3d(${mqX}px,0,0) skewX(${-skew}deg)`;
    }
    requestAnimationFrame(frame);
}
/* ---------- navbar travel ---------- */
const headerH = () => $('.top').getBoundingClientRect().height;
/** Smooth, quick glide to a section with scroll-driven scenes frozen, landing with the target already revealed. */
function navTo(target) {
    if (!target)
        return;
    const isTop = target.id === 'top';
    const to = clamp(isTop ? 0 : Math.round(target.getBoundingClientRect().top + scrollY - headerH() + 2), 0, root.scrollHeight - innerHeight);
    cancelAnimationFrame(navRaf);
    if (reduced || Math.abs(to - scrollY) < 2) {
        scrollTo(0, to);
        settle(target);
        return;
    }
    const from = scrollY;
    const dist = Math.abs(to - from);
    const dur = clamp(380 + dist * .045, 450, 1050);
    navigating = true;
    root.classList.add('instant', 'navigating');
    const t0 = performance.now();
    const step = (now) => {
        const k = clamp((now - t0) / dur);
        scrollTo(0, from + (to - from) * easeInOut(k));
        if (k < 1 && navigating)
            navRaf = requestAnimationFrame(step);
        else
            settle(target);
    };
    navRaf = requestAnimationFrame(step);
}
function settle(target) {
    const wasNav = navigating;
    navigating = false;
    cancelAnimationFrame(navRaf);
    if (!reduced)
        syncScene();
    // Reveal what's on screen instantly; anything further down still animates when the visitor scrolls to it.
    root.classList.add('instant');
    $$('[data-reveal]:not(.in)').forEach(e => { if (e.getBoundingClientRect().top < innerHeight) {
        e.classList.add('in');
        io?.unobserve(e);
    } });
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('instant', 'navigating')));
    if (wasNav && target instanceof HTMLElement && target.id !== 'top') {
        const h = target.querySelector('h2') ?? target;
        h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
    }
}
const stopNav = () => { if (navigating)
    settle(); };
/* ---------- events ---------- */
let rz = 0;
let lastW = innerWidth;
let lastH = innerHeight;
function bind() {
    document.addEventListener('click', e => {
        const tg = e.target;
        const langBtn = tg.closest('.lang button');
        if (langBtn) {
            const l = langBtn.dataset.lang;
            if (isLang(l) && l !== lang) {
                lang = l;
                store.set('rm-lang', lang);
                applyLang();
            }
            return;
        }
        if (tg.closest('#themeBtn')) {
            setTheme(currentTheme() === 'dark' ? 'light' : 'dark', $('#themeBtn'));
            return;
        }
        const so = tg.closest('[data-studio], [data-studio-preset]');
        if (so) {
            const owner = so.closest('.menu.open');
            if (owner)
                requestClose(owner, false);
            studio.open({ preset: so.dataset.studioPreset, origin: so });
            return;
        }
        const tr = tg.closest('[data-try]');
        if (tr) {
            const id = tr.dataset.try;
            const pm = $('#pmodal');
            const inModal = pm.classList.contains('open');
            if (inModal)
                closeOverlay(pm, false);
            studio.open({ add: { id, c: sel[id] ?? 0 }, origin: tr, replace: inModal });
            return;
        }
        const ts = tg.closest('[data-try-sep]');
        if (ts) {
            studio.open({ sep: ts.dataset.trySep, origin: ts });
            return;
        }
        if (tg.closest('#menuBtn')) {
            const m = $('#menu');
            m.classList.contains('open') ? requestClose(m) : openOverlay(m);
            return;
        }
        const sw = tg.closest('[data-sw]');
        if (sw) {
            const [id, k] = sw.dataset.sw.split(':');
            setColor(id, +k);
            return;
        }
        const add = tg.closest('[data-add]');
        if (add) {
            const id = add.dataset.add;
            addToCart(id, sel[id] ?? 0, 1, add.closest('.card')?.querySelector('.card-art'));
            return;
        }
        const op = tg.closest('[data-open]');
        if (op) {
            openProduct = op.dataset.open;
            modalQty = 1;
            renderProductModal(openProduct);
            openOverlay($('#pmodal'));
            return;
        }
        const q = tg.closest('[data-q]');
        if (q && openProduct) {
            modalQty = clamp(modalQty + +q.dataset.q, 1, MAX_QTY);
            renderProductModal(openProduct);
            $(`[data-q="${q.dataset.q}"]`)?.focus();
            return;
        }
        const am = tg.closest('[data-add-modal]');
        if (am) {
            const id = am.dataset.addModal;
            addToCart(id, sel[id] ?? 0, modalQty, $('.pm-art'));
            requestClose($('#pmodal'));
            return;
        }
        const sepB = tg.closest('[data-add-sep]');
        if (sepB) {
            addToCart(sepB.dataset.addSep, -1, 1, sepB.closest('.bundle')?.querySelector('.bundle-art'));
            return;
        }
        const chip = tg.closest('#chips .chip');
        if (chip) {
            view.cat = chip.dataset.cat;
            $$('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
            renderGrid();
            return;
        }
        const rc = tg.closest('.panel [data-cat]');
        if (rc) {
            view.cat = rc.dataset.cat;
            renderChips();
            renderGrid();
            navTo($('#catalog'));
            return;
        }
        if (tg.closest('#addRoom')) {
            if (performance.now() - lastAddAt < 900)
                return;
            lastAddAt = performance.now();
            ROOM_SET.forEach((id, i) => setTimeout(() => { const p = PRODUCT(id); addToCart(id, 0, 1, $(`.pc[data-k="${id}"]`), draw(p.art, colorsOf(p, 0))); }, i * 160));
            return;
        }
        if (tg.closest('#cartBtn')) {
            openOverlay($('#cart'));
            return;
        }
        const lq = tg.closest('[data-lq]');
        if (lq) {
            const li = lq.closest('.line');
            if (li.classList.contains('leaving'))
                return;
            const line = cart[+li.dataset.i];
            if (!line)
                return;
            const d = +lq.dataset.lq;
            if (d < 0 && line.qty <= 1) {
                removeLine(li);
                return;
            }
            if (d > 0 && line.qty >= MAX_QTY) {
                toast(t('toast.max'));
                return;
            }
            line.qty += d;
            save();
            renderCart();
            $(`.line[data-i="${li.dataset.i}"] [data-lq="${d}"]`)?.focus();
            return;
        }
        const rm = tg.closest('[data-rm]');
        if (rm) {
            removeLine(rm.closest('.line'));
            return;
        }
        if (tg.closest('#toCheckout')) {
            if (!cart.length)
                return;
            closeOverlay($('#cart'), false);
            order.step = 1;
            $('#coFoot').hidden = false;
            renderCheckout();
            openOverlay($('#checkout'), true);
            return;
        }
        if (tg.closest('#coBack')) {
            if (submitting)
                return;
            captureFields();
            order.step = Math.max(1, order.step - 1);
            renderCheckout();
            return;
        }
        if (tg.closest('#coNext')) {
            if (submitting)
                return;
            const err = readStep();
            if (err) {
                $('#coErr').textContent = err;
                return;
            }
            if (order.step === 3) {
                placeOrder();
                return;
            }
            order.step++;
            renderCheckout();
            $('#coBody').scrollTop = 0;
            $('#coBody input, #coBody select')?.focus({ preventScroll: true });
            return;
        }
        const cl = tg.closest('.close, .backdrop');
        if (cl) {
            requestClose(cl.closest('.modal, .drawer'));
            return;
        }
        const nav = tg.closest('a[href^="#"]');
        if (nav) {
            const href = nav.getAttribute('href');
            if (href.length < 2)
                return;
            e.preventDefault();
            const owner = nav.closest('.drawer.open, .menu.open');
            if (owner)
                requestClose(owner, false);
            navTo(document.getElementById(href.slice(1)));
        }
    });
    document.addEventListener('change', e => {
        const tg = e.target;
        if (tg.name === 'zone') {
            captureFields();
            order.zone = tg.value;
            renderCheckout();
            $(`input[name="zone"][value="${tg.value}"]`)?.focus();
        }
        if (tg.name === 'pay')
            order.payment = tg.value;
        if (tg.id === 'fAsm') {
            order.assembly = tg.checked;
            $('#coTotal').textContent = money(total());
        }
    });
    document.addEventListener('input', e => {
        const tg = e.target;
        if (tg.id === 'fPhone')
            onPhoneInput(tg);
        if (tg.id === 'search') {
            view.q = tg.value;
            renderGrid();
        }
    });
    $('#sort').addEventListener('change', e => { view.sort = e.target.value; renderGrid(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const o = openOverlays().pop();
            if (o) {
                requestClose(o);
                return;
            }
        }
        if (e.key === 'Enter' && e.target.closest?.('#coBody') && e.target.tagName === 'INPUT' && e.target.type !== 'radio' && e.target.type !== 'checkbox') {
            e.preventDefault();
            $('#coNext').click();
        }
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key))
            stopNav();
    });
    addEventListener('wheel', stopNav, { passive: true });
    addEventListener('touchstart', stopNav, { passive: true });
    // Mobile URL bars resize the window constantly while scrolling; only re-measure for real size changes.
    addEventListener('resize', () => { clearTimeout(rz); rz = window.setTimeout(() => { if (innerWidth !== lastW || Math.abs(innerHeight - lastH) > 140) {
        lastW = innerWidth;
        lastH = innerHeight;
        layout();
        if (!reduced)
            syncScene();
    } if (innerWidth > 980 && $('#menu').classList.contains('open'))
        requestClose($('#menu'), false); }, 150); });
    // Keyboard users tabbing into the sideways rail: bring that panel into view instead of letting the browser shove the track.
    el.pin.addEventListener('scroll', () => { if (el.pin.scrollLeft)
        el.pin.scrollLeft = 0; });
    el.railTrack.addEventListener('focusin', e => {
        if (reduced)
            return;
        const panel = e.target.closest('.panel');
        if (!panel)
            return;
        el.pin.scrollLeft = 0;
        const rp = clamp((panel.offsetLeft - innerWidth * .2) / Math.max(1, railLen));
        const top = el.rail.getBoundingClientRect().top + scrollY;
        scrollTo(0, Math.round(top + rp * (el.rail.offsetHeight - innerHeight)));
        syncScene();
    });
    // Another tab changed the cart, language or theme.
    addEventListener('storage', e => {
        if (e.key === 'rm-cart') {
            cart = sanitizeCart(parse(e.newValue));
            renderCart();
            const co = $('#checkout');
            if (co.classList.contains('open') && order.step < 4) {
                if (!cart.length) {
                    requestClose(co);
                    toast(t('toast.cartChanged'));
                }
                else {
                    captureFields();
                    renderCheckout();
                }
            }
            if (openProduct)
                renderProductModal(openProduct);
        }
        if (e.key === 'rm-lang') {
            const l = parse(e.newValue);
            if (isLang(l) && l !== lang) {
                lang = l;
                applyLang();
            }
        }
        if (e.key === 'rm-theme') {
            const th = parse(e.newValue);
            if (th === 'light' || th === 'dark')
                paintTheme(th);
        }
    });
    sysDark.addEventListener?.('change', ev => { const s = store.raw('rm-theme'); if (s !== 'light' && s !== 'dark')
        paintTheme(ev.matches ? 'dark' : 'light'); });
}
/* ---------- boot ---------- */
let studio;
function boot() {
    try {
        history.scrollRestoration = 'manual';
        if (history.state?.ov)
            history.replaceState(null, '');
    }
    catch { /* ignore */ }
    paintTheme(currentTheme());
    cacheEls();
    buildRoom();
    studio = initStudio({
        t, lang: () => lang, money, esc, reduced, colorsOf, theme: currentTheme,
        openOverlay, requestClose: el => requestClose(el), addMany,
        openCart: () => openOverlay($('#cart')), toast,
        load: k => store.raw(k), save: (k, v) => store.set(k, v),
    });
    bind();
    applyLang();
    observeReveals();
    const openShared = () => { const m = location.hash.match(/^#studio=([\w.~-]{1,2000})$/); if (!m)
        return; try {
        history.replaceState(history.state, '', location.pathname + location.search);
    }
    catch { /* ignore */ } studio.open({ shared: m[1] }); };
    openShared();
    addEventListener('hashchange', openShared);
    if (reduced) {
        root.classList.add('reduced');
        updateRoomStatic();
    }
    requestAnimationFrame(frame);
    document.fonts?.ready.then(() => layout()).catch(() => { });
    const loader = $('#loader');
    const start = performance.now();
    let fired = false;
    let seen = false;
    try {
        seen = !!sessionStorage.getItem('rm-seen');
        sessionStorage.setItem('rm-seen', '1');
    }
    catch { /* ignore */ }
    const minShow = reduced ? 0 : seen ? 350 : 1300;
    const done = () => { if (fired)
        return; fired = true; const wait = Math.max(0, minShow - (performance.now() - start)); setTimeout(() => { loader?.classList.add('gone'); document.body.classList.add('ready'); setTimeout(() => loader?.remove(), 900); }, wait); };
    if (document.readyState === 'complete')
        done();
    else
        addEventListener('load', done, { once: true });
    setTimeout(done, 2500);
}
boot();
