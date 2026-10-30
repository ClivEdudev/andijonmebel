export function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
    return '#' + ch.map(c => f(c).toString(16).padStart(2, '0')).join('');
}
const shadow = (cx = 200, rx = 150) => `<ellipse cx="${cx}" cy="262" rx="${rx}" ry="9" fill="#19224A" opacity=".10"/>`;
const r = (x, y, w, h, fill, rx = 0, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
export function sofa(c, wide = false) {
    const L = wide ? 22 : 44, R = wide ? 378 : 356, W = R - L, n = wide ? 3 : 2;
    const bw = (W - 48 - (n - 1) * 8) / n;
    let s = shadow(200, W / 2 + 10);
    s += r(L + 18, 224, 10, 32, c.w, 3) + r(R - 28, 224, 10, 32, c.w, 3);
    s += r(L + 14, 96, W - 28, 100, c.d, 22);
    for (let i = 0; i < n; i++)
        s += r(L + 24 + i * (bw + 8), 106, bw, 70, c.m, 16);
    s += r(L, 168, W, 62, c.d, 16);
    for (let i = 0; i < n; i++)
        s += r(L + 24 + i * (bw + 8), 158, bw, 34, shade(c.m, .14), 12);
    s += r(L - 6, 134, 42, 102, shade(c.d, -.1), 20) + r(R - 36, 134, 42, 102, shade(c.d, -.1), 20);
    s += r(L - 6, 134, 42, 16, shade(c.m, .05), 8) + r(R - 36, 134, 42, 16, shade(c.m, .05), 8);
    return s;
}
export function armchair(c) {
    let s = shadow(200, 110);
    s += r(118, 224, 10, 32, c.w, 3) + r(272, 224, 10, 32, c.w, 3);
    s += r(112, 78, 176, 118, c.d, 30) + r(126, 90, 148, 86, c.m, 24);
    s += r(100, 168, 200, 62, c.d, 16) + r(126, 156, 148, 36, shade(c.m, .14), 12);
    s += r(92, 130, 42, 104, shade(c.d, -.1), 20) + r(266, 130, 42, 104, shade(c.d, -.1), 20);
    return s;
}
export function bed(c) {
    let s = shadow(200, 175);
    s += r(44, 232, 12, 24, c.w, 3) + r(344, 232, 12, 24, c.w, 3);
    s += r(40, 64, 320, 176, c.d, 26);
    for (let y = 0; y < 3; y++)
        for (let x = 0; x < 7; x++)
            s += `<circle cx="${80 + x * 40}" cy="${92 + y * 30}" r="3" fill="${shade(c.d, -.22)}"/>`;
    s += r(30, 190, 340, 46, shade(c.d, -.12), 10);
    s += r(38, 158, 324, 42, '#F5F3EE', 12);
    s += r(152, 148, 212, 54, c.m, 12) + r(152, 148, 212, 12, shade(c.m, .22), 6);
    s += r(48, 118, 92, 40, shade(c.m, .55), 14) + r(60, 134, 86, 34, '#FFFFFF', 13);
    return s;
}
export function nightstand(c, x) {
    return r(x, 170, 64, 80, c.d, 6) + r(x - 3, 165, 70, 9, c.w, 3) + r(x + 7, 182, 50, 26, c.m, 4) + r(x + 7, 214, 50, 26, c.m, 4)
        + `<circle cx="${x + 32}" cy="195" r="3" fill="${c.w}"/><circle cx="${x + 32}" cy="227" r="3" fill="${c.w}"/>`
        + `<path d="M${x + 22} 165 l6 -28 h8 l6 28z" fill="${shade(c.m, .4)}"/>`;
}
export function bedset(c) {
    return shadow(200, 190) + nightstand(c, 4) + `<g transform="translate(66 50) scale(.67)">${bed(c).replace(shadow(200, 175), '')}</g>` + nightstand(c, 332);
}
export function wardrobe(c, doors = 3) {
    const W = doors >= 4 ? 280 : 220, X = 200 - W / 2;
    let s = shadow(200, W / 2 + 10);
    s += r(X, 24, W, 228, c.d, 6) + r(X - 6, 16, W + 12, 13, shade(c.d, -.18), 3) + r(X + 4, 246, W - 8, 12, shade(c.d, -.3), 2);
    const dw = (W - 8 - (doors - 1) * 4) / doors;
    for (let i = 0; i < doors; i++) {
        const dx = X + 4 + i * (dw + 4);
        s += r(dx, 34, dw, 208, c.m, 3);
        if (doors >= 3 && i === Math.floor(doors / 2)) {
            s += r(dx + 8, 44, dw - 16, 188, '#D3DCE1', 3) + `<path d="M${dx + 14} 120 l${dw - 30} -60 v18 l-${dw - 30} 60z" fill="#fff" opacity=".55"/>`;
        }
        const hx = i % 2 === 0 ? dx + dw - 10 : dx + 6;
        s += r(hx, 124, 4, 28, c.w, 2);
    }
    return s;
}
export function dresser(c) {
    let s = shadow(200, 125);
    s += `<ellipse cx="200" cy="82" rx="58" ry="66" fill="${shade(c.d, -.1)}"/><ellipse cx="200" cy="82" rx="49" ry="57" fill="#D3DCE1"/>`;
    s += `<path d="M168 60 l40 -30 v14 l-40 30z" fill="#fff" opacity=".6"/>`;
    s += r(90, 142, 220, 104, c.d, 8) + r(84, 134, 232, 12, c.w, 4);
    for (let i = 0; i < 3; i++)
        s += r(100, 154 + i * 30, 200, 24, c.m, 4) + `<circle cx="200" cy="${166 + i * 30}" r="4" fill="${c.w}"/>`;
    s += r(100, 244, 10, 14, c.w, 2) + r(290, 244, 10, 14, c.w, 2);
    return s;
}
function sideChair(c, x, flip) {
    const g = `${r(0, 0, 12, 110, c.w, 4)}${r(6, 10, 44, 64, c.m, 12)}${r(0, 78, 72, 20, c.m, 8)}${r(56, 96, 9, 62, shade(c.w, -.1), 3)}${r(2, 96, 9, 62, c.w, 3)}`;
    return `<g transform="translate(${x} 98) ${flip ? 'scale(-1 1)' : ''}">${g}</g>`;
}
export function dining(c) {
    let s = shadow(200, 175);
    s += sideChair(c, 18, false) + sideChair(c, 382, true);
    s += r(74, 150, 252, 14, c.w, 5) + r(84, 164, 232, 10, shade(c.w, -.18), 2);
    s += r(90, 172, 12, 84, shade(c.w, -.08), 3) + r(298, 172, 12, 84, shade(c.w, -.08), 3);
    s += `<ellipse cx="200" cy="140" rx="34" ry="8" fill="#F5F3EE"/><path d="M180 140 q20 -36 40 0" fill="${c.m}" opacity=".8"/>`;
    return s;
}
export function chair(c) {
    let s = shadow(200, 75);
    s += r(160, 188, 9, 66, shade(c.w, -.18), 3) + r(232, 188, 9, 66, shade(c.w, -.18), 3);
    s += r(148, 58, 12, 140, c.w, 5) + r(240, 58, 12, 140, c.w, 5);
    s += r(154, 70, 92, 78, c.m, 16) + r(136, 160, 128, 26, c.m, 10) + r(140, 182, 120, 8, shade(c.w, -.1), 3);
    s += r(144, 188, 10, 68, c.w, 3) + r(246, 188, 10, 68, c.w, 3);
    return s;
}
export function kitchen(c, corner = false) {
    const end = corner ? 318 : 380;
    let s = shadow(200, 185);
    const uw = (end - 20 - 12) / 4;
    for (let i = 0; i < 4; i++)
        s += r(20 + i * (uw + 4), 20, uw, 78, c.m, 4) + r(20 + i * (uw + 4) + uw / 2 - 12, 88, 24, 4, c.w, 2);
    s += r(20, 98, end - 20, 70, '#E4E8E2');
    for (let x = 40; x < end; x += 22)
        s += r(x, 98, 1, 70, '#D3D8D1');
    s += `<path d="M110 166 v-36 q0 -14 14 -14 h10 v8" stroke="#8D96A3" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += r(14, 166, end - 8, 12, c.w, 3);
    s += r(230, 160, 70, 6, '#2A3047', 2);
    const bw = (end - 20 - 12) / 4;
    for (let i = 0; i < 4; i++) {
        const bx = 20 + i * (bw + 4);
        s += r(bx, 178, bw, 72, c.d, 3);
        if (i === 2)
            s += r(bx + 8, 190, bw - 16, 40, '#2A3047', 4) + r(bx + 8, 184, bw - 16, 3, c.w, 2);
        else
            s += r(bx + bw / 2 - 14, 186, 28, 4, c.w, 2);
    }
    s += r(20, 250, end - 20, 8, shade(c.d, -.35));
    if (corner) {
        s += r(324, 20, 60, 238, shade(c.m, .12), 4) + r(324, 120, 60, 3, shade(c.m, -.1)) + r(330, 60, 4, 40, c.w, 2) + r(330, 140, 4, 50, c.w, 2);
    }
    return s;
}
export function desk(c) {
    let s = shadow(200, 160);
    s += r(62, 154, 12, 102, c.d, 2);
    s += r(250, 154, 92, 102, c.d, 4);
    for (let i = 0; i < 3; i++)
        s += r(258, 162 + i * 31, 76, 25, c.m, 3) + r(288, 172 + i * 31, 16, 4, c.w, 2);
    s += r(48, 140, 304, 14, c.w, 4);
    s += `<path d="M108 140 h24 M120 140 l-14 -42 l34 -26" stroke="#19224A" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M128 64 l30 -6 l6 26z" fill="#B8293F"/>`;
    s += r(190, 118, 14, 22, '#B8293F', 2) + r(206, 112, 12, 28, '#19224A', 2) + r(220, 122, 16, 18, '#D9A441', 2);
    return s;
}
export function officechair(c) {
    let s = shadow(200, 90);
    s += r(152, 38, 96, 112, c.d, 30) + r(162, 48, 76, 92, c.m, 24);
    s += `<path d="M136 128 v26 h18 M264 128 v26 h-18" stroke="${shade(c.d, -.25)}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    s += r(134, 150, 132, 28, c.d, 14);
    s += r(194, 178, 12, 42, '#8A92A0', 3);
    s += `<path d="M200 222 L128 246 M200 222 L272 246 M200 222 L164 252 M200 222 L236 252" stroke="#4B5263" stroke-width="8" stroke-linecap="round"/>`;
    for (const x of [128, 272, 164, 236])
        s += `<circle cx="${x}" cy="${x === 128 || x === 272 ? 250 : 255}" r="7" fill="#2B3042"/>`;
    return s;
}
export function bunkbed(c) {
    let s = shadow(200, 155);
    s += r(70, 30, 14, 228, c.w, 4) + r(322, 30, 14, 228, c.w, 4);
    s += r(84, 82, 238, 20, '#FFFFFF', 6) + r(176, 76, 146, 24, c.m, 7) + r(92, 70, 60, 16, shade(c.m, .6), 7);
    s += r(70, 102, 266, 22, c.d, 4) + r(84, 52, 150, 10, c.d, 4) + r(84, 52, 8, 32, c.d) + r(226, 52, 8, 32, c.d);
    s += r(84, 206, 238, 20, '#FFFFFF', 6) + r(176, 200, 146, 24, shade(c.m, -.18), 7) + r(92, 194, 60, 16, shade(c.m, .6), 7);
    s += r(70, 226, 266, 22, c.d, 4);
    for (const [x, y] of [[200, 86], [250, 84], [292, 88], [210, 210], [270, 208]])
        s += `<path d="M${x} ${y - 5} l1.6 3.4 3.7 .5 -2.7 2.6 .7 3.7 -3.3 -1.8 -3.3 1.8 .7 -3.7 -2.7 -2.6 3.7 -.5z" fill="#F2D27A"/>`;
    s += r(290, 108, 6, 100, c.w, 2) + r(314, 108, 6, 100, c.w, 2);
    for (let y = 124; y < 206; y += 22)
        s += r(290, y, 30, 5, c.w, 2);
    return s;
}
const BOOKS = ['#B8293F', '#19224A', '#D9A441', '#9FB0A0', '#7A4A2A', '#E8E2D5', '#3E5C76'];
export function shelf(c) {
    let s = shadow(200, 110);
    s += r(108, 18, 184, 240, c.d, 4) + r(118, 26, 164, 224, shade(c.d, .28));
    for (let i = 0; i < 4; i++) {
        const y = 26 + i * 56;
        s += r(118, y + 52, 164, 6, c.m);
        if (i === 0) {
            s += `<path d="M230 ${y + 52} q-6 -26 8 -32 h10 q14 6 8 32z" fill="#D9A441"/><path d="M243 ${y + 20} q-18 -18 -6 -24 q8 10 6 24 q4 -16 16 -18 q2 12 -16 18" fill="#5E7D5A"/>`;
        }
        let x = 124;
        let k = i * 3;
        while (x < (i === 0 ? 210 : 270)) {
            const w = 10 + ((k * 7) % 9), h = 34 + ((k * 13) % 16);
            s += r(x, y + 52 - h, w, h, BOOKS[k % BOOKS.length], 1.5);
            x += w + 2;
            k++;
        }
    }
    return s;
}
export function tvstand(c) {
    let s = shadow(200, 165);
    s += r(92, 34, 216, 128, '#1D2236', 6) + r(100, 42, 200, 112, '#2C3452', 3) + `<path d="M110 150 l70 -100 h40 l-70 100z" fill="#fff" opacity=".07"/>`;
    s += r(40, 182, 320, 64, c.d, 6);
    s += r(48, 190, 96, 48, c.m, 3) + r(152, 190, 96, 48, shade(c.d, -.32), 3) + r(256, 190, 96, 48, c.m, 3);
    s += r(186, 222, 28, 8, '#5A6178', 2) + r(84, 212, 24, 4, c.w, 2) + r(292, 212, 24, 4, c.w, 2);
    s += r(52, 246, 10, 12, c.w, 2) + r(338, 246, 10, 12, c.w, 2);
    return s;
}
export function coffeetable(c) {
    let s = shadow(200, 120);
    s += `<polygon points="128,178 140,178 122,254 112,254" fill="${shade(c.w, -.15)}"/><polygon points="260,178 272,178 288,254 278,254" fill="${shade(c.w, -.15)}"/><polygon points="196,184 206,184 204,258 198,258" fill="${shade(c.w, -.3)}"/>`;
    s += `<ellipse cx="200" cy="226" rx="92" ry="15" fill="${c.m}"/>`;
    s += `<ellipse cx="200" cy="176" rx="132" ry="27" fill="${shade(c.w, -.22)}"/><ellipse cx="200" cy="170" rx="132" ry="26" fill="${c.w}"/>`;
    s += `<path d="M184 166 q-4 -24 8 -30 h16 q12 6 8 30z" fill="#F5F3EE"/><path d="M200 138 q-10 -24 -24 -26 M200 138 q6 -26 22 -30 M200 138 v-34" stroke="#5E7D5A" stroke-width="3" fill="none"/><circle cx="176" cy="112" r="6" fill="#B8293F"/><circle cx="222" cy="108" r="6" fill="#B8293F"/><circle cx="200" cy="102" r="6" fill="#D9A441"/>`;
    return s;
}
// Decor used only in the hero room scene
export const decor = {
    lamp: () => `<path d="M0 0 h60 l-14 -56 h-32z" fill="#DCCDB3" transform="translate(-30 0)"/><rect x="-3" y="0" width="6" height="200" fill="#19224A"/><ellipse cx="0" cy="202" rx="36" ry="7" fill="#19224A"/>`,
    plant: () => `<path d="M-34 0 h68 l-10 70 h-48z" fill="#B8293F"/><path d="M0 0 q-50 -40 -38 -110 q30 30 38 110 q4 -90 44 -130 q14 70 -44 130 q-20 -60 4 -150 q22 60 -4 150" fill="#5E7D5A"/>`,
    art: () => `<rect x="-90" y="-60" width="180" height="120" fill="#F8F9F6" stroke="#7A4A2A" stroke-width="8"/><path d="M-70 40 l40 -50 l30 30 l24 -24 l46 44z" fill="#9FB0A0"/><circle cx="40" cy="-22" r="14" fill="#B8293F"/>`,
    rug: () => `<ellipse cx="0" cy="0" rx="330" ry="46" fill="#B8293F" opacity=".9"/><ellipse cx="0" cy="0" rx="300" ry="36" fill="none" stroke="#DCCDB3" stroke-width="3" stroke-dasharray="14 10"/><ellipse cx="0" cy="0" rx="260" ry="26" fill="none" stroke="#19224A" stroke-width="2"/>`,
    pendant: () => `<rect x="-1.5" y="-400" width="3" height="400" fill="#19224A"/><path d="M-50 40 q50 -80 100 0z" fill="#19224A"/><ellipse cx="0" cy="44" rx="20" ry="6" fill="#F2D27A"/>`,
};
export function drawInner(type, c) {
    switch (type) {
        case 'sofa': return sofa(c);
        case 'sofaWide': return sofa(c, true);
        case 'armchair': return armchair(c);
        case 'bed': return bed(c);
        case 'bedset': return bedset(c);
        case 'wardrobe3': return wardrobe(c, 3);
        case 'wardrobe4': return wardrobe(c, 4);
        case 'kidwardrobe': return wardrobe(c, 2);
        case 'dresser': return dresser(c);
        case 'dining': return dining(c);
        case 'chair': return chair(c);
        case 'kitchen': return kitchen(c);
        case 'kitchenCorner': return kitchen(c, true);
        case 'desk': return desk(c);
        case 'officechair': return officechair(c);
        case 'bunkbed': return bunkbed(c);
        case 'shelf': return shelf(c);
        case 'tvstand': return tvstand(c);
        case 'coffeetable': return coffeetable(c);
    }
}
export function draw(type, c, label = '') {
    return `<svg viewBox="0 0 400 280" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${drawInner(type, c)}</svg>`;
}
