import { CONFIG, magnitude } from "./constants.js";
import { terrainHeight } from "./terrain.js";

// Preserve the agreed shape. Clock, control commands and metrics live outside it.
export function createSimulationState({ fuel = CONFIG.initialFuel } = {}) {
  const velocity = { x: -8, y: -1300, z: 6 };
  return {
    position: { x: 420, y: 35000, z: -280 },
    velocity,
    altitude: 35000 - terrainHeight(420,-280),
    speed: magnitude(velocity),
    fuel,
    heat: 0,
    heatFlux: 0,
    shieldTemperature: 210,
    heatLoad: 0,
    gForce: 0,
    phase: "aerobraking",
  };
}

export function snapshotState(state) {
  return {
    ...state,
    position: { ...state.position },
    velocity: { ...state.velocity },
  };
}
