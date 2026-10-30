import { draw, drawInner, decor } from './art.js';
import { CATS, PRODUCTS, PRODUCT, SEP, bundleFull, ROOM_SET, ZONES, ASSEMBLY_FEE, STORE } from './data.js';
import { DICT } from './i18n.js';
/* ---------- helpers ---------- */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const store = {
    get(k, d) { try {
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : d;
    }
    catch {
        return d;
    } },
    set(k, v) { try {
        localStorage.setItem(k, JSON.stringify(v));
    }
    catch { /* storage unavailable */ } },
};
let lang = store.get('rm-lang', ['uz', 'ru', 'en'].includes(navigator.language.slice(0, 2)) ? navigator.language.slice(0, 2) : 'uz');
const t = (k) => DICT[lang][k] ?? DICT.uz[k] ?? k;
const money = (n) => `${n.toLocaleString('ru-RU').replace(/ /g, ' ')} ${t('cur')}`;
const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const colorsOf = (p, i) => ({ m: p.swatches[i].m, d: p.swatches[i].d, w: p.wood });
let cart = store.get('rm-cart', []).filter(l => l.key.startsWith('sep-') ? SEP.some(b => b.id === l.key) : PRODUCTS.some(p => p.id === l.key));
const sel = {};
const view = { cat: 'all', q: '', sort: 'pop' };
const linePrice = (l) => (l.key.startsWith('sep-') ? SEP.find(b => b.id === l.key).price : PRODUCT(l.key).price);
const lineName = (l) => {
    if (l.key.startsWith('sep-'))
        return SEP.find(b => b.id === l.key).name[lang];
    const p = PRODUCT(l.key);
    return p.name[lang];
};
const subtotal = () => cart.reduce((a, l) => a + linePrice(l) * l.qty, 0);
const count = () => cart.reduce((a, l) => a + l.qty, 0);
/* ---------- i18n ---------- */
function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="w"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ');
}
function applyLang() {
    document.documentElement.lang = lang;
    document.title = t('meta.title');
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    $$('[data-split]').forEach(el => splitWords(el));
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    renderRoomTags();
    renderMarquee();
    renderRail();
    renderChips();
    renderGrid(true);
    renderSep();
    renderZones();
    renderCart();
    renderVisit();
    if ($('#checkout').classList.contains('open'))
        renderCheckout();
    if (openProduct)
        renderProductModal(openProduct);
    layout();
}
const cOf = (id) => colorsOf(PRODUCT(id), 0);
const PIECES = [
    { k: 'rug', svg: decor.rug(), x: 640, y: 682, s: 1, from: [0, 60, 0], range: [.03, .16] },
    { k: 'javon', svg: drawInner('shelf', cOf('javon')), x: 830, y: 303, s: 1.15, from: [380, -40, 14], range: [.1, .26], pid: 'javon', tag: [1060, 330] },
    { k: 'samarqand', svg: drawInner('sofa', { ...cOf('samarqand') }), x: 310, y: 266, s: 1.45, from: [-700, 40, -10], range: [.18, .4], pid: 'samarqand', tag: [470, 445] },
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
        floor += `<line x1="${-200 + i * 140}" y1="560" x2="${-520 + i * 200}" y2="760" stroke="#C9BCA3" stroke-width="2"/>`;
    svg.innerHTML = `
    <defs><clipPath id="arch"><path d="M90 470 V230 Q90 120 180 110 Q270 120 270 230 V470z"/></clipPath>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9DBBD6"/><stop offset="1" stop-color="#E8EEF0"/></linearGradient></defs>
    <rect width="1200" height="560" fill="#E3E6E0"/>
    <g class="room-window"><g clip-path="url(#arch)"><rect x="80" y="100" width="200" height="380" fill="url(#sky)"/><circle class="sun" cx="220" cy="200" r="26" fill="#F2D27A"/>
    <path d="M80 420 q60 -60 110 -20 q50 -50 90 -10 v90 h-200z" fill="#9FB0A0"/></g>
    <path d="M90 470 V230 Q90 120 180 110 Q270 120 270 230 V470z" fill="none" stroke="#F8F9F6" stroke-width="12"/><line x1="180" y1="112" x2="180" y2="470" stroke="#F8F9F6" stroke-width="6"/><rect x="74" y="466" width="212" height="14" fill="#F8F9F6"/></g>
    <rect y="548" width="1200" height="14" fill="#F8F9F6"/>
    <rect y="560" width="1200" height="200" fill="#D8CDB8"/>${floor}
    <path class="room-line" d="M0 560 H1200" stroke="#19224A" stroke-width="3" fill="none"/>
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
        return `<g class="tag" data-k="${p.k}" transform="translate(${p.tag[0]} ${p.tag[1]})"><g class="tag-in"><rect x="${-w / 2}" y="-20" width="${w}" height="40" rx="20" fill="#19224A"/><circle cx="${-w / 2 + 18}" cy="0" r="5" fill="#B8293F"/><text x="${8}" y="6" text-anchor="middle" fill="#F8F9F6" font-size="18" font-family="Onest, sans-serif" font-weight="600">${label}</text></g></g>`;
    }).join('');
    const total = ROOM_SET.reduce((a, id) => a + PRODUCT(id).price, 0);
    $('#roomTotal').textContent = money(total);
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
    document.querySelector('.room-line').style.strokeDashoffset = String(1200 * (1 - clamp(p / .05)));
    $('.hero').style.setProperty('--p', p.toFixed(3));
}
/* ---------- marquee ---------- */
const ORN = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l5 10-5 10-5-10z" fill="currentColor"/><path d="M12 7l2.5 5-2.5 5-2.5-5z" fill="#EDEFEA"/></svg>`;
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
function cardHTML(p) {
    const i = sel[p.id] ?? 0;
    const cat = CATS.find(c => c.id === p.cat);
    return `<button class="card-art" data-open="${p.id}" aria-label="${esc(p.name[lang])}: ${t('card.details')}"><span class="card-tilt">${draw(p.art, colorsOf(p, i), p.name[lang])}</span></button>
    ${p.badge ? `<span class="badge badge-${p.badge}">${t('badge.' + p.badge)}</span>` : ''}
    <div class="card-body"><p class="card-cat">${cat.name[lang]}</p><h3>${esc(p.name[lang])}</h3>
    <p class="card-dims">${p.dims} ${t('cm')}</p>
    <div class="swatches" role="radiogroup" aria-label="${t('card.color')}">${p.swatches.map((s, k) => `<button class="sw" role="radio" aria-checked="${k === i}" aria-label="${s.name[lang]}" title="${s.name[lang]}" data-sw="${p.id}:${k}" style="--c:${s.m}"></button>`).join('')}</div>
    <div class="card-foot"><p class="price">${p.old ? `<s>${money(p.old)}</s>` : ''}<b>${money(p.price)}</b></p>
    <button class="add" data-add="${p.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>${t('card.add')}</button></div></div>`;
}
function visibleProducts() {
    const q = view.q.trim().toLowerCase();
    let list = PRODUCTS.filter(p => (view.cat === 'all' || p.cat === view.cat) && (!q || Object.values(p.name).some(n => n.toLowerCase().includes(q)) || CATS.find(c => c.id === p.cat).name[lang].toLowerCase().includes(q)));
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
    const before = new Map(cards.filter(c => !c.hidden).map(c => [c, c.getBoundingClientRect()]));
    const list = visibleProducts();
    const ids = new Set(list.map(p => p.id));
    cards.forEach(c => { c.hidden = !ids.has(c.dataset.id); });
    list.forEach(p => grid.appendChild(cards.find(c => c.dataset.id === p.id)));
    $('#empty').hidden = list.length > 0;
    $('#count').textContent = `${list.length} ${t('rail.items')}`;
    if (reduced || rebuild)
        return;
    list.forEach((p, idx) => {
        const c = cards.find(c => c.dataset.id === p.id);
        const a = before.get(c);
        const b = c.getBoundingClientRect();
        if (a) {
            const dx = a.left - b.left, dy = a.top - b.top;
            if (dx || dy)
                c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)' });
        }
        else {
            c.animate([{ opacity: 0, transform: 'translateY(30px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: Math.min(idx, 8) * 45, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
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
    sel[id] = k;
    const p = PRODUCT(id);
    const card = $(`.card[data-id="${id}"]`);
    if (card) {
        const svgWrap = $('.card-tilt', card);
        const old = svgWrap.firstElementChild;
        svgWrap.insertAdjacentHTML('beforeend', draw(p.art, colorsOf(p, k), p.name[lang]));
        const nu = svgWrap.lastElementChild;
        nu.classList.add('swap-in');
        old.classList.add('swap-out');
        setTimeout(() => old.remove(), 420);
        $$('.sw', card).forEach((b, i) => b.setAttribute('aria-checked', String(i === k)));
    }
    if (openProduct === id)
        renderProductModal(id);
}
/* ---------- product modal ---------- */
let openProduct = null;
let modalQty = 1;
let lastFocus = null;
function renderProductModal(id) {
    const p = PRODUCT(id);
    const i = sel[id] ?? 0;
    const cat = CATS.find(c => c.id === p.cat);
    $('#pmBody').innerHTML = `<div class="pm-art">${draw(p.art, colorsOf(p, i), p.name[lang])}</div>
    <div class="pm-info"><p class="card-cat">${cat.name[lang]}</p><h2 id="pmTitle">${esc(p.name[lang])}</h2>
    <p class="price big">${p.old ? `<s>${money(p.old)}</s>` : ''}<b>${money(p.price)}</b></p>
    <p class="pm-desc">${t('desc.' + p.cat)}</p>
    <dl class="pm-spec"><div><dt>${t('pm.size')}</dt><dd>${p.dims} ${t('cm')}</dd></div><div><dt>${t('pm.color')}</dt><dd>${p.swatches[i].name[lang]}</dd></div><div><dt>${t('pm.warranty')}</dt><dd>${t('pm.warrantyV')}</dd></div></dl>
    <div class="swatches lg" role="radiogroup" aria-label="${t('card.color')}">${p.swatches.map((s, k) => `<button class="sw" role="radio" aria-checked="${k === i}" aria-label="${s.name[lang]}" title="${s.name[lang]}" data-sw="${p.id}:${k}" style="--c:${s.m}"></button>`).join('')}</div>
    <div class="pm-buy"><div class="qty"><button data-q="-1" aria-label="${t('qty.less')}">−</button><output>${modalQty}</output><button data-q="1" aria-label="${t('qty.more')}">+</button></div>
    <button class="btn btn-pom" data-add-modal="${p.id}">${t('card.add')} · ${money(p.price * modalQty)}</button></div></div>`;
}
function openModal(el) { lastFocus = document.activeElement; el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); document.body.classList.add('locked'); setTimeout(() => $('.close', el)?.focus(), 50); }
function closeModal(el) { el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); if (!$$('.modal.open, .drawer.open').length)
    document.body.classList.remove('locked'); lastFocus?.focus(); if (el.id === 'pmodal')
    openProduct = null; }
/* ---------- cart ---------- */
function save() { store.set('rm-cart', cart); }
function addToCart(key, color = 0, qty = 1, from) {
    const ex = cart.find(l => l.key === key && l.color === color);
    if (ex)
        ex.qty += qty;
    else
        cart.push({ key, color, qty });
    save();
    renderCart();
    if (from)
        flyToCart(from);
    toast(`${t('toast.added')}: ${lineName({ key, color, qty })}`);
}
function lineArt(l) {
    if (l.key.startsWith('sep-')) {
        const b = SEP.find(x => x.id === l.key);
        const p = PRODUCT(b.show[0]);
        return draw(p.art, colorsOf(p, 0));
    }
    const p = PRODUCT(l.key);
    return draw(p.art, colorsOf(p, l.color));
}
function renderCart() {
    const n = count();
    const badge = $('#cartCount');
    badge.textContent = String(n);
    badge.hidden = n === 0;
    const list = $('#cartList');
    if (!cart.length) {
        list.innerHTML = `<div class="cart-empty"><p>${t('cart.empty')}</p><a href="#catalog" class="btn btn-line" data-close-cart>${t('cart.browse')}</a></div>`;
    }
    else {
        list.innerHTML = cart.map((l, i) => {
            const sub = l.key.startsWith('sep-') ? `${SEP.find(b => b.id === l.key).items.length} ${t('sep.pieces')}` : PRODUCT(l.key).swatches[l.color].name[lang];
            return `<li class="line"><div class="line-art">${lineArt(l)}</div><div class="line-info"><p class="line-name">${esc(lineName(l))}</p><p class="line-sub">${sub}</p>
      <div class="qty sm"><button data-lq="${i}:-1" aria-label="${t('qty.less')}">−</button><output>${l.qty}</output><button data-lq="${i}:1" aria-label="${t('qty.more')}">+</button></div></div>
      <div class="line-end"><b>${money(linePrice(l) * l.qty)}</b><button class="link" data-rm="${i}">${t('cart.remove')}</button></div></li>`;
        }).join('');
    }
    $('#cartSubtotal').textContent = money(subtotal());
    $('#toCheckout').disabled = !cart.length;
}
function flyToCart(from) {
    const btn = $('#cartBtn');
    const bump = () => btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    const svg = from.querySelector('svg') ?? from;
    if (reduced) {
        bump();
        return;
    }
    const a = svg.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    const ghost = svg.cloneNode(true);
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
        return `<article class="bundle" data-reveal style="--d:${i}"><div class="bundle-art">${b.show.map((id, k) => { const p = PRODUCT(id); return `<div class="ba ba-${k}">${draw(p.art, colorsOf(p, 0))}</div>`; }).join('')}</div>
      <h3>${b.name[lang]}</h3><p class="bundle-note">${b.note[lang]}</p>
      <ul>${b.items.map(id => `<li>${esc(PRODUCT(id).name[lang])}</li>`).join('')}</ul>
      <p class="price big"><s>${money(full)}</s><b>${money(b.price)}</b></p>
      <p class="bundle-save">${t('sep.save')} ${money(full - b.price)}</p>
      <button class="btn btn-pom" data-add-sep="${b.id}">${t('sep.add')}</button></article>`;
    }).join('');
    observeReveals();
}
/* ---------- delivery ---------- */
function renderZones() {
    $('#zoneList').innerHTML = ZONES.map(z => `<li><span>${z.name[lang]}</span><span class="z-days">${z.days[lang]}</span><b>${z.fee ? money(z.fee) : t('free')}${z.freeFrom ? `<small>${t('zone.freeFrom')} ${money(z.freeFrom)}</small>` : ''}</b></li>`).join('');
}
function renderVisit() {
    $('#phone').textContent = STORE.phone;
}
/* ---------- checkout ---------- */
const order = { step: 1, name: '', phone: '', zone: 'city', address: '', date: '', assembly: false, payment: 'cash', comment: '' };
function deliveryFee() { const z = ZONES.find(z => z.id === order.zone); return z.freeFrom && subtotal() >= z.freeFrom ? 0 : z.fee; }
function total() { return subtotal() + deliveryFee() + (order.assembly ? ASSEMBLY_FEE : 0); }
function dates() {
    const out = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    for (let i = 0; i < 10; i++) {
        const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0');
        const v = `${dd}/${mm}/${d.getFullYear()}`;
        out.push({ v, l: `${v}, ${t('wd.' + d.getDay())}` });
        d.setDate(d.getDate() + 1);
    }
    return out;
}
function fmtPhone(raw) {
    let d = raw.replace(/\D/g, '');
    if (d.length > 9 && d.startsWith('998'))
        d = d.slice(3);
    d = d.slice(0, 9);
    return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
}
function renderCheckout() {
    const s = order.step;
    const body = $('#coBody');
    $$('#coSteps li').forEach((li, i) => { li.classList.toggle('on', i + 1 === s); li.classList.toggle('done', i + 1 < s); });
    if (!order.date)
        order.date = dates()[0].v;
    if (s === 1)
        body.innerHTML = `
    <label class="field"><span>${t('co.name')}</span><input id="fName" autocomplete="name" value="${esc(order.name)}" required></label>
    <label class="field"><span>${t('co.phone')}</span><span class="tel"><span class="tel-pre">+998</span><input id="fPhone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="90 123 45 67" value="${esc(order.phone)}" required></span></label>
    <p class="hint">${t('co.phoneHint')}</p>`;
    if (s === 2)
        body.innerHTML = `
    <fieldset class="radios"><legend>${t('co.where')}</legend>${ZONES.map(z => { const fee = z.freeFrom && subtotal() >= z.freeFrom ? 0 : z.fee; return `<label class="radio"><input type="radio" name="zone" value="${z.id}" ${order.zone === z.id ? 'checked' : ''}><span class="r-main">${z.name[lang]}<small>${z.days[lang]}</small></span><b>${fee ? money(fee) : t('free')}</b></label>`; }).join('')}</fieldset>
    ${order.zone !== 'pickup' ? `<label class="field"><span>${t('co.address')}</span><textarea id="fAddress" rows="2" placeholder="${t('co.addressPh')}">${esc(order.address)}</textarea></label>` : `<p class="hint">${t('co.pickupHint')}</p>`}
    <label class="field"><span>${order.zone === 'pickup' ? t('co.datePickup') : t('co.date')}</span><select id="fDate">${dates().map(d => `<option ${d.v === order.date ? 'selected' : ''} value="${d.v}">${d.l}</option>`).join('')}</select></label>
    <label class="check"><input type="checkbox" id="fAsm" ${order.assembly ? 'checked' : ''}><span>${t('co.assembly')} <b>${money(ASSEMBLY_FEE)}</b></span></label>`;
    if (s === 3)
        body.innerHTML = `
    <fieldset class="radios"><legend>${t('co.pay')}</legend>${['cash', 'card', 'transfer', 'install'].map(m => `<label class="radio"><input type="radio" name="pay" value="${m}" ${order.payment === m ? 'checked' : ''}><span class="r-main">${t('pay.' + m)}<small>${t('pay.' + m + 'Hint')}</small></span></label>`).join('')}</fieldset>
    <label class="field"><span>${t('co.comment')}</span><textarea id="fComment" rows="2">${esc(order.comment)}</textarea></label>
    <div class="summary"><ul>${cart.map(l => `<li><span>${esc(lineName(l))} × ${l.qty}</span><span>${money(linePrice(l) * l.qty)}</span></li>`).join('')}</ul>
    <p><span>${t('co.delivery')}</span><span>${deliveryFee() ? money(deliveryFee()) : t('free')}</span></p>
    ${order.assembly ? `<p><span>${t('co.asmShort')}</span><span>${money(ASSEMBLY_FEE)}</span></p>` : ''}
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
    if (order.step === 1) {
        order.name = $('#fName').value.trim();
        order.phone = $('#fPhone').value;
        if (order.name.length < 2)
            return t('err.name');
        if (order.phone.replace(/\D/g, '').length !== 9)
            return t('err.phone');
    }
    if (order.step === 2) {
        const a = $('#fAddress');
        if (a)
            order.address = a.value.trim();
        order.date = $('#fDate').value;
        order.assembly = $('#fAsm').checked;
        if (order.zone !== 'pickup' && order.address.length < 5)
            return t('err.address');
    }
    if (order.step === 3)
        order.comment = $('#fComment').value.trim();
    return null;
}
async function placeOrder() {
    const id = 'RM-' + Date.now().toString(36).toUpperCase().slice(-6);
    const items = cart.map(l => `${lineName(l)}${l.key.startsWith('sep-') ? '' : ' (' + PRODUCT(l.key).swatches[l.color].name.uz + ')'} × ${l.qty} = ${linePrice(l) * l.qty}`).join('\n');
    const data = {
        'form-name': 'order', order_id: id, name: order.name, phone: '+998 ' + order.phone, zone: ZONES.find(z => z.id === order.zone).name.uz,
        address: order.address, date: order.date, assembly: order.assembly ? 'ha' : 'yoʻq', payment: DICT.uz['pay.' + order.payment],
        comment: order.comment, items, subtotal: String(subtotal()), delivery: String(deliveryFee()), total: String(total()), lang, 'bot-field': '',
    };
    const btn = $('#coNext');
    btn.disabled = true;
    btn.textContent = t('co.sending');
    try {
        const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
        if (!res.ok)
            throw new Error(String(res.status));
        const tot = total();
        cart = [];
        save();
        renderCart();
        order.step = 4;
        $$('#coSteps li').forEach(li => { li.classList.remove('on'); li.classList.add('done'); });
        $('#coBody').innerHTML = `<div class="done"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="36" fill="none" stroke="#9FB0A0" stroke-width="4"/><path class="tick" d="M24 41l11 11 21-24" fill="none" stroke="#19224A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <h3>${t('done.title')}</h3><p>${t('done.num')} <b>${id}</b></p><p>${t('done.text')}</p><p class="done-total">${money(tot)}</p></div>`;
        $('#coFoot').hidden = true;
    }
    catch {
        $('#coErr').textContent = t('err.send');
        btn.textContent = t('co.place');
    }
    finally {
        btn.disabled = false;
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
const road = () => $('#road');
function layout() {
    const rail = $('#rail'), track = $('#railTrack');
    if (reduced) {
        rail.style.height = '';
        return;
    }
    railLen = Math.max(0, track.scrollWidth - innerWidth + 40);
    rail.style.height = `${railLen + innerHeight}px`;
    roadLen = road().getTotalLength();
    const done = $('#roadDone');
    done.style.strokeDasharray = String(roadLen);
}
function progressOf(el) { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); }
function frame() {
    const y = scrollY;
    const dy = y - lastY;
    lastY = y;
    vel += (dy - vel) * .2;
    $('#progress').style.transform = `scaleX(${clamp(y / (document.documentElement.scrollHeight - innerHeight))})`;
    document.body.classList.toggle('scrolled', y > 30);
    if (!reduced) {
        updateRoom(progressOf($('.hero')));
        const rp = progressOf($('#rail'));
        $('#railTrack').style.transform = `translate3d(${-rp * railLen}px,0,0)`;
        $$('.panel-art').forEach((a, i) => { a.style.transform = `translateX(${(rp * 120 - i * 18) * .4}px)`; });
        $('#railBar').style.transform = `scaleX(${rp})`;
        const track = $('#marqueeTrack');
        const half = track.scrollWidth / 2;
        mqX -= .6 + Math.abs(vel) * .35;
        if (half && -mqX > half)
            mqX += half;
        skew += (clamp(vel * .5, -14, 14) - skew) * .15;
        track.style.transform = `translate3d(${mqX}px,0,0) skewX(${-skew}deg)`;
        const del = $('#delivery');
        const r = del.getBoundingClientRect();
        const dp = clamp((innerHeight - r.top) / (r.height * .9 + innerHeight * .2));
        const truck = $('#truck');
        const rd = road();
        if (roadLen) {
            const L = dp * roadLen;
            const pt = rd.getPointAtLength(L);
            const pt2 = rd.getPointAtLength(Math.min(roadLen, L + 2));
            const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
            truck.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${ang})`);
            $('#roadDone').style.strokeDashoffset = String(roadLen - L);
            $$('.stop').forEach((s, i) => s.classList.toggle('hit', dp >= [.04, .36, .66, .96][i]));
            $$('.steps li').forEach((s, i) => s.classList.toggle('hit', dp >= [.04, .36, .66, .96][i]));
        }
    }
    requestAnimationFrame(frame);
}
/* ---------- events ---------- */
function bind() {
    document.addEventListener('click', e => {
        const tg = e.target;
        const langBtn = tg.closest('.lang button');
        if (langBtn) {
            lang = langBtn.dataset.lang;
            store.set('rm-lang', lang);
            applyLang();
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
            addToCart(id, sel[id] ?? 0, 1, add.closest('.card').querySelector('.card-art'));
            return;
        }
        const op = tg.closest('[data-open]');
        if (op) {
            openProduct = op.dataset.open;
            modalQty = 1;
            renderProductModal(openProduct);
            openModal($('#pmodal'));
            return;
        }
        const q = tg.closest('[data-q]');
        if (q && openProduct) {
            modalQty = clamp(modalQty + +q.dataset.q, 1, 20);
            renderProductModal(openProduct);
            return;
        }
        const am = tg.closest('[data-add-modal]');
        if (am) {
            const id = am.dataset.addModal;
            addToCart(id, sel[id] ?? 0, modalQty, $('.pm-art'));
            closeModal($('#pmodal'));
            return;
        }
        const sepB = tg.closest('[data-add-sep]');
        if (sepB) {
            addToCart(sepB.dataset.addSep, -1, 1, sepB.closest('.bundle').querySelector('.bundle-art'));
            return;
        }
        const chip = tg.closest('.chip');
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
            $('#catalog').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
            return;
        }
        if (tg.closest('#addRoom')) {
            ROOM_SET.forEach((id, i) => setTimeout(() => addToCart(id, 0, 1, $(`.pc[data-k="${id}"]`)), i * 160));
            return;
        }
        if (tg.closest('#cartBtn')) {
            openModal($('#cart'));
            return;
        }
        if (tg.closest('[data-close-cart]')) {
            closeModal($('#cart'));
            return;
        }
        const lq = tg.closest('[data-lq]');
        if (lq) {
            const [i, d] = lq.dataset.lq.split(':').map(Number);
            cart[i].qty += d;
            if (cart[i].qty < 1)
                cart.splice(i, 1);
            save();
            renderCart();
            return;
        }
        const rm = tg.closest('[data-rm]');
        if (rm) {
            cart.splice(+rm.dataset.rm, 1);
            save();
            renderCart();
            return;
        }
        if (tg.closest('#toCheckout')) {
            closeModal($('#cart'));
            order.step = 1;
            $('#coFoot').hidden = false;
            renderCheckout();
            openModal($('#checkout'));
            return;
        }
        if (tg.closest('#coBack')) {
            readStep();
            order.step = Math.max(1, order.step - 1);
            renderCheckout();
            return;
        }
        if (tg.closest('#coNext')) {
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
            return;
        }
        const cl = tg.closest('.close, .backdrop');
        if (cl) {
            closeModal(cl.closest('.modal, .drawer'));
            return;
        }
        const nav = tg.closest('a[href^="#"]');
        if (nav && nav.getAttribute('href').length > 1) {
            e.preventDefault();
            $(nav.getAttribute('href')).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        }
    });
    document.addEventListener('change', e => {
        const tg = e.target;
        if (tg.name === 'zone') {
            readStepSilently();
            order.zone = tg.value;
            renderCheckout();
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
        if (tg.id === 'fPhone') {
            tg.value = fmtPhone(tg.value);
        }
        if (tg.id === 'search') {
            view.q = tg.value;
            renderGrid();
        }
    });
    $('#sort').addEventListener('change', e => { view.sort = e.target.value; renderGrid(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') {
        const o = $$('.modal.open, .drawer.open').pop();
        if (o)
            closeModal(o);
    } });
    addEventListener('resize', () => layout());
}
function readStepSilently() { const a = $('#fAddress'); if (a)
    order.address = a.value.trim(); const d = $('#fDate'); if (d)
    order.date = d.value; }
/* ---------- boot ---------- */
function boot() {
    buildRoom();
    bind();
    applyLang();
    observeReveals();
    if (reduced) {
        document.body.classList.add('reduced');
        updateRoomStatic();
    }
    requestAnimationFrame(frame);
    const loader = $('#loader');
    const start = performance.now();
    let fired = false;
    const done = () => { if (fired)
        return; fired = true; const wait = Math.max(0, (reduced ? 0 : 1300) - (performance.now() - start)); setTimeout(() => { loader.classList.add('gone'); document.body.classList.add('ready'); setTimeout(() => loader.remove(), 900); }, wait); };
    if (document.readyState === 'complete')
        done();
    else
        addEventListener('load', done, { once: true });
    setTimeout(done, 3000);
}
function updateRoomStatic() { $$('.pc').forEach(p => { p.style.opacity = '1'; }); $$('#roomTags .tag').forEach(tg => { tg.style.opacity = '1'; }); $('#roomStage').textContent = t('room.done'); $('#roomRunning').textContent = $('#roomTotal').textContent; }
boot();
