// src/physics/atmosphere.js

// --- Atmospheric constants (approximate, hackathon-appropriate) ---
export const MARS_SURFACE_DENSITY = 0.020; // kg/m^3 at the surface (~1% of Earth's ~1.225 kg/m^3)
export const MARS_SCALE_HEIGHT = 11100;    // meters — altitude over which density drops by a factor of e (~11.1 km)

/**
 * Computes Mars's atmospheric density at a given altitude using a simple
 * exponential falloff model: dense near the surface, thinning out
 * exponentially with height. Not NASA-precision (real Mars density varies
 * with dust storms, season, latitude, etc.) but it captures the right
 * *shape* for a hackathon-scale simulation.
 *
 * @param {number} altitude - height above the surface in meters
 * @returns {number} air density in kg/m^3
 */
export function calculateAirDensity(altitude) {
  // Clamp to zero so we never evaluate the model below "ground" —
  // guards against touchdown or tiny numerical overshoot going negative
  const clampedAltitude = Math.max(altitude, 0);

  return MARS_SURFACE_DENSITY * Math.exp(-clampedAltitude / MARS_SCALE_HEIGHT);
}