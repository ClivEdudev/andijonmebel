export const CATS = [
    { id: 'living', art: 'sofaWide', name: { uz: 'Mehmonxona', ru: 'Гостиная', en: 'Living room' }, blurb: { uz: 'Divanlar, kreslolar, jurnal stollari', ru: 'Диваны, кресла, журнальные столики', en: 'Sofas, armchairs, coffee tables' } },
    { id: 'bedroom', art: 'bedset', name: { uz: 'Yotoqxona', ru: 'Спальня', en: 'Bedroom' }, blurb: { uz: 'Karavotlar, tumbalar, tualet stollari', ru: 'Кровати, тумбы, туалетные столики', en: 'Beds, nightstands, dressers' } },
    { id: 'kitchen', art: 'kitchenCorner', name: { uz: 'Oshxona', ru: 'Кухня', en: 'Kitchen' }, blurb: { uz: 'Toʻgʻri va burchakli garniturlar', ru: 'Прямые и угловые гарнитуры', en: 'Straight and corner sets' } },
    { id: 'dining', art: 'dining', name: { uz: 'Ovqatlanish', ru: 'Столовая', en: 'Dining' }, blurb: { uz: 'Stollar va stullar butun oila uchun', ru: 'Столы и стулья для всей семьи', en: 'Tables and chairs for the whole family' } },
    { id: 'kids', art: 'bunkbed', name: { uz: 'Bolalar xonasi', ru: 'Детская', en: 'Kids’ room' }, blurb: { uz: 'Ikki qavatli karavotlar, partalar', ru: 'Двухъярусные кровати, парты', en: 'Bunk beds, study desks' } },
    { id: 'office', art: 'desk', name: { uz: 'Ofis', ru: 'Офис', en: 'Office' }, blurb: { uz: 'Ish stollari va qulay kreslolar', ru: 'Рабочие столы и удобные кресла', en: 'Work desks and comfy chairs' } },
    { id: 'storage', art: 'wardrobe4', name: { uz: 'Shkaf va javonlar', ru: 'Шкафы и стеллажи', en: 'Wardrobes & shelves' }, blurb: { uz: 'Kiyim shkaflari, kitob javonlari', ru: 'Платяные шкафы, книжные стеллажи', en: 'Wardrobes, bookcases' } },
];
const W = { walnut: '#7A4A2A', oak: '#B98A5A', dark: '#4A2E1D', ash: '#CBB290' };
const S = {
    indigo: { name: { uz: 'Indigo', ru: 'Индиго', en: 'Indigo' }, m: '#3E4E8C', d: '#2A3566' },
    sage: { name: { uz: 'Shalfey', ru: 'Шалфей', en: 'Sage' }, m: '#A3B39A', d: '#7E8F76' },
    sand: { name: { uz: 'Qum', ru: 'Песок', en: 'Sand' }, m: '#E2D3B8', d: '#C4B293' },
    pom: { name: { uz: 'Anor', ru: 'Гранат', en: 'Pomegranate' }, m: '#B8293F', d: '#8E1F31' },
    graphite: { name: { uz: 'Grafit', ru: 'Графит', en: 'Graphite' }, m: '#6B7080', d: '#4B4F5C' },
    milk: { name: { uz: 'Sut rang', ru: 'Молочный', en: 'Milk' }, m: '#F1ECE2', d: '#D9D1C2' },
    walnut: { name: { uz: 'Yongʻoq', ru: 'Орех', en: 'Walnut' }, m: '#9A6440', d: '#6E432A' },
    olive: { name: { uz: 'Zaytun', ru: 'Олива', en: 'Olive' }, m: '#8C8B5A', d: '#66653F' },
    sky: { name: { uz: 'Osmon', ru: 'Небо', en: 'Sky' }, m: '#8FB3D1', d: '#5F86A8' },
    mustard: { name: { uz: 'Xantal', ru: 'Горчица', en: 'Mustard' }, m: '#D9A441', d: '#A97B27' },
};
const n = (uz, ru, en) => ({ uz, ru, en });
export const PRODUCTS = [
    { id: 'samarqand', cat: 'living', art: 'sofa', name: n('“Samarqand” divan', 'Диван «Самарканд»', '“Samarqand” sofa'), price: 7900000, dims: '220 × 95 × 88', badge: 'hit', wood: W.walnut, swatches: [S.indigo, S.sage, S.sand, S.graphite], pop: 98 },
    { id: 'bahor', cat: 'living', art: 'sofaWide', name: n('“Bahor” katta divan', 'Большой диван «Бахор»', '“Bahor” large sofa'), price: 11500000, old: 12900000, dims: '300 × 100 × 86', badge: 'sale', wood: W.dark, swatches: [S.sand, S.olive, S.graphite], pop: 90 },
    { id: 'lola', cat: 'living', art: 'armchair', name: n('“Lola” kreslo', 'Кресло «Лола»', '“Lola” armchair'), price: 2650000, dims: '90 × 85 × 92', wood: W.walnut, swatches: [S.pom, S.mustard, S.indigo], pop: 85 },
    { id: 'oqsaroy', cat: 'living', art: 'coffeetable', name: n('“Oqsaroy” jurnal stoli', 'Журнальный стол «Оксарой»', '“Oqsaroy” coffee table'), price: 1350000, dims: 'Ø 90 × 45', wood: W.oak, swatches: [S.sage, S.indigo, S.milk], pop: 76 },
    { id: 'navo', cat: 'living', art: 'tvstand', name: n('“Navo” TV tumba', 'ТВ-тумба «Наво»', '“Navo” TV stand'), price: 2200000, dims: '180 × 45 × 55', badge: 'new', wood: W.walnut, swatches: [S.milk, S.walnut, S.graphite], pop: 70 },
    { id: 'marvarid', cat: 'bedroom', art: 'bed', name: n('“Marvarid” karavot', 'Кровать «Марварид»', '“Marvarid” bed'), price: 6400000, dims: '160 × 200', badge: 'hit', wood: W.walnut, swatches: [S.sand, S.indigo, S.sage], pop: 95 },
    { id: 'gulsara', cat: 'bedroom', art: 'bedset', name: n('“Gulsara” karavot va 2 tumba', 'Кровать «Гульсара» и 2 тумбы', '“Gulsara” bed with 2 nightstands'), price: 9800000, dims: '180 × 200', wood: W.dark, swatches: [S.milk, S.walnut, S.graphite], pop: 88 },
    { id: 'nafis', cat: 'bedroom', art: 'dresser', name: n('“Nafis” oynali komod', 'Комод с зеркалом «Нафис»', '“Nafis” dresser with mirror'), price: 3100000, dims: '120 × 45 × 160', wood: W.oak, swatches: [S.milk, S.walnut, S.sage], pop: 80 },
    { id: 'atlas', cat: 'bedroom', art: 'wardrobe3', name: n('“Atlas” 3 eshikli shkaf', 'Шкаф 3-дверный «Атлас»', '“Atlas” 3-door wardrobe'), price: 5700000, dims: '150 × 60 × 220', wood: W.walnut, swatches: [S.milk, S.walnut, S.graphite], pop: 84 },
    { id: 'zilol', cat: 'kitchen', art: 'kitchen', name: n('“Zilol” oshxona, 2,4 m', 'Кухня «Зилол», 2,4 м', '“Zilol” kitchen, 2.4 m'), price: 14900000, dims: '240 × 60 × 220', badge: 'new', wood: W.oak, swatches: [S.sage, S.milk, S.indigo], pop: 82 },
    { id: 'ravon', cat: 'kitchen', art: 'kitchenCorner', name: n('“Ravon” burchakli oshxona', 'Угловая кухня «Равон»', '“Ravon” corner kitchen'), price: 19500000, old: 21000000, dims: '280 × 180 × 220', badge: 'sale', wood: W.walnut, swatches: [S.milk, S.graphite, S.olive], pop: 79 },
    { id: 'dasturxon', cat: 'dining', art: 'dining', name: n('“Dasturxon” stol va 6 stul', 'Стол «Дастурхан» и 6 стульев', '“Dasturxon” table with 6 chairs'), price: 8600000, dims: '180 × 90 × 76', badge: 'hit', wood: W.walnut, swatches: [S.sand, S.pom, S.sage], pop: 93 },
    { id: 'bog', cat: 'dining', art: 'dining', name: n('“Bogʻ” stol va 4 stul', 'Стол «Бог» и 4 стула', '“Bogʻ” table with 4 chairs'), price: 5900000, dims: '140 × 80 × 76', wood: W.oak, swatches: [S.milk, S.olive], pop: 74 },
    { id: 'chinor', cat: 'dining', art: 'chair', name: n('“Chinor” stul', 'Стул «Чинор»', '“Chinor” chair'), price: 520000, dims: '45 × 50 × 95', wood: W.walnut, swatches: [S.sand, S.pom, S.indigo, S.sage], pop: 72 },
    { id: 'quvnoq', cat: 'kids', art: 'bunkbed', name: n('“Quvnoq” ikki qavatli karavot', 'Двухъярусная кровать «Кувнок»', '“Quvnoq” bunk bed'), price: 4300000, dims: '90 × 190 × 170', badge: 'new', wood: W.ash, swatches: [S.sky, S.mustard, S.sage], pop: 86 },
    { id: 'kitobxon', cat: 'kids', art: 'desk', name: n('“Kitobxon” bolalar partasi', 'Детская парта «Китобхон»', '“Kitobxon” study desk'), price: 1750000, dims: '110 × 55 × 75', wood: W.ash, swatches: [S.sky, S.milk], pop: 68 },
    { id: 'yulduz', cat: 'kids', art: 'kidwardrobe', name: n('“Yulduz” bolalar shkafi', 'Детский шкаф «Юлдуз»', '“Yulduz” kids’ wardrobe'), price: 2900000, dims: '90 × 50 × 180', wood: W.ash, swatches: [S.sky, S.mustard, S.milk], pop: 64 },
    { id: 'rahbar', cat: 'office', art: 'desk', name: n('“Rahbar” ish stoli', 'Рабочий стол «Рахбар»', '“Rahbar” work desk'), price: 3600000, dims: '160 × 75 × 76', wood: W.dark, swatches: [S.graphite, S.walnut], pop: 71 },
    { id: 'qulay', cat: 'office', art: 'officechair', name: n('“Qulay” ofis kreslosi', 'Офисное кресло «Кулай»', '“Qulay” office chair'), price: 1450000, dims: '65 × 65 × 120', wood: W.dark, swatches: [S.graphite, S.indigo, S.pom], pop: 77 },
    { id: 'kozgu', cat: 'storage', art: 'wardrobe4', name: n('“Koʻzgu” 4 eshikli shkaf', 'Шкаф 4-дверный «Кузгу»', '“Koʻzgu” 4-door wardrobe'), price: 7200000, dims: '200 × 60 × 230', badge: 'hit', wood: W.walnut, swatches: [S.milk, S.walnut, S.graphite], pop: 87 },
    { id: 'javon', cat: 'storage', art: 'shelf', name: n('“Javon” kitob javoni', 'Книжный стеллаж «Жавон»', '“Javon” bookcase'), price: 1250000, dims: '90 × 35 × 200', wood: W.walnut, swatches: [S.walnut, S.milk, S.sage], pop: 69 },
];
export const PRODUCT = (id) => PRODUCTS.find(p => p.id === id);
const sum = (ids) => ids.reduce((a, id) => a + PRODUCT(id).price, 0);
const round = (x) => Math.round(x / 100000) * 100000;
export const SEP = [
    { id: 'sep-start', name: n('Sep “Ilk qadam”', 'Сеп «Первый шаг»', 'Sep “First step”'), note: n('Yotoqxona uchun asosiysi', 'Всё главное для спальни', 'The bedroom essentials'), items: ['marvarid', 'atlas', 'nafis'], show: ['marvarid', 'atlas', 'nafis'], price: 0 },
    { id: 'sep-oila', name: n('Sep “Oila”', 'Сеп «Семья»', 'Sep “Family”'), note: n('Yotoqxona va mehmonxona', 'Спальня и гостиная', 'Bedroom and living room'), items: ['gulsara', 'kozgu', 'nafis', 'samarqand', 'oqsaroy'], show: ['samarqand', 'kozgu', 'gulsara'], price: 0 },
    { id: 'sep-toliq', name: n('Sep “Toʻliq uy”', 'Сеп «Полный дом»', 'Sep “Whole home”'), note: n('Yotoqxona, mehmonxona, oshxona va ovqatlanish', 'Спальня, гостиная, кухня и столовая', 'Bedroom, living, kitchen and dining'), items: ['gulsara', 'kozgu', 'nafis', 'bahor', 'lola', 'oqsaroy', 'zilol', 'dasturxon'], show: ['dasturxon', 'zilol', 'lola'], price: 0 },
];
SEP.forEach((b, i) => { b.price = round(sum(b.items) * [0.92, 0.9, 0.88][i]); });
export const bundleFull = (b) => sum(b.items);
export const ROOM_SET = ['samarqand', 'lola', 'oqsaroy', 'javon'];
export const ZONES = [
    { id: 'pickup', name: n('Doʻkondan olib ketaman', 'Самовывоз из магазина', 'I’ll pick it up at the store'), fee: 0, days: n('Buyurtma tayyor boʻlgach', 'Когда заказ готов', 'When the order is ready') },
    { id: 'city', name: n('Andijon shahri', 'Город Андижан', 'Andijan city'), fee: 100000, freeFrom: 5000000, days: n('1–2 kun', '1–2 дня', '1–2 days') },
    { id: 'region', name: n('Andijon viloyati tumanlari', 'Районы Андижанской области', 'Andijan region districts'), fee: 200000, days: n('2–3 kun', '2–3 дня', '2–3 days') },
    { id: 'valley', name: n('Fargʻona va Namangan', 'Фергана и Наманган', 'Fergana and Namangan'), fee: 400000, days: n('3–4 kun', '3–4 дня', '3–4 days') },
    { id: 'far', name: n('Boshqa viloyatlar va Toshkent', 'Другие области и Ташкент', 'Other regions and Tashkent'), fee: 800000, days: n('4–7 kun', '4–7 дней', '4–7 days') },
];
export const ASSEMBLY_FEE = 150000;
export const STORE = {
    plus: '8JGJQ73M+GF', lat: 40.75381, lng: 72.28369,
    phone: '+998 (XX) XXX-XX-XX', // TODO: replace with the store's real number
    telegram: '', instagram: '',
};
