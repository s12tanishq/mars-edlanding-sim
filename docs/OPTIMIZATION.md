# Rendering efficiency pass — 6 October 2026

This pass preserves the existing assets, resolution, terrain geometry and shaders,
material settings, lighting, shadow quality, particle counts, animation equations,
physics and guidance. It reduces repeated CPU work, data copying and GPU uploads.

## Changes

- Particle updates reuse objects and vectors. Constant trigonometric values use
  double-precision caches, preserving the original calculations and random order.
- Parachute wind/pressure factors are calculated once per update. Cloth still
  uses the same integration steps, mesh panels and transparency settings.
- Trajectory buffers upload new coordinates only. The observer trajectory also
  avoids reprojecting old coordinates. Camera damping still updates every frame;
  drawing stops only when its exact transform and displayed data are unchanged.
- Chart geometry is memoized against the immutable history array and chart inputs.
- Worker and secondary-window messages send incremental history, trajectory and
  event records. Publication cadence is unchanged. Sequence checks, full initial
  snapshots and resynchronization preserve complete records across resets and
  late-joining observers. Old React snapshots remain immutable.
- Mission reset reuses the renderer, terrain, models, textures and materials.
  Camera controls, cloth state, dust RNG, throttle easing, trajectory, orbital
  rotation and visual timeline reset for the new mission.
- Loaded textures and both shadow/no-shadow shader variants are prepared during
  briefing. Preparation does not advance the simulation or animations. A launch
  before preparation finishes falls back to normal lazy initialization.
- Frame statistics now include p95/p99/max frame intervals and counts over 50 ms.
  Rendering counters include shadow passes. `submitMs` still measures CPU scene
  update plus submission, not GPU completion or total page execution time.

## Measurements and verification

`npm test`: 32 tests passed. These cover existing flight/control behavior and new
checks for complete incremental transport, dropped/duplicate packets, resync,
late observers, immutable history, partial trajectory uploads and deterministic
resets of cloth, dust and plumes. `npm run build` succeeds; the existing large
Three.js chunk warning remains.

Browser verification of the production build completed the nominal mission at
10× playback: touchdown 0.37 m/s, target offset 8.1 m, peak load 4.43 G, remaining
fuel 236.8 kg. A late observer received the full terminal record; resetting the
mission returned the primary view to orbit and the observer to its single initial
event. No browser console warnings or errors were recorded in this production run.

A deterministic 600-frame replay compared five animated components against the
saved original at 30 checkpoints. Visible coordinates, transforms, material values
and shader uniforms matched exactly. The sequence includes pause, variable frame
steps, canopy opening/cutaway, powered descent, landing and crash states.

Representative warmed Node CPU update timings for those five components:

| Metric | Original | Optimized |
| --- | ---: | ---: |
| Median update | 1.245 ms | 0.975 ms |
| p95 update | 3.311 ms | 2.769 ms |

This is approximately 22% lower median update time in a local microbenchmark.
It is not a browser FPS improvement or GPU benchmark. Timings vary with load.

A full nominal flight sampled every three physics steps produced 3,975 messages.
JSON-serialized payload totals decreased from 680,159,413 to 8,840,653 bytes
(98.7% reduction), with exact snapshot and terminal-result equality. These totals
describe the serialized representation, not measured structured-clone memory,
network traffic or total application memory usage.

The browser scene comparison used identical clocks, snapshots, cameras and
900×540 drawing buffers in the same browser/GPU. Twelve of thirteen checkpoints
matched every RGBA channel. One opening-chute checkpoint differed at one pixel
(three channels, maximum channel difference 4/255). A control comparing two
unmodified baseline scenes also differed at that checkpoint by the same amounts,
and showed small pixel differences in other rover views. Therefore this check
does not establish universal cross-context or cross-device pixel identity.

An attempted extra offscreen warm-up render caused larger differences and was
removed. The retained warm-up only compiles shaders and initializes textures;
geometry and shadow-buffer allocation may still occur on their first real use.

## Repeating the checks

From this project directory:

```sh
npm test
npm run build
node scripts/check-visual-equivalence.js ../../work/optimization-baseline-2026-10-06
```

The baseline directory contains the original source/tests and a link to this
project's installed dependencies. It is a local comparison archive, not a second
submission. Keep it if further visual-preserving changes are planned. The final
project itself does not depend on that directory.

## Remaining performance limits

The full-detail terrain shading, transmission materials, shadows and particle
overdraw retain their original GPU cost. This pass reduces avoidable CPU and
transport work; it does not guarantee 60 FPS or eliminate every first-use hitch.
Future work should profile CPU/GPU time around deployment and touchdown on the
target laptop, using consistent viewport, playback speed, scenario and observer
windows. Any further changes must pass the same appearance checks.
