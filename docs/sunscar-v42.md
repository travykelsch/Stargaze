# Sunscar flagship upgrade — v42

Existing project: appgprj_6ad52aaee95481918985e3f136299301. Existing audience retained.
Baseline source: ec6af20dbde90aa182094a1fe9e64ef079955bac (published v41).

## Audit and reproducible comparison

`tests/fixtures/sunscar-v41-baseline.json` captures seed 113, 180 seconds,
20 ms steps, with activity measured within 200 m after the first 30 seconds.
The same definition is implemented in `node tests/sunscar-benchmark.mjs`.
`tests/fixtures/sunscar-v42-result.json` contains the upgraded results.

The old field averaged only 4.93 / 3.91 / 3.28 nearby craft (Easy / Medium / Hard).
Slow replacements started 820 m ahead; similar-speed replacements started 790 m
ahead. Many fought or hit terrain while still distant. Of 235–251 spawned craft,
214–231 crashed in these runs, including 80–126 terrain crashes. Fast racers had
speed-based rear distances but no actual-player escape planner; the HUD selected
only the closest rear threat. No stalled/recovering class existed. Six old racer
styles used basic cylinders and boxes; cliffs were straight extruded profiles
with procedural color bands. Simple crews, widely spaced batteries and small
far mesas reduced scale and activity.

The upgrade roughly doubles nearby activity and increases actual passes about
fourfold in the matching seeded scenarios. The new fixture gives exact per-mode
values, warning lead, fighting, crash, stall and recovery counts. Total NPC count
alone is deliberately not the success metric.

Rendering costs identified from the source: separate engine ports/exhaust parts
per NPC, translucent dust overdraw, repeated scenery meshes, and triangle-based
player collision work. Simulation costs included per-racer filter/sort allocations
and repeated 42-iteration distance inversions. New designs merge 4,872–6,528 body
triangles into one cached hull draw. Scenery batches by geometry/material. Far
craft shed glass, ports and exhaust detail. Sunscar uses a fast exact clock
inverse, bounded route cache, allocation-free neighbour search, and 10 Hz safety
planning. This is a source/logic audit, not a GPU profiler measurement.

## Delivered

- Sunscar-specific smooth opening acceleration to a 28% faster distance clock;
  finite speed ceiling. Other world clocks keep their previous behavior.
- Sustained fighting packs, slower overtakes, fast rear passes, matched rivals,
  damaged, stalled and recovering vehicles. Bounded 40 / 44 / 48 craft.
- RearSafety uses actual player position, velocity, active evade remainder,
  steering limits, camera frustum, shared vehicle dimensions and projected
  closing time. Warning target is 3.2 seconds plus unseen/movement allowances.
  Sampled escape paths check all nearby racers, terrain and committed shots.
  Three passes can be planned together; overflow is warned and delays thrust.
  Unsafe timing decelerates continuously. There are no collision exemptions or
  position teleports. Committed passing lines use bounded angular/radial motion.
- Left, centre and right rear warnings, simultaneous threat counts, positional
  audio, and stalled-craft warnings. Existing near-miss rewards now handle passes
  in both directions, alongside existing precision/combo/ring rewards.
- Sculpted closed cliff volumes, eroded towers, monumental side arches, layered
  mesas, dunes, barriers, race scars, wrecks, stands and camps. Actual visible
  course/pillar/gate/tunnel surfaces remain the player's collision geometry.
- Four craft families and eight liveries: machined turbine cases, recessed fans,
  intake lips, nozzles, bands, cables, cockpit glass, heat shields, warning paint,
  rivets, removable damage panels and different colored exhaust. Rival contact
  uses shared engine/cockpit component descriptors rather than one whole-craft box.
- More visible catapult batteries with matching launcher and ballistic origins,
  elevated positions, masked/horned crews, loaders/spotters, loading/winding/
  release/recovery animation and wind-blown flags. Committed trajectories protect
  moving fuel openings and are included in rear encounter escape checks.
- Triplanar sandstone texture, warm daylight, one bounded 1024px directional
  shadow map, contact shadows, lit tunnel ribs, torches and two local fill lights.
  Dust, smoke, sparks, local explosions and short-lived instanced debris.
- Three positional rival engine voices, flyby pitch changes, stalled sputters,
  collision/catapult cues, crowd bed and tunnel echo. Eight Sunscar loops, at most
  18 one-shot voices; existing effects/ambience/mute settings remain authoritative.
- Reused hull/prop geometry and visual pools. Fixed 1,536 dust / 512 smoke / 512
  spark / 96 debris slots, 64 queued events / 40 effects, two torch lights. Quality scaling
  affects decorative particles only and leaves collision/warning behavior intact.

## Validation and limits

Automated scene execution uses the actual game loop and triangle collisions with
a non-rendering canvas adapter. It verifies all 20 ships × three difficulties,
early/middle/late flights, six course sections, reachable moving rings and fuel,
red-ring gating, actual racer/gate/tunnel contacts, pause/restart, all-world
cleanup and saved progress. This is not observed graphical gameplay.

`sunscar-fairness.mjs`: 90 actual-position cases across three modes, early/middle/
late speeds, boundaries, steering reversals, low fuel and active evades; combined
terrain/volley checks, boxed-escape delay, simultaneous rear warnings and overflow
coordination. A sampled predictor is not a formal proof over arbitrary inputs;
phone testing is still needed to tune perceptual timing and unusual manoeuvres.

`sunscar.mjs`: 36 seeded 90-second fields; 1,152 committed shots and 69,120 route
samples, true forward speed classes, contacts, terrain crashes, stalls, cleanup.
`sunscar-resources.mjs`: 30-minute resource simulation (50 ms resource-only steps,
not a collision accuracy test): peaks 37 racers, 10 scenery tiles, 17 batteries,
31 effects, 22 pending/live shots and a 48-entry visual pool. Geometry stabilizes
at 80 shared geometries after warmup. No FPS or GPU memory claim is made.

Regression checks cover progression/fuel bounds through 30 minutes, varied rings,
red timing, legacy saves/rewards, all 20 ship envelopes, unlimited evades/control
layouts, existing world execution, environment cleanup and Neon City's fixed
light budget. Seven expanded material programs compile and link through native
EGL, including instancing, sandstone and animated flags.

No supported browser preview is available in this managed environment. Actual
rendered before/after frames, on-phone touch play, GPU frame time, thermal behavior,
shadow quality, texture loading and audio listening have not been observed here.
They remain explicit device-QA limitations, not claimed passes.

## Asset provenance

`dist/assets/sunscar-sandstone-v42.webp` (641 KiB) is an imagegen-generated sandstone
albedo, encoded as WebP without cropping. Generated with the built-in imagegen
tool. Final prompt:

> Create a seamless tileable photorealistic golden desert sandstone ALBEDO texture
> for a cinematic mobile racing game's canyon cliffs. Full square image is only
> the natural rock surface, front-on orthographic, uniformly diffuse lit, no
> perspective, no objects, no sky, no text or border, no cast shadows or baked
> directional lighting. Weathered warm ochre and pale copper sedimentary sandstone,
> irregular eroded fine laminations, chipped mineral edges, granular sand pores,
> subtle mineral streaks, sparse shallow fissures and mottled variation. Geological
> detail at multiple scales. Avoid regular horizontal stripes and obvious
> repetition; natural uneven layered structure. Seamlessly wrapping edges.
> Realistic high quality PBR base-color surface, bright enough for strong sun and
> warm reflected light.
