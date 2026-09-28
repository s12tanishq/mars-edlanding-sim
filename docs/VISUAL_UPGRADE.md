# Current integration contract — desktop upgrade
This supersedes the earlier visual-only contract. Physics and Control were changed in this pass.

## Ownership
Simulation in a Web Worker owns flight truth, event gates, recorded history and scoring. Scene never mutates that truth. Scene separately advances its disposable cosmetic particle/fabric state. UI and second-station telemetry read the same published snapshots.

## State changes
- `position.y`: altitude above a fixed local datum.
- `altitude`: height above `terrainHeight(position.x, position.z)`; these are no longer equal.
- `heatFlux`: cold-wall stagnation convective flux in W/m².
- `shieldTemperature`: illustrative lumped surface temperature in kelvin.
- `heatLoad`: accumulated incident energy in J/m².
- `heat`: compatibility value, temperature rise normalized to 0–1.
- Other truth fields retain SI units and prior meanings.
- Entry command adds optional `lift: {x,z}`. Physics projects it perpendicular to airflow and caps authority. No angular state is implied.
- Snapshot `environment` provides storm strength, density scale, sensor multiplier, effective wind and engine efficiency.
- History records heat flux in kW/m² for graphs. Snapshot also includes scenario and seed.

## Terrain
Shared deterministic height field is used by flight collision, rendered ground and dust. Root-finding resolves surface crossing within a physics step. Surface slope is shown as a landing orientation only. Render mesh samples the analytical field; interpolation and a small visual ground offset can differ by centimetres locally. Beyond 6 km, a curvature approximation affects visual terrain only. Scattered rocks have no collision geometry. No flattening or rock-clearing depends on target distance.

## Visual models
`perseverance-flight.glb` is an offline simplified derivative of the NASA original. Original is kept for inspection. Fallback is custom geometry. Asset work tooling lives at workspace `work/asset-tools/optimize-rover.mjs`; it is not required by the app.

Heat glow and wake use real flux with illustrative exposure. Canopy fabric uses damped spring responses and wind-driven sway; canopy drag still switches at the physical phase gate. Dust integrates drag, gravity and contact without feeding particle forces back into the flight. Tethers/stage remain illustrative; independent bodies, tension, lowering and fly-away are not implemented.

## Secondary station
Open the session-specific observer link in the same browser profile/origin. It receives snapshots and status; it cannot command the simulation. Reset updates the existing session. Closing or losing the primary shows a stale-data status. No backend or remote multi-device collaboration is implemented. A simple rotatable 3D trajectory uses clearly labelled horizontal exaggeration to show drift.

## Limits and source models
- Sutton–Graves Mars coefficient 1.9027e-4 in SI, from [NASA NTRS 20060004824, Eq. 1](https://ntrs.nasa.gov/api/citations/20060004824/downloads/20060004824.pdf).
- Exponential density uses the documented mission constants; [NASA atmospheric reference](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/mars-atmosphere-equation-metric/) is context, not a claim that AREION reproduces its temperature/pressure model.
- Thermal surface layer: emissivity .85, areal heat capacity 1200 J/(m² K), ambient 210 K. No ablation, conduction through a multilayer shield, or flight-data calibration.
- Fixed-area aero coefficients, constant gravity and bounded entry lift are educational assumptions.
- Storm density modulation, grain sizes/drag times and canopy stiffness are illustrative.
- Guidance handles tested disturbances; no universal success guarantee is claimed.
