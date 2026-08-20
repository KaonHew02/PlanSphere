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

function money(sen, opts) {
    const round = opts && opts.round;
    const value = fromSen(sen);
    const text = round
        ? Math.round(value).toLocaleString('en-MY')
        : value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return 'RM ' + text;
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

function today() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + String(d.getDate()).padStart(2, '0');
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
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + String(d.getDate()).padStart(2, '0');
}

function fmtDay(iso) {
    const d = asDate(iso);
    if (!d) return '—';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtRange(from, to) {
    if (!from || !to) return '—';
    const a = asDate(from);
    const b = asDate(to);
    if (!a || !b) return '—';
    const sameYear = a.getFullYear() === b.getFullYear();
    const left = a.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric' });
    const right = b.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return left + ' – ' + right;
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
const KINDS = {
    travel: { label: 'Travel',    icon: 'bi-airplane-fill',  cls: 'travel' },
    stay:   { label: 'Stay',      icon: 'bi-building-fill',  cls: 'stay' },
    food:   { label: 'Food',      icon: 'bi-cup-hot-fill',   cls: 'food' },
    do:     { label: 'Activity',  icon: 'bi-camera-fill',    cls: 'do' },
    shop:   { label: 'Shopping',  icon: 'bi-bag-fill',       cls: 'shop' },
    other:  { label: 'Other',     icon: 'bi-three-dots',     cls: 'other' },
};

const KIND_ORDER = ['travel', 'stay', 'food', 'do', 'shop', 'other'];
const kindOf = (k) => KINDS[k] || KINDS.other;

const STATUS = {
    idea: { label: 'Idea', tag: 'is-amber' },
    held: { label: 'Held', tag: 'is-azure' },
    paid: { label: 'Paid', tag: 'is-green' },
};

function disc(kind, small) {
    const k = kindOf(kind);
    return '<span class="disc k-' + k.cls + (small ? ' is-sm' : '') + '"><i class="bi ' + k.icon + '"></i></span>';
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
const KEY = 'plansphere.v1';

let db = { trips: [], stops: [], books: [], packs: [], current: null, saved: null };

function load() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            db = Object.assign(db, parsed);
        }
    } catch (err) {
        /* A corrupt or unavailable store is not a crash — the session
           simply starts empty and the next save repairs it. */
    }
    ['trips', 'stops', 'books', 'packs'].forEach((k) => {
        if (!Array.isArray(db[k])) db[k] = [];
    });
    const fresh = !db.trips.length;
    if (fresh) seed();
    if (!db.trips.some((t) => t.id === db.current)) db.current = db.trips.length ? db.trips[0].id : null;

    /* Write the seed straight back out. Without this it lives in memory
       only, so every reload rebuilds it against a new `today()` — the demo
       trip would quietly move, and its ids with it, until the first edit
       happened to save something. */
    if (fresh) save();
}

