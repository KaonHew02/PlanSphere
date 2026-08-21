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
| `index.html` | The shell and all eight modules. Every screen is on the page; only one is visible. |
| `style.css` | Tokens first, then layout, then components, then responsive. Change a colour in one place. |
| `app.js` | Store, navigation, and one renderer per module. |
| `serve.js` | A static file server and nothing else. |
| `gcal.js` | One-way push into Google Calendar. Inert until `gcal-config.js` has a client ID. |
| `logo-icon.svg` | The mark, used in the sidebar and the rail. |
| `brand/` | The full identity: lockups, single-colour cuts, app tile, and `identity.html`. |

## The flow

                         🏠 HOME
                            ▼
                       📅 CALENDAR
                            ▼
          🌎 TRIP  ·  🎉 EVENT  ·  📅 ACTIVITY
                            ▼
                  🗓️ SCHEDULE / ITINERARY
                            ▼
                   💰 EXPENSE MANAGER
          👥 PEOPLE · 📷 RECEIPTS · 📝 NOTES
                     💸 BILL SPLIT
                     💸 SETTLEMENT
                            ▼
                        💳 BUDGET
                            ▼
                      📊 ANALYTICS

Every arrow is a real dependency, not a suggested order. The Itinerary needs
something to hang days off; an expense needs somebody to split between; the
Settlement needs a split to square; the Budget needs money to measure; the
Analytics need all of it. Nothing further down the page can be filled in
before the thing above it exists, and every screen says so when it is empty
rather than showing a form that cannot work.

The six boxes under Expense Manager are **cards on that one screen**, not
screens of their own, and they sit on it in the order the flow runs:

    New expense · Expenses · Where it went
    👥 People · 📷 Scan · 📷 Documents · 📝 Notes
    💸 Who paid, who owes · 💸 Settlement
    Categories · Roles

People, receipts and notes are the three things that hang off a trip rather
than off its clock; the split and the settlement are what the app does with
them; and the two vocabulary lists close the screen, the same way the
Calendar and Trips screens close with theirs.

## Modules

    01 🏠 Home Dashboard        what is happening, and nothing else
    02 📅 Calendar & Timeline   every trip, event and activity by date
    03 🌎 Trip & Event Mgmt     creates what the rest hang off
    04 🗓️ Schedule & Itinerary  the days and the stops inside them
    05 💰 Expense Manager       expenses · people · receipts · notes ·
                                splitting · settlement
    06 📊 Summary & Analytics   trips, events, budgets and expenses,
                                added up

**Budget** sits between Expenses and Summary in the sidebar because that is
where it sits in the flow: it is what the money is measured against, and what
Summary reads. Three more screens answer to a numbered module rather than
being one, and sit under a rule: **Bookings** feeds the Expenses ledger,
**Convert** is a calculator, and **Packing** is a list.

Every module except the Calendar answers to whatever is chosen in the top bar.
That switch only appears once there are two things to switch between — a select
holding one option is a control that cannot do anything, and one that cannot do
anything still invites being tried. Below two, the whole switch goes: the name
was stated there for a while and read as a control that would not work.
The Calendar deliberately does not answer to it — a calendar that showed one
trip at a time would be a worse itinerary, not a calendar.

The app opens on **Home**: *what have I got on* is the question people arrive
with, and it is the one screen that answers it without adding anything up. To
land somewhere else, change `let live = 'dash'` in `app.js`.

Home and Summary are the two halves of what used to be one Dashboard. Both read
every other module and write to none of them, which is what makes it safe for
Summary to state every figure in the app on one page — and why none of those
figures are calculated there.

## Module 01 — Home Dashboard

What is happening, and nothing else.

    🌎 Kyoto & Osaka          14 Sept – 24 Sept 2026
    DEPARTS IN                PLANNED 11    BUDGET LEFT RM 11,390
    24 days                   6 days with   RM 610 of RM 12,000
    Japan · 11 days long      something in it

Under the countdown sit the four things worth knowing without opening a module:
what is **next up** on the itinerary, what bookings are **still to confirm**,
how far the **packing** has got, and what is left to hand over in the
**settlement**.

Three headlines, one per state: *departs in* before, *happening now* during
— with which day of how many — and *done* after. The middle one is the one
people open the app for while they are actually away.

Nothing on this screen is added up. Everything that is lives one screen along,
in **Module 06 — Summary & Analytics**. Splitting them is the difference
between a screen you read at a glance and one you work through, and the two
were one page for long enough to prove it.

## Module 02 — Calendar & Timeline

Four views over one set of items: **Month**, **Week**, **Day**, **Timeline**.

The items come from four places and only one of them belongs to the module:

| Source | Shown as | Editable here |
| --- | --- | --- |
| `events` | activities the calendar owns | yes, fully |
| `trips` | a bar across every day of the trip | no — opens Trips |
| `stops` | the "what time, where" of a trip day | no — opens Itinerary |
| `books` | flights, stays and tickets, on their date | no — opens Bookings |

Clicking a derived item goes to the module that owns it, switching the top-bar
trip first if it belongs to a different one. It does not open an editor that
could only lie about what it is editing.

**Nothing has to be entered twice.** Create a trip 16–20 Sep and the calendar
draws it across those five days. Add a stop *Coconut Forest, 18 Sep, 10:30 am*
and it appears in that day's cell, in the week grid at half past ten, and in
the timeline under 18 September. No sync step, because there is no second copy
— the calendar reads the same arrays the other modules write.

### Categories

