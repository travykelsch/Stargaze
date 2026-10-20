# Stargaze pilot accounts

Public game access is unchanged. Sign-in is optional and uses Sites' native ChatGPT identity, top-level `/signin-with-chatgpt` and `/signout-with-chatgpt` navigation. Stargaze stores no passwords. No third-party auth secret is needed. Accounts are stable within this Sites project; independent hosting needs an equivalent trusted identity provider.

## Player flow

Open **Sign in / My pilot**, sign in with ChatGPT, choose a unique 3–20 character callsign, and choose whether to appear in the public leaderboard. Public pages show callsigns and multiplayer statistics, never emails or private account IDs. Unlisting removes a pilot from rankings while preserving private stats. Guest play remains available.

The account page displays solo flight count, distance, time, rings, credits earned, combo and near misses; personal best distance and score for each world/difficulty; multiplayer matches, wins, draws, earned rewards, rings, and recent results. Best records and stats persist in D1 across signed-in devices. Local spendable credits, selected ship, audio and controls remain device-local. Each signed-in account has its own browser save key; the original guest save stays untouched. New accounts retain the current device's selected world/ship/control preferences. Existing guest best records can be imported explicitly once; historical totals cannot be reconstructed.

Completed or deliberately ended solo flights are recorded once using owner-scoped run IDs. Pausing does not end a flight. A bounded per-account offline queue retries pending results. An expected public-profile ID guards each upload so a queue cannot be misattributed after an account switch. Solo data is client-reported, sanity checked, and never awards ranked multiplayer wins.

## Verified ranking rules

The public leaderboard ranks all-time multiplayer wins, with world, difficulty and mode filters. Equal win totals share a rank. The top 50 and the signed-in pilot's own rank are returned. Draws count separately in personal stats, not as wins.

Ranked eligibility requires two distinct signed-in accounts in the match and at least ten seconds of authoritative simulation. Guest-only opposition and shorter matches remain playable and contribute personal results but cannot produce ranked wins. This is an initial private-room leaderboard; it does not provide matchmaking, prevent collusion between separate legitimate accounts, or constitute a tournament anti-cheat system.

Match results come only from completed server simulation, after the authoritative room update commits. An immutable, bounded result snapshot preserves final participants when pilots leave. Result IDs include room, creation timestamp, round and pilot. Unique SQL keys make retries/reconnects idempotent. A browser cannot submit multiplayer standings or grants. One account cannot occupy two seats in one room. Account identity is bound to room membership and checked on subsequent requests. Private account identity is excluded from snapshots sent to clients.

## Storage and security

Migration `0002_fuzzy_captain_cross.sql` appends five tables: profiles, solo runs, multiplayer results, one-time imports, and account write limits. Prior migrations are unchanged. Owner queries use dispatch-verified identity headers; body-supplied account IDs are not authorization. Private writes require a matching Origin and JSON content type, bounded bodies and per-account write limits. Public names are unique case-insensitively and validated; frontend text is escaped. Reads use no-store and primary D1 sessions.

## Validation

- `tests/accounts.mjs`: authorization, isolation, CSRF, aliases, cloud records, imports, duplicate writes, public privacy, rankings/filters/own rank, immutable server results, draws/unranked eligibility, real multiplayer API account binding and automatic stats, rate limits (SQLite D1 adapter).
- `tests/accounts-client.mjs`: separate local keys, guest preservation, completed-run deduplication, persistent offline queue, changed-account guard, cloud record merge (non-rendering harness).
- `tests/accounts-page.mjs`: real page controller with real API, native sign-in anchor, onboarding, private stats, rankings/filter wiring and signed-out view (non-rendering DOM harness).
- Existing multiplayer, controls and TypeScript/build checks are run for the release.

These checks do not constitute observed browser OAuth, rendered phone gameplay, audio listening, or actual device FPS measurements. Browser QA is unavailable in the current managed environment. Production smoke checks should verify anonymous identity rejection, account page and leaderboard availability, dispatch sign-in routing and existing multiplayer API availability. A real user must complete native ChatGPT sign-in to validate the complete browser identity handoff.
