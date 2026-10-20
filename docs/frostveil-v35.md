# Frostveil — beauty and cold chaos

This pass replaces the rounded aurora band and uniform tornado silhouette,
rebuilds the glacial scenery and refines lighting/weather. Existing course counts,
forward speeds, controls, fuel/rings, rewards, saves, settings and ships remain.

## Visual changes

- Aurora: thin, connected pleated sheets with 56 longitudinal sections and eight
  height subdivisions. Broad traveling folds and smaller lagging pleats replace
  the rounded cross-section. Fine irregular filaments, altitude color gradients,
  soft edges, traveling pulses and distance-filtered detail produce green/cyan
  light with restrained violet/pink upper edges. One outward-facing surface is
  drawn for the closed sheet to avoid doubling transparency. Distant decorative
  auroras use the same filament shading and more detailed pleated scenery.
- Tornado: uneven core with a narrow neck, traveling bulges and radial lobes;
  three ragged helical snow ribbons; clustered source/crown cloud quads; and
  rising, circulating particles. Core shading combines dark inner folds, soft
  silhouette opacity and cold edge light. Different seed phases vary shape,
  lean, rotation and swelling. Its base stays on the glacier during translation.
  Thin spirals, powder and crown/base wisps remain decorative.
- Terrain: four ridgeline heightfields replace cone-like mountains; three denser
  glacier faces add fractured shelves, overhangs and compressed layers. Frozen
  cascades are groups of nine irregular, bulging icicles with uneven lengths.
  Natural bridges have a rough snow-capped cross-section. Snowy boulders connect
  ledges and cascade bases; real-depth fissures remain outside the flight path.
- Materials/lighting: slope-sensitive snow coverage, darker layered rock,
  world-space fissures, fine grain, differentiated roughness and denser blue ice.
  Lower ambient fill and stronger warm directional light reveal relief; cold rim
  light and one bounded nearby aurora light add restrained color separation.
- Weather: coherent integrated wind advection shared by snowfall and powder,
  rolling ground spindrift, billowing cloud geometry and layered sky clouds.
  Existing particle limits and clear/gust rhythm remain. Shards have more varied
  broken facets while retaining their continuous fast falling trajectories.

## Collision and resource behavior

Aurora collision shares its exact animated vertex buffer but excludes the faded
outer fringe. This thin surface uses triangle contact rather than a filled-volume
test, so its openings and harmless fringe remain usable. Tornado collision uses
the substantial deforming core. Route reservations follow the revised curve and
core bounds. Existing fast physics substeps and safe launch filtering remain.

Materials/geometries are shared where possible. Per-hazard sheet, core, spiral and
cloud geometry is released on retirement/restart; cloned aurora/wisp materials
are released once. The aurora collider shares the visible position buffer rather
than duplicating animation work. Reset clears clocks, pools, trails and local
light intensity. Eight scenery sectors remain 83 batches/meshes, with about
176,000 triangles before hazards (up from about 81,000 in v34). Actual visible
cost depends on frustum culling; this is not a phone FPS measurement.

## Verification

- Frostveil course/geometry checks: 26,087 continuously falling shards, 1,664
  translating vortices, 720 temporary curtains, all five curtain patterns and
  402,906 route-clearance samples. Nearby rings, finite geometry, paused clocks,
  resource recycling and preserved save records pass.
- Actual game, non-rendering adapter: all twenty ships launch in all three
  Frostveil difficulties; three 60-second protected flights survive; the real
  collision routine detects every curtain pattern's visible substantial surface
  and preserves its escape route. Arch opening, vortex core/harmless powder,
  wingtip collection, pause/resume, repeated restarts, mode switches, owned
  geometry/material disposal, reward settlement and saved records pass.
- Native OpenGL: 24 expanded shader programs compile/link, including terrain and
  ice with their actual vertex-color flags, normal/bump maps and instancing,
  thin aurora, core, snow ribbons, clouds, floor, sky and weather.
- Existing runtime, mechanics, rewards, difficulty, environments, fleet/exhaust
  and mock audio checks pass. No new audio behavior was introduced in this pass.

## Remaining visual/device checks

No supported browser-control capability is available. No actual browser animation,
rendered phone viewport, transparency-sorting inspection, listening session or
physical-device frame-rate measurement was performed. Shader compilation and
non-rendering gameplay execution do not prove visual quality. Phone playtesting
should assess tornado volume, aurora softness/transparency/sorting, ring and
hazard readability in gusts, sustained frame rate and the overall light balance.
Protected-route test flights are not measured typical-player survival times.
