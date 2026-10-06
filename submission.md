# AREION — Autonomous Mars EDL Simulator

**Team Indentation**

## Problem Statement Fit

We selected the challenge: **“Develop an interactive 3D flight simulation that models the physics, environmental disturbances, and autonomous control systems required for a successful Mars Entry, Descent, and Landing.”**

AREION addresses this challenge with a complete 3-Degree of Freedom Mars landing simulation covering hypersonic aerobraking, supersonic parachute descent and throttle-controlled powered descent. Phase changes occur automatically from simulated physical conditions rather than buttons or timers. An autonomous guidance and control system uses noisy sensor estimates to compensate for wind shear, dust storms and other disturbances while attempting to satisfy the required touchdown limits.

The same simulation state drives the 3D vehicle, heat shield, parachute, rocket exhaust, dust, trajectory, telemetry and final score. This turns numerical GN&C behaviour into an observable mission sequence without allowing manual flight control.

## Target Users

AREION is designed for aerospace and engineering students, educators, GN&C learners, technical teams and science-focused audiences who need an intuitive way to understand autonomous Mars landing.

Traditional numerical logs and 2D plots make it difficult to see how atmospheric density, heating, wind, sensor error and control decisions interact. AREION combines those values with a synchronized 3D mission view, live telemetry and repeatable scenarios so users can inspect both the outcome and the behaviour that produced it.

## What We Built

Team Indentation built a desktop-first React and Three.js application that simulates an autonomous Mars landing from atmospheric entry to touchdown or crash. The project includes a fixed-step physics engine running in a Web Worker, noisy virtual sensors, PID-based autonomous guidance, environmental disturbances, automatic phase logic, a detailed 3D Mars scene, live telemetry graphs, a persistent trajectory, Mission Control viewing and a scored post-mission debrief.

The scene includes a performance-optimized derivative of NASA/JPL’s Perseverance rover model, a glowing heat shield and wake driven by calculated heat flux, staged parachute deployment and cutaway, throttle-responsive rocket plumes, wind-driven dust and natural terrain. The vehicle represents a generic tonne-class Mars lander rather than a reconstruction of the Perseverance mission.

## Core Features

- Autonomous three-phase EDL sequence: aerobraking, parachute descent and powered descent.
- Exponential Martian atmosphere with gravity, drag, lift, fuel consumption, heating and terrain-relative touchdown calculations.
- PID-based guidance using noisy sensor estimates, with no manual steering or deployment controls.
- Seeded wind shear, dust storm, sensor interruption, engine degradation and fuel-contingency scenarios.
- Heat-shield glow and wake driven by calculated aerodynamic heat flux.
- Staged pilot chute, suspension-line extension, canopy inflation, backshell cutaway and thrust-stage deployment.
- Rocket plumes driven by actual throttle, plus dust particles influenced by wind, gravity, terrain and exhaust.
- Live altitude-versus-velocity, propellant-versus-time and heat-versus-time graphs.
- Persistent 3D trajectory and a secondary Mission Control observer view.
- Automatic scoring for touchdown speed, landing accuracy, peak G-force and fuel reserve.

## Technical Architecture

AREION is divided into four primary modules connected by a shared simulation layer:

1. **Physics (`src/physics/`)** calculates atmospheric density, gravity, drag, lift, heating, disturbances, translational motion and threshold-based flight phases.
2. **Control (`src/control/`)** generates noisy sensor estimates and uses guidance logic with PID feedback to produce steering and throttle commands.
3. **3D Scene (`src/scene/`)** reads published simulation snapshots and renders the rover, terrain, atmosphere, heat effects, parachute, rocket plumes, dust and trajectory. Cosmetic animation never writes back into flight physics.
4. **Interface (`src/ui/`)** provides the mission briefing, live telemetry, charts, playback tools, Mission Control and final scoring screen.

