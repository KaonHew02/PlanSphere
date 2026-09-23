# Security

## "Can somebody read the code, or change the page from the console?"

They can try, and the page now makes it hard. No web page can make it
impossible, and it does not put your trips at risk either way.

**Reading the code cannot be prevented.** A browser has to download a script
before it can run it, so View Source or a plain `curl` will always show exactly
what the page runs. The repository is public on GitHub too, because that is
what GitHub Pages serves.

**Changing the page from the console only changes that person's tab.**
PlanSphere has no server and no shared database. Each browser holds its own
records, in its own IndexedDB. A friend who edits the page, or runs code in
their console, is editing *their own copy*. None of it reaches your browser,
your records, or your Drive folder.

**What the page does about it anyway** (the TAMPER GUARD section of
`app.js`):

- **Nothing to grab.** All of `app.js` runs inside one function, so the
  records and everything that writes them (`db`, `save()`, `PSStore`) do not
  exist as names in the console. Drive and Calendar get a frozen `PSApp` of
  read-only copies. Its one write, replacing everything with the Drive copy,
  only works during a real click.
- **Only real input counts.** A click, a keystroke or a typed value made by a
  script (`el.click()`, `dispatchEvent()`) is dropped before any handler sees
  it. So pasted code cannot press buttons or fill in forms either.
- **On the published site:** F12, Ctrl+Shift+I/J/C/K, Cmd+Option+I/J/C and
  Ctrl+U are switched off. So is the right-click menu, except in text fields
  and on touch screens. The page hides itself while the developer tools are
  open. The console warns anybody who has been told to paste something into
  it, which is the attack that works on people.
- **On localhost** the published-site measures stay off, so the app can
  still be worked on.

These are speed bumps, not locks. A programmer can still open the developer
tools from the browser menu, tell the debugger to skip the pause, or turn
JavaScript off. That is acceptable: all it gets them is a changed copy of
*their own* data, on their own screen. The locks that protect *your* data
are the ones below.

---

## What could actually reach you, and what stops it

| Route in | What could go wrong | What stops it |
| --- | --- | --- |
| **A backup file** somebody sends you (Import) | A name, an icon, a link or a date is written so that it becomes markup or script when the page draws it | `psClean` in `app.js` checks every record on the way in; `esc()` escapes every value where it is drawn; the Content Security Policy refuses to run any script that was not loaded from an allowed file |
| **The Drive file** (From Drive) | The same, if anyone else can write to the folder | The same three. Also: keep the folder **Restricted** |
| **A link in a note** | `javascript:…` runs when clicked | Only `http`/`https` ever become a link (`safeUrl`); the policy blocks `javascript:` URLs as well |
| **An email address** | `you@x.com?bcc=…` adds recipients to the mail it opens | Only a plain address becomes a `mailto:` link; anything else is shown as text |
| **An attachment** | A disguised file name, e.g. a right-to-left mark that makes an `.exe` look like a `.pdf` | Control and direction characters are removed from the name before download |
| **A currency code** | `../../somewhere` makes the rate lookup fetch a different file | Only codes in the app's own list are ever sent (`knownCur`) |
| **The other apps on `kaonhew02.github.io`** | MoneyFlow and FinSim share this origin, and so share localStorage and IndexedDB | The holiday and rate caches are checked on load, and so is the store itself. See below: this one is only partly fixable in code |
| **Crafted data that crashes the app** | A date that is a number, or an id called `constructor`, throws on every start, so you cannot even open Import to fix it | `psClean` forces each field into its expected type, and the lookup tables only answer to keys they actually hold (`own`) |
| **The CDN** | A new release of a library on jsDelivr runs in this page | Versions are pinned exactly. The OCR reader and the icon stylesheet also carry an integrity hash, and the browser refuses to run any other file |

`psClean` is deliberately the second lock, not the first. Every value is still
escaped where it is drawn, and anything that slips past both is still stopped
by the policy.

---

## The things only you can do

These live outside the code, and they matter more than anything in it.

1. **Protect the GitHub account.** The repository *is* the published app, so
   anyone who can push to it can change PlanSphere for everyone. Turn on
   two-factor authentication. Do not add collaborators you would not hand
   your trips to.
2. **Keep the Drive folder Restricted.** "Anyone with the link" means anyone
   with the link can read every trip, every receipt, and every name in it.
3. **Keep the OAuth client's "Authorised JavaScript origins" to the two you
   use:** `https://kaonhew02.github.io` and `http://localhost:5173`. Never put
   a client secret anywhere in this repository. See
   [`SETUP-GOOGLE.md`](SETUP-GOOGLE.md).
4. **Think of the shared origin as one app.** MoneyFlow, FinSim and
   PlanSphere all run on `kaonhew02.github.io`. A security bug in any of them
   can read the storage of all three. To separate them for good, give
   PlanSphere its own origin: a custom domain, or a GitHub Pages site under
   an account of its own.
5. **Only import backups you expect.** A crafted file can no longer run
   anything, but Import still *replaces* everything in this browser. It
   always asks first, and Export beforehand costs nothing.

---

## Keeping it that way

**The Content Security Policy** is the `<meta http-equiv>` tag at the top of
`index.html`. If you add a script, a stylesheet, a font or an API from a new
host, add that host to the matching line. The browser console names the
directive whenever something is blocked. Never add `'unsafe-inline'` or
`'unsafe-eval'` to `script-src`: those two words switch off most of what the
policy does. GitHub Pages cannot send response headers, so
`frame-ancestors` (which stops other sites from framing the page) is not
available here.

**The pinned libraries** are three constants and one link:

| What | Where | When to move it |
| --- | --- | --- |
| `date-holidays@3.37.0` | `HOL_CDN` in `app.js` | Once a year. Next year's holidays arrive in new releases |
| `tesseract.js@5.1.1` + `OCR_SRI` | `OCR_CDN` in `app.js` | Rarely. Recompute the hash when you move it |
| `bootstrap-icons@1.11.3` + `integrity` | the `<link>` in `index.html` | When you want new icons. Recompute the hash when you move it |

To recompute a hash:

    curl -sL <the exact URL> | openssl dgst -sha384 -binary | openssl base64 -A

and put `sha384-` in front of the result. If the hash is wrong, that library
does not load at all. That is the point: fail closed rather than run
something unexpected.

**New fields in the store** usually need nothing: anything that is text
gets escaped by `esc()` where it is drawn. If a new field goes into an
attribute, a URL, a CSS value, or a lookup-table key, give it a rule in
`cleanString` in `app.js`, and check it the way the rules already there
are checked.
