HANZI DEFENCE V1.4

Open index.html directly in a modern desktop browser. No server, npm, external CDN, database, API or build step is required.

V1.2 updates
- DEPLOY requests fullscreen mode; browser refusal does not block the game.
- Turret starts at the exact centre of the active vertical rail.
- Animated 0.8-second SCANNING WAR ZONE rescan, followed by target update.
- Current Target has the largest text and a fully highlighted panel. Next and Third use smaller text.
- Percentage-based turret/ammo state: blue at 30% or above, orange below 30%, red below 10%, green while reloading.
- Recruit, Veteran and Elite challenge levels control Campaign waves, spawn interval, batch size, active swarm cap, rescan period, initial speed and Endless growth.
- Recruit is the default and is substantially slower than V1.0.
- Enlarged animated bug bodies, longer visible legs, ground shadows, capsule mounts and taller 42 px capsules.
- Swarm shell colour indicates Hanzi length only: 1-2 green, 3 yellow, 4 blue, 5 purple, 6+ visible blue-black.
- Vocabulary data remains separate at assets/data/vocabulary-data.js.

Controls
W / Up Arrow: move up
S / Down Arrow: move down
Mouse: aim
Click / Space: fire
R: reload
F: fullscreen

V1.2 updates
- Rebuilt the four operation planets with distinct surface detail, atmospheric texture, lighting, rotation and a ring system for Nova-8.
- Moved Back navigation below the header and aligned it with the left edge of the content panel.
- Challenge cards now show only the Campaign Wave count numerically. Speed, deployment, swarm size and Observer settings use student-friendly verbal descriptions.
- Observer queue order now remains locked after a scan. New spawns do not reorder the current sequence. Replacement targets are appended only after a queued bug becomes invalid.
- Replaced the V-shaped split mark with irregular branching alien-energy cracks.
- Current Target now highlights the complete tab with a uniform four-sided border, full-panel background and even outer glow.

V1.3 stability fix
- Projectile movement, collision detection and hit resolution now run in separate phases.
- A bug becomes non-collidable immediately after the first valid hit.
- Multiple bullets reaching the same bug in one frame resolve only one hit event.
- A follow-up bullet fired during the capsule recovery effect remains independent and continues safely.
- Malformed or expired bullets and effects are removed without stopping the animation loop.
- Update, drawing and HUD phases now recover independently, preventing one invalid object from freezing the complete battle screen.

V1.4 updates
- Fixed the Rescan timer state bug. scanT is clamped to zero and isScanning explicitly controls scan start and completion.
- Each Rescan now completes exactly once, locks its new target order, resets the correct challenge countdown and permits later scans.
- Added Save As Image to the Results screen.
- Save As Image generates and downloads a 1400 x 900 PNG result card containing mission status, score, challenge, year/topic, recovered capsules, wrong hits, best combo, security, mission name and callsign.
- Result image generation is fully offline and uses Canvas without external libraries.
