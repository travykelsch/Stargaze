# All-world fairness and no-input audit

## Root cause and changes

Higher difficulties reduced the gold-ring positions toward the center while the
generator protected that same central route. This could leave Orion's stationary
player both safe and repeatedly refueled. Earlier protected-route tests confirmed
an escape route but did not test the opposite failure mode: effortless survival.

Every world now uses a seed-varied, smoothly moving route in simulation time.
Its lateral movement continues throughout a run; altitude alternates between
two bands with gentle six-second transitions. Gold and optional fuel rings share
the moving altitude band, so stationary bonus-ring farming cannot substitute for
following the route. Optional ring sides and scores/refueling remain unchanged.
The short safe opening, speeds (1/1.55/2.15), density curves, steering, fuel drain,
ring contact, rewards, prices, ownership, saved progress and all ships remain.

This is level design, not an AFK detector, forced-crash timer or obstacle that
tracks the player. The existing generators reserve their moving escape path
against the new route. Center space is no longer permanently reserved.

Frostveil ice and Ember fire receive fixed predicted-crossing brackets and a
directional warning cue up to 2.6 seconds ahead. The white/amber bracket/chevron
shape differs from collectible rings. Markers never chase the player or change
the projectile trajectory. They expire at crossing, pause on the simulation clock,
cap at 24 per world, empty on restart and hide on world changes. The warning lead
covers reaction time plus travel from the corridor edge toward the route using
the actual steering rates. Physical projectiles retain continuous ballistic motion.

## No-input fuel bound

The two fuel bands are 28 units apart. Even allowing the largest ring, a generous
four-unit ship contact margin, and the full optional-ring vertical offset, a fixed
altitude cannot reach both bands. Each opposite-band interval lasts 28 seconds;
even allowing boundary timing tolerance, that exceeds a full 24-unit tank drained
at the minimum 1.1 units/second plus all five seconds of coasting (26.82 seconds).
Therefore no stationary position can maintain fuel forever, for any seed, world,
difficulty or selectable ship under the current mechanics. Obstacles can end a
run sooner; this bound does not depend on arranging a collision.

An optimistic simulation that repeatedly grants a full tank whenever any ring
could conceivably be in reach, ignoring horizontal position and obstacles, still
ended every tested fixed altitude by 68.6 seconds. The continuous band-separation
argument covers altitudes between samples as well.

## Actual game logic tests

The real game was executed with a non-rendering DOM/renderer adapter. Thirty
no-input flights (two reproducible seeds for each of 15 combinations) ended.
A separate pilot used the actual bounded steering inputs, without teleporting,
invulnerability or collision bypass, and survived 65 seconds in every combination.
Peak steering was about 29% of available input; the path is comfortably reachable.

| World | Easy idle failure, seconds | Medium | Hard | Active flight, each mode |
| --- | --- | --- | --- | --- |
| Skyward | 12.02–12.03 | 7.95 | 5.83–9.94 | 65 s |
| Orion | 11.25–23.96 | 9.29–16.02 | 6.50–10.16 | 65 s |
| Neon City | 27.54 | 28.32 | 28.60–29.83 | 65 s |
| Ember | 8.44–11.56 | 8.31–8.98 | 7.47–7.85 | 65 s |
| Frostveil | 8.55–13.25 | 8.75–17.77 | 7.72–8.47 | 65 s |

These are test-agent results, not measured typical-player survival times.

## Other verification and limits

- 540,300 route-speed/bounds samples across 100 seeds and all difficulties.
- Actual ring-band generation for all 15 combinations, including transitions.
- 70,519 moving-shard trajectory checks; Frostveil/Ember route and ring checks.
- Fixed warning location/lead, expiry, pause, cap, restart and world cleanup.
- Existing runtime, steering, wings/rings, fuel, collisions, combos, rewards,
  duplicate settlement, saved balances/settings and audio lifecycle checks.
- Native compilation of all 24 Frostveil and 26 Ember shader variants.

No supported browser control is available here. Marker readability, audible mix,
rendered phone layout and physical-device reaction feel/frame rate remain human
playtest items. The tests establish the specified escape-route and no-idle
properties; they do not prove every possible off-route player decision is safe
or that every procedural encounter feels equally fair to a human.
