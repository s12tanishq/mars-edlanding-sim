// src/physics/disturbances.js

// --- Wind shear tuning constants ---
export const WIND_MAX_FORCE = 500;   // Newtons — max magnitude of horizontal gusts
export const WIND_CHANGE_RATE = 0.5; // how quickly wind can drift per second (higher = gustier)

/**
 * Creates the starting wind state — call this once when the simulation
 * begins, then keep passing the result into updateWindState() each frame.
 */
export function createInitialWindState() {
  return { x: 0, z: 0 }; // sideways only — wind doesn't push up or down
}

/**
 * Advances wind by one time step using a random walk: each frame it nudges
 * randomly in a new direction, clamped to a max magnitude. This produces
 * smooth-looking, unpredictable gusts instead of instant jumps.
 *
 * @param {{x:number, z:number}} windState - current wind force vector (N)
 * @param {number} deltaTime - time step in seconds
 * @returns {{x:number, z:number}} the next wind state
 */
export function updateWindState(windState, deltaTime) {
  const drift = WIND_CHANGE_RATE * deltaTime * WIND_MAX_FORCE;

  const nextX = windState.x + (Math.random() * 2 - 1) * drift;
  const nextZ = windState.z + (Math.random() * 2 - 1) * drift;

  // Clamp so gusts can't grow without bound over a long random walk
  const magnitude = Math.sqrt(nextX ** 2 + nextZ ** 2);
  if (magnitude > WIND_MAX_FORCE) {
    const scale = WIND_MAX_FORCE / magnitude;
    return { x: nextX * scale, z: nextZ * scale };
  }

  return { x: nextX, z: nextZ };
}

/**
 * Converts a wind state into a force vector usable by sumForces(). Pass
 * enabled=false to disable wind entirely — useful for testing Control's
 * behavior in calm conditions before adding disturbances back in.
 *
 * @param {{x:number, z:number}} windState
 * @param {boolean} enabled
 * @returns {{x:number, y:number, z:number}} force vector in Newtons
 */
export function calculateWindForce(windState, enabled = true) {
  if (!enabled) {
    return { x: 0, y: 0, z: 0 };
  }
  return { x: windState.x, y: 0, z: windState.z };
}
