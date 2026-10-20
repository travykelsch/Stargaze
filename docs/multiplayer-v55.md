# Multiplayer scene and transport repair

The previous service-only checks did not establish playable rendering. A phone
report exposed jumping views, early deaths and apparently frozen world behavior.
This revision changes the transport and scene contract together.

- `/api/live` upgrades to a persistent WebSocket. Gameplay requests use the
  existing authoritative D1 membership, lease, simulation, account and result
  handlers through the connection. No isolate-local room authority is introduced.
  Session secrets are inside encrypted messages, never query strings. Origin,
  packet size, message rate, connection count, identity and idle limits apply.
  The client serializes exchanges and reconnects; it does not silently fall back
  to the previous HTTP gameplay loop when the live channel is unavailable.
- Each browser binds one pilot ID. The game adapter receives that ID explicitly
  instead of falling back to the first room pilot. Eliminations hold the view;
  Watch pilot selects a survivor explicitly. A spectator target dying does not
  automatically jump to another craft.
- Starting builds each local world once, using the authoritative seed. The
  server holds a preparing phase until every human acknowledges a first submitted
  world frame. Only then does the shared five-second countdown begin. Rematches
  reset those acknowledgments. The barrier waits for all humans; a client that
  never submits a frame can hold preparation, requiring a restart/leave.
- Multiplayer world hazards use one shared motion function on both sides.
  Neon traffic follows a course clock rather than each observer's distance;
  creature orientation is sampled deterministically. Server collision queries use
  absolute course coordinates instead of translating a shared scene for pilots.
  This also preserves cached collision handles after their scene parent retires.
- Prediction is bounded to 350 ms of fresh simulation. Repeated responses with
  the same simulation tick cannot keep a client flying ahead indefinitely. The
  shared scene clock does not continually replay a stale interval.
- Rings retain generated IDs, including sparse rows. Shared NPC crash/contact
  events reach Sunscar effects, crowd reactions and its existing audio event path.

Verification distinguishes different kinds of evidence:

- Actual workerd WebSockets: upgrade/origin behavior, four connections, separate
  pilot identities, authoritative host start and shared membership.
- Actual public host: persistent WebSocket upgrade and authenticated API response.
  A four-connection, 15-second Sunscar check recorded 30/43/38/37 updates, 215 ms
  median and 657 ms p95 on that test path. Scripted pilots each crashed once;
  this was not human or phone play and does not prove fair survival or zero lag.
- Actual Three.js game adapter with a non-rendering renderer: own-camera binding,
  explicit spectating, no death-driven target hopping, animated hazards in all
  six maps, and network NPC explosions reaching scene effects.
- Shared geometry checks: each world's moving hazards advance and have identical
  world poses for observers at different course distances; detached cache handles
  preserve absolute collision behavior.
- Loading barrier, stale-snapshot bound, 53 existing world/ship regressions, 76
  bot scenarios, membership/concurrency, account privacy and production build.

No rasterized browser frames, physical-phone steering, audio listening, mobile
frame rate or geographically distributed latency were verified. A functioning
socket/API and transform tests are not a claim that every reported visual issue
has been observed resolved on a phone.