Six ship by default — Trip, Event, Personal, Company, Family, Birthday — but
they are rows in the store, not a schema. Each one's **name, mark and colour**
are editable on the Calendar screen, and you can add and delete your own.

    🌎 Trip       filled automatically from trips, stops and bookings
    🎉 Event      🏢 Company    🎂 Birthday
    👤 Personal   👪 Family     …and whatever else you add

**Trip is the one exception**: it can be renamed and recoloured like any
other, but not deleted, because the rows filed under it are trips and stops
rather than anything a person put there. It is also left out of the activity
form's picker, since it fills itself.

**Deleting one just happens** — no dialog. Anything filed under it moves to
another category, and a toast says what moved where, with **Undo** attached:
*"Deleted Company · 2 activities moved to Event"*. Undo puts the category back
at its old position and returns every activity to it.

The one refusal is a category holding activities when there is nowhere to move
them; nothing is deleted and the toast says why.

Which actions ask first and which just happen comes down to one test: whether
they can be taken back. A category can, so it does not ask. Deleting a **trip**
cannot — its stops, bookings and packing list go with it — so that one still
asks, and so does importing a file over the top of everything.

Colour comes from a palette of nine tones. A tone sets `--cc` and `--cc-soft`
inline, and every chip, dot, disc and block downstream is written against
those two properties rather than against a category name. It used to be one
CSS class per category, which caps the list at however many classes somebody
remembered to write.

The colour is carried by the dot and the border, never by the text — nine hues
put through a 4.5:1 contrast test is nine chances to fail it.

### Drag to reschedule

Drag an activity, a stop or a booking onto another day and its date moves — a
date is a date wherever it is stored. Trips are the exception: a trip is a
span, and dragging it would silently move every stop inside it, so it stays on
the Trips screen.

### Search, filter, reminders

Search matches names, places and notes. The category chips toggle whole
categories out of every view at once.

### How reminders actually reach you

> **Parked.** The two buttons — *Add to phone calendar* and *Reminders off* —
> are commented out of `index.html` while this is being thought through. The
> code behind them is untouched and still works; restoring either is putting
> that markup back. Everything below describes what happens when they are on.


There are two mechanisms, and only one of them reaches a phone.

**In this browser, while the page is open.** Press *Reminders off* to grant
permission and the browser shows a notification when an activity comes due.
Each fires once, and only if it came due in the last five minutes, so
reopening the app tomorrow does not replay yesterday. Close the tab and
nothing fires — there is no background process to fire it.

**On your phone, properly: _Add to phone calendar_.** This downloads an `.ics` of
everything — activities, trips as multi-day blocks, itinerary stops at their
times, bookings — with a `VALARM` on every activity that has a reminder set.
Open it on the phone and its own calendar imports it, alarms included. From
then on the phone reminds you: offline, screen locked, app closed, the way a
reminder is supposed to work.

That is not a workaround, it is the correct architecture for an app with no
server. A web page can only push to a locked phone through a **service worker
plus a push server holding VAPID keys** — a backend, a subscription store, and
something running around the clock. PlanSphere is four static files and
`localStorage`. Handing the phone's own calendar a file it already understands
does the job better than a backend would, and keeps working on a plane.

Times are written without a timezone, so 7pm stays 7pm in whichever country
you open it in — which for a travel app is the right answer, not a shortcut.

### Public holidays

Two countries matter on a trip: **the one you left**, because that is when your
own office is shut, and **the one you are in**, because that is when the shops
are shut, the trains are full and the hotel costs double. Both are shown.

Set your own country in the *Public holidays* bar on the Calendar, and each
trip's country on the Trips screen. They arrive as a locked **Holiday**
category, so the category chip switches them all off if you would rather not
see them.

Rules, not an API. `date-holidays` computes 206 countries from bundled rules,
loaded from a CDN the first time it is needed. That matters because the free
holiday APIs do not carry **Malaysia or Thailand** — the first two countries
this app would ever be asked about. Once the rules are loaded, every year for
every country is available with no network at all, and each country-year is
cached in `plansphere.holidays.v1`.

The library does not carry Cambodia, Laos or Myanmar. That is a gap in the
data, not in the code, and nothing else fills it for free.

Holidays are **left out of the .ics** on purpose: your phone's calendar
already knows about them, and importing them again would double every one.

### Google Calendar

Two routes, neither of which needs an account, a key, or anything set up:

- **One activity** — *Add to Google Calendar* on any activity you are editing
  opens Google's own new-event form with the title, time, place and note
  already filled in.
- **Everything** — *Add to phone calendar* saves the `.ics`, and Google
  Calendar imports `.ics` like every other calendar app (Settings → Import).

- **Straight into your account** — *Send to Google Calendar* writes everything
  into a calendar PlanSphere makes, no file involved. This one needs a one-time
  setup: your own OAuth client ID in `gcal-config.js`. See **docs/GOOGLE.md**;
  it is about five minutes of clicking. Until then the button stays hidden.

The permission asked for is `calendar.app.created` — **only calendars this app
made**. It cannot read your existing calendars, cannot list them, and cannot
touch an appointment it did not put there. Pushing again updates rather than
duplicates: every entry carries a stable id derived from its own.

It is one-way on purpose. Two-way sync means conflict resolution, deletion
tracking and a story for which side wins, and none of that earns its complexity
for a planner whose truth lives in one browser.

## Module 03 — Trip & Event Management

The only module that creates the thing the rest hang off. **Create New** opens
onto three:

    🌎 Trip       somewhere you are going, across days
    🎉 Event      a gathering with a date and a budget
    📅 Activity   one day, one thing

