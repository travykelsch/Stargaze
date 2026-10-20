# Red introduction and varied ring course

Red/Daredevil rings are absent from encounters through 90 seconds in every mode.
Their independent seeded spawn chance eases from zero over the existing
30-second progression cadence, approaching a maximum 90% of retained rows.
Gold-row scarcity still applies; red rings never replace required fuel rings.
Gold/cyan/red sizes, rewards and fuel values are unchanged.

A second runtime gate hides queued red rings before 90 seconds and excludes
pickup before that threshold. This prevents generation lookahead from revealing
reds early. Pause uses the simulation clock; restarting restores the opening.

The protected course now mixes two seeded lateral wavelengths and two gentle
vertical wavelengths (up to 2.3 units). The vertical weave continues through the
former flat altitude plateaus. It begins easing in at 0.5 seconds, while the
existing 3.3-second obstacle-free opening remains. Gold rings follow that course;
optional cyan/red rings inherit the varied altitude with their existing lateral
placement, size and value differences. Individual moving-target motion remains.
All worlds reserve this same new continuous route, rather than moving rings
away from their protected fuel path. Speeds, fuel economy, settings and saves
retain the previous update's behavior.

Verification includes actual generated same-value ring chains, early/late red
frequency across seeds, all-world target bounds, continuous steering limits,
worst-case gold-only fuel budgets and the stationary-flight bound. Non-rendering
runtime tests cover red visibility, pause/restart, all ring pickups, normal game
behavior, and active survival in all 15 world/difficulty combinations over the
80–125-second introduction and 600–635-second late-game windows. No browser
control is available; rendered phone feel remains a human playtest item.
