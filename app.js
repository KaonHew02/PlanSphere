/**
 * ====================================================================
 * PlanSphere — Plan Infinity and Travel Beyond the World.
 * --------------------------------------------------------------------
 * Six modules share one page, one stylesheet and one store:
 *
 *   Dashboard   — reads everything, writes nothing
 *   Trips       — the only module that creates the thing the rest hang off
 *   Itinerary   — days down the page, stops inside them
 *   Bookings    — what is held, what is paid, what is still an idea
 *   Budget      — reads Bookings and Itinerary; owns only the total
 *   Packing     — the one screen that gets used standing up
 *
 * Every module answers to the trip chosen in the top bar. Nothing is
 * submitted anywhere: the store is localStorage, and a save is a write.
 * ====================================================================
 */

/* ====================================================================
   HELPERS
   ==================================================================== */
const $ = (id) => document.getElementById(id);

function set(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
}

function html(id, markup) {
    const el = $(id);
    if (el) el.innerHTML = markup;
}

/** Anything a user typed goes through here before it meets innerHTML. */
function esc(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Money is counted in sen, so a budget never drifts by a fraction of a cent
   after a few dozen additions. It only becomes a decimal on the way out. */
const toSen   = (x) => Math.round((Number(x) || 0) * 100);
const fromSen = (s) => (s || 0) / 100;

/* --------------------------------------------------------------------
   Currencies

   All 166 the rate service quotes, held as one delimited string rather
   than 166 object literals — `CODE:Name` with `:0` appended where the
   currency has no minor unit. A yen, a won and a dong have none, and
   printing 6,500,000.00 VND is how you make a real figure look like a
   spreadsheet error.

   Flags come from the first two letters of the code, which is the
   country for all but seven of them; those seven are listed below. The
   five that begin X are shared across a bloc and get no flag at all,
   because there is no one country to show.

   The three-decimal currencies (dinars) are clamped to two. Amounts are
   stored in hundredths, so a third decimal could be typed and displayed
   but not kept, and a figure that does not survive a reload is worse
   than one that was never offered.

   Amounts are always stored in the currency they were paid in. Nothing
   in this file ever rewrites one into another.
   -------------------------------------------------------------------- */
const CUR_DATA = 'AED:United Arab Emirates Dirham|AFN:Afghan Afghani:0|ALL:Albanian Lek:0|AMD:Armenian Dram|ANG:Netherlands Antillean Guilder|AOA:Angolan Kwanza|ARS:Argentine Peso|AUD:Australian Dollar|AWG:Aruban Florin|AZN:Azerbaijani Manat|BAM:Bosnia-Herzegovina Convertible Mark|BBD:Barbadian Dollar|BDT:Bangladeshi Taka|BGN:Bulgarian Lev|BHD:Bahraini Dinar|BIF:Burundian Franc:0|BMD:Bermudan Dollar|BND:Brunei Dollar|BOB:Bolivian Boliviano|BRL:Brazilian Real|BSD:Bahamian Dollar|BTN:Bhutanese Ngultrum|BWP:Botswanan Pula|BYN:Belarusian Ruble|BZD:Belize Dollar|CAD:Canadian Dollar|CDF:Congolese Franc|CHF:Swiss Franc|CLF:Chilean Unit of Account|CLP:Chilean Peso:0|CNH:Chinese Yuan (offshore)|CNY:Chinese Yuan|COP:Colombian Peso:0|CRC:Costa Rican Colon|CUP:Cuban Peso|CVE:Cape Verdean Escudo|CZK:Czech Koruna|DJF:Djiboutian Franc:0|DKK:Danish Krone|DOP:Dominican Peso|DZD:Algerian Dinar|EGP:Egyptian Pound|ERN:Eritrean Nakfa|ETB:Ethiopian Birr|EUR:Euro|FJD:Fijian Dollar|FKP:Falkland Islands Pound|FOK:Faroese Krona|GBP:British Pound|GEL:Georgian Lari|GGP:Guernsey Pound|GHS:Ghanaian Cedi|GIP:Gibraltar Pound|GMD:Gambian Dalasi|GNF:Guinean Franc:0|GTQ:Guatemalan Quetzal|GYD:Guyanaese Dollar|HKD:Hong Kong Dollar|HNL:Honduran Lempira|HRK:Croatian Kuna|HTG:Haitian Gourde|HUF:Hungarian Forint:0|IDR:Indonesian Rupiah:0|ILS:Israeli New Shekel|IMP:Manx Pound|INR:Indian Rupee|IQD:Iraqi Dinar:0|IRR:Iranian Rial:0|ISK:Icelandic Krona:0|JEP:Jersey Pound|JMD:Jamaican Dollar|JOD:Jordanian Dinar|JPY:Japanese Yen:0|KES:Kenyan Shilling|KGS:Kyrgyz Som|KHR:Cambodian Riel|KID:Kiribati Dollar|KMF:Comorian Franc:0|KRW:South Korean Won:0|KWD:Kuwaiti Dinar|KYD:Cayman Islands Dollar|KZT:Kazakhstani Tenge|LAK:Laotian Kip:0|LBP:Lebanese Pound:0|LKR:Sri Lankan Rupee|LRD:Liberian Dollar|LSL:Lesotho Loti|LYD:Libyan Dinar|MAD:Moroccan Dirham|MDL:Moldovan Leu|MGA:Malagasy Ariary:0|MKD:Macedonian Denar|MMK:Myanmar Kyat:0|MNT:Mongolian Tugrik|MOP:Macanese Pataca|MRU:Mauritanian Ouguiya|MUR:Mauritian Rupee|MVR:Maldivian Rufiyaa|MWK:Malawian Kwacha|MXN:Mexican Peso|MYR:Malaysian Ringgit|MZN:Mozambican Metical|NAD:Namibian Dollar|NGN:Nigerian Naira|NIO:Nicaraguan Cordoba|NOK:Norwegian Krone|NPR:Nepalese Rupee|NZD:New Zealand Dollar|OMR:Omani Rial|PAB:Panamanian Balboa|PEN:Peruvian Sol|PGK:Papua New Guinean Kina|PHP:Philippine Peso|PKR:Pakistani Rupee:0|PLN:Polish Zloty|PYG:Paraguayan Guarani:0|QAR:Qatari Riyal|RON:Romanian Leu|RSD:Serbian Dinar:0|RUB:Russian Ruble|RWF:Rwandan Franc:0|SAR:Saudi Riyal|SBD:Solomon Islands Dollar|SCR:Seychellois Rupee|SDG:Sudanese Pound|SEK:Swedish Krona|SGD:Singapore Dollar|SHP:St Helena Pound|SLE:Sierra Leonean Leone|SLL:Sierra Leonean Leone (old):0|SOS:Somali Shilling:0|SRD:Surinamese Dollar|SSP:South Sudanese Pound|STN:Sao Tome and Principe Dobra|SYP:Syrian Pound:0|SZL:Swazi Lilangeni|THB:Thai Baht|TJS:Tajikistani Somoni|TMT:Turkmenistani Manat|TND:Tunisian Dinar|TOP:Tongan Paanga|TRY:Turkish Lira|TTD:Trinidad and Tobago Dollar|TVD:Tuvaluan Dollar|TWD:New Taiwan Dollar|TZS:Tanzanian Shilling|UAH:Ukrainian Hryvnia|UGX:Ugandan Shilling:0|USD:US Dollar|UYU:Uruguayan Peso|UZS:Uzbekistani Som|VES:Venezuelan Bolivar|VND:Vietnamese Dong:0|VUV:Vanuatu Vatu:0|WST:Samoan Tala|XAF:Central African CFA Franc:0|XCD:East Caribbean Dollar|XCG:Caribbean Guilder|XDR:Special Drawing Rights|XOF:West African CFA Franc:0|XPF:CFP Franc:0|YER:Yemeni Rial:0|ZAR:South African Rand|ZMW:Zambian Kwacha|ZWG:Zimbabwe Gold|ZWL:Zimbabwean Dollar (old)';

const CUR_FLAG = { ANG: 'CW', XCG: 'CW', XAF: '', XCD: '', XDR: '', XOF: '', XPF: '' };

/* The ones a trip from here actually uses, kept at the top of every
   picker. The rest follow alphabetically. */
const CUR_COMMON = ['MYR', 'SGD', 'THB', 'VND', 'IDR', 'PHP', 'BND', 'JPY', 'KRW',
    'CNY', 'TWD', 'HKD', 'INR', 'USD', 'EUR', 'GBP', 'AUD', 'NZD', 'CHF', 'AED'];

const CUR = {};

CUR_DATA.split('|').forEach((row) => {
    const bits = row.split(':');
    const code = bits[0];
    const cc = CUR_FLAG[code] === undefined ? code.slice(0, 2) : CUR_FLAG[code];
    CUR[code] = {
        name: bits[1],
        flag: cc ? String.fromCodePoint.apply(null, cc.split('').map((ch) => 0x1F1E6 + ch.charCodeAt(0) - 65)) : '\u{1F3F3}',
        /* One currency gets a symbol in front, the rest get their code
           behind. With 166 of them the code is the only unambiguous mark —
           four of these are called "dollar" and two use the yen sign. */
        pre: code === 'MYR' ? 'RM ' : '',
        post: code === 'MYR' ? '' : ' ' + code,
        dp: bits[2] === undefined ? 2 : Number(bits[2]),
    };
});

const CUR_ORDER = CUR_COMMON.filter((c) => CUR[c])
    .concat(Object.keys(CUR).filter((c) => CUR_COMMON.indexOf(c) < 0).sort());

/* Always to the currency's own decimal places, and there is no longer an
   option to drop them.

   There used to be a `{ round: true }` for figures you only glance at — a
   budget headline, a bar on a chart. It read tidily and it was wrong: a
   total of RM 24.70 printed as RM 25 above rows that add up to 24.70, and
   a total that disagrees with the rows it totals is worse than a noisy one.
   Fifty-odd call sites each got to make that mistake independently, so the
   option is gone rather than audited. */
function moneyIn(sen, cur) {
    const c = CUR[cur] || CUR.MYR;
    const value = fromSen(sen || 0);
    return c.pre + value.toLocaleString('en-MY', { minimumFractionDigits: c.dp, maximumFractionDigits: c.dp }) + c.post;
}

/** The currency this trip counts in. Everything totalled is totalled here. */
function homeCur() {
    const t = trip();
    return (t && t.home) || 'MYR';
}

/** Formats in the current trip's own money. For anything else, moneyIn. */
function money(sen) {
    return moneyIn(sen, homeCur());
}

/** 1 home = N foreign, as typed on the Convert screen. null = not set. */
function rateFor(t, cur) {
    const home = (t && t.home) || 'MYR';
    if (!cur || cur === home) return 1;
    const r = t && t.rates ? Number(t.rates[cur]) : 0;
    return r > 0 ? r : null;
}

function toHome(sen, cur, t) {
    const r = rateFor(t, cur);
    return r === null ? null : Math.round((sen || 0) / r);
}

/** What a row counts as in the trip's money. An unknown rate counts as
    nothing rather than as itself — silently adding 150,000 dong to a
    ringgit total is the one wrong answer worse than a gap. */
function homeOf(row, t) {
    const v = toHome(row.cost || 0, row.cur, t);
    return v === null ? 0 : v;
}

/** The original, and underneath it what it counts as. In that order, and
    never one instead of the other. */
function amount(sen, cur, t) {
    const home = (t && t.home) || 'MYR';
    const c = cur || home;
    if (c === home) return '<span class="amt"><span class="in">' + moneyIn(sen, c) + '</span></span>';
    const conv = toHome(sen, c, t);
    return '<span class="amt"><span class="in">' + moneyIn(sen, c) + '</span>'
        + (conv === null
            ? '<span class="as is-unknown">rate not set</span>'
            : '<span class="as">\u2248 ' + moneyIn(conv, home) + '</span>')
        + '</span>';
}

/** Foreign currencies this trip actually has money in. */
function currenciesUsed(t) {
    if (!t) return [];
    const home = t.home || 'MYR';
    const used = new Set();
    mine(db.stops).forEach((r) => { if (r.cost && r.cur && r.cur !== home) used.add(r.cur); });
    mine(db.books).forEach((r) => { if (r.cost && r.cur && r.cur !== home) used.add(r.cur); });
    return CUR_ORDER.filter((c) => used.has(c));
}

function fillCurSelect(el, selected) {
    if (!el) return;
    const opt = (c) => '<option value="' + c + '">' + CUR[c].flag + '  ' + c + ' \u00b7 ' + esc(CUR[c].name) + '</option>';
    const rest = CUR_ORDER.filter((c) => CUR_COMMON.indexOf(c) < 0);
    el.innerHTML = '<optgroup label="Where you go">'
        + CUR_COMMON.filter((c) => CUR[c]).map(opt).join('')
        + '</optgroup><optgroup label="Everything else">'
        + rest.map(opt).join('')
        + '</optgroup>';
    el.value = CUR[selected] ? selected : 'MYR';
}

/* --------------------------------------------------------------------
   Dates

   Everything is stored as a plain 'YYYY-MM-DD' string, which sorts and
   compares correctly as text and never picks up a timezone on the way
   through a Date object. The only place a real Date is built is when a
   day name is needed, and it is built at noon so a shift either way
   cannot roll it into the day before.
   -------------------------------------------------------------------- */
const DAY_MS = 86400000;

/** A Date back to the 'YYYY-MM-DD' every record in the store is written in. */
function isoOf(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + String(d.getDate()).padStart(2, '0');
}

function today() {
    return isoOf(new Date());
}

function asDate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0);
}

/** Whole days from `a` to `b`. Negative means `b` is already past. */
function daysBetween(a, b) {
    const from = asDate(a);
    const to = asDate(b);
    if (!from || !to) return null;
    return Math.round((to - from) / DAY_MS);
}

function shiftDate(iso, days) {
    const d = asDate(iso);
    if (!d) return '';
    d.setDate(d.getDate() + days);
    return isoOf(d);
}

/** Whole months, landing on the first — what a month picker steps by. */
function shiftMonth(iso, by) {
    const d = asDate(iso) || new Date();
    return isoOf(new Date(d.getFullYear(), d.getMonth() + by, 1));
}

/* One date format in the whole app, and it is dd-mm-yyyy. The weekday
   stays in front of it because "which day of the week" is most of why an
   itinerary gets looked at, and a number cannot answer that. */
function fmtNum(iso) {
    if (!iso) return '—';
    const [y, m, d] = String(iso).split('-');
    if (!y || !m || !d) return '—';
    return d + '-' + m + '-' + y;
}

function fmtDay(iso) {
    const d = asDate(iso);
    if (!d) return '—';
    return d.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + fmtNum(iso);
}

function fmtRange(from, to) {
    if (!from || !to) return '—';
    /* An arrow rather than a dash: the dates are full of hyphens now, and a
       dash between them read as part of the second one. */
    return fmtNum(from) + ' → ' + fmtNum(to);
}

/** 09:30 → 9:30 am. An empty time is a stop with no time, not midnight. */
function fmtTime(hhmm) {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h)) return '';
    const suffix = h < 12 ? 'am' : 'pm';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return hour + ':' + String(m || 0).padStart(2, '0') + ' ' + suffix;
}

function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : (many || one + 's'));
}

/* --------------------------------------------------------------------
   Kinds

   A stop, a booking and a budget line are three rows carrying the same
   idea: a thing with a kind. The kind is declared once, here, and the
   label, the icon and the colour class all come from it — so a category
   can never mean one colour on the Itinerary and another on the Budget.
   -------------------------------------------------------------------- */
const DEFAULT_STOP_KINDS = [
    { id: 'travel', label: 'Travel',   icon: 'bi-airplane-fill', tone: 'sky' },
    { id: 'stay',   label: 'Stay',     icon: 'bi-building-fill', tone: 'violet' },
    { id: 'food',   label: 'Food',     icon: 'bi-cup-hot-fill',  tone: 'amber' },
    { id: 'do',     label: 'Activity', icon: 'bi-camera-fill',   tone: 'teal' },
    { id: 'shop',   label: 'Shopping', icon: 'bi-bag-fill',      tone: 'rose' },
    { id: 'other',  label: 'Other',    icon: 'bi-three-dots',    tone: 'slate', locked: true },
];

/* Rows in the store now, not a constant — the same call the categories and
   the trip types already made. Six words chosen by somebody else are a
   guess at how a person plans, and a guess is a limit the moment it is
   wrong. "Other" is the one that cannot go: it is where a deleted kind's
   stops land, and a row has to have somewhere to be. */
const OTHER_KIND = DEFAULT_STOP_KINDS[DEFAULT_STOP_KINDS.length - 1];

const kindOf = (k) => (db.stopKinds || []).find((r) => r.id === k)
    || (db.stopKinds || []).find((r) => r.id === 'other')
    || OTHER_KIND;

/** The icons a kind may wear. A fixed set, because a free text field asking
    for a Bootstrap class name is a field nobody can fill. */
const KIND_ICONS = [
    ['bi-airplane-fill', 'Plane'],   ['bi-train-front-fill', 'Train'],
    ['bi-bus-front-fill', 'Bus'],    ['bi-car-front-fill', 'Car'],
    ['bi-building-fill', 'Hotel'],   ['bi-house-door-fill', 'House'],
    ['bi-cup-hot-fill', 'Food'],     ['bi-camera-fill', 'Sightseeing'],
    ['bi-bag-fill', 'Shopping'],     ['bi-ticket-perforated-fill', 'Ticket'],
    ['bi-music-note-beamed', 'Music'], ['bi-controller', 'Games'],
    ['bi-tree-fill', 'Outdoors'],    ['bi-water', 'Water'],
    ['bi-heart-fill', 'Wellbeing'],  ['bi-briefcase-fill', 'Work'],
    ['bi-people-fill', 'People'],    ['bi-star-fill', 'Special'],
    ['bi-three-dots', 'Plain'],
];

const STATUS = {
    idea: { label: 'Idea', tag: 'is-amber' },
    held: { label: 'Held', tag: 'is-azure' },
    paid: { label: 'Paid', tag: 'is-green' },
};

function disc(kind, small) {
    const k = kindOf(kind);
    /* The colour rides on the row rather than on a stylesheet class, because
       a kind somebody added five minutes ago has no class to ride on. */
    return '<span class="disc is-tone' + (small ? ' is-sm' : '') + '" style="' + tone(k) + '">'
        + '<i class="bi ' + k.icon + '"></i></span>';
}

function emptyState(icon, title, line) {
    return '<div class="empty-state"><i class="bi ' + icon + '"></i>'
        + '<p><b>' + esc(title) + '</b>' + esc(line) + '</p></div>';
}

/* ====================================================================
   STORE

   One blob, one key. Every write goes through save(), which stamps the
   time so the top bar can say when it last happened — a file-backed app
   with no save button needs to prove it is keeping up.
   ==================================================================== */
const KEY = 'plansphere.v2';

/* Stores from before the modules were finished. The shape changed under
   them often enough that carrying one forward would mean guessing at what
   half its rows meant, so they are cleared rather than migrated — and
   cleared rather than orphaned, because data nobody can reach is still
   data taking up somebody's quota. */
const OLD_KEYS = ['plansphere.v1'];

let db = { trips: [], stops: [], books: [], packs: [], events: [], cats: [], types: [], stopKinds: [], notes: [], spend: [], spendCats: [], docs: [], settle: [], homeCountry: 'MY', current: null, saved: null };

/* The records live in IndexedDB when there is one — see store.js for why.
   `held` and `keep` are the only two places in the app that touch a
   backend, and both fall back to localStorage when store.js did not load,
   because they sit between a keystroke and the floor. */
const haveStore = () => typeof PSStore !== 'undefined';

function held(key) {
    if (haveStore()) return PSStore.get(key);
    try { return localStorage.getItem(key); } catch (err) { return null; }
}

function keep(key, value) {
    if (haveStore()) return PSStore.set(key, value);
    try { localStorage.setItem(key, value); return true; } catch (err) { return false; }
}

function load() {
    OLD_KEYS.forEach((k) => { try { localStorage.removeItem(k); } catch (err) { /* nothing to clear */ } });

    try {
        const raw = held(KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            db = Object.assign(db, parsed);
        }
    } catch (err) {
        /* A corrupt or unavailable store is not a crash — the session
           simply starts empty and the next save repairs it. */
    }
    ['trips', 'stops', 'books', 'packs', 'events', 'cats', 'types', 'stopKinds', 'notes', 'spend', 'spendCats', 'docs', 'settle'].forEach((k) => {
        if (!Array.isArray(db[k])) db[k] = [];
    });

    /* Categories are data now, so a store written before they were get the
       defaults, and one that has lost the system category gets it back —
       trips, stops and bookings all file under it and have nowhere else. */
    if (!db.cats.length) db.cats = DEFAULT_CATS.map((c) => Object.assign({}, c));
    DEFAULT_CATS.filter((d) => d.locked).forEach((d, i) => {
        if (!db.cats.some((c) => c.id === d.id)) db.cats.splice(i, 0, Object.assign({}, d));
    });
    /* Same call as the categories: a store written before types existed
       gets the defaults, and one whose lists have been emptied on purpose
       stays empty — the check is per scope, so deleting every trip type
       does not resurrect all ten. */
    if (!db.types.length) db.types = DEFAULT_TYPES.map((t) => Object.assign({}, t));

    /* Stop kinds were six constants until they were a list. A store written
       before that has none, and one that has lost "Other" gets it back —
       every stop and booking whose kind was deleted is filed there. */
    if (!db.stopKinds.length) db.stopKinds = DEFAULT_STOP_KINDS.map((k) => Object.assign({}, k));
    if (!db.stopKinds.some((k) => k.id === 'other')) db.stopKinds.push(Object.assign({}, OTHER_KIND));

    /* Trips predate the three kinds, so a stored row that says nothing is a
       trip. Its status is read off its dates once, here, and is a stored
       field from then on — the app stops guessing the moment you set it. */
    db.trips.forEach((t) => {
        if (!t.kind) t.kind = 'trip';
        if (!t.status) t.status = statusFromDates(t);
        /* And a dated status that the calendar has moved past is corrected
           here, once, so the file an Export writes says what is true. */
        t.status = liveStatus(t);
        if (typeof t.type !== 'string') t.type = '';
    });

    /* Same call as every other list of rows-not-a-schema: fill the defaults
       once, and leave a list somebody has emptied on purpose empty. */
    if (!db.spendCats.length) db.spendCats = DEFAULT_SPEND_CATS.map((c) => Object.assign({}, c));

    /* Only the overall budget is old. The other three are simply not set
       on a trip written before them, which is what "not measured" is. */
    db.trips.forEach((t) => { if (!t.catBudget || typeof t.catBudget !== 'object') t.catBudget = {}; });

    /* People are named on the Expenses screen, so a trip written before
       that screen existed simply has none. A role and an attendance mark
       used to hang off each of them; both are gone, and a store written
       while they existed keeps its values harmlessly — nothing reads them. */
    db.trips.forEach((t) => { if (!Array.isArray(t.people)) t.people = []; });

    /* Stops predate their status, and one that says nothing is still on. */

    if (!db.homeCountry) db.homeCountry = 'MY';
    if (!db.trips.some((t) => t.id === db.current)) db.current = db.trips.length ? db.trips[0].id : null;
}

function save() {
    db.saved = new Date().toISOString();
    keep(KEY, JSON.stringify(db));
    paintStamp();

    /* A no-op unless the Drive switch is on. save() knows nothing about
       Google beyond the fact that something might want telling. */
    if (typeof window.PSDriveTouch === 'function') window.PSDriveTouch();
}

function paintStamp() {
    if (!db.saved) return set('saveStamp', '');
    const d = new Date(db.saved);
    set('saveStamp', 'Saved ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
}

/* Ids only have to be unique inside one browser's store, so a counter off
   the clock is enough and stays readable in an exported file. */
let idSeq = 0;
const newId = (prefix) => prefix + '-' + Date.now().toString(36) + '-' + (idSeq++).toString(36);

const trip = () => db.trips.find((t) => t.id === db.current) || null;
const mine = (list) => list.filter((row) => row.trip === db.current);

/** Home is about whatever is next rather than whatever is open, so its own
    painters ask for a trip instead of assuming the current one. */
const ofTripSpend = (t) => db.spend.filter((x) => t && x.trip === t.id);
const ofTrip = (list, t) => list.filter((r) => t && r.trip === t.id);

/* ====================================================================
   THE DATE FIELD

   A native <input type="date"> draws itself in the browser's locale, not
   the page's: the same field reads 08/21/2026 on a machine set to the US
   and 21/08/2026 on one set to Malaysia, and nothing the page can say
   moves it — the lang attribute is ignored, and there is no CSS for it.
   An app that has one date format cannot leave that to a setting nobody
   knows they have, so the native control is swapped at boot for a text
   field that reads dd-mm-yyyy for everybody, with the month grid this
   app was already drawing put behind the button beside it.

   The swap happens here rather than in the markup so the ISO value keeps
   the id it always had. Every $('stopDate').value in this file still
   reads and writes 'YYYY-MM-DD' and never learns any of this — the
   accessor below is what keeps the two in step, because assigning to
   .value is how the rest of the app fills a form and it fires no event.
   ==================================================================== */
const NATIVE_VALUE = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

const WEEK_MARKS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** Reads back what somebody typed. Forgiving about the separator and about
    a short year, strict about the order — dd-mm-yyyy is the whole point. */
function parseTyped(text) {
    const bits = String(text || '').trim().match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})$/);
    if (!bits) return '';
    let year = Number(bits[3]);
    if (year < 100) year += year < 70 ? 2000 : 1900;
    const iso = String(year).padStart(4, '0')
        + '-' + String(Number(bits[2])).padStart(2, '0')
        + '-' + String(Number(bits[1])).padStart(2, '0');
    /* A Date accepts the 31st of February and rolls it into March. Round-
       tripping it is how you find out that is what just happened. */
    const back = asDate(iso);
    return back && isoOf(back) === iso ? iso : '';
}

function upgradeDateFields() {
    document.querySelectorAll('input[type="date"]').forEach(makeDateField);
}

function makeDateField(el) {
    const id = el.id;
    const wrap = document.createElement('div');
    wrap.className = 'date-field';

    const text = document.createElement('input');
    text.type = 'text';
    text.className = 'date-text';
    text.id = id + 'Text';
    text.placeholder = 'dd-mm-yyyy';
    text.autocomplete = 'off';
    text.inputMode = 'numeric';
    text.maxLength = 10;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'date-open';
    btn.tabIndex = -1;
    btn.setAttribute('aria-label', 'Pick from a calendar');
    btn.innerHTML = '<i class="bi bi-calendar3"></i>';

    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(text);
    wrap.appendChild(btn);
    wrap.appendChild(el);
    el.type = 'hidden';

    /* The label has to point at the field somebody can actually click into,
       and the hidden one keeps the id everything else calls it by. */
    const lab = document.querySelector('label[for="' + id + '"]');
    if (lab) lab.setAttribute('for', text.id);
    else text.setAttribute('aria-label', 'Date');

    Object.defineProperty(el, 'value', {
        configurable: true,
        get() { return NATIVE_VALUE.get.call(this); },
        set(v) {
            NATIVE_VALUE.set.call(this, v || '');
            text.value = v ? fmtNum(v) : '';
            if (datePop && datePop.iso === this) paintDatePop();
        },
    });

    /* Typing writes through as soon as it is a date, so Enter-to-save picks
       up what is on screen without waiting for a blur that never comes. */
    text.addEventListener('input', () => {
        NATIVE_VALUE.set.call(el, parseTyped(text.value));
    });

    /* Leaving tidies: 1-9-26 comes back as 01-09-2026, and something that
       never was a date is cleared rather than left sitting there. */
    text.addEventListener('blur', () => {
        const iso = parseTyped(text.value);
        NATIVE_VALUE.set.call(el, iso);
        text.value = iso ? fmtNum(iso) : '';
    });

    btn.addEventListener('click', () => toggleDatePop(el, wrap));

    text.value = fmtNum(NATIVE_VALUE.get.call(el)).replace('—', '');
}

/* --------------------------------------------------------------------
   The month grid behind the button
   -------------------------------------------------------------------- */
let datePop = null;

function closeDatePop() {
    if (!datePop) return;
    datePop.el.remove();
    datePop = null;
}

function toggleDatePop(iso, wrap) {
    const same = datePop && datePop.iso === iso;
    closeDatePop();
    if (same) return;

    const el = document.createElement('div');
    el.className = 'date-pop';
    datePop = { el, iso, cursor: iso.value || today() };
    wrap.appendChild(el);
    paintDatePop();
}

function paintDatePop() {
    if (!datePop) return;

    const first = datePop.cursor.slice(0, 8) + '01';
    const d = asDate(first);
    if (!d) return;

    /* Monday-first, like the calendar screen: getDay() calls Sunday 0. */
    const lead = (d.getDay() + 6) % 7;
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const picked = datePop.iso.value;
    const now = today();

    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<span></span>';
    for (let i = 1; i <= days; i++) {
        const iso = first.slice(0, 8) + String(i).padStart(2, '0');
        const mark = iso === picked ? ' class="is-on"' : (iso === now ? ' class="is-now"' : '');
        cells += '<button type="button"' + mark + ' data-pick-day="' + iso + '">' + i + '</button>';
    }

    datePop.el.innerHTML =
        '<div class="dp-head">'
        +   '<button type="button" class="dp-step" data-pick-step="-1" aria-label="Previous month">'
        +     '<i class="bi bi-chevron-left"></i></button>'
        +   '<b>' + esc(fmtMonth(first)) + '</b>'
        +   '<button type="button" class="dp-step" data-pick-step="1" aria-label="Next month">'
        +     '<i class="bi bi-chevron-right"></i></button>'
        + '</div>'
        + '<div class="dp-week">' + WEEK_MARKS.map((w) => '<span>' + w + '</span>').join('') + '</div>'
        + '<div class="dp-grid">' + cells + '</div>'
        + '<div class="dp-foot">'
        +   '<button type="button" class="dp-act" data-pick-day="' + now + '">Today</button>'
        +   '<button type="button" class="dp-act" data-pick-clear="1">Clear</button>'
        + '</div>';
}

function wireDatePop() {
    document.addEventListener('click', (event) => {
        const inside = event.target.closest('.date-pop');
        if (!inside) {
            /* The button has its own listener and would reopen what this
               closes, so it is the one click left alone. */
            if (!event.target.closest('.date-open')) closeDatePop();
            return;
        }
        if (!datePop) return;

        const step = event.target.closest('[data-pick-step]');
        if (step) {
            datePop.cursor = shiftMonth(datePop.cursor, Number(step.dataset.pickStep));
            return paintDatePop();
        }

        const day = event.target.closest('[data-pick-day]');
        if (day) {
            datePop.iso.value = day.dataset.pickDay;
            return closeDatePop();
        }

        if (event.target.closest('[data-pick-clear]')) {
            datePop.iso.value = '';
            closeDatePop();
        }
    });
}

/* ====================================================================
   CARDS THAT FOLD

   Ten of these screens carry a card you are not reading: a form for
   adding the next thing, or a list of the words this app files things
   under. Both matter and neither is what you came to the screen for, and
   an "Add a stop" form standing open above the plan is 400px of empty
   fields between you and the plan.

   So they fold, and they start folded. What is on the screen when you
   arrive is what the screen is about; the rest is one press away and
   stays where you put it, because somebody adding six stops in a row
   should not have to open the same form six times.

   The mark-up is untouched — a `data-fold` on the section is the whole
   contract, and the chevron is put into the head from here.
   ==================================================================== */
const FOLD_KEY = 'plansphere.folded.v1';

let folded = {};

function foldLoad() {
    try { folded = JSON.parse(localStorage.getItem(FOLD_KEY)) || {}; }
    catch (err) { folded = {}; }
}

function foldSave() {
    try { localStorage.setItem(FOLD_KEY, JSON.stringify(folded)); } catch (err) { /* not vital */ }
}

/** Folded unless this browser has been told otherwise. */
const isShut = (key) => folded[key] !== false;

function foldInit() {
    foldLoad();

    document.querySelectorAll('[data-fold]').forEach((card) => {
        const key = card.dataset.fold;
        const head = card.querySelector('.card-head');
        if (!head) return;

        let acts = head.querySelector('.card-actions');
        if (!acts) {
            acts = document.createElement('div');
            acts.className = 'card-actions';
            /* Whatever was sitting loose in the head — usually a count —
               moves in with it, so the chevron is not orphaned. */
            [...head.children].forEach((el) => { if (el.tagName !== 'H2') acts.appendChild(el); });
            head.appendChild(acts);
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fold-btn';
        btn.dataset.foldToggle = key;
        btn.innerHTML = '<i class="bi bi-chevron-down"></i>';
        acts.appendChild(btn);

        paintFold(key);
    });
}

function paintFold(key) {
    const card = document.querySelector('[data-fold="' + key + '"]');
    if (!card) return;
    const shut = isShut(key);
    card.classList.toggle('is-shut', shut);
    const btn = card.querySelector('[data-fold-toggle]');
    if (btn) {
        btn.setAttribute('aria-expanded', shut ? 'false' : 'true');
        btn.title = shut ? 'Show this' : 'Hide this';
    }
}

function foldSet(key, shut) {
    folded[key] = shut;
    foldSave();
    paintFold(key);
}

/** Opening a record for editing has to open the form it lands in, or the
    fields are filled in behind a closed lid. */
function unfold(key) {
    if (isShut(key)) foldSet(key, false);
}

/* --------------------------------------------------------------------
   Clear, and Cancel

   Two different things, so two buttons.

   **Clear** empties what you typed and leaves you where you are. On a
   fresh form that is the whole of it; part-way through editing something
   it blanks the fields without letting go of the record, so you can type
   the whole thing again over the top of itself.

   **Cancel** is about the act rather than the contents: it abandons the
   add or the edit. On the five forms that appear when you press Add, it
   closes the card. On the three that stand open on their screen there is
   nothing to close, so it means "stop editing this one and go back to
   adding" — which is why it is the button that comes and goes, and Clear
   is the one that is always there.

   The packing form has no edit mode at all: three fields and a tick. It
   gets a Clear and nothing to cancel.
   -------------------------------------------------------------------- */
function setCancelBtn(id, editing) {
    const btn = $(id);
    if (btn) btn.hidden = !editing;
}

/* ====================================================================
   NAVIGATION

   The sidebar is a column on a desktop and a drawer on a phone, and one
   button drives both. Which job it is doing is a question of width, so
   it is asked at the moment of the click rather than stored.
   ==================================================================== */
const NAV_KEY = 'plansphere.nav.v1';
const navIsDrawer = () => window.matchMedia('(max-width: 1000px)').matches;

function paintNav() {
    const app = document.querySelector('.app');
    const btn = $('navToggle');
    const scrim = $('navScrim');
    if (!app || !btn) return;

    const drawer = navIsDrawer();
    const open = app.classList.contains('is-open');
    const rail = app.classList.contains('is-rail');

    if (scrim) scrim.hidden = !(drawer && open);
    btn.setAttribute('aria-expanded', String(drawer ? open : !rail));

    /* A drawer opens and shuts; a column slides one way or the other. On
       the desktop the button is a 26px circle on the sidebar's edge with
       no room for a word, so the chevron points where that edge is about
       to go and the word survives as the accessible name. */
    const icon = btn.querySelector('i');
    if (icon) {
        icon.className = 'bi ' + (drawer
            ? (open ? 'bi-x-lg' : 'bi-list')
            : (rail ? 'bi-chevron-double-right' : 'bi-chevron-double-left'));
    }

    const label = drawer ? (open ? 'Close' : 'Menu') : rail ? 'Expand' : 'Collapse';
    set('navToggleLabel', label);
    btn.title = drawer ? (open ? 'Close the menu' : 'Menu') : label + ' the sidebar';
}

function toggleNav() {
    const app = document.querySelector('.app');
    if (!app) return;

    if (navIsDrawer()) {
        app.classList.toggle('is-open');
    } else {
        app.classList.toggle('is-rail');
        try { localStorage.setItem(NAV_KEY, app.classList.contains('is-rail') ? 'rail' : 'full'); }
        catch (err) { /* storage unavailable — the session still works */ }
    }
    paintNav();
}

function closeDrawer() {
    const app = document.querySelector('.app');
    if (!app) return;
    app.classList.remove('is-open');
    paintNav();
}

function loadNav() {
    const app = document.querySelector('.app');
    if (!app) return;
    let saved = null;
    try { saved = localStorage.getItem(NAV_KEY); } catch (err) { saved = null; }
    app.classList.toggle('is-rail', saved === 'rail');
    paintNav();
}

/* ====================================================================
   MODULES
   ==================================================================== */
/* In the order the flow runs — home, calendar, the thing itself, its
   days, its money, what that was measured against, and the sum of it —
   then the three screens that answer to one of those rather than being
   one of them. */
const MODULES = {
    dash:   renderDash,
    cal:    renderCal,
    trips:  renderTrips,
    plan:   renderPlan,
    spend:  renderSpend,
    budget: renderBudget,
    sum:    renderSum,
    book:   renderBook,
    conv:   renderConv,
    pack:   renderPack,
};

const SAVE_BTNS = ['actSave', 'tripSave', 'stopSave', 'bookSave', 'spendSave', 'packSave'];

/* Home is where the app opens: "what have I got on" is the question
   people arrive with, and it is the one screen that answers it without
   adding anything up.

   Which makes it the one screen that must not be about whichever record
   you last had open. It was: `db.current` is a pointer left behind by the
   last thing you clicked, so Home would greet you with an event that
   finished last week while three trips sat upcoming behind it. Arriving
   at Home now moves that pointer to whatever is actually next — the
   thing that is running, or the soonest thing that is not. */
function focusNext() {
    if (!db.trips.length) return;
    /* Same order the shelf reads in: happening now, then soonest, then
       most recently finished, then the undated. */
    const near = db.trips.slice().sort(sortNearest)[0];
    if (near && near.id !== db.current) {
        db.current = near.id;
        save();
    }
}
let live = 'dash';

function showModule(key) {
    if (!MODULES[key]) return;
    /* The six sub-screens are not sidebar destinations, so arriving at one
       means arriving at the record that owns it. */
    if (SUBS[key]) { subTab = key; live = 'trips'; } else { live = key; }

    /* Walking in the front door re-points the app at what is next. Only on
       the way in — not on every repaint, or a Home left open would move
       under somebody mid-read. */
    if (live === 'dash') focusNext();

    /* Leaving Activities closes whatever was open in it: coming back to the
       Calendar and then to Activities should show the shelf, not the middle
       of somebody's budget. */
    if (live !== 'trips') openRec = false;

    const shown = liveSection();
    Object.keys(MODULES).forEach((id) => {
        const section = $('module-' + id);
        if (section) section.hidden = id !== shown;
    });

    document.querySelectorAll('#tabs button').forEach((btn) => {
        btn.classList.toggle('is-on', btn.dataset.module === live);
    });

    paintRecBar();
    MODULES[shown]();

    /* A new screen starts at its top. Landing halfway down one because that
       is where you left the last one is the other half of "I had to scroll
       up to get out of here". Instant rather than smooth: the handful of
       flows that open a form scroll it into view straight after this, and
       two animations racing is one of them losing. */
    window.scrollTo(0, 0);
}

/** Whatever is on screen, plus the two things that are always on screen. */
function repaint() {
    paintRecBar();
    paintCounts();
    MODULES[liveSection()]();
}

/* ====================================================================
   A RECORD, AND THE SIX QUESTIONS ABOUT IT

   The itinerary, the expenses, the budget, the summary, the bookings and
   the packing list are not six screens. They are six things you can ask
   about one trip, and they have no meaning at all until a trip is named
   — which is why they spent three revisions of this app failing to say
   whose figures they were showing, first from a <select> in the top bar,
   then from a bar of chips.

   So they came out of the sidebar. The sidebar now holds the four things
   that stand on their own — Home, Calendar, Activities, Convert — and
   the six live inside a record: open one from the shelf and they appear
   as its tabs, with a way back out.

   The bar is the first thing in <main> rather than inside any module,
   because the module it belongs to is whichever one is on screen, and
   tabs printed underneath their own content are not tabs.
   ==================================================================== */
const SUBS = {
    plan:   'Itinerary',
    spend:  'Expenses',
    budget: 'Budget',
    sum:    'Summary',
    book:   'Bookings',
    pack:   'Packing',
};

let openRec = false;
let subTab = 'plan';

/** Opening from anywhere — a tile on the shelf, a stop clicked on the
    calendar — is the same act. */
function openTrip(id, sub) {
    db.current = id;
    openRec = true;
    if (sub && SUBS[sub]) subTab = sub;
    save();
    clearStopForm();
    clearBookForm();
    showModule('trips');
}

function closeRec() {
    openRec = false;
    showModule('trips');
}

/** Which section is actually on screen: a sub-screen while a record is
    open, and whatever the sidebar last chose when it is not. */
const liveSection = () => (openRec && trip() ? subTab : live);

/* Which of the three palettes the page is wearing. A record you have opened
   turns the whole app its colour, and Home takes the colour of whatever it
   is showing you — the screens that are about no one record (the shelf, the
   calendar, the converter) stay on Trip, which is the default. */
function paintKin() {
    const t = trip();
    const inside = (openRec && t) || (live === 'dash' && t);
    document.documentElement.dataset.kin = inside ? (t.kind || 'trip') : 'trip';
}

function paintRecBar() {
    paintKin();
    const t = trip();
    const open = openRec && !!t && live === 'trips';
    const bar = $('recBar');
    if (bar) bar.hidden = !open;
    if (!open) return;

    const kin = kinOf(t.kind);
    set('recBarName', kin.mark + '  ' + (t.name || 'Untitled ' + kin.label.toLowerCase()));
    set('recBarWhen', t.from
        ? (kin.span && t.to && t.to !== t.from ? fmtRange(t.from, t.to) : fmtNum(t.from))
        : 'No dates yet');

    document.querySelectorAll('#recSubs button').forEach((btn) => {
        btn.classList.toggle('is-on', btn.dataset.sub === subTab);
    });

    /* The heading repeats the name, because a heading is what gets read on
       the way down a long page and the bar has scrolled off by then. */
    const tail = ' — ' + (t.name || 'Untitled');
    [['planTitle', 'The plan'], ['spendTitle', 'Expenses'],
     ['budgetTitle', 'Where the budget stands'], ['sumTitle', 'At a glance']]
        .forEach(([id, base]) => { if ($(id)) set(id, base + tail); });
}

/** A count on a nav row, hidden rather than zeroed — a 0 is furniture. */
function paintCounts() {
    const now = today();
    const onToday = calItems().filter((it) => (it.span ? now >= it.date && now <= it.until : it.date === now)).length;

    const rows = [
        ['countToday', onToday],
        ['countTrips', db.trips.length],
        ['countStops', mine(db.stops).length],
        ['countBookings', mine(db.books).length],
        ['countSpend', mine(db.spend).length],
        ['countPack', mine(db.packs).filter((p) => !p.done).length],
    ];
    rows.forEach(([id, n]) => {
        const el = $(id);
        if (!el) return;
        el.hidden = !n;
        el.textContent = n;
    });
}

/* ====================================================================
   MODULE 01 · HOME DASHBOARD

   What is happening, and nothing else: the countdown, the next few
   stops, what is still unpaid, how far the packing has got, and what is
   left to settle. The five things somebody opens the app to check.

   Everything that has to be added up is one screen along, in Summary &
   Analytics. Splitting them is the difference between a screen you can
   read at a glance and one you have to work through.
   ==================================================================== */

/** What a trip costs so far, split into what is committed and what is not. */
function tally(t) {
    if (!t) return { paid: 0, held: 0, idea: 0, stops: 0, spent: 0, budget: 0 };
    const books = mine(db.books);
    const sum = (status) => books.filter((b) => b.status === status).reduce((n, b) => n + homeOf(b, t), 0);
    return {
        paid: sum('paid'),
        held: sum('held'),
        idea: sum('idea'),
        /* Cancelled and skipped stops are still on the page, because they
           are the reason a day is free — but they are not money owed. */
        stops: plannedOf(t),
        spent: spentOf(t),
        budget: t.budget || 0,
    };
}

function renderDash() {
    const t = trip();

    if (!t) {
        set('dashTripName', 'Nothing planned yet');
        set('dashRange', '—');
        set('dashLabel', 'Nothing planned');
        set('dashCount', '—');
        set('dashFoot', 'Create a trip and every other screen wakes up.');
        set('dashStops', '0');
        set('dashStopsFoot', '—');
        set('dashLeft', 'RM 0');
        set('dashLeftFoot', '—');
        ['dashNext', 'dashSpend', 'dashPlan', 'dashBreak'].forEach((id) =>
            html(id, emptyState('bi-compass', 'Nothing open',
                'Open Activities and create one — it takes a name and two dates.')));
        return;
    }

    const now = today();
    const kin = kinOf(t.kind);
    const out = daysBetween(now, t.from);
    const back = daysBetween(now, t.to);
    const length = daysBetween(t.from, t.to);
    const sums = tally(t);

    set('dashTripName', kin.mark + '  ' + (t.name || 'Untitled ' + kin.label.toLowerCase()));
    set('dashRange', fmtRange(t.from, t.to));

    /* Three states, three headlines. The middle one is the one people open
       the app for while they are actually away. */
    if (out !== null && out > 0) {
        set('dashLabel', kin.span ? 'Departs in' : 'Happens in');
        set('dashCount', plural(out, 'day'));
        set('dashFoot', (t.where ? t.where + ' · ' : '')
            + (length !== null ? plural(length + 1, 'day') + ' long' : ''));
    } else if (back !== null && back >= 0) {
        const dayN = daysBetween(t.from, now) + 1;
        set('dashLabel', 'Happening now');
        set('dashCount', length ? 'Day ' + dayN + ' of ' + (length + 1) : 'Today');
        set('dashFoot', (back ? plural(back, 'day') + ' left · ' : '') + (t.where || ''));
    } else {
        set('dashLabel', 'Done');
        set('dashCount', back === null ? '—' : plural(Math.abs(back), 'day') + ' ago');
        set('dashFoot', 'This one is over. The plan stays for the next.');
    }

    const stops = mine(db.stops);
    set('dashStops', String(stops.length));
    const dayCount = new Set(stops.map((s) => s.date)).size;
    set('dashStopsFoot', stops.length
        ? plural(dayCount, 'day') + ' with something in it'
        : 'Nothing on the itinerary yet');

    const left = sums.budget - sums.spent;
    set('dashLeft', money(left));
    set('dashLeftFoot', sums.budget
        ? money(sums.spent) + ' of ' + money(sums.budget) + ' spent'
        : 'No budget set');

    paintNext(stops, now);
    paintDashSpend(t);
    paintDashPlan(t, now);
    paintDashBreak(t);
}

/* ====================================================================
   MODULE 06 · SUMMARY & ANALYTICS

   Everything that has to be added up. It reads every module and writes
   to none of them, which is what makes it safe to state every figure in
   the app on one page.

   Nothing here does its own arithmetic: the spend comes from `spentOf`,
   the shares from `balances`, the plan from `plannedOf`. A summary that
   adds things up its own way is a summary that will eventually disagree
   with the app, and the app will be right.
   ==================================================================== */
function renderSum() {
    const t = trip();

    if (!t) {
        set('sumHeadNote', '');
        $('sumEventCard').hidden = true;
        ['sumTop', 'sumSpend', 'sumStats', 'sumPeople'].forEach((id) =>
            html(id, emptyState('bi-bar-chart', 'Nothing open',
                'Open Activities and create one — there is nothing to add up yet.')));
        return;
    }

    const sums = tally(t);
    const length = daysBetween(t.from, t.to);

    paintSumTop(t, sums, length);
    paintSumEvent(t, sums);
    paintSumSpend(t, sums);
    paintSumStats(t, sums, length);
    paintSumPeople(t);
}

/* --------------------------------------------------------------------
   The five figures the spec opens with
   -------------------------------------------------------------------- */
function paintSumTop(t, sums, length) {
    const kin = kinOf(t.kind);
    const days = length === null ? 0 : length + 1;
    const heads = headsOf(t);
    const ty = typeOf(t.type);
    const left = sums.budget - sums.spent;

    set('sumHeadNote', [ty && ty.label + ' ' + kin.label, statusOf(liveStatus(t)).label]
        .filter(Boolean).join(' · '));

    html('sumTop', '<div class="dash-figures">'
        + figure('Duration', days ? plural(days, 'day') : '—',
            t.from ? fmtRange(t.from, t.to) : 'no dates set')
        + figure(kin.scope === 'event' ? 'Participants' : 'Members', String(heads),
            peopleOf(t).length ? peopleOf(t).length + ' named' : 'nobody named yet')
        + figure('Budget', sums.budget ? money(sums.budget) : '—',
            sums.budget ? money(Math.round(sums.budget / heads)) + ' a head' : 'not set')
        + figure('Spent', money(sums.spent),
            plural(mine(db.spend).length, 'expense') + ' recorded')
        + figure(left < 0 ? 'Over by' : 'Remaining',
            sums.budget ? money(Math.abs(left)) : '—',
            sums.budget ? Math.round(sums.spent / sums.budget * 100) + '% of it gone' : 'set a budget')
        + '</div>');
}

/** Named people if there are any, the typed count if not. */
function headsOf(t) {
    return Math.max(1, peopleOf(t).length || Number(t.who) || 1);
}

/* --------------------------------------------------------------------
   Event analytics

   Only for an event or an activity. On a trip everybody is coming, so
   attendance is not a question and a card asking it is furniture.
   -------------------------------------------------------------------- */
function paintSumEvent(t, sums) {
    const kin = kinOf(t.kind);
    const people = peopleOf(t);
    $('sumEventCard').hidden = kin.scope !== 'event' || !people.length;
    if ($('sumEventCard').hidden) return;

    /* Attendance used to split this: cost over the people who came rather
       than over the people who signed up. Nobody is marked any more, so the
       roster is the only answer and it is the honest one. */
    set('sumEventNote', plural(people.length, 'person', 'people') + ' named');

    html('sumEvent', '<div class="dash-figures">'
        + figure('Budget', sums.budget ? money(sums.budget) : '—',
            sums.budget ? '' : 'not set')
        + figure('Actual', money(sums.spent),
            plural(mine(db.spend).length, 'expense'))
        + figure('People', String(people.length), 'on the list')
        + figure('Cost / person', money(Math.round(sums.spent / people.length)), 'across the list')
        + '</div>');
}

/* --------------------------------------------------------------------
   Expense breakdown

   By expense category, because that is what an expense is filed under.
   It used to be by itinerary kind, which was the only grouping the app
   had before there was a ledger — and grouping money by the shape of the
   plan rather than by what it was spent on answered a question nobody
   was asking.
   -------------------------------------------------------------------- */
function paintSumSpend(t, sums) {
    const bag = {};
    mine(db.spend).forEach((x) => {
        const c = spendCatOf(x.cat);
        bag[c.id] = (bag[c.id] || 0) + homeOf({ cost: x.amount, cur: x.cur }, t);
    });

    const rows = db.spendCats.filter((c) => bag[c.id])
        .map((c) => ({ c, sen: bag[c.id] }))
        .sort((a, b) => b.sen - a.sen);
    const total = rows.reduce((n, r) => n + r.sen, 0);

    if (!total) {
        set('sumSpendNote', '');
        return html('sumSpend', emptyState('bi-pie-chart', 'Nothing spent yet',
            'Record an expense and the breakdown fills in.'));
    }

    const budget = sums.budget;
    const over = budget && total > budget;
    set('sumSpendNote', budget
        ? (over ? money(total - budget) + ' over' : money(budget - total) + ' left')
        : money(total) + ' spent');

    /* Drawn against the budget where there is one, so the empty part of the
       track is money still unspent rather than dead space. Without a budget
       it is drawn against itself and reads as a split. */
    const scale = budget && !over ? budget : total;

    html('sumSpend', ''
        + '<div class="dist">'
        +   rows.map((r) => '<i style="width:' + (r.sen / scale * 100).toFixed(2) + '%;'
                + 'background:var(' + TONES[r.c.tone || 'slate'][0] + ')"></i>').join('')
        + '</div>'
        + '<div class="break-rows">'
        +   rows.map((r) => '<div class="break-row" style="' + tone(r.c) + '">'
                + '<span class="dot"></span>'
                + '<span class="br-name">' + r.c.mark + ' ' + esc(r.c.label) + '</span>'
                + '<span class="br-val">' + money(r.sen) + '</span>'
                + '<span class="br-pct">' + Math.round(r.sen / total * 100) + '%</span>'
                + '</div>').join('')
        +   (budget && !over
                ? '<div class="break-row is-idle"><span class="dot" style="background:var(--track-2)"></span>'
                    + '<span class="br-name">Unspent</span>'
                    + '<span class="br-val">' + money(budget - total) + '</span>'
                    + '<span class="br-pct">' + Math.round((budget - total) / budget * 100) + '%</span></div>'
                : '')
        + '</div>');
}

/* --------------------------------------------------------------------
   The eight statistics
   -------------------------------------------------------------------- */
function paintSumStats(t, sums, length) {
    const cur = t.home || 'MYR';
    const spends = mine(db.spend);
    const days = length === null ? 0 : length + 1;

    if (!spends.length) {
        set('sumStatNote', '');
        return html('sumStats', emptyState('bi-graph-up', 'Nothing to measure yet',
            'The first expense fills every figure on this card.'));
    }

    /* Averaged over the days money was actually spent, not over the length
       of the trip — three days in and a ten-day average reads as though
       the trip is going well when it has barely started. */
    const live = new Set(spends.map((x) => x.date).filter(Boolean)).size || 1;
    const perDay = Math.round(sums.spent / live);

    const biggest = spends.slice().sort((a, b) =>
        homeOf({ cost: b.amount, cur: b.cur }, t) - homeOf({ cost: a.amount, cur: a.cur }, t))[0];

    const bag = {};
    spends.forEach((x) => {
        const c = spendCatOf(x.cat);
        bag[c.id] = (bag[c.id] || 0) + homeOf({ cost: x.amount, cur: x.cur }, t);
    });
    const topCat = Object.keys(bag).sort((a, b) => bag[b] - bag[a])[0];
    const cat = topCat ? spendCatOf(topCat) : null;

    const planned = sums.stops;
    const gap = sums.spent - planned;
    const heads = headsOf(t);

    set('sumStatNote', plural(spends.length, 'expense') + ' over ' + plural(live, 'day'));

    html('sumStats', '<div class="dash-figures">'
        + figure('Total spending', money(sums.spent),
            plural(spends.length, 'expense') + ' recorded')
        + figure('Average a day', money(perDay),
            'over ' + live + (days ? ' of ' + days : '') + ' days with spending')
        + figure('Highest expense', moneyIn(homeOf({ cost: biggest.amount, cur: biggest.cur }, t), cur),
            biggest.merchant || 'Unnamed')
        + figure('Highest category', cat ? money(bag[topCat]) : '—',
            cat ? cat.mark + ' ' + cat.label + ' · ' + Math.round(bag[topCat] / sums.spent * 100) + '%' : '')
        + figure('Budget used', sums.budget ? Math.round(sums.spent / sums.budget * 100) + '%' : '—',
            sums.budget ? money(sums.budget - sums.spent) + ' left' : 'no budget set')
        + figure('Planned vs actual', planned ? money(planned) : '—',
            planned
                ? (gap > 0 ? money(gap) + ' more than planned'
                    : money(-gap) + ' less than planned')
                : 'nothing priced on the itinerary')
        + figure('Cost per person', money(Math.round(sums.spent / heads)),
            'across ' + plural(heads, 'person', 'people'))
        + '</div>');
}

/* Whose money it was. The share, not what they paid — the split decides
   what somebody used, and the Settlement squares up who is out of pocket. */
function paintSumPeople(t) {
    const rows = balances(t).filter((r) => r.share || r.paid);

    if (!rows.length) {
        set('sumPeopleNote', '');
        return html('sumPeople', emptyState('bi-people', 'Nothing split yet',
            'Split an expense between people and their shares appear here.'));
    }

    rows.sort((a, b) => b.share - a.share);
    const total = rows.reduce((n, r) => n + r.share, 0) || 1;
    const top = rows[0].share || 1;
    set('sumPeopleNote', plural(rows.length, 'person', 'people'));

    html('sumPeople', '<div class="break-rows">' + rows.map((r) => ''
        + '<div class="break-row is-wide-row">'
        +   '<span class="person-mark is-sm">' + esc(initials(r.person.name)) + '</span>'
        +   '<span class="br-name">' + esc(r.person.name) + '</span>'
        +   '<span class="bb-track br-bar"><span class="bb-fill" style="width:'
        +     (r.share / top * 100).toFixed(1) + '%"></span></span>'
        +   '<span class="br-val">' + money(r.share) + '</span>'
        +   '<span class="br-pct">' + Math.round(r.share / total * 100) + '%</span>'
        + '</div>').join('') + '</div>');
}

/** The next few things due, whether that is tomorrow or in a month. */
function paintNext(stops, now) {
    const soon = stops
        .filter((s) => s.date >= now)
        .sort(sortStops)
        .slice(0, 5);

    set('dashNextNote', soon.length ? plural(soon.length, 'stop') : '');

    if (!soon.length) {
        return html('dashNext', emptyState('bi-signpost-2',
            'Nothing coming up', 'Every stop on the itinerary is behind you.'));
    }

    html('dashNext', soon.map((s) => ''
        + '<div class="line-row">'
        +   disc(s.kind)
        +   '<div class="line-meta"><div class="line-name">' + esc(s.title) + '</div>'
        +     '<small class="line-sub">' + fmtDay(s.date) + (s.time ? ' · ' + fmtTime(s.time) : '')
        +     (s.where ? ' · ' + esc(s.where) : '') + '</small></div>'
        +   '<div class="line-figures"><div class="line-figure">'
        +     (s.cost ? amount(s.cost, s.cur, trip()) : '<span class="is-muted">—</span>')
        +   '</div></div>'
        + '</div>').join(''));
}

/** Where it went, in the categories the Summary screen uses — the one
    figure the hero cannot carry, because a total says how much and this
    says what on. */
function paintDashBreak(t) {
    const bag = {};
    ofTripSpend(t).forEach((x) => {
        const c = spendCatOf(x.cat);
        bag[c.id] = (bag[c.id] || 0) + homeOf({ cost: x.amount, cur: x.cur }, t);
    });

    const rows = db.spendCats.filter((c) => bag[c.id])
        .map((c) => ({ c, sen: bag[c.id] }))
        .sort((a, b) => b.sen - a.sen);
    const total = rows.reduce((n, r) => n + r.sen, 0);

    if (!total) {
        set('dashBreakNote', '');
        return html('dashBreak', emptyState('bi-pie-chart', 'Nothing to add up yet',
            'The first expense fills this in.'));
    }

    const budget = t.budget || 0;
    const over = budget && total > budget;
    set('dashBreakNote', budget
        ? (over ? money(total - budget) + ' over' : money(budget - total) + ' left')
        : money(total) + ' spent');

    /* Against the budget where there is one, so the empty part of the bar is
       money still unspent rather than dead space. */
    const scale = budget && !over ? budget : total;

    /* Five at most: this is a card in a deck, not the Summary screen. */
    const top = rows.slice(0, 5);
    const rest = rows.slice(5).reduce((n, r) => n + r.sen, 0);

    html('dashBreak', ''
        + '<div class="dist">'
        +   rows.map((r) => '<i style="width:' + (r.sen / scale * 100).toFixed(2) + '%;'
                + 'background:var(' + TONES[r.c.tone || 'slate'][0] + ')"></i>').join('')
        + '</div>'
        + '<div class="break-rows">'
        +   top.map((r) => '<div class="break-row" style="' + tone(r.c) + '">'
                + '<span class="dot"></span>'
                + '<span class="br-name">' + r.c.mark + ' ' + esc(r.c.label) + '</span>'
                + '<span class="br-val">' + money(r.sen) + '</span>'
                + '<span class="br-pct">' + Math.round(r.sen / total * 100) + '%</span>'
                + '</div>').join('')
        +   (rest
                ? '<div class="break-row is-idle"><span class="dot" style="background:var(--track-2)"></span>'
                    + '<span class="br-name">' + plural(rows.length - top.length, 'other') + '</span>'
                    + '<span class="br-val">' + money(rest) + '</span>'
                    + '<span class="br-pct">' + Math.round(rest / total * 100) + '%</span></div>'
                : '')
        + '</div>');
}

function paintDashSpend(t) {
    const all = ofTripSpend(t);
    const spent = all.reduce((n, x) => n + homeOf({ cost: x.amount, cur: x.cur }, t), 0);

    set('dashSpendNote', all.length ? plural(all.length, 'expense') + ' \u00b7 ' + money(spent) : '');

    if (!all.length) {
        return html('dashSpend', emptyState('bi-cash-coin', 'Nothing spent yet',
            'Every receipt, every fare, every round goes on the Expenses tab.'));
    }

    const recent = all.slice()
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 5);

    html('dashSpend', recent.map((x) => {
        const c = spendCatOf(x.cat);
        const who = x.by ? nameOf(t, x.by) : '';
        return '<div class="line-row">'
            + '<span class="disc cat is-sm" style="' + tone(c) + '">' + c.mark + '</span>'
            + '<div class="line-meta"><div class="line-name">'
            +   esc(x.merchant || x.desc || c.label) + '</div>'
            +   '<small class="line-sub">' + fmtDay(x.date)
            +   (who ? ' \u00b7 ' + esc(who) : '') + '</small></div>'
            + '<div class="line-figures"><div class="line-figure">'
            +   amount(x.amount, x.cur, t)
            + '</div></div>'
            + '</div>';
    }).join(''));
}

/* The plan, drawn the way the Itinerary screen draws it — the same day
   heading, the same time rail down the left, the same disc and place. A
   card that shows the same thing in a different shape is a second thing to
   learn, and this is the one screen people check at a glance.

   The next day with anything in it, and only that one: this is a card in a
   deck, and the whole plan is one click away on the Itinerary tab. */
function paintDashPlan(t, now) {
    const stops = ofTrip(db.stops, t);

    set('dashPlanNote', stops.length ? plural(stops.length, 'stop') : '');

    if (!stops.length) {
        return html('dashPlan', emptyState('bi-calendar2-week', 'Nothing planned yet',
            'Add a stop on the Itinerary tab and the days fill in.'));
    }

    /* From today forward, falling back to the last day that had something
       once the whole thing is behind you. */
    const dated = stops.filter((s) => s.date).map((s) => s.date).sort();
    const ahead = dated.filter((d) => d >= now);
    const date = ahead.length ? ahead[0] : dated[dated.length - 1];

    const list = stops.filter((s) => s.date === date).sort(sortStops);
    const inRange = t.from && date >= t.from && date <= t.to;
    const n = inRange ? daysBetween(t.from, date) + 1 : null;

    html('dashPlan', '<div class="day is-flat' + (date === now ? ' is-now' : '') + '">'
        + '<div class="day-head">'
        +   '<span class="day-n">' + (n ? 'Day ' + n : 'Extra') + '</span>'
        +   '<span class="day-date">' + fmtDay(date) + '</span>'
        +   '<span class="day-meta">' + plural(list.length, 'stop') + '</span>'
        + '</div>'
        + '<div class="day-stops">' + list.map(dashStopRow).join('') + '</div>'
        + '</div>');
}

/** The stop as the Itinerary draws it, without the parts that only make
    sense next to an edit button — no chips, no actual, no delete — and
    without the money. What a day costs is a question the Summary and
    Expenses cards in this same deck already answer; asking it a third time
    here turns a plan into an invoice. */
function dashStopRow(s) {
    const mins = stopRun(s);
    return '<div class="stop">'
        + '<span class="stop-clock">'
        +   '<b class="' + (s.time ? '' : 'is-none') + '">' + (s.time ? fmtTime(s.time) : 'Any time') + '</b>'
        +   (s.end ? '<small>to ' + fmtTime(s.end) + '</small>' : '')
        +   (mins ? '<small class="is-run">' + fmtMins(mins) + '</small>' : '')
        + '</span>'
        + disc(s.kind)
        + '<div class="stop-body">'
        +   '<div class="stop-title">' + esc(s.title) + '</div>'
        +   (s.where ? '<small class="stop-where"><i class="bi bi-geo-alt"></i>' + esc(s.where) + '</small>' : '')
        + '</div>'
        + '</div>';
}

function figure(label, value, foot) {
    return '<div class="spend-figure"><span class="sf-label">' + esc(label) + '</span>'
        + '<b class="sf-value">' + value + '</b>'
        + '<span class="sf-foot">' + esc(foot || '') + '</span></div>';
}

function groupBy(list, keyOf) {
    return list.reduce((bag, row) => {
        const k = keyOf(row);
        (bag[k] = bag[k] || []).push(row);
        return bag;
    }, {});
}

/* ====================================================================
   MODULE 03 · TRIP & EVENT MANAGEMENT

   A trip, an event and an activity are one record with a different word
   on it. All three own days, bookings, a budget and a packing list, so
   splitting them into three tables would have been three copies of the
   same code answering to three names. `kind` is the only difference,
   and it decides the word, the mark, and which list of types is offered.
   ==================================================================== */
const KIN = {
    trip: {
        label: 'Trip', many: 'Trips', mark: '\u{1F30E}', icon: 'bi-suitcase-lg-fill',
        name: 'Trip name', where: 'Destination', scope: 'trip',
        cat: 'trip', span: true,
    },
    event: {
        label: 'Event', many: 'Events', mark: '\u{1F389}', icon: 'bi-balloon-fill',
        name: 'Event name', where: 'Venue', scope: 'event',
        cat: 'event', span: true,
    },
    activity: {
        label: 'Activity', many: 'Activities', mark: '\u{1F4C5}', icon: 'bi-calendar-event-fill',
        name: 'Activity name', where: 'Where', scope: 'event',
        cat: 'personal', span: false,
    },
};

const KIN_ORDER = ['trip', 'event', 'activity'];
const kinOf = (k) => KIN[k] || KIN.trip;

/* Which category the calendar draws a record in.

   It used to be the kind and only the kind: every trip in the Trip colour,
   every event in Event, every activity in Personal — so a company activity
   and a badminton game were the same colour and no amount of category
   editing could separate them. The kind is the default now rather than the
   answer, and the form carries a field to say otherwise.

   The fallback is the system category because it is the one that cannot be
   deleted — an event drawn in the Event colour is better, but not at the
   price of a record that draws as nothing. */
function catForKind(k) {
    const want = kinOf(k).cat;
    return db.cats.some((c) => c.id === want) ? want : 'trip';
}

function catOfTrip(t) {
    if (t && t.cat && db.cats.some((c) => c.id === t.cat)) return t.cat;
    return catForKind(t && t.kind);
}

/* --------------------------------------------------------------------
   Status

   Six of them, and they are two different kinds of thing.

   Upcoming, Ongoing and Completed are facts about the calendar, and a
   fact that has stopped being true is not a status — it is a stale
   field. An activity that finished on Saturday still saying "Upcoming"
   on Monday is the app being wrong about something anybody can see, so
   those three re-read the dates every time they are shown.

   Draft, Planning and Archived are somebody's intent, and the calendar
   has no opinion about them: a plan can be Draft the week it happens,
   and Archived is a decision, not a date. Those three stay exactly where
   they were put, and nothing moves them but a person.
   -------------------------------------------------------------------- */
const TRIP_STATUS = {
    draft:     { label: 'Draft',     tag: '' },
    planning:  { label: 'Planning',  tag: 'is-azure' },
    upcoming:  { label: 'Upcoming',  tag: 'is-violet' },
    ongoing:   { label: 'Ongoing',   tag: 'is-node' },
    completed: { label: 'Completed', tag: 'is-green' },
    archived:  { label: 'Archived',  tag: 'is-muted' },
};

const STATUS_ORDER = ['draft', 'planning', 'upcoming', 'ongoing', 'completed', 'archived'];
const statusOf = (s) => TRIP_STATUS[s] || TRIP_STATUS.planning;

/** The three that answer to the calendar rather than to a person. */
const DATED_STATUS = ['upcoming', 'ongoing', 'completed'];

/** The status as it stands today: read off the dates when it is one of
    the three that track them, and left alone when it is not. */
function liveStatus(t) {
    const said = t.status || 'planning';
    return DATED_STATUS.indexOf(said) < 0 ? said : statusFromDates(t);
}

/** What the dates say, which is not the same question as the status. */
function statusFromDates(t) {
    if (!t.from) return 'draft';
    const out = daysBetween(today(), t.from);
    const back = daysBetween(today(), t.to || t.from);
    if (out > 0) return 'upcoming';
    if (back >= 0) return 'ongoing';
    return 'completed';
}

/* --------------------------------------------------------------------
   Types

   Rows in the store, not a schema — the same decision the calendar's
   categories were built on, for the same reason: a list somebody can add
   to is a list, and a list nobody can add to is a limit.

   Trips and events keep separate lists because the words do not carry
   over: a Wedding trip and a Camping event are both nonsense. Activities
   read the event list rather than owning a third one.
   -------------------------------------------------------------------- */
const DEFAULT_TYPES = [
    { id: 'ty-personal', scope: 'trip',  label: 'Personal' },
    { id: 'ty-family',   scope: 'trip',  label: 'Family' },
    { id: 'ty-friends',  scope: 'trip',  label: 'Friends' },
    { id: 'ty-company',  scope: 'event', label: 'Company' },
    { id: 'ty-efamily',  scope: 'event', label: 'Family' },
    { id: 'ty-birthday', scope: 'event', label: 'Birthday' },
    { id: 'ty-wedding',  scope: 'event', label: 'Wedding' },
    { id: 'ty-csr',      scope: 'event', label: 'CSR' },
    { id: 'ty-sports',   scope: 'event', label: 'Sports' },
    { id: 'ty-other',    scope: 'event', label: 'Other' },
];

const typesIn = (scope) => db.types.filter((t) => t.scope === scope);
const typeOf = (id) => db.types.find((t) => t.id === id) || null;

/** "Friends Trip", the way the card reads it. */
function typeLine(t) {
    const kin = kinOf(t.kind);
    const ty = typeOf(t.type);
    return ty ? ty.label + ' ' + kin.label : kin.label;
}

/* ====================================================================
   THE SHELF
   ==================================================================== */
let editTrip = null;
let newKind = 'trip';
let tripFilter = 'all';
let coverHeld = '';

function toggleNewMenu(open) {
    const menu = $('newMenu');
    if (!menu) return;
    menu.hidden = !open;
    $('newOpen').setAttribute('aria-expanded', open ? 'true' : 'false');
}

/* The shelf reads nearest-first, because "what is next" is the question a
   list of trips is asked. What is running now sits at the top, then what is
   coming soonest, then what has just finished (newest first, since old news
   ages out), and anything still without dates falls to the bottom by name.
   The status a person picked by hand is ignored here on purpose — the dates
   are what "nearest" means. */
const NEAR_RANK = { ongoing: 0, upcoming: 1, completed: 2, draft: 3 };

function sortNearest(a, b) {
    const ra = NEAR_RANK[statusFromDates(a)];
    const rb = NEAR_RANK[statusFromDates(b)];
    if (ra !== rb) return ra - rb;

    /* Undated things have nothing to compare but their names. */
    if (ra === 3) return (a.name || '').localeCompare(b.name || '');

    /* Running now: whichever ends first is the more urgent. */
    if (ra === 0) return (a.to || a.from).localeCompare(b.to || b.from) || (a.name || '').localeCompare(b.name || '');

    /* Coming up: soonest start first. Finished: latest end first. */
    if (ra === 1) return a.from.localeCompare(b.from) || (a.name || '').localeCompare(b.name || '');
    return (b.to || b.from).localeCompare(a.to || a.from) || (a.name || '').localeCompare(b.name || '');
}

function renderTrips() {
    paintTypes();

    /* The quick-entry form and the category list moved here off the
       Calendar, so this screen keeps them fed. The Calendar still paints
       them too — both are cheap, and neither screen may assume the other
       ran first. */
    paintCats();
    if (!editAct) fillCatSelect($('actCat') ? $('actCat').value : 'personal');

    const all = db.trips.slice().sort(sortNearest);
    const list = tripFilter === 'all' ? all : all.filter((t) => (t.kind || 'trip') === tripFilter);

    set('tripsTitle', tripFilter === 'all' ? 'All activities' : kinOf(tripFilter).many);
    set('tripsNote', !all.length ? ''
        : (list.length === all.length ? all.length + ' in all' : list.length + ' of ' + all.length));

    if (!all.length) {
        return html('tripsList', emptyState('bi-suitcase',
            'Nothing planned yet', 'Create New starts a trip, an event or an activity.'));
    }
    if (!list.length) {
        return html('tripsList', emptyState(kinOf(tripFilter).icon,
            'No ' + kinOf(tripFilter).many.toLowerCase(), 'There are ' + all.length + ' other things on the shelf.'));
    }

    html('tripsList', '<div class="trip-deck">' + list.map(tripCard).join('') + '</div>');
}

/* The example the spec was written against is a card, not a table row:
   a cover, a name, what type it is, the dates under each other, and the
   four figures that decide whether you open it. A table could hold the
   same fields but would ask you to read a grid to answer "which one is
   this" — the picture answers it before the words are read. */
function tripCard(t) {
    const kin = kinOf(t.kind);
    const st = statusOf(liveStatus(t));
    const cur = t.home || 'MYR';
    const spent = spendOf(t.id);
    const over = t.budget && spent > t.budget;

    /* The tag says Upcoming; this says how long. A countdown is the part a
       one-word status cannot carry, which is why both are on the card. */
    const real = statusFromDates(t);
    const out = t.from ? daysBetween(today(), t.from) : null;
    let clock = '';
    if (real === 'upcoming' && out !== null) clock = out === 1 ? 'Tomorrow' : 'In ' + out + ' days';
    else if (real === 'ongoing') clock = 'Happening now';

    const dates = t.from
        ? (kin.span && t.to && t.to !== t.from
            ? '<b>' + fmtDay(t.from) + '</b><i class="bi bi-arrow-down"></i><b>' + fmtDay(t.to) + '</b>'
            : '<b>' + fmtDay(t.from) + '</b>')
        : '<span class="is-idle">No dates yet</span>';

    return '<article class="trip-card' + (t.id === db.current ? ' is-current' : '') + '"'
        + ' data-open-trip="' + esc(t.id) + '" tabindex="0" role="button">'

        + '<div class="tc-cover' + (t.cover ? '' : ' is-bare') + '"'
        +   (t.cover ? ' style="background-image:url(' + esc(t.cover) + ')"' : '') + '>'
        +   (t.cover ? '' : '<i class="bi ' + kin.icon + '"></i>')
        +   '<span class="tc-kind">' + kin.mark + ' ' + esc(kin.label) + '</span>'
        +   '<span class="tag ' + st.tag + ' tc-status">' + esc(st.label) + '</span>'
        + '</div>'

        + '<div class="tc-body">'
        +   '<h3>' + esc(t.name || 'Untitled ' + kin.label.toLowerCase()) + '</h3>'
        +   '<p class="tc-type">' + esc(typeLine(t)) + '</p>'
        +   (t.desc ? '<p class="tc-desc">' + esc(t.desc) + '</p>' : '')

        +   '<div class="tc-when">' + dates
        +     (clock ? '<span class="tc-clock">' + esc(clock) + '</span>' : '')
        +   '</div>'

        +   '<dl class="tc-facts">'
        +     fact('bi-geo-alt-fill', kin.where, t.where || '—')
        +     fact('bi-people-fill', 'Members', String(t.who || 1))
        +     fact('bi-wallet2', 'Budget', t.budget ? moneyIn(t.budget, cur) : '—')
        +     fact('bi-receipt', 'Committed',
                '<span class="' + (over ? 'is-over' : '') + '">' + moneyIn(spent, cur) + '</span>')
        +   '</dl>'
        + '</div>'

        + '<div class="tc-foot">'
        +   '<span class="tc-open">' + (t.id === db.current && openRec ? 'Open now' : 'Open') + '</span>'
        +   '<button type="button" class="row-x is-edit" data-edit-trip="' + esc(t.id) + '" title="Edit"><i class="bi bi-pencil"></i></button>'
        +   '<button type="button" class="row-x" data-drop-trip="' + esc(t.id) + '" title="Delete"><i class="bi bi-trash3"></i></button>'
        + '</div>'
        + '</article>';
}

function fact(icon, label, value) {
    return '<div><dt><i class="bi ' + icon + '"></i>' + esc(label) + '</dt>'
        + '<dd>' + value + '</dd></div>';
}

/** What a trip has actually cost: money that left, plus what is already
    paid for. An itinerary cost is an estimate and is counted on the
    Budget screen as one, not here — a trip nobody has spent anything on
    has cost nothing, however carefully it was priced. */
function spendOf(tripId) {
    const t = db.trips.find((x) => x.id === tripId);
    const spent = db.spend.filter((x) => x.trip === tripId)
        .reduce((n, x) => n + homeOf({ cost: x.amount, cur: x.cur }, t), 0);
    const paid = db.books.filter((b) => b.trip === tripId && b.status === 'paid')
        .reduce((n, b) => n + homeOf(b, t), 0);
    return spent + paid;
}

/* ====================================================================
   THE FORM
   ==================================================================== */

/** Opens it for a new record of `kind`, or reopens it for an existing one. */
function openTripForm(kind, id) {
    const t = id ? db.trips.find((x) => x.id === id) : null;
    if (id && !t) return;

    editTrip = id || null;
    newKind = t ? (t.kind || 'trip') : kind;
    const kin = kinOf(newKind);

    set('tripFormTitle', kin.mark + '  ' + kin.label + ' information');
    set('tripNameLabel', kin.name);
    set('tripWhereLabel', kin.where);
    set('tripSaveLabel', editTrip ? 'Save changes' : 'Add ' + kin.label.toLowerCase());
    $('tripSave').querySelector('i').className = 'bi ' + (editTrip ? 'bi-check-lg' : 'bi-plus-lg');

    /* An activity is one day, so it has one date field. Leaving "End date"
       on screen with nothing to put in it is a question with no answer. */
    $('tripTo').closest('.field').hidden = !kin.span;
    set('tripFromLabel', kin.span ? 'Start date' : 'Date');

    $('tripName').value = t ? (t.name || '') : '';
    $('tripWhere').value = t ? (t.where || '') : '';
    $('tripFrom').value = t ? (t.from || '') : '';
    $('tripTo').value = t ? (t.to || '') : '';
    $('tripWho').value = t ? (t.who || '') : '';
    $('tripDesc').value = t ? (t.desc || '') : '';
    $('tripBudget').value = t && t.budget ? fromSen(t.budget) : '';

    fillTypeSelect(kin.scope, t ? t.type : '');
    fillStatusSelect(t ? liveStatus(t) : 'planning');
    fillTripCatSelect(t ? catOfTrip(t) : catForKind(newKind));
    fillCurSelect($('tripHome'), t ? (t.home || 'MYR') : 'MYR');
    fillCountrySelect($('tripCountry'), t ? (t.country || '') : '');

    coverHeld = t ? (t.cover || '') : '';
    paintCover();

    $('tripFormCard').hidden = false;
    $('tripFormCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    $('tripName').focus();
}

function openTripEdit(id) {
    openTripForm(null, id);
}

/* Closed rather than emptied. The form is not the resting state of this
   screen — the shelf is — so it goes away when there is nothing being
   filled in, and Create New brings it back. */
function blankTripForm() {
    coverHeld = '';
    ['tripName', 'tripWhere', 'tripFrom', 'tripTo', 'tripWho', 'tripBudget', 'tripDesc']
        .forEach((id) => { const el = $(id); if (el) el.value = ''; });
    paintCover();
}

function clearTripForm() {
    editTrip = null;
    const card = $('tripFormCard');
    if (card) card.hidden = true;
    blankTripForm();
}

function saveTrip() {
    const name = $('tripName').value.trim();
    const kin = kinOf(newKind);
    const from = $('tripFrom').value;
    /* One day means one date, and the record still stores both so every
       reader downstream — the calendar, the itinerary — keeps one shape. */
    const to = kin.span ? $('tripTo').value : from;

    if (!name) return $('tripName').focus();
    /* Something that comes back before it leaves is a typo, not a plan. */
    if (kin.span && from && to && to < from) {
        $('tripTo').value = from;
        return $('tripTo').focus();
    }

    const row = {
        kind: newKind,
        name,
        type: $('tripType').value || '',
        status: $('tripStatus').value || 'planning',
        cat: $('tripCat').value || '',
        where: $('tripWhere').value.trim(),
        desc: $('tripDesc').value.trim(),
        cover: coverHeld,
        from, to,
        who: Number($('tripWho').value) || 1,
        home: $('tripHome').value || 'MYR',
        country: $('tripCountry').value || '',
        budget: toSen($('tripBudget').value),
    };

    if (editTrip) {
        Object.assign(db.trips.find((t) => t.id === editTrip), row);
    } else {
        row.id = newId('t');
        db.trips.push(row);
        db.current = row.id;
    }

    save();
    clearTripForm();
    repaint();
}

function fillTypeSelect(scope, selected) {
    const el = $('tripType');
    if (!el) return;
    const list = typesIn(scope);
    el.innerHTML = '<option value="">No type</option>'
        + list.map((ty) => '<option value="' + esc(ty.id) + '">' + esc(ty.label) + '</option>').join('');
    el.value = list.some((ty) => ty.id === selected) ? selected : '';
}

/** Every category except the holiday feed, which files itself and would
    put a trip in among the public holidays. */
function fillTripCatSelect(selected) {
    const el = $('tripCat');
    if (!el) return;
    const list = db.cats.filter((c) => c.id !== 'holiday');
    el.innerHTML = list.map((c) =>
        '<option value="' + esc(c.id) + '">' + esc(c.mark) + '  ' + esc(c.label) + '</option>').join('');
    el.value = list.some((c) => c.id === selected) ? selected : (list[0] ? list[0].id : '');
}

function fillStatusSelect(selected) {
    const el = $('tripStatus');
    if (!el) return;
    el.innerHTML = STATUS_ORDER
        .map((s) => '<option value="' + s + '">' + esc(TRIP_STATUS[s].label) + '</option>').join('');
    el.value = TRIP_STATUS[selected] ? selected : 'planning';
}

/* --------------------------------------------------------------------
   The cover

   The store is one localStorage key with a few megabytes in it, and a
   phone photo is four of them on its own. So the file never goes in as
   it came off the camera: it is drawn onto a canvas at most 1200px wide
   and comes back out as a JPEG, which is the difference between one
   cover and a store that will not write.
   -------------------------------------------------------------------- */
const COVER_MAX = 1200;

function takeCover(file) {
    if (!file || !/^image\//.test(file.type)) return;

    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, COVER_MAX / img.width);
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);

            try { coverHeld = canvas.toDataURL('image/jpeg', 0.78); }
            catch (err) { coverHeld = String(reader.result); }
            paintCover();
        };
        /* A file that will not decode is not an image, whatever it said. */
        img.onerror = () => toast('That file did not open as an image.');
        img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
}

function paintCover() {
    const shot = $('tripCoverShot');
    if (!shot) return;
    shot.hidden = !coverHeld;
    shot.style.backgroundImage = coverHeld ? 'url(' + coverHeld + ')' : '';
    $('tripCoverDrop').hidden = !coverHeld;
    set('tripCoverAddLabel', coverHeld ? 'Change image' : 'Choose an image');
    set('tripCoverNote', coverHeld
        ? 'About ' + Math.max(1, Math.round(coverHeld.length / 1400)) + ' KB stored.'
        : 'Scaled down before it is stored, so one photo cannot fill the store.');
}

/* ====================================================================
   THE TYPE LISTS
   ==================================================================== */
function paintTypes() {
    set('typeNote', plural(db.types.length, 'type'));

    /* Never rebuild a list somebody is typing in. */
    if ($('typeList').contains(document.activeElement)) return;

    html('typeList', ['trip', 'event'].map((scope) => {
        const kin = scope === 'trip' ? KIN.trip : KIN.event;
        const list = typesIn(scope);
        return '<div class="type-set">'
            + '<div class="type-head">'
            +   '<h3>' + kin.mark + ' ' + esc(kin.label) + ' types</h3>'
            +   '<button type="button" class="ghost-btn" data-add-type="' + scope + '">'
            +     '＋&nbsp;Add ' + esc(kin.label.toLowerCase()) + ' type</button>'
            + '</div>'
            + (list.length
                ? '<div class="type-rows">' + list.map((ty) => {
                    const used = db.trips.filter((t) => t.type === ty.id).length;
                    return '<div class="type-row">'
                        + '<input type="text" class="type-name" aria-label="Type name"'
                        +   ' data-type-name="' + esc(ty.id) + '" value="' + esc(ty.label) + '">'
                        + '<span class="type-use' + (used ? '' : ' is-idle') + '">'
                        +   (used ? plural(used, 'in use', 'in use') : 'not used') + '</span>'
                        + '<button type="button" class="row-x" data-drop-type="' + esc(ty.id) + '" title="Delete">'
                        +   '<i class="bi bi-trash3"></i></button>'
                        + '</div>';
                }).join('') + '</div>'
                : '<p class="type-none">None left. Add one, or leave these untyped.</p>')
            + '</div>';
    }).join(''));
}

function addType(scope) {
    const row = { id: newId('ty'), scope, label: 'New type' };
    db.types.push(row);
    save();
    repaint();

    /* Straight into the name, because "New type" is a placeholder and
       everybody's next move is to replace it. */
    const box = $('typeList').querySelector('[data-type-name="' + row.id + '"]');
    if (box) { box.focus(); box.select(); }
    return row.id;
}

/* Deletes on the spot, like a category does, and for the same reason: it
   can be taken back, and what it takes with it is a label rather than a
   plan. What was filed under it simply loses its type. */
function dropType(id) {
    const ty = typeOf(id);
    if (!ty) return;

    const at = db.types.indexOf(ty);
    const orphans = db.trips.filter((t) => t.type === id);

    db.types.splice(at, 1);
    orphans.forEach((t) => { t.type = ''; });
    save();
    repaint();

    toast('Deleted <b>' + esc(ty.label) + '</b>'
        + (orphans.length ? ' · ' + plural(orphans.length, 'record') + ' left untyped' : ''), {
        label: 'Undo',
        run: () => {
            db.types.splice(at, 0, ty);
            orphans.forEach((t) => { t.type = ty.id; });
            save();
            repaint();
        },
    });
}

/* ====================================================================
   THE ACTIVITY TYPE LIST

   The kind on a stop is also the kind on a booking and the line a budget
   is grouped by, so this one list is read from three screens. Editing it
   is therefore editing all three at once, which is the point - the whole
   reason the kind was declared once was so that "Food" could not mean one
   colour on the Itinerary and another on the Budget.
   ==================================================================== */
function kindUse(id) {
    return db.stops.filter((r) => (r.kind || 'do') === id).length
        + db.books.filter((r) => (r.kind || 'travel') === id).length;
}

function paintStopKinds() {
    const list = $('kindList');
    if (!list) return;
    set('kindNote', plural(db.stopKinds.length, 'type'));

    /* Never rebuild a list somebody is typing in - the same guard the
       categories and the trip types keep. */
    if (list.contains(document.activeElement)) return;

    html('kindList', db.stopKinds.map((k) => {
        const used = kindUse(k.id);
        return '<div class="cat-row kind-row" style="' + tone(k) + '">'
            + '<span class="disc is-tone"><i class="bi ' + k.icon + '"></i></span>'
            + '<input class="cat-name" type="text" aria-label="Name"'
            +   ' data-kind-name="' + esc(k.id) + '" value="' + esc(k.label) + '">'
            + '<select class="kind-icon" aria-label="Icon"'
            +   ' data-kind-icon="' + esc(k.id) + '">'
            +   KIND_ICONS.map((ic) => '<option value="' + ic[0] + '"'
                    + (ic[0] === k.icon ? ' selected' : '') + '>' + esc(ic[1]) + '</option>').join('')
            + '</select>'
            + '<div class="tone-pick">'
            +   TONE_ORDER.map((t) => '<button type="button" class="tone-dot' + (t === k.tone ? ' is-on' : '')
                    + '" style="--tone:var(' + TONES[t][0] + ')" title="' + t + '"'
                    + ' aria-label="' + t + '" data-kind-tone="' + esc(k.id) + ':' + t + '"></button>').join('')
            + '</div>'
            + '<span class="cat-use' + (used ? '' : ' is-idle') + '">'
            +   (used ? plural(used, 'in use', 'in use') : 'not used') + '</span>'
            + '<button type="button" class="row-x" data-drop-kind="' + esc(k.id) + '"'
            +   (k.locked ? ' disabled title="Deleted types file their stops here, so it stays"' : ' title="Delete"')
            +   '><i class="bi bi-trash3"></i></button>'
            + '</div>';
    }).join(''));
}

function addStopKind() {
    const taken = new Set(db.stopKinds.map((k) => k.tone));
    const row = {
        id: newId('sk'),
        label: 'New type',
        icon: 'bi-three-dots',
        tone: TONE_ORDER.find((t) => !taken.has(t)) || 'slate',
    };
    /* Above "Other", because Other is the end of a list by meaning as well
       as by position. */
    db.stopKinds.splice(Math.max(0, db.stopKinds.length - 1), 0, row);
    save();
    repaint();

    const box = $('kindList').querySelector('[data-kind-name="' + row.id + '"]');
    if (box) { box.focus(); box.select(); }
}

/* Deletes on the spot with the way back attached, like a category does.
   What it takes with it is a label: the stops and bookings filed under it
   move to Other rather than going anywhere. */
function dropStopKind(id) {
    const k = db.stopKinds.find((r) => r.id === id);
    if (!k || k.locked) return;

    const at = db.stopKinds.indexOf(k);
    const stops = db.stops.filter((r) => (r.kind || 'do') === id);
    const books = db.books.filter((r) => (r.kind || 'travel') === id);

    db.stopKinds.splice(at, 1);
    stops.forEach((r) => { r.kind = 'other'; });
    books.forEach((r) => { r.kind = 'other'; });
    if (planFilter === id) planFilter = 'all';
    save();
    repaint();

    const moved = stops.length + books.length;
    toast('Deleted <b>' + esc(k.label) + '</b>'
        + (moved ? ' \u00b7 ' + plural(moved, 'row') + ' moved to Other' : ''), {
        label: 'Undo',
        run: () => {
            db.stopKinds.splice(at, 0, k);
            stops.forEach((r) => { r.kind = id; });
            books.forEach((r) => { r.kind = id; });
            save();
            repaint();
        },
    });
}

/** Fills a kind <select>, keeping the asked-for value when it still exists. */
function fillKindSelect(el, selected) {
    if (!el) return;
    el.innerHTML = db.stopKinds.map((k) =>
        '<option value="' + esc(k.id) + '">' + esc(k.label) + '</option>').join('');
    el.value = db.stopKinds.some((k) => k.id === selected) ? selected : 'other';
}

/** The Show bar is the same list with "All days" in front of it. */
function paintPlanFilter() {
    const bar = $('planFilter');
    if (!bar) return;
    if (planFilter !== 'all' && !db.stopKinds.some((k) => k.id === planFilter)) planFilter = 'all';

    const chip = (val, label) => '<button type="button" data-val="' + esc(val) + '"'
        + (val === planFilter ? ' class="is-on"' : '') + '>' + esc(label) + '</button>';

    bar.dataset.value = planFilter;
    bar.innerHTML = chip('all', 'All days')
        + db.stopKinds.map((k) => chip(k.id, k.label)).join('');
}

/* ====================================================================
   MODULE 04 · SCHEDULE & ITINERARY

   Days down the page, stops inside them. A stop is the smallest unit the
   app plans in: a date, a clock, a title, a place, and two figures —
   what it is meant to cost and what it did.
   ==================================================================== */
let editStop = null;
let planFilter = 'all';
let attHeld = null;

/* --------------------------------------------------------------------
   Status

   Five of them, and two mean "this is not happening". Those two stay on
   the page — a cancelled stop is the reason the afternoon is free, and
   deleting it loses that — but they drop out of the totals, because a
   day's estimate is what the day is expected to cost, and a cancelled
   stop costs nothing.
   -------------------------------------------------------------------- */
/* --------------------------------------------------------------------
   The clock

   A stop stores a start and an end, and duration is worked out from the
   two — the same fact written a third way would be a third thing to keep
   in step. The duration field on the form is a way of *entering* the end
   time, not a field of its own: type 90 and the end time fills in.
   -------------------------------------------------------------------- */
function stopRun(s) {
    if (!s.time || !s.end) return null;
    const from = minutesOf(s.time);
    const to = minutesOf(s.end);
    if (from === null || to === null) return null;
    /* An end before the start is an evening that runs past midnight, not
       a negative afternoon. */
    return to >= from ? to - from : (1440 - from) + to;
}

/** 105 → "1h 45m". The unit is dropped when there is nothing in it. */
function fmtMins(n) {
    if (n === null || n <= 0) return '';
    const h = Math.floor(n / 60);
    const m = n % 60;
    return (h ? h + 'h' : '') + (h && m ? ' ' : '') + (m ? m + 'm' : '');
}

/** Start plus a run of minutes, wrapping at midnight. */
function timePlus(hhmm, mins) {
    const from = minutesOf(hhmm);
    if (from === null) return '';
    const at = (from + mins) % 1440;
    return String(Math.floor(at / 60)).padStart(2, '0') + ':' + String(at % 60).padStart(2, '0');
}

/* --------------------------------------------------------------------
   Estimated vs actual

   The estimate is typed here. The actual is not: it is read from the
   expense record, live, so changing what was paid changes what the plan
   says was paid. A copy taken at save time would be right once.

   An expense record is one of two things: an expense from Module 05 —
   money that left — or a booking, which is money committed ahead of the
   trip. `from` holds the id of either, and both are offered. A typed
   figure is the fallback for money that never became a record at all.
   -------------------------------------------------------------------- */
function estOf(s, t) {
    return homeOf(s, t);
}

/** { sen, from } in the trip's own money, or null if nothing was spent. */
function actualOf(s, t) {
    if (s.from) {
        const x = db.spend.find((r) => r.id === s.from);
        if (x) return { sen: homeOf({ cost: x.amount, cur: x.cur }, t), from: x, label: x.merchant };

        const b = db.books.find((r) => r.id === s.from);
        /* The record it pointed at is gone. Saying nothing is better than
           holding the last figure it had and calling it current. */
        if (!b) return null;
        return { sen: homeOf(b, t), from: b, label: b.title };
    }
    if (s.actual) return { sen: toHome(s.actual, s.actualCur, t) || 0, from: null, label: '' };
    return null;
}

/* --------------------------------------------------------------------
   One fact, written from either end

   "This expense is what that schedule item cost" can be said on the
   Itinerary — the Actual cost field — or on the expense, under *Against
   a schedule item*. It is stored on both, because both screens have to
   read it without hunting, and it is kept in step here so the two can
   never disagree. Each side holds at most one of the other.
   -------------------------------------------------------------------- */
function pairSpendStop(spendId, stopId) {
    const x = spendId ? db.spend.find((r) => r.id === spendId) : null;

    /* Whatever used to claim this stop lets go of it — including when the
       stop's actual has just been pointed at a booking instead. */
    if (stopId) db.spend.forEach((r) => { if (r.stop === stopId && (!x || r.id !== x.id)) r.stop = ''; });
    if (!x) return;

    db.stops.forEach((r) => { if (r.from === x.id && r.id !== stopId) r.from = ''; });
    x.stop = stopId || '';

    const s = stopId ? db.stops.find((r) => r.id === stopId) : null;
    if (!s) return;
    s.from = x.id;
    /* A linked actual and a typed one are two answers to one question. */
    s.actual = 0;
    s.actualCur = '';
}

/** Timed stops first, in clock order; untimed ones close the day. */
function sortStops(a, b) {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
}

function renderPlan() {
    const t = trip();
    if (!t) {
        set('planNote', '');
        return html('planDays', emptyState('bi-calendar2-week', 'Nothing open',
            'Create a trip, an event or an activity first — the days come from its dates.'));
    }

    fillStopSources();
    paintPlanFilter();
    paintStopKinds();
    if (!editStop) fillKindSelect($('stopKind'), $('stopKind').value || 'do');

    const all = mine(db.stops);
    const byKind = planFilter === 'all' ? all : all.filter((s) => s.kind === planFilter);
    const stops = byKind;

    set('planNote', plural(stops.length, 'stop')
        + (planFilter === 'all' ? '' : ' · ' + kindOf(planFilter).label));

    /* Every day between the dates gets a heading whether or not anything is
       planned in it — an empty day is information, and it is where the next
       stop is most likely to be added. Anything dated outside the range
       still gets shown, so a stop is never silently lost to a date change. */
    const days = [];
    const length = daysBetween(t.from, t.to);
    if (t.from && length !== null && length >= 0) {
        for (let i = 0; i <= Math.min(length, 365); i++) days.push(shiftDate(t.from, i));
    }
    stops.forEach((s) => { if (s.date && !days.includes(s.date)) days.push(s.date); });
    mine(db.notes).forEach((n) => { if (n.date && !days.includes(n.date)) days.push(n.date); });
    days.sort();

    if (!days.length) {
        return html('planDays', emptyState('bi-calendar2-week', 'No days yet', 'Give it a start and an end date and the days appear here.'));
    }

    const now = today();
    html('planDays', days.map((date) => {
        const list = stops.filter((s) => s.date === date).sort(sortStops);
        const est = list.reduce((n, s) => n + estOf(s, t), 0);
        const act = list.reduce((n, s) => { const a = actualOf(s, t); return n + (a ? a.sen : 0); }, 0);
        const inRange = t.from && date >= t.from && date <= t.to;
        const n = inRange ? daysBetween(t.from, date) + 1 : null;
        const pins = notesOn(date);

        return '<div class="day' + (date === now ? ' is-now' : '') + '">'
            + '<div class="day-head">'
            +   '<span class="day-n">' + (n ? 'Day ' + n : 'Extra') + '</span>'
            +   '<span class="day-date">' + fmtDay(date) + '</span>'
            +   '<span class="day-meta">' + (list.length ? plural(list.length, 'stop') : 'Open')
            +     (est ? ' · <b>' + money(est) + '</b>' : '')
            +     (act ? ' <span class="day-act">actual ' + money(act) + '</span>' : '')
            +   '</span>'
            + '</div>'
            /* What is pinned to this day, stated where the day is read
               rather than only down in the notes card. */
            + (pins.length
                ? '<div class="day-pins">' + pins.map((p) =>
                    '<button type="button" class="day-pin" style="' + tone(noteTypeOf(p.type)) + '"'
                    + ' data-go-note="' + esc(p.id) + '">'
                    + '<span class="dot"></span>' + noteTypeOf(p.type).mark + ' '
                    + esc(p.title || noteTypeOf(p.type).label + ' note') + '</button>').join('') + '</div>'
                : '')
            + (list.length
                ? '<div class="stops">' + list.map((s) => stopRow(s, now, t)).join('') + '</div>'
                : '<p class="hint" style="padding:6px 0 2px">Nothing planned. A free day is a plan too.</p>')
            + '</div>';
    }).join(''));
}

function stopRow(s, now, t) {
    const mins = stopRun(s);
    const act = actualOf(s, t);
    const est = estOf(s, t);

    /* The gap, and only when both halves of it exist. A difference against
       an estimate of nothing is the actual figure said twice. */
    let diff = '';
    if (act && s.cost) {
        const d = act.sen - est;
        diff = '<span class="stop-diff ' + (d > 0 ? 'is-over' : (d < 0 ? 'is-under' : 'is-level')) + '">'
            + (d > 0 ? '+' : (d < 0 ? '−' : '')) + moneyIn(Math.abs(d), t.home || 'MYR')
            + '</span>';
    }

    const chips = [
        s.note ? '<span class="stop-chip" title="' + esc(s.note) + '"><i class="bi bi-sticky"></i>Note</span>' : '',
        s.att ? '<button type="button" class="stop-chip is-link" data-open-att="' + esc(s.id) + '">'
            + '<i class="bi bi-paperclip"></i>' + esc(s.att.name) + '</button>' : '',
        act && act.from ? '<span class="stop-chip"><i class="bi bi-receipt"></i>' + esc(act.label || 'Expense record') + '</span>' : '',
    ].filter(Boolean).join('');

    return '<div class="stop' + (s.date === now ? ' is-now' : '') + '">'
        + '<span class="stop-clock">'
        +   '<b class="' + (s.time ? '' : 'is-none') + '">' + (s.time ? fmtTime(s.time) : 'Any time') + '</b>'
        +   (s.end ? '<small>to ' + fmtTime(s.end) + '</small>' : '')
        +   (mins ? '<small class="is-run">' + fmtMins(mins) + '</small>' : '')
        + '</span>'
        + disc(s.kind)
        + '<div class="stop-body">'
        +   '<div class="stop-title">' + esc(s.title) + '</div>'
        +   (s.where ? '<small class="stop-where"><i class="bi bi-geo-alt"></i>' + esc(s.where) + '</small>' : '')
        +   (s.desc ? '<small class="stop-desc">' + esc(s.desc) + '</small>' : '')
        +   (chips ? '<div class="stop-chips">' + chips + '</div>' : '')
        + '</div>'
        + '<span class="stop-money">'
        +   '<span class="stop-cost' + (s.cost ? '' : ' is-free') + '">'
        +     (s.cost ? amount(s.cost, s.cur, t) : 'Free') + '</span>'
        +   (act ? '<span class="stop-actual">actual ' + moneyIn(act.sen, t.home || 'MYR') + '</span>' : '')
        +   diff
        + '</span>'
        + '<span class="stop-acts">'
        +   '<button type="button" class="row-x is-edit" data-edit-stop="' + esc(s.id) + '" title="Edit"><i class="bi bi-pencil"></i></button>'
        +   '<button type="button" class="row-x" data-drop-stop="' + esc(s.id) + '" title="Remove"><i class="bi bi-x-lg"></i></button>'
        + '</span>'
        + '</div>';
}

/* ====================================================================
   THE FORM
   ==================================================================== */
function saveStop() {
    const t = trip();
    if (!t) return;

    const title = $('stopTitle').value.trim();
    const date = $('stopDate').value || t.from;
    if (!title) return $('stopTitle').focus();
    if (!date) return $('stopDate').focus();

    const src = $('stopActualSrc').value;

    const row = {
        trip: t.id, date,
        time: $('stopTime').value,
        end: $('stopTime').value ? $('stopEnd').value : '',
        kind: $('stopKind').value,
        title,
        where: $('stopWhere').value.trim(),
        desc: $('stopDesc').value.trim(),
        note: $('stopNote').value.trim(),
        att: attHeld,
        cost: toSen($('stopCost').value),
        cur: $('stopCur').value || homeCur(),
        /* One of the two, never both — an actual that is both linked and
           typed is two answers to one question. */
        from: src && src !== 'typed' ? src : '',
        actual: src === 'typed' ? toSen($('stopActual').value) : 0,
        actualCur: src === 'typed' ? ($('stopActualCur').value || homeCur()) : '',
    };

    let savedId;
    if (editStop) {
        savedId = editStop;
        Object.assign(db.stops.find((s) => s.id === editStop), row);
        editStop = null;
    } else {
        row.id = newId('s');
        savedId = row.id;
        db.stops.push(row);
    }

    pairSpendStop(row.from, savedId);

    save();
    clearStopForm();
    repaint();
}

/** The fields, and nothing else — whatever is being edited stays being
    edited. */
function blankStopForm() {
    attHeld = null;
    const t = trip();
    ['stopTitle', 'stopWhere', 'stopTime', 'stopEnd', 'stopMins', 'stopCost', 'stopDesc', 'stopNote', 'stopActual']
        .forEach((id) => { $(id).value = ''; });
    $('stopDate').value = t ? t.from : '';
    fillKindSelect($('stopKind'), 'do');
    fillCurSelect($('stopCur'), homeCur());
    fillCurSelect($('stopActualCur'), homeCur());
    fillStopSources('');
    paintAtt();
    paintStopClock();
}

function clearStopForm() {
    editStop = null;
    blankStopForm();
    set('stopFormTitle', 'Add a stop');
    set('stopSaveLabel', 'Add stop');
    setCancelBtn('stopCancel', false);
}

function openStopEdit(id) {
    unfold('stopForm');
    const s = db.stops.find((x) => x.id === id);
    if (!s) return;
    editStop = id;
    $('stopDate').value = s.date || '';
    $('stopTime').value = s.time || '';
    $('stopEnd').value = s.end || '';
    fillKindSelect($('stopKind'), s.kind || 'do');
    $('stopTitle').value = s.title || '';
    $('stopWhere').value = s.where || '';
    $('stopDesc').value = s.desc || '';
    $('stopNote').value = s.note || '';
    $('stopCost').value = s.cost ? fromSen(s.cost) : '';
    $('stopActual').value = s.actual ? fromSen(s.actual) : '';
    fillCurSelect($('stopCur'), s.cur || homeCur());
    fillCurSelect($('stopActualCur'), s.actualCur || homeCur());
    fillStopSources(s.from ? s.from : (s.actual ? 'typed' : ''));
    attHeld = s.att || null;
    paintAtt();
    paintStopClock();
    set('stopFormTitle', 'Edit stop');
    set('stopSaveLabel', 'Save changes');
    setCancelBtn('stopCancel', true);
    $('stopTitle').focus();
    $('stopTitle').scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/** The expense records this trip has, for the actual to be read from. */
function fillStopSources(selected) {
    const el = $('stopActualSrc');
    if (!el) return;
    const keep = selected === undefined ? el.value : selected;
    const t = trip();
    const books = t ? mine(db.books) : [];

    const opt = (id, title, cost, cur) => '<option value="' + esc(id) + '">' + esc(title || 'Untitled')
        + ' · ' + moneyIn(cost || 0, cur || (t && t.home) || 'MYR') + '</option>';

    /* Expenses first: an expense is money that left, which is what the
       word "actual" means. A booking sits under them — money committed
       ahead of the trip, for the half of it that is paid before it. */
    const spends = t ? mine(db.spend) : [];

    el.innerHTML = '<option value="">Not spent yet</option>'
        + '<option value="typed">Type it in</option>'
        + (spends.length
            ? '<optgroup label="Expenses">'
                + spends.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                    .map((x) => opt(x.id, x.merchant, x.amount, x.cur)).join('')
                + '</optgroup>'
            : '')
        + ['paid', 'held', 'idea'].map((k) => {
            const rows = books.filter((b) => b.status === k);
            if (!rows.length) return '';
            return '<optgroup label="' + esc(STATUS[k].label) + ' bookings">'
                + rows.map((b) => opt(b.id, b.title, b.cost, b.cur)).join('') + '</optgroup>';
        }).join('');

    el.value = [...el.options].some((o) => o.value === keep) ? keep : '';
    $('stopActualField').hidden = el.value !== 'typed';
}

/* The duration field is an input to the end time, so the two are kept in
   step from whichever one was touched — and the run is only meaningful
   once there is a start to run from. */
function paintStopClock() {
    const start = $('stopTime').value;
    const end = $('stopEnd').value;
    const mins = $('stopMins');

    mins.disabled = !start;
    $('stopEnd').disabled = !start;

    if (!start) {
        mins.value = '';
        return set('stopMinsPer', 'a start time first');
    }
    if (end) {
        const run = stopRun({ time: start, end });
        mins.value = run || '';
        return set('stopMinsPer', run ? 'ends ' + fmtTime(end) : 'minutes');
    }
    set('stopMinsPer', 'minutes — sets the end time');
}

/* --------------------------------------------------------------------
   The attachment

   One file, kept in the store with everything else, which is what caps
   it: `localStorage` holds a few megabytes in total and the plan has to
   fit in there too. Images go through the same canvas as a cover and
   come out small enough not to matter; anything else is taken as it is,
   and turned away over a megabyte rather than quietly failing to save.
   -------------------------------------------------------------------- */
const ATT_MAX_BYTES = 1024 * 1024;
const ATT_IMG_MAX = 1600;

/* One reader for both the stop's single file and a note's shelf of them.
   Images go through a canvas and come out a fraction of the size; anything
   else is taken as it is, and turned away over a megabyte rather than
   quietly failing to save. */
function readAtt(file, then) {
    if (!file) return;

    if (/^image\//.test(file.type)) {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, ATT_IMG_MAX / img.width);
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                let data;
                try { data = canvas.toDataURL('image/jpeg', 0.78); }
                catch (err) { data = String(reader.result); }
                then({ name: file.name, type: 'image/jpeg', size: Math.round(data.length * 0.75), data });
            };
            img.onerror = () => toast('That file did not open as an image.');
            img.src = String(reader.result);
        };
        return reader.readAsDataURL(file);
    }

    if (file.size > ATT_MAX_BYTES) {
        return toast('<b>' + esc(file.name) + '</b> is ' + fmtBytes(file.size)
            + ', and the store holds the whole plan. Keep attachments under 1 MB.');
    }

    const reader = new FileReader();
    reader.onload = () => then({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: String(reader.result),
    });
    reader.readAsDataURL(file);
}

/** A stop holds one. Choosing another replaces it. */
function takeAtt(file) {
    readAtt(file, (att) => { attHeld = att; paintAtt(); });
}

function paintAtt() {
    const held = $('stopAttHeld');
    if (!held) return;

    held.hidden = !attHeld;
    if (attHeld) {
        held.innerHTML = /^image\//.test(attHeld.type)
            ? '<img src="' + esc(attHeld.data) + '" alt="' + esc(attHeld.name) + '">'
            : '<i class="bi ' + attIcon(attHeld.type) + '"></i>';
    }

    $('stopAttDrop').hidden = !attHeld;
    set('stopAttAddLabel', attHeld ? 'Change file' : 'Choose a file');
    set('stopAttNote', attHeld
        ? attHeld.name + ' · ' + fmtBytes(attHeld.size)
        : 'A ticket, a booking slip, a photo of the door code. Images are scaled down; anything over 1 MB is turned away.');
}

function attIcon(type) {
    if (/pdf/.test(type)) return 'bi-file-earmark-pdf';
    if (/^image\//.test(type)) return 'bi-file-earmark-image';
    if (/word|document/.test(type)) return 'bi-file-earmark-word';
    if (/sheet|excel|csv/.test(type)) return 'bi-file-earmark-spreadsheet';
    return 'bi-file-earmark';
}

function fmtBytes(n) {
    if (!n) return '0 KB';
    return n < 1024 * 1024
        ? Math.max(1, Math.round(n / 1024)) + ' KB'
        : (n / 1024 / 1024).toFixed(1) + ' MB';
}

/* A data URL cannot be opened as a top-level page, so it is turned back
   into a blob and handed over as a download — which is what somebody
   clicking their own ticket wanted anyway. */
function downloadAtt(att) {
    if (!att) return;
    try {
        const [head, b64] = att.data.split(',');
        const mime = (head.match(/:(.*?);/) || [])[1] || att.type;
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

        const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
        const a = document.createElement('a');
        a.href = url;
        a.download = att.name || 'attachment';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (err) {
        toast('That attachment could not be opened.');
    }
}

function openAtt(stopId) {
    const s = db.stops.find((x) => x.id === stopId);
    if (s) downloadAtt(s.att);
}

/* ====================================================================
   NOTES & INFORMATION

   Part of Module 05, beside the people and the receipts, because these
   are the things that hang off a trip rather than off its clock. What
   separates a note from a *stop's* note is what it is about: a stop's
   note is about that minute, a note here is about the trip, or about a
   day of it.

   A note pinned to a day is the join between the two screens — it shows
   in that day's heading on the Itinerary, and clicking it there comes
   back here.
   ==================================================================== */
const NOTE_TYPES = {
    general:       { label: 'General',       mark: '\u{1F4DD}', tone: 'slate' },
    travel:        { label: 'Travel',        mark: '✈️', tone: 'azure' },
    event:         { label: 'Event',         mark: '\u{1F389}', tone: 'violet' },
    meeting:       { label: 'Meeting',       mark: '\u{1F4BC}', tone: 'sky' },
    reminder:      { label: 'Reminder',      mark: '⏰', tone: 'amber' },
    important:     { label: 'Important',     mark: '❗', tone: 'red' },
    personal:      { label: 'Personal',      mark: '\u{1F464}', tone: 'teal' },
    food:          { label: 'Food',          mark: '\u{1F35C}', tone: 'node' },
    accommodation: { label: 'Accommodation', mark: '\u{1F3E8}', tone: 'green' },
};

const NOTE_TYPE_ORDER = ['general', 'travel', 'event', 'meeting', 'reminder',
    'important', 'personal', 'food', 'accommodation'];

/* Fixed, unlike a trip's types. Those are somebody's own vocabulary for
   their own trips; these are what a piece of information *is*, and each
   one carries a mark and a colour the rest of the screen is written
   against. Adding a tenth would be adding a mark and a tone, not a word. */
const noteTypeOf = (id) => NOTE_TYPES[id] || NOTE_TYPES.general;

let editNote = null;
let noteFilter = 'all';
let noteAtts = [];

/* ====================================================================
   THE SHELF
   ==================================================================== */
function renderNotes() {
    const t = trip();
    paintNoteChips();

    if (!t) {
        set('noteNote', '');
        return html('noteList', emptyState('bi-journal-text', 'Nothing open',
            'Notes belong to a trip, an event or an activity. Create one first.'));
    }

    const all = mine(db.notes);
    const list = noteFilter === 'all' ? all : all.filter((n) => (n.type || 'general') === noteFilter);

    set('noteNote', all.length
        ? (list.length === all.length ? plural(all.length, 'note') : list.length + ' of ' + all.length)
        : '');

    if (!all.length) {
        return html('noteList', emptyState('bi-journal-text', 'No notes yet',
            'The things that do not belong to a minute: what to bring, what to confirm, what to remember.'));
    }
    if (!list.length) {
        return html('noteList', emptyState('bi-journal-text',
            'No ' + noteTypeOf(noteFilter).label.toLowerCase() + ' notes', 'There are ' + all.length + ' others.'));
    }

    /* Pinned to a day first, in date order, then the ones about the whole
       trip — a note tied to Tuesday is more urgent than a standing one. */
    const sorted = list.slice().sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
    });

    html('noteList', '<div class="note-deck">' + sorted.map(noteCard).join('') + '</div>');
}

function noteCard(n) {
    const ty = noteTypeOf(n.type);
    const links = n.links || [];
    const atts = n.atts || [];

    return '<article class="note-card" id="note-' + esc(n.id) + '" style="' + tone(ty) + '">'
        + '<div class="nc-head">'
        +   '<span class="nc-type">' + ty.mark + ' ' + esc(ty.label) + '</span>'
        +   '<span class="nc-when">' + (n.date ? fmtDay(n.date) : 'Whole trip') + '</span>'
        +   '<span class="nc-acts">'
        +     '<button type="button" class="row-x is-edit" data-edit-note="' + esc(n.id) + '" title="Edit"><i class="bi bi-pencil"></i></button>'
        +     '<button type="button" class="row-x" data-drop-note="' + esc(n.id) + '" title="Delete"><i class="bi bi-trash3"></i></button>'
        +   '</span>'
        + '</div>'
        + (n.title ? '<h3>' + esc(n.title) + '</h3>' : '')
        + noteBody(n.body || '')
        + (links.length
            ? '<div class="nc-links">' + links.map((l) =>
                '<a class="nc-link" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">'
                + '<i class="bi bi-box-arrow-up-right"></i>' + esc(l.label || l.url) + '</a>').join('') + '</div>'
            : '')
        + (atts.length ? '<div class="nc-atts">' + atts.map((a, i) => noteAttChip(n.id, a, i)).join('') + '</div>' : '')
        + '</article>';
}

/* An image is worth showing; a document is worth naming. Both open the
   same way, so the difference is only what the button looks like. */
function noteAttChip(noteId, att, i) {
    const at = ' data-note-att="' + esc(noteId) + ':' + i + '" title="' + esc(att.name) + '"';
    return /^image\//.test(att.type)
        ? '<button type="button" class="nc-shot"' + at + '><img src="' + esc(att.data) + '" alt="' + esc(att.name) + '"></button>'
        : '<button type="button" class="stop-chip is-link"' + at + '>'
            + '<i class="bi ' + attIcon(att.type) + '"></i>' + esc(att.name) + '</button>';
}

/* --------------------------------------------------------------------
   The body

   Both examples in the spec are a line, a colon, and a list under it, so
   a line that starts with a bullet mark becomes one. That is the whole
   of the formatting — anything more is a rich text editor, and a rich
   text editor is a project rather than a field.

   Not checkboxes. "Bring passport" reads like something to tick, but the
   app already has a screen for ticking things off, and two half packing
   lists are worse than one whole one.
   -------------------------------------------------------------------- */
function noteBody(text) {
    if (!text.trim()) return '';

    const out = [];
    let bullets = [];
    const flush = () => {
        if (!bullets.length) return;
        out.push('<ul>' + bullets.map((b) => '<li>' + esc(b) + '</li>').join('') + '</ul>');
        bullets = [];
    };

    text.split('\n').forEach((raw) => {
        const line = raw.trim();
        const bullet = line.match(/^[*\-•]\s+(.*)$/);
        if (bullet) return bullets.push(bullet[1]);
        flush();
        if (line) out.push('<p>' + esc(line) + '</p>');
    });
    flush();

    return '<div class="nc-body">' + out.join('') + '</div>';
}

function paintNoteChips() {
    const all = trip() ? mine(db.notes) : [];
    const chip = (id, label, mark, toneRow, n, on) =>
        '<button type="button" class="cat-chip' + (on ? ' is-on' : '') + '" style="' + tone(toneRow) + '"'
        + ' data-note-filter="' + id + '" aria-pressed="' + on + '">'
        + '<span class="dot"></span>' + (mark ? mark + ' ' : '') + esc(label)
        + (n ? ' <span class="n">' + n + '</span>' : '') + '</button>';

    html('noteChips', chip('all', 'All', '', { tone: 'slate' }, all.length, noteFilter === 'all')
        + NOTE_TYPE_ORDER.map((k) => {
            const ty = NOTE_TYPES[k];
            const n = all.filter((x) => (x.type || 'general') === k).length;
            return chip(k, ty.label, ty.mark, ty, n, noteFilter === k);
        }).join(''));
}

/** The notes pinned to one day, for the plan above to draw. */
const notesOn = (date) => mine(db.notes).filter((n) => n.date === date);

/* ====================================================================
   THE FORM
   ==================================================================== */
function openNoteForm(id) {
    const n = id ? db.notes.find((x) => x.id === id) : null;
    if (id && !n) return;

    editNote = id || null;
    fillNoteTypes(n ? n.type : (noteFilter === 'all' ? 'general' : noteFilter));
    $('noteDate').value = n ? (n.date || '') : '';
    $('noteTitle').value = n ? (n.title || '') : '';
    $('noteBody').value = n ? (n.body || '') : '';
    $('noteLinks').value = n && n.links
        ? n.links.map((l) => (l.label && l.label !== l.url ? l.label + ' | ' + l.url : l.url)).join('\n')
        : '';
    noteAtts = n && n.atts ? n.atts.slice() : [];
    paintNoteAtts();

    set('noteSaveLabel', editNote ? 'Save changes' : 'Add note');
    $('noteSave').querySelector('i').className = 'bi ' + (editNote ? 'bi-check-lg' : 'bi-plus-lg');
    $('noteForm').hidden = false;
    $('noteTitle').focus();
    $('noteForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function blankNoteForm() {
    noteAtts = [];
    ['noteTitle', 'noteBody', 'noteLinks', 'noteDate'].forEach((id) => { $(id).value = ''; });
    paintNoteAtts();
}

function closeNoteForm() {
    editNote = null;
    blankNoteForm();
    $('noteForm').hidden = true;
}

function saveNote() {
    const t = trip();
    if (!t) return;

    const title = $('noteTitle').value.trim();
    const body = $('noteBody').value.trim();
    /* A note with neither a title nor a word in it is an empty card. */
    if (!title && !body && !noteAtts.length) return $('noteTitle').focus();

    const row = {
        trip: t.id,
        type: $('noteType').value || 'general',
        date: $('noteDate').value || '',
        title, body,
        links: parseLinks($('noteLinks').value),
        atts: noteAtts.slice(),
    };

    if (editNote) {
        Object.assign(db.notes.find((n) => n.id === editNote), row);
    } else {
        row.id = newId('n');
        db.notes.push(row);
    }

    save();
    closeNoteForm();
    repaint();
}

/* "Hotel booking | https://…" or a bare address. A line with no address
   in it is dropped rather than turned into a link to nowhere. */
function parseLinks(text) {
    return text.split('\n').map((raw) => {
        const line = raw.trim();
        if (!line) return null;
        const bar = line.indexOf('|');
        const label = bar > -1 ? line.slice(0, bar).trim() : '';
        let url = (bar > -1 ? line.slice(bar + 1) : line).trim();
        if (!url) return null;
        /* A bare "booking.com/x" is an address somebody typed, not a path
           on this app — so it is given the scheme it meant. */
        if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) url = 'https://' + url;
        if (!/^https?:\/\/\S+$/i.test(url)) return null;
        return { label: label || url, url };
    }).filter(Boolean);
}

function fillNoteTypes(selected) {
    const el = $('noteType');
    if (!el) return;
    el.innerHTML = NOTE_TYPE_ORDER.map((k) =>
        '<option value="' + k + '">' + NOTE_TYPES[k].mark + '  ' + esc(NOTE_TYPES[k].label) + '</option>').join('');
    el.value = NOTE_TYPES[selected] ? selected : 'general';
}

function paintNoteAtts() {
    const shelf = $('noteAttList');
    if (!shelf) return;

    shelf.hidden = !noteAtts.length;
    shelf.innerHTML = noteAtts.map((a, i) => '<div class="att-held is-sm">'
        + (/^image\//.test(a.type)
            ? '<img src="' + esc(a.data) + '" alt="' + esc(a.name) + '">'
            : '<i class="bi ' + attIcon(a.type) + '"></i>')
        + '<button type="button" class="att-x" data-drop-note-att="' + i + '" aria-label="Remove ' + esc(a.name) + '">'
        +   '<i class="bi bi-x-lg"></i></button>'
        + '<span class="att-name">' + esc(a.name) + '</span>'
        + '</div>').join('');

    set('noteAttNote', noteAtts.length
        ? plural(noteAtts.length, 'file') + ' · ' + fmtBytes(noteAtts.reduce((n, a) => n + (a.size || 0), 0))
        : 'Images are scaled down; anything else is kept as it is, up to 1 MB each.');
}

/* ====================================================================
   BOOKINGS
   ==================================================================== */
let editBook = null;

function renderBook() {
    /* A booking carries the same `kind` a stop does and is read by the same
       kindOf(), so it is offered the same list rather than a second one that
       could drift out of step with it. */
    fillKindSelect($('bookKind'), $('bookKind').value || 'travel');

    const t = trip();
    if (!t) {
        set('bookNote', '');
        return html('bookList', emptyState('bi-ticket-perforated', 'Nothing open', 'Bookings belong to a trip, an event or an activity.'));
    }

    const list = mine(db.books).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    if (!list.length) {
        set('bookNote', '');
        return html('bookList', emptyState('bi-ticket-perforated',
            'Nothing booked yet', 'Flights, stays and tickets all live here — held ones included.'));
    }

    const sums = tally(t);
    $('bookNote').innerHTML = money(sums.paid) + ' paid · <b>'
        + money(sums.held + sums.idea) + '</b> still open';

    const rows = list.map((b) => {
        const st = STATUS[b.status] || STATUS.idea;
        return '<tr>'
            + '<td>' + disc(b.kind, true) + ' <strong style="display:inline">' + esc(b.title) + '</strong>'
            +   (b.who || b.ref ? '<small>' + esc([b.who, b.ref].filter(Boolean).join(' · ')) + '</small>' : '') + '</td>'
            + '<td>' + (b.date ? fmtDay(b.date) : '—') + '</td>'
            + '<td><span class="tag ' + st.tag + '">' + st.label + '</span></td>'
            + '<td class="is-strong">' + amount(b.cost, b.cur, t) + '</td>'
            + '<td class="row-actions">'
            +   '<button type="button" class="row-x is-edit" data-edit-book="' + esc(b.id) + '" title="Edit"><i class="bi bi-pencil"></i></button>'
            +   '<button type="button" class="row-x" data-drop-book="' + esc(b.id) + '" title="Remove"><i class="bi bi-x-lg"></i></button>'
            + '</td></tr>';
    }).join('');

    const total = list.reduce((n, b) => n + (b.cost || 0), 0);

    html('bookList', ''
        + '<div class="table-wrap"><table class="data-table">'
        + '<thead><tr><th>Booking</th><th>Date</th><th>Status</th><th>Cost</th><th></th></tr></thead>'
        + '<tbody>' + rows
        + '<tr class="total-row"><td>Everything</td><td></td><td></td><td>' + money(total) + '</td><td></td></tr>'
        + '</tbody></table></div>');
}

function saveBook() {
    const t = trip();
    if (!t) return;

    const title = $('bookTitle').value.trim();
    if (!title) return $('bookTitle').focus();

    const row = {
        trip: t.id,
        kind: $('bookKind').value,
        date: $('bookDate').value,
        status: $('bookStatus').value,
        cost: toSen($('bookCost').value),
        cur: $('bookCur').value || homeCur(),
        title,
        who: $('bookWho').value.trim(),
        ref: $('bookRef').value.trim(),
    };

    if (editBook) {
        Object.assign(db.books.find((b) => b.id === editBook), row);
        editBook = null;
    } else {
        row.id = newId('b');
        db.books.push(row);
    }

    save();
    clearBookForm();
    repaint();
}

function blankBookForm() {
    const t = trip();
    ['bookTitle', 'bookWho', 'bookRef', 'bookCost'].forEach((id) => { $(id).value = ''; });
    $('bookDate').value = t ? t.from : '';
    fillKindSelect($('bookKind'), 'travel');
    $('bookStatus').value = 'held';
    fillCurSelect($('bookCur'), homeCur());
}

function clearBookForm() {
    editBook = null;
    blankBookForm();
    set('bookFormTitle', 'Add a booking');
    set('bookSaveLabel', 'Add booking');
    setCancelBtn('bookCancel', false);
}

function openBookEdit(id) {
    unfold('bookForm');
    const b = db.books.find((x) => x.id === id);
    if (!b) return;
    editBook = id;
    fillKindSelect($('bookKind'), b.kind || 'travel');
    $('bookDate').value = b.date || '';
    $('bookStatus').value = b.status || 'held';
    $('bookCost').value = b.cost ? fromSen(b.cost) : '';
    fillCurSelect($('bookCur'), b.cur || homeCur());
    $('bookTitle').value = b.title || '';
    $('bookWho').value = b.who || '';
    $('bookRef').value = b.ref || '';
    set('bookFormTitle', 'Edit booking');
    set('bookSaveLabel', 'Save changes');
    setCancelBtn('bookCancel', true);
    $('bookTitle').focus();
    $('bookTitle').scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* ====================================================================
   PEOPLE & PARTICIPANTS

   Here rather than on the Trips screen, because this is where names are
   used: an expense is split between people, and somebody who is not on
   the list cannot be ticked.

   Module 02 asks for a Members *count*, because at the point you are
   creating a trip that is all you know. The count follows this list once
   anybody is named — a trip with four people on it and Members saying 2
   is a trip that is wrong.
   ==================================================================== */
let editPerson = null;

const peopleOf = (t) => (t && Array.isArray(t.people) ? t.people : []);
const personOf = (t, id) => peopleOf(t).find((p) => p.id === id) || null;
const nameOf = (t, id) => (personOf(t, id) || {}).name || 'Someone';

function syncMembers(t) {
    if (!t) return;
    if (peopleOf(t).length > (t.who || 0)) t.who = peopleOf(t).length;
}

/* ====================================================================
   THE ROSTER
   ==================================================================== */
function paintPeople() {
    const t = trip();

    const list = peopleOf(t);
    set('peopleNote', t ? (list.length ? plural(list.length, 'person', 'people') : 'nobody named yet') : '');

    if (!t) {
        return html('peopleList', emptyState('bi-people', 'Nothing open',
            'People belong to a trip, an event or an activity.'));
    }

    if (!list.length) {
        return html('peopleList', emptyState('bi-people', 'Nobody named yet',
            'Name the people paying and an expense can be split between them.'));
    }

    html('peopleList', '<div class="people-deck">' + list.map((p) => personCard(p, t)).join('') + '</div>');
}

function personCard(p, t) {
    const paid = mine(db.spend).filter((x) => x.by === p.id);
    const inSplit = mine(db.spend).filter((x) => (x.who || []).includes(p.id)).length;
    const bal = balances(t).find((b) => b.person.id === p.id && !b.gone);
    const net = bal ? bal.net : 0;

    return '<article class="person-card">'
        + '<span class="person-mark is-lg">' + esc(initials(p.name)) + '</span>'
        + '<div class="pc-body">'
        +   '<div class="pc-top">'
        +     '<h3>' + esc(p.name || 'Unnamed') + '</h3>'
        +   '</div>'

        +   (p.phone || p.email
            ? '<div class="pc-reach">'
            +   (p.phone ? '<a href="tel:' + esc(p.phone.replace(/[^+\d]/g, '')) + '">'
                    + '<i class="bi bi-telephone"></i>' + esc(p.phone) + '</a>' : '')
            +   (p.email ? '<a href="mailto:' + esc(p.email) + '">'
                    + '<i class="bi bi-envelope"></i>' + esc(p.email) + '</a>' : '')
            + '</div>'
            : '')

        +   (p.note ? '<p class="pc-note">' + esc(p.note) + '</p>' : '')

        +   '<div class="pc-money">'
        +     '<span>' + (paid.length ? plural(paid.length, 'expense') + ' paid' : 'paid for nothing') + '</span>'
        +     '<span>' + (inSplit ? 'in ' + plural(inSplit, 'split') : 'in no splits') + '</span>'
        +     (net
                ? '<b class="' + (net > 0 ? 'is-plus' : 'is-minus') + '">'
                    + (net > 0 ? 'owed ' : 'owes ') + moneyIn(Math.abs(net), t.home || 'MYR') + '</b>'
                : '<b class="is-square">square</b>')
        +   '</div>'
        + '</div>'
        + '<div class="pc-acts">'
        +   '<button type="button" class="row-x is-edit" data-edit-person="' + esc(p.id) + '" title="Edit"><i class="bi bi-pencil"></i></button>'
        +   '<button type="button" class="row-x" data-drop-person="' + esc(p.id) + '" title="Remove"><i class="bi bi-trash3"></i></button>'
        + '</div>'
        + '</article>';
}

function initials(name) {
    /* Letters only. A trailing "(removed)" or a middle initial with a full
       stop would otherwise put punctuation in a disc meant to hold a name. */
    const parts = String(name || '?').split(/[^\p{L}]+/u).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/* ====================================================================
   THE FORM
   ==================================================================== */
function openPersonForm(id) {
    const t = trip();
    if (!t) return;
    const p = id ? personOf(t, id) : null;
    if (id && !p) return;

    editPerson = id || null;
    $('personName').value = p ? (p.name || '') : '';
    $('personPhone').value = p ? (p.phone || '') : '';
    $('personEmail').value = p ? (p.email || '') : '';
    $('personNote').value = p ? (p.note || '') : '';

    set('personSaveLabel', editPerson ? 'Save changes' : 'Add person');
    $('personSave').querySelector('i').className = 'bi ' + (editPerson ? 'bi-check-lg' : 'bi-plus-lg');
    $('personForm').hidden = false;
    $('personName').focus();
    $('personForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function blankPersonForm() {
    ['personName', 'personPhone', 'personEmail', 'personNote'].forEach((id) => { $(id).value = ''; });
}

function closePersonForm() {
    editPerson = null;
    blankPersonForm();
    $('personForm').hidden = true;
}

function savePerson() {
    const t = trip();
    if (!t) return;

    const name = $('personName').value.trim();
    if (!name) return $('personName').focus();

    const row = {
        name,
        phone: $('personPhone').value.trim(),
        email: $('personEmail').value.trim(),
        note: $('personNote').value.trim(),
    };

    if (editPerson) {
        Object.assign(personOf(t, editPerson), row);
    } else {
        row.id = newId('pp');
        t.people = peopleOf(t).concat([row]);
    }

    syncMembers(t);
    save();
    closePersonForm();
    repaint();
}

/* Removing somebody cannot just happen the way a category can: their name
   is on expenses, and taking it off changes what those expenses say. So
   the expenses keep the id and print "Someone", and Undo puts the name
   back on all of them at once. */
function dropPerson(id) {
    const t = trip();
    const p = personOf(t, id);
    if (!t || !p) return;

    const at = peopleOf(t).indexOf(p);
    const paid = mine(db.spend).filter((x) => x.by === id).length;
    const inSplit = mine(db.spend).filter((x) => (x.who || []).includes(id)).length;

    t.people = peopleOf(t).filter((x) => x.id !== id);
    if (editPerson === id) closePersonForm();
    save();
    repaint();

    const touched = paid + inSplit;
    toast('Removed <b>' + esc(p.name) + '</b>'
        + (touched ? ' · still on ' + plural(touched, 'expense') : ''), {
        label: 'Undo',
        run: () => {
            const back = trip();
            if (!back) return;
            back.people = peopleOf(back).slice();
            back.people.splice(at, 0, p);
            syncMembers(back);
            save();
            repaint();
        },
    });
}

/* ====================================================================
   SPLIT & SETTLEMENT

   The balances answer "who is up and who is down". They do not answer
   "so who hands what to whom", and a table of five people all slightly
   out is a puzzle rather than an answer. This does the arithmetic.

   The plan is worked out fresh every time it is drawn, from the
   expenses. What is *stored* is the opposite: what has actually been
   handed over. A settlement is a claim about the real world, and the
   only part of it the app can be sure of is the part somebody typed.
   ==================================================================== */

/** The fewest transfers that square everybody off. */
function settlePlan(t) {
    const owed = [];
    const owing = [];

    balances(t).forEach((r) => {
        if (r.net > 0) owed.push({ id: r.person.id, name: r.person.name, left: r.net });
        else if (r.net < 0) owing.push({ id: r.person.id, name: r.person.name, left: -r.net });
    });

    /* Biggest against biggest. Matching the largest debt to the largest
       credit each time is what keeps the list to at most one transfer
       fewer than there are people — pay the person who is furthest up,
       and one of you drops out of the problem entirely. */
    owed.sort((a, b) => b.left - a.left);
    owing.sort((a, b) => b.left - a.left);

    const out = [];
    let i = 0;
    let j = 0;
    /* The loop cannot run away: each pass zeroes at least one side, and
       there are only so many people. The guard is for the cent that a
       rounded split can leave behind. */
    while (i < owed.length && j < owing.length && out.length < 64) {
        const amount = Math.min(owed[i].left, owing[j].left);
        if (amount > 0) out.push({ from: owing[j].id, fromName: owing[j].name, to: owed[i].id, toName: owed[i].name, amount });
        owed[i].left -= amount;
        owing[j].left -= amount;
        if (owed[i].left <= 0) i++;
        if (owing[j].left <= 0) j++;
    }

    return out.sort((a, b) => b.amount - a.amount);
}

/**
 * Everybody pays back whoever paid, expense by expense.
 *
 * The other way round from `settlePlan`. That one asks "who is up, who is
 * down" and matches the two sides off, which is the fewest transfers and the
 * most arithmetic to take on trust: the figure somebody is handed bears no
 * relation to anything they ate, and it can be owed to a person who bought
 * them nothing. This one asks the question a table actually asks — *whose
 * money paid for my dinner* — and answers it per expense, so every figure in
 * the list is somebody's own share of one thing one person paid for.
 *
 * Two people who owe each other both ways still hand over **the difference**.
 * You covered the taxi and they covered lunch; sending each other money
 * across is not a settlement, it is two people doing a favour for a bank. The
 * expenses on both sides stay on the transfer as `parts`, so the subtraction
 * can be shown rather than asserted.
 */
function settlePerPayer(t) {
    const named = {};
    peopleOf(t).forEach((x) => { named[x.id] = x.name; });
    const nameOf = (id) => named[id] || 'Someone (removed)';

    /* Directed first: "A owes B", with the expenses that made it up. */
    const owed = new Map();

    /* One expense, one payer, is everybody's share owed to whoever paid.
       A bill with several tills on it is the same question asked line by
       line — whose money paid for my laksa — which is what owedOn() does
       for both. */
    mine(db.spend).forEach((x) => {
        owedOn(x, t).forEach((debt) => {
            const key = debt.from + ':' + debt.to;
            const row = owed.get(key) || { from: debt.from, to: debt.to, amount: 0, parts: [] };
            row.amount += debt.amount;
            row.parts.push({ label: debt.label, amount: debt.amount });
            owed.set(key, row);
        });
    });

    /* Then folded, so no pair ever sends money in both directions. */
    const pairs = new Map();
    owed.forEach((row) => {
        const key = row.from < row.to ? row.from + ':' + row.to : row.to + ':' + row.from;
        const pair = pairs.get(key) || {};
        pair[row.from < row.to ? 'up' : 'down'] = row;
        pairs.set(key, pair);
    });

    const out = [];
    pairs.forEach((pair) => {
        const up = pair.up;
        const down = pair.down;
        const upSen = up ? up.amount : 0;
        const downSen = down ? down.amount : 0;
        if (upSen === downSen) return;      /* square: nothing has to move */

        const wins = upSen > downSen ? up : down;
        const loses = upSen > downSen ? down : up;

        out.push({
            from: wins.from, fromName: nameOf(wins.from),
            to: wins.to, toName: nameOf(wins.to),
            amount: Math.abs(upSen - downSen),
            parts: wins.parts.concat((loses ? loses.parts : [])
                .map((part) => ({ label: part.label, amount: part.amount, back: true }))),
        });
    });

    return out.sort((a, b) => a.fromName.localeCompare(b.fromName)
        || b.amount - a.amount);
}

/** Whichever of the two the trip asks for. Netting unless it says otherwise. */
function settleTransfers(t) {
    return t && t.settleStyle === 'payer' ? settlePerPayer(t) : settlePlan(t);
}

/** What each person put down, biggest first. Empty when nobody has paid. */
function settlePayers(t) {
    return balances(t)
        .filter((r) => r.paid > 0)
        .sort((a, b) => b.paid - a.paid);
}

/* --------------------------------------------------------------------
   What has actually been handed over

   Kept per pair rather than per transfer, because a transfer is derived
   and a pair is not: add an expense and the amounts move, but "Bob pays
   Jekaon" is still the same arrangement, and what Bob has already handed
   over is still true.
   -------------------------------------------------------------------- */
function settleRow(t, from, to) {
    return db.settle.find((r) => r.trip === t.id && r.from === from && r.to === to) || null;
}

function settleWrite(t, from, to, change) {
    let row = settleRow(t, from, to);
    if (!row) {
        row = { id: newId('st'), trip: t.id, from, to, paid: 0, cancelled: false, waived: false };
        db.settle.push(row);
    }
    Object.assign(row, change);
    save();
    repaint();
}

/* Derived, never stored: a status and an amount that can disagree is a
   status that will, and it is always the amount that is right. */
const SETTLE_STATUS = {
    pending:   { label: 'Pending',        tag: 'is-azure' },
    partly:    { label: 'Partially paid', tag: 'is-amber' },
    paid:      { label: 'Paid',           tag: 'is-green' },
    waived:    { label: 'Waived',         tag: 'is-violet' },
    cancelled: { label: 'Cancelled',      tag: 'is-muted' },
};

/* Waived and cancelled both close a transfer without money moving, and they
   are not the same thing. Cancelled says the transfer should never have been
   there — a receipt typed against the wrong person, an arrangement called
   off. Waived says it was right and the person owed let it go: the debt is
   real, it is settled, and nobody paid it. Only the second is worth telling
   the table about, which is why it keeps its own line in the summary. */
function settleStatus(row, amount) {
    if (row && row.cancelled) return 'cancelled';
    if (row && row.waived) return 'waived';
    const paid = row ? row.paid : 0;
    if (paid >= amount && amount > 0) return 'paid';
    if (paid > 0) return 'partly';
    return 'pending';
}

/**
 * The settlement, sized to paste into the group chat.
 *
 * Which is the whole brief, and it decides what is left out. On screen a
 * settlement can afford to show its working — what each person put in, which
 * expense made up which figure, what cancelled against what. Pasted into a
 * chat that is a wall of arithmetic in front of the one thing anybody scrolls
 * to: what do I send, and who to.
 *
 * So: three lines of context, then one transfer per line. Three, not none and
 * not the lot — any more and it buries the line people are looking for, any
 * less and the first reply is somebody asking where the figures came from.
 */
function settleSummaryText(t) {
    if (!t) return '';

    const cur = t.home || 'MYR';
    const plan = settleTransfers(t);
    const payers = settlePayers(t);
    const spent = mine(db.spend).reduce((n, x) => n + homeOf({ cost: x.amount, cur: x.cur }, t), 0);

    const lines = [(t.name || 'Trip') + ' — ' + moneyIn(spent, cur)];

    if (payers.length) {
        lines.push('Paid: ' + payers
            .map((r) => r.person.name + ' ' + moneyIn(r.paid, cur)).join(' · '));
    }
    lines.push('(' + plural(mine(db.spend).length, 'expense') + ', '
        + plural(peopleOf(t).length, 'person', 'people') + ')');
    lines.push('');

    if (!plan.length) {
        lines.push('Everybody is square — nothing has to move.');
        return lines.join('\n');
    }

    plan.forEach((tr) => {
        const row = settleRow(t, tr.from, tr.to);
        const state = settleStatus(row, tr.amount);
        lines.push(tr.fromName + ' → ' + tr.toName + ' ' + moneyIn(tr.amount, cur)
            + (state === 'paid' ? ' (paid)'
                : state === 'waived' ? ' (waived)'
                : state === 'cancelled' ? ' (cancelled)'
                : state === 'partly' ? ' (' + moneyIn(Math.max(0, tr.amount - (row ? row.paid : 0)), cur) + ' left)'
                : ''));
    });

    return lines.join('\n');
}

/** Which of the two ways is on, and the sentence saying what it does. */
function paintSettleStyle(t) {
    const seg = $('settleStyle');
    if (!seg) return;

    const payer = !!(t && t.settleStyle === 'payer');
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', (b.dataset.val === 'payer') === payer));
    html('settleStyleHint', '<i class="bi bi-info-circle"></i>' + (payer
        ? 'Everybody pays back whoever paid for what they had, expense by expense. More transfers, '
          + 'and no figure anybody has to take on trust. Where two of you owe each other, only the '
          + 'difference moves.'
        : 'Every share is netted against what that person put in, then the biggest debt is matched '
          + 'to the biggest credit. The fewest transfers there are — but some of the money goes to '
          + 'somebody who did not buy the thing being paid for.'));
}

/**
 * Text onto the clipboard, and something on screen saying it went.
 *
 * `navigator.clipboard` is not there on an insecure origin, and a copy button
 * that fails in silence is worse than one that is not offered — so the old
 * way is kept behind it, and either way the reader is told.
 */
function copyText(text, said) {
    const done = () => toast(said || 'Copied');
    const fallback = () => {
        const box = document.createElement('textarea');
        box.value = text;
        box.setAttribute('readonly', '');
        box.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(box);
        box.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        box.remove();
        if (ok) done();
        else toast('Could not reach the clipboard — copy it by hand.');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
        return;
    }
    fallback();
}

/* ====================================================================
   THE SCREEN
   ==================================================================== */
function paintSettle(t) {
    paintSettleStyle(t);
    const styleField = $('settleStyleField');
    if (styleField) styleField.hidden = !t;

    if (!t) {
        set('settleNote', '');
        return html('settleList', emptyState('bi-arrow-left-right', 'Nothing open',
            'A settlement belongs to a trip, an event or an activity.'));
    }

    const plan = settleTransfers(t);

    if (!plan.length) {
        const any = mine(db.spend).length;
        set('settleNote', '');
        return html('settleList', emptyState('bi-check2-circle',
            any ? 'Everybody is square' : 'Nothing to settle',
            any ? 'What everyone put in matches what they used. No money has to move.'
                : 'Split an expense between people and the transfers appear here.'));
    }

    const cur = t.home || 'MYR';
    const rows = plan.map((tr) => {
        const row = settleRow(t, tr.from, tr.to);
        const paid = row ? row.paid : 0;
        const state = settleStatus(row, tr.amount);
        return { tr, row, paid, state, left: Math.max(0, tr.amount - paid) };
    });

    /* A waived transfer is closed the same way a paid one is — it stops
       counting against the total, because that money is never going to move.
       It is not counted as handed over either: nobody handed it over. So the
       waived part comes out of the bar and is named beside it instead, and
       anything that did change hands before it was waived stays in both.  */
    const live = rows.filter((r) => r.state !== 'cancelled' && r.state !== 'waived');
    const gone = rows.filter((r) => r.state === 'waived');
    const kept = gone.reduce((n, r) => n + Math.min(r.paid, r.tr.amount), 0);
    const owed = live.reduce((n, r) => n + r.tr.amount, 0) + kept;
    const done = live.reduce((n, r) => n + Math.min(r.paid, r.tr.amount), 0) + kept;
    const off  = gone.reduce((n, r) => n + Math.max(0, r.tr.amount - r.paid), 0);

    /* Exact, like the cards under it — a summary that rounds while the rows
       it summarises do not is a summary that appears to disagree with them. */
    set('settleNote', plural(plan.length, 'transfer') + ' · '
        + moneyIn(done, cur) + ' of ' + moneyIn(owed, cur) + ' handed over'
        + (off ? ' · ' + moneyIn(off, cur) + ' waived' : ''));

    html('settleList', ''
        + (owed
            ? '<div class="settle-bar"><span class="sb-track"><span class="sb-fill" style="width:'
                + Math.round(done / owed * 100) + '%"></span></span>'
                + '<span class="settle-left">' + moneyIn(owed - done, cur) + ' still to move</span></div>'
            : '')
        + '<div class="settle-deck">' + rows.map((r) => settleCard(r, t, cur)).join('') + '</div>');
}

function settleCard(r, t, cur) {
    const st = SETTLE_STATUS[r.state];
    const key = esc(r.tr.from) + ':' + esc(r.tr.to);

    /* Which expenses this figure is made of. Only worth printing when there
       is more than one, or when some of it came back the other way — a
       single expense is already named by the transfer it produced. */
    const bits = r.tr.parts || [];
    const parts = bits.length > 1
        ? bits.map((b) => (b.back ? 'less ' : '') + esc(b.label) + ' ' + moneyIn(b.amount, cur))
            .join(' · ')
        : '';

    return '<article class="settle-card' + (r.state === 'cancelled' ? ' is-off' : '')
        + (r.state === 'waived' ? ' is-waived' : '') + '">'
        + '<div class="st-who">'
        +   '<span class="person-mark is-sm">' + esc(initials(r.tr.fromName)) + '</span>'
        +   '<span class="st-name">' + esc(r.tr.fromName) + '</span>'
        +   '<i class="bi bi-arrow-right"></i>'
        +   '<span class="person-mark is-sm">' + esc(initials(r.tr.toName)) + '</span>'
        +   '<span class="st-name">' + esc(r.tr.toName) + '</span>'
        +   '<span class="tag ' + st.tag + '">' + esc(st.label) + '</span>'
        + '</div>'

        + '<div class="st-figure">'
        +   '<b>' + moneyIn(r.tr.amount, cur) + '</b>'
        +   (r.state === 'partly'
                ? '<span class="st-left">' + moneyIn(r.left, cur) + ' left</span>'
                : r.state === 'waived' && r.paid > 0
                ? '<span class="st-left is-off">' + moneyIn(r.left, cur) + ' waived</span>'
                : '')
        + '</div>'

        /* Its own row under the two above, so the name and the figure keep
           the line they have always shared. */
        + (parts ? '<p class="st-parts">' + parts + '</p>' : '')

        + '<div class="st-acts">'
        +   '<label class="st-paid"><span>Handed over</span>'
        +     '<div class="money-input is-bare"><input type="number" min="0" step="0.01" placeholder="0.00"'
        +       ' data-settle-paid="' + key + '" value="' + (r.paid ? esc(fromSen(r.paid)) : '') + '"'
        +       (r.state === 'cancelled' || r.state === 'waived' ? ' disabled' : '') + '></div>'
        +   '</label>'
        +   (r.state === 'cancelled' || r.state === 'waived'
            ? '<button type="button" class="ghost-btn" data-settle-back="' + key + '">'
                + '<i class="bi bi-arrow-counterclockwise"></i>'
                + (r.state === 'waived' ? 'Undo' : 'Reopen') + '</button>'
            : '<button type="button" class="ghost-btn" data-settle-all="' + key + '">'
                + '<i class="bi bi-check-lg"></i>' + (r.state === 'paid' ? 'Not yet' : 'All of it') + '</button>'
              /* Between the two: nothing is owed any more, and nothing was
                 paid. The person owed is the one who can say it, so the
                 wording is theirs rather than the debtor's. */
              + '<button type="button" class="ghost-btn" data-settle-waive="' + key + '"'
                + ' title="' + esc(r.tr.toName) + ' lets this one go — the debt closes and nobody pays it">'
                + '<i class="bi bi-slash-circle"></i>Waive</button>'
              + '<button type="button" class="ghost-btn is-danger" data-settle-off="' + key + '">'
                + '<i class="bi bi-x-lg"></i>Cancel</button>')
        + '</div>'
        + '</article>';
}

/* ====================================================================
   MODULE 05 · EXPENSE MANAGER

   Money that actually left, as opposed to money that was planned. The
   Itinerary is the other half of this: a schedule item's Actual cost is
   one of these records, read live, so correcting a receipt here corrects
   the plan there without anything being copied.

   Bookings are still their own thing — money committed ahead of time,
   which is a different question from money spent. Both can stand behind
   a schedule item's actual figure, and both are offered there.
   ==================================================================== */
const DEFAULT_SPEND_CATS = [
    { id: 'sc-transport', label: 'Transport',     mark: '✈️', tone: 'azure' },
    { id: 'sc-stay',      label: 'Accommodation', mark: '\u{1F3E8}', tone: 'green' },
    { id: 'sc-food',      label: 'Food',          mark: '\u{1F35C}', tone: 'node' },
    { id: 'sc-do',        label: 'Activities',    mark: '\u{1F39F}️', tone: 'violet' },
    { id: 'sc-taxi',      label: 'Taxi',          mark: '\u{1F695}', tone: 'sky' },
    { id: 'sc-shop',      label: 'Shopping',      mark: '\u{1F6CD}️', tone: 'rose' },
    { id: 'sc-drinks',    label: 'Drinks',        mark: '☕', tone: 'amber' },
    { id: 'sc-grocery',   label: 'Groceries',     mark: '\u{1F6D2}', tone: 'teal' },
    { id: 'sc-fees',      label: 'Fees',          mark: '\u{1F4B3}', tone: 'red' },
    { id: 'sc-other',     label: 'Other',         mark: '\u{1F4E6}', tone: 'slate' },
];

/** Falls back to something drawable, so a row filed under a deleted
    category still appears rather than vanishing with it. */
function spendCatOf(id) {
    return db.spendCats.find((c) => c.id === id)
        || db.spendCats[db.spendCats.length - 1]
        || { id: 'sc-other', label: 'Other', mark: '\u{1F4E6}', tone: 'slate' };
}

const SPLITS = {
    equal:   { label: 'Equal',         hint: 'Split evenly between everybody ticked.' },
    percent: { label: 'Percentage',    hint: 'A share each, as a percentage. It has to come to 100.' },
    exact:   { label: 'Custom amount', hint: 'Type what each person owes. It has to add up to the amount.' },
    items:   { label: 'By item',       hint: 'Build the bill line by line. The amount above is what it comes to.' },
};

let editSpend = null;
let spendCatFilter = 'all';
let spendSplit = 'equal';
let spendWho = [];
let spendParts = {};
/* The by-item bill being typed. Blank until the method asks for one, and
   kept on the expense after that — see billCompute() below. */
let spendBill = blankBill();
let receiptHeld = null;
let spendAtts = [];

/* ====================================================================
   WHAT A SPLIT COMES TO

   One function, because the answer has to be the same on the card, in
   the balances and in the Budget. Everything is worked out in the trip's
   own money — a split across two currencies still has to add up.
   ==================================================================== */
function shareOut(x, t) {
    const total = homeOf({ cost: x.amount, cur: x.cur }, t);
    /* Not filtered against the roster. Taking a name off the list must not
       quietly re-divide what was already spent — a dinner split four ways
       stays split four ways, and the fourth share simply belongs to
       somebody the app can no longer name. */
    const who = (x.who || []);
    const bag = {};

    if (!who.length) return { total, bag };

    /* A bill divides itself: every line, every shared dish and everything
       the place charged on top come out as one figure per person, and the
       expense total is handed round in that ratio so the shares add back
       to it exactly even after the money has changed currency. */
    if (x.split === 'items') {
        const parts = allocate(total, billCompute(x, t).paysSen);
        who.forEach((id, i) => { bag[id] = parts[i] || 0; });
        return { total, bag };
    }

    if (x.split === 'exact') {
        who.forEach((id) => { bag[id] = toHome(Number((x.parts || {})[id]) || 0, x.cur, t) || 0; });
        return { total, bag };
    }

    /* `shares` is what percentages used to be — a bare weight — and the
       arithmetic is the same either way: each person's number over the
       sum of them. A store written before the change still divides right. */
    if (x.split === 'percent' || x.split === 'shares') {
        const weights = who.map((id) => Math.max(0, Number((x.parts || {})[id]) || 0));
        const sum = weights.reduce((n, w) => n + w, 0);
        if (!sum) return shareOut(Object.assign({}, x, { split: 'equal' }), t);
        /* The last person takes the rounding, so the parts always add back
           up to the total instead of landing a cent short of it. */
        let left = total;
        who.forEach((id, i) => {
            const cut = i === who.length - 1 ? left : Math.round(total * weights[i] / sum);
            bag[id] = cut;
            left -= cut;
        });
        return { total, bag };
    }

    const each = Math.floor(total / who.length);
    let left = total;
    who.forEach((id, i) => {
        const cut = i === who.length - 1 ? left : each;
        bag[id] = cut;
        left -= cut;
    });
    return { total, bag };
}

/** Everything one person put in, and everything they used. */
function balances(t) {
    const rows = {};
    peopleOf(t).forEach((p) => { rows[p.id] = { person: p, paid: 0, share: 0, gone: false }; });

    /* Somebody taken off the list is still on the expenses they were on,
       so they still get a row — otherwise the two columns stop adding up
       to what was spent, and a table that does not add up is worse than
       one with a name in it nobody recognises. */
    const ghost = (id) => {
        if (!rows[id]) rows[id] = { person: { id, name: 'Someone (removed)' }, paid: 0, share: 0, gone: true };
        return rows[id];
    };

    mine(db.spend).forEach((x) => {
        const { bag } = shareOut(x, t);
        /* Who put the money down, which is one person on most expenses and
           a list of tills on a bill several people paid. Either way it adds
           up to the expense, so the two columns still balance. */
        const put = paidOut(x, t);
        Object.keys(put).forEach((id) => { ghost(id).paid += put[id]; });
        Object.keys(bag).forEach((id) => { ghost(id).share += bag[id]; });
    });

    return Object.keys(rows).map((id) => Object.assign(rows[id], { net: rows[id].paid - rows[id].share }));
}

/* ====================================================================
   THE BILL

   The fourth split method, and the only one that does not divide a
   figure somebody typed: it builds it. A line per thing somebody had, a
   line per thing the table shared, whatever the place charged on top,
   and — because one evening is often three tills — a line per handover.

   Everything here is worked out in the expense's own currency and in
   sen. shareOut() is what turns the answer into the trip's money, so
   that a bill and a lump sum reach the balances the same way.
   ==================================================================== */

const CHARGE_PRESETS = {
    none: { service: 0, tax: 0 },
    tax:  { service: 0, tax: 6 },
    svc:  { service: 10, tax: 0 },
    both: { service: 10, tax: 6 },
};

function blankBill() {
    return {
        items: [], shared: [],
        service: 0, tax: 0,
        discount: 0, discountUnit: 'pct',
        itemDiscounts: false, offUnit: 'pct',
        round: false,
        delivery: false, deliveryFee: 0, platformFee: 0,
        voucher: 0, voucherUnit: 'cur', feeSplit: 'even',
        multiPay: false, payments: [],
    };
}

/** A stored bill with every field the engine expects, whatever it was saved without. */
function billOf(x) {
    const b = Object.assign(blankBill(), (x && x.bill) || {});
    ['items', 'shared', 'payments'].forEach((k) => { if (!Array.isArray(b[k])) b[k] = []; });
    return b;
}

/* Split a figure by weights so the parts always add back to it exactly.
   The floors are handed out first and the leftover sen go to the biggest
   remainders, which is the only division that is both fair and closed. */
function allocate(totalSen, weights) {
    if (!weights.length || totalSen <= 0) return weights.map(() => 0);

    const sum = weights.reduce((n, w) => n + w, 0);
    const exact = sum > 0
        ? weights.map((w) => totalSen * w / sum)
        : weights.map(() => totalSen / weights.length);

    const parts = exact.map(Math.floor);
    const order = exact
        .map((value, index) => ({ index, over: value - Math.floor(value) }))
        .sort((a, b) => b.over - a.over);

    let left = totalSen - parts.reduce((n, p) => n + p, 0);
    for (let k = 0; left > 0; k++, left--) parts[order[k % order.length].index]++;
    return parts;
}

/** The affix a money field wears: RM at home, the code anywhere else. */
function curMark(cur) {
    const code = cur || homeCur();
    return (CUR[code] && CUR[code].pre.trim()) || code;
}

/**
 * The whole bill, in the currency it was paid in.
 *
 * The order of the arithmetic is the order the receipt prints it in, and
 * it is not interchangeable: a discount comes off the food first, the
 * service charge goes on what is left, and the tax is charged on the
 * food rather than on the service charge — taxing the sum overcharges
 * the table by the tax on the service, and every share with it.
 */
function billCompute(x, t) {
    const bill = billOf(x);
    const who = (x.who || []).slice();

    const gross = (it) => Math.max(0, Number(it.amount) || 0);

    /* A discount on one dish is not the same animal as a discount on the
       bill. The bill's scales every share by the same factor and moves
       nobody's position; a dish's belongs to whoever ate that dish, so it
       comes off the line before any weight is taken from it. */
    const offOf = (it) => {
        if (!bill.itemDiscounts) return 0;
        const typed = Math.max(0, Number(it.off) || 0);
        const raw = bill.offUnit === 'cur' ? toSen(typed) : Math.round(gross(it) * typed / 100);
        return Math.min(raw, gross(it));
    };
    const netOf = (it) => gross(it) - offOf(it);
    const itemsOf = (id) => bill.items.filter((it) => it.who === id);

    const all = bill.items.concat(bill.shared);
    const listedSen  = all.reduce((n, it) => n + gross(it), 0);
    const itemOffSen = all.reduce((n, it) => n + offOf(it), 0);

    const ownSen   = who.map((id) => itemsOf(id).reduce((n, it) => n + netOf(it), 0));
    const sharedSen = bill.shared.reduce((n, it) => n + netOf(it), 0);

    /* How one shared dish divides. Evenly unless the dish says otherwise,
       in which case it divides by portions: five pao at RM11, three eaten
       by one person and two by another, is 6.60 and 4.40 — not 5.50 each.
       `out` is the exclusion list rather than the guest list, so somebody
       ticked onto the expense later joins every dish by default, which is
       what "shared by everyone" has to keep meaning. */
    const unitsOf = (it) => who.map((id) => {
        if ((it.out || []).indexOf(id) > -1) return 0;
        if (!it.byUnits) return 1;
        return Math.max(0, Number((it.units || {})[id]) || 0);
    });

    /* Allocated dish by dish rather than over the pile: once two dishes
       divide different ways there is no single ratio to divide the pile
       by, and the odd sen belongs to whoever was short on *that* dish. */
    const sharedParts = who.map(() => 0);
    const sharedSplits = bill.shared.map((it) => {
        const units = unitsOf(it);
        const parts = allocate(netOf(it), units);
        parts.forEach((sen, i) => { sharedParts[i] += sen; });
        return { item: it, units, parts, total: units.reduce((n, u) => n + u, 0) };
    });

    const weights = ownSen.map((own, i) => own + sharedParts[i]);
    const foodSen = ownSen.reduce((n, v) => n + v, 0) + sharedSen;

    const serviceRate = Math.max(0, Number(bill.service) || 0);
    const taxRate     = Math.max(0, Number(bill.tax) || 0);

    const discountTyped = Math.max(0, Number(bill.discount) || 0);
    const discountSen = Math.min(bill.discountUnit === 'cur'
        ? toSen(discountTyped)
        : Math.round(foodSen * discountTyped / 100), foodSen);

    const afterOff  = foodSen - discountSen;
    const serviceSen = Math.round(afterOff * serviceRate / 100);
    const taxSen     = Math.round(afterOff * taxRate / 100);
    const foodPoolSen = afterOff + serviceSen + taxSen;

    /* Two flat fees, neither of them food. Neither gets bigger because
       somebody ordered more, which is why they divide evenly by default
       rather than riding on the shares. */
    const deliverySen = bill.delivery ? Math.max(0, Number(bill.deliveryFee) || 0) : 0;
    const platformSen = bill.delivery ? Math.max(0, Number(bill.platformFee) || 0) : 0;
    const feesSen = deliverySen + platformSen;

    /* The voucher comes off once everything is on the order — the food,
       the charges and the fees — because that is where the app takes it
       off, and because "free delivery" has to be able to reach the
       delivery fee. */
    const orderSen = foodPoolSen + feesSen;
    const voucherTyped = bill.delivery ? Math.max(0, Number(bill.voucher) || 0) : 0;
    const voucherSen = Math.min(bill.voucherUnit === 'pct'
        ? Math.round(orderSen * voucherTyped / 100)
        : toSen(voucherTyped), orderSen);

    let grandSen = orderSen - voucherSen;
    if (bill.round) grandSen = Math.round(grandSen / 5) * 5;

    const feeWeights = bill.feeSplit === 'order' ? weights : who.map(() => 1);
    const feeParts   = allocate(feesSen, feeWeights);
    const foodParts  = allocate(foodPoolSen, weights);
    /* With no fees there is nothing to add, so the division is literally
       the one the weights already say — which is what keeps a saved bill
       reading the same to the sen. */
    const spread   = feesSen > 0 ? foodParts.map((sen, i) => sen + feeParts[i]) : weights;
    const paysSen  = allocate(grandSen, spread);
    const shareSen = allocate(foodSen, weights);

    /* Every line of the bill in reading order, and each person's piece of
       it. A person's total is divided across the lines they are on rather
       than each line being worked out on its own, so the pieces add back
       to exactly what they pay and no sen goes missing between them. */
    const lines = [];
    who.forEach((id, index) => itemsOf(id).forEach((it) => lines.push({
        item: it, id: it.id, owner: index,
        label: (String(it.label || '').trim() || 'Item') + ' (' + nameOf(t, id) + ')',
    })));
    bill.shared.forEach((it) => lines.push({
        item: it, id: it.id, owner: -1,
        label: String(it.label || '').trim() || 'Shared item',
    }));

    const rawShare = who.map(() => lines.map(() => 0));
    lines.forEach((line, at) => {
        if (line.owner >= 0) {
            rawShare[line.owner][at] = netOf(line.item);
            return;
        }
        const split = sharedSplits.find((one) => one.item === line.item);
        who.forEach((id, i) => { rawShare[i][at] = split ? split.parts[i] : 0; });
    });

    const pieces  = who.map((id, i) => allocate(paysSen[i], rawShare[i]));
    const lineSen = lines.map((line, at) => who.reduce((n, id, i) => n + pieces[i][at], 0));

    /* Which payment claimed which line. A line belongs to at most one —
       the first that claims it — or the same money would be owed twice. */
    const payer = x.by || who[0] || '';
    const lineAt = {};
    lines.forEach((line, at) => { if (lineAt[line.id] === undefined) lineAt[line.id] = at; });

    const ownerOf = lines.map(() => payer);
    const claimed = {};
    const payAmountSen = {};
    const paidSen = {};
    let listedPaidSen = 0;

    if (bill.multiPay) {
        bill.payments.forEach((pay) => {
            const by = pay.by || payer;
            let sen = 0;

            (pay.items || []).forEach((id) => {
                const at = lineAt[id];
                if (at === undefined || claimed[id]) return;
                claimed[id] = true;
                ownerOf[at] = by;
                sen += lineSen[at];
            });

            /* Nothing named: it is a lump, and worth whatever was typed. */
            const amount = (pay.items || []).length ? sen : Math.max(0, Number(pay.amount) || 0);
            payAmountSen[pay.id] = amount;
            if (!amount || !by) return;
            paidSen[by] = (paidSen[by] || 0) + amount;
            listedPaidSen += amount;
        });
    }

    /* Whatever the listed payments leave over goes to the person named
       under Paid by. That one rule is what makes a bill with no payment
       list the same object as one with it: nothing listed leaves the
       whole bill over, and the whole bill lands on the one who paid. */
    const restSen = grandSen - listedPaidSen;
    if (payer) paidSen[payer] = (paidSen[payer] || 0) + restSen;

    return {
        bill, who, lines, pieces, lineSen, ownerOf, payer,
        listedSen, itemOffSen, ownSen, sharedSen, sharedParts, sharedSplits,
        foodSen, discountSen, discountTyped, serviceSen, taxSen, serviceRate, taxRate,
        deliverySen, platformSen, feesSen, feeParts, orderSen, voucherSen, voucherTyped,
        grandSen, weights, shareSen, paysSen,
        paidSen, payAmountSen, listedPaidSen, restSen,
    };
}

/**
 * What each person actually put down, in the trip's own money.
 *
 * One payer or five, this answers the same question, and it always adds
 * up to the expense — the balances are only honest while what was handed
 * over and what was spent are the same figure.
 */
function paidOut(x, t) {
    const total = homeOf({ cost: x.amount, cur: x.cur }, t);
    const out = {};

    if (x.split !== 'items' || !billOf(x).multiPay) {
        if (x.by) out[x.by] = total;
        return out;
    }

    const c = billCompute(x, t);
    /* A payment list that comes to more than the bill leaves the primary
       payer holding a negative, which is a warning on the form rather
       than a share of anything — it weighs nothing here. */
    const ids = Object.keys(c.paidSen).filter((id) => c.paidSen[id] > 0);
    if (!ids.length) {
        if (x.by) out[x.by] = total;
        return out;
    }

    const parts = allocate(total, ids.map((id) => c.paidSen[id]));
    ids.forEach((id, i) => { out[id] = parts[i]; });
    return out;
}

/**
 * Who owes whom because of one expense, before any netting off.
 *
 * With one payer that is the question it always was: everybody who had a
 * share owes the person who paid. With several it is asked line by line
 * — whose money paid for my laksa — so the figure somebody is handed can
 * still be traced to something they ate.
 */
function owedOn(x, t) {
    const out = [];
    const { bag } = shareOut(x, t);
    const label = (x.merchant || '').trim() || (x.desc || '').trim() || 'Expense';
    const bill = billOf(x);

    if (x.split === 'items' && bill.multiPay) {
        const c = billCompute(x, t);
        c.who.forEach((id, i) => {
            /* Each person's own pieces are re-divided out of their share
               in the trip's money, so the parts of a transfer add back to
               exactly what the balances say they owe. */
            const parts = allocate(bag[id] || 0, c.pieces[i]);
            c.lines.forEach((line, at) => {
                const owner = c.ownerOf[at];
                if (!owner || owner === id || parts[at] <= 0) return;
                out.push({ from: id, to: owner, amount: parts[at], label: label + ' · ' + line.label });
            });
        });
        return out;
    }

    if (!x.by) return out;
    Object.keys(bag).forEach((id) => {
        if (id === x.by || bag[id] <= 0) return;
        out.push({ from: id, to: x.by, amount: bag[id], label });
    });
    return out;
}

/* --------------------------------------------------------------------
   The bill on the form
   --------------------------------------------------------------------
   The rows are rebuilt only when one is added, removed or changes shape;
   everything else repaints the figures around them, because rebuilding
   mid-keystroke takes the caret out of the field being typed into.
   -------------------------------------------------------------------- */

/** The expense being typed, in the shape the engine reads. */
function billDraft() {
    return {
        who: spendWho.slice(),
        by: $('spendBy') ? $('spendBy').value : '',
        cur: $('spendCur') ? ($('spendCur').value || homeCur()) : homeCur(),
        bill: spendBill,
    };
}

const billItem = (id) => spendBill.items.concat(spendBill.shared).find((it) => it.id === id) || null;

/** A person coming off the expense takes their lines with them. */
function billDropPerson(id) {
    spendBill.items = spendBill.items.filter((it) => it.who !== id);
    spendBill.shared.forEach((it) => {
        if (it.out) it.out = it.out.filter((who) => who !== id);
        if (it.units) delete it.units[id];
    });
    spendBill.payments.forEach((pay) => {
        if (pay.by === id) pay.by = '';
        pay.items = (pay.items || []).filter((line) => billItem(line));
    });
}

function billMoney(sen, cur) {
    return moneyIn(sen, cur || (($('spendCur') && $('spendCur').value) || homeCur()));
}

function paintBillRows() {
    const t = trip();
    const cur = ($('spendCur') && $('spendCur').value) || homeCur();

    document.querySelectorAll('.bill-cur').forEach((el) => { el.textContent = curMark(cur); });

    if (!spendWho.length) {
        html('spendPeopleItems', '<p class="split-empty">Nobody is ticked above, so there is nobody to put a line under. '
            + 'Tick whoever was there and their lines appear here.</p>');
    } else {
        html('spendPeopleItems', spendWho.map((id) => ''
            + '<div class="split-person">'
            +   '<div class="split-person-head">'
            +     '<span class="person-mark is-sm">' + esc(initials(nameOf(t, id))) + '</span>'
            +     '<span class="split-person-name">' + esc(nameOf(t, id)) + '</span>'
            +     '<span class="split-person-sum" data-bill-sum="' + esc(id) + '">' + billMoney(0, cur) + '</span>'
            +   '</div>'
            +   '<div class="split-items">'
            +     spendBill.items.filter((it) => it.who === id).map((it) => billItemRow(it, 'What they had')).join('')
            +   '</div>'
            +   '<button type="button" class="split-add" data-bill-add="' + esc(id) + '">'
            +     '<i class="bi bi-plus-lg"></i>Add item</button>'
            + '</div>').join(''));
    }

    html('spendShared', spendBill.shared.length
        ? '<div class="split-items">' + spendBill.shared.map((it) =>
            billItemRow(it, 'Shared item') + billPortionRow(it)).join('') + '</div>'
        : '<p class="split-empty">Nothing shared yet &mdash; rice, a plate of fries, the drinks for the table: '
            + 'anything everybody chipped in for.</p>');

    $('spendPayCard').hidden = !spendBill.multiPay;
    $('spendPayNote').hidden = !spendBill.multiPay;
    $('spendMultiPay').checked = !!spendBill.multiPay;
    $('spendItemOff').checked = !!spendBill.itemDiscounts;
    $('spendRound').checked = !!spendBill.round;
    $('spendDelivery').checked = !!spendBill.delivery;
    $('spendOffUnit').hidden = !spendBill.itemDiscounts;
    $('spendDeliveryCard').hidden = !spendBill.delivery;

    if (spendBill.multiPay) {
        const lines = billCompute(billDraft(), t).lines;
        html('spendPayments', spendBill.payments.length
            ? spendBill.payments.map((pay) => billPayRow(pay, lines, t)).join('')
            : '<p class="split-empty">No tills listed yet, so the whole bill is down to whoever is under '
                + '<b>Paid by</b> above.</p>');
    }

    ['spendService:service', 'spendTax:tax', 'spendDiscount:discount'].forEach((pair) => {
        const [id, key] = pair.split(':');
        const el = $(id);
        if (el && document.activeElement !== el) el.value = spendBill[key] || '';
    });
    ['spendDeliveryFee:deliveryFee', 'spendPlatformFee:platformFee'].forEach((pair) => {
        const [id, key] = pair.split(':');
        const el = $(id);
        if (el && document.activeElement !== el) el.value = spendBill[key] ? fromSen(spendBill[key]) : '';
    });
    if ($('spendVoucher') && document.activeElement !== $('spendVoucher')) {
        $('spendVoucher').value = spendBill.voucher || '';
    }

    setSeg('spendCharges', chargePresetOf());
    setSeg('spendDiscountUnit', spendBill.discountUnit);
    setSeg('spendOffUnit', spendBill.offUnit);
    setSeg('spendVoucherUnit', spendBill.voucherUnit);
    setSeg('spendFeeSplit', spendBill.feeSplit);

    set('spendDiscountAffix', spendBill.discountUnit === 'cur' ? curMark(cur) : '%');
    set('spendVoucherAffix', spendBill.voucherUnit === 'pct' ? '%' : curMark(cur));
}

/** Which of the four preset buttons the two percentages currently are. */
function chargePresetOf() {
    const found = Object.keys(CHARGE_PRESETS).find((key) =>
        CHARGE_PRESETS[key].service === (Number(spendBill.service) || 0)
        && CHARGE_PRESETS[key].tax === (Number(spendBill.tax) || 0));
    return found || '';
}

function setSeg(id, value) {
    const seg = $(id);
    if (!seg) return;
    seg.dataset.value = value;
    seg.querySelectorAll('button[data-val]').forEach((b) => {
        b.classList.toggle('is-on', b.dataset.val === value);
    });
}

function billItemRow(it, placeholder) {
    const off = !!spendBill.itemDiscounts;
    const cur = ($('spendCur') && $('spendCur').value) || homeCur();

    return '<div class="split-item' + (off ? ' has-off' : '') + '">'
        + '<input type="text" class="split-item-label" data-bill-label="' + esc(it.id) + '"'
        +   ' placeholder="' + esc(placeholder) + '" value="' + esc(it.label || '') + '">'
        + '<div class="money-input money-input-sm"><span class="affix bill-cur">' + esc(curMark(cur)) + '</span>'
        +   '<input type="number" class="split-item-amount" data-bill-amount="' + esc(it.id) + '"'
        +   ' min="0" step="0.10" placeholder="0.00" inputmode="decimal"'
        +   ' value="' + esc(it.amount ? fromSen(it.amount) : '') + '"></div>'
        + (off
            ? (spendBill.offUnit === 'cur'
                ? '<div class="money-input money-input-sm is-off"><span class="affix">&minus;' + esc(curMark(cur)) + '</span>'
                    + '<input type="number" data-bill-off="' + esc(it.id) + '" min="0" step="0.10"'
                    + ' placeholder="0.00" inputmode="decimal" aria-label="Discount on this line"'
                    + ' value="' + esc(it.off === undefined ? '' : it.off) + '"></div>'
                : '<div class="pct-input"><input type="number" data-bill-off="' + esc(it.id) + '"'
                    + ' min="0" max="100" step="1" placeholder="0" inputmode="decimal"'
                    + ' aria-label="Discount on this line" value="' + esc(it.off === undefined ? '' : it.off) + '">'
                    + '<span>%</span></div>')
            : '')
        + '<button type="button" class="split-x" data-bill-drop="' + esc(it.id) + '" aria-label="Remove line">'
        +   '<i class="bi bi-x-lg"></i></button>'
        + '</div>';
}

/**
 * Who had a shared item, and how much of it.
 *
 * Two questions on one strip, because they are the same axis: a table of
 * four where only two shared the plate is the same arithmetic as a dish
 * nobody divided equally — somebody's share is zero. Both default to
 * everyone, equally, so a dish that never touches this strip behaves the
 * way a shared dish always did.
 */
function billPortionRow(it) {
    const t = trip();
    const out = it.out || [];
    const isIn = (id) => out.indexOf(id) < 0;

    const chips = spendWho.map((id) => '<button type="button" class="split-chip' + (isIn(id) ? ' is-in' : '') + '"'
        + ' data-bill-share="' + esc(it.id + ':' + id) + '" aria-pressed="' + isIn(id) + '">'
        + '<i class="bi ' + (isIn(id) ? 'bi-check-lg' : 'bi-plus-lg') + '"></i>'
        + '<span>' + esc(nameOf(t, id)) + '</span></button>').join('');

    const boxes = spendWho.filter(isIn).map((id) => '<label class="split-portion">'
        + '<span>' + esc(nameOf(t, id)) + '</span>'
        + '<input type="number" class="split-unit" data-bill-unit="' + esc(it.id + ':' + id) + '"'
        +   ' min="0" step="1" placeholder="0" inputmode="decimal"'
        +   ' aria-label="Portions for ' + esc(nameOf(t, id)) + '"'
        +   ' value="' + esc((it.units || {})[id] === undefined ? '' : it.units[id]) + '"></label>').join('');

    return '<div class="split-portions' + (it.byUnits ? ' is-on' : '') + (out.length ? ' has-out' : '') + '">'
        + '<div class="split-share">'
        +   '<span class="split-share-label">Shared by</span>'
        +   '<div class="split-chips">' + chips + '</div>'
        +   '<button type="button" class="split-portion-toggle' + (it.byUnits ? ' is-on' : '') + '"'
        +     ' data-bill-portions="' + esc(it.id) + '">'
        +     (it.byUnits
                ? '<i class="bi bi-arrow-left-right"></i>Back to an even split'
                : '<i class="bi bi-diagram-2"></i>Split by portions')
        +   '</button>'
        + '</div>'
        + (it.byUnits
            ? '<div class="split-portion-head"><span>Portions <b data-bill-pn="' + esc(it.id) + '">&mdash;</b></span></div>'
                + '<div class="split-portion-row">' + boxes + '</div>'
            : '')
        + '<p class="split-portion-foot" data-bill-pf="' + esc(it.id) + '">&mdash;</p>'
        + '</div>';
}

function billPayRow(pay, lines, t) {
    const cur = ($('spendCur') && $('spendCur').value) || homeCur();
    const named = (pay.items || []).length;

    const who = spendWho.length ? spendWho : peopleOf(t).map((p) => p.id);

    return '<div class="split-pay">'
        + '<select data-bill-pay-by="' + esc(pay.id) + '" aria-label="Who paid">'
        +   who.map((id) => '<option value="' + esc(id) + '"' + (pay.by === id ? ' selected' : '') + '>'
                + esc(nameOf(t, id)) + '</option>').join('')
        + '</select>'
        + '<input type="text" class="split-pay-label" data-bill-pay-label="' + esc(pay.id) + '"'
        +   ' placeholder="Which till" value="' + esc(pay.label || '') + '">'
        + '<div class="money-input money-input-sm"><span class="affix bill-cur">' + esc(curMark(cur)) + '</span>'
        +   '<input type="number" class="split-pay-amount' + (named ? ' is-read' : '') + '"'
        +   ' data-bill-pay-amount="' + esc(pay.id) + '" min="0" step="0.10" placeholder="0.00"'
        +   ' inputmode="decimal"' + (named ? ' readonly' : '')
        +   ' value="' + esc(pay.amount ? fromSen(pay.amount) : '') + '"></div>'
        + '<button type="button" class="split-x" data-bill-pay-drop="' + esc(pay.id) + '" aria-label="Remove payment">'
        +   '<i class="bi bi-x-lg"></i></button>'
        + '</div>'
        + billPayLines(pay, lines);
}

function billPayLines(pay, lines) {
    const mineLines = pay.items || [];

    if (!lines.length) {
        return '<div class="split-pay-lines"><span class="split-share-label">Paid for</span>'
            + '<p class="split-empty">Nothing on the bill yet.</p></div>';
    }

    return '<div class="split-pay-lines">'
        + '<span class="split-share-label">Paid for</span>'
        + '<div class="split-chips">'
        + lines.map((line) => {
            const on = mineLines.indexOf(line.id) > -1;
            return '<button type="button" class="split-chip' + (on ? ' is-in' : '') + '"'
                + ' data-bill-pay-line="' + esc(pay.id + ':' + line.id) + '" aria-pressed="' + on + '">'
                + '<i class="bi ' + (on ? 'bi-check-lg' : 'bi-plus-lg') + '"></i>'
                + '<span>' + esc(line.label) + '</span></button>';
        }).join('')
        + '</div></div>';
}

/** Everything on the bill that is a figure rather than a field. */
function paintBillSums() {
    const t = trip();
    const cur = ($('spendCur') && $('spendCur').value) || homeCur();
    const c = billCompute(billDraft(), t);
    const cash = (sen) => moneyIn(sen, cur);

    /* The amount is no longer typed: it is what the lines come to. */
    const amount = $('spendAmount');
    if (amount) amount.value = c.grandSen ? fromSen(c.grandSen) : '';

    set('spendTallyFood', cash(c.itemOffSen > 0 ? c.listedSen : c.foodSen));
    set('spendTallyItemOff', '− ' + cash(c.itemOffSen));
    set('spendTallyDiscount', '− ' + cash(c.discountSen));
    set('spendTallyDiscountLabel', c.bill.discountUnit === 'pct' && c.discountTyped
        ? 'Discount ' + c.discountTyped + '%' : 'Discount');
    set('spendTallyService', cash(c.serviceSen));
    set('spendTallyServiceLabel', 'Service charge ' + c.serviceRate + '%');
    set('spendTallyTax', cash(c.taxSen));
    set('spendTallyTaxLabel', 'Tax ' + c.taxRate + '%');
    set('spendTallyDelivery', cash(c.deliverySen));
    set('spendTallyPlatform', cash(c.platformSen));
    set('spendTallyVoucher', '− ' + cash(c.voucherSen));
    set('spendTallyVoucherLabel', c.bill.voucherUnit === 'pct' && c.voucherTyped
        ? 'Voucher ' + c.voucherTyped + '%' : 'Voucher');
    set('spendTallyTotal', cash(c.grandSen));

    const showRow = (id, show) => { const row = $(id); if (row) row.hidden = !show; };
    showRow('spendRowItemOff', c.itemOffSen > 0);
    showRow('spendRowDiscount', c.discountSen > 0);
    showRow('spendRowService', c.serviceRate > 0);
    showRow('spendRowTax', c.taxRate > 0);
    showRow('spendRowDelivery', c.deliverySen > 0);
    showRow('spendRowPlatform', c.platformSen > 0);
    showRow('spendRowVoucher', c.voucherSen > 0);

    const bits = [
        c.serviceRate ? 'service ' + c.serviceRate + '%' : '',
        c.taxRate ? 'tax ' + c.taxRate + '%' : '',
        c.discountSen ? '− ' + (c.bill.discountUnit === 'pct' ? c.discountTyped + '%' : cash(c.discountSen)) + ' off the bill' : '',
        c.itemOffSen ? '− ' + cash(c.itemOffSen) + ' off lines' : '',
        c.bill.itemDiscounts && !c.itemOffSen ? 'per-line discounts on' : '',
        c.deliverySen ? 'delivery ' + cash(c.deliverySen) : '',
        c.platformSen ? 'platform ' + cash(c.platformSen) : '',
        c.voucherSen ? '− ' + cash(c.voucherSen) + ' voucher' : '',
        c.bill.delivery && c.feesSen > 0 && c.bill.feeSplit === 'order' ? 'fees by what each ordered' : '',
        c.bill.round ? 'rounded' : '',
    ].filter(Boolean);
    set('spendChargeSummary', bits.length ? bits.join(' · ') : 'None');

    c.who.forEach((id, i) => {
        const box = document.querySelector('[data-bill-sum="' + id + '"]');
        if (box) box.textContent = cash(c.paysSen[i]);
    });

    set('spendSharedTotal', cash(c.sharedSen));
    set('spendItemsNote', c.foodSen > 0
        ? 'Ordered ' + cash(c.foodSen - c.sharedSen)
        : 'Nothing on the bill yet');

    /* A payment that named lines is worth what those lines come to, and
       the box says so rather than asking. */
    spendBill.payments.forEach((pay) => {
        const box = document.querySelector('[data-bill-pay-amount="' + pay.id + '"]');
        if (box && box.readOnly) box.value = fromSen(c.payAmountSen[pay.id] || 0);
    });

    set('spendPayNote', c.grandSen > 0
        ? cash(c.listedPaidSen) + ' of ' + cash(c.grandSen) + ' listed'
        : 'Nothing on the bill yet');

    const restName = nameOf(t, c.payer);
    set('spendPayHint', c.restSen > 0
        ? cash(c.restSen) + ' of the bill is not on this list, so it is down to ' + restName
            + '. Add a line for each of the other tills and it comes to nothing.'
        : c.restSen < 0
            ? 'These payments come to ' + cash(-c.restSen) + ' more than the bill does. '
                + 'Either a figure is too high, or something is missing from what everybody had.'
            : 'Every sen of the bill is accounted for.');

    paintBillPortions(c);
    paintBillPays(c, cash);
}

function paintBillPortions(c) {
    c.sharedSplits.forEach((split) => {
        const it = split.item;
        const out = it.out || [];
        const plain = !it.byUnits && !out.length;

        const count = document.querySelector('[data-bill-pn="' + it.id + '"]');
        if (count) count.textContent = split.total ? String(split.total) : '—';

        const foot = document.querySelector('[data-bill-pf="' + it.id + '"]');
        if (!foot) return;

        /* A dish shared by everybody, equally, needs no explanation —
           that is what a shared dish is. Anything else does. */
        foot.hidden = plain;
        if (plain) return;

        if (it.byUnits && !split.total) {
            foot.textContent = out.length
                ? 'No portions typed yet, so this is splitting evenly between the '
                    + (c.who.length - out.length) + ' still on it.'
                : 'Nobody has a portion yet, so this line is still splitting evenly.';
            return;
        }

        const named = c.who
            .map((id, i) => ({ id, sen: split.parts[i] || 0 }))
            .filter((row) => row.sen > 0);

        foot.textContent = named.length
            ? named.map((row) => nameOf(trip(), row.id) + ' ' + billMoney(row.sen)).join(' · ')
            : 'Nobody is on this line yet.';
    });
}

function paintBillPays(c, cash) {
    const t = trip();

    set('spendPaysNote', c.grandSen > 0 ? 'Charges and discounts included' : '');

    if (!c.who.length || c.grandSen <= 0) {
        return html('spendPaysBody', '<tr><td colspan="4" class="is-muted">'
            + 'Put in what everybody had and the split works itself out.</td></tr>');
    }

    html('spendPaysBody', c.who.map((id, i) => {
        const share  = c.shareSen[i];
        const pays   = c.paysSen[i];
        const charge = pays - share;
        const lines  = c.bill.items.filter((it) => it.who === id && (Number(it.amount) || 0) > 0).length;

        /* "A share of the table" is only true of a dish that divided
           evenly. Once one went by portions, saying it of somebody who
           ate three of five pao understates what they had. */
        const portions = c.sharedSplits
            .filter((split) => split.item.byUnits && split.total)
            .reduce((n, split) => n + (split.units[i] || 0), 0);

        const sharedNote = portions > 0
            ? ' + ' + portions + (portions === 1 ? ' portion shared' : ' portions shared')
            : c.sharedParts[i] > 0 ? ' + a share of the table' : '';

        /* A flat fee divided evenly has nothing to do with what they
           ordered, so it is named rather than left looking like one. */
        const fee = c.feeParts[i] || 0;
        const detail = (lines ? lines + (lines === 1 ? ' line' : ' lines') : 'Nothing ordered')
            + sharedNote + (fee > 0 ? ' + ' + cash(fee) + ' of the fees' : '');

        const put = c.paidSen[id] || 0;

        return '<tr>'
            + '<td><strong>' + esc(nameOf(t, id)) + '</strong>'
            +   (put > 0 ? '<span class="tag is-paid">' + (Object.keys(c.paidSen).filter((k) => c.paidSen[k] > 0).length > 1
                    ? 'paid ' + esc(cash(put)) : 'paid') + '</span>' : '')
            +   '<small>' + esc(detail) + '</small></td>'
            + '<td>' + cash(share) + '</td>'
            + '<td class="' + (charge < 0 ? 'is-minus' : 'is-muted') + '">'
            +   (charge < 0 ? '− ' : charge > 0 ? '+ ' : '') + cash(Math.abs(charge)) + '</td>'
            + '<td class="is-strong">' + cash(pays) + '</td>'
            + '</tr>';
    }).join('')
    + '<tr class="total-row"><td>Bill total</td><td>' + cash(c.foodSen) + '</td>'
    + '<td>' + ((c.grandSen - c.foodSen) < 0 ? '− ' : (c.grandSen - c.foodSen) > 0 ? '+ ' : '')
    +   cash(Math.abs(c.grandSen - c.foodSen)) + '</td>'
    + '<td>' + cash(c.grandSen) + '</td></tr>');
}

function paintBill() {
    paintBillRows();
    paintBillSums();
}

/* ====================================================================
   THE SCREEN
   ==================================================================== */
function renderSpend() {
    renderDocs();
    renderNotes();

    const t = trip();
    paintPeople();
    paintSpendCats();
    paintSpendCatChips();

    if (!t) {
        set('spendNote', '');
        set('spendListNote', '');
        html('spendSummary', '');
        html('spendOwe', '');
        paintSettle(null);
        return html('spendList', emptyState('bi-cash-coin', 'Nothing open',
            'Expenses belong to a trip, an event or an activity. Create one first.'));
    }

    const all = mine(db.spend);
    const spent = all.reduce((n, x) => n + homeOf({ cost: x.amount, cur: x.cur }, t), 0);
    set('spendNote', all.length ? plural(all.length, 'expense') + ' · ' + money(spent) : 'Nothing recorded yet');

    paintSpendSummary(t, all, spent);
    paintOwe(t);
    paintSettle(t);

    const list = spendCatFilter === 'all' ? all : all.filter((x) => x.cat === spendCatFilter);
    set('spendListNote', all.length
        ? (list.length === all.length ? plural(all.length, 'expense') : list.length + ' of ' + all.length)
        : '');

    if (!all.length) {
        return html('spendList', emptyState('bi-cash-coin', 'No expenses yet',
            'Every receipt, every fare, every round. This is where the Budget stops guessing.'));
    }
    if (!list.length) {
        return html('spendList', emptyState('bi-cash-coin',
            'Nothing under ' + spendCatOf(spendCatFilter).label, 'There are ' + all.length + ' expenses in all.'));
    }

    /* Newest first: the one you are most likely to be fixing is the one
       you just typed. */
    const sorted = list.slice().sort((a, b) =>
        (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || ''));

    html('spendList', '<div class="spend-deck">' + sorted.map((x) => spendCard(x, t)).join('') + '</div>');
}

function spendCard(x, t) {
    const c = spendCatOf(x.cat);
    const { total, bag } = shareOut(x, t);
    const who = Object.keys(bag);
    const stop = x.stop ? db.stops.find((s) => s.id === x.stop) : null;

    return '<article class="spend-card" style="' + tone(c) + '">'
        + '<div class="sc-top">'
        +   '<span class="sc-cat">' + c.mark + ' ' + esc(c.label) + '</span>'
        +   '<span class="sc-ref">' + esc(x.ref || '') + '</span>'
        +   '<span class="nc-acts">'
        +     '<button type="button" class="row-x is-edit" data-edit-spend="' + esc(x.id) + '" title="Edit"><i class="bi bi-pencil"></i></button>'
        +     '<button type="button" class="row-x" data-drop-spend="' + esc(x.id) + '" title="Delete"><i class="bi bi-trash3"></i></button>'
        +   '</span>'
        + '</div>'

        + '<h3>' + esc(x.merchant || 'Unnamed') + '</h3>'
        + (x.desc ? '<p class="sc-desc">' + esc(x.desc) + '</p>' : '')

        + '<div class="sc-amount">' + amount(x.amount, x.cur, t) + '</div>'

        + '<dl class="sc-facts">'
        +   fact('bi-calendar3', 'Date', (x.date ? fmtDay(x.date) : '—') + (x.time ? ' · ' + fmtTime(x.time) : ''))
        +   fact('bi-person-fill', 'Paid by', esc(nameOf(t, x.by)))
        + '</dl>'

        + (who.length
            ? '<div class="sc-split">'
            +   '<div class="sc-split-head"><span>Split</span><b>' + esc(SPLITS[x.split] ? SPLITS[x.split].label : 'Equal') + '</b></div>'
            /* Everybody on the trip, not only everybody on this expense.
               Nobody has to be on every one, and a name with a tick beside
               nothing answers "was John left off, or was he not there?" —
               which a list of three names out of four does not. */
            /* Anybody in the split who is no longer on the roster is added
               back on the end, so the shares on the card still add up to
               the amount above them. */
            +   peopleOf(t).concat(who.filter((id) => !personOf(t, id))
                    .map((id) => ({ id, name: 'Someone (removed)' })))
                .map((p) => {
                    const on = who.indexOf(p.id) > -1;
                    return '<div class="sc-person' + (on ? '' : ' is-out') + '">'
                        + '<span class="person-mark is-sm">' + esc(initials(p.name)) + '</span>'
                        + '<span class="sc-person-name">' + esc(p.name) + '</span>'
                        + '<span class="sc-tick"><i class="bi ' + (on ? 'bi-check-lg' : 'bi-x-lg') + '"></i></span>'
                        + '<span class="sc-person-cut">' + moneyIn(on ? bag[p.id] : 0, t.home || 'MYR') + '</span>'
                        + '</div>';
                }).join('')
            + '</div>'
            : '<p class="sc-nosplit">Not split — ' + esc(nameOf(t, x.by)) + ' alone.</p>')

        + (x.note || stop || x.receipt || (x.atts || []).length
            ? '<div class="sc-chips">'
            +   (stop ? '<span class="stop-chip"><i class="bi bi-calendar2-week"></i>' + esc(stop.title) + '</span>' : '')
            +   (x.note ? '<span class="stop-chip" title="' + esc(x.note) + '"><i class="bi bi-sticky"></i>Note</span>' : '')
            +   (x.receipt ? '<button type="button" class="stop-chip is-link" data-spend-att="' + esc(x.id) + ':r">'
                    + '<i class="bi bi-receipt"></i>Receipt</button>' : '')
            +   (x.atts || []).map((a, i) => '<button type="button" class="stop-chip is-link" data-spend-att="' + esc(x.id) + ':' + i + '">'
                    + '<i class="bi ' + attIcon(a.type) + '"></i>' + esc(a.name) + '</button>').join('')
            + '</div>'
            : '')
        + '</article>';
}

function paintSpendSummary(t, all, spent) {
    set('spendTotalNote', all.length ? plural(all.length, 'expense') : '');

    if (!all.length) {
        return html('spendSummary', emptyState('bi-pie-chart', 'Nothing to add up yet',
            'The first expense fills this in.'));
    }

    const bag = {};
    all.forEach((x) => {
        const key = spendCatOf(x.cat).id;
        bag[key] = (bag[key] || 0) + homeOf({ cost: x.amount, cur: x.cur }, t);
    });

    const rows = db.spendCats.filter((c) => bag[c.id])
        .map((c) => ({ c, sen: bag[c.id] }))
        .sort((a, b) => b.sen - a.sen);

    const top = rows[0] ? rows[0].sen : 1;
    const head = mine(db.stops).length;

    html('spendSummary', ''
        + '<div class="spend-figures">'
        +   figure('Spent', money(spent), plural(all.length, 'expense'))
        +   figure('Budget', t.budget ? money(t.budget) : '—',
                t.budget ? Math.round(spent / t.budget * 100) + '% of it gone' : 'No budget set')
        +   figure('Per person', money(Math.round(spent / Math.max(1, t.who || 1))),
                'across ' + plural(t.who || 1, 'member'))
        +   figure('Against the plan', head ? plural(head, 'stop') : '—',
                head ? 'on the itinerary' : 'nothing planned')
        + '</div>'
        + '<div class="spend-bars">' + rows.map((r) => ''
            + '<div class="spend-bar" style="' + tone(r.c) + '">'
            +   '<span class="sb-name">' + r.c.mark + ' ' + esc(r.c.label) + '</span>'
            +   '<span class="sb-track"><span class="sb-fill" style="width:' + Math.max(3, Math.round(r.sen / top * 100)) + '%"></span></span>'
            +   '<span class="sb-val">' + money(r.sen) + '</span>'
            +   '<span class="sb-pct">' + Math.round(r.sen / spent * 100) + '%</span>'
            + '</div>').join('') + '</div>');
}

/* Every figure here is exact, where most of this app rounds. A budget
   headline is a figure you glance at; a balance is a figure somebody hands
   over. Rounding RM 12.50 to RM 13 in a column headed "needs to pay" is the
   app being wrong about money by fifty sen, twice, and the two columns then
   stop adding up to the total underneath them. */
function paintOwe(t) {
    const rows = balances(t).filter((r) => r.paid || r.share);
    set('spendOweNote', rows.length ? plural(rows.length, 'person', 'people') : '');

    if (!rows.length) {
        return html('spendOwe', emptyState('bi-people', 'Nothing to settle',
            'Name the people on this one and split an expense between them.'));
    }

    const cur = t.home || 'MYR';
    const spent = rows.reduce((n, r) => n + r.paid, 0);

    html('spendOwe', ''
        + '<div class="table-wrap"><table class="data-table">'
        + '<thead><tr><th>Person</th><th>Paid</th><th>Share</th><th>Balance</th><th></th></tr></thead><tbody>'
        + rows.sort((a, b) => b.net - a.net).map((r) => '<tr>'
            + '<td><strong' + (r.gone ? ' class="is-gone"' : '') + '>' + esc(r.person.name) + '</strong></td>'
            + '<td>' + moneyIn(r.paid, cur) + '</td>'
            + '<td>' + moneyIn(r.share, cur) + '</td>'
            + '<td class="is-strong ' + (r.net > 0 ? 'is-plus' : (r.net < 0 ? 'is-minus' : 'is-muted')) + '">'
            +   (r.net > 0 ? '+' : (r.net < 0 ? '−' : '')) + moneyIn(Math.abs(r.net), cur)
            + '</td>'
            + '<td class="is-muted">'
            +   (r.net > 0 ? 'should receive' : (r.net < 0 ? 'needs to pay' : 'square'))
            + '</td></tr>').join('')
        + '<tr class="total-row"><td>Total expenses</td>'
        +   '<td class="is-strong">' + moneyIn(spent, cur) + '</td>'
        +   '<td colspan="3"></td></tr>'
        + '</tbody></table></div>');
}

/* ====================================================================
   THE FORM
   ==================================================================== */
function openSpendForm(id) {
    const t = trip();
    if (!t) return;
    const x = id ? db.spend.find((r) => r.id === id) : null;
    if (id && !x) return;

    editSpend = id || null;
    spendSplit = x ? (x.split || 'equal') : 'equal';
    /* A new expense is for everybody by default — the common case is the
       whole group, and unticking is quicker than ticking five people. */
    spendWho = x ? (x.who || []).slice() : peopleOf(t).map((p) => p.id);
    /* A custom-amount split is stored in sen, like every other figure in
       the app, and the field it goes back into is in ringgit — the same
       fromSen() the amount field above gets. Without it a 24.70 split came
       back as 2470, and saving that again multiplied it by another hundred.
       A percentage is a percentage either way and is copied across. */
    spendParts = {};
    if (x && x.parts) {
        const exact = (x.split || 'equal') === 'exact';
        Object.keys(x.parts).forEach((k) => {
            spendParts[k] = exact ? fromSen(x.parts[k]) : x.parts[k];
        });
    }
    /* The bill is edited as a copy, so abandoning the form leaves the one
       on the record exactly as it was. */
    spendBill = billOf(x && x.bill ? { bill: JSON.parse(JSON.stringify(x.bill)) } : null);

    receiptHeld = x ? (x.receipt || null) : null;
    spendAtts = x && x.atts ? x.atts.slice() : [];

    $('spendDate').value = x ? (x.date || '') : today();
    $('spendTime').value = x ? (x.time || '') : '';
    $('spendMerchant').value = x ? (x.merchant || '') : '';
    $('spendDesc').value = x ? (x.desc || '') : '';
    $('spendAmount').value = x && x.amount ? fromSen(x.amount) : '';
    $('spendNoteText').value = x ? (x.note || '') : '';

    fillSpendCatSelect(x ? x.cat : (spendCatFilter === 'all' ? '' : spendCatFilter));
    fillPersonSelect(x ? x.by : '');
    fillSpendStops(x ? x.stop : '');
    fillCurSelect($('spendCur'), x ? (x.cur || homeCur()) : homeCur());

    set('spendRef', x ? (x.ref || '') : nextSpendRef());
    set('spendFormTitle', x ? 'Edit expense' : 'New expense');
    set('spendSaveLabel', x ? 'Save changes' : 'Add expense');
    $('spendSave').querySelector('i').className = 'bi ' + (x ? 'bi-check-lg' : 'bi-plus-lg');

    paintWhoPick();
    paintSplit();
    paintReceipt();
    paintSpendAtts();

    /* A bill that has charges on it never hides them behind a shut door;
       one that has none opens on the lines, which is what it is for. */
    $('spendChargeFold').open = spendSplit === 'items'
        && !!(spendBill.service || spendBill.tax || spendBill.discount
            || spendBill.itemDiscounts || spendBill.round || spendBill.delivery);

    $('spendFormCard').hidden = false;
    $('spendFormCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    $('spendMerchant').focus();
}

function closeSpendForm() {
    /* Abandoning the form leaves the scanned document filed but attached
       to nothing, rather than waiting to attach itself to whatever expense
       happens to be saved next. */
    db.docs.forEach((d) => { if (d.pending) delete d.pending; });

    editSpend = null;
    blankSpendForm();
    $('spendFormCard').hidden = true;
}

function blankSpendForm() {
    spendWho = [];
    spendParts = {};
    spendBill = blankBill();
    receiptHeld = null;
    spendAtts = [];
    ['spendMerchant', 'spendDesc', 'spendAmount', 'spendNoteText', 'spendTime'].forEach((id) => { $(id).value = ''; });
    /* The chips and the bill are drawn from those three, so they are
       redrawn from them — an emptied form that still shows five people
       ticked and a bill under them is not empty. */
    paintWhoPick();
    paintSplit();
}

/* A reference somebody can say out loud, counted per trip so two trips do
   not share a numbering nobody asked them to share. */
function nextSpendRef() {
    const t = trip();
    const n = t ? mine(db.spend).length + 1 : 1;
    return 'EXP-' + String(n).padStart(3, '0');
}

function saveSpend() {
    const t = trip();
    if (!t) return;

    const merchant = $('spendMerchant').value.trim();
    /* A by-item bill has no amount typed into it: the lines are the
       amount, and the field above only reports what they come to. */
    const amount = spendSplit === 'items'
        ? billCompute(billDraft(), t).grandSen
        : toSen($('spendAmount').value);

    if (!merchant) return $('spendMerchant').focus();
    if (!amount && spendSplit === 'items') {
        set('spendSplitHint', 'Nothing on the bill yet — put in what somebody had and the total fills itself in.');
        $('spendSplitHint').classList.add('is-wrong');
        return $('spendBill').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (!amount) return $('spendAmount').focus();

    /* A split that does not add up is a split that is wrong rather than a
       split that is unusual, so it is stopped here — for both the methods
       that can be wrong. Equal cannot be. */
    if (spendWho.length) {
        const wrong = splitOff(amount, $('spendCur').value || homeCur());
        if (wrong) {
            set('spendSplitHint', wrong);
            $('spendSplitHint').classList.add('is-wrong');
            return $('spendParts').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    const parts = {};
    if (spendSplit === 'percent' || spendSplit === 'exact') {
        spendWho.forEach((id) => {
            parts[id] = spendSplit === 'exact' ? toSen(spendParts[id] || 0) : (Number(spendParts[id]) || 0);
        });
    }

    const row = {
        trip: t.id,
        date: $('spendDate').value || today(),
        time: $('spendTime').value,
        merchant,
        desc: $('spendDesc').value.trim(),
        cat: $('spendCat').value || (db.spendCats[0] ? db.spendCats[0].id : ''),
        amount,
        cur: $('spendCur').value || homeCur(),
        by: $('spendBy').value || '',
        stop: $('spendStop').value || '',
        who: spendWho.slice(),
        split: spendSplit,
        parts,
        /* Kept whichever method is chosen, so switching to Equal to check
           a figure and switching back does not throw away the bill. */
        bill: JSON.parse(JSON.stringify(spendBill)),
        note: $('spendNoteText').value.trim(),
        receipt: receiptHeld,
        atts: spendAtts.slice(),
    };

    let savedId;
    if (editSpend) {
        savedId = editSpend;
        Object.assign(db.spend.find((x) => x.id === editSpend), row);
    } else {
        row.id = newId('x');
        savedId = row.id;
        row.ref = nextSpendRef();
        db.spend.push(row);
    }

    pairSpendStop(savedId, row.stop);

    /* A scan filed its photograph as a document before this form was even
       filled in, because the photograph is a thing whether or not the
       expense ever gets saved. Only now is there an expense for it to
       point at, so that is where the link is made. */
    const scanned = db.docs.find((d) => d.trip === t.id && d.pending);
    if (scanned) {
        scanned.spend = savedId;
        scanned.stop = row.stop || '';
        delete scanned.pending;
    }

    save();
    closeSpendForm();
    repaint();
}

/** What is wrong with the split, in words, or '' when nothing is. */
function splitOff(amount, cur) {
    if (spendSplit === 'exact') {
        const sum = spendWho.reduce((n, id) => n + toSen(spendParts[id] || 0), 0);
        return sum === amount ? ''
            : 'The parts come to ' + moneyIn(sum, cur) + ' — the expense is ' + moneyIn(amount, cur) + '.';
    }
    if (spendSplit === 'percent') {
        const sum = spendWho.reduce((n, id) => n + (Number(spendParts[id]) || 0), 0);
        /* Compared on one decimal place, because 33.3 three times is 99.9
           and refusing that is refusing the most obvious way to type it. */
        return Math.abs(sum - 100) < 0.15 ? ''
            : 'The shares come to ' + (Math.round(sum * 10) / 10) + '% — they have to come to 100.';
    }
    return '';
}

function fillSpendCatSelect(selected, into) {
    const el = into || $('spendCat');
    if (!el) return;
    el.innerHTML = db.spendCats.map((c) =>
        '<option value="' + esc(c.id) + '">' + c.mark + '  ' + esc(c.label) + '</option>').join('');
    el.value = db.spendCats.some((c) => c.id === selected) ? selected
        : (db.spendCats[0] ? db.spendCats[0].id : '');
}

function fillPersonSelect(selected) {
    const el = $('spendBy');
    const t = trip();
    if (!el) return;
    const list = peopleOf(t);
    el.innerHTML = list.length
        ? list.map((p) => '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>').join('')
        : '<option value="">Nobody named yet</option>';
    el.value = list.some((p) => p.id === selected) ? selected : (list[0] ? list[0].id : '');
}

/** The schedule items this expense could be the actual cost of. */
function fillSpendStops(selected, into) {
    const el = into || $('spendStop');
    if (!el) return;
    const list = mine(db.stops).slice().sort(sortStops);
    el.innerHTML = '<option value="">Not against one</option>'
        + list.map((s) => '<option value="' + esc(s.id) + '">'
            + (s.date ? fmtDay(s.date) + ' · ' : '') + esc(s.title) + '</option>').join('');
    el.value = list.some((s) => s.id === selected) ? selected : '';
}

function paintWhoPick() {
    const t = trip();
    const list = peopleOf(t);

    if (!list.length) {
        return html('spendWho', '<p class="who-none">Nobody named yet. '
            + 'Add people below and an expense can be split between them.</p>');
    }

    html('spendWho', list.map((p) => {
        const on = spendWho.includes(p.id);
        return '<button type="button" class="who-chip' + (on ? ' is-on' : '') + '"'
            + ' data-who="' + esc(p.id) + '" aria-pressed="' + on + '">'
            + '<span class="person-mark is-sm">' + esc(initials(p.name)) + '</span>' + esc(p.name)
            + '</button>';
    }).join(''));
}

function paintSplit() {
    document.querySelectorAll('#spendSplit button').forEach((b) => {
        b.classList.toggle('is-on', b.dataset.val === spendSplit);
    });

    const t = trip();
    const rows = $('spendParts');
    const per = spendSplit === 'exact';
    const built = spendSplit === 'items';
    rows.hidden = built || spendSplit === 'equal' || !spendWho.length;

    $('spendSplitHint').classList.remove('is-wrong');
    set('spendSplitHint', SPLITS[spendSplit] ? SPLITS[spendSplit].hint : SPLITS.equal.hint);

    /* The bill writes the amount rather than reading it, so the field
       above stops being typed into for as long as this method is on. */
    $('spendBill').hidden = !built;
    $('spendAmount').readOnly = built;
    if (built) return paintBill();

    if (rows.hidden) return;

    /* Percentages that start empty are five fields somebody has to work out
       in their head. They start even, and moving one is the actual edit. */
    if (spendSplit === 'percent' && !spendWho.some((id) => Number(spendParts[id]) > 0)) {
        const each = Math.round(1000 / spendWho.length) / 10;
        spendWho.forEach((id, i) => {
            spendParts[id] = i === spendWho.length - 1
                ? Math.round((100 - each * (spendWho.length - 1)) * 10) / 10
                : each;
        });
    }

    rows.innerHTML = spendWho.map((id) => '<div class="split-row">'
        + '<span class="person-mark is-sm">' + esc(initials(nameOf(t, id))) + '</span>'
        + '<span class="split-name">' + esc(nameOf(t, id)) + '</span>'
        + (per
            ? '<div class="money-input is-bare"><input type="number" min="0" step="0.01" placeholder="0.00"'
                + ' data-part="' + esc(id) + '" value="' + esc(spendParts[id] === undefined ? '' : spendParts[id]) + '"></div>'
            : '<div class="pct-input"><input type="number" min="0" max="100" step="0.1" placeholder="0"'
                + ' data-part="' + esc(id) + '" value="' + esc(spendParts[id] === undefined ? '' : spendParts[id]) + '"><span>%</span></div>')
        + '</div>').join('');
}

function paintReceipt() {
    const shot = $('spendReceiptShot');
    if (!shot) return;
    shot.hidden = !receiptHeld;
    if (receiptHeld) {
        shot.innerHTML = /^image\//.test(receiptHeld.type)
            ? '<img src="' + esc(receiptHeld.data) + '" alt="Receipt">'
            : '<i class="bi ' + attIcon(receiptHeld.type) + '"></i>';
    }
    $('spendReceiptDrop').hidden = !receiptHeld;
    set('spendReceiptLabel', receiptHeld ? 'Change receipt' : 'Add receipt');
}

function paintSpendAtts() {
    const shelf = $('spendAttList');
    if (!shelf) return;
    shelf.hidden = !spendAtts.length;
    shelf.innerHTML = spendAtts.map((a, i) => '<div class="att-held is-sm">'
        + (/^image\//.test(a.type)
            ? '<img src="' + esc(a.data) + '" alt="' + esc(a.name) + '">'
            : '<i class="bi ' + attIcon(a.type) + '"></i>')
        + '<button type="button" class="att-x" data-drop-spend-att="' + i + '" aria-label="Remove ' + esc(a.name) + '">'
        +   '<i class="bi bi-x-lg"></i></button>'
        + '<span class="att-name">' + esc(a.name) + '</span>'
        + '</div>').join('');
    set('spendAttNote', spendAtts.length
        ? plural(spendAtts.length, 'file') + ' · ' + fmtBytes(spendAtts.reduce((n, a) => n + (a.size || 0), 0))
        : 'Anything else that belongs to this expense.');
}

/* ====================================================================
   THE CATEGORY LIST
   ==================================================================== */
function paintSpendCats() {
    set('spendCatNote', plural(db.spendCats.length, 'category', 'categories'));
    if ($('spendCatList').contains(document.activeElement)) return;

    html('spendCatList', db.spendCats.map((c) => {
        const used = db.spend.filter((x) => x.cat === c.id).length;
        return '<div class="cat-row" style="' + tone(c) + '">'
            + '<input class="cat-mark" type="text" maxlength="4" aria-label="Mark for ' + esc(c.label) + '"'
            +   ' data-sc-mark="' + esc(c.id) + '" value="' + esc(c.mark) + '">'
            + '<input class="cat-name" type="text" aria-label="Name"'
            +   ' data-sc-name="' + esc(c.id) + '" value="' + esc(c.label) + '">'
            + '<div class="tone-pick">'
            +   TONE_ORDER.map((k) => '<button type="button" class="tone-dot' + (k === c.tone ? ' is-on' : '')
                    + '" style="--tone:var(' + TONES[k][0] + ')" title="' + k + '"'
                    + ' aria-label="' + k + '" data-sc-tone="' + esc(c.id) + ':' + k + '"></button>').join('')
            + '</div>'
            + '<span class="cat-use' + (used ? '' : ' is-idle') + '">'
            +   (used ? plural(used, 'expense') : 'not used') + '</span>'
            + '<button type="button" class="row-x" data-drop-sc="' + esc(c.id) + '" title="Delete"><i class="bi bi-trash3"></i></button>'
            + '</div>';
    }).join(''));
}

function paintSpendCatChips() {
    const all = trip() ? mine(db.spend) : [];
    const chip = (id, label, mark, toneRow, n, on) =>
        '<button type="button" class="cat-chip' + (on ? ' is-on' : '') + '" style="' + tone(toneRow) + '"'
        + ' data-sc-filter="' + esc(id) + '" aria-pressed="' + on + '">'
        + '<span class="dot"></span>' + (mark ? mark + ' ' : '') + esc(label)
        + (n ? ' <span class="n">' + n + '</span>' : '') + '</button>';

    html('spendCatChips', chip('all', 'All', '', { tone: 'slate' }, all.length, spendCatFilter === 'all')
        + db.spendCats.map((c) =>
            chip(c.id, c.label, c.mark, c, all.filter((x) => x.cat === c.id).length, spendCatFilter === c.id)).join(''));
}

function addSpendCat() {
    const taken = new Set(db.spendCats.map((c) => c.tone));
    db.spendCats.push({
        id: newId('sc'),
        label: 'New category',
        mark: '\u{1F4E6}',
        tone: TONE_ORDER.find((k) => !taken.has(k)) || 'slate',
    });
    save();
    repaint();

    const box = $('spendCatList').querySelector('.cat-row:last-child .cat-name');
    if (box) { box.focus(); box.select(); }
}

/* Deletes on the spot with the way back attached, like the calendar's
   categories — what is filed under it moves to another one rather than
   going with it. The one refusal is having nowhere to move them to. */
function dropSpendCat(id) {
    const c = db.spendCats.find((x) => x.id === id);
    if (!c) return;

    const at = db.spendCats.indexOf(c);
    const orphans = db.spend.filter((x) => x.cat === id);
    const moveTo = db.spendCats.find((x) => x.id !== id);

    if (orphans.length && !moveTo) {
        return toast('<b>' + esc(c.label) + '</b> still holds ' + plural(orphans.length, 'expense')
            + ' and there is no other category to move them to. Add one first.');
    }

    db.spendCats.splice(at, 1);
    orphans.forEach((x) => { x.cat = moveTo ? moveTo.id : ''; });
    if (spendCatFilter === id) spendCatFilter = 'all';
    save();
    repaint();

    toast('Deleted <b>' + esc(c.label) + '</b>'
        + (orphans.length ? ' · ' + plural(orphans.length, 'expense') + ' moved to ' + esc(moveTo.label) : ''), {
        label: 'Undo',
        run: () => {
            db.spendCats.splice(at, 0, c);
            orphans.forEach((x) => { x.cat = id; });
            save();
            repaint();
        },
    });
}

/* ====================================================================
   RECEIPT & DOCUMENT SCANNER

   Part of Module 05 rather than a module of its own, because what a scan
   produces is an expense. Photo → read → guess → correct → save, and the
   only step the app does on its own is the guessing.

   The reader runs in this browser. The image never leaves the device,
   which is the whole reason it is worth doing here rather than posting a
   photograph of somebody's card receipt to a service.
   ==================================================================== */
const OCR_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

/* The eight things the spec says a camera is pointed at, plus the two the
   app already had words for. A receipt is the one that becomes an expense
   by default; the rest are filed and linked. */
const DOC_KINDS = {
    receipt:  { label: 'Receipt',              mark: '\u{1F9FE}', tone: 'node',   spend: true },
    invoice:  { label: 'Invoice',              mark: '\u{1F4C4}', tone: 'slate',  spend: true },
    flight:   { label: 'Flight ticket',        mark: '✈️', tone: 'azure' },
    hotel:    { label: 'Hotel confirmation',   mark: '\u{1F3E8}', tone: 'green' },
    booking:  { label: 'Booking confirmation', mark: '\u{1F5C2}️', tone: 'sky' },
    ticket:   { label: 'Event ticket',         mark: '\u{1F39F}️', tone: 'violet' },
    travel:   { label: 'Travel document',      mark: '\u{1F6C2}', tone: 'teal' },
    eventdoc: { label: 'Event document',       mark: '\u{1F4CB}', tone: 'rose' },
};

const DOC_KIND_ORDER = ['receipt', 'invoice', 'flight', 'hotel', 'booking', 'ticket', 'travel', 'eventdoc'];
const docKindOf = (k) => DOC_KINDS[k] || DOC_KINDS.receipt;

let ocrLib = null;
let scanStream = null;
let scanShot = null;
let scanFound = null;
let editDoc = null;
let docFilter = 'all';

/* --------------------------------------------------------------------
   The camera

   Asked for only when the button is pressed. A page that asks for the
   camera on load is a page people close.
   -------------------------------------------------------------------- */
async function scanCamera() {
    if (scanStream) return scanCapture();

    const video = $('scanVideo');
    try {
        scanStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } },
            audio: false,
        });
    } catch (err) {
        /* No camera, or permission refused. Neither is a dead end — the
           file picker takes the same photograph off the camera roll. */
        return toast('No camera here. <b>Choose a photo</b> does the same job with one you already have.');
    }

    video.srcObject = scanStream;
    video.hidden = false;
    $('scanImage').hidden = true;
    $('scanBlank').hidden = true;
    $('scanShoot').hidden = false;
    $('scanAgain').hidden = false;
    set('scanOpenLabel', 'Capture');
    await video.play();
}

function scanCapture() {
    const video = $('scanVideo');
    if (!video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    scanStop();
    scanHold(canvas.toDataURL('image/jpeg', 0.9), 'camera.jpg');
}

function scanStop() {
    if (scanStream) scanStream.getTracks().forEach((t) => t.stop());
    scanStream = null;
    const video = $('scanVideo');
    video.srcObject = null;
    video.hidden = true;
    $('scanShoot').hidden = true;
    set('scanOpenLabel', 'Take photo');
}

/** Holds the image on screen and starts reading it. */
function scanHold(dataUrl, name) {
    scanShot = { name: name || 'scan.jpg', type: 'image/jpeg', size: Math.round(dataUrl.length * 0.75), data: dataUrl };
    const img = $('scanImage');
    img.src = dataUrl;
    img.hidden = false;
    $('scanBlank').hidden = true;
    $('scanAgain').hidden = false;
    scanRead(dataUrl);
}

function scanReset() {
    scanStop();
    scanShot = null;
    scanFound = null;
    $('scanImage').hidden = true;
    $('scanImage').removeAttribute('src');
    $('scanBlank').hidden = false;
    $('scanAgain').hidden = true;
    $('scanFound').hidden = true;
    $('scanProgress').hidden = true;
    set('scanNote', '');
}

/* --------------------------------------------------------------------
   The reader

   Fetched from a CDN the first time it is needed and kept for the rest
   of the session, the same way the holiday rules are. It is a few
   megabytes, so it is never fetched until somebody actually scans — and
   if it will not load, the scan still ends with the photograph attached
   to a form somebody can type into. A failed read is slower than typing,
   not worse than it.
   -------------------------------------------------------------------- */
function loadOcr() {
    if (ocrLib) return Promise.resolve(ocrLib);
    if (window.Tesseract) { ocrLib = window.Tesseract; return Promise.resolve(ocrLib); }

    return new Promise((done, fail) => {
        const tag = document.createElement('script');
        tag.src = OCR_CDN;
        tag.onload = () => {
            ocrLib = window.Tesseract;
            ocrLib ? done(ocrLib) : fail(new Error('loaded but empty'));
        };
        tag.onerror = () => fail(new Error('could not load'));
        document.head.appendChild(tag);
    });
}

function scanSay(pct, words) {
    $('scanProgress').hidden = false;
    $('scanBar').style.width = Math.max(3, Math.round(pct * 100)) + '%';
    set('scanSay', words);
}

async function scanRead(dataUrl) {
    set('scanNote', 'reading');
    scanSay(0.04, 'Fetching the reader…');

    let text = '';
    try {
        const lib = await loadOcr();
        scanSay(0.12, 'Reading the image…');

        const worker = await lib.createWorker('eng', 1, {
            logger: (m) => {
                if (m.status === 'recognizing text') scanSay(0.15 + m.progress * 0.8, 'Reading the image…');
                else if (/load|initial/i.test(m.status || '')) scanSay(0.08, 'Fetching the reader…');
            },
        });
        const out = await worker.recognize(dataUrl);
        text = (out && out.data && out.data.text) || '';
        await worker.terminate();
    } catch (err) {
        $('scanProgress').hidden = true;
        set('scanNote', 'could not read it');
        toast('The reader could not be loaded — the photo is kept and the fields are yours to fill in.');
        /* Still opens the review, with the photograph and nothing else. */
        return scanReview({ text: '', merchant: '', date: '', total: 0, cur: homeCur(), cat: '', kind: 'receipt' });
    }

    scanSay(1, 'Done');
    setTimeout(() => { $('scanProgress').hidden = true; }, 400);
    scanReview(detectReceipt(text));
}

/* ====================================================================
   WHAT A RECEIPT SAYS

   Four guesses off a page of noisy text. Every one of them is a
   suggestion in an editable field — the reader gets the total right far
   more often than it gets the merchant right, and pretending otherwise
   would cost more than it saved.
   ==================================================================== */
/* Four shapes, fullest first, because the regex takes the first that
   fits: 1.234,56 · 84,000 or 1,234.56 · 110.00 · 2026. The prefix refuses
   to start inside a number, so 1.234,56 is never read as its own tail. */
const MONEY = /(?:^|[^\d.,])(\d{1,3}(?:\.\d{3})+,\d{2}|\d{1,3}(?:[ ,]\d{3})+(?:\.\d{2})?|\d+[.,]\d{2}|\d+)(?![\d])/g;

/** "1,234.56" or "1 234,56" → sen. */
function toSenLoose(raw) {
    let s = String(raw).replace(/\s/g, '');
    const dot = s.lastIndexOf('.');
    const comma = s.lastIndexOf(',');
    const point = Math.max(dot, comma);
    /* Whichever separator comes last is the decimal one; the other is
       thousands. "1.234,56" and "1,234.56" are the same number. */
    if (point > -1 && s.length - point <= 3) {
        s = s.slice(0, point).replace(/[.,]/g, '') + '.' + s.slice(point + 1);
    } else {
        s = s.replace(/[.,]/g, '');
    }
    return toSen(s);
}

const CUR_MARKS = [
    [/\bMYR\b|\bRM\s*\d/i, 'MYR'], [/\bSGD\b|\bS\$/i, 'SGD'], [/\bTHB\b|฿/i, 'THB'],
    [/\bJPY\b|¥|\bYEN\b/i, 'JPY'], [/\bVND\b|₫/i, 'VND'], [/\bIDR\b|\bRp\b/i, 'IDR'],
    [/\bEUR\b|€/i, 'EUR'], [/\bGBP\b|£/i, 'GBP'], [/\bAUD\b|\bA\$/i, 'AUD'],
    [/\bUSD\b|\bUS\$/i, 'USD'],
];

const CAT_WORDS = [
    ['sc-food', /restaurant|trattoria|osteria|ristorante|cafe|café|kitchen|bistro|diner|eatery|grill\b|deli\b|food|kopitiam|warung|noodle|ramen|sushi|pizza|burger|bakery|dinner|lunch|breakfast/i],
    ['sc-drinks', /coffee|starbucks|bar\b|pub\b|brewery|juice|tea house|drinks/i],
    ['sc-grocery', /mart\b|supermarket|grocer|hypermarket|convenience|7-eleven|family ?mart|lawson/i],
    ['sc-taxi', /taxi|grab|uber|bolt|cab\b|ride|limo/i],
    ['sc-transport', /airline|airways|air\b|flight|rail|railway|train|express|metro|subway|bus\b|ferry|shinkansen|jr\b/i],
    ['sc-stay', /hotel|hostel|inn\b|resort|guest ?house|ryokan|machiya|lodge|airbnb|booking\.com|agoda|check-? ?in|check-? ?out|\d+ nights?\b/i],
    ['sc-do', /museum|gallery|park|tour|ticket|admission|entrance|zoo|aquarium|cinema|temple|shrine/i],
    ['sc-shop', /boutique|store|shop|mall|duty free|souvenir|uniqlo|muji/i],
    ['sc-fees', /fee\b|charge|service charge|commission|surcharge|atm\b/i],
];

const DOC_WORDS = [
    ['flight', /boarding ?pass|flight|airways|airline|gate\b|seat\b|pnr\b|departure/i],
    ['hotel', /hotel|check-?in|check-?out|reservation|ryokan|guest ?house/i],
    ['ticket', /admission|ticket|entry pass|event/i],
    ['invoice', /invoice|tax invoice|bill to|due date/i],
    ['booking', /booking (?:confirmation|reference)|confirmation number|itinerary/i],
];

/** The four things worth guessing, and the raw text behind them. */
function detectReceipt(text) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const flat = lines.join('\n');

    return {
        text: flat,
        merchant: guessMerchant(lines),
        date: guessDate(flat),
        total: guessTotal(lines),
        cur: guessCur(flat),
        cat: guessCat(flat),
        kind: guessDocKind(flat),
    };
}

/* The name is at the top and set larger than everything under it, which
   the reader does not tell us — so the rule is the first line near the
   top that reads like a name rather than an address or a number. */
function guessMerchant(lines) {
    const bad = /^\s*(?:no\.?\b|lot\b|jalan|jln\b|street|st\.?\b|road|rd\.?\b|tel|phone|fax|gst|sst|tax|receipt|invoice|order|table|cashier|www\.|http|\d)/i;
    for (let i = 0; i < Math.min(lines.length, 6); i++) {
        const line = lines[i].replace(/[*=_~|]+/g, ' ').trim();
        if (line.length < 3 || line.length > 42) continue;
        if (bad.test(line)) continue;
        if (!/[a-z]{3}/i.test(line)) continue;
        return line.replace(/\s{2,}/g, ' ');
    }
    return '';
}

/* Whatever the receipt was printed in, in whatever order the country
   writes it. An unreadable date is left empty rather than guessed at —
   today's date on last week's receipt is worse than no date. */
function guessDate(text) {
    const months = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';

    let m = text.match(new RegExp('(\\d{1,2})[\\s\\-/.]*(' + months + ')[a-z]*[\\s\\-/.,]*(\\d{2,4})', 'i'));
    if (m) return isoFrom(m[1], monthNum(m[2]), m[3]);

    m = text.match(new RegExp('(' + months + ')[a-z]*[\\s\\-/.]*(\\d{1,2})[\\s\\-/.,]*(\\d{2,4})', 'i'));
    if (m) return isoFrom(m[2], monthNum(m[1]), m[3]);

    m = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return isoFrom(m[3], Number(m[2]), m[1]);

    m = text.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (m) {
        const a = Number(m[1]);
        const b = Number(m[2]);
        /* 18/08 can only be day-then-month; 08/18 can only be the other
           way round. When both are under 13 it is genuinely ambiguous, and
           the rest of the world writes the day first. */
        return b > 12 && a <= 12 ? isoFrom(m[2], a, m[3]) : isoFrom(m[1], b, m[3]);
    }
    return '';
}

const monthNum = (word) => ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    .indexOf(word.slice(0, 3).toLowerCase()) + 1;

function isoFrom(day, month, year) {
    const d = Number(day);
    const m = Number(month);
    let y = Number(year);
    if (!d || !m || !y || d > 31 || m > 12) return '';
    if (y < 100) y += 2000;
    if (y < 2000 || y > 2100) return '';
    return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

/* The line that says "total" wins, and the last one wins over the first —
   a receipt with a subtotal, a tax line and a total prints them in that
   order. Failing that, the biggest number on the page, which on a receipt
   is the total for the same reason it is on a bill. */
function guessTotal(lines) {
    const words = /(?:grand\s*total|amount\s*due|total\s*due|net\s*total|\btotal\b|\bamount\b)/i;
    const skip = /(?:sub-?total|tax|gst|sst|vat|service|discount|round|change|cash|tender|balance)/i;
    /* A line with a date on it has a number on it that is not money. */
    const dated = /\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;

    for (let i = lines.length - 1; i >= 0; i--) {
        if (!words.test(lines[i]) || skip.test(lines[i])) continue;
        const found = moneyInLine(lines[i], false);
        if (found) return found;
    }

    /* No line said "total", so the biggest figure on the page wins — but
       only among the ones written like money. A bare 2026 on a boarding
       pass is a year, and reading it as a price is worse than reading
       nothing: an empty field asks to be filled, a wrong one does not. */
    let best = 0;
    lines.forEach((line) => {
        if (skip.test(line) || dated.test(line)) return;
        const found = moneyInLine(line, true);
        if (found > best) best = found;
    });
    return best;
}

/** The largest figure on one line. `moneyShaped` keeps it to the ones
    written with cents or thousands, for when there is no "total" to
    anchor on — 1,100 and 42,50 are prices, a bare 2026 is a year. */
function moneyInLine(line, moneyShaped) {
    MONEY.lastIndex = 0;
    let best = 0;
    let m;
    while ((m = MONEY.exec(line)) !== null) {
        if (moneyShaped && !/[ ,.]/.test(m[1])) continue;
        const sen = toSenLoose(m[1]);
        if (sen > best) best = sen;
    }
    return best;
}

function guessCur(text) {
    const hit = CUR_MARKS.find(([re]) => re.test(text));
    return hit ? hit[1] : homeCur();
}

function guessCat(text) {
    const hit = CAT_WORDS.find(([, re]) => re.test(text));
    /* Only offered if that category still exists — they are rows somebody
       can rename or delete, so a hard-coded id is a suggestion, not a key. */
    return hit && db.spendCats.some((c) => c.id === hit[0]) ? hit[0] : '';
}

function guessDocKind(text) {
    const hit = DOC_WORDS.find(([, re]) => re.test(text));
    return hit ? hit[0] : 'receipt';
}

/* ====================================================================
   REVIEW
   ==================================================================== */
function scanReview(found) {
    scanFound = found;

    $('scanMerchant').value = found.merchant || '';
    $('scanDate').value = found.date || '';
    $('scanTotal').value = found.total ? fromSen(found.total) : '';
    fillCurSelect($('scanCur'), found.cur || homeCur());
    fillSpendCatSelect(found.cat, $('scanCat'));
    fillDocKinds($('scanKind'), found.kind || 'receipt');

    const got = [found.merchant && 'merchant', found.date && 'date', found.total && 'total'].filter(Boolean);
    set('scanFoundNote', got.length ? got.join(' · ') + ' found' : 'nothing found — type it in');
    set('scanNote', got.length + ' of 3 read');

    $('scanRaw').textContent = found.text || 'Nothing legible.';
    $('scanRawWrap').hidden = !found.text;
    $('scanFound').hidden = false;
    $('scanFound').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Confirm → the expense form, filled in, with the photo as the receipt. */
function scanToExpense() {
    const t = trip();
    if (!t) return toast('Open a trip, an event or an activity first.');

    openSpendForm(null);

    $('spendMerchant').value = $('scanMerchant').value.trim();
    $('spendDate').value = $('scanDate').value || today();
    $('spendAmount').value = $('scanTotal').value;
    $('spendCur').value = $('scanCur').value || homeCur();
    if ($('scanCat').value) $('spendCat').value = $('scanCat').value;

    receiptHeld = scanShot;
    paintReceipt();

    /* The document is filed as well as attached — the photograph is both
       the receipt on the expense and a thing in its own right, and the
       two are the same file rather than two copies of it. */
    if (scanShot) {
        db.docs.push({
            id: newId('d'), trip: t.id,
            kind: $('scanKind').value || 'receipt',
            title: $('scanMerchant').value.trim() || 'Scanned receipt',
            date: $('scanDate').value || today(),
            file: scanShot, text: scanFound ? scanFound.text : '',
            stop: '', spend: '', note: '', pending: true,
        });
        save();
    }

    scanReset();
    toast('Filled in from the scan. Check it, add who paid, and save.');
}

/** The other outcome: it is a document, not money. */
function scanToDoc() {
    const t = trip();
    if (!t) return toast('Open a trip, an event or an activity first.');
    if (!scanShot) return;

    const row = {
        id: newId('d'), trip: t.id,
        kind: $('scanKind').value || 'receipt',
        title: $('scanMerchant').value.trim() || docKindOf($('scanKind').value).label,
        date: $('scanDate').value || '',
        file: scanShot, text: scanFound ? scanFound.text : '',
        stop: '', spend: '', note: '',
    };
    db.docs.push(row);
    save();

    scanReset();
    repaint();
    openDocForm(row.id);
}

/* ====================================================================
   THE DOCUMENT SHELF
   ==================================================================== */
function renderDocs() {
    const t = trip();
    paintDocChips();

    if (!t) {
        set('docNote', '');
        return html('docList', emptyState('bi-folder2-open', 'Nothing open',
            'Documents belong to a trip, an event or an activity.'));
    }

    const all = mine(db.docs);
    const list = docFilter === 'all' ? all : all.filter((d) => (d.kind || 'receipt') === docFilter);

    set('docNote', all.length
        ? (list.length === all.length ? plural(all.length, 'document') : list.length + ' of ' + all.length)
        : '');

    if (!all.length) {
        return html('docList', emptyState('bi-folder2-open', 'Nothing filed yet',
            'Scan a boarding pass, a hotel confirmation or a ticket and it lands here.'));
    }
    if (!list.length) {
        return html('docList', emptyState('bi-folder2-open',
            'No ' + docKindOf(docFilter).label.toLowerCase() + 's', 'There are ' + all.length + ' documents in all.'));
    }

    const sorted = list.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    html('docList', '<div class="doc-deck">' + sorted.map((d) => docCard(d, t)).join('') + '</div>');
}

function docCard(d, t) {
    const k = docKindOf(d.kind);
    const stop = d.stop ? db.stops.find((s) => s.id === d.stop) : null;
    const x = d.spend ? db.spend.find((r) => r.id === d.spend) : null;
    const image = d.file && /^image\//.test(d.file.type);

    return '<article class="doc-card" style="' + tone(k) + '">'
        + '<button type="button" class="doc-shot' + (image ? '' : ' is-bare') + '" data-open-doc="' + esc(d.id) + '"'
        +   ' title="Open ' + esc(d.title) + '">'
        +   (image ? '<img src="' + esc(d.file.data) + '" alt="">' : '<i class="bi ' + attIcon(d.file ? d.file.type : '') + '"></i>')
        + '</button>'
        + '<div class="doc-body">'
        +   '<span class="doc-kind">' + k.mark + ' ' + esc(k.label) + '</span>'
        +   '<h3>' + esc(d.title || 'Untitled') + '</h3>'
        +   '<p class="doc-when">' + (d.date ? fmtDay(d.date) : 'No date') + '</p>'
        +   (d.note ? '<p class="doc-note">' + esc(d.note) + '</p>' : '')
        +   (stop || x
            ? '<div class="doc-links">'
            +   (stop ? '<span class="stop-chip"><i class="bi bi-calendar2-week"></i>' + esc(stop.title) + '</span>' : '')
            +   (x ? '<span class="stop-chip"><i class="bi bi-cash-coin"></i>' + esc(x.merchant) + '</span>' : '')
            + '</div>'
            : '')
        + '</div>'
        + '<div class="doc-acts">'
        +   '<button type="button" class="row-x is-edit" data-edit-doc="' + esc(d.id) + '" title="Edit"><i class="bi bi-pencil"></i></button>'
        +   '<button type="button" class="row-x" data-drop-doc="' + esc(d.id) + '" title="Delete"><i class="bi bi-trash3"></i></button>'
        + '</div>'
        + '</article>';
}

function paintDocChips() {
    const all = trip() ? mine(db.docs) : [];
    const chip = (id, label, mark, toneRow, n, on) =>
        '<button type="button" class="cat-chip' + (on ? ' is-on' : '') + '" style="' + tone(toneRow) + '"'
        + ' data-doc-filter="' + esc(id) + '" aria-pressed="' + on + '">'
        + '<span class="dot"></span>' + (mark ? mark + ' ' : '') + esc(label)
        + (n ? ' <span class="n">' + n + '</span>' : '') + '</button>';

    html('docChips', chip('all', 'All', '', { tone: 'slate' }, all.length, docFilter === 'all')
        + DOC_KIND_ORDER.map((k) => chip(k, DOC_KINDS[k].label, DOC_KINDS[k].mark, DOC_KINDS[k],
            all.filter((d) => (d.kind || 'receipt') === k).length, docFilter === k)).join(''));
}

function fillDocKinds(el, selected) {
    if (!el) return;
    el.innerHTML = DOC_KIND_ORDER.map((k) =>
        '<option value="' + k + '">' + DOC_KINDS[k].mark + '  ' + esc(DOC_KINDS[k].label) + '</option>').join('');
    el.value = DOC_KINDS[selected] ? selected : 'receipt';
}

function openDocForm(id) {
    const d = db.docs.find((x) => x.id === id);
    if (!d) return;

    editDoc = id;
    $('docTitle').value = d.title || '';
    $('docDate').value = d.date || '';
    $('docNoteText').value = d.note || '';
    fillDocKinds($('docKind'), d.kind);
    fillSpendStops(d.stop, $('docStop'));
    fillDocSpends(d.spend);

    set('docFormTitle', docKindOf(d.kind).mark + '  ' + docKindOf(d.kind).label);
    $('docFormCard').hidden = false;
    $('docFormCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    $('docTitle').focus();
}

/* A document is always an edit of one that exists, so there is nothing to
   reset it to — Clear empties the words and leaves the file alone. */
function blankDocForm() {
    ['docTitle', 'docNoteText'].forEach((id) => { if ($(id)) $(id).value = ''; });
    if ($('docDate')) $('docDate').value = '';
}

function closeDocForm() {
    editDoc = null;
    $('docFormCard').hidden = true;
}

function saveDoc() {
    const d = editDoc ? db.docs.find((x) => x.id === editDoc) : null;
    if (!d) return closeDocForm();

    d.title = $('docTitle').value.trim() || docKindOf($('docKind').value).label;
    d.kind = $('docKind').value || 'receipt';
    d.date = $('docDate').value || '';
    d.stop = $('docStop').value || '';
    d.spend = $('docSpend').value || '';
    d.note = $('docNoteText').value.trim();
    delete d.pending;

    save();
    closeDocForm();
    repaint();
}

function fillDocSpends(selected) {
    const el = $('docSpend');
    if (!el) return;
    const list = trip() ? mine(db.spend) : [];
    el.innerHTML = '<option value="">Not against one</option>'
        + list.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            .map((x) => '<option value="' + esc(x.id) + '">' + esc(x.ref || '') + ' · ' + esc(x.merchant) + '</option>').join('');
    el.value = list.some((x) => x.id === selected) ? selected : '';
}

/* ====================================================================
   BUDGET — what Summary & Analytics measures against

   What was meant to be spent, against what was. The right-hand column
   is never typed here: it comes off the Expenses ledger and the split
   the Settlement is worked out from, so a budget cannot quietly say
   something the expenses disagree with.

   Four budgets, and every one of them is optional. Leaving one empty
   means that question is not being asked, which is different from
   answering it with a nought.
   ==================================================================== */

/* Ninety per cent is the point at which a budget stops being a plan and
   starts being a thing to watch, and past a hundred it is a fact. */
const BUDGET_WARN = 0.9;

/** Everything spent on this trip, in its own money. */
function spentOf(t) {
    return mine(db.spend).reduce((n, x) => n + homeOf({ cost: x.amount, cur: x.cur }, t), 0);
}

/** What the plan still expects to cost, which is not the same question. */
function plannedOf(t) {
    return mine(db.stops).reduce((n, s) => n + homeOf(s, t), 0);
}

/** A budget line: what was meant, what went, and what that means. */
function budgetLine(label, budget, actual) {
    const pct = budget ? actual / budget : 0;
    return {
        label, budget, actual,
        left: budget - actual,
        pct,
        state: !budget ? 'unset' : (pct > 1 ? 'over' : (pct >= BUDGET_WARN ? 'warn' : 'ok')),
    };
}

/** Every budget that has been set, ready to be measured. */
function budgetLines(t) {
    const out = [];
    const cur = t.home || 'MYR';
    const spent = spentOf(t);

    if (t.budget) out.push(Object.assign(budgetLine('Overall', t.budget, spent), { kind: 'overall' }));

    const cats = t.catBudget || {};
    db.spendCats.forEach((c) => {
        const budget = cats[c.id] || 0;
        if (!budget) return;
        const actual = mine(db.spend).filter((x) => x.cat === c.id)
            .reduce((n, x) => n + homeOf({ cost: x.amount, cur: x.cur }, t), 0);
        out.push(Object.assign(budgetLine(c.mark + ' ' + c.label, budget, actual), { kind: 'cat', cat: c }));
    });

    if (t.headBudget) {
        balances(t).forEach((r) => {
            if (r.gone && !r.share) return;
            out.push(Object.assign(budgetLine(r.person.name, t.headBudget, r.share), { kind: 'head' }));
        });
    }

    if (t.dayBudget) {
        budgetDays(t).forEach((d) => {
            /* A day nobody spent anything on is not a day that came in
               under budget — it is a day that has not happened yet, or one
               that was free. Either way there is nothing to warn about. */
            if (!d.spent) return;
            out.push(Object.assign(budgetLine(fmtDay(d.date), t.dayBudget, d.spent), { kind: 'day' }));
        });
    }

    return out.map((l) => Object.assign(l, { cur }));
}

/** Every day of the trip, with what went on it. */
function budgetDays(t) {
    const days = [];
    const length = daysBetween(t.from, t.to);
    if (t.from && length !== null && length >= 0) {
        for (let i = 0; i <= Math.min(length, 365); i++) days.push(shiftDate(t.from, i));
    }
    mine(db.spend).forEach((x) => { if (x.date && days.indexOf(x.date) < 0) days.push(x.date); });
    days.sort();

    return days.map((date) => ({
        date,
        spent: mine(db.spend).filter((x) => x.date === date)
            .reduce((n, x) => n + homeOf({ cost: x.amount, cur: x.cur }, t), 0),
        n: mine(db.spend).filter((x) => x.date === date).length,
    }));
}

/* ====================================================================
   THE SCREEN
   ==================================================================== */
function renderBudget() {
    const t = trip();
    if (!t) {
        set('budgetNote', '');
        set('budgetCurTag', '');
        ['budgetCats', 'budgetPeople', 'budgetDays', 'budgetTable'].forEach((id) => html(id, ''));
        $('budgetWarnCard').hidden = true;
        return html('budgetHead', emptyState('bi-wallet2', 'Nothing open',
            'A budget belongs to a trip, an event or an activity.'));
    }

    /* The title carries the record's name and is written by
       paintRecBar(), so it is not rewritten here. */
    set('budgetCurTag', 'in ' + (t.home || 'MYR'));
    paintRates(t);

    /* Never rewrite a field somebody is typing in: `1200.` round-trips
       through toSen/fromSen as `1200` and the point vanishes under the
       caret. Outside of that, the fields follow the trip. */
    const fill = (id, sen) => { if (document.activeElement !== $(id)) $(id).value = sen ? fromSen(sen) : ''; };
    fill('budgetTotal', t.budget);
    fill('budgetHead1', t.headBudget);
    fill('budgetDay', t.dayBudget);

    paintBudgetHead(t);
    paintBudgetSubs(t);
    paintBudgetWarns(t);
    paintBudgetCats(t);
    paintBudgetPeople(t);
    paintBudgetDays(t);
    paintBudgetLedger(t);
}

function paintBudgetHead(t) {
    const spent = spentOf(t);
    const planned = plannedOf(t);
    const held = mine(db.books).filter((b) => b.status !== 'idea')
        .reduce((n, b) => n + homeOf(b, t), 0);
    const line = budgetLine('Overall', t.budget || 0, spent);

    set('budgetNote', t.budget
        ? Math.round(line.pct * 100) + '% of it gone'
        : plural(mine(db.spend).length, 'expense'));

    html('budgetHead', ''
        + '<div class="budget-figures">'
        +   figure('Budget', t.budget ? money(t.budget) : '—',
                t.budget ? 'set for the whole of it' : 'not set yet')
        +   figure('Actual', money(spent),
                plural(mine(db.spend).length, 'expense') + ' recorded')
        +   figure(line.left < 0 ? 'Over by' : 'Remaining',
                t.budget ? money(Math.abs(line.left)) : '—',
                t.budget ? (line.left < 0 ? 'past the budget' : 'still to spend') : 'set a budget first')
        + '</div>'
        + (t.budget ? budgetBar(line) : '')
        + '<div class="budget-aside">'
        +   '<span><i class="bi bi-ticket-perforated"></i>' + money(held) + ' in bookings</span>'
        +   '<span><i class="bi bi-calendar2-week"></i>' + money(planned) + ' still planned on the itinerary</span>'
        + '</div>');
}

/* One bar, and it always draws the budget as its full width — a bar that
   rescales to whatever was spent cannot show going over, which is the one
   thing a budget bar exists to show. */
function budgetBar(line) {
    const pct = Math.min(1, line.pct);
    const spill = Math.max(0, Math.min(1, line.pct - 1));
    return '<div class="budget-bar is-' + line.state + '">'
        + '<span class="bb-track">'
        +   '<span class="bb-fill" style="width:' + (pct * 100).toFixed(1) + '%"></span>'
        +   (spill ? '<span class="bb-over" style="width:' + (spill * 100).toFixed(1) + '%"></span>' : '')
        + '</span>'
        + '<span class="bb-pct">' + Math.round(line.pct * 100) + '%</span>'
        + '</div>';
}

function paintBudgetSubs(t) {
    const heads = Math.max(1, peopleOf(t).length || Number(t.who) || 1);
    const length = daysBetween(t.from, t.to);
    const days = length === null ? 0 : length + 1;

    set('budgetTotalSub', t.budget
        ? money(Math.round(t.budget / heads)) + ' a head'
            + (days ? ' · ' + money(Math.round(t.budget / days)) + ' a day' : '')
        : 'Set a total and it splits itself.');

    set('budgetHeadSub', t.headBudget
        ? money(t.headBudget * heads) + ' across ' + plural(heads, 'person', 'people')
        : 'What one person is expected to use.');

    set('budgetDaySub', t.dayBudget
        ? (days ? money(t.dayBudget * days) + ' across ' + plural(days, 'day') : 'No dates set')
        : 'What one day is expected to cost.');
}

/* --------------------------------------------------------------------
   Warnings

   Only for budgets that have been set, and only when they are close or
   past. A screen that warns about everything is a screen nobody reads.
   -------------------------------------------------------------------- */
function paintBudgetWarns(t) {
    const lines = budgetLines(t).filter((l) => l.state === 'warn' || l.state === 'over');
    $('budgetWarnCard').hidden = !lines.length;
    if (!lines.length) return;

    const over = lines.filter((l) => l.state === 'over').length;
    set('budgetWarnNote', over
        ? plural(over, 'budget') + ' past' + (lines.length > over ? ' · ' + (lines.length - over) + ' close' : '')
        : plural(lines.length, 'budget') + ' close');

    /* Past first, then whatever is nearest to it. */
    lines.sort((a, b) => b.pct - a.pct);

    html('budgetWarns', lines.map((l) => '<div class="warn-row is-' + l.state + '">'
        + '<i class="bi ' + (l.state === 'over' ? 'bi-exclamation-octagon-fill' : 'bi-exclamation-triangle-fill') + '"></i>'
        + '<div class="warn-say">'
        +   '<b>' + (l.state === 'over'
                ? 'You are ' + moneyIn(-l.left, l.cur) + ' past your ' + esc(l.label) + ' budget.'
                : 'You have spent ' + Math.round(l.pct * 100) + '% of your ' + esc(l.label) + ' budget.') + '</b>'
        +   '<span>Budget ' + moneyIn(l.budget, l.cur) + ' · Spent ' + moneyIn(l.actual, l.cur)
        +     ' · ' + (l.left < 0 ? 'Over ' + moneyIn(-l.left, l.cur) : 'Remaining ' + moneyIn(l.left, l.cur)) + '</span>'
        + '</div>'
        + '<span class="warn-pct">' + Math.round(l.pct * 100) + '%</span>'
        + '</div>').join(''));
}

/* --------------------------------------------------------------------
   Category budgets

   Every category gets a row whether or not it has a budget, because the
   row is where the budget is typed. What it has actually taken is shown
   either way — an unbudgeted category still spends money.
   -------------------------------------------------------------------- */
function paintBudgetCats(t) {
    const cur = t.home || 'MYR';
    const cats = t.catBudget || {};
    const set0 = db.spendCats.filter((c) => cats[c.id]).length;
    set('budgetCatNote', set0 ? plural(set0, 'budget') + ' of ' + db.spendCats.length : 'none set');

    /* Never rebuild rows somebody is typing in. */
    if ($('budgetCats').contains(document.activeElement)) return;

    html('budgetCats', '<div class="cat-budgets">' + db.spendCats.map((c) => {
        const budget = cats[c.id] || 0;
        const actual = mine(db.spend).filter((x) => x.cat === c.id)
            .reduce((n, x) => n + homeOf({ cost: x.amount, cur: x.cur }, t), 0);
        const line = budgetLine(c.label, budget, actual);

        return '<div class="cat-budget is-' + line.state + '" style="' + tone(c) + '">'
            + '<span class="cb-name">' + c.mark + ' ' + esc(c.label) + '</span>'
            + '<div class="money-input is-bare cb-set">'
            +   '<input type="number" min="0" step="0.01" placeholder="no budget"'
            +     ' data-cat-budget="' + esc(c.id) + '" value="' + (budget ? esc(fromSen(budget)) : '') + '">'
            + '</div>'
            + '<span class="cb-actual' + (actual ? '' : ' is-idle') + '">' + moneyIn(actual, cur) + '</span>'
            + (budget
                ? '<span class="cb-left ' + (line.left < 0 ? 'is-minus' : '') + '">'
                    + (line.left < 0 ? '−' : '') + moneyIn(Math.abs(line.left), cur) + '</span>'
                    + '<span class="bb-track cb-bar"><span class="bb-fill" style="width:'
                    + Math.min(100, line.pct * 100).toFixed(1) + '%"></span></span>'
                : '<span class="cb-left is-idle">—</span><span class="cb-bar"></span>')
            + '</div>';
    }).join('') + '</div>');
}

function paintBudgetPeople(t) {
    const cur = t.home || 'MYR';
    const rows = balances(t).filter((r) => r.share || r.paid);

    if (!rows.length) {
        set('budgetPeopleNote', '');
        return html('budgetPeople', emptyState('bi-people', 'Nothing split yet',
            'Split an expense between people and their shares appear here.'));
    }

    set('budgetPeopleNote', t.headBudget
        ? moneyIn(t.headBudget, cur) + ' each'
        : plural(rows.length, 'person', 'people'));

    html('budgetPeople', ''
        + '<div class="table-wrap"><table class="data-table">'
        + '<thead><tr><th>Person</th><th>Budget</th><th>Share</th><th>Remaining</th><th></th></tr></thead><tbody>'
        + rows.sort((a, b) => b.share - a.share).map((r) => {
            const line = budgetLine(r.person.name, t.headBudget || 0, r.share);
            return '<tr>'
                + '<td><strong' + (r.gone ? ' class="is-gone"' : '') + '>' + esc(r.person.name) + '</strong></td>'
                + '<td>' + (t.headBudget ? moneyIn(t.headBudget, cur) : '—') + '</td>'
                + '<td class="is-strong">' + moneyIn(r.share, cur) + '</td>'
                + '<td class="' + (line.left < 0 ? 'is-minus' : '') + '">'
                +   (t.headBudget ? (line.left < 0 ? '−' : '') + moneyIn(Math.abs(line.left), cur) : '—')
                + '</td>'
                + '<td>' + (t.headBudget ? budgetTag(line) : '<span class="is-muted">no budget set</span>') + '</td>'
                + '</tr>';
        }).join('')
        + '</tbody></table></div>');
}

function paintBudgetDays(t) {
    const cur = t.home || 'MYR';
    const days = budgetDays(t).filter((d) => d.spent || t.dayBudget);

    if (!days.length) {
        set('budgetDaysNote', '');
        return html('budgetDays', emptyState('bi-calendar3', 'Nothing spent yet',
            'Record an expense and the days fill in.'));
    }

    const spent = days.reduce((n, d) => n + d.spent, 0);
    const live = days.filter((d) => d.spent).length;
    set('budgetDaysNote', live
        ? money(Math.round(spent / live)) + ' a day on average, over ' + plural(live, 'day')
        : plural(days.length, 'day'));

    html('budgetDays', ''
        + '<div class="table-wrap"><table class="data-table">'
        + '<thead><tr><th>Day</th><th>Budget</th><th>Spent</th><th>Remaining</th><th></th></tr></thead><tbody>'
        + days.map((d) => {
            const line = budgetLine(fmtDay(d.date), t.dayBudget || 0, d.spent);
            return '<tr' + (d.date === today() ? ' class="is-current"' : '') + '>'
                + '<td><strong>' + fmtDay(d.date) + '</strong>'
                +   '<small>' + (d.n ? plural(d.n, 'expense') : 'nothing recorded') + '</small></td>'
                + '<td>' + (t.dayBudget ? moneyIn(t.dayBudget, cur) : '—') + '</td>'
                + '<td class="' + (d.spent ? 'is-strong' : 'is-muted') + '">' + moneyIn(d.spent, cur) + '</td>'
                + '<td class="' + (line.left < 0 ? 'is-minus' : '') + '">'
                +   (t.dayBudget ? (line.left < 0 ? '−' : '') + moneyIn(Math.abs(line.left), cur) : '—')
                + '</td>'
                + '<td>' + (t.dayBudget && d.spent ? budgetTag(line) : '') + '</td>'
                + '</tr>';
        }).join('')
        + '<tr class="total-row"><td>All of it</td><td></td>'
        +   '<td class="is-strong">' + moneyIn(spent, cur) + '</td><td colspan="2"></td></tr>'
        + '</tbody></table></div>');
}

const BUDGET_TAGS = {
    ok:    { label: 'On track', tag: 'is-green' },
    warn:  { label: 'Close',    tag: 'is-amber' },
    over:  { label: 'Over',     tag: 'is-red' },
    unset: { label: '',         tag: '' },
};

function budgetTag(line) {
    const b = BUDGET_TAGS[line.state] || BUDGET_TAGS.unset;
    return b.label ? '<span class="tag ' + b.tag + '">' + b.label + '</span>' : '';
}

/* --------------------------------------------------------------------
   Every ringgit

   The three places money is written down, in one list, each saying which
   it came from. Expenses are money that left; a booking is money
   committed ahead of the trip; a stop's cost is an estimate that has not
   become either yet, and is marked as such rather than counted.
   -------------------------------------------------------------------- */
function paintBudgetLedger(t) {
    const cur = t.home || 'MYR';
    const rows = mine(db.spend).map((x) => ({
        when: x.date, what: x.merchant, from: 'Expense', firm: true,
        sen: homeOf({ cost: x.amount, cur: x.cur }, t), raw: x.amount, cur: x.cur,
        mark: spendCatOf(x.cat).mark, label: spendCatOf(x.cat).label,
    })).concat(mine(db.books).filter((b) => b.status !== 'idea').map((b) => ({
        when: b.date, what: b.title, from: STATUS[b.status].label + ' booking', firm: b.status === 'paid',
        sen: homeOf(b, t), raw: b.cost, cur: b.cur,
        mark: '', label: kindOf(b.kind).label,
    }))).concat(mine(db.stops).filter((s) => s.cost && !s.from).map((s) => ({
        when: s.date, what: s.title, from: 'Planned', firm: false,
        sen: homeOf(s, t), raw: s.cost, cur: s.cur,
        mark: '', label: kindOf(s.kind).label,
    }))).sort((a, b) => (a.when || '').localeCompare(b.when || ''));

    const spent = rows.filter((r) => r.from === 'Expense').reduce((n, r) => n + r.sen, 0);
    set('budgetTableNote', rows.length ? plural(rows.length, 'line') : '');

    if (!rows.length) {
        return html('budgetTable', emptyState('bi-receipt', 'Nothing written down yet',
            'Record an expense, hold a booking, or put a cost on a stop.'));
    }

    html('budgetTable', ''
        + '<div class="table-wrap"><table class="data-table">'
        + '<thead><tr><th>What</th><th>Category</th><th>From</th><th>When</th><th>Cost</th></tr></thead><tbody>'
        + rows.map((r) => '<tr' + (r.firm ? '' : ' class="is-soft"') + '>'
            + '<td><strong>' + esc(r.what || 'Untitled') + '</strong></td>'
            + '<td>' + (r.mark ? r.mark + ' ' : '') + esc(r.label) + '</td>'
            + '<td class="is-muted">' + esc(r.from) + '</td>'
            + '<td>' + (r.when ? fmtDay(r.when) : '—') + '</td>'
            + '<td class="is-strong">' + (r.cur && r.cur !== cur ? amount(r.raw, r.cur, t) : moneyIn(r.sen, cur)) + '</td>'
            + '</tr>').join('')
        + '<tr class="total-row"><td>Actually spent</td><td></td><td></td><td></td>'
        +   '<td>' + moneyIn(spent, cur) + '</td></tr>'
        + '</tbody></table></div>');
}

/* --------------------------------------------------------------------
   The rates this trip is read through.

   One row per foreign currency the trip actually has money in — not the
   whole list, because a rate for a currency nothing is priced in is a
   field asking to be filled in for no reason. Changing one re-reads every
   total; it never rewrites a stored amount.
   -------------------------------------------------------------------- */
function paintRates(t) {
    const home = t.home || 'MYR';
    const used = currenciesUsed(t);
    $('rateCard').hidden = !used.length;
    if (!used.length) return;

    const missing = used.filter((c) => rateFor(t, c) === null);
    $('rateNote').innerHTML = missing.length
        ? '<b class="is-minus">' + plural(missing.length, 'rate') + ' still needed</b>'
        : plural(used.length, 'currency', 'currencies');

    /* Never rebuild these rows while somebody is typing in one of them. The
       note above has already updated, and so has every total on the screen;
       the rows themselves are what the caret is sitting in. */
    if ($('rateRows').contains(document.activeElement)) return;

    html('rateRows', used.map((c) => {
        const r = t.rates && t.rates[c];
        const spent = mine(db.stops).filter((s) => s.cur === c && s.cost).reduce((n, s) => n + s.cost, 0)
            + mine(db.books).filter((b) => b.cur === c && b.cost).reduce((n, b) => n + b.cost, 0);
        return '<div class="rate-row">'
            + '<span class="who">' + CUR[c].flag + ' ' + c + '<small>' + CUR[c].name
            +   ' · ' + moneyIn(spent, c) + ' in this trip</small></span>'
            + '<div class="money-input money-input-sm is-bare">'
            +   '<input type="number" min="0" step="any" data-rate="' + c + '" value="' + (r || '') + '" placeholder="0.00">'
            + '</div>'
            + '<span class="eq">1 ' + home + ' = &hellip; ' + c + '</span>'
            + '</div>';
    }).join(''));
}

/** The bar colour for a kind, as a token name rather than a hex. */
/* ====================================================================
   PACKING
   ==================================================================== */
const STANDARD = [
    ['Documents', ['Passport', 'Boarding passes', 'Travel insurance', 'Hotel confirmations']],
    ['Money',     ['Cash', 'Second card', 'Coin purse']],
    ['Tech',      ['Phone charger', 'Plug adapter', 'Power bank', 'Headphones']],
    ['Clothes',   ['Walking shoes', 'Rain shell', 'Sleepwear', 'Something warm']],
    ['Health',    ['Daily medication', 'Plasters', 'Sunscreen']],
];

function renderPack() {
    const t = trip();
    if (!t) {
        set('packNote', '');
        return html('packList', emptyState('bi-bag', 'Nothing open', 'Each trip, event and activity keeps its own list.'));
    }

    const items = mine(db.packs);

    /* The group field remembers what this trip already uses, so the second
       item in a group never has to be typed out in full. */
    const groups = Array.from(new Set(items.map((p) => p.group).filter(Boolean)));
    html('packGroups', groups.map((g) => '<option value="' + esc(g) + '">').join(''));

    if (!items.length) {
        set('packNote', '');
        return html('packList', emptyState('bi-bag',
            'The list is empty', 'Add an item, or start from a standard list and cut what you do not need.'));
    }

    const done = items.filter((p) => p.done).length;
    set('packNote', done + ' of ' + items.length + ' packed');

    const bag = groupBy(items, (p) => p.group || 'Other');
    html('packList', Object.keys(bag).sort().map((g) => {
        const list = bag[g];
        const n = list.filter((p) => p.done).length;
        const pct = Math.round(n / list.length * 100);

        return '<div class="pack-group">'
            + '<div class="pack-head"><h3>' + esc(g) + '</h3>'
            +   '<span class="pack-count">' + n + '/' + list.length + '</span>'
            +   '<div class="prog is-thin"><i class="' + (n === list.length ? 'is-done' : '') + '" style="width:' + pct + '%"></i></div>'
            + '</div>'
            + list.map((p) => '<div class="pack-item' + (p.done ? ' is-done' : '') + '">'
                + '<input type="checkbox" id="pk-' + esc(p.id) + '" data-pack="' + esc(p.id) + '"' + (p.done ? ' checked' : '') + '>'
                + '<label for="pk-' + esc(p.id) + '">' + esc(p.item) + '</label>'
                + (p.qty > 1 ? '<span class="qty">×' + p.qty + '</span>' : '')
                + '<button type="button" class="row-x" data-drop-pack="' + esc(p.id) + '" title="Remove"><i class="bi bi-x-lg"></i></button>'
                + '</div>').join('')
            + '</div>';
    }).join(''));
}

function savePack() {
    const t = trip();
    if (!t) return;
    const item = $('packItem').value.trim();
    if (!item) return $('packItem').focus();

    db.packs.push({
        id: newId('p'), trip: t.id,
        group: $('packGroup').value.trim() || 'Other',
        item,
        qty: Math.max(1, Number($('packQty').value) || 1),
        done: false,
    });

    save();
    $('packItem').value = '';
    $('packQty').value = '';
    $('packItem').focus();
    repaint();
}

/** No edit mode here — a packing item is three fields and a tick, so this
    is only ever Clear. */
function blankPackForm() {
    ['packGroup', 'packItem', 'packQty'].forEach((id) => { if ($(id)) $(id).value = ''; });
    $('packItem').focus();
}

function seedPack() {
    const t = trip();
    if (!t) return;
    const have = new Set(mine(db.packs).map((p) => (p.group + '|' + p.item).toLowerCase()));

    STANDARD.forEach(([group, items]) => {
        items.forEach((item) => {
            if (have.has((group + '|' + item).toLowerCase())) return;
            db.packs.push({ id: newId('p'), trip: t.id, group, item, qty: 1, done: false });
        });
    });

    save();
    repaint();
}

/* ====================================================================
   TOAST — what just happened, and the way back

   The counterpart to `ask`. A dialog interrupts you before the fact; a
   toast reports after it. Which one an action deserves comes down to
   whether it can be undone — see the note above the toast styles.
   ==================================================================== */
const TOASTS = {};
let toastSeq = 0;

function toast(message, action) {
    const wrap = $('toastWrap');
    if (!wrap) return;

    const id = 'toast-' + (toastSeq++);
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span class="msg">' + message + '</span>'
        + (action ? '<button type="button" class="act" data-toast-do="' + id + '">' + esc(action.label) + '</button>' : '')
        + '<button type="button" class="x" data-toast-x="' + id + '" aria-label="Dismiss">'
        + '<i class="bi bi-x-lg"></i></button>';

    wrap.appendChild(el);
    /* An offer of Undo has to outlast the moment of doubt; a plain
       confirmation only has to be read once. */
    TOASTS[id] = { el, action, timer: setTimeout(() => dropToast(id), action ? 10000 : 6500) };
}

function dropToast(id) {
    const row = TOASTS[id];
    if (!row) return;
    clearTimeout(row.timer);
    row.el.remove();
    delete TOASTS[id];
}

/* ====================================================================
   ASK — the one dialog, for the things that cannot be taken back
   ==================================================================== */
let askThen = null;

function ask(title, body, then) {
    set('askTitle', title);
    set('askBody', body);
    askThen = then;
    $('askBox').hidden = false;
}

function closeAsk() {
    $('askBox').hidden = true;
    askThen = null;
}

/* --------------------------------------------------------------------
   The Data panel

   Where the records are, how much room is left, and the three ways out of
   here. It is one dialog rather than a row of buttons because there is
   enough to say about a backup that a toolbar was hiding most of it.
   -------------------------------------------------------------------- */
function openData() {
    paintStorage();
    $('dataBox').hidden = false;
}

const closeData = () => { $('dataBox').hidden = true; };

function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

async function paintStorage() {
    if (!haveStore()) {
        set('dataWhere', 'In this browser’s localStorage.');
        return set('dataUsed', '');
    }

    const backend = PSStore.backend();
    const used = PSStore.usedBytes();
    const budget = await PSStore.measure();
    const kept = await PSStore.persisted();

    set('dataWhere', backend === 'indexedDB'
        ? 'In this browser, in IndexedDB.'
            + (kept ? ' Marked to be kept — the browser will not clear it to free space.' : '')
        : 'In this browser’s localStorage. IndexedDB was not available, so the ceiling is about 5 MB —'
            + ' pictures are what will reach it.');

    /* Against the ceiling rather than against itself: the question here is
       how much room is left, and a bar that rescales to whatever is stored
       can never answer it. */
    const pct = Math.min(100, used / budget * 100);
    const fill = $('dataMeterFill');
    if (fill) {
        fill.style.width = Math.max(0.4, pct).toFixed(2) + '%';
        fill.className = pct > 90 ? 'is-over' : (pct > 70 ? 'is-warn' : '');
    }
    set('dataUsed', fmtSize(used) + ' of ' + fmtSize(budget)
        + (pct < 1 ? ' — barely a dent' : ' — ' + pct.toFixed(1) + '%'));
}

/** Told by store.js every time a write lands or fails. A warning that
    never clears itself is a warning people learn to ignore, so a
    successful write takes the last one down. */
let storeSaid = false;

function storeReport(err) {
    if (!err) {
        if (storeSaid) { storeSaid = false; toast('Saved again — whatever was blocking it has cleared.'); }
        return;
    }
    if (storeSaid) return;
    storeSaid = true;
    toast('<b>That did not save.</b> The browser refused the write — '
        + (/quota|full/i.test(err.message || '') ? 'there is no room left. Export a copy, then delete some receipts or photos.'
            : 'try Export to get a copy out while you can.'));
}

/* ====================================================================
   EXPORT / IMPORT / DRIVE

   One shape, three routes in and out. What Export writes to a file is
   exactly what goes up to Drive, so a file pulled off Drive can be fed to
   Import, and a file made by Export can be dropped into the Drive folder
   by hand.

   The envelope wraps the store rather than being it: a `format` field is
   what lets Import refuse somebody's tax return with a sentence instead of
   a stack trace, and a `saved` stamp is what lets a pull say how old the
   Drive copy is before anybody agrees to overwrite anything.
   ==================================================================== */
const BACKUP_FORMAT = 'plansphere.backup';

function psEnvelope() {
    return {
        format: BACKUP_FORMAT,
        version: 1,
        app: 'PlanSphere',
        saved: new Date().toISOString(),
        data: db,
    };
}

/** The store inside a file, whichever shape it arrived in, or null.
 *  Files written before the envelope existed are the bare store, and they
 *  still open — a backup that stops working is not a backup. */
function psUnwrap(parsed) {
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.format === BACKUP_FORMAT && parsed.data && Array.isArray(parsed.data.trips)) return parsed.data;
    if (Array.isArray(parsed.trips)) return parsed;
    return null;
}

/** What is in a store, in words, for the dialogs that ask before replacing. */
function psSummary(bag) {
    if (!bag) return 'nothing';
    const bits = [
        [bag.trips, 'trip'],
        [bag.stops, 'stop'],
        [bag.spend, 'expense'],
        [bag.notes, 'note'],
        [bag.docs, 'document'],
    ].filter(([list]) => Array.isArray(list) && list.length)
        .map(([list, word]) => plural(list.length, word));
    return bits.length ? bits.join(', ') : 'nothing yet';
}

/** True when there is nothing here worth keeping — what the Drive offer
 *  checks before suggesting a pull. The default vocabulary lists do not
 *  count: every browser has those from the first load. */
function psIsEmpty() {
    return !['trips', 'stops', 'books', 'packs', 'events', 'notes', 'spend', 'docs']
        .some((k) => Array.isArray(db[k]) && db[k].length);
}

/** Replaces everything with a store from a file or from Drive, then
 *  reloads — every screen reads the store once at start-up. */
function psApply(bag) {
    db = Object.assign({
        trips: [], stops: [], books: [], packs: [], events: [], cats: [], types: [],
        notes: [], spend: [], spendCats: [], docs: [], settle: [], current: null,
    }, bag);
    if (!db.trips.some((t) => t.id === db.current)) db.current = db.trips.length ? db.trips[0].id : null;
    save();
    if (haveStore()) PSStore.flush().then(() => location.reload());
    else location.reload();
}

function exportAll() {
    const blob = new Blob([JSON.stringify(psEnvelope(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plansphere-' + today() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function importAll(file) {
    const reader = new FileReader();
    reader.onload = () => {
        let parsed;
        try { parsed = JSON.parse(String(reader.result)); }
        catch (err) { parsed = null; }

        const bag = psUnwrap(parsed);
        if (!bag) {
            return ask('That file did not open',
                'It is not a PlanSphere backup — there are no trips in it, so there is nothing '
                + 'to restore. Export writes the kind of file this expects.', null);
        }

        ask('Replace everything with this file?',
            'The file holds ' + psSummary(bag) + '. This browser holds ' + psSummary(db)
            + ', and all of it will be replaced — importing never merges, because two '
            + 'disagreeing copies of the same trip is a worse answer than one.',
            () => psApply(bag));
    };
    reader.readAsText(file);
}

/* ====================================================================
   MODULE 02 · CALENDAR & TIMELINE

   Four views over one set of items. The items come from four places and
   only one of them belongs to this module:

     events  — activities the calendar owns. Full edit here.
     trips   — drawn as bars across their dates.
     stops   — the "what time, where" of a trip.
     books   — flights, stays and tickets, on the day they happen.

   The last three are windows into the module that owns them: clicking one
   goes there rather than opening an editor that could only lie about what
   it is editing. Dragging still works on all of them, because a date is a
   date wherever it is stored — but a trip is a span, and moving a span
   moves everything inside it, so that one stays on the Trips screen.
   ==================================================================== */
/* --------------------------------------------------------------------
   Categories are rows in the store, not a fixed schema

   The six that ship are a starting point. Name, mark and colour are all
   editable and the list can grow, which is why colour is no longer one
   CSS class per category — a class list caps the count at however many
   classes somebody remembered to write. Each row names a tone instead,
   and `--cc` / `--cc-soft` are set inline from it.

   `trip` is the one the app fills in itself, from trips, stops and
   bookings. It can be renamed and recoloured like any other; it cannot
   be deleted, because the rows that use it are not the user's to move.
   -------------------------------------------------------------------- */
const TONES = {
    azure:  ['--azure',  '--azure-soft'],
    violet: ['--violet', '--violet-soft'],
    teal:   ['--teal',   '--teal-soft'],
    rose:   ['--rose',   '--rose-soft'],
    amber:  ['--amber',  '--amber-soft'],
    green:  ['--green',  '--green-soft'],
    sky:    ['--sky',    '--sky-soft'],
    slate:  ['--slate',  '--slate-soft'],
    node:   ['--node',   '--node-soft'],
    red:    ['--red',    '--red-soft'],
};

const TONE_ORDER = ['azure', 'violet', 'teal', 'rose', 'amber', 'green', 'sky', 'slate', 'node', 'red'];

const DEFAULT_CATS = [
    { id: 'trip',     label: 'Trip',     mark: '\u{1F30E}', tone: 'azure',  locked: true },
    { id: 'holiday',  label: 'Holiday',  mark: '\u{1F38A}', tone: 'red',    locked: true },
    { id: 'event',    label: 'Event',    mark: '\u{1F389}', tone: 'violet' },
    { id: 'personal', label: 'Personal', mark: '\u{1F464}', tone: 'teal' },
    { id: 'company',  label: 'Company',  mark: '\u{1F3E2}', tone: 'slate' },
    { id: 'family',   label: 'Family',   mark: '\u{1F46A}', tone: 'rose' },
    { id: 'birthday', label: 'Birthday', mark: '\u{1F382}', tone: 'amber' },
];

/** Falls back to the first category that is not the system one, so an
    activity whose category was deleted still draws as something. */
function catOf(id) {
    return db.cats.find((c) => c.id === id)
        || db.cats.find((c) => !c.locked)
        || db.cats[0]
        || { id: 'other', label: 'Other', mark: '\u{1F516}', tone: 'slate' };
}

/** The two custom properties every chip, dot, disc and block reads. */
function tone(cat) {
    const pair = TONES[cat && cat.tone] || TONES.slate;
    return '--cc:var(' + pair[0] + ');--cc-soft:var(' + pair[1] + ')';
}

const toneOf = (id) => tone(catOf(id));

/** Where a non-event item goes when you click it, and what to call it. */
const SOURCES = {
    event: { module: null,    label: 'Activity' },
    trip:    { module: 'trips', label: 'Trip' },
    stop:    { module: 'plan',  label: 'Itinerary' },
    book:    { module: 'book',  label: 'Booking' },
    holiday: { module: null,    label: 'Holiday' },
};

let calView   = 'month';
let calCursor = null;        // the day the view is anchored to
let calQuery  = '';
let calOff    = new Set();   // categories switched OFF, so a fresh app shows all
let calPast   = false;       // timeline: are the days behind us shown
let editAct   = null;

/* --------------------------------------------------------------------
   Dates the calendar needs on top of the app's own
   -------------------------------------------------------------------- */
function isoOf(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + String(d.getDate()).padStart(2, '0');
}

/** Monday. Weeks that start on Sunday put the weekend either side of the
    working week, which is the wrong shape for a screen about plans. */
function startOfWeek(iso) {
    const d = asDate(iso);
    return shiftDate(iso, -((d.getDay() + 6) % 7));
}

function addMonths(iso, n) {
    const d = asDate(iso);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    /* 31 Jan + 1 month is 28 Feb, not 3 March. Clamp to the month's last day
       rather than letting the Date object roll over into the next one. */
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    return isoOf(d);
}

/**
 * The same day in another year. 29 February falls back to the 28th, which
 * is what the people born on it do — a birthday that disappears in three
 * years out of four is a bug, not a fact about the calendar.
 */
function anniversary(iso, year) {
    const month = iso.slice(5, 7);
    const last = new Date(year, Number(month), 0).getDate();
    return year + '-' + month + '-' + String(Math.min(Number(iso.slice(8, 10)), last)).padStart(2, '0');
}

/**
 * The years a yearly entry is drawn in.
 *
 * A repeat has no end, and the calendar has no edge either — so the years
 * are cut to the ones somebody can be looking at: where the cursor is,
 * where today is, and one either side so paging never lands on a month
 * that has lost a birthday it should have.
 */
function repeatYears() {
    const here = Number((calCursor || today()).slice(0, 4));
    const now = Number(today().slice(0, 4));
    const out = [];
    [here, now].forEach((year) => {
        for (let y = year - 1; y <= year + 1; y++) if (out.indexOf(y) < 0) out.push(y);
    });
    return out;
}

/** Whole weeks covering the cursor's month — five rows or six, never a
    blank one padded on just to keep the box square. */
function monthGrid(iso) {
    const d = asDate(iso);
    d.setDate(1);
    const first = isoOf(d);
    const lead = (asDate(first).getDay() + 6) % 7;
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const rows = Math.ceil((lead + days) / 7);
    const start = startOfWeek(first);
    return Array.from({ length: rows * 7 }, (unused, i) => shiftDate(start, i));
}

const minutesOf = (hhmm) => {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(':').map(Number);
    return Number.isNaN(h) ? null : h * 60 + (m || 0);
};

/** A month chip is about 90px wide, so the time has to fit in four glyphs. */
function fmtTimeTiny(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const suffix = h < 12 ? 'a' : 'p';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return (m ? hour + ':' + String(m).padStart(2, '0') : String(hour)) + suffix;
}

function fmtMonth(iso) {
    const d = asDate(iso);
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/* --------------------------------------------------------------------
   Everything the calendar knows about, from wherever it lives
   -------------------------------------------------------------------- */
function calItems() {
    const out = [];

    /* One record, one date — and, for a birthday, one date per year drawn
       from it. The copies are marked `rep` so the places that mean the
       *record* rather than the day it lands on — the .ics, Google, the
       count beside a category — can keep counting it once. */
    db.events.forEach((e) => {
        const it = {
            src: 'event', id: e.id, cat: e.cat || 'personal', title: e.title,
            date: e.date, time: e.time || '', end: e.end || '',
            where: e.where || '', note: e.note || '', remind: e.remind,
            repeat: e.repeat === 'year' ? 'year' : '', movable: true,
        };
        out.push(it);
        if (it.repeat !== 'year' || !e.date) return;

        repeatYears().forEach((year) => {
            const date = anniversary(e.date, year);
            /* Never before the day it first fell on: a birthday put in this
               year is not evidence of one last year. */
            if (date <= e.date) return;
            out.push(Object.assign({}, it, { date, rep: true }));
        });
    });

    /* Trips, events and activities all draw here, each in its own
       category's colour. An activity is one day, so `until` closes on the
       day it opens and the bar is a single cell wide. */
    db.trips.forEach((t) => {
        if (!t.from) return;
        const kin = kinOf(t.kind);
        out.push({
            src: 'trip', id: t.id, cat: catOfTrip(t),
            title: t.name || 'Untitled ' + kin.label.toLowerCase(),
            date: t.from, until: (kin.span && t.to) || t.from, span: true,
            where: t.where || '', movable: false, trip: t.id,
        });
    });

    db.stops.forEach((s) => {
        if (!s.date) return;
        out.push({
            src: 'stop', id: s.id, cat: 'trip', title: s.title, date: s.date,
            time: s.time || '', where: s.where || '', kind: s.kind, cost: s.cost,
            movable: true, trip: s.trip,
        });
    });

    db.books.forEach((b) => {
        if (!b.date) return;
        out.push({
            src: 'book', id: b.id, cat: 'trip', title: b.title, date: b.date,
            time: '', where: b.who || '', kind: b.kind, status: b.status,
            cost: b.cost, movable: true, trip: b.trip,
        });
    });

    holItems().forEach((it) => out.push(it));

    return out;
}

function calVisible() {
    const q = calQuery.trim().toLowerCase();
    return calItems().filter((it) => {
        if (calOff.has(it.cat)) return false;
        if (!q) return true;
        return (it.title + ' ' + it.where + ' ' + (it.note || '')).toLowerCase().indexOf(q) > -1;
    });
}

/** A span is on every day between its ends, not only on the first one. */
function itemsOn(list, date) {
    return list.filter((it) => (it.span ? date >= it.date && date <= it.until : it.date === date));
}

/** All-day first, then the clock, then whatever has no time at all. */
function byTime(a, b) {
    if (!!a.span !== !!b.span) return a.span ? -1 : 1;
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
}

const itemKey = (it) => it.src + ':' + it.id;

function findItem(key) {
    const [src, id] = key.split(':');
    return calItems().find((it) => it.src === src && it.id === id) || null;
}

/* --------------------------------------------------------------------
   Painting
   -------------------------------------------------------------------- */
function renderCal() {
    if (!calCursor) calCursor = today();
    const list = calVisible();

    paintCatBar();
    paintCats();
    paintHolPicker();
    paintRemindBtn();
    holFill();

    const titles = { month: 'Month', week: 'Week', day: 'Day', timeline: 'Timeline' };
    set('calViewTitle', titles[calView]);

    const nav = ['calPrev', 'calNext', 'calToday'];
    nav.forEach((id) => { $(id).disabled = calView === 'timeline'; });

    if (calView === 'month') {
        set('calTitle', fmtMonth(calCursor));
        const inMonth = list.filter((it) => (it.span
            ? it.until.slice(0, 7) >= calCursor.slice(0, 7) && it.date.slice(0, 7) <= calCursor.slice(0, 7)
            : it.date.slice(0, 7) === calCursor.slice(0, 7)));
        set('calNote', plural(inMonth.length, 'entry', 'entries') + ' this month');
        html('calBody', viewMonth(list));
    } else if (calView === 'week') {
        const from = startOfWeek(calCursor);
        const days = Array.from({ length: 7 }, (unused, i) => shiftDate(from, i));
        set('calTitle', fmtRange(from, days[6]));
        set('calNote', plural(days.reduce((n, d) => n + itemsOn(list, d).length, 0), 'entry', 'entries') + ' this week');
        html('calBody', viewGrid(list, days));
    } else if (calView === 'day') {
        set('calTitle', fmtDay(calCursor) + (calCursor === today() ? ' · today' : ''));
        set('calNote', plural(itemsOn(list, calCursor).length, 'entry', 'entries'));
        html('calBody', viewGrid(list, [calCursor]));
    } else {
        set('calTitle', 'Everything ahead');
        html('calBody', viewTimeline(list));
    }

    $('calHint').hidden = calView === 'timeline';
}

function paintCatBar() {
    const all = calItems();
    html('calCats', db.cats.map((c) => {
        const n = all.filter((it) => it.cat === c.id && !it.rep).length;
        return '<button type="button" class="cat-chip' + (calOff.has(c.id) ? '' : ' is-on')
            + '" style="' + tone(c) + '" data-cat="' + esc(c.id) + '" aria-pressed="' + (!calOff.has(c.id)) + '">'
            + '<span class="dot"></span>' + esc(c.mark) + ' ' + esc(c.label)
            + (n ? ' <span class="n">' + n + '</span>' : '')
            + '</button>';
    }).join(''));
}

/* ---- Month ---- */
function viewMonth(list) {
    const cells = monthGrid(calCursor);
    const month = calCursor.slice(0, 7);
    const now = today();
    const dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return '<div class="cal-month">'
        + dow.map((d) => '<div class="cal-dow">' + d + '</div>').join('')
        + cells.map((date) => {
            const items = itemsOn(list, date).sort(byTime);
            const shown = items.slice(0, 3);
            const rest = items.length - shown.length;
            return '<div class="cal-cell'
                + (date.slice(0, 7) === month ? '' : ' is-out')
                + (date === now ? ' is-today' : '')
                + '" data-day="' + date + '">'
                + '<span class="cal-daynum">' + Number(date.slice(8)) + '</span>'
                + shown.map((it) => monthChip(it, date)).join('')
                + (rest > 0 ? '<button type="button" class="cal-more" data-open-day="' + date + '">+' + rest + ' more</button>' : '')
                + '</div>';
        }).join('')
        + '</div>';
}

function monthChip(it, date) {
    if (it.span) {
        const start = date === it.date;
        const end = date === it.until;
        return '<button type="button" class="cal-chip is-span'
            + (start ? ' is-start' : '') + (end ? ' is-end' : '') + (!start && !end ? ' is-mid' : '')
            + '" style="' + toneOf(it.cat) + '" data-item="' + itemKey(it) + '" title="' + esc(it.title) + '">'
            + '<span class="n">' + esc(it.title) + '</span></button>';
    }
    return '<button type="button" class="cal-chip" style="' + toneOf(it.cat) + '" data-item="' + itemKey(it) + '"'
        + (it.movable ? ' draggable="true"' : '') + ' title="' + esc(it.title)
        + (it.repeat === 'year' ? ' · every year' : '') + '">'
        + (it.time ? '<span class="t">' + fmtTimeTiny(it.time) + '</span>' : '')
        + '<span class="n">' + esc(it.title) + '</span></button>';
}

/* ---- Week and Day: one grid, one column or seven ---- */
const HOUR_PX = 44;
const durationOf = (it) => {
    const s = minutesOf(it.time);
    const e = minutesOf(it.end);
    return e && e > s ? e - s : 60;
};

function viewGrid(list, days) {
    const now = today();
    const perDay = days.map((date) => {
        const items = itemsOn(list, date);
        return {
            date,
            allDay: items.filter((it) => it.span || !it.time).sort(byTime),
            timed: items.filter((it) => !it.span && it.time).sort(byTime),
        };
    });

    /* The window is cut to what is actually in it. A grid that always ran
       midnight to midnight would spend two thirds of its height on hours
       nobody has ever planned anything in. */
    const edges = perDay.flatMap((p) => p.timed.flatMap((it) => [minutesOf(it.time), minutesOf(it.time) + durationOf(it)]));

    /* If today is on screen, the current hour is part of what the window has
       to cover. Without this the now-line is computed, found to be outside a
       window cut to the day's items, and silently dropped — which is exactly
       when you most want to see where you are. */
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    if (perDay.some((p) => p.date === now)) edges.push(nowMins);

    let lo = 8 * 60;
    let hi = 18 * 60;
    if (edges.length) { lo = Math.min.apply(null, edges); hi = Math.max.apply(null, edges); }
    lo = Math.max(0, Math.floor(lo / 60) * 60 - 60);
    hi = Math.min(24 * 60, Math.ceil(hi / 60) * 60 + 60);
    if (hi - lo < 8 * 60) hi = Math.min(24 * 60, lo + 8 * 60);
    const height = (hi - lo) / 60 * HOUR_PX;

    const rules = 'repeating-linear-gradient(to bottom, var(--line-2) 0 1px, transparent 1px ' + HOUR_PX + 'px)';

    let out = '<div class="cal-grid-wrap"><div class="cal-grid" style="--cols:' + days.length + '">';

    out += '<div class="cal-corner"></div>';
    out += perDay.map((p) => {
        const d = asDate(p.date);
        return '<div class="cal-head' + (p.date === now ? ' is-today' : '') + '">'
            + '<div class="d">' + d.toLocaleDateString('en-GB', { weekday: 'short' }) + '</div>'
            + '<div class="n">' + d.getDate() + '</div></div>';
    }).join('');

    out += '<div class="cal-allday-label">All day</div>';
    out += perDay.map((p) => '<div class="cal-allday" data-day="' + p.date + '">'
        + p.allDay.map((it) => monthChip(it, p.date)).join('') + '</div>').join('');

    out += '<div class="cal-hours" style="height:' + height + 'px">'
        + Array.from({ length: (hi - lo) / 60 }, (unused, i) => {
            const h = (lo / 60) + i;
            return '<div class="cal-hour" style="height:' + HOUR_PX + 'px">'
                + (h % 12 === 0 ? 12 : h % 12) + (h < 12 ? 'am' : 'pm') + '</div>';
        }).join('')
        + '</div>';

    out += perDay.map((p) => {
        const packed = pack(p.timed);
        let col = '<div class="cal-col' + (p.date === now ? ' is-today' : '') + '" data-day="' + p.date
            + '" style="height:' + height + 'px;background-image:' + rules + '">';

        if (p.date === now && nowMins >= lo && nowMins <= hi) {
            col += '<div class="cal-now" style="top:' + ((nowMins - lo) / 60 * HOUR_PX) + 'px"></div>';
        }

        col += packed.rows.map((r) => {
            const top = (r.start - lo) / 60 * HOUR_PX;
            const h = Math.max(20, (r.end - r.start) / 60 * HOUR_PX);
            const w = 100 / packed.lanes;
            return '<button type="button" class="cal-block' + (h < 34 ? ' is-short' : '') + '"'
                + ' data-item="' + itemKey(r.it) + '"' + (r.it.movable ? ' draggable="true"' : '')
                + ' style="' + toneOf(r.it.cat) + ';top:' + top.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px;'
                + 'left:calc(' + (r.lane * w).toFixed(2) + '% + 3px);width:calc(' + w.toFixed(2) + '% - 6px)">'
                + '<span class="t">' + fmtTime(r.it.time) + '</span>'
                + '<span class="n">' + esc(r.it.title) + '</span>'
                + (r.it.where ? '<span class="w">' + esc(r.it.where) + '</span>' : '')
                + '</button>';
        }).join('');

        return col + '</div>';
    }).join('');

    return out + '</div></div>';
}

/** Two things at 10:00 must sit side by side, not on top of each other. */
function pack(items) {
    const rows = [];
    items.forEach((it) => {
        const start = minutesOf(it.time);
        const end = start + durationOf(it);
        let lane = 0;
        while (rows.some((r) => r.lane === lane && start < r.end && r.start < end)) lane++;
        rows.push({ it, start, end, lane });
    });
    return { rows, lanes: Math.max(1, ...rows.map((r) => r.lane + 1)) };
}

/* ---- Timeline ---- */
function viewTimeline(list) {
    const now = today();
    const past = list.filter((it) => (it.span ? it.until : it.date) < now);
    const ahead = list.filter((it) => (it.span ? it.until : it.date) >= now);
    const shown = calPast ? list.slice() : ahead;

    set('calNote', plural(ahead.length, 'entry', 'entries') + ' ahead');

    if (!shown.length) {
        return emptyState('bi-calendar2-week', 'Nothing ahead',
            'Nothing here yet - add a calendar entry or a trip on the Activities screen.');
    }

    const dates = Array.from(new Set(shown.map((it) => it.date))).sort();
    const head = past.length
        ? '<button type="button" class="ghost-btn" id="calTogglePast" style="margin-bottom:18px">'
            + '<i class="bi bi-clock-history"></i>' + (calPast ? 'Hide' : 'Show') + ' ' + plural(past.length, 'earlier entry', 'earlier entries')
            + '</button>'
        : '';

    return head + dates.map((date) => {
        const items = shown.filter((it) => it.date === date).sort(byTime);
        const n = daysBetween(now, date);
        const when = n === 0 ? 'Today' : n === 1 ? 'Tomorrow'
            : n > 0 ? 'In ' + plural(n, 'day') : plural(Math.abs(n), 'day') + ' ago';

        return '<div class="cal-tl-day' + (date === now ? ' is-today' : '') + '">'
            + '<div class="cal-tl-head"><span class="w">' + when + '</span>'
            + '<span class="d">' + fmtDay(date) + '</span>'
            + '<span class="c">' + plural(items.length, 'entry', 'entries') + '</span></div>'
            + items.map((it) => timelineRow(it)).join('')
            + '</div>';
    }).join('');
}

function timelineRow(it) {
    const c = catOf(it.cat);
    const src = SOURCES[it.src];
    const when = it.span
        ? (it.date === it.until ? 'All day' : 'Until ' + fmtDay(it.until))
        : it.time ? fmtTime(it.time) : 'Any time';

    return '<button type="button" class="cal-row" style="' + toneOf(it.cat) + '" data-item="' + itemKey(it) + '">'
        + '<span class="tm' + (it.time || it.span ? '' : ' is-none') + '">' + when + '</span>'
        + '<span class="disc cat" style="' + tone(c) + '">' + esc(c.mark) + '</span>'
        + '<span><span class="nm">' + esc(it.title)
        + (it.repeat === 'year'
            ? ' <i class="bi bi-arrow-repeat cal-rep" title="Every year"></i>' : '') + '</span>'
        + (it.where ? '<small class="wh">' + esc(it.where) + '</small>' : '') + '</span>'
        + (it.remind != null && it.remind !== '' ? '<i class="bi bi-bell-fill cal-bell" title="Reminder set"></i>' : '<span></span>')
        + '<span class="src">' + src.label + '</span>'
        + '</button>';
}

/* ====================================================================
   PUBLIC HOLIDAYS

   Two countries matter on a trip: the one you left, because that is when
   your own office is shut, and the one you are in, because that is when
   the shops are shut, the trains are full and the hotel costs double.
   Both are shown.

   Rules rather than an API. `date-holidays` is a library that computes
   206 countries from bundled rules — including Malaysia and Thailand,
   which the free holiday APIs do not carry — so once the module has been
   fetched, every year for every country is available with no network at
   all. Results are cached per country and year, so even the module fetch
   only has to succeed once.

   It is loaded on demand rather than up front: nothing else in the app
   needs it, and a calendar should paint before it goes looking.
   ==================================================================== */
const HOL_KEY = 'plansphere.holidays.v1';
const HOL_CDN = 'https://cdn.jsdelivr.net/npm/date-holidays@3/+esm';

/* Curated rather than complete. The library knows 206 countries; a select
   with 206 rows in it is a worse control than one with the places people
   actually go. Cambodia, Laos and Myanmar are absent from the library
   itself — noted here so their absence reads as a fact, not an oversight. */
const COUNTRIES = [
    ['MY', 'Malaysia'], ['SG', 'Singapore'], ['TH', 'Thailand'], ['VN', 'Vietnam'],
    ['ID', 'Indonesia'], ['PH', 'Philippines'], ['BN', 'Brunei'],
    ['JP', 'Japan'], ['KR', 'South Korea'], ['CN', 'China'], ['HK', 'Hong Kong'],
    ['TW', 'Taiwan'], ['IN', 'India'],
    ['AU', 'Australia'], ['NZ', 'New Zealand'],
    ['GB', 'United Kingdom'], ['FR', 'France'], ['DE', 'Germany'], ['IT', 'Italy'],
    ['ES', 'Spain'], ['NL', 'Netherlands'], ['CH', 'Switzerland'], ['TR', 'Turkey'],
    ['AE', 'United Arab Emirates'], ['SA', 'Saudi Arabia'], ['EG', 'Egypt'],
    ['US', 'United States'], ['CA', 'Canada'], ['MX', 'Mexico'],
    ['BR', 'Brazil'], ['ZA', 'South Africa'],
];

function fillCountrySelect(el, selected) {
    if (!el) return;
    el.innerHTML = '<option value="">Not set</option>'
        + COUNTRIES.map(([code, name]) => '<option value="' + code + '">' + name + '</option>').join('');
    el.value = selected || '';
}

const countryName = (code) => (COUNTRIES.find((c) => c[0] === code) || [null, code])[1];

let holCache = {};      /* 'MY-2026' -> [{ date, name }] */
let holLib = null;
let holState = 'idle';  /* idle | loading | ready | fail */

function holLoad() {
    try { holCache = JSON.parse(localStorage.getItem(HOL_KEY) || '{}'); }
    catch (err) { holCache = {}; }
}

function holSave() {
    try { localStorage.setItem(HOL_KEY, JSON.stringify(holCache)); }
    catch (err) { /* a cache that will not write is recomputed next time */ }
}

/** The country/year pairs the calendar can currently show. */
function holWanted() {
    const years = new Set();
    if (calCursor) years.add(Number(calCursor.slice(0, 4)));
    years.add(Number(today().slice(0, 4)));

    const places = new Set();
    if (db.homeCountry) places.add(db.homeCountry);

    db.trips.forEach((t) => {
        if (!t.country) return;
        places.add(t.country);
        if (t.from) years.add(Number(t.from.slice(0, 4)));
        if (t.to) years.add(Number(t.to.slice(0, 4)));
    });

    const out = [];
    places.forEach((c) => years.forEach((y) => {
        if (y && !holCache[c + '-' + y]) out.push([c, y]);
    }));
    return out;
}

/** Fetches the rules once, fills whatever is missing, repaints if it found
    anything. Failure is silent — a calendar with no holidays on it is still
    a calendar. */
async function holFill() {
    if (holState === 'loading') return;
    const wanted = holWanted();
    if (!wanted.length) return;

    holState = 'loading';

    try {
        if (!holLib) {
            const mod = await import(HOL_CDN);
            holLib = mod.default || mod;
        }
        wanted.forEach(([country, year]) => {
            try {
                holCache[country + '-' + year] = new holLib(country)
                    .getHolidays(year)
                    .filter((h) => h.type === 'public')
                    .map((h) => ({ date: String(h.date).slice(0, 10), name: h.name }));
            } catch (err) {
                /* a country the library does not carry — cache the emptiness
                   so it is not asked for again on every repaint */
                holCache[country + '-' + year] = [];
            }
        });
        holSave();
        holState = 'ready';
        renderCal();
    } catch (err) {
        holState = 'fail';
        if (!holToldOff) {
            holToldOff = true;
            toast('Could not fetch the public-holiday rules. Everything else still works.');
        }
    }
}

/** Holidays as calendar items, from the cache only. Nothing here waits. */
function holItems() {
    const out = [];
    const seen = new Set();

    /* The cache keeps every country ever looked at, on purpose — it is what
       makes this work on a plane. What shows is only the countries in play
       right now: your own, and the ones your trips go to. Without this,
       browsing from Malaysia to Singapore and back left both sets on the
       calendar and the chip counted 31 where it should have counted 17. */
    const active = new Set([db.homeCountry]
        .concat(db.trips.map((t) => t.country))
        .filter(Boolean));

    Object.keys(holCache).forEach((key) => {
        const country = key.slice(0, key.lastIndexOf('-'));
        if (!active.has(country)) return;
        const mine = country === db.homeCountry;
        (holCache[key] || []).forEach((h) => {
            const id = country + '-' + h.date;
            if (seen.has(id)) return;
            seen.add(id);
            out.push({
                src: 'holiday', id, cat: 'holiday',
                title: h.name, date: h.date, time: '',
                where: countryName(country) + (mine ? '' : ' · while you are away'),
                country, movable: false,
            });
        });
    });

    return out;
}

/* The chip's own count says how many there are and the picker says which
   country, so a note has nothing left to add. The one thing still worth
   reporting is a failure, and that is said once, out loud. */
let holToldOff = false;

/* The options never change, so they are written once and only the selected
   value is kept in step afterwards. */
function paintHolPicker() {
    const el = $('holCountry');
    if (!el) return;
    if (!el.options.length) {
        el.innerHTML = '<option value="">No holidays</option>'
            + COUNTRIES.map(([code, name]) => '<option value="' + code + '">' + name + '</option>').join('');
    }
    if (document.activeElement !== el) el.value = db.homeCountry || '';
}

/* --------------------------------------------------------------------
   One activity, straight into Google Calendar

   A template link, which needs no account setup, no API key and no
   permission from anybody: Google reads the event out of the URL and
   opens its own "new event" form pre-filled. For the whole calendar,
   the .ics is the better route — Google imports it like any other
   calendar app.
   -------------------------------------------------------------------- */
function googleUrl(row) {
    const stamp = (iso, hhmm) => iso.replace(/-/g, '') + (hhmm ? 'T' + hhmm.replace(':', '') + '00' : '');
    const from = row.time ? stamp(row.date, row.time) : stamp(row.date);
    const to = row.time
        ? stamp(row.date, row.end || row.time)
        : stamp(shiftDate(row.date, 1));

    const q = {
        action: 'TEMPLATE',
        text: catOf(row.cat).mark + ' ' + row.title,
        dates: from + '/' + to,
        details: row.note || '',
        location: row.where || '',
    };

    return 'https://calendar.google.com/calendar/render?'
        + Object.keys(q).filter((k) => q[k]).map((k) => k + '=' + encodeURIComponent(q[k])).join('&');
}

/* --------------------------------------------------------------------
   The category manager

   Edits land as they are typed, like everything else here. The one rule
   is the system category: it can be renamed and recoloured, but not
   removed, because the rows filed under it are trips and stops rather
   than anything a person put there.
   -------------------------------------------------------------------- */
function paintCats() {
    const all = calItems();
    set('catNote', plural(db.cats.length, 'category', 'categories'));

    /* Never rebuild a list somebody is typing in — the input would be
       replaced under the caret on every keystroke. */
    if ($('catList').contains(document.activeElement)) return;

    html('catList', db.cats.map((c) => {
        const used = all.filter((it) => it.cat === c.id && !it.rep).length;
        return '<div class="cat-row" style="' + tone(c) + '">'
            + '<input class="cat-mark" type="text" maxlength="4" aria-label="Mark for ' + esc(c.label) + '"'
            +   ' data-cat-mark="' + esc(c.id) + '" value="' + esc(c.mark) + '">'
            + '<input class="cat-name" type="text" aria-label="Name"'
            +   ' data-cat-name="' + esc(c.id) + '" value="' + esc(c.label) + '">'
            + '<div class="tone-pick">'
            +   TONE_ORDER.map((t) => '<button type="button" class="tone-dot' + (t === c.tone ? ' is-on' : '')
                    + '" style="--tone:var(' + TONES[t][0] + ')" title="' + t + '"'
                    + ' aria-label="' + t + '" data-cat-tone="' + esc(c.id) + ':' + t + '"></button>').join('')
            + '</div>'
            + '<span class="cat-use' + (used ? '' : ' is-idle') + '">'
            +   (used ? plural(used, 'entry', 'entries') : 'not used') + '</span>'
            + '<button type="button" class="row-x" data-drop-cat="' + esc(c.id) + '"'
            +   (c.locked ? ' disabled title="Filled from your trips, so it stays"' : ' title="Delete"')
            +   '><i class="bi bi-trash3"></i></button>'
            + '</div>';
    }).join(''));
}

/** The quick-entry form only offers categories a person can actually file
    something under — the system one fills itself. */
function fillCatSelect(selected) {
    const el = $('actCat');
    if (!el) return;
    const list = db.cats.filter((c) => !c.locked);
    el.innerHTML = list.map((c) => '<option value="' + esc(c.id) + '">' + esc(c.mark) + '  ' + esc(c.label) + '</option>').join('');
    el.value = list.some((c) => c.id === selected) ? selected : (list[0] ? list[0].id : '');
}

function addCat() {
    const taken = new Set(db.cats.map((c) => c.tone));
    const row = {
        id: newId('c'),
        label: 'New category',
        mark: '\u{1F516}',
        tone: TONE_ORDER.find((t) => !taken.has(t)) || 'slate',
    };
    db.cats.push(row);
    save();
    repaint();

    /* Straight into the name, because "New category" is a placeholder and
       everybody's next move is to replace it — but only when that list is
       what you are looking at. Pressed from the record form it is behind a
       folded card further down, and yanking the caret there mid-edit is
       worse than leaving it alone. */
    const list = $('catList');
    const box = list && list.offsetParent ? list.querySelector('.cat-row:last-child .cat-name') : null;
    if (box) { box.focus(); box.select(); }
    return row.id;
}

/* Deletes on the spot. Asking first was asking permission to do nothing in
   the common case — the category is usually empty — and in the other case
   the question was really "may I move these?", which is better answered by
   moving them and saying so, with the way back attached. */
function dropCat(id) {
    const cat = db.cats.find((c) => c.id === id);
    if (!cat || cat.locked) return;

    const orphans = db.events.filter((e) => e.cat === id);
    const moveTo = db.cats.find((c) => !c.locked && c.id !== id);

    /* The one case that cannot just happen: there is nowhere to put what is
       filed under it. Nothing is deleted and the toast says why. */
    if (orphans.length && !moveTo) {
        return toast('<b>' + esc(cat.label) + '</b> still holds '
            + plural(orphans.length, 'entry', 'entries')
            + ' and there is no other category to move them to. Add one first.');
    }

    const undo = {
        cat: Object.assign({}, cat),
        at: db.cats.indexOf(cat),
        moved: orphans.map((e) => e.id),
    };

    orphans.forEach((e) => { e.cat = moveTo.id; });
    db.cats = db.cats.filter((c) => c.id !== id);
    calOff.delete(id);
    save();
    repaint();

    toast('Deleted <b>' + esc(cat.label) + '</b>'
        + (orphans.length
            ? ' \u00b7 ' + plural(orphans.length, 'entry', 'entries')
                + ' moved to <b>' + esc(moveTo.label) + '</b>'
            : ''),
        { label: 'Undo', run: () => {
            db.cats.splice(undo.at, 0, undo.cat);
            undo.moved.forEach((eid) => {
                const e = db.events.find((x) => x.id === eid);
                if (e) e.cat = undo.cat.id;
            });
            save();
            repaint();
        } });
}

/* --------------------------------------------------------------------
   Sending it to a phone

   The browser can only show a reminder while this page is open, which is
   not what anybody means by "remind me". A phone's own calendar can do
   it properly — offline, locked, in your pocket — so the honest route is
   to hand the phone a file it already knows how to read.

   One .ics of everything, with a VALARM on every activity that has a
   reminder set. Times are written without a zone, so 7pm stays 7pm in
   whichever country you open it in. For a travel app that is the right
   answer, not a shortcut.
   -------------------------------------------------------------------- */
function icsText(v) {
    return String(v == null ? '' : v)
        .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

const icsDay = (iso) => iso.replace(/-/g, '');
const icsAt = (iso, hhmm) => icsDay(iso) + 'T' + hhmm.replace(':', '') + '00';

/** RFC 5545 wants lines under 75 octets, continued with a leading space. */
function icsFold(line) {
    if (line.length <= 74) return line;
    const parts = [line.slice(0, 74)];
    let rest = line.slice(74);
    while (rest.length > 73) { parts.push(' ' + rest.slice(0, 73)); rest = rest.slice(73); }
    if (rest) parts.push(' ' + rest);
    return parts.join('\r\n');
}

function buildIcs() {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PlanSphere//Travel//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];

    calItems().filter((it) => it.src !== 'holiday' && !it.rep).forEach((it) => {
        const cat = catOf(it.cat);
        lines.push('BEGIN:VEVENT');
        lines.push('UID:' + it.src + '-' + it.id + '@plansphere');
        lines.push('DTSTAMP:' + stamp);

        if (it.span) {
            lines.push('DTSTART;VALUE=DATE:' + icsDay(it.date));
            lines.push('DTEND;VALUE=DATE:' + icsDay(shiftDate(it.until, 1)));
        } else if (it.time) {
            lines.push('DTSTART:' + icsAt(it.date, it.time));
            lines.push('DTEND:' + icsAt(it.date, it.end || it.time));
        } else {
            lines.push('DTSTART;VALUE=DATE:' + icsDay(it.date));
            lines.push('DTEND;VALUE=DATE:' + icsDay(shiftDate(it.date, 1)));
        }

        /* A yearly entry is exported as one event with a rule on it, not as
           four copies — that is what a calendar app knows how to keep. */
        if (it.repeat === 'year') lines.push('RRULE:FREQ=YEARLY');

        lines.push('SUMMARY:' + icsText(cat.mark + ' ' + it.title));
        if (it.where) lines.push('LOCATION:' + icsText(it.where));
        if (it.note) lines.push('DESCRIPTION:' + icsText(it.note));
        lines.push('CATEGORIES:' + icsText(cat.label));

        if (it.src === 'event' && it.remind !== '' && it.remind != null && it.time) {
            lines.push('BEGIN:VALARM');
            lines.push('TRIGGER:-PT' + (Number(it.remind) || 0) + 'M');
            lines.push('ACTION:DISPLAY');
            lines.push('DESCRIPTION:' + icsText(it.title));
            lines.push('END:VALARM');
        }

        lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.map(icsFold).join('\r\n') + '\r\n';
}

function exportIcs() {
    const blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = 'plansphere-' + today() + '.ics';
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    /* A download is silent, and a file whose purpose is not obvious is a
       file nobody opens. Say what it is and what to do with it. */
    const alarms = db.events.filter((e) => e.remind !== '' && e.remind != null && e.time).length;
    toast('Saved <b>' + name + '</b> \u2014 a calendar file. Open it on your phone '
        + '(mail it to yourself, or AirDrop it) and your calendar app will import '
        + plural(calItems().filter((it) => it.src !== 'holiday' && !it.rep).length, 'entry', 'entries')
        + (alarms ? ' with ' + plural(alarms, 'reminder') : '') + '.');
}

/* --------------------------------------------------------------------
   Opening something
   -------------------------------------------------------------------- */
function openItem(key) {
    const it = findItem(key);
    if (!it) return;

    if (it.src === 'event') return openActEdit(it.id);

    if (it.src === 'holiday') {
        return toast('<b>' + esc(it.title) + '</b> \u00b7 ' + esc(it.where)
            + ' \u00b7 ' + fmtDay(it.date));
    }

    /* A stop or a booking belongs to a trip that may not be the one on the
       top bar. Switch to it first, or the module opens showing someone
       else's plan. */
    if (it.trip) return openTrip(it.trip, SOURCES[it.src].module);
    showModule(SOURCES[it.src].module);
}

/* --------------------------------------------------------------------
   The activity form
   -------------------------------------------------------------------- */
function saveAct() {
    const title = $('actTitle').value.trim();
    const date = $('actDate').value || today();
    if (!title) return $('actTitle').focus();

    const start = $('actTime').value;
    let end = $('actEnd').value;
    /* An activity that ends before it starts is a typo. Drop the end rather
       than storing a negative duration the grid would draw upside down. */
    if (start && end && minutesOf(end) <= minutesOf(start)) end = '';

    const row = {
        cat: $('actCat').value, title, date,
        time: start, end,
        where: $('actWhere').value.trim(),
        note: $('actNote').value.trim(),
        remind: $('actRemind').value,
        /* The date stored is still one date — the day it first falls on.
           Every year after is worked out from it when the calendar draws,
           so correcting the date corrects every year at once. */
        repeat: $('actRepeat').value === 'year' ? 'year' : '',
    };

    if (editAct) {
        Object.assign(db.events.find((e) => e.id === editAct), row);
        editAct = null;
    } else {
        row.id = newId('a');
        db.events.push(row);
    }

    save();
    clearActForm();
    repaint();
}

function blankActForm() {
    ['actTitle', 'actWhere', 'actNote', 'actTime', 'actEnd'].forEach((id) => { $(id).value = ''; });
    $('actDate').value = calCursor || today();
    fillCatSelect('personal');
    $('actRemind').value = '';
    $('actRepeat').value = '';
    actCatPicked(true);
}

/**
 * The category deciding the rest of the form.
 *
 * Birthdays are the one category where the defaults are known before
 * anything is typed: it happens every year, it has no clock, and what goes
 * in the What box is a person rather than an errand. So picking Birthday
 * fills those in — and leaves them editable, because a 30th somebody is
 * flying home for is still a birthday and still theirs to change.
 */
function actCatPicked(mayDefault) {
    const birthday = $('actCat').value === 'birthday';
    const rep = $('actRepeat');

    /* Only ever a default, never a correction: an entry already saved as a
       one-off keeps what it was saved as, however it is filed. */
    if (mayDefault && birthday && !rep.value) rep.value = 'year';
    $('actTitle').placeholder = birthday ? "Mum's birthday" : 'Dentist, 3pm';
}

function clearActForm() {
    editAct = null;
    blankActForm();
    set('actFormTitle', 'Add a calendar entry');
    set('actSaveLabel', 'Add entry');
    setCancelBtn('actCancel', false);
    const drop = $('actDrop');
    if (drop) drop.hidden = true;
    if ($('actGoogle')) $('actGoogle').hidden = true;
}

/* The form is on the Activities screen now, so editing something clicked on
   the Calendar is a page change first. Same move as clicking a stop or a
   booking makes — the screen that owns the record is the screen that edits
   it, and the calendar stays a view of everything rather than a second
   place to type. */
function openActEdit(id) {
    const e = db.events.find((x) => x.id === id);
    if (!e) return;
    if (live !== 'trips') showModule('trips');
    unfold('actForm');
    editAct = id;
    fillCatSelect(e.cat || 'personal');
    $('actDate').value = e.date || '';
    $('actTime').value = e.time || '';
    $('actEnd').value = e.end || '';
    $('actTitle').value = e.title || '';
    $('actWhere').value = e.where || '';
    $('actNote').value = e.note || '';
    $('actRemind').value = e.remind == null ? '' : String(e.remind);
    $('actRepeat').value = e.repeat === 'year' ? 'year' : '';
    actCatPicked(false);
    set('actFormTitle', 'Edit calendar entry');
    set('actSaveLabel', 'Save changes');
    setCancelBtn('actCancel', true);
    const drop = $('actDrop');
    if (drop) drop.hidden = false;
    if ($('actGoogle')) $('actGoogle').hidden = false;
    $('actTitle').focus();
    $('actTitle').scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* --------------------------------------------------------------------
   Drag to another day

   A date is a date wherever it is stored, so an activity, a stop and a
   booking all move the same way. A trip does not: it is a span, and
   dragging it would silently move every stop inside it.
   -------------------------------------------------------------------- */
function moveItem(key, date) {
    const [src, id] = key.split(':');
    const bag = { event: db.events, stop: db.stops, book: db.books }[src];
    if (!bag) return false;
    const row = bag.find((r) => r.id === id);
    if (!row) return false;

    /* Dragging one year of a repeat moves the day it falls on, not the year
       it started in — drop a birthday on the 14th and it is the 14th every
       year, including the ones behind us. */
    const to = row.repeat === 'year' && row.date
        ? row.date.slice(0, 4) + date.slice(4)
        : date;

    if (row.date === to) return false;
    row.date = to;
    save();
    return true;
}

/* --------------------------------------------------------------------
   Reminders

   Honest about what this can and cannot do: the browser will show a
   notification for an activity whose time has come while this page is
   open. A closed tab cannot remind anybody of anything without a service
   worker and a push server, and PlanSphere has neither.
   -------------------------------------------------------------------- */
const FIRED_KEY = 'plansphere.fired.v1';

function firedSet() {
    try { return new Set(JSON.parse(localStorage.getItem(FIRED_KEY) || '[]')); }
    catch (err) { return new Set(); }
}

function markFired(id) {
    const set_ = firedSet();
    set_.add(id);
    try { localStorage.setItem(FIRED_KEY, JSON.stringify([...set_].slice(-200))); }
    catch (err) { /* nothing to do — the reminder simply may repeat */ }
}

function paintRemindBtn() {
    const btn = $('calRemind');
    if (!btn) return;
    const ok = typeof Notification !== 'undefined' && Notification.permission === 'granted';
    const denied = typeof Notification !== 'undefined' && Notification.permission === 'denied';
    btn.querySelector('span').textContent = ok ? 'Reminders on' : denied ? 'Reminders blocked' : 'Reminders off';
    btn.querySelector('i').className = 'bi ' + (ok ? 'bi-bell-fill' : 'bi-bell');
    btn.disabled = denied;
}

function askReminders() {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then(paintRemindBtn);
}

function checkReminders() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const fired = firedSet();
    const now = new Date();

    db.events.forEach((e) => {
        if (e.remind === '' || e.remind == null || !e.date || !e.time) return;

        /* A yearly entry is due on this year's anniversary, and the note
           that it has already gone off is kept per year — otherwise the
           first birthday reminder would be the only one. */
        const on = e.repeat === 'year' ? anniversary(e.date, now.getFullYear()) : e.date;
        const tag = e.repeat === 'year' ? e.id + ':' + on.slice(0, 4) : e.id;
        if (fired.has(tag)) return;

        const at = asDate(on);
        if (!at) return;
        at.setHours(0, 0, 0, 0);
        at.setMinutes(minutesOf(e.time) - Number(e.remind));

        const late = now - at;
        /* Fire once, and only for something that came due in the last five
           minutes — reopening the app tomorrow should not replay yesterday. */
        if (late < 0 || late > 5 * 60 * 1000) return;

        try {
            new Notification(catOf(e.cat).mark + '  ' + e.title, {
                body: fmtDay(on) + ' · ' + fmtTime(e.time) + (e.where ? ' · ' + e.where : ''),
                tag: tag,
            });
        } catch (err) { /* blocked mid-session; nothing useful to do */ }
        markFired(tag);
    });
}

/** Back and forward mean different amounts in different views. */
function calStep(dir) {
    if (calView === 'month') calCursor = addMonths(calCursor, dir);
    else if (calView === 'week') calCursor = shiftDate(calCursor, dir * 7);
    else calCursor = shiftDate(calCursor, dir);
    renderCal();
}

/** The view can change from somewhere other than the switch — "+3 more"
    opens that day — so the switch is repainted from the state, not toggled. */
function syncViewSeg() {
    document.querySelectorAll('#calView button').forEach((b) => {
        b.classList.toggle('is-on', b.dataset.val === calView);
    });
}

/* --------------------------------------------------------------------
   Today's reference rate

   Fetched once a day and cached, because the other half of this app's job
   happens abroad on a bad connection. Two sources: the first gives an
   explicit "next update" stamp, the second is a CDN file that is hard to
   make unavailable. If both fail, nothing breaks — the field was always
   typed by hand and still is.

   What comes back is the **mid-market** rate: the midpoint between what
   banks buy and sell at, which no counter on any high street trades at.
   It is here to start you off, and to tell you whether the board in front
   of you is taking a fair margin or an unfair one. It is never presented
   as the rate you will get.
   -------------------------------------------------------------------- */
const FX_KEY = 'plansphere.fx.v1';

let fx = null;          /* { base, day, date, rates, at } */
let fxState = 'idle';   /* idle | loading | ok | fail */

function fxLoad() {
    try { fx = JSON.parse(localStorage.getItem(FX_KEY) || 'null'); }
    catch (err) { fx = null; }
}

function fxSave() {
    try { localStorage.setItem(FX_KEY, JSON.stringify(fx)); }
    catch (err) { /* a cache that cannot be written is still a working session */ }
}

/* One base, cached once, and every pair crossed out of it.

   The cache used to follow whichever base the Convert screen was set to,
   which meant changing the base threw away a perfectly good payload and
   asked the network for another — the exact moment you are least likely to
   have a network, standing in an airport switching from MYR to THB. One
   fetch covers 160-odd currencies, and a cross-rate is two divisions. */
const fxBase = () => homeCur();
const fxFresh = () => !!(fx && fx.day === today());

const FX_SOURCES = [
    {
        url: (base) => 'https://open.er-api.com/v6/latest/' + base,
        read: (j) => (j && j.result === 'success' && j.rates)
            ? { rates: j.rates, date: (j.time_last_update_utc || '').slice(5, 16) }
            : null,
    },
    {
        url: (base) => 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/' + base.toLowerCase() + '.json',
        read: (j, base) => {
            const key = base.toLowerCase();
            if (!j || !j[key]) return null;
            const rates = {};
            Object.keys(j[key]).forEach((c) => { rates[c.toUpperCase()] = j[key][c]; });
            return { rates, date: j.date };
        },
    },
];

async function fxFetch(base) {
    if (fxState === 'loading') return null;
    fxState = 'loading';
    paintFx();

    for (const source of FX_SOURCES) {
        try {
            const res = await fetch(source.url(base), { cache: 'no-store' });
            if (!res.ok) continue;
            const parsed = source.read(await res.json(), base);
            if (!parsed || !parsed.rates) continue;
            fx = { base, day: today(), date: parsed.date, rates: parsed.rates, at: Date.now() };
            fxSave();
            fxState = 'ok';
            paintFx();
            return fx;
        } catch (err) {
            /* try the next one; a blocked network is an expected state here */
        }
    }

    fxState = 'fail';
    paintFx();
    return null;
}

/** 1 base = N quote, from the cache, crossing through the cached base if
    the pair asked for is not the one that was fetched. */
function fxRate(base, quote) {
    if (base === quote) return 1;
    if (!fx || !fx.rates) return null;
    if (fx.base === base) return Number(fx.rates[quote]) || null;
    const from = Number(fx.rates[base]);
    const to = Number(fx.rates[quote]);
    return from > 0 && to > 0 ? to / from : null;
}

/** Enough digits to be useful, not so many that the field looks like noise. */
const fxTidy = (r) => Number(r.toPrecision(7));

function fxStamp() {
    if (!fx) return '';
    return fx.day === today() ? 'today' : 'saved ' + fmtDay(fx.day);
}

/* --------------------------------------------------------------------
   Painting the three places a reference rate shows up
   -------------------------------------------------------------------- */
function paintFx() {
    paintFxLine('convFx', convHome, convForeign, Number($('convRate').value));
    paintRateFx();

    const spin = (id) => {
        const btn = $(id);
        if (!btn) return;
        btn.classList.toggle('is-loading', fxState === 'loading');
        btn.disabled = fxState === 'loading';
    };
    ['convFetch', 'rateFetch'].forEach(spin);
}

function paintFxLine(id, base, quote, typed) {
    const el = $(id);
    if (!el) return;

    const mid = fxRate(base, quote);

    if (fxState === 'loading') {
        el.hidden = false;
        el.className = 'fx-line';
        el.innerHTML = '<span class="pip"></span><span>Asking for today\u2019s rate\u2026</span>';
        return;
    }

    if (mid === null) {
        el.hidden = fxState !== 'fail';
        el.className = 'fx-line is-fail';
        el.innerHTML = '<span class="pip"></span><span>No rate service reachable. '
            + 'Type the rate from the board \u2014 that was always the better number anyway.</span>';
        return;
    }

    const stale = fx.day !== today();
    el.hidden = false;
    el.className = 'fx-line ' + (stale ? 'is-stale' : 'is-live');

    let out = '<span class="pip"></span>'
        + '<span>Mid-market ' + fxStamp() + ': <b>1 ' + base + ' = '
        + fxTidy(mid).toLocaleString('en-MY', { maximumFractionDigits: 6 }) + ' ' + quote + '</b></span>'
        + '<span class="caveat">A changer keeps a margin, so you will be offered less than this.</span>';

    /* The comparison is the reason to fetch at all: it turns a number on a
       board into a number you can judge. Stated as a fact, not a verdict. */
    if (typed > 0) {
        const pct = (typed / mid - 1) * 100;
        if (Math.abs(pct) >= 0.05) {
            out += '<span class="fx-gap ' + (pct < 0 ? 'is-under' : 'is-over') + '">'
                + Math.abs(pct).toFixed(2) + '% ' + (pct < 0 ? 'below' : 'above') + ' mid-market</span>';
        } else {
            out += '<span class="fx-gap">level with mid-market</span>';
        }
    }

    el.innerHTML = out;
}

function paintRateFx() {
    const el = $('rateFx');
    if (!el) return;
    const t = trip();
    const home = (t && t.home) || 'MYR';

    if (fxState === 'loading') {
        el.hidden = false;
        el.className = 'fx-line';
        el.innerHTML = '<span class="pip"></span><span>Asking for today\u2019s rates\u2026</span>';
        return;
    }
    if (!fx) { el.hidden = true; return; }

    el.hidden = false;
    el.className = 'fx-line ' + (fx.day === today() ? 'is-live' : 'is-stale');
    el.innerHTML = '<span class="pip"></span><span>Mid-market rates ' + fxStamp() + ', against ' + home + '.</span>'
        + '<span class="caveat">Filling these uses the middle of the market. If you changed money at a counter, the rate you were given is the truer one.</span>';
}

/** Fill every foreign currency this trip uses, without touching one that
    already has a rate somebody typed on purpose. */
async function fillTripRates() {
    const t = trip();
    if (!t) return;
    const home = t.home || 'MYR';
    if (!fxFresh()) await fxFetch(fxBase());

    const used = currenciesUsed(t);
    t.rates = t.rates || {};
    let filled = 0;
    used.forEach((c) => {
        if (t.rates[c]) return;
        const r = fxRate(home, c);
        if (r) { t.rates[c] = fxTidy(r); filled++; }
    });

    if (filled) save();
    renderBudget();
    paintFx();
}

/* ====================================================================
   CONVERT

   A money changer's calculator.

   The rate is typed, because the number on the board in front of you is
   the rate you are actually getting. Today's mid-market rate is fetched
   as well, but only ever as a reference: it fills the field to save you
   the first guess, and it tells you how far the board has moved from the
   middle of the market. It is never presented as what you will be given.

   The module holds nothing else. What it can do is hand a rate to the
   trip, and from then on the rest of the app reads foreign amounts
   through it.
   ==================================================================== */
let convHome    = null;
let convForeign = 'VND';
let convDir     = 'out';     // out = spending home money, in = changing back

function renderConv() {
    if (!convHome) convHome = homeCur();
    if (convForeign === convHome) convForeign = convHome === 'VND' ? 'MYR' : 'VND';

    fillCurSelect($('convHome'), convHome);
    fillCurSelect($('convForeign'), convForeign);

    /* The rate is written one way round whichever way you are converting —
       that is how a board writes it, and re-quoting it upside down when the
       direction flips is how people end up dividing when they meant to
       multiply. */
    set('convRateFrom', '1 ' + convHome + '  =');
    set('convRateTo', convForeign);
    set('convAmountCur', convDir === 'out' ? convHome : convForeign);

    document.querySelectorAll('#convDir button').forEach((b) => {
        b.classList.toggle('is-on', b.dataset.val === convDir);
    });
    $('convDir').querySelector('[data-val="out"]').textContent = convHome + ' → ' + convForeign;
    $('convDir').querySelector('[data-val="in"]').textContent = convForeign + ' → ' + convHome;

    paintConvert();
    paintFx();

    /* Once a day, in the background, and only if the browser thinks it has a
       connection. A failure is silent: the field was always typed by hand. */
    if (!fxFresh() && fxState !== 'loading' && navigator.onLine !== false) fxFetch(fxBase());
}

function paintConvert() {
    const rate = Number($('convRate').value);
    const amount = Number($('convAmount').value);
    const from = convDir === 'out' ? convHome : convForeign;
    const to = convDir === 'out' ? convForeign : convHome;

    if (!(rate > 0)) {
        set('convResult', '—');
        set('convBack', 'Type the rate from the board, or take today\u2019s as a starting point.');
        set('convNote', '');
        html('convLadder', '');
        set('convLadderNote', '');
        paintFxLine('convFx', convHome, convForeign, 0);
        return paintSaveHint(null);
    }

    const outSen = convDir === 'out'
        ? Math.round(toSen(amount) * rate)
        : Math.round(toSen(amount) / rate);

    set('convResult', amount > 0 ? moneyIn(outSen, to) : '—');
    set('convNote', '1 ' + convHome + ' = ' + rate.toLocaleString('en-MY', { maximumFractionDigits: 6 }) + ' ' + convForeign);

    /* The rate the other way up: the one nobody can do in their head, and
       the one that tells you whether a price on a menu is expensive. It is a
       rate rather than an amount, so it keeps its decimals instead of being
       rounded to the currency's minor unit. */
    const inv = 1 / rate;
    const c = CUR[convHome];
    set('convBack', '1 ' + convForeign + ' = ' + c.pre
        + inv.toLocaleString('en-MY', { maximumFractionDigits: inv < 0.01 ? 8 : 6 }) + c.post);

    paintLadder(rate, from, to);
    paintSaveHint(rate);
    paintFxLine('convFx', convHome, convForeign, rate);
}

/** Standing at a counter holding a note, without typing anything. */
function paintLadder(rate, from, to) {
    const steps = CUR[from].dp === 0
        ? [10000, 20000, 50000, 100000, 200000, 500000, 1000000]
        : [10, 20, 50, 100, 200, 500, 1000];

    set('convLadderNote', from + ' → ' + to);
    html('convLadder',
        '<thead><tr><th>' + from + '</th><th>' + to + '</th></tr></thead><tbody>'
        + steps.map((n) => {
            const sen = toSen(n);
            const got = convDir === 'out' ? Math.round(sen * rate) : Math.round(sen / rate);
            return '<tr><td>' + moneyIn(sen, from) + '</td>'
                + '<td>' + moneyIn(got, to) + '</td></tr>';
        }).join('')
        + '</tbody>');
}

function paintSaveHint(rate) {
    const t = trip();
    const btn = $('convSaveRate');
    const ok = !!t && rate > 0 && convHome === (t.home || 'MYR') && convForeign !== convHome;
    btn.disabled = !ok;

    if (!t) return set('convSaveHint', 'Nothing open, so there is nothing to pin a rate to.');
    if (convHome !== (t.home || 'MYR')) {
        return set('convSaveHint', 'This trip counts in ' + (t.home || 'MYR')
            + '. Set the base to ' + (t.home || 'MYR') + ' to pin a rate it can use.');
    }
    const have = t.rates && t.rates[convForeign];
    set('convSaveHint', ok
        ? (have ? 'Replaces the ' + convForeign + ' rate this trip already uses (' + have + ').'
                : 'Every ' + convForeign + ' amount in this trip will then be counted at this rate.')
        : 'Type a rate first.');
}

/** The rate goes to the trip, and every foreign figure in the app re-reads. */
function pinRate() {
    const t = trip();
    const rate = Number($('convRate').value);
    if (!t || !(rate > 0) || convHome !== (t.home || 'MYR')) return;
    t.rates = t.rates || {};
    t.rates[convForeign] = rate;
    save();
    repaint();
}

/* ====================================================================
   WIRING

   One delegated listener on the page rather than a listener per row: the
   lists are rebuilt on every save, and handlers bound to rows that no
   longer exist are the classic way a rebuilt list stops responding.
   ==================================================================== */
/**
 * The records come out of IndexedDB asynchronously, so the first paint has
 * to wait for them — otherwise every screen renders empty for a frame and
 * the Drive offer announces that a whole plan is missing.
 *
 * `initSync` is the escape hatch for wherever IndexedDB does not exist:
 * there the app starts in the same tick it always did.
 */
function boot() {
    if (typeof PSStore === 'undefined') return start();
    if (PSStore.initSync(storeReport)) return start();
    PSStore.init(storeReport).then(start);
}

function start() {
    /* Before anything fills a form: every $('...').value below is writing
       through the accessor these put on the field. */
    upgradeDateFields();
    wireDatePop();
    foldInit();

    load();
    fxLoad();
    holLoad();
    loadNav();
    paintStamp();
    paintRecBar();
    paintCounts();
    calCursor = today();
    focusNext();
    clearTripForm();
    clearStopForm();
    clearBookForm();
    clearActForm();
    showModule(live);

    /* Once there is something worth keeping, ask the browser not to throw it
       away when the disk gets tight. Asked once, and never on an empty first
       visit — Firefox puts a prompt in front of this, and a prompt about
       nothing is how people learn to refuse them. */
    if (typeof PSStore !== 'undefined' && !psIsEmpty()) PSStore.persist();

    /* Drive's offer waits on this: until it fires, an empty store means
       "still loading", not "nothing here". */
    window.PSReady = true;
    document.dispatchEvent(new Event('plansphere:ready'));

    $('navToggle').addEventListener('click', toggleNav);
    $('navScrim').addEventListener('click', closeDrawer);
    window.addEventListener('resize', paintNav);

    /* A row in the sidebar means "take me to that screen", and the screen
       Activities means is the shelf. Pressing it from inside an open record
       was doing nothing at all — the record was already on Activities — so
       the way out was a Back button somewhere above a page you had scrolled
       down. Pressing the row you are already on now closes what is open in
       it, which is the only thing pressing it could sensibly mean. */
    $('tabs').addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-module]');
        if (!btn) return;
        openRec = false;
        showModule(btn.dataset.module);
        if (navIsDrawer()) closeDrawer();
    });


    /* ---- Calendar ---- */
    $('calPrev').addEventListener('click', () => calStep(-1));
    $('calNext').addEventListener('click', () => calStep(1));
    $('calToday').addEventListener('click', () => { calCursor = today(); renderCal(); });
    $('calSearch').addEventListener('input', (event) => { calQuery = event.target.value; renderCal(); });

    $('calView').addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-val]');
        if (!btn) return;
        calView = btn.dataset.val;
        syncViewSeg();
        renderCal();
    });

    /* Both parked: the buttons are commented out of index.html while the
       reminder story is decided. Bound only if present, so restoring the
       markup is all it takes to switch them back on. */
    if ($('calExport')) $('calExport').addEventListener('click', exportIcs);
    if ($('calRemind')) $('calRemind').addEventListener('click', askReminders);

    /* Rebuilt with the chips on every repaint, so the listener cannot be
       bound to the element itself. */
    document.addEventListener('change', (event) => {
        const pick = event.target.closest('#holCountry');
        if (!pick) return;
        db.homeCountry = pick.value;
        save();
        renderCal();
    });

    $('actGoogle').addEventListener('click', () => {
        const row = db.events.find((e) => e.id === editAct);
        if (row) window.open(googleUrl(row), '_blank', 'noopener');
    });
    $('catAdd').addEventListener('click', addCat);
    $('kindAdd').addEventListener('click', addStopKind);

    document.addEventListener('change', (event) => {
        const pick = event.target.closest('[data-kind-icon]');
        if (!pick) return;
        const k = db.stopKinds.find((r) => r.id === pick.dataset.kindIcon);
        if (!k) return;
        k.icon = pick.value;
        save();
        repaint();
    });

    document.addEventListener('input', (event) => {
        const name = event.target.closest('[data-cat-name]');
        const mark = event.target.closest('[data-cat-mark]');
        const el = name || mark;
        if (!el) return;
        const cat = db.cats.find((c) => c.id === (name ? el.dataset.catName : el.dataset.catMark));
        if (!cat) return;
        if (name) cat.label = el.value;
        else cat.mark = el.value || '\u{1F516}';
        save();
        /* Everything downstream re-reads; the row being typed in is left
           alone by the guard at the top of paintCats. */
        paintCatBar();
        fillCatSelect($('actCat').value);
        renderCal();
    });

    $('actCat').addEventListener('change', () => actCatPicked(true));
    $('actSave').addEventListener('click', saveAct);
    $('actClear').addEventListener('click', blankActForm);
    $('actCancel').addEventListener('click', clearActForm);

    $('actDrop').addEventListener('click', () => {
        const id = editAct;
        if (!id) return;
        const row = db.events.find((x) => x.id === id);
        ask('Delete this activity?', '"' + (row ? row.title : 'It') + '" comes off the calendar.', () => {
            db.events = db.events.filter((x) => x.id !== id);
            save();
            clearActForm();
            repaint();
        });
    });

    /* A reminder can only be shown while this page is open — see the note
       above checkReminders. Once a minute is often enough for a clock. */
    setInterval(checkReminders, 60000);
    checkReminders();

    /* ---- Drag a day's worth of plan onto another day ---- */
    document.addEventListener('dragstart', (event) => {
        const el = event.target.closest('[data-item][draggable="true"]');
        if (!el) return;
        event.dataTransfer.setData('text/plain', el.dataset.item);
        event.dataTransfer.effectAllowed = 'move';
        el.classList.add('is-dragging');
    });

    document.addEventListener('dragend', () => {
        document.querySelectorAll('.is-dragging').forEach((n) => n.classList.remove('is-dragging'));
        document.querySelectorAll('.is-drop').forEach((n) => n.classList.remove('is-drop'));
    });

    document.addEventListener('dragover', (event) => {
        if (!event.target.closest('[data-day]')) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    });

    document.addEventListener('dragenter', (event) => {
        const zone = event.target.closest('[data-day]');
        if (!zone) return;
        document.querySelectorAll('.is-drop').forEach((n) => n.classList.remove('is-drop'));
        zone.classList.add('is-drop');
    });

    document.addEventListener('drop', (event) => {
        const zone = event.target.closest('[data-day]');
        if (!zone) return;
        event.preventDefault();
        zone.classList.remove('is-drop');
        if (moveItem(event.dataTransfer.getData('text/plain'), zone.dataset.day)) repaint();
    });

    /* ---- Convert ---- */
    $('convDir').addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-val]');
        if (!btn) return;
        convDir = btn.dataset.val;
        renderConv();
    });

    $('convHome').addEventListener('change', (event) => { convHome = event.target.value; renderConv(); });
    $('convForeign').addEventListener('change', (event) => { convForeign = event.target.value; renderConv(); });

    /* Swapping is a swap of the two currencies, not of the direction: the
       rate stays quoted the way the board quotes it. */
    $('convSwap').addEventListener('click', () => {
        const held = convHome;
        convHome = convForeign;
        convForeign = held;
        $('convRate').value = '';
        renderConv();
    });

    ['convRate', 'convAmount'].forEach((id) => {
        $(id).addEventListener('input', renderConv);
    });

    $('convSaveRate').addEventListener('click', pinRate);

    $('convFetch').addEventListener('click', async () => {
        await fxFetch(fxBase());
        const mid = fxRate(convHome, convForeign);
        if (mid) {
            $('convRate').value = fxTidy(mid);
            }
        renderConv();
    });

    $('rateFetch').addEventListener('click', fillTripRates);

    /* A rate typed on the Budget screen goes straight into the trip. */
    document.addEventListener('input', (event) => {
        const box = event.target.closest('[data-rate]');
        if (!box) return;
        const t = trip();
        if (!t) return;
        t.rates = t.rates || {};
        const v = Number(box.value);
        if (v > 0) t.rates[box.dataset.rate] = v; else delete t.rates[box.dataset.rate];
        save();
        paintCounts();
        renderBudget();
    });

    /* ---- Module 02 ---- */
    $('tripSave').addEventListener('click', saveTrip);
    $('tripClear').addEventListener('click', blankTripForm);
    $('tripCancel').addEventListener('click', () => { clearTripForm(); });

    $('newOpen').addEventListener('click', (event) => {
        event.stopPropagation();
        toggleNewMenu($('newMenu').hidden);
    });

    $('newMenu').addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-new]');
        if (!btn) return;
        toggleNewMenu(false);
        openTripForm(btn.dataset.new, null);
    });

    /* A menu that stays open after you have looked away is a menu you have
       to remember to close. Escape and a click anywhere else both do it. */
    document.addEventListener('click', (event) => {
        if (!$('newMenu').hidden && !event.target.closest('.new-wrap')) toggleNewMenu(false);
    });

    $('tripFilter').addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-val]');
        if (!btn) return;
        tripFilter = btn.dataset.val;
        $('tripFilter').querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b === btn));
        renderTrips();
    });

    /* Adds a type to whichever list the open form is reading, and selects
       it — the reason anybody presses this is the record in front of them. */
    $('tripTypeAdd').addEventListener('click', () => {
        const id = addType(kinOf(newKind).scope);
        fillTypeSelect(kinOf(newKind).scope, id);
    });

    /* Adding a calendar from the form picks it as well as makes it: you
       pressed this because the one you wanted was not in the list. */
    $('tripCatAdd').addEventListener('click', () => {
        const id = addCat();
        fillTripCatSelect(id);
        $('tripCat').focus();
        toast('Added a calendar · name and colour it under <b>Categories</b> on this screen.');
    });

    $('tripCoverAdd').addEventListener('click', () => $('tripCoverFile').click());
    $('tripCoverDrop').addEventListener('click', () => { coverHeld = ''; paintCover(); });
    $('tripCoverFile').addEventListener('change', (event) => {
        takeCover(event.target.files && event.target.files[0]);
        /* Cleared so choosing the same file twice still fires a change. */
        event.target.value = '';
    });

    /* ---- Module 03 ---- */
    $('stopSave').addEventListener('click', saveStop);
    $('stopClear').addEventListener('click', blankStopForm);
    $('stopCancel').addEventListener('click', () => { clearStopForm(); });

    /* Start and end are the stored fact; duration is a way of typing the
       end. Whichever of the three was touched last decides the other two. */
    $('stopTime').addEventListener('input', paintStopClock);
    $('stopEnd').addEventListener('input', paintStopClock);
    $('stopMins').addEventListener('input', () => {
        const run = Number($('stopMins').value);
        if (!$('stopTime').value || !(run > 0)) return;
        $('stopEnd').value = timePlus($('stopTime').value, run);
        set('stopMinsPer', 'ends ' + fmtTime($('stopEnd').value));
    });

    $('stopActualSrc').addEventListener('change', () => {
        $('stopActualField').hidden = $('stopActualSrc').value !== 'typed';
        if (!$('stopActualField').hidden) $('stopActual').focus();
    });

    /* ---- Module 05 ---- */
    $('scanOpen').addEventListener('click', scanCamera);
    $('scanShoot').addEventListener('click', scanCapture);
    $('scanAgain').addEventListener('click', scanReset);
    $('scanPick').addEventListener('click', () => $('scanFileInput').click());
    $('scanFileInput').addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        /* Through the same reader as every other attachment, so a 12 MP
           photograph is a few hundred kilobytes before it is read. */
        if (file) readAtt(file, (att) => scanHold(att.data, att.name));
    });
    $('scanConfirm').addEventListener('click', scanToExpense);
    $('scanFile').addEventListener('click', scanToDoc);

    $('docClear').addEventListener('click', blankDocForm);
    $('docCancel').addEventListener('click', closeDocForm);
    $('docSave').addEventListener('click', saveDoc);

    /* A camera left running while you are on the Budget screen is a light
       on somebody's phone for no reason. */
    $('tabs').addEventListener('click', () => { if (live !== 'spend') scanStop(); });

    /* ---- Module 06 ---- */
    [['budgetTotal', 'budget'], ['budgetHead1', 'headBudget'], ['budgetDay', 'dayBudget']]
        .forEach(([id, key]) => {
            $(id).addEventListener('input', () => {
                const t = trip();
                if (!t) return;
                t[key] = toSen($(id).value);
                save();
                repaint();
            });
        });

    $('spendAdd').addEventListener('click', () => openSpendForm(null));
    $('spendClear').addEventListener('click', blankSpendForm);
    $('spendCancel').addEventListener('click', closeSpendForm);
    $('spendSave').addEventListener('click', saveSpend);
    $('peopleAdd').addEventListener('click', () => openPersonForm(null));
    $('personClear').addEventListener('click', blankPersonForm);
    $('personCancel').addEventListener('click', closePersonForm);
    $('personSave').addEventListener('click', savePerson);
    $('spendCatAdd').addEventListener('click', addSpendCat);

    $('spendSplit').addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-val]');
        if (!btn) return;
        spendSplit = btn.dataset.val;
        paintSplit();
    });

    /* Changing the amount can turn a valid exact split into a wrong one,
       so the hint is recomputed rather than left saying it was fine. */
    $('spendAmount').addEventListener('input', () => {
        if (spendSplit !== 'equal' && spendSplit !== 'items') paintSplit();
    });

    /* ---- the bill ----------------------------------------------------
       Adding, removing or reshaping a row rebuilds the rows; typing into
       one only repaints the figures around it, because a rebuild would
       take the caret out of the field being typed into. */
    $('spendAddShared').addEventListener('click', () => {
        spendBill.shared.push({ id: newId('bl'), label: '', amount: 0, off: '', out: [], byUnits: false, units: {} });
        paintBill();
    });

    $('spendAddPayment').addEventListener('click', () => {
        spendBill.payments.push({ id: newId('pay'), by: $('spendBy').value || spendWho[0] || '', label: '', amount: 0, items: [] });
        paintBill();
    });

    [['spendItemOff', 'itemDiscounts'], ['spendRound', 'round'],
     ['spendDelivery', 'delivery'], ['spendMultiPay', 'multiPay']].forEach((pair) => {
        $(pair[0]).addEventListener('change', () => {
            spendBill[pair[1]] = $(pair[0]).checked;
            paintBill();
        });
    });

    [['spendCharges', ''], ['spendDiscountUnit', 'discountUnit'], ['spendOffUnit', 'offUnit'],
     ['spendVoucherUnit', 'voucherUnit'], ['spendFeeSplit', 'feeSplit']].forEach((pair) => {
        $(pair[0]).addEventListener('click', (event) => {
            const btn = event.target.closest('button[data-val]');
            if (!btn) return;
            if (pair[1]) {
                spendBill[pair[1]] = btn.dataset.val;
            } else {
                const preset = CHARGE_PRESETS[btn.dataset.val];
                if (preset) { spendBill.service = preset.service; spendBill.tax = preset.tax; }
            }
            paintBill();
        });
    });

    /* Percentages are kept as typed — they are rates, not money. */
    [['spendService', 'service'], ['spendTax', 'tax'],
     ['spendDiscount', 'discount'], ['spendVoucher', 'voucher']].forEach((pair) => {
        $(pair[0]).addEventListener('input', () => {
            spendBill[pair[1]] = Number($(pair[0]).value) || 0;
            if (pair[1] === 'service' || pair[1] === 'tax') setSeg('spendCharges', chargePresetOf());
            paintBillSums();
        });
    });

    [['spendDeliveryFee', 'deliveryFee'], ['spendPlatformFee', 'platformFee']].forEach((pair) => {
        $(pair[0]).addEventListener('input', () => {
            spendBill[pair[1]] = toSen($(pair[0]).value);
            paintBillSums();
        });
    });

    /* Every figure on the bill wears the expense's own currency, and the
       person carrying whatever the tills do not account for is named in
       the hint under them — so both redraw when either changes. */
    $('spendCur').addEventListener('change', () => { if (spendSplit === 'items') paintBill(); });
    $('spendBy').addEventListener('change', () => { if (spendSplit === 'items') paintBillSums(); });

    $('spendReceiptAdd').addEventListener('click', () => $('spendReceiptFile').click());
    
    $('spendReceiptDrop').addEventListener('click', () => { receiptHeld = null; paintReceipt(); });
    $('spendReceiptFile').addEventListener('change', (event) => {
        readAtt(event.target.files && event.target.files[0], (att) => { receiptHeld = att; paintReceipt(); });
        event.target.value = '';
    });

    $('spendAttAdd').addEventListener('click', () => $('spendAttFile').click());
    $('spendAttFile').addEventListener('change', (event) => {
        [...(event.target.files || [])].forEach((file) => {
            readAtt(file, (att) => { spendAtts.push(att); paintSpendAtts(); });
        });
        event.target.value = '';
    });

    $('noteAdd').addEventListener('click', () => openNoteForm(null));
    $('noteClear').addEventListener('click', blankNoteForm);
    $('noteCancel').addEventListener('click', closeNoteForm);
    $('noteSave').addEventListener('click', saveNote);

    $('noteAttAdd').addEventListener('click', () => $('noteAttFile').click());
    $('noteAttFile').addEventListener('change', (event) => {
        /* Read one at a time and paint after each, so a slow file does not
           hold up the ones behind it. */
        [...(event.target.files || [])].forEach((file) => {
            readAtt(file, (att) => { noteAtts.push(att); paintNoteAtts(); });
        });
        event.target.value = '';
    });

    $('stopAttAdd').addEventListener('click', () => $('stopAttFile').click());
    $('stopAttDrop').addEventListener('click', () => { attHeld = null; paintAtt(); });
    $('stopAttFile').addEventListener('change', (event) => {
        takeAtt(event.target.files && event.target.files[0]);
        event.target.value = '';
    });

    $('bookSave').addEventListener('click', saveBook);
    $('bookClear').addEventListener('click', blankBookForm);
    $('bookCancel').addEventListener('click', () => { clearBookForm(); });
    $('packSave').addEventListener('click', savePack);
    $('packSeed').addEventListener('click', seedPack);
    $('packClear').addEventListener('click', blankPackForm);

    /* Enter in a text field means "add the thing this form is for". */
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && datePop) return closeDatePop();
        if (event.key === 'Escape' && !$('askBox').hidden) return closeAsk();
        if (event.key === 'Escape' && !$('dataBox').hidden) return closeData();
        if (event.key === 'Escape' && !$('newMenu').hidden) return toggleNewMenu(false);

        /* A card is a button, so it answers to the keys a button answers to. */
        const card = event.target.closest && event.target.closest('.trip-card');
        if (card && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            return card.click();
        }

        if (event.key !== 'Enter' || event.target.tagName === 'TEXTAREA') return;
        const form = event.target.closest('#module-cal, #module-trips, #module-plan, #module-book, #module-spend, #module-pack');
        if (!form || event.target.tagName !== 'INPUT') return;
        /* The type and category lists are on the same screens as the forms
           but are not part of them — Enter there means "done", not "add". */
        if (event.target.closest('#typeList, #catList, #kindList, #spendCatList, #spendParts, #budgetCats')) return event.target.blur();
        /* The card you are typing in decides, and the module only answers
           when the card does not — the Activities screen carries two forms
           now, so "the form on this screen" stopped being one thing. */
        const own = event.target.closest('.card');
        const btn = (own && SAVE_BTNS.find((id) => own.querySelector('#' + id)))
            || { 'module-trips': 'tripSave', 'module-plan': 'stopSave', 'module-book': 'bookSave', 'module-spend': 'spendSave', 'module-pack': 'packSave' }[form.id];
        if (btn) { event.preventDefault(); $(btn).click(); }
    });

    $('packReset').addEventListener('click', () => {
        ask('Untick everything?', 'The items stay on the list; only the ticks are cleared.', () => {
            mine(db.packs).forEach((p) => { p.done = false; });
            save();
            repaint();
        });
    });

    $('budgetTotal').addEventListener('input', (event) => {
        const t = trip();
        if (!t) return;
        t.budget = toSen(event.target.value);
        save();
        paintCounts();
        renderBudget();
    });

    $('saveStamp').addEventListener('click', openData);
    $('dataClose').addEventListener('click', closeData);
    $('dataBox').addEventListener('click', (event) => { if (event.target.id === 'dataBox') closeData(); });

    $('toolExport').addEventListener('click', exportAll);
    $('toolImport').addEventListener('click', () => $('toolFile').click());
    $('toolFile').addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        closeData();
        if (file) importAll(file);
        event.target.value = '';
    });

    document.addEventListener('click', (event) => {
        const doIt = event.target.closest('[data-toast-do]');
        if (doIt) {
            const id = doIt.dataset.toastDo;
            const row = TOASTS[id];
            dropToast(id);
            if (row && row.action) row.action.run();
            return;
        }
        const shut = event.target.closest('[data-toast-x]');
        if (shut) dropToast(shut.dataset.toastX);
    });

    $('askNo').addEventListener('click', closeAsk);
    $('askYes').addEventListener('click', () => {
        const then = askThen;
        closeAsk();
        if (then) then();
    });

    /* Which way the settlement is worked out. Stored on the trip, because it
       is a decision the group made about that trip rather than a preference
       about the app. */
    $('settleStyle').addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-val]');
        const t = trip();
        if (!btn || !t) return;
        t.settleStyle = btn.dataset.val === 'payer' ? 'payer' : 'net';
        save();
        repaint();
    });

    $('settleCopy').addEventListener('click', () => {
        const t = trip();
        if (!t) return toast('Open a trip first.');
        copyText(settleSummaryText(t), 'Settlement copied — ready to paste.');
    });

    /* The seg control on the Itinerary. It is the only one on the page, so
       it is wired directly rather than through a shared painter. */
    $('planFilter').addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-val]');
        if (!btn) return;
        planFilter = btn.dataset.val;
        $('planFilter').querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b === btn));
        renderPlan();
    });

    document.addEventListener('input', (event) => {
        const catBud = event.target.closest('[data-cat-budget]');
        if (catBud) {
            const t = trip();
            if (!t) return;
            t.catBudget = Object.assign({}, t.catBudget);
            const sen = toSen(catBud.value);
            if (sen) t.catBudget[catBud.dataset.catBudget] = sen;
            else delete t.catBudget[catBud.dataset.catBudget];
            save();
            /* Only the parts that read this figure redraw; the row itself is
               where the caret is, and paintBudgetCats leaves it alone. */
            return renderBudget();
        }

        const stPaid = event.target.closest('[data-settle-paid]');
        if (stPaid) {
            const [from, to] = stPaid.dataset.settlePaid.split(':');
            /* Typing a figure into a closed row reopens it: money handed over
               is the stronger claim, and it is the one somebody just made. */
            return settleWrite(trip(), from, to, { paid: toSen(stPaid.value), cancelled: false, waived: false });
        }

        /* The bill's own fields. Each writes into the draft and repaints
           the figures; none of them rebuilds the row it sits in. */
        const bLabel = event.target.closest('[data-bill-label]');
        if (bLabel) {
            const it = billItem(bLabel.dataset.billLabel);
            if (it) it.label = bLabel.value;
            return paintBillSums();
        }

        const bAmount = event.target.closest('[data-bill-amount]');
        if (bAmount) {
            const it = billItem(bAmount.dataset.billAmount);
            if (it) it.amount = toSen(bAmount.value);
            return paintBillSums();
        }

        const bOff = event.target.closest('[data-bill-off]');
        if (bOff) {
            const it = billItem(bOff.dataset.billOff);
            /* Kept as typed: the same field is a percentage or an amount
               depending on the unit beside it. */
            if (it) it.off = bOff.value;
            return paintBillSums();
        }

        const bUnit = event.target.closest('[data-bill-unit]');
        if (bUnit) {
            const cut = bUnit.dataset.billUnit.split(':');
            const it = billItem(cut[0]);
            if (it) {
                it.units = it.units || {};
                it.units[cut[1]] = bUnit.value;
            }
            return paintBillSums();
        }

        const bPayLabel = event.target.closest('[data-bill-pay-label]');
        if (bPayLabel) {
            const pay = spendBill.payments.find((p) => p.id === bPayLabel.dataset.billPayLabel);
            if (pay) pay.label = bPayLabel.value;
            return;
        }

        const bPayAmount = event.target.closest('[data-bill-pay-amount]');
        if (bPayAmount) {
            const pay = spendBill.payments.find((p) => p.id === bPayAmount.dataset.billPayAmount);
            if (pay) pay.amount = toSen(bPayAmount.value);
            return paintBillSums();
        }

        const part = event.target.closest('[data-part]');
        if (part) {
            spendParts[part.dataset.part] = part.value;
            /* Only the hint moves — rebuilding the rows would take the
               caret out of the field being typed in. */
            if (spendSplit !== 'equal') {
                const cur = $('spendCur').value || homeCur();
                const wrong = splitOff(toSen($('spendAmount').value), cur);
                const typed = spendWho.some((id) => Number(spendParts[id]) > 0);
                $('spendSplitHint').classList.toggle('is-wrong', !!wrong && typed);
                set('spendSplitHint', wrong || 'That adds up.');
            }
            return;
        }

        const scBox = event.target.closest('[data-sc-name], [data-sc-mark]');
        if (scBox) {
            const id = scBox.dataset.scName || scBox.dataset.scMark;
            const row = db.spendCats.find((c) => c.id === id);
            if (!row) return;
            if (scBox.dataset.scName) row.label = scBox.value;
            else row.mark = scBox.value;
            save();
            return renderSpend();
        }

        /* An activity type's name lands as it is typed too. The Show bar
           and every disc on the page read this label, so they redraw - and
           paintStopKinds() bails while the caret is in the row. */
        const kindBox = event.target.closest('[data-kind-name]');
        if (kindBox) {
            const k = db.stopKinds.find((r) => r.id === kindBox.dataset.kindName);
            if (!k) return;
            k.label = kindBox.value;
            save();
            return renderPlan();
        }

        /* Type names land as they are typed, like a category's does. */
        const box = event.target.closest('[data-type-name]');
        if (!box) return;
        const ty = typeOf(box.dataset.typeName);
        if (!ty) return;
        ty.label = box.value;
        save();
        /* The shelf reads these labels, so it redraws — but paintTypes()
           bails while the caret is in this field, so the row is left alone. */
        renderTrips();
    });

    document.addEventListener('change', (event) => {
        const payBy = event.target.closest('[data-bill-pay-by]');
        if (payBy) {
            const pay = spendBill.payments.find((p) => p.id === payBy.dataset.billPayBy);
            if (pay) pay.by = payBy.value;
            return paintBillSums();
        }

        const box = event.target.closest('[data-pack]');
        if (!box) return;
        const row = db.packs.find((p) => p.id === box.dataset.pack);
        if (!row) return;
        row.done = box.checked;
        save();
        repaint();
    });

    document.addEventListener('click', (event) => {
        const hit = (attr) => {
            const el = event.target.closest('[' + attr + ']');
            return el ? el.getAttribute(attr) : null;
        };

        const item = hit('data-item');
        if (item) return openItem(item);

        const day = hit('data-open-day');
        if (day) {
            calCursor = day;
            calView = 'day';
            syncViewSeg();
            return renderCal();
        }

        const tonePick = hit('data-cat-tone');
        if (tonePick) {
            const [id, t] = tonePick.split(':');
            const row = db.cats.find((c) => c.id === id);
            if (row) { row.tone = t; save(); repaint(); }
            return;
        }

        const dropC = hit('data-drop-cat');
        if (dropC) return dropCat(dropC);

        const kindTone = hit('data-kind-tone');
        if (kindTone) {
            const [id, t] = kindTone.split(':');
            const row = db.stopKinds.find((k) => k.id === id);
            if (row) { row.tone = t; save(); repaint(); }
            return;
        }

        const dropK = hit('data-drop-kind');
        if (dropK) return dropStopKind(dropK);

        const cat = hit('data-cat');
        if (cat) {
            if (calOff.has(cat)) calOff.delete(cat); else calOff.add(cat);
            return renderCal();
        }

        if (event.target.closest('#calTogglePast')) {
            calPast = !calPast;
            return renderCal();
        }

        /* Edit and Delete sit inside the card, and the whole card opens the
           record — so they are read first. Checked the other way round, the
           card's own handler would swallow both buttons. */
        const editT = hit('data-edit-trip');
        if (editT) return openTripEdit(editT);

        const dropT = hit('data-drop-trip');
        if (dropT) {
            const t = db.trips.find((x) => x.id === dropT);
            const kin = kinOf(t && t.kind);
            return ask('Delete this ' + kin.label.toLowerCase() + '?',
                '"' + (t ? t.name : 'It') + '" goes, and so do its stops, bookings, expenses, documents, notes and packing list.',
                () => {
                    db.trips = db.trips.filter((x) => x.id !== dropT);
                    ['stops', 'books', 'packs', 'notes', 'spend', 'docs', 'settle'].forEach((k) => { db[k] = db[k].filter((r) => r.trip !== dropT); });
                    /* Deleting the one that was open closes it rather than
                       sliding a different record in under the same heading —
                       six screens would quietly change what they were about. */
                    if (db.current === dropT) {
                        db.current = db.trips.length ? db.trips[0].id : null;
                        openRec = false;
                        subTab = 'plan';
                    }
                    save();
                    clearTripForm();
                    repaint();
                });
        }

        const addTy = hit('data-add-type');
        if (addTy) return addType(addTy);

        const dropTy = hit('data-drop-type');
        if (dropTy) return dropType(dropTy);

        const fold = event.target.closest('[data-fold-toggle]');
        if (fold) return foldSet(fold.dataset.foldToggle, !isShut(fold.dataset.foldToggle));

        /* The heading is a target too — a 16px chevron is a small thing to
           ask somebody to hit. Anything that is itself a control inside the
           head keeps its own click. */
        const head = event.target.closest('[data-fold] > .card-head');
        if (head && !event.target.closest('button, a, input, select, textarea')) {
            const key = head.parentElement.dataset.fold;
            return foldSet(key, !isShut(key));
        }

        if (hit('data-rec-back')) return closeRec();

        const sub = hit('data-sub');
        if (sub) {
            subTab = sub;
            return showModule('trips');
        }

        const open = hit('data-open-trip');
        if (open) return openTrip(open);

        const att = hit('data-open-att');
        if (att) return openAtt(att);

        const docFil = hit('data-doc-filter');
        if (docFil) {
            docFilter = docFil;
            return renderDocs();
        }

        const openD = hit('data-open-doc');
        if (openD) {
            const d = db.docs.find((r) => r.id === openD);
            return downloadAtt(d && d.file);
        }

        const editD = hit('data-edit-doc');
        if (editD) return openDocForm(editD);

        const dropD = hit('data-drop-doc');
        if (dropD) {
            const d = db.docs.find((r) => r.id === dropD);
            if (!d) return;
            const at = db.docs.indexOf(d);
            db.docs.splice(at, 1);
            if (editDoc === dropD) closeDocForm();
            save();
            repaint();
            return toast('Deleted <b>' + esc(d.title || 'that document') + '</b>', {
                label: 'Undo',
                run: () => { db.docs.splice(at, 0, d); save(); repaint(); },
            });
        }

        const stAll = hit('data-settle-all');
        if (stAll) {
            const t = trip();
            const [from, to] = stAll.split(':');
            const tr = settleTransfers(t).find((x) => x.from === from && x.to === to);
            const row = settleRow(t, from, to);
            /* The same button un-marks it, because the common mistake is
               pressing it on the wrong row. */
            const done = row && row.paid >= (tr ? tr.amount : 0);
            return settleWrite(t, from, to, { paid: done ? 0 : (tr ? tr.amount : 0), cancelled: false, waived: false });
        }

        const stOff = hit('data-settle-off');
        if (stOff) {
            const [from, to] = stOff.split(':');
            return settleWrite(trip(), from, to, { cancelled: true, waived: false });
        }

        /* Written off. Whatever was already handed over stays on the row —
           it really did change hands, and waiving is about the rest. */
        const stWaive = hit('data-settle-waive');
        if (stWaive) {
            const [from, to] = stWaive.split(':');
            return settleWrite(trip(), from, to, { waived: true, cancelled: false });
        }

        const stBack = hit('data-settle-back');
        if (stBack) {
            const [from, to] = stBack.split(':');
            return settleWrite(trip(), from, to, { cancelled: false, waived: false });
        }

        const who = hit('data-who');
        if (who) {
            if (spendWho.includes(who)) {
                spendWho = spendWho.filter((id) => id !== who);
                /* Somebody taken off the expense takes their lines with
                   them. Leaving them behind would put money on the bill
                   that nobody on it is carrying. */
                billDropPerson(who);
            } else {
                spendWho.push(who);
            }
            paintWhoPick();
            return paintSplit();
        }

        /* ---- the bill ---- */
        const bAdd = hit('data-bill-add');
        if (bAdd) {
            spendBill.items.push({ id: newId('bl'), who: bAdd, label: '', amount: 0, off: '' });
            paintBill();
            const rows = document.querySelectorAll('[data-bill-label]');
            const last = [...rows].filter((el) => spendBill.items.some((it) =>
                it.who === bAdd && it.id === el.dataset.billLabel)).pop();
            if (last) last.focus();
            return;
        }

        const bDrop = hit('data-bill-drop');
        if (bDrop) {
            spendBill.items = spendBill.items.filter((it) => it.id !== bDrop);
            spendBill.shared = spendBill.shared.filter((it) => it.id !== bDrop);
            /* A line that is gone cannot still be on somebody's till. */
            spendBill.payments.forEach((pay) => {
                pay.items = (pay.items || []).filter((id) => id !== bDrop);
            });
            return paintBill();
        }

        const bShare = hit('data-bill-share');
        if (bShare) {
            const cut = bShare.split(':');
            const it = billItem(cut[0]);
            if (!it) return;
            it.out = it.out || [];
            it.out = it.out.indexOf(cut[1]) > -1
                ? it.out.filter((id) => id !== cut[1])
                : it.out.concat(cut[1]);
            return paintBill();
        }

        const bPort = hit('data-bill-portions');
        if (bPort) {
            const it = billItem(bPort);
            if (it) it.byUnits = !it.byUnits;
            return paintBill();
        }

        const bLine = hit('data-bill-pay-line');
        if (bLine) {
            const cut = bLine.split(':');
            const pay = spendBill.payments.find((p) => p.id === cut[0]);
            if (!pay) return;
            pay.items = pay.items || [];
            pay.items = pay.items.indexOf(cut[1]) > -1
                ? pay.items.filter((id) => id !== cut[1])
                : pay.items.concat(cut[1]);
            return paintBill();
        }

        const bPayDrop = hit('data-bill-pay-drop');
        if (bPayDrop) {
            spendBill.payments = spendBill.payments.filter((p) => p.id !== bPayDrop);
            return paintBill();
        }

        const scFil = hit('data-sc-filter');
        if (scFil) {
            spendCatFilter = scFil;
            return renderSpend();
        }

        const editX = hit('data-edit-spend');
        if (editX) return openSpendForm(editX);

        const dropX = hit('data-drop-spend');
        if (dropX) {
            const x = db.spend.find((r) => r.id === dropX);
            if (!x) return;
            const at = db.spend.indexOf(x);
            const held = db.stops.filter((r) => r.from === x.id);
            const filed = db.docs.filter((r) => r.spend === x.id);
            db.spend.splice(at, 1);
            held.forEach((r) => { r.from = ''; });
            filed.forEach((r) => { r.spend = ''; });
            if (editSpend === dropX) closeSpendForm();
            save();
            repaint();
            /* The receipt and the split come back with it, so it does not ask. */
            return toast('Deleted <b>' + esc(x.merchant || 'that expense') + '</b>', {
                label: 'Undo',
                run: () => {
                    db.spend.splice(at, 0, x);
                    held.forEach((r) => { r.from = x.id; });
                    filed.forEach((r) => { r.spend = x.id; });
                    save();
                    repaint();
                },
            });
        }

        const xAtt = hit('data-spend-att');
        if (xAtt) {
            const [id, which] = xAtt.split(':');
            const x = db.spend.find((r) => r.id === id);
            if (!x) return;
            return downloadAtt(which === 'r' ? x.receipt : (x.atts || [])[Number(which)]);
        }

        const dropXAtt = hit('data-drop-spend-att');
        if (dropXAtt) {
            spendAtts.splice(Number(dropXAtt), 1);
            return paintSpendAtts();
        }

        const editPP = hit('data-edit-person');
        if (editPP) return openPersonForm(editPP);

        const dropPP = hit('data-drop-person');
        if (dropPP) return dropPerson(dropPP);

        const scTone = hit('data-sc-tone');
        if (scTone) {
            const [id, k] = scTone.split(':');
            const row = db.spendCats.find((c) => c.id === id);
            if (row) { row.tone = k; save(); repaint(); }
            return;
        }

        const dropSC = hit('data-drop-sc');
        if (dropSC) return dropSpendCat(dropSC);

        const noteFil = hit('data-note-filter');
        if (noteFil) {
            noteFilter = noteFil;
            return renderNotes();
        }

        const editN = hit('data-edit-note');
        if (editN) return openNoteForm(editN);

        const dropN = hit('data-drop-note');
        if (dropN) {
            const n = db.notes.find((x) => x.id === dropN);
            if (!n) return;
            const at = db.notes.indexOf(n);
            db.notes.splice(at, 1);
            if (editNote === dropN) closeNoteForm();
            save();
            repaint();
            /* A note is words and files, and both come straight back. */
            return toast('Deleted <b>' + esc(n.title || noteTypeOf(n.type).label + ' note') + '</b>', {
                label: 'Undo',
                run: () => { db.notes.splice(at, 0, n); save(); repaint(); },
            });
        }

        const nAtt = hit('data-note-att');
        if (nAtt) {
            const [id, i] = nAtt.split(':');
            const n = db.notes.find((x) => x.id === id);
            return downloadAtt(n && n.atts ? n.atts[Number(i)] : null);
        }

        const dropNAtt = hit('data-drop-note-att');
        if (dropNAtt) {
            noteAtts.splice(Number(dropNAtt), 1);
            return paintNoteAtts();
        }

        /* From a day on the Itinerary to the note pinned to it, which now
           lives a screen away — so the screen changes before the scroll,
           the same way clicking a stop on the Calendar comes here. */
        const goNote = hit('data-go-note');
        if (goNote) {
            if (live !== 'spend') showModule('spend');
            const card = $('note-' + goNote);
            if (!card) return;
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.remove('is-lit');
            /* Restarted rather than just added, so a second click flashes
               a card that is already lit. */
            void card.offsetWidth;
            card.classList.add('is-lit');
            return;
        }

        const editS = hit('data-edit-stop');
        if (editS) return openStopEdit(editS);

        const dropS = hit('data-drop-stop');
        if (dropS) {
            db.stops = db.stops.filter((s) => s.id !== dropS);
            save();
            return repaint();
        }

        const editB = hit('data-edit-book');
        if (editB) return openBookEdit(editB);

        const dropB = hit('data-drop-book');
        if (dropB) {
            db.books = db.books.filter((b) => b.id !== dropB);
            save();
            return repaint();
        }

        const dropP = hit('data-drop-pack');
        if (dropP) {
            db.packs = db.packs.filter((p) => p.id !== dropP);
            save();
            return repaint();
        }
    });
}

document.addEventListener('DOMContentLoaded', boot);
