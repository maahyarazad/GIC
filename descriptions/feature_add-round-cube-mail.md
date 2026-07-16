# Feature — Add Roundcube Webmail SSO to Dashboard

## Summary

Add an email icon beside the logged-in user (left side) that logs the user
straight into their Roundcube inbox with one click, shown **only** for an
allowlist of users.

**The app already has working webmail SSO.** The existing admin header renders a
hidden POST form that submits the user's stored mailbox password to a proxy
(`/admin/webmail-login.php`) and opens Roundcube already logged in. So this is
**not** a from-scratch build — we reuse the existing proxy. The Node side just
renders/triggers the same POST form.

> **Superseded approach:** the earlier plan (short-lived HMAC token + a custom
> Roundcube `autologon` plugin) is **dropped**. It was designed for the case
> where nothing existed yet. Since a POST-based auto-login proxy already exists
> and already works, the plugin/token machinery is unnecessary. Kept only as a
> fallback (see "If the proxy can't be reused").

## Allowlisted users

- `ricco.deutscher@german-industry-club.com`
- `philip.hoelzer@german-industry-club.com`
- `jan.hussing@german-industry-club.com`

Everyone else: no icon, no `/webmail` access.

---

## What already exists (discovered in the PHP app)

The admin header (`Page::Header()` in the page class) already contains this,
gated on the user having a stored mailbox password:

```php
<?php if(!empty($_user[0]->webmail)): ?>
  <li>
    <img src="/admin/images/__icn_webmail.png" ... alt="Webmail" />
    <form method="post" action="/admin/webmail-login.php" target="mail" id="webmail">
      <input type="hidden" name="_action"   value="login" />
      <input type="hidden" name="_task"     value="login" />
      <input type="hidden" name="_timezone" value="_default_" />
      <input type="hidden" name="_user"     value="<?php echo validate($_user[0]->email); ?>" />
      <input type="hidden" name="_pass"     value="<?php echo validate($_user[0]->webmail); ?>" />
    </form>
    <a href="javascript:;" onClick="mail();$('webmail').submit();">Webmail</a>
  </li>
<?php endif; ?>
```

Key facts this establishes:

- Login is done the **secure** way already: password travels in the **POST
  body**, never in a URL — so nothing leaks to history/logs.
- `mail()` opens/focuses a popup window named `mail`; the form POSTs into it.
- The form posts to `/admin/webmail-login.php` (a same-domain **proxy**), not
  straight to Roundcube — almost certainly because Roundcube requires a login
  `_token` (CSRF) that the proxy fetches first.
- The icon only appears when `$_user[0]->webmail` (the stored mailbox password)
  is **non-empty**. That is why it's currently hidden for the three users —
  their `webmail` field isn't populated.
- Host is **Plesk** (`plesk-stat/` present) — worth checking Plesk's built-in
  webmail SSO before doing anything custom.

⚠️ **Site mismatch:** the header above was found in
**german-emirates-club.com**, but the three target users are
**@german-industry-club.com**. Apply edits to the site those users actually log
into. The mechanism is identical; the file is per-site.

---

## Why the login must be submitted by the browser (not server-side)

The thing that logs the user in is the Roundcube **session cookie**, scoped to
`buenapublica.cmpsrv.com`, and it must land in the **user's** browser. If Node
(or PHP) does a server-side `POST` to Roundcube, the cookie comes back to the
server's HTTP client and cannot be set for another domain in the user's browser.

**So the login POST must be issued by the browser.** That's why the existing PHP
renders a hidden `<form>` + JS submit instead of curling Roundcube — and why the
Node version must do the same. Node's job is to *serve the form*, not to log in.

---

## Implementation (Node)

### Route: serve an auto-submitting POST form

Mirror of the existing PHP form. Reuse the same proxy target.

