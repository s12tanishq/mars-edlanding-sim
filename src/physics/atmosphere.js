import { CONFIG } from "../shared/constants.js";

export function densityAt(altitude) {
  return (
    CONFIG.densityAtSurface *
    Math.exp(-Math.max(0, altitude) / CONFIG.atmosphereScaleHeight)
  );
}

export function dynamicPressure(density, airspeed) {
  return 0.5 * density * airspeed * airspeed;
}
