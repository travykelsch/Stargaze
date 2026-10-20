# Stargaze v44 — boundary coverage, Sunscar speed and tunnel floor

Existing project appgprj_6ad52aaee95481918985e3f136299301.
Baseline: v43, 8fb4fd3ce91eac9966f98885a6b39d2a8ed4269a. Audience preserved.

## Changes

1. Sunscar's tunnel rock floor previously occupied the same y=-30 plane as the
   sand floor. Its tunnel cavity now extends to -35, leaving the real sand floor
   at -30 and the rock underside below it. Fine sand ripples use derivative-based
   antialiasing to reduce distant shimmer. The floor remains physically solid.
   A separate collision regression found that a ray grazing a remote tunnel
   corner could enter and leave a thin wedge within 0.0001 units. The old inside
   test merged those two crossings and reported a phantom collision. The tighter
   1e-8 duplicate tolerance preserves the distinct intersections. No collision
   bypass or immunity was introduced.

2. Sunscar's smooth opening speed multiplier rises to 1.58 from 1.28. Cruise and
   final speed caps are approximately 23.4% faster; the exact integrated distance
   and inverse clocks remain synchronized across scenery, NPCs, shots and rings.
   Other worlds keep their speed curves. Slow arrivals get closing-speed-based
   sight distance. The view range, fog range and generated lookahead accommodate
   the faster pace. Existing rear-approach safety still has final authority.

3. Rings remain still through 60 seconds, then ramp to a clearly visible motion
   level during the next 12 seconds and gradually strengthen later. Maximum
   offsets are 1.8 horizontal / 1.15 vertical, within the protected gold opening.
   Red timing, size floors, bounded scarcity, refills and scoring are unchanged.

4. Every world now includes deterministic, visible passage formations. The first
   is around eight seconds, then roughly every ten seconds. Natural worlds use
   stone/debris/ice forms; Neon City uses a skyway gantry; Sunscar uses sandstone.
   Each formation has a genuine 32-by-14 opening centered on the existing seeded
   moving route. Its visible extruded geometry is its collision geometry. Amber
   corner brackets and a directional passage warning identify the opening.
   Placement shifts slightly to keep every potential gold/bonus ring row at least
   13 m away. There is no AFK timer, invisible boundary damage, player-following
   trap, forced crash or multiplayer code in this change.

   Top/bottom and side limits cannot pass around these formations. The continuous
   intersection of their openings across a route cycle is empty, closing permanent
   stationary safe pockets. Skilled movement through the existing fuel route is
   preserved. This does not claim that every position has identical instantaneous
   risk: reading and moving toward an opening remains an intended skill.

   Sunscar rivals plan around passages, brake unsafe rear passes, and can crash
   against the same openings. Passage geometry and marker materials are released
   on recycling/restart. Shared rendering materials are cached.

## Verification

- `tests/passages.mjs`: 38,880 formations across all 18 world/mode combinations
  and 12 seeds; 155,520 boundary checks, 88,128 stationary-grid checks, continuous
  empty-intersection assertions, 260,052 complete-depth route samples, exact
  sector assignment, ring-row separation, speed caps and 60-second motion timing.
  Analytic maximum route extents plus the actual ship contact envelope also
  cover the full ceiling/floor/side boundaries, not just the sampled points.
- `tests/passage-runtime.mjs`: actual game collision function, 1,044 top/bottom/
  side body contacts, 18 open passage checks, warning visibility/pause/restart,
  body/marker geometry disposal and tunnel-floor/phantom-collision regressions.
  Floor raycasts return separated surfaces at -30, -35 and -50.
- `tests/fairness-runtime.mjs`: 108 stationary/boundary attempts fail on real
  hazards; boundary attempts retain fuel. Eighteen actively steered 65-second
  flights survive across all six worlds and all difficulties with normal
  collision/fuel behavior and peak steering about 0.37 of ordinary input.
- `tests/sunscar-runtime.mjs`: all 20 ships × three difficulties; nine early,
  middle and late faster-speed flights, reachable rings, positive fuel, genuine
  racer/gate/tunnel geometry, pause/restart/world changes and saves.
- Rear fairness, 36 seeded Sunscar fields, trajectory checks, Ember/Frost/traffic
  generation, progression/fuel bounds, curved rings, rewards, all-world runtime,
  environment cleanup, Neon City lights and unlimited evade controls pass.
- Ten expanded shader programs compile/link through native EGL, including the
  antialiased sand shader.
- 30-minute resource simulation uses the enlarged speed-dependent lookahead;
  actors/effects, geometry caches, scenery and crew pools remain bounded.

The checks above execute logic, geometry and non-rendering scene adapters. No
supported browser preview is available here. Actual phone appearance of the floor
fix, passage readability, touch feel, audio listening and device FPS were not
observed or measured. No rendered visual/device pass is claimed.