function save() {
    db.saved = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (err) { /* storage full or blocked — the session still works */ }
    paintStamp();
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

/* --------------------------------------------------------------------
   A first run with nothing in it is a worse introduction than a trip you
   can take apart. This one is the trip the identity sheet was drawn
   against, so the app and the brand tell the same story.
   -------------------------------------------------------------------- */
function seed() {
    const from = shiftDate(today(), 24);
    const id = newId('t');

    db.trips = [{
        id, name: 'Kyoto & Osaka', where: 'Japan',
        from, to: shiftDate(from, 10), who: 2, budget: toSen(12000),
    }];
    db.current = id;

    const day = (n) => shiftDate(from, n);

    db.stops = [
        { id: newId('s'), trip: id, date: day(0),  time: '23:55', kind: 'travel', title: 'MH052 Kuala Lumpur → Osaka', where: 'KLIA Terminal 1', cost: 0 },
        { id: newId('s'), trip: id, date: day(1),  time: '07:20', kind: 'travel', title: 'Haruka express to Kyoto',    where: 'Kansai Airport Station', cost: toSen(120) },
        { id: newId('s'), trip: id, date: day(1),  time: '14:00', kind: 'stay',   title: 'Check in, Gion',             where: 'Higashiyama Ward', cost: 0 },
        { id: newId('s'), trip: id, date: day(1),  time: '19:00', kind: 'food',   title: 'Nishiki Market, standing dinner', where: '', cost: toSen(90) },
        { id: newId('s'), trip: id, date: day(2),  time: '06:30', kind: 'do',     title: 'Fushimi Inari at first light', where: '68 Fukakusa Yabunouchicho', cost: 0 },
        { id: newId('s'), trip: id, date: day(2),  time: '13:00', kind: 'do',     title: 'Arashiyama bamboo grove',    where: 'Ukyo Ward', cost: 0 },
        { id: newId('s'), trip: id, date: day(3),  time: '',      kind: 'do',     title: 'Philosopher’s Path, north to south', where: 'Sakyo Ward', cost: 0 },
        { id: newId('s'), trip: id, date: day(4),  time: '09:40', kind: 'travel', title: 'Kyoto → Osaka, Special Rapid', where: 'Kyoto Station', cost: toSen(28) },
        { id: newId('s'), trip: id, date: day(4),  time: '20:00', kind: 'food',   title: 'Dotonbori, whatever is queueing', where: 'Namba', cost: toSen(140) },
        { id: newId('s'), trip: id, date: day(10), time: '10:15', kind: 'travel', title: 'MH053 Osaka → Kuala Lumpur', where: 'Kansai International', cost: 0 },
    ];

    db.books = [
        { id: newId('b'), trip: id, kind: 'travel', date: day(0),  status: 'paid', cost: toSen(3180), title: 'MH052 / MH053 return', who: 'Malaysia Airlines', ref: 'QK4T2P' },
        { id: newId('b'), trip: id, kind: 'stay',   date: day(1),  status: 'paid', cost: toSen(2640), title: 'Machiya townhouse, 3 nights', who: 'Direct', ref: 'GION-114' },
        { id: newId('b'), trip: id, kind: 'stay',   date: day(4),  status: 'held', cost: toSen(1980), title: 'Namba hotel, 6 nights', who: 'Booking', ref: '' },
        { id: newId('b'), trip: id, kind: 'do',     date: day(6),  status: 'idea', cost: toSen(420),  title: 'Osaka Castle & museum passes', who: '', ref: '' },
    ];

    const pack = (group, item, qty) => ({ id: newId('p'), trip: id, group, item, qty, done: false });
    db.packs = [
        pack('Documents', 'Passport', 2), pack('Documents', 'Visit Japan Web QR', 2),
        pack('Documents', 'Travel insurance', 1),
        pack('Money', 'Yen cash', 1), pack('Money', 'Second card', 1),
        pack('Tech', 'Type-A plug adapter', 2), pack('Tech', 'Power bank', 1),
        pack('Clothes', 'Walking shoes', 2), pack('Clothes', 'Rain shell', 2),
    ];
    db.packs[0].done = true;
    db.packs[3].done = true;
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
const MODULES = {
    dash:   renderDash,
    trips:  renderTrips,
    plan:   renderPlan,
    book:   renderBook,
    budget: renderBudget,
    pack:   renderPack,
};

let live = 'dash';

function showModule(key) {
    if (!MODULES[key]) return;
    live = key;

    Object.keys(MODULES).forEach((id) => {
        const section = $('module-' + id);
        if (section) section.hidden = id !== key;
    });

    document.querySelectorAll('#tabs button').forEach((btn) => {
        btn.classList.toggle('is-on', btn.dataset.module === key);
    });

    MODULES[key]();
}

/** Whatever is on screen, plus the two things that are always on screen. */
function repaint() {
    paintTripPick();
    paintCounts();
    MODULES[live]();
}

function paintTripPick() {
    const pick = $('tripPick');
    if (!pick) return;
    pick.innerHTML = db.trips.length
        ? db.trips.map((t) => '<option value="' + esc(t.id) + '">' + esc(t.name || 'Untitled trip') + '</option>').join('')
        : '<option value="">No trips yet</option>';
    if (db.current) pick.value = db.current;
}

/** A count on a nav row, hidden rather than zeroed — a 0 is furniture. */
function paintCounts() {
    const rows = [
        ['countTrips', db.trips.length],
        ['countStops', mine(db.stops).length],
        ['countBookings', mine(db.books).length],
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
   DASHBOARD
   ==================================================================== */
/** What a trip costs so far, split into what is committed and what is not. */
function tally(t) {
    if (!t) return { paid: 0, held: 0, idea: 0, stops: 0, budget: 0 };
    const books = mine(db.books);
    const sum = (status) => books.filter((b) => b.status === status).reduce((n, b) => n + (b.cost || 0), 0);
    return {
        paid: sum('paid'),
        held: sum('held'),
        idea: sum('idea'),
        stops: mine(db.stops).reduce((n, s) => n + (s.cost || 0), 0),
        budget: t.budget || 0,
    };
}

function renderDash() {
    const t = trip();

    if (!t) {
        set('dashTripName', 'No trip yet');
        set('dashRange', '—');
        set('dashLabel', 'Nothing planned');
        set('dashCount', '—');
        set('dashFoot', 'Add a trip and every other screen wakes up.');
        set('dashStops', '0');
        set('dashStopsFoot', '—');
        set('dashLeft', 'RM 0');
        set('dashLeftFoot', '—');
        ['dashNext', 'dashHold', 'dashSpend', 'dashPack', 'dashFigures'].forEach((id) => {
            html(id, emptyState('bi-compass', 'No trip selected', 'Open Trips and add one — it takes four fields.'));
        });
        return;
    }

    const now = today();
    const out = daysBetween(now, t.from);
    const back = daysBetween(now, t.to);
    const length = daysBetween(t.from, t.to);
    const sums = tally(t);
    const spent = sums.paid + sums.stops;

    set('dashTripName', t.name || 'Untitled trip');
    set('dashRange', fmtRange(t.from, t.to));

    /* Three states, three headlines. The middle one is the one people open
       the app for while they are actually away. */
    if (out !== null && out > 0) {
        set('dashLabel', 'Departs in');
        set('dashCount', plural(out, 'day'));
        set('dashFoot', (t.where ? t.where + ' · ' : '')
            + (length !== null ? plural(length + 1, 'day') + ' on the road' : ''));
    } else if (back !== null && back >= 0) {
        const dayN = daysBetween(t.from, now) + 1;
        set('dashLabel', 'On the road');
        set('dashCount', 'Day ' + dayN + ' of ' + (length + 1));
        set('dashFoot', plural(back, 'day') + ' left · ' + (t.where || ''));
    } else {
        set('dashLabel', 'Home');
        set('dashCount', back === null ? '—' : plural(Math.abs(back), 'day') + ' ago');
        set('dashFoot', 'This trip is done. The plan stays for the next one.');
    }

    const stops = mine(db.stops);
    set('dashStops', String(stops.length));
    const dayCount = new Set(stops.map((s) => s.date)).size;
    set('dashStopsFoot', stops.length
        ? plural(dayCount, 'day') + ' with something in it'
        : 'Nothing on the itinerary yet');

    const left = sums.budget - spent;
    set('dashLeft', money(left, { round: true }));
    set('dashLeftFoot', sums.budget
        ? money(spent, { round: true }) + ' of ' + money(sums.budget, { round: true }) + ' committed'
        : 'No budget set');

    paintNext(stops, now);
    paintHold();
    paintSpend(sums, spent);
    paintPackSummary();
    paintFigures(t, sums, spent, length);
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
        +     (s.cost ? '<b>' + money(s.cost) + '</b>' : '<span class="is-muted">—</span>')
        +   '</div></div>'
        + '</div>').join(''));
}

/** Anything still held or still an idea — the list that costs money later. */
function paintHold() {
    const open = mine(db.books)
        .filter((b) => b.status !== 'paid')
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    const owing = open.reduce((n, b) => n + (b.cost || 0), 0);
    set('dashHoldNote', open.length ? money(owing, { round: true }) + ' still to pay' : '');

    if (!open.length) {
        return html('dashHold', emptyState('bi-check2-circle',
            'Everything is paid', 'No bookings are sitting on hold.'));
    }

    html('dashHold', open.map((b) => {
        const st = STATUS[b.status] || STATUS.idea;
        return ''
        + '<div class="line-row">'
        +   disc(b.kind)
        +   '<div class="line-meta"><div class="line-name">' + esc(b.title) + '</div>'
        +     '<small class="line-sub">' + (b.who ? esc(b.who) + ' · ' : '') + fmtDay(b.date) + '</small></div>'
        +   '<div class="line-figures"><div class="line-figure">'
        +     '<span class="tag ' + st.tag + '">' + st.label + '</span><b>' + money(b.cost) + '</b>'
        +   '</div></div>'
        + '</div>';
    }).join(''));
}

/** The budget as one bar, split by kind, with the leftover left visible. */
function paintSpend(sums, spent) {
    const rows = spendByKind();
    const total = rows.reduce((n, r) => n + r.sen, 0);

    if (!total) {
        set('dashSpendNote', '');
        return html('dashSpend', emptyState('bi-pie-chart',
            'Nothing spent yet', 'Costs come from paid bookings and from stops that carry a price.'));
    }

    const budget = sums.budget;
    const over = budget && spent > budget;
    set('dashSpendNote', budget
        ? (over ? money(spent - budget, { round: true }) + ' over' : money(budget - spent, { round: true }) + ' left')
        : money(total, { round: true }) + ' committed');

    /* The bar is drawn against the budget where there is one, so the empty
       part of the track is the money still unspent rather than dead space.
       Without a budget it is drawn against itself and reads as a split. */
    const scale = budget && !over ? budget : total;

    html('dashSpend', ''
        + '<div class="dist">'
        +   rows.map((r) => '<i class="c-' + kindOf(r.kind).cls + '" style="width:'
                + (r.sen / scale * 100).toFixed(2) + '%"></i>').join('')
        + '</div>'
        + '<div class="legend">'
        +   rows.map((r) => '<span class="legend-item"><span class="dot c-' + kindOf(r.kind).cls + '"></span>'
                + kindOf(r.kind).label + ' <b>' + money(r.sen, { round: true }) + '</b></span>').join('')
        +   (budget && !over
                ? '<span class="legend-item"><span class="dot" style="background:var(--track-2)"></span>'
                    + 'Unspent <b>' + money(budget - spent, { round: true }) + '</b></span>'
                : '')
        + '</div>');
}

function paintPackSummary() {
    const items = mine(db.packs);
    const done = items.filter((p) => p.done).length;

    if (!items.length) {
        set('dashPackNote', '');
        return html('dashPack', emptyState('bi-bag',
            'Nothing on the list', 'Packing can start from a standard list in one click.'));
    }

    const pct = Math.round(done / items.length * 100);
    set('dashPackNote', done + ' of ' + items.length);

    const groups = groupBy(items, (p) => p.group || 'Other');
    html('dashPack', ''
        + '<div class="prog"><i class="' + (done === items.length ? 'is-done' : '') + '" style="width:' + pct + '%"></i></div>'
        + '<div class="legend">'
        +   Object.keys(groups).map((g) => {
                const list = groups[g];
                const n = list.filter((p) => p.done).length;
                return '<span class="legend-item">' + esc(g) + ' <b>' + n + '/' + list.length + '</b></span>';
            }).join('')
        + '</div>');
}

function paintFigures(t, sums, spent, length) {
    const heads = Math.max(1, Number(t.who) || 1);
    const days = (length === null ? 0 : length + 1);

    html('dashFigures', ''
        + '<div class="tally" style="margin-top:0;border-top:0;padding-top:0">'
        +   cell('Days', days ? String(days) : '—')
        +   cell('Travellers', String(heads))
        +   cell('Bookings', String(mine(db.books).length))
        +   cell('Stops', String(mine(db.stops).length))
        + '</div>'
        + '<div class="tally" style="border-top:0">'
        +   cell('Paid', money(sums.paid, { round: true }))
        +   cell('On hold', money(sums.held, { round: true }))
        +   cell('Per head', money(Math.round(spent / heads), { round: true }))
        +   cell('Per day', days ? money(Math.round(spent / days), { round: true }) : '—', true)
        + '</div>');
}

function cell(label, value, strong) {
    return '<div class="tally-cell' + (strong ? ' is-total' : '') + '">'
        + '<span>' + esc(label) + '</span><b>' + esc(value) + '</b></div>';
}

/** Paid bookings plus priced stops, added up by kind. */
function spendByKind() {
    const bag = {};
    mine(db.books).filter((b) => b.status === 'paid').forEach((b) => {
        bag[b.kind] = (bag[b.kind] || 0) + (b.cost || 0);
    });
    mine(db.stops).forEach((s) => {
        if (s.cost) bag[s.kind] = (bag[s.kind] || 0) + s.cost;
    });
    return KIND_ORDER.filter((k) => bag[k]).map((k) => ({ kind: k, sen: bag[k] }));
}

function groupBy(list, keyOf) {
    return list.reduce((bag, row) => {
        const k = keyOf(row);
        (bag[k] = bag[k] || []).push(row);
        return bag;
    }, {});
}

/* ====================================================================
   TRIPS
   ==================================================================== */
let editTrip = null;

function renderTrips() {
    set('tripsNote', db.trips.length ? plural(db.trips.length, 'trip') : '');

    if (!db.trips.length) {
        return html('tripsList', emptyState('bi-suitcase',
            'No trips yet', 'A name and two dates is enough to start.'));
    }

    const now = today();
    const rows = db.trips.map((t) => {
        const spent = spendOf(t.id);
        const out = daysBetween(now, t.from);
        const back = daysBetween(now, t.to);

        let state = '<span class="tag">Draft</span>';
        if (t.from && t.to) {
            if (out > 0) state = '<span class="tag is-azure">In ' + out + 'd</span>';
            else if (back >= 0) state = '<span class="tag is-node">On the road</span>';
            else state = '<span class="tag">Done</span>';
        }

        return '<tr' + (t.id === db.current ? ' class="is-current"' : '') + '>'
            + '<td><strong>' + esc(t.name || 'Untitled trip') + '</strong>'
            +   '<small>' + esc(t.where || '—') + '</small></td>'
            + '<td>' + (t.from ? fmtRange(t.from, t.to) : '—') + '</td>'
            + '<td>' + state + '</td>'
            + '<td class="is-strong">' + money(t.budget, { round: true }) + '</td>'
            + '<td>' + money(spent, { round: true }) + '</td>'
            + '<td class="row-actions">'
            +   '<button type="button" class="row-x is-edit" data-open-trip="' + esc(t.id) + '" title="Open"><i class="bi bi-box-arrow-in-right"></i></button>'
            +   '<button type="button" class="row-x is-edit" data-edit-trip="' + esc(t.id) + '" title="Edit"><i class="bi bi-pencil"></i></button>'
            +   '<button type="button" class="row-x" data-drop-trip="' + esc(t.id) + '" title="Delete"><i class="bi bi-trash3"></i></button>'
            + '</td></tr>';
    }).join('');

    html('tripsList', ''
        + '<div class="table-wrap"><table class="data-table">'
        + '<thead><tr><th>Trip</th><th>Dates</th><th>State</th><th>Budget</th><th>Committed</th><th></th></tr></thead>'
        + '<tbody>' + rows + '</tbody></table></div>');
}

/** The committed total for a trip that is not the one on screen. */
function spendOf(tripId) {
    const paid = db.books.filter((b) => b.trip === tripId && b.status === 'paid')
        .reduce((n, b) => n + (b.cost || 0), 0);
    const stops = db.stops.filter((s) => s.trip === tripId)
        .reduce((n, s) => n + (s.cost || 0), 0);
    return paid + stops;
}

function saveTrip() {
    const name = $('tripName').value.trim();
    const from = $('tripFrom').value;
    const to = $('tripTo').value;

    if (!name) return $('tripName').focus();
    /* A trip that comes back before it leaves is a typo, not a plan. */
    if (from && to && to < from) {
        $('tripTo').value = from;
        return $('tripTo').focus();
    }

    const row = {
        name,
        where: $('tripWhere').value.trim(),
        from, to,
        who: Number($('tripWho').value) || 1,
        budget: toSen($('tripBudget').value),
    };

    if (editTrip) {
        Object.assign(db.trips.find((t) => t.id === editTrip), row);
        editTrip = null;
    } else {
        row.id = newId('t');
        db.trips.push(row);
        db.current = row.id;
    }

    save();
    clearTripForm();
    repaint();
}

function clearTripForm() {
    editTrip = null;
    ['tripName', 'tripWhere', 'tripFrom', 'tripTo', 'tripWho', 'tripBudget'].forEach((id) => { $(id).value = ''; });
    set('tripFormTitle', 'Add a trip');
    set('tripSaveLabel', 'Add trip');
    $('tripCancel').hidden = true;
}

function openTripEdit(id) {
    const t = db.trips.find((x) => x.id === id);
    if (!t) return;
    editTrip = id;
    $('tripName').value = t.name || '';
    $('tripWhere').value = t.where || '';
    $('tripFrom').value = t.from || '';
    $('tripTo').value = t.to || '';
    $('tripWho').value = t.who || '';
    $('tripBudget').value = t.budget ? fromSen(t.budget) : '';
    set('tripFormTitle', 'Edit trip');
    set('tripSaveLabel', 'Save changes');
    $('tripCancel').hidden = false;
    $('tripName').focus();
}

/* ====================================================================
   ITINERARY
   ==================================================================== */
let editStop = null;
let planFilter = 'all';

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
        return html('planDays', emptyState('bi-calendar2-week', 'No trip selected', 'Add a trip first — the days come from its dates.'));
    }

    const all = mine(db.stops);
    const stops = planFilter === 'all' ? all : all.filter((s) => s.kind === planFilter);
    set('planNote', plural(stops.length, 'stop') + (planFilter === 'all' ? '' : ' · ' + kindOf(planFilter).label));

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
    days.sort();

    if (!days.length) {
        return html('planDays', emptyState('bi-calendar2-week', 'No days yet', 'Give the trip a start and an end date and the days appear here.'));
    }

    const now = today();
    html('planDays', days.map((date, i) => {
        const list = stops.filter((s) => s.date === date).sort(sortStops);
        const cost = list.reduce((n, s) => n + (s.cost || 0), 0);
        const inRange = t.from && date >= t.from && date <= t.to;
        const n = inRange ? daysBetween(t.from, date) + 1 : null;

        return '<div class="day' + (date === now ? ' is-now' : '') + '">'
            + '<div class="day-head">'
            +   '<span class="day-n">' + (n ? 'Day ' + n : 'Extra') + '</span>'
            +   '<span class="day-date">' + fmtDay(date) + '</span>'
            +   '<span class="day-meta">' + (list.length ? plural(list.length, 'stop') : 'Open')
            +     (cost ? ' · <b>' + money(cost) + '</b>' : '') + '</span>'
            + '</div>'
            + (list.length
                ? '<div class="stops">' + list.map((s) => stopRow(s, now)).join('') + '</div>'
                : '<p class="hint" style="padding:6px 0 2px">Nothing planned. A free day is a plan too.</p>')
            + '</div>';
    }).join(''));
}