They are one record with a different word on it. All three own itinerary days,
bookings, a budget and a packing list, so three tables would have been three
copies of the same code answering to three names. `kind` is the only
difference, and it decides four things and nothing else:

| | Trip | Event | Activity |
| --- | --- | --- | --- |
| the name field asks for | Trip name | Event name | Activity name |
| the place field asks for | Destination | Venue | Where |
| dates | start and end | start and end | one date |
| types offered | the trip list | the event list | the event list |

An activity still stores both dates — the end closes on the start — so the
calendar and the itinerary keep reading one shape.

### The information

Name, type, destination, start and end, description, cover image, currency,
budget, members, status. Country is here too, and only feeds the public
holidays the Calendar draws.

**The cover is resized before it is stored.** The store is one localStorage key
with a few megabytes in it and a phone photo is four of them on its own, so the
file is drawn onto a canvas at most 1200px wide and comes back out as a JPEG.
A 2400px shot lands at about 6 KB. Records without one are not a gap: the mark
of what they are is set large and quiet in the cover's place, so a shelf of
coverless records still reads as a shelf.

### Types

**Rows in the store, not a schema** — the same decision the Calendar's
categories were built on, for the same reason: a list somebody can add to is a
list, and a list nobody can add to is a limit.

    Trip types    Personal · Family · Friends
    Event types   Company · Family · Birthday · Wedding · CSR · Sports · Other

Two lists rather than one with a column saying which it belongs to, because the
words do not carry over: a Wedding trip and a Camping event are both nonsense.
Activities read the event list rather than owning a third one — an activity is
an event with one day in it.

**＋ Add type** appears on each list, and again beside the form's Type field,
where it adds to whichever list that form is reading and selects what it added.
Names save as you type. Deleting one just happens, with **Undo** attached:
whatever was filed under it is left untyped, and Undo puts both back. It does
not ask first, because it can be taken back and what it takes with it is a
label rather than a plan — the same test the Calendar's categories are deleted
under. Deleting a **trip** still asks, because its stops, bookings and packing
list go with it.

The card reads the type and the kind together: a record typed *Friends* reads
**Friends Trip**.

### Status, and what the dates say

    Draft · Planning · Upcoming · Ongoing · Completed · Archived

Every one of those is a statement of intent, not a fact about the calendar, so
the status is stored and only ever changes because somebody changed it. What
the dates say — *In 24 days*, *Tomorrow*, *Happening now* — is a separate line
on the card, read fresh each time.

They are kept apart on purpose. A plan can sit at Draft the week it happens,
and that is a thing about the plan rather than a contradiction for the app to
correct. A record stored before statuses existed has one read off its dates
once, on load, and is a stored field from then on.

### The shelf

A card, not a table row. Every field a trip carries is a different shape — a
picture, a name, two dates, four figures — and a table asks all of them to be a
cell of the same width. The cover answers *which one is this* before the words
are read, which is what the row was for.

    🌎 Da Nang & Hoi An                                    PLANNING
       Friends Trip
       Wed 16 Sept  ↓  Sun 20 Sept              In 26 days
       DESTINATION Da Nang, Vietnam     MEMBERS 4
       BUDGET      RM 4,000             COMMITTED RM 0

Committed is what the bookings and stops already add up to, in the record's own
currency, and turns red past the budget — the figure is still the figure, it is
the colour that changes.

Clicking a card makes it the open one; everything downstream follows. The
filter above the shelf narrows it to one kind.

### On the Calendar

Trips, events and activities all draw as bars across their dates, each in its
own category's colour — Trip, Event and Personal respectively, falling back to
the system Trip category if one of those has been deleted. They are not
editable there. Clicking one comes back here, which is the same rule the
Calendar already applied to itinerary stops and bookings.

## Module 04 — Schedule & Itinerary

Days down the page, stops inside them. Every day between the record's dates
gets a heading whether or not anything is planned in it — an empty day is
information, and it is where the next stop is most likely to go. Anything
dated outside the range still appears, under **Extra**, so a stop is never
silently lost to a date change.

A stop carries: date, start and end time, title, location, description,
activity type, duration, estimated cost, actual cost, notes, an attachment
and a status.

**Notes & information** used to sit under the plan and now lives on the
Expenses screen, beside the people and the receipts — those three are the
things that hang off a trip rather than off its clock. A note pinned to a day
still shows in that day's heading here, and clicking it goes there.

### The clock

    10:30 am
    to 12:00 pm
    1h 30m

**Duration is not stored.** A stop keeps a start and an end, and how long it
runs is worked out from the two — the same fact written a third way is a third
thing to keep in step. The Duration field on the form is a way of *entering*
the end time: type `90` against a 10:30 start and the end fills in at 12:00.
Type an end time instead and the duration reads back. With no start time both
are disabled, because there is nothing to run from.

An end before the start is an evening that runs past midnight, not a negative
afternoon, so it counts round the clock.

A stop with no time at all sits at the end of its day, under the ones that
have one.

### Status

    Planned · In Progress · Completed · Cancelled · Skipped

Two of those mean *this is not happening*. They stay on the page — a cancelled
stop is the reason the afternoon is free, and deleting it loses that — but
they drop out of every total: the day's estimate, the trip's committed figure,
the Budget's lines, the Dashboard. A day's estimate is what the day is expected
to cost, and a cancelled stop costs nothing.

The filter above the plan is two questions, not one. **Travel / Stays / Food /
Activities** narrows by activity type; **Still on / Everything** decides whether
the cancelled and skipped ones are drawn. Cancelled rows are dimmed and struck
through rather than hidden by default.

