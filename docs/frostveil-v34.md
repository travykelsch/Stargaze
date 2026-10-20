# Frostveil — fifth world

Frostveil is a separately selectable world with the existing Easy, Medium and
Hard settings. The original four worlds, all twenty free ships, purchase records,
prices, credits, settings, steering, fuel, wingtip rings and rewards are retained.
The save key and version remain unchanged; Frostveil receives its own three
world/difficulty records without assigning or replacing old records.

## Art and hazards

- Blue-hour mountain valley with four jagged peak profiles, three glacier wall
  profiles, layered snow ledges, fluted frozen waterfalls attached to shelves,
  distant natural ice bridges and geometric fissures below matching floor holes.
  Mountains, bridges, ground and weather are decorative.
- Pale blue ambient light, warm distant sunlight, cyan ice rim light, violet
  horizon, subtle animated aurora colors in the glacier floor, two soft distant
  aurora layers, drifting low cloud and 580 bounded snow particles. Blizzard
  strength pulses smoothly rather than covering the view with opaque fog.
- Small shards use continuous launch-clock trajectories with gravity, wind,
  varied velocity, size and tumbling. Four shared faceted ice geometries are
  rendered in instance pools, with short bounded snow trails. Shards are hidden
  before entry and after falling below the valley; no proximity-gated waiting.
- Medium snow vortices move left/right and diagonally along curving paths, bend
  along their height, and rotate layered snow textures and 140 thin particles.
  The dense closed core is the collider; loose snow is harmless. Medium counts
  are capped per sector to limit transparent effects and avoid overpopulation.
- Large transparent aurora bands have five patterns: arch, descending high
  curtain, rising low wave and side sweeps from either direction. Connected
  closed meshes deform with time, build up, pulse, fade and leave. The visible
  substantial band is also its concave triangle collider; the opening contains
  no hidden solid. Faint arrival/departure phases are nonlethal. Core and curtain
  sounds warn before entry; a separate overhead aurora stays decorative.
- Shared effects and ambience buses include icy impact tones, directional vortex
  wind, aurora tones and a changing cold wind bed. Existing gesture unlock,
  master mute, volumes, pause/background lifecycle and voice limits are retained.

## Fairness and performance

Encounter clocks invert the unchanged forward acceleration curve. Shards use
elapsed time, velocity and gravity; vortices and curtains have explicit timed
lifecycles. Easy/Medium/Hard retain speed factors 1/1.55/2.15, while Frostveil
motion factors increase from 1 to 1.25 to 1.55 and existing density curves remain.
Generated hazards reserve the moving fuel route and nearby optional ring space.
Initial safety filtering and bounded collision substeps remain in the real game.

Scenery uses shared geometry/materials and recycled instance batches. Eight
sectors contain 83 scenery batches/meshes and about 81,000 triangles before
hazards. Shard trails cap at 4,096 points. Dynamic curtain/vortex geometry and
owned curtain/wisp materials are released when retired or restarted; persistent
instance pools are emptied and hidden rather than repeatedly allocated.

## Verification

- `tests/frost.mjs`: 26,087 continuous shards, 1,664 moving vortices and 720
  curtains across all difficulties; all five curtain patterns; 402,906 sampled
  route clearances; reachable optional rings; finite geometry, pause clocks,
  bounded scenery, recycling and preserved saves.
- `tests/frost-runtime.mjs`: the actual game with a non-rendering DOM/renderer
  adapter. All twenty ships launch on each Frostveil difficulty, three protected
  flights survive 60 seconds, and the real collision routine detects the aurora
  surface and vortex core while preserving the arch opening and harmless wisps.
  Checks also cover distance-independent shard motion, wingtip ring collection,
  single reward settlement, pause, repeated restarts/mode switches, owned
  geometry/material disposal, persisted records and 390×844/1280×800 resize paths.
- `tests/frost-shaders.mjs | tests/compile-shaders.py`: 20 expanded native OpenGL
  shader programs compile/link, including ice/glacier standard materials with
  surface maps and instancing, aurora, snow core/wisps, floor, sky and weather.
- Existing runtime, mechanics, difficulty, environments, Ember motion/art,
  rewards, fleet/exhaust and mock Web Audio checks pass. Audio checks include
  repeated Frostveil entry, no duplicate loops, mute, volumes and storm cues.

## Remaining human checks

No supported browser-control skill is available in this environment. No actual
browser animation inspection, rendered phone layout review, listening test or
physical-device FPS measurement was performed. Native shader compilation and
non-rendering viewport tests do not establish those results. Playtest iOS Safari
and Android Chrome for snow/aurora readability, motion feel, sustained frame rate,
touch response, sound mix and perceived difficulty. Protected-path flights are
fairness checks, not typical-player survival estimates.
