/**
 * PlanSphere — who is allowed to write your Google Calendar.
 *
 * This value is safe to publish, and it is meant to be. An OAuth client ID is
 * not a secret — it only names the app. Google will not hand it a token
 * without you signing in and agreeing, and it only works from the web
 * addresses you registered against it.
 *
 * What must NEVER go in here is a **client secret**. The browser flow this
 * app uses does not need one and Google does not issue one for this client
 * type. If you find yourself pasting something labelled "secret", stop — you
 * have made the wrong kind of credential.
 *
 * Setup is about five minutes of clicking, once. See docs/GOOGLE.md.
 *
 * Until this is filled in, the Google button stays out of the way and
 * everything else — including "Add to phone calendar" — works as normal.
 */

const PS_GCAL = {

    /**
     * Google Cloud → APIs & Services → Credentials → OAuth client ID
     * (Web application). It ends in `.apps.googleusercontent.com`.
     *
     * Register the **origin** you open the app on under "Authorised
     * JavaScript origins" — scheme and host, no path:
     *
     *     https://kaonhew02.github.io      the published copy
     *     http://localhost:5173            `node serve.js`
     *
     * PlanSphere's own client, in its own Google Cloud project. MoneyFlow
     * and FinSim are published under the same origin and would have worked
     * with theirs — the separate project is bookkeeping, so that revoking
     * one app's access at myaccount.google.com does not revoke all three.
     */
    clientId: '340089513403-bi44vulb6bcjdisqpvetkcj2btui16ud.apps.googleusercontent.com',

    /**
     * The calendar PlanSphere creates and writes. It is a calendar of its
     * own rather than your main one, so nothing here can ever touch an
     * appointment this app did not put there — and hiding the whole lot is
     * one tick box in Google Calendar.
     */
    calendarName: 'PlanSphere',
};