### Estimated vs actual

The connection to the expense side of the app, and the reason a plan is worth
keeping after the trip.

    Coconut Forest
    Estimated   RM 80
    Actual      RM 95
    Difference  +RM 15

The estimate is typed here. **The actual is not copied — it is read.** Point a
stop at an expense record and the figure comes from that record every time the
row is drawn, so correcting what was paid corrects what the plan says was paid.
A copy taken at save time would be right once.

Today the app's expense records are its **bookings**, and the Actual cost field
lists them. *Type it in* is the fallback for money that never became a record —
the coconut you paid cash for. It is one or the other, never both: an actual
that is linked and typed is two answers to one question. If the record it
points at is deleted, the stop says nothing rather than holding the last figure
it saw and calling it current.

The difference is only shown when both halves exist — a difference against an
estimate of nothing is the actual figure said twice. Over is red, under is
green, and it is the gap that carries the colour, never the figures.

### Attachments

One file per stop — a ticket, a booking slip, a photo of the door code — kept
in the store with everything else, which is what caps it. Images go through the
same canvas as a trip's cover and come out at a fraction of the size; anything
else is stored as it is and **turned away over 1 MB**, with a toast saying so,
rather than quietly failing to save.

The chip under the stop opens it. A `data:` URL cannot be opened as a page, so
it is turned back into a blob and handed over as a download — which is what
somebody clicking their own ticket wanted anyway.

### Notes & information

Part of this module rather than one of its own, because a note is read on the
way to a stop. What separates a note from a stop's own Notes field is what it
is *about*: a stop's note is about that minute, a note here is about the trip,
or about a day of it.

    📝 General   ✈️ Travel      🎉 Event
    💼 Meeting   ⏰ Reminder    ❗ Important
    👤 Personal  🍜 Food        🏨 Accommodation

Nine types, and unlike a trip's types these are **fixed**. A trip type is
somebody's own vocabulary for their own trips; a note type is what a piece of
information *is*, and each one carries a mark and a colour the whole card is
written against. Adding a tenth would mean choosing a mark and a tone, not
typing a word. The chips above the list filter by type and carry their counts.

**Supported content** is text, links, images, documents and attachments.

Text takes one piece of formatting and no more: a line starting with `*`, `-`
or `•` becomes a bullet. That covers both shapes the spec was written around —
a line, a colon, and a list under it —

    Da Nang travel notes
    Things to remember:
    * Bring passport
    * Bring power bank
    * Download offline map

— and anything past it is a rich text editor, which is a project rather than a
field. They are **not** checkboxes: "Bring passport" reads like something to
tick, but the app already has a screen for ticking things off, and two half
packing lists are worse than one whole one.

Links go one per line, as `Hotel booking | https://…` or just the address. A
bare `booking.com/x` is given the scheme it meant; a line with no address in it
is dropped rather than turned into a link to nowhere.

Files go through the same reader as a stop's attachment — images scaled down,
anything else kept as it is and turned away over 1 MB — but a note holds as
many as it needs. Images show as thumbnails, documents as named chips, and
both open the same way.

### The join with the plan

A note can be pinned to a **day**, or left on the whole trip.

A pinned one is stated in that day's heading up in the plan, in its type's
colour, where the day is actually read — and clicking it comes back down to the
note and flashes it. That is the join between the two halves of this screen,
and the reason the notes did not become a module of their own.

Pinned notes sort first, in date order; the standing ones follow. A note pinned
to a date outside the trip's range still gets its day drawn, for the same
reason a stop does.

Deleting a note just happens, with **Undo** — it is words and files, and both
come straight back. Deleting the trip takes its notes with it, which is why
*that* one still asks.

## Module 05 — Expense Manager

Money that actually left, as opposed to money that was planned to. This is the
other half of the Itinerary's *Estimated vs actual*: the record a schedule item
reads its actual cost from.

An expense carries a reference, date, time, merchant, description, category,
amount, currency, who paid, who it was for, how it splits, notes, a receipt and
any number of other attachments — and, optionally, the schedule item it paid
for.

    🍜 FOOD                                       EXP-004
    ABC Vegetarian Restaurant
    RM 120.00
    DATE  Fri 18 Sept          PAID BY  Jekaon
    ─────────────────────────────────────────────
    SPLIT                                    EQUAL
    J  Jekaon                              RM 40.00
    A  Alice                               RM 40.00
    B  Bob                                 RM 40.00

The reference — `EXP-004` — is counted per trip, so two trips do not share a
numbering nobody asked them to share.

### People & participants

Here rather than on the Trips screen, because this is where names are used: an
expense is split between people, and somebody who is not on the list cannot be
ticked. Everything else about them hangs off the same row rather than off a
second list somewhere else.

A person carries a **name, phone, email, role, status and notes**. The phone
and the email are links — on a phone, the number dials.

Module 02 asks for a Members *count*, because at the point you are creating a
trip that is all you know. The count follows this list once anybody is named: a
trip with four people on it and Members saying 2 is a trip that is wrong.

### Roles

    Organizer · Participant · Guest · Volunteer · Employee · Family · Friend

Seven, and the eighth is your own — which is what *Custom* means, so they are
**rows rather than a fixed list**, the same as the trip types and the expense
categories. `＋ Add role` sits on the list and again beside the form's Role
field, where it adds and selects in one press.

Deleting one just happens, with **Undo**. What it takes with it is a label:
the people who held it are still on the trip, still on their expenses, and
simply have no role until they are given another.

