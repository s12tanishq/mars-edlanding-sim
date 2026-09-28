// SI units throughout: metres, seconds, kilograms and newtons. +Y points up.
// Transparent simulation parameters; this is not a reconstruction of a NASA mission.
export const CONFIG = Object.freeze({
  dt: 1 / 60,
  gravity: 3.71,
  earthGravity: 9.80665,
  densityAtSurface: 0.02,
  atmosphereScaleHeight: 11100,
  dryMass: 900,
  initialFuel: 420,
  maxThrust: 26000,
  specificImpulse: 230,
  maxTilt: (35 * Math.PI) / 180,
  entryCdArea: 52,
  chuteCdArea: 150,
  descentCdArea: 6,
  entryLiftDragRatio: 0.045,
  chuteMaxAltitude: 11000,
  chuteMaxSpeed: 450,
  chuteMaxPressure: 350,
  poweredAltitude: 1200,
  heatingReference: 55000000,
  historyInterval: 0.25,
  trajectoryInterval: 0.1,
  maxSimulationTime: 1200,
});

export const LANDING_TARGET = Object.freeze({ x: 0, y: 0, z: 0 });
export const SUCCESS_LIMITS = Object.freeze({
  verticalSpeed: 2.5,
  distance: 50,
  peakG: 5,
});
export const PHASES = [
  "aerobraking",
  "parachute",
  "poweredDescent",
  "landed",
  "crashed",
];
export const TERMINAL_PHASES = new Set(["landed", "crashed"]);
export const CONTROL = Object.freeze({
  vertical: {
    kp: 0.85,
    ki: 0.055,
    kd: 0.1,
    min: -2.8,
    max: 9,
    integralLimit: 18,
  },
  horizontal: {
    kp: 0.7,
    ki: 0.025,
    kd: 0.08,
    min: -3.2,
    max: 3.2,
    integralLimit: 3,
  },
  filterTime: 0.14,
  throttleRate: 2,
  horizontalPositionGain: 0.055,
  maxHorizontalSpeed: 32,
});

export const SCENARIOS = Object.freeze({
  nominal: {
    label: "Nominal entry",
    wind: 1,
    noise: 1,
    fuel: 420,
    seed: 42,
    description:
      "Moderate wind shear and noisy sensors. Full autonomous entry, descent and landing.",
  },
  gusts: {
    label: "High wind shear",
    wind: 2.3,
    noise: 1.6,
    fuel: 420,
    seed: 77,
    description:
      "Stronger lateral gusts test guidance corrections and landing accuracy.",
  },
  storm: {
    label: "Dust storm front", wind: 1.5, noise: 1.8, fuel: 420, seed: 117,
    storm: 1, description: "A seeded storm front alters wind, atmospheric density and sensor quality.",
  },
  sensor: {
    label:"Sensor interruption",wind:1,noise:1.3,fuel:420,seed:51,dropout:true,
    description:"A one-second navigation outage tests held-measurement recovery during powered descent.",
  },
  engine: {
    label:"Engine degradation",wind:1,noise:1,fuel:420,seed:65,engineEfficiency:.8,
    description:"Twenty percent thrust loss tests feedback compensation and reserve use.",
  },
  fuel: {
    label: "Fuel contingency",
    wind: 1,
    noise: 1,
    fuel: 65,
    seed: 42,
    description:
      "A deliberately under-fuelled vehicle. Watch engine cutoff and the honest failure result.",
  },
});

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const magnitude = (v) => Math.hypot(v.x, v.y, v.z);
