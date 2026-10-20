# Stargaze

An endless survival flying game with six worlds, twenty ships, and online multiplayer for two to four human players.

**Play:** https://skyward-flight.calmhippo4.chatgpt.site

**Pilot accounts and leaderboard:** https://skyward-flight.calmhippo4.chatgpt.site/account.html

## Accounts and statistics

Players register with a username and password—no email or ChatGPT account required—and choose whether to appear in public rankings. A one-time recovery code supports password reset without email. Secure HttpOnly sessions last up to 30 days. Existing native-sign-in pilots can add a username/password while preserving their stats. Personal bests and solo/multiplayer statistics persist in D1 across signed-in devices. Emails and private account IDs are never shown on the leaderboard. Guest play remains available.

Rankings use server-verified multiplayer wins, with world, difficulty and mode filters. Two distinct signed-in accounts and at least ten seconds of authoritative play are required for ranked eligibility. Equal wins share a rank; draws are recorded separately. Solo records are client-reported and remain separate from verified rankings. Existing guest best records can be imported explicitly once. Local spendable credits, selected ship, audio and controls stay on each device. See `docs/accounts-v51.md` for the current account flow, security and phone verification limits, and `docs/accounts-v50.md` for initial stats/ranking rules.

## Source and development

The original deployed source snapshot was imported from Sites commit `155a1a89297c5a9c040fc4a06011dd7810d722d8` on October 20, 2026. This repository includes frontend code, artwork, the authoritative multiplayer server, schema/migrations, configuration, tests and implementation notes. It does not contain live user records, browser saves, or credentials.

Requires Node.js 22.13 or newer and pnpm as pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Build with `pnpm build`. The app uses Vinext, Vite, Cloudflare Workers and a D1 binding named `DB`. Source is organized under `public/`, `server/`, `app/api/`, `db/`, `drizzle/`, `tests/`, and `docs/`.

```sh
node tests/password-auth.mjs
node tests/password-worker.mjs
node tests/accounts.mjs
node tests/accounts-client.mjs
node tests/accounts-page.mjs
node tests/multiplayer.mjs
node tests/multiplayer-api.mjs
node tests/multiplayer-ui.mjs
```

## Hosting

The public game remains hosted through Sites. GitHub stores source; uploading source does not migrate hosting or the live database. Independent hosting needs a compatible Worker deployment, D1 provisioning and the included migrations, adaptation of Sites-specific configuration, and support for the included username/password session backend (or an equivalent trusted identity provider). GitHub Pages alone cannot run the multiplayer backend. Do not deploy using the local configuration's placeholder D1 ID.

## Multiplayer

- **Race:** a course approximately 120 seconds at baseline speed, checkpoints, two-second crash respawns and race-only boost/shield rings.
- **Collector:** 120 seconds; 1/3/5-point rings; two-second respawns retain points.
- **Last Pilot Standing:** one life, no respawns; survival determines the winner.
- Rings have independent collectible copies per pilot. Moving rings begin after 60 seconds; red rings remain absent before 90 seconds. Human ships are nonblocking. A connection lost for 12 seconds forfeits the round.

## Verification limits

Logic, API and non-rendering UI harnesses verify behavior. Four independent clients were previously tested against the hosted multiplayer service. Actual phone rendering, touch feel, audio and FPS have not been measured. Hosted network tests showed occasional multi-second latency spikes. Phone rendering and touch feel still require hands-on device checks; server and DOM fixtures do not prove visual layout.
