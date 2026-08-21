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
     * Register the address you actually open the app on under "Authorised
     * JavaScript origins" — `http://localhost:5173` for `node serve.js`.
     */
    clientId: 'YOUR-CLIENT-ID.apps.googleusercontent.com',

    /**
     * The calendar PlanSphere creates and writes. It is a calendar of its
     * own rather than your main one, so nothing here can ever touch an
     * appointment this app did not put there — and hiding the whole lot is
     * one tick box in Google Calendar.
     */
    calendarName: 'PlanSphere',
};
