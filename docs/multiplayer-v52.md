# Multiplayer synchronization repair

Production logs confirmed 429 "Inputs arriving too quickly" responses during
ordinary iPhone gameplay. Two concurrent polls, delayed delivery and a 45 ms
arrival gate caused normal packets to enter the reconnect/error path. The client
also stopped prediction after 600 ms, capped world extrapolation at 200 ms and
replaced forward position with each snapshot. Those paths caused freezes and
backward scenery jumps even when the connection remained alive.

Changes:

- One outstanding poll per client, with a 100 ms minimum sending interval.
  Bursty inputs inside the server's 45 ms gate are coalesced and acknowledged by
  subsequent snapshots instead of producing 429 errors. Validation and sequence
  checks remain; rejected/coalesced evades are retried until acknowledged.
- Revision-tagged snapshots reject older room states, including equal-tick
  responses. Room membership, simulation, collisions and results stay authoritative.
- Shared movement prediction replays bounded recent input history. It accounts
  for snapshot age and estimated network transit, excluding measured server
  processing time. Corrections ease across all three position axes; explicit
  crashes, respawns and round changes reset immediately. Unacknowledged evades
  retain their local progress instead of repeatedly restarting.
- Local prediction continues through brief gaps, stops after 1.5 seconds without
  a snapshot and displays reconnect status. The server retains inputs for up to
  1.25 seconds, then neutralizes them; disconnect forfeits remain 12 seconds.
- Remote human ships and Sunscar NPCs extrapolate through short snapshot gaps.
  New human ships start at their received position rather than flying out from
  the world origin. Invitations no longer rewrite browser history on every poll.
- Authoritative catch-up can process up to two seconds of ticks per exchange,
  with a 120 ms soft CPU budget after the original 25-tick allowance. Collision
  substeps and shared hazard state remain unchanged; no immunity was introduced.

Verification is reported separately from human play. The deterministic jitter
fixture uses 90/240/130/400 ms delivery delays and reordered arrivals. It reproduces
17 forward rewinds in the old snapshot-reset behavior and zero in the new motion
path. It also checks bounded history, evade continuity, immediate respawn reset,
read-only remote extrapolation and one-second authoritative catch-up.

HTTP polling is still the transport. This repair cannot eliminate latency on
every connection. A persistent low-latency transport would require a supported
room-coordinator service and a separate infrastructure change. No physical phone
rendering, touch, audio or mobile-network measurements are claimed here.
