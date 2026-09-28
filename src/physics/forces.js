import { CONFIG, clamp, magnitude } from "../shared/constants.js";
import { densityAt, dynamicPressure } from "./atmosphere.js";
import { heatFlux } from "./heating.js";

export function thrustDirection(steering = { x: 0, z: 0 }) {
  let x = clamp(steering.x || 0, -1, 1);
  let z = clamp(steering.z || 0, -1, 1);
  const length = Math.hypot(x, z);
  if (length > 1) {
    x /= length;
    z /= length;
  }
  x *= Math.sin(CONFIG.maxTilt);
  z *= Math.sin(CONFIG.maxTilt);
  return { x, y: Math.sqrt(Math.max(0, 1 - x * x - z * z)), z };
}

export function computeForces(state, command, wind, dt, environment = {}) {
  const mass = CONFIG.dryMass + state.fuel;
  const density = densityAt(state.position.y) * (environment.densityScale ?? 1);
  const relative = {
    x: state.velocity.x - wind.x,
    y: state.velocity.y - wind.y,
    z: state.velocity.z - wind.z,
  };
  const airspeed = magnitude(relative);
  const q = dynamicPressure(density, airspeed);
  const cdArea =
    state.phase === "parachute"
      ? CONFIG.chuteCdArea
      : state.phase === "poweredDescent"
        ? CONFIG.descentCdArea
        : CONFIG.entryCdArea;
  const dragMagnitude = q * cdArea;
  const drag = { x: 0, y: 0, z: 0 };
  if (airspeed > 0) {
    for (const axis of ["x", "y", "z"])
      drag[axis] = (-relative[axis] / airspeed) * dragMagnitude;
  }
  const lift = {x:0,y:0,z:0};
  if(state.phase === "aerobraking" && airspeed > 0) {
    // Project commanded lateral lift into the plane perpendicular to airflow.
    const request=command.lift ?? {x:0,z:0};
    const authority=Math.min(1,Math.hypot(request.x,request.z));
    const dot=(request.x*relative.x+request.z*relative.z)/(airspeed*airspeed);
    const l={x:request.x-dot*relative.x,y:-dot*relative.y,z:request.z-dot*relative.z};
    const length=magnitude(l);
    if(length>1e-9) for(const axis of ["x","y","z"]) lift[axis]=l[axis]/length*dragMagnitude*CONFIG.entryLiftDragRatio*authority;
  }
  const requested =
    state.phase === "poweredDescent" && state.fuel > 0
      ? clamp(Number.isFinite(command.throttle) ? command.throttle : 0, 0, 1)
      : 0;
  // Limit actual impulse to the propellant available within this step.
  const requestedFuel =
    ((requested * CONFIG.maxThrust) /
      (CONFIG.specificImpulse * CONFIG.earthGravity)) *
    dt;
  const fuelUsed = Math.min(state.fuel, requestedFuel);
  const throttle =
    requestedFuel > 0 ? (requested * fuelUsed) / requestedFuel * (environment.engineEfficiency ?? 1) : 0;
  const direction = thrustDirection(command.steering);
  const thrust = Object.fromEntries(
    ["x", "y", "z"].map((axis) => [
      axis,
      direction[axis] * throttle * CONFIG.maxThrust,
    ]),
  );
  const nongravity = {
    x: drag.x + thrust.x + lift.x,
    y: drag.y + thrust.y + lift.y,
    z: drag.z + thrust.z + lift.z,
  };
  const acceleration = {
    x: nongravity.x / mass,
    y: nongravity.y / mass - CONFIG.gravity,
    z: nongravity.z / mass,
  };
  return {
    acceleration,
    drag,
    lift,
    relativeVelocity: relative,
    thrust,
    direction,
    density,
    dynamicPressure: q,
    airspeed,
    actualThrottle: throttle,
    fuelUsed,
    gForce: magnitude(nongravity) / mass / CONFIG.earthGravity,
    heatFlux: state.phase === "aerobraking" ? heatFlux(density,airspeed) : 0,
  };
}