The coordinator in `src/shared/` owns the canonical mission state. Physics produces truth, Control consumes sensor estimates and returns commands, and the Scene and Interface consume read-only snapshots. The numerical simulation uses a fixed timestep inside a Web Worker so rendering load does not change the flight result. Seeded disturbances make scenarios reproducible, while `BroadcastChannel` synchronizes the primary view with a second Mission Control tab on the same browser origin.

## Tech Stack

- React 19.1.1 and React DOM 19.1.1
- Three.js 0.180.0 and WebGL
- Vite 7.1.7
- JavaScript ES modules
- Browser Web Workers for fixed-step simulation
- BroadcastChannel for same-browser Mission Control synchronization
- Node.js built-in test runner
- NASA/JPL rover and Mars imagery, with attribution documented in `docs/ASSET_CREDITS.md`
- Poly Haven terrain material, recoloured and layered for the Mars surface
- No backend, database, account or API key required

## Innovation / Uniqueness

AREION’s main strength is that the physics, autonomous controller, environmental hazards, 3D presentation and telemetry all share one synchronized mission state. Heat glow is driven by calculated heat flux, exhaust scales with applied throttle, dust reacts to simulated wind, and phase changes occur from physical thresholds. These are not independent canned animations.

The project also makes uncertainty inspectable. Seeded hazards produce repeatable runs, the controller must operate on imperfect sensor data, and the fuel-contingency scenario is allowed to fail honestly rather than forcing every mission to succeed. The default rover was reduced from 199,521 to 46,809 triangles—approximately a 77% reduction—while the detailed original remains available for inspection. Natural terrain replaces a visually artificial target-centred landing pad, and one analytical height field supports rendering, landing contact and dust interaction.

## Demo Instructions

Requirements: Node.js 22.12 or newer within the Node 22 line, or Node.js 24+, npm, and a current desktop browser with WebGL enabled.

From the project folder, run:

```bash
npm ci
npm run dev -- --port 5174 --strictPort
```

Open `http://127.0.0.1:5174/` in the browser.

Suggested judge walkthrough:

1. Start on the orbital mission briefing and select **Nominal entry**.
2. Click **Begin entry** and select **10×** playback for a short demonstration.
3. Observe heat-driven aerobraking effects, automatic parachute deployment and throttle-driven powered descent.
4. Point out the live graphs, persistent trajectory and changing true-state telemetry.
5. Open **Mission Control** or **Open second station** to demonstrate synchronized observation.
6. Review touchdown speed, target error, peak G-force and fuel reserve on the final results screen.
7. Reset and select **Dust storm front** or **Engine degradation** to demonstrate autonomous correction. Select **Fuel contingency** to demonstrate an intentional failure case.

Optional verification commands:

```bash
npm test
npm run build
npm run simulate -- nominal
```

## Known Limitations

- Flight dynamics are 3-DoF translation only; the simulation does not solve full rigid-body rotation, aerodynamic torque or attitude-control torque.
- Visual attitude, parachute fabric, suspension lines and sky-crane geometry are presentation systems rather than coupled rigid-body or cloth solvers.
- The heat model does not include CFD, material ablation or calibration against mission flight data; visible glow uses amplified false colour.
- Terrain contact uses an analytical height field rather than individual rock, wheel and suspension collisions.
- The orbital introduction is a mission briefing view, not an orbital propagator.
- The second Mission Control station works in another tab or window on the same browser profile and origin; it is not remote multi-device networking.
- Desktop browsers are the current performance target. Mobile optimization and validation are not complete.
- AREION is an educational challenge simulation, not a flight-certified engineering tool.

## Future Work

- Add full 6-DoF vehicle dynamics, aerodynamic moments and attitude-control torque modelling.
- Implement a coupled multi-body parachute, sky-crane lowering and descent-stage fly-away simulation.
- Calibrate atmospheric, aerodynamic and thermal parameters against published Mars mission data.
- Add physical wheel, suspension, rock and terrain interaction after touchdown.
- Extend Mission Control to authenticated networked observers on separate devices.
- Optimize rendering for mobile and lower-power integrated GPUs.
- Add Monte Carlo batch analysis, parameter sweeps and downloadable mission reports for controller evaluation.