```js
const WEBMAIL_ALLOW = new Set([
  'ricco.deutscher@german-industry-club.com',
  'philip.hoelzer@german-industry-club.com',
  'jan.hussing@german-industry-club.com',
]);

// HTML-attribute escaping — Node equivalent of PHP's validate().
// Without this, a password containing " or < breaks out of the attribute.
const esc = s => String(s)
  .replace(/&/g,'&amp;').replace(/"/g,'&quot;')
  .replace(/</g,'&lt;').replace(/>/g,'&gt;');

// Point at the EXISTING proxy so we don't reimplement the CSRF-token handshake.
const POST_TARGET = 'https://<dashboard-host>/admin/webmail-login.php';

app.get('/webmail', (req, res) => {
  const user = req.user;                    // existing dashboard auth session
  if (!user || !WEBMAIL_ALLOW.has(user.email.toLowerCase()))
    return res.status(403).send('Not authorized');

  const pass = getWebmailPassword(user);    // same store PHP's ->webmail reads
  if (!pass) return res.status(404).send('No mailbox configured');

  res.set('Cache-Control', 'no-store');
  res.send(`<!doctype html><html><body onload="document.forms[0].submit()">
    <form method="post" action="${POST_TARGET}">
      <input type="hidden" name="_task"     value="login">
      <input type="hidden" name="_action"   value="login">
      <input type="hidden" name="_timezone" value="_default_">
      <input type="hidden" name="_user"     value="${esc(user.email)}">
      <input type="hidden" name="_pass"     value="${esc(pass)}">
    </form>
  </body></html>`);
});
```

### Frontend: conditional icon

Render the email icon to the **left** of the logged-in user, only when the user
is allowlisted **and** has a mailbox password on file. The icon links/opens
`/webmail` (ideally into a named popup, matching the current `target="mail"`
behavior). The password is never emitted to the client except inside the
`/webmail` form response itself.

### `getWebmailPassword(user)`

Must read the **same store** that populates PHP's `$_user[0]->webmail`. That
field is **not** selected by the `__member_login` / `__class_basic` queries seen
so far, so it's loaded elsewhere — find it before wiring this up:

```bash
grep -rn "webmail" classes/ includes/ admin/ 2>/dev/null | grep -iv "\.png\|icn"
```

For the three users to get a working icon, that column/store must actually
contain their mailbox passwords.

---

## If the proxy can't be reused

Only if `/webmail` posting to `/admin/webmail-login.php` doesn't work
cross-app (e.g. the Node app is on a different origin and the proxy checks
referer/session):

- **Port the proxy to Node** — replicate whatever `webmail-login.php` does:
  GET the Roundcube login page, scrape the `_token`, then POST
  `_user`/`_pass`/`_token` and forward the browser. Requires reading the proxy
  source first.
- **Last resort:** the dropped HMAC-token + Roundcube `autologon` plugin
  approach. Avoid unless the proxy genuinely can't be reused.

---

## Open questions / decisions needed

1. **Reuse or reimplement?** Do you need login *reimplemented* in Node, or just
   need Node to *trigger* the existing PHP flow? (Reuse is far simpler.)
2. **`/admin/webmail-login.php` contents** — confirms the exact POST target and
   whether a `_token`/CSRF handshake must be replicated. **Please paste this.**
3. **Where the mailbox password lives** — which column/query populates
   `$_user[0]->webmail`; `getWebmailPassword()` must read the same store.
4. **Which site** do the three users log into? Edit that site's header, not
   german-emirates-club.com's.
5. **Plesk built-in webmail SSO** — check the panel; may replace all custom work.

---

## Security notes

- Same posture the existing PHP already has: the password is rendered into the
  `/webmail` response, so serve **HTTPS only**, keep `Cache-Control: no-store`,
  and never move `_pass` into a URL/query string.
- Enforce the allowlist on the **route** (403), not just by hiding the icon.
- HTML-escape `_user` and `_pass` into the form (`esc()` above).

## Acceptance criteria

- [ ] Email icon appears left of the user, **only** for the three allowlisted addresses (and only when a mailbox password is on file).
- [ ] Non-allowlisted users see no icon and get 403 on `/webmail`.
- [ ] Clicking the icon lands the user in their Roundcube inbox, already logged in.
- [ ] Password travels only in the POST body — never in any URL, history, or log.
- [ ] `/webmail` response is served over HTTPS with `Cache-Control: no-store`.
- [ ] Edits applied to the correct per-site header (the site the 3 users log into).