# Desktop upgrade validation — 27 September 2026

## Automated and numerical
Final suite: **26 tests passed**. The final desktop storm view also reported about 60 FPS and 268 draw calls, with no browser console errors.
Tests cover atmosphere and air-relative drag, immutable state updates, fuel boundaries, threshold phases, PID anti-windup, seeded missions, scoring boundaries, visual clocks and pause, bundled assets, SI heating benchmark, lift orthogonality, terrain contact, storm disturbance, timestep refinement and dust contact. Production build succeeds, with the existing advisory for the Three.js chunk over 500 kB.

Latest headless scenario results:
| Scenario | Vertical speed m/s | Target error m | Peak G | Result |
|---|---:|---:|---:|---|
| Nominal | 0.367 | 8.09 | 4.430 | Pass |
| Gusts | 0.369 | 7.21 | 4.440 | Pass |
| Storm | 0.357 | 3.58 | 4.434 | Pass |
| Sensor interruption | 0.387 | 4.59 | 4.436 | Pass |
| Engine degradation | 1.089 | 11.01 | 4.427 | Pass |
| Fuel contingency | 50.14 | 30.01 | 4.971 | Fail |

The tests include twelve additional nominal seeds. The storm timestep comparison uses 1/60 vs 1/120 s with touchdown, target-error and peak-G tolerances. This verifies numerical consistency, not fidelity against a recorded NASA flight.

## Desktop visual checks
Orbital briefing, launch, heat shield/wake, flight graphs, pause/resume, powered-descent plume, optimized NASA asset and overhead natural ground were inspected. Local samples reached about 60 FPS; optimized ground inspection showed 244 calls including shadow rendering, and about 3.4 ms render-submission time. Performance numbers are observed browser samples, not a full GPU benchmark or universal device guarantee.

The separate observer connected to the same session and displayed matching seed, pause state, graphs and trajectory. More extensive multi-window/reconnection and full-run visual regression testing remains useful. Final canopy/storm changes still need user aesthetic review. JSON export is implemented but its download was not rechecked.

## Remaining limitations
No CFD, cloth finite-element solver, multi-body sky crane, rigid-body rotational dynamics, wheel/rock collision, mission trajectory calibration or mobile optimization. These are clearly disclosed in the README. Full-original asset remains available. Rendering uses a derived NASA model; it does not confer NASA mission physics accuracy.
