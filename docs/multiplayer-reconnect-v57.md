# Multiplayer connection and launch recovery

This release hardens the v55 WebSocket and first-frame loading barrier. It does
not change collision rules, single-player saves, rewards, or bot difficulty.

* Socket callbacks and pending replies belong to a specific connection. A late
  close, error, or reply from a replaced socket cannot interrupt the current one.
* Leaving cancels queued requests and pending handshakes. Old requests cannot
  reopen the connection. Synchronous send failures release their timers.
* The host can cancel preparation or countdown from the pause menu. A departure
  during launch also returns the room to the lobby. Starting again fills vacant
  seats with bots, preserving the four-pilot roster.
* Preparation stops after 60 seconds without all human first-frame acknowledgments.
  The next request returns everyone to the lobby; there is no simulated flight,
  crash, fuel loss, result, or reward for an aborted launch. Inactive rooms are
  demand-driven and therefore recover when a client next contacts the service.
* A connected human inherits launch controls if the host stops responding.
  Loading/cancellation packets carrying a previous round are rejected.
* The frontend accepts a higher-revision countdown-to-lobby transition even when
  the countdown's scheduled simulation timestamp was in the future. It tears down
  the flight scene before showing the recovered lobby.

Validation: targeted transport/lifecycle tests; four-client workerd WebSocket
integration; multiplayer and bot API regression tests; actual Three.js game
adapter at 390x844 with three bots and scripted 90/240/130/400ms request delays,
including cancel/relaunch, camera ownership, all six world animation adapters,
NPC crash effects, results and save isolation. The scene harness does not draw
pixels or play audio. No physical phone performance or visual smoothness claim.

Production service verification is reported separately after publishing. Existing
D1 round-trip latency remains a practical limit; these repairs do not establish
that all latency-related steering/collision presentation issues are resolved.