### Status, and the headcount

    Registered · Attended · Absent

Three, because they are the three the headcount is made of: somebody said they
were coming, somebody came, somebody did not. Anything finer — invited, maybe,
declined — is a state of a conversation rather than a state of the event, and
the counts would stop adding up.

The headcount appears on an **event or an activity** and not on a trip, which
is the difference between the two: on a trip everybody is coming, and three
figures saying so is furniture. On an event, turning up is the question.

    REGISTERED   ATTENDED   ABSENT   NOT YET MARKED
        25          22         3           0

*Registered* is the roster — 25 registered, of whom 22 came and 3 did not.
Somebody still sitting at Registered is one whose outcome nobody has recorded,
and that is the fourth figure rather than a fourth kind of person.

### Nobody is on every expense

    🍜 Nishiki Market            RM 246.15
    SPLIT                            EQUAL
    J   Jekaon        ✓        RM 82.05
    AT  Alice Tan     ✓        RM 82.05
    BL  Bob Lim       ✓        RM 82.05
    JN  John Ng       ✗        RM  0.00

Every expense lists **everybody on the trip**, not only everybody on that
expense. A name with a tick beside nothing answers *was John left off, or was
he not there?* — which a list of three names out of four does not.

Each person card also states what they are to the money: what they paid, how
many splits they are in, and whether they are owed or owing.

### Taking somebody off the list

Removing somebody cannot just happen the way a category can — their name is on
expenses, and taking it off changes what those expenses say. So:

- the expenses **keep the id** and print *Someone (removed)*;
- their share stays exactly what it was. A dinner split four ways stays split
  four ways; taking a name off the list must not quietly re-divide money that
  was already spent;
- the balances table keeps a row for them, so the two columns still add up to
  what was spent — a table that does not add up is worse than one with a name
  in it nobody recognises;
- and **Undo** puts the name back on all of them at once.

### Splitting

    Equal          split evenly between everybody ticked
    Percentage     a share each, and it has to come to 100
    Custom amount  type what each person owes

Participants are a row of toggles rather than a multi-select, because a
multi-select of four names is a control nobody can use on a phone. A new
expense starts with everybody ticked, and unticking somebody gives them a share
of nothing rather than taking them off the card.

    RM 120 · Equal          RM 120 · Percentage      RM 120 · Custom amount
    Jekaon  RM 40           Jekaon  50%  RM 60       Jekaon  RM 60
    Alice   RM 40           Alice   25%  RM 30       Alice   RM 30
    Bob     RM 40           Bob     25%  RM 30       Bob     RM 30

Percentages **start even** rather than empty — five blank fields is arithmetic
somebody has to do in their head before they can begin, and moving one of them
is the actual edit. Three ways starts at 33.3 · 33.3 · 33.4.

**The last person takes the rounding**, so the parts always add back up to the
amount instead of landing a cent short of it. Split three ways, RM 292.31 comes
out as 97.43 · 97.43 · 97.45.

A split that does not add up is a split that is *wrong* rather than one that is
unusual, so Save will not go through and the hint says what it came to — *the
shares come to 85% — they have to come to 100*. Percentages are checked to one
decimal place, because 33.3 three times is 99.9 and refusing that is refusing
the most obvious way to type it. Equal cannot be wrong, so it is never checked.

Everything is worked out in the trip's own money, so a split across two
currencies still adds up.

### Who paid, who owes

    PERSON      PAID        SHARE      BALANCE
    Jekaon      RM 1,500    RM 900     +RM 600   should receive
    Alice       RM 800      RM 850     −RM 50    needs to pay
    Bob         RM 300      RM 850     −RM 550   needs to pay
    Total expenses RM 2,600

A balance is what somebody put in less what they used. It is derived, never
stored — there is nothing to keep in step, and correcting an expense corrects
the table. Somebody taken off the list keeps their row, under the name the app
has left, so the columns still add up.

### 💸 Settlement

The balances say who is up and who is down. They do not say *who hands what to
whom*, and a table of five people all slightly out is a puzzle rather than an
answer.

    Bob    →  Jekaon     RM 550.00     Pending
    Alice  →  Jekaon     RM  50.00     Pending

**Biggest against biggest.** Matching the largest debt to the largest credit
each time is what keeps the list to at most one transfer fewer than there are
people — pay the person furthest up, and one of you drops out of the problem
entirely. Three people who owe each other in a ring settle in two payments, not
three.

**The plan is worked out fresh every time it is drawn.** What is stored is the
opposite: what has actually been handed over. A settlement is a claim about the
real world, and the only part of it the app can be sure of is the part somebody
typed.

    Pending · Partially paid · Paid · Cancelled

The status is **derived from the amount**, never stored beside it: nothing
handed over is Pending, some of it is Partially paid, all of it is Paid. A
status and an amount that can disagree is a status that will, and it is always
the amount that is right. Cancelled is the one that is a decision rather than
an arithmetic fact, so that one is stored — for the transfer somebody settled
in a way the app is not going to hear about.

*All of it* fills the amount in; pressing it again clears it, because the
common mistake is pressing it on the wrong row. A part-payment is typed into
the field, and the bar across the top says how much of the whole settlement has
moved.

What is recorded is kept **per pair**, not per transfer: a transfer is derived
and a pair is not. Add an expense and the amounts move, but *Bob pays Jekaon*
is still the same arrangement, and what Bob has already handed over is still
true.

### Categories

