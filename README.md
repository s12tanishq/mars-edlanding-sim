# AREION — Mars EDL Simulator

**A Team Indentation project.** AREION is a React + Three.js 3-DoF Mars landing simulation featuring an optimized NASA/JPL Perseverance model, autonomous guidance, environmental disturbances and synchronized mission telemetry.

**Release status:** Final Build 1.0.0

For a first-time Windows, macOS, or Linux setup, follow [RUN_SIMULATION_ON_ANY_LAPTOP.txt](RUN_SIMULATION_ON_ANY_LAPTOP.txt).

## Project location

The complete runnable project is in:

```text
/Users/tanishqpachghare/Documents/Codex/2026-09-26/3-3d-scene-rendering-takes-physics/outputs/mars-edl-perseverance
```

The 3D scene files are in that folder's `src/scene/` directory. This directory is the complete final project; similarly named sibling folders are development history and are not part of the submission.

## Preview locally

Requirements: Node.js 22.12+ (22.x) or Node.js 24+, npm, and a current desktop browser with WebGL support. No API key or backend is required. An internet connection is needed to install dependencies; models, textures and the Draco decoder are bundled locally.

In Terminal, open the project:

```bash
cd "/Users/tanishqpachghare/Documents/Codex/2026-09-26/3-3d-scene-rendering-takes-physics/outputs/mars-edl-perseverance"
```

For this existing workspace, dependencies are already available, so start the preview directly:

```bash
npm run dev -- --port 5174 --strictPort
```

