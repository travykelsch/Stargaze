# Four-pilot matches with server-controlled bots

The host has an explicit Start match action. Launches accept one through four
human pilots, regardless of advisory ready states, and fill the remaining seats
with AI for exactly four competitors. A shared five-second countdown gives
joined pilots notice. Non-host start requests and repeated starts are rejected.
Inactive/left humans are removed before the launch; the requesting host is kept.

Bots appear as [BOT] in lobby slots, standings, spectating and results. Missing
seats say Bot at start while friends are still joining. Bots use varied existing
ships and per-pilot colors. They cannot become room host, receive accounts, occupy
human login sessions, claim rewards or count as signed-in opponents for rankings.
Existing ranking eligibility (two distinct accounts and ten seconds) is retained.

Every bot issues ordinary controls inside the authoritative simulation. They
follow reachable rings, prefer fuel when low, aim ahead for ring motion, probe
upcoming terrain and use normal evades. All movement, boost/shield pickups, fuel
consumption, geometry/NPC collisions, collection sweeps, score, respawns and death
flow through the same code as human pilots. There are no fabricated scores,
teleports, free fuel, collision bypasses or bot speed bonuses.

Initial tuning:

| Difficulty | Decision interval | Aim error | Steering cap | Evade decision interval |
| --- | --- | --- | --- | --- |
| Easy | 280 ms | 2.1 m | 0.82 | 2.2 s |
| Medium | 140 ms | 0.9 m | 1.1 | 1.3 s |
| Hard | 80 ms | 0.25 m | 1.4 | 0.7 s |

Combined control magnitude never exceeds the human 1.45 limit. Hard bots take
more opportunities for valuable rings. These are skill parameters, not measured
human-equivalent ratings or promises of a particular win rate. Hazard speed also
follows the existing difficulty setting.

The roster stays bounded at four. Elimination, forfeits and respawns retain each
mode's rules; eliminated pilots are not replaced mid-round in Last Pilot Standing.
Human disconnects still forfeit after twelve seconds. On a rematch old AI is
discarded and missing seats are rebuilt for the selected difficulty. New humans
may join between rounds and replace AI seats; mid-round joins remain blocked.
Bot reaction state is deterministic, serializable and private to the backend.

Checks include 76 logic scenarios: 1/2/3/4-human rosters in all modes and
difficulties, 14-second three-bot runs across 18 world/difficulty combinations,
real ring collections and crashes, steering bounds, serialization and rematches.
API tests cover host-only launch, capacity, no mid-round joining, friends joining
between rounds, human host transfer, and no bot grants. The actual game code runs
through solo start with three bots and the four-human path using a non-rendering
DOM/canvas adapter. The existing 53 world/ship regressions also pass.

No physical phone, rendered gameplay, audio or mobile frame-rate verification is
claimed. The existing HTTP transport and previously reported latency limitations
remain; this change does not introduce a new networking service.
