# Google Cloud, step by step

One walkthrough for both Google features — the **Drive backup** and the
**Calendar push**. They share a project and a client ID, so this is done once.

Nothing here is urgent. PlanSphere works with no account and no network, and
Export/Import already keeps your data safe in a file. This adds a copy in
Drive and a way onto another machine.

**Time:** about ten minutes, once.
**Cost:** nothing. None of this touches billing.

---

## You may already be done

PlanSphere is published at <https://kaonhew02.github.io/PlanSphere/>, and so
are MoneyFlow and FinSim. **All three are one origin** — `kaonhew02.github.io`
— because a `github.io` account is a single host and the project name is only
a path.

So the OAuth client MoneyFlow and FinSim already use is registered against the
origin PlanSphere is served from. Paste it into `gcal-config.js` and the Drive
backup works with no console visit at all:

    677364267902-ql4f9kn6msra9ahl6e9co8jhh2vobiaq.apps.googleusercontent.com

Two things to know if you take that route:

- **The Calendar push needs one more click.** The Drive API is already on in
  that project; the Calendar API is not. Turn it on — step 2 below, in project
  `677364267902`.
- **`http://localhost:5173` is probably not on that client.** Add it under
  Authorised JavaScript origins if you also want Drive working while you
  develop locally — step 4 below.

Making PlanSphere its own client is tidier bookkeeping and takes five minutes.
It changes nothing a person sees: the name in the sign-in window comes from the
project's consent screen, not from the client, so all three apps show the same
one either way. Everything below is how.

---

## Before you start

Have these two things open:

- The folder you want the backup in. Yours is
  <https://drive.google.com/drive/folders/13jmiN8PIdm0pRVr2RjfVM3rgD2I3jyjd> —
  already filled into `drive-config.js`.
- **The origin you open PlanSphere on**, which is not the same as the address:

    | Where you open it | The origin to register |
    | --- | --- |
    | `https://kaonhew02.github.io/PlanSphere/` | `https://kaonhew02.github.io` |
    | `http://localhost:5173` | `http://localhost:5173` |

  Scheme and host **only**. `/PlanSphere` must not be in it — Google rejects an
  origin with a path, and this is the single most common way to get stuck.

> **`file://` will not work.** A page opened by double-clicking `index.html`
> has no origin for Google to check, and Google will not issue a token to it.
> Use the published address, or `node serve.js`. Everything else in the app
> works either way.

---

## Step 1 — Make a project

1. Go to <https://console.cloud.google.com/>.
2. Sign in with the Google account whose Drive you want the backup in.
3. At the top, next to the Google Cloud logo, click the **project dropdown**.
4. **New Project** (top right of the dialog).
5. Name it something you will recognise in a year — `PlanSphere` will do.
   Leave "Location" as **No organisation**.
6. **Create**, then wait a few seconds and **make sure the project dropdown now
   says your new project**. This is the single most common thing to get wrong:
   enabling an API in the wrong project looks like it worked and then does not.

*Already have a project from MoneyFlow or FinSim? Use it. Skip to step 2.*

---

## Step 2 — Turn on the two APIs

An API is off by default in a new project, even for you.

1. Left menu → **APIs & Services** → **Library**.
2. Search **Google Drive API** → click it → **Enable**.
3. Back to **Library**, search **Google Calendar API** → click it → **Enable**.

You only need the Drive one if all you want is the backup. Enabling both now
saves coming back.

---

## Step 3 — Fill in the consent screen

This is the window Google shows *you* when the app asks for permission. It has
to exist before a client ID can.

1. **APIs & Services** → **OAuth consent screen**.
2. User type: **External**. → **Create**.
   (*Internal* is only offered on Workspace accounts and would be fine there
   too.)
3. **App name:** `PlanSphere`.
   **User support email:** your own address, from the dropdown.
   **Developer contact information:** your own address again, at the bottom.
   Everything else can stay empty. → **Save and continue**.
4. **Scopes** — click straight past with **Save and continue**. Do *not* add
   scopes here. The app asks for what it needs at the moment it needs it, and
   scopes listed here are what trigger Google's review process.
5. **Test users** → **+ Add users** → type your own Google address → **Add**
   → **Save and continue**.

   **Do not skip this.** Without yourself on that list, sign-in fails with
   *"access blocked"* and it is not obvious why.
6. **Back to dashboard.** Leave the app in **Testing**. You never need to
   publish it or submit anything for review — that is only for apps other
   people use.

> Google re-labels these pages every so often. If the wording has moved on,
> you are looking for: External, an app name, your email, test users. The
> shape is the same.

---

## Step 4 — Make the client ID

1. **APIs & Services** → **Credentials** → **+ Create credentials** → **OAuth
   client ID**.
