# Sunscar world — v41

Sunscar is a sixth destination inside Stargaze's existing endless survival mode.
The 20 player ships, difficulty multipliers, fuel, rewards, ring progression,
90-second red introduction, settings and version-2 save schema remain in place.
Existing world records persist; three Sunscar records are added on load.

## Course and art

Six connected 570-unit families cycle indefinitely: Dune Sea, Needle Canyon,
Stone Gates, Torchlight Hollow, Sunbreak Basin and Outlaw Stands. Per-sector seed
variation changes mesas, pillars, tents and crowds. Geometry includes stratified
sandstone walls, sculpted pillars, real extruded stone gates and enclosed hollow
tunnels, sand floor/dunes, distant layered mesas, alien stands and animated
catapults. Daylight uses a dedicated sky and sun, warm surface shading and dust.
Tunnel daylight eases down while ambient fill and two lazy, reusable torch proxy
lights keep the passage readable; visible torches flicker through point lighting.

The actual tunnel/gate triangle surfaces participate in player collisions. A
collision correction makes concave volumes rely on ray parity rather than an
invalid convex half-space inside test; without it a valid tunnel opening could
incorrectly count as solid. Existing real-geometry collision regressions pass.

## Live race field

Pure simulation lives in sunscar-racing.mjs; rendering in sunscar-world.mjs.
All NPC longitudinal velocities are positive, derived from the real player-speed
curve: slow approximately .46–.68x, matched .94–1.06x, fast 1.45–1.85x. Matched
arrivals first close, then smoothly hold pace for 7–14 seconds before departing.
The field starts with 12 rivals and admits approximately one new racer each
0.8 seconds, subject to caps of 20/23/26 for Easy/Medium/Hard. Six engine-heavy
craft variants use cached merged painted hulls, engine barrels, trim, exhaust,
soft ground shadows and bounded dust. Player ship models are unchanged.

Nearby rivals attract/block/feint around one another; swept relative contact
checks apply shoves and damage. They look ahead to steer around pillars or into
gate openings, with a minority of reckless pilots and real terrain/projectile
crashes. Destroyed racers spin outward and disintegrate after 1.1 seconds; their
bounded visual particles expire by 2.4 seconds. Effects cap at 40 events, and
particle buffers, nearby voices and torch lights are fixed-size/reused.

Incoming fast racers start behind the camera with at least roughly 3.8 seconds
of closing distance plus a buffer. Directional rear warnings trigger on closing
speed, with stereo warning/pass cues. Retirement never removes a fast racer just
because it is still far behind; it must complete an approach or crash. Similar
speed racers deliberately leave after prolonged time nearby. No visible
teleportation or player-following projectiles are used.

Racing targets follow the seeded course, with a reserved 8.8-unit clearance
around it. This reservation follows course position, not the player's position.
The player can leave it for optional rings and encounters. Collision movement,
static obstacles and full catapult trajectories reserve the sustainable gold
route. Survival still requires following its changing altitude/lateral course.

## Catapults and audio

Alien crews occupy side platforms, tents, flags and catapult rigs. The rigs load,
wind up, release a visible stone and recover on the simulation clock. Projectile
trajectories are committed at launch and checked across their full pass; rocks
have soft ground shadows and dusty impacts. Audio adds race-engine ambience,
directional rear/pass/impact/crash cues and catapult/stone effects. A single
filtered short-delay return provides bounded tunnel reflections; no feedback or
new uncontrolled voice creation is used. Existing mute/volume settings apply.

## Verification

- Actual game/scene adapter: all 20 ships in all three modes; three 115-second
  early flights and three 45-second flights starting at ten minutes. Active
  triangle collisions, ordinary steering, real fuel drain and collection; no
  invulnerability, teleporting pilot or collision bypass. All six sections were
  visited; minimum fuel stayed positive and steering peaked below 38%.
- Actual racer body, real gate opening/column, tunnel interior/wall collisions;
  pause/resume, reset, scenery/effect bounds and cleanup into all prior worlds.
- 36 seeded racing simulations; 216 committed projectile encounters / 12,960
  route samples, forward speed classes, passes, rear warnings, rival and terrain
  crashes, fixed caps and saved progress migration.
- Native compilation/linking of five expanded shader programs, including
  sandstone and racer materials in instanced and ordinary use and daytime sky.
- Existing scene/runtime, shipyard, controls, reward, audio, environment, city
  lighting, ring course, mechanics and mode regression checks.

No supported browser control is available in this environment. These checks do
not verify the rendered phone composition, physical-device frame rate, perceptual
fairness or the audible mix. Those remain device playtest items.
