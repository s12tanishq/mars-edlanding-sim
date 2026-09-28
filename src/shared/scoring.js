import { LANDING_TARGET, SUCCESS_LIMITS } from "./constants.js";

export function evaluateMission(state, metrics, initialFuel=420) {
  const verticalSpeed = Math.abs(state.velocity.y);
  const distance = Math.hypot(
    state.position.x - LANDING_TARGET.x,
    state.position.z - LANDING_TARGET.z,
  );
  const checks = {
    verticalSpeed: verticalSpeed < SUCCESS_LIMITS.verticalSpeed,
    distance: distance <= SUCCESS_LIMITS.distance,
    peakG: metrics.peakG < SUCCESS_LIMITS.peakG,
  };
  return {
    success: state.phase === "landed" && Object.values(checks).every(Boolean),
    verticalSpeed,
    distance,
    peakG: metrics.peakG,
    checks,
    fuelRemaining: state.fuel,
    fuelUsed: initialFuel-state.fuel,
    fuelEfficiency: initialFuel>0 ? state.fuel/initialFuel*100 : 0,
    efficiencyGrade: state.phase!=="landed" || !Object.values(checks).every(Boolean) ? "Not eligible — mission failed" : state.fuel/initialFuel>.5 ? "A · ample reserve" : state.fuel/initialFuel>.25 ? "B · adequate reserve" : "C · low reserve",
    peakTemperature:metrics.peakTemperature,
    heatLoad:state.heatLoad,
  };
}
