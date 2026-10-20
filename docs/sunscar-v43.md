# Sunscar v43 — alien civilization, material and lighting pass

Project appgprj_6ad52aaee95481918985e3f136299301; audience unchanged.
Baseline: deployed v42, commit d9a8a5e92b55fb6be6cc3fbf030494d5f6405e3b.

## Audit

V42 had a busy racing field but one main sandstone treatment, globally similar
lighting, small camps and little response to accidents. Its camps could also be
occluded by the continuous cliff volumes: batteries at x=55 sat behind walls
starting at x=42. Furnace decoration placed outside those volumes would likewise
be hidden. V43 changes actual visible wall geometry to expose battery recesses,
opens the market canyon, and places furnace fittings inside the tunnel opening.
The player's reachable corridor and all existing hazard reservations remain.

The source audit identified nested multi-mesh catapult rigs, repeated individual
mechanical parts, translucent particle overdraw and shadow passes as important
costs. V43 merges each launcher into chassis/arm/stone draws and caches 18 regional
prop kits; crowds use shared species geometry and instanced moving body/arm parts.
No new dynamic lights or live reflection probes are added. One small static
procedural desert panorama is filtered by Three for material reflections.

`tests/sunscar-scene-audit.mjs` reproduces a non-rendering scene inventory at seed
113, Medium, t=12/24/36 s, with 390×844 framing metadata and FOV 66. The baseline
and result fixtures are `sunscar-v42-scene-baseline.json` and `sunscar-v43-scene.json`.
All-visible mesh submissions fall from 623/592/507 to 509/470/438 (about 18% on
average), while richer geometry grows from ~371k/412k/340k to ~388k/512k/443k
triangles. These counts include off-camera meshes and are not GPU measurements,
rendered screenshots or measured phone frame rates.

## Delivered identity

Six coherent sections: Grave Run, Glassbone Reach, Shattered Crown, Furnace Cut,
Sunbreak Basin and Red Market. Shared palette: ivory, copper, violet shade,
restricted turquoise mineral deposits, crimson clan fabric and amber warnings/fire.

- Geology materials use triplanar color, multiscale sediment/mineral variation,
  derivative bump relief, mineral roughness and upward dust accumulation. Warm
  sand has fine wind ripples and track variation. Machinery uses grime, heat
  discoloration and variable roughness. Textures remain object-anchored.
- Six continuous lighting profiles control sunlight, cool sky fill, warm reflected
  ground light, exposure and atmospheric depth. An analytic desert environment
  supplies real filtered specular reflections to metal and cockpit glazing.
  Daylight uses the existing 1024px shadow budget; tunnels retain two local lights,
  practical fixtures and readable ambient fill. The sky adds violet haze and wisps.
- Cached landmarks include mineral needles/fossil ribs, broken mesa caps and
  bridges, tiered markets, balconies, awnings, vent machinery, salvaged turbine
  wrecks, debris and scorch marks. Market walls recede behind the settlement;
  other canyon walls have authored recesses around visible battery positions.
- Three masked/armored alien species; loading, signaling, cheering and mechanical
  gestures. Market crowds duck after nearby crashes; catapult crews react too.
  Loaders visibly carry stones. Windblown flags, machinery and distant creatures
  provide motion between racing events. Decorative objects stay outside the
  reachable flight envelope and have no hidden gameplay collisions.
- Four racer clans: Ash Knives attackers, Glass Wraith specialists, Crown Hammer
  bruisers and Dust Saint survivors. Matching liveries, crests, pilot helmets,
  transparent cockpit glazing, mass/health/aggression and engine timbres. Rivals
  maintain opponents, feint, block, seek gaps, yield and react to moving wrecks.
  Existing rear safety retains authority over unsafe acceleration and passes.
- Layered hot exhaust cores, corrected aft flame taper, loose damage panels,
  individual failing exhaust and smoke sources. Sparks originate between rival
  contact positions. Dust, smoke and sparks fade by particle lifetime; debris
  remains brief and bounded.
- Engine-family pitch/timbre, subdued duel effects and region-dependent crowd and
  machinery ambience. Sunscar reserves one-shot capacity for safety cues. Existing
  other-world audio limits, mute and volume settings remain unchanged.

## Validation

Automated/non-rendering checks:

- Actual game-loop scene execution: 20 ships × three difficulties; nine early,
  middle and late flights using ordinary steering, real triangle collisions and
  normal fuel consumption. Pause/restart, real racer/gate/tunnel collision, red
  timing, saved progress and all-world cleanup are checked.
- 90 rear-fairness position/velocity/evade cases, low fuel, simultaneous approaches,
  combined terrain/projectile checks and delayed unsafe passes.
- 36 seeded racing fields; 1,152 committed shots and 69,120 protected-route samples.
- Identity checks raycast actual wall meshes to verify that a battery and market
  are visible from the course. They also check reflection orientation, cached
  templates, crowd accident reactions, smooth lighting and rival intents.
- 30-minute resource simulation (50 ms resource-only steps): peaks 40 racers,
  10 scenery tiles, 17 batteries, 29 effects, 22 pending/live shots, visual pool 48.
  Shared geometry stabilizes at 161 after warmup. This is a cleanup/resource test,
  not a high-speed collision or GPU-memory benchmark.
- Ten expanded Three material programs compile/link through native EGL: geology,
  machine finish, flags, sand, fading particles and sky, including instancing.
- Regression checks include progression/fuel bounds, fleet geometry, rewards,
  environment cleanup, existing-world execution and unlimited evade controls.

No supported browser preview is exposed in this managed environment. Actual
rendered before/after frames, texture/shadow appearance, phone touch play, audio
listening, thermal behavior, GPU timings, and 60/30 FPS targets were not observed
or measured. No device performance or visual-quality pass is claimed.

No save schema, ring progression, flight-speed clock, player controls, rewards,
selectable ships or other-world scenery were changed. Source packaging and
publication preserve the existing project identity and access configuration.
