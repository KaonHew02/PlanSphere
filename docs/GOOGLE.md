# Sending PlanSphere into Google Calendar

Five minutes of clicking, once. Until it is done the button stays hidden and
everything else — including **Add to phone calendar** — works exactly as it
does now.

## What you are making

An **OAuth client ID**: a public name for this copy of PlanSphere, which lets
Google ask *you* whether it may write your calendar. It is not a secret and it
is safe to keep in `gcal-config.js`.

## Steps

**[docs/SETUP-GOOGLE.md](SETUP-GOOGLE.md) walks through every click, and covers the Drive backup at the same time.** The short form:

1. Open <https://console.cloud.google.com/> and pick a project, or make one.
   If you already have the project MoneyFlow's Drive backup uses, reuse it.
2. **APIs & Services → Library** → search *Google Calendar API* → **Enable**.
3. **APIs & Services → OAuth consent screen**. Pick **External**, fill in an
   app name and your own email. Under **Test users**, add your own Google
   account. You do not need to publish it or submit anything for review.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorised JavaScript origins: `https://kaonhew02.github.io` for the
     published copy, and `http://localhost:5173` for `node serve.js`. Scheme
     and host only — **no path**, so not `…/PlanSphere`.
   - **Do not** add a redirect URI. This flow does not use one.
5. Copy the client ID — it ends in `.apps.googleusercontent.com` — and paste
   it into `gcal-config.js`.
6. Reload PlanSphere. **Send to Google Calendar** appears in the Calendar
   screen's header.

## What it does

- Makes one calendar called **PlanSphere** in your account, and writes only to
  that. Your existing calendars are not touched, and cannot be: the permission
  asked for is `calendar.app.created`, which covers *only calendars this app
  made*. It cannot even list the others.
- Pushes trips as multi-day blocks, itinerary stops at their times, bookings on
  their dates and every activity with its reminder.
- Pushing again **updates** rather than duplicates — each entry keeps a stable
  id derived from its own.
- Public holidays are left out. Google already has them, and yours would end up
  doubled.

## Turning it off

Delete the PlanSphere calendar in Google Calendar, and remove this app at
<https://myaccount.google.com/permissions>. Nothing in PlanSphere depends on
it: the local store is the real one.

## If the button does not appear

- The client ID is still the placeholder, or has a typo.
- `accounts.google.com` is blocked by an extension.

## If sign-in fails

- *"origin is not allowed"* — the address in the browser bar does not match an
  Authorised JavaScript origin. They must match exactly, port included.
- *"access blocked"* — your account is not on the Test users list from step 3.
