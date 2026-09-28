import { CONFIG, TERMINAL_PHASES, magnitude } from "../shared/constants.js";
import { computeForces } from "./forces.js";
import { updatePhase } from "./phases.js";
import { terrainHeight, terrainNormal } from "../shared/terrain.js";
import { thermalStep } from "./heating.js";

// Semi-implicit Euler at a fixed 1/60 s. Returns a fresh truth snapshot.
export function stepPhysics(previous, command, dt, wind, environment = {}) {
  if (!Number.isFinite(dt) || dt <= 0)
    throw new RangeError("Physics dt must be finite and positive");
  if (TERMINAL_PHASES.has(previous.phase))
    return { state: previous, diagnostics: null };
  const diagnostics = computeForces(previous, command, wind, dt, environment);
  let step = dt;
  let velocity = { ...previous.velocity };
  let position = { ...previous.position };
  for (const axis of ["x", "y", "z"]) {
    velocity[axis] += diagnostics.acceleration[axis] * step;
    position[axis] += velocity[axis] * step;
  }
  if (position.y <= terrainHeight(position.x,position.z)) {
    // Interpolate the contact point within the step; retain impact velocity for scoring.
    let lo=0,hi=1;
    for(let i=0;i<24;i++) {
      const f=(lo+hi)/2, x=previous.position.x+(position.x-previous.position.x)*f,
        z=previous.position.z+(position.z-previous.position.z)*f,
        y=previous.position.y+(position.y-previous.position.y)*f;
      if(y>terrainHeight(x,z)) lo=f; else hi=f;
    }
    const fraction = hi;
    step *= fraction;
    for (const axis of ["x", "y", "z"]) {
      position[axis] =
        previous.position[axis] +
        (position[axis] - previous.position[axis]) * fraction;
      velocity[axis] =
        previous.velocity[axis] + diagnostics.acceleration[axis] * step;
    }
    position.y = terrainHeight(position.x,position.z);
  }
  const temperature=thermalStep(previous.shieldTemperature ?? 210,diagnostics.heatFlux,step);
  const heat=Math.max(0,Math.min(1,(temperature-210)/700));
  const state = {
    position,
    velocity,
    altitude: Math.max(0,position.y-terrainHeight(position.x,position.z)),
    speed: magnitude(velocity),
    fuel: Math.max(0, previous.fuel - (diagnostics.fuelUsed * step) / dt),
    heat,
    heatFlux: diagnostics.heatFlux,
    shieldTemperature: temperature,
    heatLoad: (previous.heatLoad ?? 0)+diagnostics.heatFlux*step,
    gForce: diagnostics.gForce,
    phase: previous.phase,
  };
  state.phase = updatePhase(state, diagnostics);
  return { state, diagnostics: { ...diagnostics, groundHeight: terrainHeight(position.x,position.z), groundNormal: terrainNormal(position.x,position.z), elapsed: step } };
}
