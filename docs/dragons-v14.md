# Dragon flight and realism pass

Dragons now traverse their existing bounded 3D paths 28% faster. Birds, player controls, mode forward speeds, obstacle counts, fuel, scoring, saves, and cosmetic ownership are unchanged. The path envelope and forgiving torso collision remain, so additional horns/tails/wing detail do not create extra invisible hazards.

The model adds a smoothly lofted muscular torso and arched neck, longer reptilian snout, nostrils, mouth seam, brow ridges, tapered horns, cheek spurs, shoulder folds, talons and segmented belly plates. Subdivided membranes curve between tapered ribs and meet at raised wrist joints. Shared mipmapped scale and tissue textures add low-cost color/relief detail; eyes use an independent glossy material. Flapping includes a slightly quicker asymmetric power stroke, distal wing flex, shoulder sweep, continuous glide blending and tail counter-motion.

Per dragon: fewer than 8,500 triangles and seven visible meshes, with shared geometry, materials and four cached 128×128 surface maps across the population. Birds retain their previous geometry/materials. No post-processing or shadow-map passes were added.

Verification: world-art tests cover finite geometry, outward normals, bounding envelopes, 28% speed ratio, all 3D flight directions, analytic headings, continuous flap/glide transitions, raised wrists and generated mipmapped material data. Existing mechanics/modes/fleet/environment/reward/audio/runtime checks pass. Isolated mesh renders were checked for anatomy and wing attachment; these do not render the WebGL materials. Actual in-game texture appearance, animation and phone frame rate remain for real-device playtesting because no supported browser-control capability is available.
