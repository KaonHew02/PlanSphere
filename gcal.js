/**
 * ====================================================================
 * PlanSphere — pushing the plan into Google Calendar
 * --------------------------------------------------------------------
 * localStorage stays the working store. This is a *copy*, pushed one way,
 * into a calendar of PlanSphere's own making. The app is fully usable if
 * this file never loads at all, and everything it does is also achievable
 * with "Add to phone calendar" and an import.
 *
 * On scope: it asks for `calendar.app.created`, which grants access only
 * to calendars this app itself made. It cannot read your existing
 * calendars, cannot list them, and cannot touch an appointment it did not
 * put there. That is deliberate — the wider Calendar scopes are what put
 * an app in front of Google's review process, and none of them are needed
 * to write your own trips into your own phone.
 *
 * One way, on purpose. Two-way sync means conflict resolution, deletion
 * tracking and a story for "which side wins", and none of that earns its
 * complexity for a planner whose truth lives in one browser.
 * ====================================================================
 */

(() => {

    const SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';
    const API = 'https://www.googleapis.com/calendar/v3';
    const CAL_KEY = 'plansphere.gcal.v1';

    const cfg = (typeof PS_GCAL !== 'undefined') ? PS_GCAL : null;

    const configured = () => !!cfg
        && !!cfg.clientId
        && !/YOUR-CLIENT-ID/i.test(cfg.clientId);

    let token = null;
    let tokenExpires = 0;
    let tokenClient = null;
    let calendarId = null;
    let busy = false;

    const valid = () => token && Date.now() < tokenExpires - 60000;

    try { calendarId = localStorage.getItem(CAL_KEY) || null; } catch (err) { calendarId = null; }

    /* ------------------------------------------------------------------ *
     * Signing in
     * ------------------------------------------------------------------ */

    /**
     * Google's library comes from their CDN via a tag in index.html. If it
     * did not arrive, every button here has to fail with something a person
     * can act on rather than `google is not defined`.
     */
    function library() {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
            throw new Error('Google’s sign-in library did not load. Check the connection, '
                + 'or whether an extension is blocking accounts.google.com.');
        }
        return google.accounts.oauth2;
    }

    function authorize() {
        return new Promise((resolve, reject) => {
            if (valid()) return resolve(token);
            const oauth2 = library();

            if (!tokenClient) {
                tokenClient = oauth2.initTokenClient({
                    client_id: cfg.clientId,
                    scope: SCOPE,
                    callback: () => {},
                });
            }

            tokenClient.callback = (response) => {
                if (response.error) {
                    /* Cancelling is a decision, not a fault. */
                    if (/access_denied|user_cancel/i.test(response.error)) {
                        return reject(new Error('Sign-in was cancelled, so nothing was sent.'));
                    }
                    return reject(new Error('Google refused the sign-in: ' + response.error));
                }
                token = response.access_token;
                tokenExpires = Date.now() + (Number(response.expires_in || 3600) * 1000);
                resolve(token);
            };

            tokenClient.error_callback = (err) => {
                reject(new Error(err && err.type === 'popup_closed'
                    ? 'The Google sign-in window was closed before it finished.'
                    : 'The sign-in window could not open. Allow pop-ups for this site and try again.'));
            };

            tokenClient.requestAccessToken({ prompt: '' });
        });
    }

    /* ------------------------------------------------------------------ *
     * Talking to Calendar
     * ------------------------------------------------------------------ */

    /**
     * Every call goes through here. A 401 means the token went stale
     * mid-flight, which is normal after an hour and is worth exactly one
     * silent retry rather than an error in somebody's face.
     */
    async function call(path, opts, retried) {
        await authorize();
        const res = await fetch(API + path, Object.assign({}, opts, {
            headers: Object.assign({
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json',
            }, (opts && opts.headers) || {}),
        }));

        if (res.status === 401 && !retried) {
            token = null;
            return call(path, opts, true);
        }
        return res;
    }

    /** The calendar PlanSphere owns, found once and remembered. */
    async function ourCalendar() {
        if (calendarId) {
            const check = await call('/calendars/' + encodeURIComponent(calendarId), { method: 'GET' });
            if (check.ok) return calendarId;
            /* Deleted in Google, or made by a different client id. Start again. */
            calendarId = null;
        }

        const made = await call('/calendars', {
            method: 'POST',
            body: JSON.stringify({
                summary: cfg.calendarName || 'PlanSphere',
                description: 'Trips, itineraries and activities from PlanSphere.',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }),
        });

        if (!made.ok) throw new Error('Google would not create the calendar (' + made.status + ').');
        calendarId = (await made.json()).id;
        try { localStorage.setItem(CAL_KEY, calendarId); } catch (err) { /* remembered for this session only */ }
        return calendarId;
    }

    /**
     * Google's event ids allow only lowercase a–v and 0–9, which our own ids
     * are not. Hex covers the whole alphabet Google accepts, so the id is
     * simply the source string written out in hex — reversible, collision
     * free, and stable across runs so a second push updates rather than
     * duplicates.
     */
    const gid = (it) => 'ps' + Array.from(it.src + it.id)
        .map((ch) => ch.charCodeAt(0).toString(16).padStart(2, '0')).join('');

    function body(it) {
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const allDay = it.span || !it.time;

        const when = allDay
            ? {
                start: { date: it.date },
                end: { date: shiftDate(it.span ? it.until : it.date, 1) },
            }
            : {
                start: { dateTime: it.date + 'T' + it.time + ':00', timeZone: zone },
                end: { dateTime: it.date + 'T' + (it.end || it.time) + ':00', timeZone: zone },
            };

        const out = Object.assign({
            id: gid(it),
            summary: catOf(it.cat).mark + ' ' + it.title,
        }, when);

        /* Yearly entries go over as one recurring event, the same way
           they leave in the .ics — Google keeps the rule and draws the years
           itself, so a birthday does not arrive four times. */
        if (it.repeat === 'year') out.recurrence = ['RRULE:FREQ=YEARLY'];

        if (it.where) out.location = it.where;
        if (it.note) out.description = it.note;

        if (it.src === 'event' && it.remind !== '' && it.remind != null && it.time) {
            out.reminders = { useDefault: false, overrides: [{ method: 'popup', minutes: Number(it.remind) }] };
        }

        return out;
    }

    /** Insert, and fall back to update when Google says it already has one. */
    async function upsert(cal, it) {
        const payload = body(it);
        const made = await call('/calendars/' + encodeURIComponent(cal) + '/events', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (made.ok) return 'added';
        if (made.status !== 409) {
            const detail = await made.text();
            throw new Error('Google rejected "' + it.title + '" (' + made.status + '). ' + detail.slice(0, 120));
        }

        const changed = await call('/calendars/' + encodeURIComponent(cal) + '/events/' + payload.id, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        if (!changed.ok) throw new Error('Google would not update "' + it.title + '" (' + changed.status + ').');
        return 'updated';
    }

    /* ------------------------------------------------------------------ *
     * The button
     * ------------------------------------------------------------------ */

    async function push() {
        if (busy) return;
        busy = true;
        paint();

        try {
            const cal = await ourCalendar();

            /* Holidays are left out for the same reason they are left out of
               the .ics: Google already knows them, and its own holiday
               calendar would end up doubled. */
            const items = calItems().filter((it) => it.src !== 'holiday' && !it.rep);

            let added = 0;
            let updated = 0;
            for (const it of items) {
                const what = await upsert(cal, it);
                if (what === 'added') added++; else updated++;
            }

            toast('Sent to your <b>' + esc(cfg.calendarName || 'PlanSphere') + '</b> calendar · '
                + added + ' added, ' + updated + ' updated.',
                { label: 'Open', run: () => window.open('https://calendar.google.com/', '_blank', 'noopener') });
        } catch (err) {
            toast('<b>Google Calendar:</b> ' + esc(err.message || String(err)));
        } finally {
            busy = false;
            paint();
        }
    }

    function paint() {
        const btn = document.getElementById('calGoogle');
        if (!btn) return;
        btn.hidden = !configured();
        btn.disabled = busy;
        btn.classList.toggle('is-loading', busy);
        const label = btn.querySelector('span');
        if (label) label.textContent = busy ? 'Sending…' : 'Send to Google Calendar';
    }

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('calGoogle');
        if (btn) btn.addEventListener('click', push);
        paint();
    });

})();