Ten to start with — Transport, Accommodation, Food, Activities, Taxi, Shopping,
Drinks, Groceries, Fees, Other — and, like the Calendar's, they are **rows
rather than a fixed list**: rename them, change the mark, change the colour,
add your own. Deleting one moves what was filed under it to another and says
so, with Undo attached. The one refusal is having nowhere to move them to.

### Where it went

Four figures — spent, budget, per person, and how much of the plan there is to
spend against — over a bar per category. The bars are drawn **against the
biggest category**, not against the total, because at ten categories a
share-of-total bar is nine slivers and one stripe. The share of the total is
stated beside each one in words instead.

### The join with the Itinerary

*This expense is what that schedule item cost* can be said from either end: on
the Itinerary, in a stop's **Actual cost** field, or here, under **Against a
schedule item**. It is stored on both, because both screens have to read it
without hunting, and kept in step in one place so the two can never disagree.
Each side holds at most one of the other.

A stop's actual is still **read, not copied** — correcting a receipt here
corrects what the plan says was paid, and the difference against the estimate
moves with it. Bookings are still offered there too: an expense is money that
left, a booking is money committed ahead of the trip, and a flight paid for in
May is the second kind.

### Receipt & document scanner

Part of this module rather than one of its own, because what a scan produces
is an expense.

    📷 photo  →  read  →  guess  →  you correct it  →  expense

**The reading happens on this device.** The library is fetched from a CDN the
first time somebody scans — the same way the holiday rules are, and never
before it is needed — and the image itself is never uploaded anywhere. That is
the whole reason it is worth doing here rather than posting a photograph of
somebody's card receipt to a service.

The camera is asked for only when the button is pressed; a page that asks for
the camera on load is a page people close. **Choose a photo** does the same job
from the camera roll, which is also the answer on a desktop with no camera and
on a phone where permission was refused.

### What it guesses, and how

    ABC Restaurant                    Merchant   ABC Restaurant
    12 Jalan Sultan, Kuala Lumpur     Date       18 Aug 2026
    Date: 18/08/2026  14:32           Total      RM 110.00
    Food            RM  80.00         Category   🍜 Food
    Drinks          RM  20.00         File as    🧾 Receipt
    Tax             RM  10.00
    TOTAL           RM 110.00

**Merchant** — the first line near the top that reads like a name rather than
an address, a phone number or a heading. On a printed receipt the name is at
the top and set larger than everything under it; the reader does not report
type size, so position and shape are what is left.

**Date** — `18/08/2026`, `2026-09-16`, `05.09.2026`, `14 Sep 2026`, `Sep 14,
2026`. When both halves of a numeric date are under 13 it is genuinely
ambiguous, and the rest of the world writes the day first. A date it cannot
read is left **empty**: today's date on last week's receipt is worse than none.

**Total** — the line that says *total* wins, and the last such line wins over
the first, because a receipt prints subtotal, tax, then total in that order.
Lines saying *subtotal*, *tax*, *change* or *cash* are skipped. Failing that,
the biggest figure on the page — but only among the ones **written like
money**: `1,100` and `42,50` are prices, a bare `2026` on a boarding pass is a
year, and reading it as a price is worse than reading nothing. An empty field
asks to be filled; a wrong one does not.

Thousands and decimals are read in whichever order the country writes them, so
`84,000`, `1,234.56` and `1.284,50` all come out right. The currency comes from
whatever symbol or code is on the page — RM, ¥, €, ฿, ₫ and the rest.

**Category** and **file-as** are keyword matches: *restaurant*, *ramen*,
*trattoria* → Food; *grab*, *taxi* → Taxi; *boarding pass*, *gate*, *PNR* →
Flight ticket. A category that has been renamed or deleted is simply not
suggested — they are rows, so a hard-coded id is a guess rather than a key.

**Every one of these is a suggestion in an editable field.** The reader gets
the total right far more often than it gets the merchant right, and pretending
otherwise would cost more than it saved. *What the reader actually saw* is
folded away under the fields — the first thing worth looking at when a guess is
wrong, and the last thing worth showing when it is right.

**If the reader will not load** — offline, blocked, a CDN having a bad day —
the review still opens with the photograph held and every field empty. A failed
read is slower than typing, not worse than it.

### The two ways out

**Confirm & create expense** opens the expense form filled in, with the
photograph attached as the receipt. It stops there rather than saving: the
scan cannot know who paid or how it splits, and those are the two fields that
decide who owes whom.

**File as a document only** is for the half of a camera roll that is not money.

### Documents

    🧾 Receipt      📄 Invoice        ✈️ Flight ticket      🏨 Hotel confirmation
    🗂️ Booking      🎟️ Event ticket   🛂 Travel document    📋 Event document

Each one belongs to whatever is open in the top bar, and can be tied to a **day
on the plan** and to an **expense** — so the chain the spec asks for, *trip →
event → schedule → expense*, is one row pointing at two things rather than four
copies of a file.

A scanned receipt is filed here **and** attached to its expense, and it is the
same file rather than two copies of it. The document is written the moment the
photograph exists, because a photograph is a thing whether or not the expense
ever gets saved; it is linked to the expense when that expense is saved, and
left filed but unattached if the form is abandoned.

The thumbnail opens the file. Deleting one just happens, with **Undo**.

## Budget

What was meant to be spent, against what was.

    Da Nang Trip
    BUDGET        ACTUAL        REMAINING
    RM 4,000      RM 3,280      RM 720            82%

**Every number on the left of a comparison is typed here; every number on the
right is read from somewhere else.** The actual comes off the Expenses ledger,
and a person's actual comes off the split the Settlement is worked out from —
so a budget cannot quietly say something the expenses disagree with. This
module owns the expectations and nothing else, which is why it has no form for
recording money.

