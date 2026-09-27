// src/physics/phases.js

import { AEROSHELL_DRAG_COEFFICIENT, AEROSHELL_CROSS_SECTIONAL_AREA } from "./forces.js";

// --- Phase transition thresholds (approximate, tune after test-running) ---
export const PARACHUTE_DEPLOY_ALTITUDE = 11000;        // meters
export const PARACHUTE_DEPLOY_DYNAMIC_PRESSURE = 750;  // Pa — both conditions must hold
export const POWERED_DESCENT_ALTITUDE = 1500;          // meters — jettison chute, ignite rockets
export const SAFE_LANDING_VERTICAL_SPEED = 2.5;        // m/s — matches the mission's success criterion

// --- Parachute shape (much larger drag than the aeroshell) ---
export const PARACHUTE_DRAG_COEFFICIENT = 0.8;     // typical disk-gap-band supersonic chute
export const PARACHUTE_CROSS_SECTIONAL_AREA = 200; // m^2 — big jump from the aeroshell's 12 m^2

/**
 * Decides which phase the lander should be in this frame, based purely on
 * physical thresholds. Never triggered by a timer or user input.
 *
 * @param {string} currentPhase - "aerobraking" | "parachute" | "poweredDescent" | "landed" | "crashed"
 * @param {number} altitude - current altitude (m)
 * @param {{x,y,z}} velocity - current velocity vector (m/s)
 * @param {number} airDensity - current air density (kg/m^3), from atmosphere.js
 * @returns {string} the phase for this frame (unchanged if no transition happened)
 */
export function determineNextPhase(currentPhase, altitude, velocity, airDensity) {
  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
  const dynamicPressure = 0.5 * airDensity * speed ** 2;

  switch (currentPhase) {
    case "aerobraking":
      if (altitude <= PARACHUTE_DEPLOY_ALTITUDE && dynamicPressure <= PARACHUTE_DEPLOY_DYNAMIC_PRESSURE) {
        return "parachute";
      }
      return "aerobraking";

    case "parachute":
      if (altitude <= POWERED_DESCENT_ALTITUDE) {
        return "poweredDescent";
      }
      return "parachute";

    case "poweredDescent":
      if (altitude <= 0) {
        // velocity.y is negative while descending — compare its magnitude
        return Math.abs(velocity.y) <= SAFE_LANDING_VERTICAL_SPEED ? "landed" : "crashed";
      }
      return "poweredDescent";

    case "landed":
    case "crashed":
      return currentPhase; // terminal states — nothing transitions out

    default:
      return currentPhase;
  }
}

/**
 * Returns the drag shape (Cd + area) forces.js should use for a given phase.
 * Keeps the aeroshell-vs-parachute swap in one place instead of scattering
 * phase checks throughout forces.js.
 *
 * @param {string} phase
 * @returns {{dragCoefficient: number, crossSectionalArea: number}}
 */
export function getDragParametersForPhase(phase) {
  if (phase === "parachute") {
    return {
      dragCoefficient: PARACHUTE_DRAG_COEFFICIENT,
      crossSectionalArea: PARACHUTE_CROSS_SECTIONAL_AREA,
    };
  }
  // Aerobraking, poweredDescent, landed, crashed all use the aeroshell shape
  // (the parachute is jettisoned before powered descent begins)
  return {
    dragCoefficient: AEROSHELL_DRAG_COEFFICIENT,
    crossSectionalArea: AEROSHELL_CROSS_SECTIONAL_AREA,
  };
}