# Stargaze

An endless survival flying game with six worlds, twenty ships, and online multiplayer for two to four human players.

**Play:** https://skyward-flight.calmhippo4.chatgpt.site

## Source snapshot

Imported from the deployed Sites source commit `155a1a89297c5a9c040fc4a06011dd7810d722d8` on October 20, 2026. This repository contains the frontend, artwork, authoritative multiplayer server, database schema and migrations, build configuration, and tests. It does not contain live database records, browser saves, credentials, or personal accounts.

## Project structure

- `public/`: Three.js game, worlds, controls, ship models, UI, and artwork.
- `server/`: authoritative multiplayer simulation, collision geometry, and room API.
- `app/api/multiplayer/route.ts`: Worker API route.
- `db/` and `drizzle/`: D1 schema and migrations.
- `tests/`: gameplay, multiplayer, API, and runtime checks.
- `docs/`: design and implementation notes.

## Development

Requires Node.js 22.13 or newer and pnpm as pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Build with `pnpm build`. The project uses Vinext, Vite, Cloudflare Workers, and a D1 binding named `DB`. The existing configuration includes Sites-specific hosting integration.

Core multiplayer checks:

```sh
node tests/multiplayer.mjs
node tests/multiplayer-api.mjs
node tests/multiplayer-ui.mjs
```

## Hosting

The existing public game remains hosted through Sites. Uploading this source to GitHub does not migrate its hosting or live database.

Independent hosting requires a compatible Worker deployment, a D1 database bound as `DB`, application of the included migrations, and adaptation of the Sites-specific deployment configuration. GitHub Pages alone cannot run the multiplayer server. Do not deploy using the placeholder D1 database ID in the local configuration.

## Multiplayer rules

- **Race to the Finish:** a course approximately 120 seconds at baseline speed; checkpoints, two-second crash respawns, race-only boost and shield rings.
- **Timed Ring Collector:** 120 seconds; scoring rings worth 1, 3, or 5 points; two-second respawns retain points.
- **Last Pilot Standing:** one life, no respawns; survival determines the winner.
- Every pilot has an independent collectible copy of every ring.
- Moving rings begin after 60 seconds; red rings remain unavailable before 90 seconds.
- Human ships are nonblocking.
- Backgrounded or disconnected players forfeit after 12 seconds without contact.

## Accounts and saves

There is no permanent individual account registration or cross-device save synchronization yet. Single-player progress lives in each browser. Multiplayer uses session identities and a separate server-side reward ledger.

## Validation limits

Automated logic, API, and UI-harness checks were performed, along with four independent clients connected to the deployed service. Actual phone rendering, touch feel, audio, and device FPS have not been verified. Hosted tests showed occasional multi-second response latency; further responsiveness tuning and real-device playtesting remain necessary.
