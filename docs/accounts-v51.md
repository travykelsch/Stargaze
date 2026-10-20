# Username/password accounts and phone menu repair

Requested change: email-free registration and sign-in, plus a phone-safe menu. Public guest play, existing worlds, account stats and verified leaderboards are preserved.

## Accounts

New pilots register a unique, case-insensitive 3–20 character username and a 12–128 character password/passphrase. Email and ChatGPT login are not required. Registration creates the account and pilot profile atomically. The display callsign can change independently of the sign-in username. Existing native-sign-in profiles can add credentials to the same account ID using Account security; their stats and public profile ID are retained. Native Sites routes and integration are preserved for backwards compatibility; local username/password sessions take precedence.

The server hashes passwords with native scrypt (N=16384, r=8, p=5, 32-byte output, random 16-byte salt). This is OWASP's 16 MiB scrypt alternative. Hash work is limited to two concurrent derivations per Worker isolate. Stored hashes are versioned and compared using timingSafeEqual. Passwords, raw session tokens and recovery codes are not logged or stored in browser storage. Production login uses HTTPS and the browser's password manager autocomplete fields.

Sessions use random 256-bit bearer tokens in a host-only Secure, HttpOnly, SameSite=Lax cookie. D1 stores only token hashes, with 30-day absolute expiry and a credential-version check. Login bounds sessions to eight per account. Logout revokes the current session; changing or recovering the password invalidates prior sessions. A logged-out sentinel prevents an existing native platform login from silently signing the player back into the game.

A random 128-bit recovery code is shown once at registration/password setup, and replaced after every password change/reset. D1 stores only its hash. Recovery needs the username, saved code and new password; there is no email reset or admin password backdoor. Users who lose both password and recovery code cannot recover that login. Browser forms never put passwords/codes in URLs.

Private writes require same-origin JSON; body size, password input length, per-IP/per-username attempts, signup rates and hash concurrency are bounded. Unknown usernames and incorrect passwords share a login error and hash path. Signup/profile/credential/session creation uses a D1 batch, so uniqueness failures roll back completely. Credential versions prevent replayed concurrent resets. The application checks session identity server-side on stats and multiplayer requests. Migration 0003 is additive; previous migrations are unchanged.

## Phone presentation

The supplied screenshot shows the ChatGPT Site preview shell (Open in browser / Edit site), which can crop a desktop cover image. The actual playable site is available through Open in browser. The game menu is additionally constrained to viewport insets, with no horizontal transform on narrow or short screens, bounded vertical scrolling, min-width:0 grid children, truncation of long world names, smaller header actions, and keyboard-friendly scrollable authentication forms. The desktop menu is centered so a portrait crop is more useful. This does not control ChatGPT's native cover-image framing.

## Verification

- `tests/password-auth.mjs`: real handler + SQLite D1 adapter: registration, hash/session secrecy, cookie flags, uniqueness/transaction rollback, case-insensitive login, generic failures, invalid/expired cookies, logout, recovery rotation/replay, password-change revocation, legacy-account upgrade, CSRF and throttling.
- `tests/password-worker.mjs`: native scrypt and timing-safe comparison in actual local workerd. One local derivation measured about 1.76 seconds; this is server-runtime timing, not phone FPS. The auth request timeout is 20 seconds to accommodate hashing and network variation.
- `tests/accounts-page.mjs`: real page controller and handlers: signup, recovery screen, private stats/filters, logout and username/password re-login. Non-rendering DOM harness.
- Existing account isolation, queue and multiplayer API tests plus TypeScript/production build are run.

The release must also smoke-test real deployed cookie persistence, signup/login/logout/recovery, cloud stats and multiplayer membership. Browser visual QA is unavailable in this managed environment; physical phone screenshots, keyboard positioning and touch feel remain user/device verification. Do not label static CSS inspection or a DOM harness as observed phone rendering.
