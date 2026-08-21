/**
 * PlanSphere — where the Drive copy lives, and who is allowed to write it.
 *
 * Both values are safe to publish, and both are meant to be. An OAuth client
 * ID is not a secret — it only names the app; Google will not hand it a token
 * without you signing in and agreeing, and it only works from the web
 * addresses you registered against it. A folder ID is likewise just a name:
 * without permission on the folder, knowing its ID gets you nothing.
 *
 * What must NEVER appear in this file is a **client secret**. The browser flow
 * this app uses does not need one and Google does not issue one for this
 * client type. If you find yourself pasting something labelled "secret", stop
 * — you have created the wrong kind of credential.
 *
 * Setup is a few minutes of clicking, once. See docs/DRIVE.md.
 */

const PS_DRIVE = {

    /**
     * Google Cloud → APIs & Services → Credentials → OAuth client ID (Web
     * application). It ends in `.apps.googleusercontent.com`.
     *
     * Leave this as it is and PlanSphere uses the client ID already in
     * `gcal-config.js`. That is usually what you want: Drive and Calendar are
     * the same app on the same origin, so one client covers both, and Google
     * asks for each permission separately when it is first needed.
     *
     * Set it only if you want the Drive grant to stand apart from the
     * Calendar one — a second client in the same Google Cloud project.
     */
    clientId: 'SAME-AS-CALENDAR',

    /**
     * The folder the file is kept in, taken from its Drive URL — the part
     * after `/folders/` and before any `?`:
     *
     *     https://drive.google.com/drive/folders/13jmiN8PId…rgD2I3jyjd?usp=sharing
     *                                            └───── this ─────┘
     *
     * Keep this folder **Restricted** in Drive's Share settings. "Anyone with
     * the link" means anyone with the link can read every trip, every receipt
     * and every name in your backup.
     */
    folderId: '13jmiN8PIdm0pRVr2RjfVM3rgD2I3jyjd',

    /** The one file PlanSphere writes. Renaming it in Drive starts a new one. */
    filename: 'plansphere-data.json',
};
