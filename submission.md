# AREION — Autonomous Mars Entry, Descent and Landing

**Final submission by Team Indentation**

### Problem Statement Fit

AREION addresses the challenge of developing an interactive 3D flight simulation for autonomous Mars Entry, Descent and Landing. It combines three-degree-of-freedom atmospheric physics, feedback guidance, randomized environmental hazards and a live visual presentation of aerobraking, parachute descent and powered landing.

### Target Users

AREION is designed for aerospace students, educators, hackathon judges and engineering teams who need an intuitive way to observe how GN&C decisions and environmental disturbances influence a Mars landing. It turns numerical telemetry into a visible mission sequence while retaining inspectable physical thresholds and scoring criteria.

### What We Built

The team built a complete desktop-first React and Three.js application with a fixed-step simulation worker, autonomous controller, noisy sensors, seeded wind and dust storms, natural terrain contact, a persistent 3D trajectory, telemetry graphs, Mission Control viewing and an automatic touchdown debrief.

The flight vehicle uses an optimized derivative of NASA/JPL's Perseverance rover model. The parameters represent a generic tonne-class vehicle rather than a reconstruction of the Perseverance mission.

### Core Features

- Three-phase autonomous EDL: aerobraking, physical-threshold parachute deployment and throttle-controlled powered descent.
- Heat-shield emission, halo, wake and particles driven by calculated aerodynamic heat flux.
- Wind-responsive parachute presentation with eased deployment and release.
- Rocket exhaust scaled by applied thrust and surface dust influenced by wind, gravity, terrain and simplified rover collision.
- Seeded wind shear, dust storms, sensor interruption, engine degradation and fuel-contingency scenarios.
- Live altitude-versus-speed, fuel-versus-time and heat-flux-versus-time graphs.
- Persistent 3D trajectory plus an in-app and separate read-only Mission Control station.
- Final evaluation of touchdown speed, target error, peak G-force and fuel reserve.

### Technical Architecture

1. **Physics — `src/physics/`:** atmosphere, force calculation, time integration, phase gates, heating and disturbances.
2. **Control — `src/control/`:** noisy sensors, autonomous guidance and PID feedback controllers.
3. **3D Scene — `src/scene/`:** read-only visualization of flight snapshots plus cosmetic canopy and particle state.
4. **Interface and assets — `src/ui/`, `public/assets/`:** briefing, live charts, Mission Control, scoring, rover models and textures.

`src/shared/` contains the fixed-step simulation coordinator, Web Worker, canonical state, shared terrain, constants and scoring. Physics owns flight truth; Control returns commands; Scene and UI consume published snapshots without taking manual control of the flight.

### Tech Stack

- React 19.1.1 and React DOM 19.1.1
- Three.js 0.180.0
- Vite 7.1.7
- Browser Web Workers, WebGL and BroadcastChannel
- Node's built-in test runner for automated validation
- No backend, account, database or API key is required by the application

### Innovation / Uniqueness

AREION makes controller behavior and environmental uncertainty visible in one synchronized experience. Heat, plume intensity, dust, trajectory and telemetry are driven by the same flight snapshot rather than independent canned animations. Seeded scenarios make failures and corrections reproducible, while a deliberately under-fuelled case demonstrates honest failure instead of forcing every run to succeed.

The default rover was reduced from 199,521 to 46,809 triangles—about a 77% reduction—while retaining the original model as an optional inspection asset. Natural terrain replaces a target-centred landing pad, and the same analytical height field supports rendered terrain, touchdown detection and dust contact.

### Demo Instructions

Using Node.js 22.12+ (22.x) or Node.js 24+, run from the project root:

```bash
npm ci
npm run dev -- --port 5174 --strictPort
```

Open `http://127.0.0.1:5174/`. For the supplied workspace, dependencies may already be present and `npm ci` can be skipped.

Suggested jury sequence:

1. Show the orbital briefing, scenario selection and vehicle limits.
2. Launch a nominal run and show autonomous heating, parachute and powered-descent transitions.
3. Open Mission Control and the secondary observer tab to show synchronized telemetry and trajectory.
4. Review the required success checks and fuel reserve at touchdown.
5. Run the dust-storm or engine-degradation scenario to demonstrate feedback correction; use fuel contingency to demonstrate an intentional failure.

Automated checks:

```bash
npm test
npm run build
npm run simulate -- nominal
```

### Validation

The final validation completed 26 passing automated tests and a successful production build. Default scenario results were:

| Scenario | Final vertical speed | Target error | Peak G | Result |
|---|---:|---:|---:|---|
| Nominal | 0.367 m/s | 8.09 m | 4.430 | Pass |
| High wind shear | 0.369 m/s | 7.21 m | 4.440 | Pass |
| Dust storm | 0.357 m/s | 3.58 m | 4.434 | Pass |
| Sensor interruption | 0.387 m/s | 4.59 m | 4.436 | Pass |
| Engine degradation | 1.089 m/s | 11.01 m | 4.427 | Pass |
| Fuel contingency | 50.14 m/s | 30.01 m | 4.971 | Intentional fail |

A successful mission must land with absolute vertical velocity below 2.5 m/s, target error at or below 50 m, and peak load below 5 G.

### Known Limitations

- The simulation models translation only; it does not solve full 6-DoF rigid-body rotation or aerodynamic torque.
- Vehicle attitude, canopy fabric and sky-crane geometry are presentation systems rather than coupled rigid-body or cloth solvers.
- The heat model has no CFD, material ablation or mission flight-data calibration; glow is amplified false-colour flux.
- Terrain contact uses an analytical height field, not individual rock, wheel or suspension collisions.
- Mission Control's second station works only in another tab/window on the same browser profile and origin.
- The opening orbital view is presentation rather than orbital propagation.
- Desktop is the current performance target; mobile tuning remains future work.
- AREION is a challenge simulation with documented approximations, not a flight-certified engineering tool.

### Future Work

- Add full 6-DoF dynamics and attitude-control torque modeling.
- Implement a coupled multi-body sky-crane lowering and fly-away sequence.
- Calibrate vehicle and thermal constants against a published mission data set.
- Add physical wheel, suspension and rock interaction.
- Optimize and test for mobile GPUs and expand cross-device Mission Control networking.

### Attribution

Rover source: NASA/JPL. Global Mars mosaic: NASA/JPL/USGS Viking MDIM via Mars Trek. Sky image: NASA/JPL-Caltech/ASU/MSSS. Close terrain material: Poly Haven, CC0. Local Draco and Three.js license notices are retained. Full source URLs, modifications and usage-policy notes are documented in `docs/ASSET_CREDITS.md`. No NASA affiliation or endorsement is implied.
