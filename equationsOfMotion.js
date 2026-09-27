// src/physics/equationsOfMotion.js

/**
 * Sums an array of force vectors (e.g. gravity, drag, thrust) into one
 * net force vector. Keeping this separate from integrateMotion makes each
 * force easy to log/debug individually before they're combined.
 *
 * @param {Array<{x,y,z}>} forces - force vectors in Newtons
 * @returns {{x,y,z}} net force vector in Newtons
 */
export function sumForces(forces) {
  return forces.reduce(
    (net, force) => ({
      x: net.x + force.x,
      y: net.y + force.y,
      z: net.z + force.z,
    }),
    { x: 0, y: 0, z: 0 }
  );
}

/**
 * Advances velocity and position by one time step, given the net force
 * acting on the lander. Uses semi-implicit Euler: update velocity first,
 * then use the NEW velocity to update position. This is simple to read
 * but more numerically stable than plain ("explicit") Euler.
 *
 * @param {{x,y,z}} position - current position (m)
 * @param {{x,y,z}} velocity - current velocity (m/s)
 * @param {{x,y,z}} netForce - sum of all forces this frame (N)
 * @param {number} mass - lander mass (kg)
 * @param {number} deltaTime - time step in seconds (from the frame loop)
 * @returns {{position: {x,y,z}, velocity: {x,y,z}}}
 */
export function integrateMotion(position, velocity, netForce, mass, deltaTime) {
  // F = ma  =>  a = F / m
  const acceleration = {
    x: netForce.x / mass,
    y: netForce.y / mass,
    z: netForce.z / mass,
  };

  // Update velocity first...
  const newVelocity = {
    x: velocity.x + acceleration.x * deltaTime,
    y: velocity.y + acceleration.y * deltaTime,
    z: velocity.z + acceleration.z * deltaTime,
  };

  // ...then update position using the NEW velocity
  const newPosition = {
    x: position.x + newVelocity.x * deltaTime,
    y: position.y + newVelocity.y * deltaTime,
    z: position.z + newVelocity.z * deltaTime,
  };

  return { position: newPosition, velocity: newVelocity };
}

/**
 * Scalar speed (magnitude of the velocity vector) — feeds simulationState.speed.
 */
export function calculateSpeed(velocity) {
  return Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
}
