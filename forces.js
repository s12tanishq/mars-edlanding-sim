// src/physics/forces.js  (continuing from gravity + drag)

export const MAX_THRUST = 8000; // Newtons — tunable based on how fast you need to decelerate before touchdown

/**
 * Computes the thrust force from the retro-rockets during powered descent.
 *
 * Physics doesn't decide throttle — Control does. This function only
 * converts whatever throttle value it's given into a force. Thrust always
 * points straight up (+y), opposing gravity and downward velocity.
 *
 * @param {number} throttle - value from 0 (off) to 1 (full thrust), from Control
 * @param {number} maxThrust - maximum thrust the engines can produce (N)
 * @returns {{x,y,z}} force vector in Newtons
 */
export function calculateThrustForce(throttle, maxThrust = MAX_THRUST) {
  // Clamp defensively — a bad value crossing the Control/Physics boundary
  // shouldn't be able to break the simulation (e.g. negative or >1 throttle)
  const clampedThrottle = Math.min(Math.max(throttle, 0), 1);

  return {
    x: 0,
    y: clampedThrottle * maxThrust,
    z: 0,
  };
}