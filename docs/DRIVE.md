# Keeping a copy in Google Drive

PlanSphere works with no account and no network. Everything lives in your
browser, and it is fully usable if you never read this page.

Drive is the **second** copy: the one that survives a cleared browser, and the
one you can pull down onto another machine or a phone. It is off until you set
up a client ID, and even then nothing leaves the browser until you press a
button.

    ☁  [ Auto | To Drive | From Drive ]   [ Export | Import ]

---

## What it can and cannot reach

The scope is **`drive.file`** — access to files *this app itself created*, and
nothing else. PlanSphere cannot read your other documents, cannot list your
Drive, and cannot see a file you dragged into the folder by hand.

That is deliberate, and it is also why this needs no review from Google. The
wider `drive` scope is the one that puts an app in front of a review process,
and none of it is needed to write your own trips into your own folder.

**Never widen it.**

---

## Setting it up, once

**[docs/SETUP-GOOGLE.md](SETUP-GOOGLE.md) is the click-by-click version.** The short form:

You need a Google Cloud project with an OAuth client ID. If you already made
one for the **Google Calendar** feature (`docs/GOOGLE.md`), you are done —
`drive-config.js` ships pointing at it, because Drive and Calendar are the same
app on the same origin. Google asks for each permission separately as it is
first needed, so sharing the client does not widen anything.

If you have not:

1. **console.cloud.google.com** → create a project, or pick one.
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen** → External, fill in the app name
   and your email, add yourself under **Test users**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID →
   Web application.**
   - Under **Authorised JavaScript origins**, add the address you actually open
     the app on — scheme and host, **no path**:

         http://localhost:5173

     If you publish it, add that origin too.
5. Copy the client ID (it ends in `.apps.googleusercontent.com`) and paste it
   into `gcal-config.js`.

There is no client **secret** in any of this. The browser flow does not use
one, and Google does not issue one for this client type. If you find yourself
pasting something labelled "secret", stop — you made the wrong kind of
credential.

### The folder

`drive-config.js` already holds the folder ID from the Drive URL:

    https://drive.google.com/drive/folders/13jmiN8PIdm0pRVr2RjfVM3rgD2I3jyjd?usp=sharing
                                           └──────────── this ────────────┘

Change it to point somewhere else if you like. **Keep the folder Restricted**
in Drive's Share settings — "Anyone with the link" means anyone with the link
can read every trip, every receipt and every name in your backup.

### The origin, not the address

Published, PlanSphere lives at `https://kaonhew02.github.io/PlanSphere/`. The
origin Google wants registered is **`https://kaonhew02.github.io`** — scheme
and host, no path. MoneyFlow and FinSim share that origin, so a client ID that
already works for either of them already works here.

### `file://` will not work

Google will not issue a token to a page opened by double-clicking
`index.html`, because `file://` has no origin to register. Run `node serve.js`
and open `http://localhost:5173`, or publish it. Everything else — including
Export and Import — works either way.

---

## The three Drive buttons

**To Drive** writes the whole store to one file, `plansphere-data.json`,
creating it the first time and updating it after. It is exactly what Export
writes, so a file from one can be fed to the other.

**From Drive** replaces what is in this browser. It says what is in both copies
and when Drive's was last written before it asks, and it never merges — two
disagreeing copies of the same trip is a worse answer than one.

**Auto** is off by default, and has to be: the promise of this
file is that nothing leaves the browser unless somebody presses a button. Once
on, two rules keep it from being obnoxious:

- **It never opens a sign-in window.** A popup nobody asked for gets blocked,
  and one that is not blocked is worse. If the token has lapsed it stands down
  and the cloud in the toolbar goes red, which is the signal to press *To
  Drive* once.
- **It waits a minute after you stop changing things**, so an evening of
  planning is one write rather than a hundred.

Auto cannot make the *first* copy on its own — Google only signs anyone in when
they ask it to. Press **To Drive** once and it takes over from there.

---

## The cloud in the toolbar

    (nothing)   no copy has been sent from this browser, and auto is off
    ☁✓          in Drive, within the last week — hover for the date
    ☁⃠           worth pressing To Drive: over a week old, or auto is on
                with nothing sent yet

Silence is the correct report for "fine". A status you have to read every time
you glance at a toolbar is a tax on nothing — words appear only when something
needs pressing, and the full sentence is in the Data panel.

---

## If something goes wrong

| What it says | What it means |
| --- | --- |
| *Drive is not set up yet* | No client ID. Everything above. |
| *The Google sign-in window could not open* | A pop-up blocker. Allow pop-ups for this address. |
| *Google’s sign-in library did not load* | No network, or an extension blocking `accounts.google.com`. |
| *Google allowed the sign-in but refused the folder* | The folder ID is not a folder this account can edit. |
| *That folder no longer exists* | It was deleted, or belongs to another account. |
| *That Drive file is not readable* | Something else is called `plansphere-data.json` in the folder. Rename it and press To Drive. |

Export still works in every one of these cases, and a file it writes is the
same file Drive holds.
