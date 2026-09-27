# AREION — Mars EDL reference simulator

A complete, runnable React + Three.js reference for the team's four-module project. It uses a real closed feedback loop: seeded noisy measurements → guidance commands → physical forces → integrated motion → rendering and telemetry.

This project is separate from the earlier SVG scene prototype. The teammate's original files in Downloads have not been modified. The new Control implementation lives here alongside the reference Physics, Scene and Interface implementations.

## Run it

Use Node.js 22.12+ or 24+.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Select a scenario, press **Begin entry**, and observe. Default playback is 4×; a nominal mission takes about 47 real seconds / 188 simulated seconds. Pause, reset, and playback speed affect observation, never manual engine commands. The camera can be orbited and zoomed; choose **Trajectory** to see the complete path.

- **Flight deck:** 3D lander, heat-driven shield, canopy, throttle-driven plumes, target zone, telemetry, charts.
- **Mission control:** controller diagnostics, ground track, complete phase/event recorder.
- **Build guide:** the four responsibilities and their shared contract, inside the app.
- **Mission debrief:** touchdown velocity, target error, peak G, and exportable result JSON.

## Verify and build

```sh
npm test
npm run simulate
npm run simulate -- gusts
npm run simulate -- fuel
npm run build
npm run preview
```

Tests use only Node's built-in test runner. The numerical simulation needs no React, browser, Three.js or npm package to run: `node scripts/simulate.js` works independently.

## What is included

```text
src/
  physics/   atmosphere, forces, integration, phases, seeded wind
  control/   filtered sensors, reusable PID, vertical + lateral guidance
  scene/     true WebGL scene, six component boundaries, placeholder models
  ui/        dashboard, three charts, Mission Control, briefing, score
  shared/    constants, unchanged truth-state shape, coordinator, metrics
  assets/    model/texture handoff instructions
  App.jsx    application layout and observation controls
tests/       deterministic unit/contract/whole-mission checks
docs/        integration agreement and Control migration notes
```

Read [the team handoff](docs/TEAM_HANDOFF.md) before generating replacement modules. Read [Control changes](docs/CONTROL_CHANGES.md) alongside the submitted controller.

## Reference outcomes

These are measured results from the shipped fixed seeds, not hardcoded success animations.

| Scenario         | Touchdown vertical speed | Target distance | Peak load | Result                  |
| ---------------- | -----------------------: | --------------: | --------: | ----------------------- |
| Nominal entry    |                 0.69 m/s |         18.65 m |    4.43 G | Pass                    |
| High wind shear  |                 0.68 m/s |         16.37 m |    4.44 G | Pass                    |
| Fuel contingency |                50.46 m/s |         53.51 m |    4.97 G | Fail; engines lose fuel |

Twelve additional nominal wind/sensor seeds are checked by the test suite. These checks cover the selected demo configuration; they are not evidence of flight certification or stability under arbitrary parameter changes.

## Modeling limits

- Three translational degrees of freedom; no rotation/torque integration. The craft's visual tilt follows the commanded thrust direction.
- Exponential density and selected vehicle constants, chosen for a legible hackathon demonstration. This is not a reconstruction of a specific NASA mission.
- Drag uses velocity relative to a seeded wind field. Wind is not counted again as an extra force.
- Heat is a normalized, filtered aerodynamic power proxy (`drag magnitude × airspeed`), not temperature or a validated heat-transfer model.
- G-load is the magnitude of non-gravitational acceleration divided by 9.80665. Peak G excludes an unmodeled contact impulse.
- The physical landing plane is flat at Y=0. Distant terrain relief is decorative; no terrain collision mesh is used.
- Physics changes drag configuration when a phase threshold is crossed. Canopy opening has a short cosmetic transition; inflation dynamics are not modeled.
- Ground contact interpolates the last step. Impact velocity is retained for scoring; it is not overwritten with zero.
- The scoring rubric is exactly the stated vertical-speed / horizontal-distance / peak-G criteria. It does not add an unstated lateral-impact-speed criterion.
- The overview camera enlarges the vehicle and target markers for readability. Actual trajectory coordinates remain in metres.

## Dependencies and assets

Runtime: React 19.1.1, React DOM 19.1.1, Three.js 0.180.0. Tooling: Vite 7.1.7. No React Three Fiber, Drei, chart package, backend, accounts, or database. The lockfile pins the dependency tree. React and Three.js were approved for this separate reference during the build; verify any remaining competition requirements before submission.

The procedural models are placeholders authored in source. No marketplace assets are bundled. Google Fonts supplies DM Sans and Space Grotesk when online; local fallback fonts are available offline. After installation the flight itself works locally without network access.

## Technical references

The drag equation is documented by [NASA Glenn](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-equation/). NASA's [Mars atmosphere introduction](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/mars-atmosphere-equation-english/) provides background; this demo uses its own simpler exponential atmosphere rather than that page's full empirical model. Rendering uses the official [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) and [BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html) APIs.
