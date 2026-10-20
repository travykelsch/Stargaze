# Ember: continuous volcanic activity

The existing Stargaze project, save key, twenty free ships, purchases, controls,
fuel, ring contact and rewards are retained. Forward speed factors remain
1 / 1.55 / 2.15. Only Ember's hazard trajectories and artwork are replaced.

## Motion and collisions

- Fireballs use origin + velocity × elapsed time − gravity × elapsed time² / 2.
  They are hidden before launch and after landing, never visibly parked awaiting
  proximity. Falling fire enters from above already descending. Side launches
  originate at river height, crest, and fall. Higher difficulties increase actual
  ballistic velocity/gravity as well as the existing encounter density.
- Encounter timing inverts the unchanged forward acceleration curve. Every
  sector includes rain, launched fire, a drifting island and a liquid eruption.
  Existing launch safety filtering remains. Ambient fountains are visible from
  the opening seconds and have independent continuous ballistic clocks.
- Large rock clusters are removed. Thirty-two-section deforming, capped liquid
  surfaces grow along ballistic parcel trajectories, stop emitting, retract and
  collapse. The four patterns cycle through overhead arch, vertical jet, left
  splash and right splash. Advected cooling crust, thin strands and forty small
  droplets per splash accompany the connected surface.
- The visible connected liquid mesh is also the triangle collision mesh. There
  is no filled arch box, central boulder or invisible simplified collider.
  Concave ray parity preserves its opening. Thin edge strands/droplets are
  decorative. Each emitter has a swelling, pulsing river surface and a warning
  sound before launch. Generated paths reserve the gold route and nearby rings.
- Physics continues using bounded substeps (at most .01 seconds and one unit of
  forward travel) for fast collision checks. Pause freezes all simulation clocks.

## Art and resource use

Ruins, basalt cliffs, jagged volcanoes and floating islands are retained. Lava
cascades now have folded, scalloped surfaces, moving crust and thinning lower
strands; their source/landing transforms are retained. Smoke geometry billows
and drifts, ash falls, and embers rise. Fire trails face opposite actual velocity
and leave small sparks. Rock/fire/particle geometry is shared and instanced;
liquid geometry is owned and released, including droplet instance buffers, on
retirement/restart. Ambient scenery remains recycled by sector.

## Validation

- Pure trajectory/route tests sample 214,060 clearances across all difficulties;
  motion tests exercise 12,800 fireball trajectories, all four splash lifecycles,
  growing streams, cessation/collapse, hidden launch/death and frozen clocks.
- Actual Three.js geometry tests check finite positions/normals, surface maps,
  source locations, rendering pools and recycling. Eight scenery sectors use
  118 scenery meshes/batches and approximately 157,000 triangles before hazards.
- Native OpenGL compilation/linking checks 26 expanded material variants,
  including liquid, animated falls, smoke, fire, maps and instancing. This is
  shader validation, not browser visual verification.
- The non-rendering game harness covers the real controls, collision routine,
  wingtip rings, all twenty ships, mode changes, rewards, save data, safe routes,
  restarts and pause/resume. Added checks put a ship underneath the liquid arch,
  against its surface, above it, and outside a fireball's active lifetime; they
  verify distance-independent movement and effect disposal.

No supported browser-control capability was available. Animated appearance,
phone frame rate, touch responsiveness under rendering load, and the audible
warning/mix remain unverified on physical iOS/Android devices. Human playtesting
is still needed to tune perceived chaos, readability and encounter difficulty.