function stopRow(s, now) {
    return '<div class="stop' + (s.date === now ? ' is-now' : '') + '">'
        + '<span class="stop-time' + (s.time ? '' : ' is-none') + '">' + (s.time ? fmtTime(s.time) : 'Any time') + '</span>'
        + disc(s.kind)
        + '<div class="stop-body"><div class="stop-title">' + esc(s.title) + '</div>'
        +   (s.where ? '<small class="stop-where">' + esc(s.where) + '</small>' : '') + '</div>'
        + '<span class="stop-cost' + (s.cost ? '' : ' is-free') + '">' + (s.cost ? money(s.cost) : 'Free') + '</span>'
        + '<span class="stop-acts">'
        +   '<button type="button" class="row-x is-edit" data-edit-stop="' + esc(s.id) + '" title="Edit"><i class="bi bi-pencil"></i></button>'
        +   '<button type="button" class="row-x" data-drop-stop="' + esc(s.id) + '" title="Remove"><i class="bi bi-x-lg"></i></button>'
        + '</span>'
        + '</div>';
}

function saveStop() {
    const t = trip();
    if (!t) return;

    const title = $('stopTitle').value.trim();
    const date = $('stopDate').value || t.from;
    if (!title) return $('stopTitle').focus();
    if (!date) return $('stopDate').focus();

    const row = {
        trip: t.id, date,
        time: $('stopTime').value,
        kind: $('stopKind').value,
        title,
        where: $('stopWhere').value.trim(),
        cost: toSen($('stopCost').value),
    };

    if (editStop) {
        Object.assign(db.stops.find((s) => s.id === editStop), row);
        editStop = null;
    } else {
        row.id = newId('s');
        db.stops.push(row);
    }

    save();
    clearStopForm();
    repaint();
}

