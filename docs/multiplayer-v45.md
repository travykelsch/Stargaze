# Stargaze four-player multiplayer

Preserves the v44 single-player game and hosting audience. Static assets moved
from dist into public; the supported Sites Vinext Worker build now produces dist.
Sites provisions D1 through the retained project ID and DB binding. No outside
service keys or third-party account are required.

## Rules

2–4 real pilots, room code/link, per-tab 256-bit session, individual ring copies.
Race: course length equals the baseline distance at 120 seconds rounded up to a
190 m sector. 950 m checkpoints, 2 s respawn, 1.25 s explicitly labelled grace,
240 s hard race deadline, 30 s after first finisher. Exact server finish-time ties
draw. Geometry always blocks terrain, including during grace and shields.
Collector: 120 s, 2 s respawn in place on the safe course, retained points.
Survival: one life, survival wins; equal authoritative elimination ticks draw.
Gold/cyan/red: 1/3/5 match points plus original 7/8/9 fuel and precision refill.
Red remains gated at 90 s and ring motion starts at 60 s. Ring IDs are independent
per pilot and retained across checkpoints to prevent farming. Race-only lime
triangular boost: 18% for 3 s. Violet hexagonal shield: 6 s / one non-terrain impact,
with 1 s contact clearance for the struck moving hazard. 8 s between power claims;
no stacking. Power boost does not increase steering speed or evade immunity.

Online matches do not pause. Controls/settings remain available. Inputs expire
at 300 ms; lost connections forfeit after 12 s. Existing sessions can reconnect.
Lobby hosts transfer; lobby ghosts expire after 2 min; rooms expire after 2 h.

## Authority and synchronization

Authoritative 20 ms simulation, with <=1 m forward collision subdivisions and
existing steering/15 m evade geometry. Reuses visible world collision meshes and
concave parity from the existing game. Existing hazard movement functions and
ring generation/progression shared between browser and backend. Server Sunscar
RaceField snapshots persist RNG, rival states, contacts and detection histories.
All players share committed projectiles and NPC poses, including a validated
warning history for each pilot. Additional bounded spatial cohorts populate
widely separated racers; clients cull actors beyond 1800 m.

D1 room JSON updated by revision compare-and-swap. After the first hosted test, a second schema migration added per-pilot input rows and a renewable room simulation lease: incoming inputs no longer compete to execute identical physics, and snapshots can be read during an update. Clients permit two bounded in-flight exchanges.
Simulation state never depends on isolate-local RAM. Geometry cache is bounded at
40 sectors, with explicit retirement from Ember/Frost hazard registries. Physics
advances in bounded catch-up batches. HTTP input/snapshot exchange targets 10 Hz;
client predicts bounded motion, reconciles acknowledgments and interpolates ships.
The server checks session membership, host actions, input magnitudes/sequences,
room capacity, request size/origin, create rate and input rate. Secrets remain
outside client assets. Results are authoritative and reward grants use a unique
round/pilot key and durable INSERT OR IGNORE. Multiplayer credits are banked online
separately from the existing device-local single-player balance.

Close human ships render as translucent ghosts to preserve the steering view while passing through one another.

## Verification

- 53 automated multiplayer checks: all 18 world/difficulty combinations, all 20
  ships, boundary camping, independent claims, input replay rejection, evades,
  authoritative scoring/results, serialization and deterministic NPC continuation.
- Four independent HTTP clients: joins/readies, full room rejection, host and
  membership enforcement, reconnection identity, CAS races, duplicate reward
  protection using the real API handler and an in-memory SQLite D1 adapter.
- Actual game code executed with a non-rendering DOM/canvas adapter: lobby,
  countdown, active network frame, remote models, results, grants and home return.
- Existing control/runtime/passage tests, progression/fuel scarcity checks, reward
  migrations and 90 rear-fairness scenarios. TypeScript and production build.
- Full-length four-pilot Sunscar simulations: race ended at 120.14 s, collector at 120 s, survival remained active at 125 s; all four precise route-following pilots retained fuel with zero crashes. These are simulated inputs, not human/device play, and are measured separately from frame rate.
  Initial 10 s hard-mode benchmark: ~4.6 s Node CPU, peak request 117 ms before
  subsequent safety-pass optimization, ~29 KB persistent room state, 23 NPCs.

The first hosted Worker + D1 test passed 175 requests across four independent clients in all three modes, including active Sunscar NPC snapshots, reconnect identity, survival victory and idempotent reward claims. Its proxied request median was 397 ms and p95 was 3519 ms, prompting the lease/input separation above. The final hosted repeat passed 227 requests across four independent clients in all three modes: shared NPCs, continuous movement, reconnects, survival victory and duplicate reward protection. Median was 344 ms and p95 1058 ms. These HTTP measurements are not device latency claims. Browser rendering, audio listening,
real-device FPS, mobile touch play, and real mobile-network latency are unverified:
control-browser is unavailable in the managed Sites environment. The non-rendering
checks do not establish visual quality, 60 FPS, or device-specific network feel.

The existing site is owner-private. Friends require site access in addition to a
room invitation. Publication intentionally does not expand the audience.

Final performance repair: collision geometry initializes lazily for the selected
world. The Sunscar-only Node cold start fell from approximately 630 ms for all
world assets to 46 ms with 16 MB of heap. Primary D1 sessions prevent stale reads
within exchanges. Ready freshness uses the same 12 s connection window as play.
Final regressions additionally cover single-player record/balance isolation,
per-round input rows, reconnect sequence restoration and late-response rejection.

An old generic late-run test was corrected to initialize Sunscar distance with its
actual boosted world clock; the previous fixture incorrectly paired time 600 s
with a different world distance. The corrected 600–605 s collision/fuel check
passes. The other five worlds passed the full 600–665 s check.

Client execution regressions also cover course regeneration after checkpoint
rewinds or spectator jumps, and per-round remote/power-up cleanup.

Server collision queries interpolate fast NPC motion within each simulation tick;
boosted finish times use actual crossing speed and substep time. A swept-craft
geometry regression checks a fast crossing that endpoint-only tests miss.
