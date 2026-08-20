# PlanSphere

**Plan Infinity and Travel Beyond the World.**

A travel planner that keeps one trip whole: the days, the bookings, the money
and the list you check standing in the hallway. No account, no server — the
store is `localStorage`, and every save is a write.

## Running it

    node serve.js

Then open <http://localhost:5173>. Opening `index.html` straight off disk
mostly works, but `file://` applies different origin rules than a real host,
so the server is the honest way to see it.

## The files

| File | What it is |
| --- | --- |
| `index.html` | The shell and all six modules. Every screen is on the page; only one is visible. |
| `style.css` | Tokens first, then layout, then components, then responsive. Change a colour in one place. |
| `app.js` | Store, navigation, and one renderer per module. |
| `serve.js` | A static file server and nothing else. |
| `logo-icon.svg` | The mark, used in the sidebar and the rail. |
| `brand/` | The full identity: lockups, single-colour cuts, app tile, and `identity.html`. |

## Modules

    Dashboard   reads everything, writes nothing
    Trips       the only module that creates the thing the rest hang off
    Itinerary   days down the page, stops inside them
    Bookings    what is held, what is paid, what is still an idea
    Budget      reads Bookings and Itinerary; owns only the total
    Packing     the one screen that gets used standing up

Every module answers to the trip chosen in the top bar.

## How the layout works

It is MoneyFlow's shell, because it earned it: a sidebar of modules that
collapses to a rail on a desktop and to a drawer on a phone, a quiet top bar,
one hero band carrying the single number the screen exists to answer, and
cards down a stack or across a two-column deck.

What changed is the world it is set in — a vivid cornflower blue on a soft
blue-tinted white, rather than jade on sage-white. `data-theme="light"` is
written on `<html>`, so the light tokens are the app; a complete dark set sits
below them and switching that one attribute to `"dark"` is the whole of
turning it on. There is no toggle and no `prefers-color-scheme` query — the
theme is a decision the app has made, not one it inherits.

### One hue, three jobs

Contrast decides which blue can do what, so the brand blue is split into three
tokens rather than stretched across three jobs it cannot all do:

| Token | Value | Where it goes | Contrast |
| --- | --- | --- | --- |
| `--azure-vivid` | `#287dfa` | Shapes only — progress fills, the focus ring | 3.9:1 on white |
| `--azure` | `#1d70e6` | Fills carrying white words — live tab, primary button, chosen segment | 4.7:1 |
| `--azure-ink` | `#1657c4` | Blue as a word on a pale ground | 6.6:1 |

`#287dfa` is the cornflower everyone recognises, and against white it is
3.9:1 — fine for a *shape*, not fine for a *word*. So it is spent only where
nothing has to be read on top of it. Everything with a label on it steps down.

Two more rules follow from the same place:

- **The hero band is deeper than the brand blue.** It carries five pieces of
  small white text, so its lightest stop is chosen by what white can survive
  (`#2060c2`, where pure white is 6.0:1) rather than by how bright the blue
  can get. A band any brighter and its captions become decoration.
- **The travel category is not the brand blue.** A category tinted the same as
  the primary reads as "the selected one" on every screen it appears on, so
  travel sits on a deeper cyan.

## Money and dates

Money is stored in **sen** (integers) and only becomes a decimal on the way
out, so a budget cannot drift by a fraction of a cent. Dates are plain
`YYYY-MM-DD` strings — they sort and compare correctly as text and never pick
up a timezone. The one place a real `Date` is built, it is built at noon so a
shift either way cannot roll it into the day before.

## Data

Everything lives under one key, `plansphere.v1`:

    { trips: [], stops: [], books: [], packs: [], current: <tripId> }

**Export** writes that blob to a file. **Import** replaces what is on the
device with it, after asking. Deleting a trip takes its stops, bookings and
packing list with it — also after asking.

First run seeds one trip so the app opens with something to take apart. Clear
it by deleting the trip, or run `localStorage.removeItem('plansphere.v1')`.