Open [the local demo](http://127.0.0.1:5174/) while that Terminal process is running. Stop it with Ctrl+C. The link is local to your computer, not a published website.

For a fresh download or a teammate's copy, first run `npm ci` in the copied project folder, then the same preview command. The current workspace has a `node_modules` symlink to the baseline's installed dependencies. Do not include that symlink when sharing; a fresh copy should install its own dependencies. Application source and runtime assets do not otherwise require the baseline folder.

If port 5174 is occupied, use `npm run dev -- --port 5175 --strictPort` and open the address printed in Terminal. Do not double-click `index.html`: module loading, the simulation worker and asset paths require a web server. Keep browser hardware acceleration enabled for the 3D view.

### Preview the production build

```bash
npm run build
npm run preview -- --port 5174 --strictPort
```

Stop the development server first if it uses the same port. The production output is in `dist/`; the preview command serves it locally, it does not publish it online.

## Demo walkthrough

1. Begin with the orbital briefing. Choose **Nominal entry** for a first run; inspect the rover if desired.
2. Choose a seed and optional prelaunch guidance settings, then launch. Guidance controls the flight automatically; there are no manual steering or deployment controls.
3. Observe the heat shield and wake, parachute deployment, and throttle-driven rocket plumes. Use pause, playback speed, orbit/zoom and camera modes to inspect the descent.
4. Watch the altitude–velocity, fuel–time and heat-flux–time graphs alongside the persistent trajectory.
5. Open Mission Control for telemetry and run comparison. Use **Open second station** for an observer tab in the same browser profile and origin; keep the primary simulation tab open. This is not remote multi-device telemetry.
6. Review touchdown speed, target error, peak G and fuel reserve in the debrief. Repeat with **Dust storm front**, **Sensor interruption**, or **Engine degradation**. **Fuel contingency** deliberately demonstrates a failure.

## Folder guide and team ownership

```text
mars-edl-perseverance/
├── README.md                 Setup, preview and project overview
├── submission.md             Challenge-mapped submission description
├── package.json              Commands and pinned dependency versions
├── package-lock.json         Reproducible dependency installation
├── index.html
├── vite.config.js
├── src/
│   ├── physics/              Atmosphere, forces, integration, phases, heating, hazards
│   ├── control/              PID, autonomous guidance and noisy sensors
│   ├── scene/                Rover, canopy, plumes, heat wake, dust, terrain, sky, trail
│   ├── ui/                   Briefing, telemetry, Mission Control and scoring screens
│   ├── shared/               State, worker, simulation coordinator, constants, scoring
│   ├── assets/               Team asset-directory notes
│   ├── App.jsx
│   └── main.jsx
├── public/assets/            Bundled rover models, terrain textures and Mars panorama
├── public/draco/             Local model decoder and retained licenses
├── scripts/simulate.js       Headless scenario runner
├── tests/                    Numerical, integration and visual-helper tests
├── docs/                     Contracts, validation, credits and historical handoff notes
└── dist/                     Generated production build
```

Physics owns computed flight motion and phase thresholds; Control reads sensor estimates and returns commands; Scene reads snapshots and animates visuals; UI reads snapshots and provides prelaunch configuration and playback controls. The shared simulation coordinator connects all four. Cosmetic cloth and particle integration in Scene does not change flight physics.

Before integrating separately built teammate modules, read [the current state contract](docs/VISUAL_UPGRADE.md). In particular, `position.y` is height above the local datum, while `altitude` is height above terrain. Heating fields use SI units: `heatFlux` in W/m², `shieldTemperature` in K, and `heatLoad` in J/m²; graph history converts heat flux to kW/m². This edition changes both Physics and Control, not only rendering.

## This update
- NASA flight model: **46,809 triangles / 118 primitives / 1.23 MB**, versus original 199,521 / 252 / about 4.8 MB. Textures capped at 512px; unused animations removed, geometry simplified and compatible primitives joined offline. Original available on demand. A 2,340-triangle fallback appears during loading.
- Removed target-centred terrain flattening, cleared rocks and physical target ring. Continuous natural relief and layered terrain materials use the same height function as collision and dust.
- Shield emission, halo, animated wake and heat particles respond to calculated aerodynamic heat flux.
- Canopy inflation/release easing plus damped wind-driven angular response and spring-based fabric displacement. Rocket exhaust follows applied thrust.
- Dust particles carry velocity: wind drag, Mars gravity, exhaust acceleration, terrain contact and simplified rover-body collision. Storm fronts also change flight wind, density and sensor quality.
- Exponential atmosphere, drag, commanded entry lift, thrust and fuel burn. Sutton–Graves heat flux, lumped shield temperature and accumulated heat load.
- Physics runs in a worker. Read-only Scene/UI consume published snapshots. No manual flight control.
- Live graphs visible during flight. Mission Control is a non-modal panel plus a separate observer tab/window using BroadcastChannel; both see the same flight. Observer is local to the same browser profile and origin, not a network/multi-device service.
- Seed selection and prelaunch guidance tuning. Nominal, gust, dust storm, navigation interruption, engine degradation and fuel contingency scenarios.
- Debrief retains the three mandatory criteria and adds fuel use/reserve grading. Recent runs can be compared in Mission Control.
- Frame-rate, render calls and triangle instrumentation available. Desktop is the current focus.

## Verify

```bash
npm test
npm run build
npm run simulate -- nominal
```

Replace `nominal` with `gusts`, `storm`, `sensor`, `engine`, or `fuel` for other headless runs. The documented desktop validation passed 26 tests and a production build; see [validation results and remaining checks](docs/VALIDATION.md). A Three.js bundle-size advisory is expected and is not a build failure. The fuel contingency is intentionally unsuccessful.

## Sharing or submitting

Share this entire project directory, excluding `node_modules` and optionally the generated `dist` directory. Keep `src`, `public`, `scripts`, `tests`, `docs`, both package files, `index.html`, `vite.config.js`, README and SUBMISSION. Preserve asset credits and decoder licenses. A recipient runs `npm ci` followed by the preview command above from their own copy's location.

The optional offline rover-optimization tooling is outside this project at workspace `work/asset-tools/optimize-rover.mjs`. It is not needed to install, build or run the demo; the optimized model is already bundled. Include that tooling separately only if handing off asset regeneration work.

Use [submission.md](submission.md) as the submission narrative. Add actual team details and any repository, deployment or demo-video links required by the event; those are not supplied or published by this documentation step.

For the mandatory VS Code extension workflow, follow the [CreatorCode publishing guide](docs/CREATORCODE_PUBLISH.md). Always open this project root—not `src/`—as the first VS Code workspace folder.

See [validation](docs/VALIDATION.md), [current contract and limitations](docs/VISUAL_UPGRADE.md), and [asset credits](docs/ASSET_CREDITS.md).

## Scientific boundaries
A generic tonne-class simulation, not a reconstruction of a NASA mission. Default entry is 35 km / 1.3 km/s; the orbital opening is a briefing camera, not an orbital propagator. The heat shader uses amplified false-colour flux to make heating visible; displayed brightness is not calibrated black-body radiation. Thermal material properties are illustrative and ablation/CFD are absent.

3-DoF means translation only. Visual tilt, canopy fabric, sky-crane geometry and cables do not solve vehicle torques or multi-body constraints. Rocks are visual scatter; terrain height, not individual rocks or wheels, defines ground contact. The orbital globe and far-distance terrain use NASA's Viking MDIM global colour mosaic; the ground sky uses a NASA photograph strip. The close landing material uses an Earth scan recoloured for Mars.

These are remaining scientific extensions, not claims of completed high-fidelity mission certification. Mobile tuning, networked observers, true sky-crane lowering/fly-away and full 6-DoF remain outside this pass.
