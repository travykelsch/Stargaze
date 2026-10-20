# Gradual survival progression

Five existing worlds and all three difficulty modes share one simulation clock.
Every 30 seconds, a 12-second smooth transition introduces another bounded
increment. Starts are staggered: forward speed and ring motion at 0:30, ring
size at 1:00, scarcity at 1:30, object motion at 2:00. Generation time and actual
arrival time use the exact integral/inverse of the same speed curve. Pausing
stops progression, target motion and fuel; restarting returns to zero.

## Limits

- Forward speed: 58 approaching 120 units/s, times the existing 1/1.55/2.15 mode
  ratios. Each increment is smaller; no jump at a milestone or eventual forced end.
- Ring radius: 100% approaching 78% of original (gold 3.588, precision 2.34,
  daredevil 1.677). Size is fixed when generated, not changed under the player.
- Ring movement: smooth independent lateral/vertical oscillation bounded by
  +/-1.35 and +/-0.8 units. Collision sweeps use both previous and current target
  positions. Visual ring, label, pickup and collection burst share coordinates.
- Scarcity: up to 72% of isolated odd rows may disappear. Even rows always remain;
  maximum spacing 380 units. An omission is permitted only when its full gap
  costs at most 6.5 fuel at the maximum 2 units/s drain; a normal gold refills 7.
  Early rows remain, and no consecutive rows can be removed. Easy mode delays
  omissions until its slower speed makes wider gaps sustainable. Optional rings and
  precision bonuses are unnecessary for the protected route's fuel sustainability.
- Object motion: approaches 1.35x, in addition to existing motion. Ordinary rocks
  and wildlife use an integrated continuous clock. Ember/Frostveil trajectories
  increase their planned velocity/gravity, preserving their exact encounter
  positions and rerunning clearance reservations. City paths increase mobility
  before trajectory safety checks. No new obstacles or density increase added.

## Fairness

The original moving flight route is retained and remains within steering limits.
A moving gold ring's entire offset lies inside its minimum opening around that
route. Ring reservations expand 1.6 units for moving targets. Ordinary rocks and wildlife additionally reserve the route across their full
longitudinal movement envelope, including a conservative interpolation margin.
Existing world route and projectile reservations, advance warnings and collision checks remain.
No chasing obstacles, AFK detection or time limit were introduced. Off-route
mistakes can still be fatal; this establishes a survivable route, not a guarantee
that every player position always has an escape.

Fuel, rewards, prices, preview selections, ships, controls and saved-data schema
are unchanged. Existing density and drain curves are retained.

## Verification

See tests/progression.mjs for smoothness, finite caps, integrated clock/inverse,
long-run worst-case fuel balance across 40 seeds and three modes, isolated row
omissions, and moving ring bounds across all worlds. tests/progression-runtime.mjs
executes actual late-run scene collisions and bounded steering for 65 seconds
in every world/mode at the 10-minute mark, without evades or bonus-ring targeting.
Other runtime, controls, mechanics, mode, reward, ring and audio regressions also
run. The non-rendering adapter does not establish visual quality, device frame
rate or physical thumb feel; browser control is unavailable in this environment.