2. **Application type: Web application.** (Not Desktop. Not "Other". Web.)
3. **Name:** `PlanSphere web` — this is only for your own reference.
4. **Authorised JavaScript origins** → **+ Add URI**. Add both:

       https://kaonhew02.github.io
       http://localhost:5173

   Scheme and host **only** — **no path**, no trailing slash, and the port must
   match. `https://kaonhew02.github.io/PlanSphere` is rejected; the bare host
   is what Google wants, and one entry covers every app published under it.
5. **Authorised redirect URIs** → leave **completely empty**. This flow does
   not use one, and adding one does nothing but confuse a later reading.
6. **Create.**
7. A dialog shows **Your Client ID**, ending in
   `.apps.googleusercontent.com`. Copy it.

There is **no client secret** in any of this. The dialog may show one; ignore
it. The browser flow does not use it, and nothing in PlanSphere has a field
for it. If you ever find yourself pasting something labelled "secret" into a
config file, stop — you have made the wrong kind of credential.

---

## Step 5 — Paste it in

Open `gcal-config.js` and replace the placeholder:

```js
const PS_GCAL = {
    clientId: '1234567890-abcdefg.apps.googleusercontent.com',   // ← yours
    calendarName: 'PlanSphere',
};
```

That one value covers **both** features. `drive-config.js` ships set to
`'SAME-AS-CALENDAR'`, which means "use the one in `gcal-config.js`" — Drive and
Calendar are the same app on the same origin, and Google asks for each
permission separately as it is first needed, so sharing the client does not
widen anything.

Set `drive-config.js`'s own `clientId` only if you want the two grants to stand
apart — that would be a second OAuth client in the same project, made the same
way.

---

## Step 6 — Try it

1. Reload PlanSphere.
2. **To Drive** in the top bar.
3. Google asks you to pick an account, then to allow **See, edit, create and
   delete only the specific Google Drive files you use with this app**.
   That wording is the `drive.file` scope doing its job — it is the narrow one.
4. Allow. The button flashes **In Drive**, and a cloud with a tick appears at
   the left of the toolbar.
5. Check the folder in Drive. There should be one file:
   `plansphere-data.json`.

For the Calendar side: **Calendar** screen → **Send to Google Calendar**.

---

## What each permission can reach

| Feature | Scope | What it can touch |
| --- | --- | --- |
| Drive backup | `drive.file` | Only files this app itself created. It cannot read your other documents and cannot list your Drive. |
| Calendar push | `calendar.app.created` | Only calendars this app itself made. It cannot see or change your existing ones. |

Both are the narrow versions, deliberately. They are also why none of this
needs review from Google — the wider `drive` and `calendar` scopes are what
put an app in front of that process.

**Never widen them.**

---

## When it goes wrong

| What you see | What it is |
| --- | --- |
| **"Error 400: redirect_uri_mismatch"** or *"origin is not allowed"* | The origin is not in **Authorised JavaScript origins**. Check for a path: it is `https://kaonhew02.github.io`, never `…/PlanSphere`. Also check `http` vs `https` and the port. |
| **"Access blocked: this app has not completed verification"** | Your account is not in **Test users** (step 3.5). Add it. |
| **"Drive is not set up yet"** | The client ID in `gcal-config.js` is still the placeholder, or has a stray space. |
| **"The Google sign-in window could not open"** | A pop-up blocker. Allow pop-ups for the address. |
| **"Google's sign-in library did not load"** | No network, or an extension blocking `accounts.google.com`. |
| **"Google allowed the sign-in but refused the folder"** | The folder ID in `drive-config.js` is not a folder this account can edit. |
| **"That folder no longer exists"** | Deleted, or it belongs to a different Google account than the one you signed in with. |
| Nothing happens at all | Open the browser console (F12). If it says `google is not defined`, the library did not load. |

Changes to origins in the Cloud console can take a minute or two to take
effect. If the origin looks right and it still fails, wait and try once more
before changing anything.

---

## Turning it off

- **Stop the automatic push:** Data → *Send automatically: off*.
- **Revoke the permission:** <https://myaccount.google.com/permissions> →
  PlanSphere → Remove access.
- **Delete the copy:** delete `plansphere-data.json` from the Drive folder.
- **Delete the whole thing:** delete the project in the Cloud console.

Nothing in PlanSphere depends on any of it. The browser is the real store; the
folder is a copy.

---

## Keeping the folder private

Open the folder in Drive → **Share** → **General access** → **Restricted**.

"Anyone with the link" means anyone with the link can read every trip, every
receipt photo, every name and every amount in your backup. The folder ID in
`drive-config.js` is not a secret and does not need to be — but the folder's
sharing setting is what actually protects it.
