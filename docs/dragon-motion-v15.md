# Noticeably faster dragon motion

The prior animation moved dragons around 3.3-unit-radius loops, making even a percentage speed increase look like hovering. Dragons now use 12–15-unit-radius paths and an explicit 8-unit/s initial travel rate, smoothly rising toward 14; the ellipse gives 75–100% of that tangent speed. Their wing rate is now 12 radians/s (about 1.9 beats/s), versus 3.9 previously, with stronger strokes and only short glides. Birds and all mode/player speeds are unchanged.

Expanded movement envelopes are included in placement clearance and launch warning distance. Spawn count progression, fuel, collisions, credits and save data are preserved. Tests check movement in all directions, analytic headings, a clear fuel route with the new amplitudes, multiple wingbeats in two seconds, substantial travel, continuous glide transitions and the actual game loop across all modes. Real-phone visual confirmation remains outstanding; no browser QA was available.
