# Three-world upgrade — implementation and verification

The existing project, renderer, controls, localStorage key and purchase catalogs are retained. All ten ships and five paints remain free previews without granting paid ownership. Existing credit balances, prices, paint/ship ownership, mute choice and legacy records survive migration. Old records with no mode are explicitly labeled as legacy; new records are stored per difficulty.

## Implementation

1. Flight: existing smooth banking and shared handling/collision envelope retained; engine flicker, intensity and exhaust length react to steering and fuel. Ship-specific engine placement/colors remain, with distinct engine pitches. Iron Man's chest-down/head-first orientation and aft repulsors remain covered by fleet assertions.
2. Audio: procedural Web Audio buses for effects and ambience; separate world beds, engine families, collection/refuel/combo/record/menu/launch cues, directional near misses and approaching traffic, restrained low-fuel cues, explosion/sub-bass decay. One gesture-unlocked context, bounded voices, seamless-ended noise buffers, explicit source/filter/gain cleanup, pause/background suspension and saved controls. No external audio downloads.
3. Rewards: immediate, persisted **delta** banking with cumulative rounding. Eligible ring, precision, combo and near-miss earnings are multiplied once by 1/1.5/2. Repeated settlement never pays again. Combo rewards rise by two base credits to a cap of eight; close passes pay three base credits once. Simultaneous cyan/coral alternatives form one opportunity, so choosing one doesn't break the chain. A missed opportunity resets the combo without changing fuel.
4. Worlds: Easy has turquoise water, broad scenic canyon shores, vegetation, waterfalls, moon/clouds, drifting islands and flapping/banking creatures. Arches replace an obstacle and use an actual open torus plus solid columns; rings guide through some openings. Creature collisions send the creature away while the player crashes. Medium retains the quiet solar backdrop, stars, sun, crater textures, rock geometry and original rotation/drift. Hard has instanced skyscrapers/windows/streets, changing animated ads, illuminated bridges, layered decorative traffic and giant distant freighters. Actual traffic uses reserved lanes and longitudinal slots, readable headlights and metal surfaces. Rare speeder merges reserve a swept strip, flash before moving and exclude fuel routes; haulers hold course.
5. Fairness/performance: time-based safe opening; warning lookahead derived from closing speed, full control-range steering time and reaction allowance. Protected gold paths are reachable even at maximum speed. Scenery/water/walls are non-colliding. Triangle tests remain for rocks, arches and traffic; creatures have deliberately forgiving torso boundaries. Reusable geometry/materials, instanced scenery, recycled sectors and short particle lifetimes limit work.

## Reward tuning

Faster modes already encounter more rings per minute. At 60 seconds, the instantaneous gold-only gross rate (no precision, combos or near misses) is approximately:

| Mode | Forward speed factor | Reward multiplier | Credits/minute |
|---|---:|---:|---:|
| Easy | 1 | 1 | 291 |
| Medium | 1.55 | 1.5 | 677 |
| Hard | 2.15 | 2 | 1,251 |

For an illustrative **unmeasured** survival scenario of Easy 60 s / Medium 40 s / Hard 25 s, integrating the acceleration curve and collecting every gold ring gives about 240 / 345 / 380 credits per run, excluding skill bonuses and restart time. This makes clear that difficulty already has a sizable earning advantage. The requested multipliers are retained as initial values in `dist/rewards.mjs`. Human survival times and optional-ring collection rates still need a playtest; the protected-path bot is deliberately not a typical-player benchmark.

## Automated checks

- `node tests/mechanics.mjs`: 37,947 generated placements; fuel/refuel and swept ring contact; preserved paid purchase path, duplicate-charge prevention, free preview, legacy save migration.
- `node tests/modes.mjs`: original Easy speed/fuel/difficulty curves; exact Medium 1.55 and Hard 2.15 speed factors; 28,500 maximum-speed route samples; intended density progression; traffic reservations and warning horizon.
- `node tests/fleet.mjs`: all ten ships, finite geometry, visual envelopes, engines, paints, Iron Man orientation.
- `node tests/environments.mjs`: finite island/creature/vehicle meshes, real collision shapes, bounded draw objects, backdrop switching and scenery cleanup.
- `node tests/rewards.mjs`: multiplier/rounding math, base/skill/difficulty breakdowns, balance preservation, legacy records, combo reset and audio preference migration.
- `node tests/audio.mjs`: **mock** Web Audio checks gesture unlock, one context, repeated mode changes, no duplicate loops, bounded voices, cleanup, mute and independent buses.
- `node tests/runtime.mjs`: actual game logic and Three.js geometry with a **non-rendering** adapter. Exercises start/pause/crash/fuel death/restart, all ring tiers and wingtip grazes, all ten ships across three modes, a measured close pass awarded once, combo/miss behavior, duplicate settlement, open arch/solid column, audio-dialog return flow, mode records, 90-second protected-path flights and 390×844 / 1280×800 resize paths.

## Verification limit and remaining playtest

No supported browser-control capability is available in this session. The Sites skill requires skipping browser QA in this environment rather than installing or improvising a browser. Consequently, **no rendered visual inspection or listening test was performed**, and viewport execution checks do not establish pixel layout or phone frame rate.

Please play each mode on a real phone (especially Safari/iOS and Chrome/Android): assess visual readability, traffic scale and intensity, ring reachability during normal steering, touch feel and sustained frame rate; listen for mix balance, pleasant engine timbres, warning clarity and loop seams. Test mute/sliders, tab backgrounding, resume, repeated restarts and Bluetooth/headphone routing. Credit risk/reward and average survival need human feedback. No measured mobile FPS, subjective audio polish or typical survival claim is made.