function clearStopForm() {
    editStop = null;
    const t = trip();
    ['stopTitle', 'stopWhere', 'stopTime', 'stopCost'].forEach((id) => { $(id).value = ''; });
    $('stopDate').value = t ? t.from : '';
    $('stopKind').value = 'do';
    set('stopFormTitle', 'Add a stop');
    set('stopSaveLabel', 'Add stop');
    $('stopCancel').hidden = true;
}

function openStopEdit(id) {
    const s = db.stops.find((x) => x.id === id);
    if (!s) return;
    editStop = id;
    $('stopDate').value = s.date || '';
    $('stopTime').value = s.time || '';
    $('stopKind').value = s.kind || 'do';
    $('stopTitle').value = s.title || '';
    $('stopWhere').value = s.where || '';
    $('stopCost').value = s.cost ? fromSen(s.cost) : '';
    set('stopFormTitle', 'Edit stop');
    set('stopSaveLabel', 'Save changes');
    $('stopCancel').hidden = false;
    $('stopTitle').focus();
    $('stopTitle').scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* ====================================================================
   BOOKINGS
   ==================================================================== */
let editBook = null;

function renderBook() {
    const t = trip();
    if (!t) {
        set('bookNote', '');
        return html('bookList', emptyState('bi-ticket-perforated', 'No trip selected', 'Bookings belong to a trip.'));
    }

    const list = mine(db.books).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    if (!list.length) {
        set('bookNote', '');
        return html('bookList', emptyState('bi-ticket-perforated',
            'Nothing booked yet', 'Flights, stays and tickets all live here — held ones included.'));
    }

    const sums = tally(t);
    $('bookNote').innerHTML = money(sums.paid, { round: true }) + ' paid · <b>'
        + money(sums.held + sums.idea, { round: true }) + '</b> still open';

    const rows = list.map((b) => {
        const st = STATUS[b.status] || STATUS.idea;
        return '<tr>'
            + '<td>' + disc(b.kind, true) + ' <strong style="display:inline">' + esc(b.title) + '</strong>'
            +   (b.who || b.ref ? '<small>' + esc([b.who, b.ref].filter(Boolean).join(' · ')) + '</small>' : '') + '</td>'
            + '<td>' + (b.date ? fmtDay(b.date) : '—') + '</td>'
            + '<td><span class="tag ' + st.tag + '">' + st.label + '</span></td>'
            + '<td class="is-strong">' + money(b.cost) + '</td>'
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

function clearBookForm() {
    editBook = null;
    const t = trip();
    ['bookTitle', 'bookWho', 'bookRef', 'bookCost'].forEach((id) => { $(id).value = ''; });
    $('bookDate').value = t ? t.from : '';
    $('bookKind').value = 'travel';
    $('bookStatus').value = 'held';
    set('bookFormTitle', 'Add a booking');
    set('bookSaveLabel', 'Add booking');
    $('bookCancel').hidden = true;
}

function openBookEdit(id) {
    const b = db.books.find((x) => x.id === id);
    if (!b) return;
    editBook = id;
    $('bookKind').value = b.kind || 'travel';
    $('bookDate').value = b.date || '';
    $('bookStatus').value = b.status || 'held';
    $('bookCost').value = b.cost ? fromSen(b.cost) : '';
    $('bookTitle').value = b.title || '';
    $('bookWho').value = b.who || '';
    $('bookRef').value = b.ref || '';
    set('bookFormTitle', 'Edit booking');
    set('bookSaveLabel', 'Save changes');
    $('bookCancel').hidden = false;
    $('bookTitle').focus();
    $('bookTitle').scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/* ====================================================================
   BUDGET

   This module owns exactly one number — the total. Everything else on the
   screen is a booking or a stop read back, which is why there is no form.
   ==================================================================== */
function renderBudget() {
    const t = trip();
    if (!t) {
        set('budgetNote', '');
        set('budgetPerHead', '');
        html('budgetBars', emptyState('bi-wallet2', 'No trip selected', 'A budget belongs to a trip.'));
        return html('budgetTable', '');
    }

    /* Never rewrite the field the user is typing in: `1200.` round-trips
       through toSen/fromSen as `1200` and the point disappears under the
       caret. Outside of that, the field follows the trip. */
    if (document.activeElement !== $('budgetTotal')) {
        $('budgetTotal').value = t.budget ? fromSen(t.budget) : '';
    }

    const sums = tally(t);
    const spent = sums.paid + sums.stops;
    const heads = Math.max(1, Number(t.who) || 1);
    const length = daysBetween(t.from, t.to);
    const days = length === null ? 0 : length + 1;

    set('budgetPerHead', t.budget
        ? money(Math.round(t.budget / heads), { round: true }) + ' a head'
            + (days ? ' · ' + money(Math.round(t.budget / days), { round: true }) + ' a day' : '')
        : 'Set a total to see it split');

    const rows = spendByKind();
    const over = t.budget && spent > t.budget;
    $('budgetNote').innerHTML = t.budget
        ? money(spent, { round: true }) + ' of ' + money(t.budget, { round: true })
            + ' · <b class="' + (over ? 'is-minus' : '') + '">'
            + (over ? money(spent - t.budget, { round: true }) + ' over' : money(t.budget - spent, { round: true }) + ' left')
            + '</b>'
        : money(spent, { round: true }) + ' committed';

    if (!rows.length) {
        html('budgetBars', emptyState('bi-graph-up', 'Nothing to measure yet',
            'Add a paid booking, or put a cost on a stop, and the bars fill in.'));
        return html('budgetTable', '');
    }

    /* Each bar is drawn against the biggest kind rather than against the
       budget: at a glance the question is which kind is eating the trip,
       and five bars all under 10% of a total answer nothing. */
    const top = Math.max.apply(null, rows.map((r) => r.sen));

    html('budgetBars', rows.map((r) => {
        const k = kindOf(r.kind);
        const share = spent ? (r.sen / spent * 100) : 0;
        return '<div class="line-row">'
            + disc(r.kind)
            + '<div class="line-meta"><div class="line-name">' + k.label + '</div>'
            +   '<small class="line-sub">' + share.toFixed(0) + '% of what is committed</small></div>'
            + '<div class="line-figures">'
            +   '<div class="line-figure"><span>Committed</span><b>' + money(r.sen) + '</b></div>'
            +   '<div class="prog is-thin"><i class="c-' + k.cls + '" style="width:'
            +     (r.sen / top * 100).toFixed(1) + '%;background:var(--' + barColour(r.kind) + ')"></i></div>'
            + '</div>'
            + '</div>';
    }).join(''));

    const paidRows = mine(db.books).filter((b) => b.status === 'paid');
    const costed = mine(db.stops).filter((s) => s.cost);
    const all = paidRows.map((b) => ({ when: b.date, what: b.title, kind: b.kind, sen: b.cost, from: 'Booking' }))
        .concat(costed.map((s) => ({ when: s.date, what: s.title, kind: s.kind, sen: s.cost, from: 'Itinerary' })))
        .sort((a, b) => (a.when || '').localeCompare(b.when || ''));

    set('budgetTableNote', plural(all.length, 'line'));

    html('budgetTable', ''
        + '<div class="table-wrap"><table class="data-table">'
        + '<thead><tr><th>What</th><th>Kind</th><th>From</th><th>When</th><th>Cost</th></tr></thead><tbody>'
        + all.map((r) => '<tr>'
            + '<td><strong>' + esc(r.what) + '</strong></td>'
            + '<td><span class="dot c-' + kindOf(r.kind).cls + '"></span>' + kindOf(r.kind).label + '</td>'
            + '<td class="is-muted">' + r.from + '</td>'
            + '<td>' + (r.when ? fmtDay(r.when) : '—') + '</td>'
            + '<td class="is-strong">' + money(r.sen) + '</td>'
            + '</tr>').join('')
        + '<tr class="total-row"><td>Committed</td><td></td><td></td><td></td><td>' + money(spent) + '</td></tr>'
        + '</tbody></table></div>');
}

/** The bar colour for a kind, as a token name rather than a hex. */
function barColour(kind) {
    return ({ travel: 'sky', stay: 'violet', food: 'amber', do: 'teal', shop: 'rose' })[kind] || 'slate';
}

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
        return html('packList', emptyState('bi-bag', 'No trip selected', 'Each trip keeps its own list.'));
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
   ASK — the one dialog, borrowed by anything destructive
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

/* ====================================================================
   EXPORT / IMPORT
   ==================================================================== */
function exportAll() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
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
        catch (err) { return ask('That file did not open', 'It is not a PlanSphere export, or it was edited by hand.', null); }

        if (!parsed || !Array.isArray(parsed.trips)) {
            return ask('That file did not open', 'It has no trips in it, so there is nothing to restore.', null);
        }

        ask('Replace everything?',
            'Importing throws away the ' + plural(db.trips.length, 'trip') + ' on this device and puts the file in its place.',
            () => {
                db = Object.assign({ trips: [], stops: [], books: [], packs: [], current: null }, parsed);
                if (!db.trips.some((t) => t.id === db.current)) db.current = db.trips.length ? db.trips[0].id : null;
                save();
                showModule('dash');
                repaint();
            });
    };
    reader.readAsText(file);
}

/* ====================================================================
   WIRING

   One delegated listener on the page rather than a listener per row: the
   lists are rebuilt on every save, and handlers bound to rows that no
   longer exist are the classic way a rebuilt list stops responding.
   ==================================================================== */
function boot() {
    load();
    loadNav();
    paintStamp();
    paintTripPick();
    paintCounts();
    clearTripForm();
    clearStopForm();
    clearBookForm();
    showModule('dash');

    $('navToggle').addEventListener('click', toggleNav);
    $('navScrim').addEventListener('click', closeDrawer);
    window.addEventListener('resize', paintNav);

    $('tabs').addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-module]');
        if (!btn) return;
        showModule(btn.dataset.module);
        if (navIsDrawer()) closeDrawer();
    });

    $('tripPick').addEventListener('change', (event) => {
        db.current = event.target.value || null;
        save();
        clearStopForm();
        clearBookForm();
        repaint();
    });

    $('tripSave').addEventListener('click', saveTrip);
    $('tripCancel').addEventListener('click', () => { clearTripForm(); });
    $('stopSave').addEventListener('click', saveStop);
    $('stopCancel').addEventListener('click', () => { clearStopForm(); });
    $('bookSave').addEventListener('click', saveBook);
    $('bookCancel').addEventListener('click', () => { clearBookForm(); });
    $('packSave').addEventListener('click', savePack);
    $('packSeed').addEventListener('click', seedPack);

    /* Enter in a text field means "add the thing this form is for". */
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !$('askBox').hidden) return closeAsk();
        if (event.key !== 'Enter' || event.target.tagName === 'TEXTAREA') return;
        const form = event.target.closest('#module-trips, #module-plan, #module-book, #module-pack');
        if (!form || event.target.tagName !== 'INPUT') return;
        const btn = { 'module-trips': 'tripSave', 'module-plan': 'stopSave', 'module-book': 'bookSave', 'module-pack': 'packSave' }[form.id];
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

    $('toolExport').addEventListener('click', exportAll);
    $('toolImport').addEventListener('click', () => $('toolFile').click());
    $('toolFile').addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (file) importAll(file);
        event.target.value = '';
    });

    $('askNo').addEventListener('click', closeAsk);
    $('askYes').addEventListener('click', () => {
        const then = askThen;
        closeAsk();
        if (then) then();
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

    document.addEventListener('change', (event) => {
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

        const open = hit('data-open-trip');
        if (open) {
            db.current = open;
            save();
            clearStopForm();
            clearBookForm();
            return repaint();
        }

        const editT = hit('data-edit-trip');
        if (editT) return openTripEdit(editT);

        const dropT = hit('data-drop-trip');
        if (dropT) {
            const t = db.trips.find((x) => x.id === dropT);
            return ask('Delete this trip?',
                '"' + (t ? t.name : 'It') + '" goes, and so do its stops, bookings and packing list.',
                () => {
                    db.trips = db.trips.filter((x) => x.id !== dropT);
                    ['stops', 'books', 'packs'].forEach((k) => { db[k] = db[k].filter((r) => r.trip !== dropT); });
                    if (db.current === dropT) db.current = db.trips.length ? db.trips[0].id : null;
                    save();
                    clearTripForm();
                    repaint();
                });
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
