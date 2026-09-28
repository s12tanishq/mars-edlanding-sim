import {
  CONFIG,
  SUCCESS_LIMITS,
  TERMINAL_PHASES,
} from "../shared/constants.js";

export function updatePhase(state, diagnostics) {
  if (TERMINAL_PHASES.has(state.phase)) return state.phase;
  if (state.altitude <= 0) {
    return Math.abs(state.velocity.y) < SUCCESS_LIMITS.verticalSpeed
      ? "landed"
      : "crashed";
  }
  if (
    state.phase === "aerobraking" &&
    state.velocity.y < 0 &&
    state.altitude <= CONFIG.chuteMaxAltitude &&
    diagnostics.airspeed <= CONFIG.chuteMaxSpeed &&
    diagnostics.dynamicPressure <= CONFIG.chuteMaxPressure
  )
    return "parachute";
  if (state.phase === "parachute" && state.altitude <= CONFIG.poweredAltitude)
    return "poweredDescent";
  return state.phase;
}
