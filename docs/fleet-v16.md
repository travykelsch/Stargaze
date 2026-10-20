# Player fleet identity and detail pass

All ten player designs were refined in the existing model builder. Ship IDs, saved selections, ownership arrays, prices and free previews remain intact. Core controls/colliders, fuel, difficulty, rewards, world models and the latest dragon motion are unchanged.

- Batwing: 1989-inspired broad curved crescent, cowl ears, deep actual scalloped cutouts, sculpted graphite canopy, layered armor, wing ribs, recessed jets and a small gold bat emblem. A modest visual climb pose exposes more of the deck in chase view; gameplay collision samples remain unchanged.
- Podracer: Anakin-inspired yellow twin turbines, visible intakes/fans, clamps and cooling vanes, exposed aft burners, very small trailing cockpit/seat, long flexible-looking cable pairs and a flickering ion binder. The gap between engines and cabin is truly open model space, not a wing.
- X-wing: new faceted long-nose hull, framed canopy, independent open foils with cannon assemblies, Red Squadron stripes, four wing-root engines and an astromech dome.
- Falcon: paired mandibles, starboard cockpit access tube, layered saucer panels, radial seams, six cooling fans, dish, dorsal turret details and broad blue rear engine band.
- Enterprise: concentric saucer details, rim windows, NCC-1701 registry, raised bridge, engineering hull, swept supports, long nacelle grilles and Bussard/deflector details.
- TIE: black solar cells and dense grids/braces on both panel faces, hexagonal frames, spherical cockpit/window cage and aft detail.
- Iron Man: preserved chest-down/head-first pose, added back armor, gold seams, spine articulation and boot details; aft hand/boot repulsors remain correctly oriented.
- Original gunship, stealth fighter and solar craft: more coherent armor panels, glazed cockpit/turret detail, recessed drives, copper cell arrays and reinforced sail frames. Their descriptions now explicitly identify them as original designs. Recognizable-inspired models have clearer Shipyard display names; persistent IDs are unchanged.

Static surfaces are baked by material, leaving animated exhaust and named feature meshes separate. The ten ships use 10–20 draw meshes in this version rather than dozens/hundreds of individual panel draws. All fit the existing 6.15 × 2.9 × 5.1 visual limits. Maximum model detail is under 20,000 triangles. Per-selection cleanup still disposes all generated geometry/materials.

Validation includes finite geometry, draw/triangle budgets, unique meshes, fitting bounds, aft exhaust directions on every ship, Iron Man orientation, an actual ray test through Batwing scallops, and bounding checks that the podracer cabin is far aft and substantially smaller than its two separate engines. The actual game loop tests all ten ships across all three modes, free selections, saved credits/ownership, fuel/rings/wingtips, pause/crash/restart and protected routes.

Isolated meshes were visually inspected in software renders from elevated and low chase angles. Those checks verify shape/detail placement, not the actual WebGL lighting or phone FPS. No supported browser-control capability is available, so final in-game appearance/performance requires real-device playtesting.
