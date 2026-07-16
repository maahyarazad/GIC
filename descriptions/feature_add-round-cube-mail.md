## Feature - Add Round Cube Email to Dashbaord

## Description

1. 
```txt
Roundcube's default login form (Elastic skin, which ships since Roundcube 1.3) reads the _user GET parameter and pre-fills the username field with it:
https://buenapublica.cmpsrv.com/rc/?_user=someone@example.com
That's a built-in, supported feature — it's not a hack.
Password — no, and you shouldn't want to
Roundcube deliberately does not support putting the password in the URL. There's a good reason: anything in a URL query string tends to end up somewhere you don't want it —

Browser history — sitting there in plaintext indefinitely
Server access logs — full URLs (including query strings) get logged on most web servers by default
Referrer headers — if that page links out anywhere, the full URL (password included) can leak to the destination site
Shared/bookmarked/screenshotted links — a URL is much easier to accidentally paste into Slack, email, or a support ticket than a password field ever is

So even if you found a workaround, it'd be creating a live credential leak, not a UX convenience.
If you actually need full auto-login
If the goal is "user clicks a link/button from our app and lands in their inbox already logged in," the right way to do it is a server-side auto-login mechanism, not a GET-parameter password:

autologon plugin (or similar) — you write a small backend script that receives the login request via POST (not GET) from your app, authenticates the user server-side, and redirects them into an already-authenticated Roundcube session. The credentials never appear in a URL at any point.
Some hosting panels (Plesk, cPanel, etc.) already have a built-in "single sign-on to webmail" button that does exactly this — worth checking if your host offers one before building your own, since it'd save you touching Roundcube's plugin config directly.

If you tell me what's driving this (e.g. a support tool that needs to jump users into their inbox, or you just want to save yourself typing during testing), I can help you scope the right approach — a POST-based autologin plugin is a bit more setup than a URL param, but it's the one that doesn't leave passwords lying around in logs.
```txt