### Four budgets, all optional

    Overall      the whole trip or event
    Category     per expense category
    Per person   what one person is expected to use
    Daily        what one day is expected to cost

Leaving one empty means that question is not being asked, which is a different
thing from answering it with a nought. Each one states what it comes to across
the other axis as you type it — a per-person budget says what it is across
everybody, a daily one says what it is across the trip.

### Category budgets

    🏨 Accommodation   1,200   spent 1,150   left  50
    🍜 Food              600   spent   580   left  20
    ✈️ Transport         700   spent   650   left  50

Every category gets a row whether or not it has a budget, because the row is
where the budget is typed — and what a category has taken is shown either way,
since an unbudgeted category still spends money. The categories are the
Expenses ones: rename or add one there and it appears here.

### Per person

A person's actual is their **share** of the expenses, not what they happened to
pay. Who paid is a matter for the Settlement; what somebody *used* is the
question a per-person budget asks, and the split already answered it.

### Warnings

    ⚠️  You have spent 97% of your 🍜 Food budget.
        Budget RM 600.00 · Spent RM 580.00 · Remaining RM 20.00        97%

Nine tenths of a budget is where it stops being a plan and starts being a thing
to watch; past a hundred it is a fact, and the wording changes to match — *you
are RM 280 past your Overall budget*. Only budgets that have been set are
warned about, and only when they are close or past: a screen that warns about
everything is a screen nobody reads.

**Nothing is blocked.** A budget is a plan, not a rule, and an app that refuses
to record what was actually spent is an app that stops being true.

A day nobody spent anything on is left out of the warnings — it is a day that
has not happened yet, or one that was free, and neither is worth a line.

### The bar

One bar, and it always draws the **budget** as its full width. A bar that
rescales to whatever was spent cannot show going over, which is the one thing a
budget bar exists to show. Past a hundred per cent the overflow is drawn in red
past the end of the fill.

Everywhere else in the app a bar is drawn against the biggest thing beside it —
the expense categories, the itinerary kinds — because there the question is
which one is eating the trip. Here the question is a limit, so the limit is the
width.

### Spent, committed, planned

Three different things, and the headline figure is only the first:

| | What it is | Counted as actual |
| --- | --- | --- |
| **Spent** | an expense — money that left | yes |
| **Committed** | a booking held or paid ahead of the trip | stated beside it |
| **Planned** | a cost on an itinerary stop | stated beside it |

*Every ringgit* lists all three in one table, each saying which it came from,
with the estimates set quieter than the money. A stop whose actual already
points at an expense is left out of the planned column — it is not still
expected, it has happened.

This is also what the **Committed** figure on a trip card means now: money that
left plus what is already paid for. A trip nobody has spent anything on has
cost nothing, however carefully it was priced.

## Module 06 — Summary & Analytics

Everything that has to be added up. It reads every module and writes to none of
them, which is what makes it safe to put every figure in the app on one page.

Its other half is **Module 01 — Home Dashboard**, which holds the things that
need no arithmetic: the countdown, the next few stops, what is still unpaid,
how far the packing has got, and what is left to settle. Splitting the two is
the difference between a screen you can read at a glance and one you have to
work through.

    🌎 Kyoto & Osaka                        Friends Trip · Planning
    DURATION   MEMBERS   BUDGET       SPENT     REMAINING
    11 days    4         RM 12,000    RM 610    RM 11,390

**Nothing here does its own arithmetic.** The spend comes from the same
`spentOf` the Budget screen uses, the shares from the same `balances` the
Settlement is worked out from, the plan from the same `plannedOf`. A dashboard
that adds things up its own way is a dashboard that will eventually disagree
with the app, and the app will be right.

### Expense breakdown

By **expense category**, sorted by size, as a stacked bar with a row per slice
under it:

    🏨 Accommodation   RM 1,200   37%
    ✈️ Transport         RM 650   20%
    🍜 Food              RM 580   18%
    …
       Unspent           RM 720   18%

Rows rather than a legend: a legend answers *which colour is which*, and these
answer *how much and what share*, which is the question somebody opened the
card with. The bar is drawn against the budget where there is one, so the empty
part of the track is money still unspent rather than dead space.

This used to be grouped by itinerary kind — travel, stay, food — which was the
only grouping the app had before there was a ledger. Grouping money by the
shape of the plan rather than by what it was spent on answered a question
nobody was asking.

### Useful statistics

    Total spending      Average a day       Highest expense
    Highest category    Budget used         Planned vs actual
    Cost per person     Spending by person

**Average a day is over the days money was actually spent**, not over the
length of the trip. Three days into a ten-day trip, a ten-day average reads as
though everything is going well when it has barely started.

**Spending by person is a share, not what they paid.** Who paid is a matter for
the Settlement; what somebody *used* is what the split already decided, and
that is the honest answer to "whose money was this".

**Planned vs actual** compares what the itinerary priced against what the
ledger recorded, and says which way the gap runs.

### Event analytics

    Company CSR Event
    BUDGET      ACTUAL      PARTICIPANTS   ATTENDANCE   COST / PERSON
    RM 2,500    RM 2,400    25             22           RM 109.09

Only for an event or an activity — on a trip everybody is coming, so attendance
is not a question and a card asking it is furniture.

**Cost per person is over the people who came**, not the people who signed up:
the three who did not turn up are not what it cost. Before anybody is marked
attended, the roster is the best answer there is, and the card says which one
it used.

