# Continuous multiplayer movement repair

The v57 release still failed the user's phone play test, including solo rooms
with three bots. Connection and short scene-construction tests had not proved
continuous play. This release addresses measured presentation discontinuities
and unnecessary server simulation work.

## Reproduced and changed

* A 12-second continuous Sunscar game-adapter run, with one human and three bots
  and 90/240/130/400ms delayed API delivery, recorded 12 forward jumps, including
  a 36.02m frame advance. The earlier motion path dropped correction error beyond
  15m, reset time on snapshot receipt, and stopped prediction after 350ms.
* Presentation time now advances continuously and corrects pace gradually. A
  fresh snapshot preserves the displayed position; forward correction is repaid
  at at most 20% of forward travel per frame. Repeated stale snapshots cannot
  reset the outage timer. Prediction stops after a bounded 1.5-second horizon.
  Crashes, checkpoints, fuel, rewards and all other decisions remain server-owned.
* Remote pilot hulls retain their intended opaque materials and depth writes.
  Previously every material was forced transparent with depth writes disabled,
  even for craft superimposed at the common start. Nonblocking craft within 12m
  of the viewed pilot are hidden to keep the cockpit clear; standings retain
  their identities. This changes presentation only, not movement or collision.
* Sunscar NPCs get bounded presentation tracks, preserving their displayed poses
  across delayed snapshots, with continued movement during ordinary update gaps.
  No client racing AI or client-owned hazards are introduced. Tracks are removed
  when actors retire and reset between runs.
* Network HUD updates are limited to 10Hz while scene motion remains frame-driven.
* The server's encounter planner receives unique obstacle handles instead of up
  to four copies of the same terrain. Every distinct obstacle remains included.
* Exact collision triangles use cached world vertices until geometry or its
  transform changes. This avoids repeatedly transforming the same vertices for
  every ship sample, substep, and pilot. The cache uses weak references; geometry,
  attribute version and world-matrix changes invalidate it. No simplified collider,
  extra immunity, enlarged opening, or collision bypass is introduced.

## Checks and limits

1,260 exact collision comparisons against the retained v57 implementation pass,
including rotation, nonuniform scale, concave openings and edited geometry.
Deterministic 600ms snapshot-gap checks verify no packet-boundary forward jumps,
continued movement and bounded eventual stopping during an outage. NPC correction
and cleanup checks also pass.

The repeated 12-second delayed Sunscar adapter run recorded zero forward jumps;
this is execution of actual Three.js scene transforms with a non-rendering
renderer. It is not a pixel inspection, audio check or phone FPS measurement.
The comparison uses the same delay pattern, but live room seeds differ.

An initial public-service run with the client changes and the old server still
recorded 47 stationary frames out of 706 active samples. This justified the
additional server optimization; it must not be described as proof of smooth play.
Production checks after deployment are reported separately. D1-backed exchanges
remain a latency limit, especially on impaired connections. Actual iPhone visual
and touch testing is unavailable in this environment.

## Public-service follow-up

After publishing both client and server changes, the actual game adapter connected
to the public service in a solo Sunscar collector room with three bots. The first
12-second run recorded 702 active samples, zero stationary frames, zero forward
jumps, and no invalid coordinates. The scripted human had zero crashes; bots had
one crash each. This did not rasterize the scene.

A further 45-second run recorded 2,648 active samples, zero forward jumps and
zero invalid coordinates. The scripted human had zero crashes; two bots crashed
once each. There were still 20 stationary frames when the bounded prediction
horizon was exhausted. The longest observed gap between progressing snapshots
was 857ms. This is a material remaining latency limitation, not a flawless-play
claim. Networking and actual phone GPU/touch performance remain separate checks.

An isolated local 30-second physics comparison with the same seed and controls
took 5,858ms using the previous triangle query and 4,592ms using the cache, with
identical crash counts [0,0,1,0]. Both used the deduplicated encounter planner.
These are local CPU timings, not service latency or device FPS measurements.