## Convert

One screen, one question: *if I change this much at this rate, what do I get?*

Pick two currencies, type the rate, type an amount. The rate is always written
one way round — `1 MYR = 6,500 VND` — the way a board writes it, and the
direction switch decides which way you are changing. Re-quoting the rate upside
down when the direction flips is how people end up dividing when they meant to
multiply. Underneath sits the inverse rate (the one nobody can do in their
head) and a ladder of round amounts, for standing at a counter holding a note.

**The rate is typed, never fetched.** The number on the board in front of you is
the rate you are getting; the mid-market rate an API returns is a number nobody
will ever give you. There are no balances and no history — this is a
calculator, not a foreign-currency account.

*Use this rate for the trip* pins it, and from then on the rest of the app reads
foreign amounts through it.

## Multiple currencies, everywhere else

Each trip has a **home currency** — what its budget and every total are stated
in. Each cost keeps the currency it was actually paid in.

**An original amount is never replaced.** A 3,800 yen train fare is stored as
3,800 JPY and displayed as 3,800 JPY, with `≈ RM 115.15` set smaller underneath
it. The conversion is a convenience; the yen is the fact.

Rates live on the trip, and the Budget screen lists one row per foreign
currency the trip actually has money in — not the whole list, because a rate
for a currency nothing is priced in is a field asking to be filled in for no
reason. Change a rate and every total re-reads. Nothing stored is rewritten.

**A currency with no rate counts as nothing**, and says so. Silently adding
50,000 won to a ringgit total as though it were 50,000 ringgit is the one wrong
answer worse than a gap, so an unrated amount shows *rate not set* and the
Budget screen says how many rates are still needed.

All 166 currencies the rate service quotes, with the ones a trip from here
actually uses pinned to the top of every picker. Yen, won and dong have no
minor unit, so they are never printed with decimals — `6,500,000.00
VND` is how you make a real figure look like a spreadsheet error.

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
out, so a budget cannot drift by a fraction of a cent. Every amount is stored
alongside the currency it was paid in, and conversion happens at display and
summing time only — never on the way into storage. Dates are plain
`YYYY-MM-DD` strings — they sort and compare correctly as text and never pick
up a timezone. The one place a real `Date` is built, it is built at noon so a
shift either way cannot roll it into the day before.

## Data

Everything lives under one key, `plansphere.v2`:

    { trips: [], stops: [], books: [], packs: [], events: [], cats: [],
      types: [], notes: [], spend: [], spendCats: [], docs: [], roles: [],
      settle: [], homeCountry: 'MY', current: <tripId> }

`trips` holds all three kinds — trip, event and activity — each tagged with
`kind`. `types` holds the trip and event type lists, each row tagged with the
scope it belongs to. A cover image is a resized JPEG data URL on the record.

A stop in `stops` carries `time`/`end` (duration is worked out from them),
`status`, `desc`, `note`, an `att` attachment, and its actual cost as either
`from` — the id of the expense record to read it off — or `actual`/`actualCur`
typed by hand. A row in `notes` carries a `type`, an optional `date` pinning it
to a day, a `body`, a list of `links` and a list of `atts`.

A row in `spend` carries a `ref`, a `cat`, an `amount`/`cur`, `by` — the id of
whoever paid — `who`, `split` and `parts` for the division, a `receipt`, a list
of `atts`, and `stop` when it is against a schedule item. The people it points
at live on the trip, as `people` — each with a name, phone, email, `role`
into `roles`, `status` and a note.

A row in `docs` carries a `kind`, a `title`, an optional `date`, the `file`
itself, the `text` the reader got off it, and `stop`/`spend` where it is tied
to one.

`settle` holds only what has been handed over — a `from`, a `to`, the amount
`paid` and whether the pair was `cancelled`. The transfers themselves are
worked out from the expenses and never stored.

A trip's budgets live on the trip: `budget` for the whole of it, `headBudget`
per person, `dayBudget` per day, and `catBudget` as a map of category id to
amount. All four are optional, and an absent one is a question not being asked.

Public holidays are cached under `plansphere.holidays.v1`, one entry per
country and year, so they survive going offline.

Today's mid-market rates are cached separately under `plansphere.fx.v1` — one
base, all 160-odd currencies, fetched once a day and crossed for every pair, so
switching currencies never needs the network. It is deliberately outside the
export: it is disposable, and it would only go stale in the file.

**Export** writes that blob to a file. **Import** replaces what is on the
device with it, after asking. Deleting a trip takes its stops, bookings,
expenses, documents, notes and packing list with it — also after asking.

Photographs are the one thing that can fill this store, so every image the app
takes in — trip covers, stop attachments, note files, receipts and scans — goes
through one reader that redraws it at a sensible width and re-encodes it as a
JPEG first. A 12 MP phone photograph lands at a few tens of kilobytes.

**First run is empty.** There is no demo trip: the app opens on Home saying so,
and every screen below it says what has to exist before it can do anything.
Create New on Trips & Events is the only thing that works on a blank store,
which is the point.

The store key is `plansphere.v2`. Opening the app clears `plansphere.v1`, the
key everything was written under while the modules were being built — the
shape changed under it often enough that carrying one forward would have meant
guessing at what half its rows meant.

A store written before the three kinds existed opens without trouble: a row
that says nothing about its kind is a trip, its status is read off its dates
once, and the default type lists are filled in. A stop with no status is
planned, a trip with no `people` has none, a person with no status is
registered, and the expense categories and the roles fill in the same way the
calendar's categories do.
