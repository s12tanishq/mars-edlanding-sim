import { clamp } from "../shared/constants.js";

export class PIDController {
  constructor({
    kp,
    ki,
    kd,
    min = -Infinity,
    max = Infinity,
    integralLimit = 10,
    derivativeTime = 0.25,
  }) {
    Object.assign(this, {
      kp,
      ki,
      kd,
      min,
      max,
      integralLimit,
      derivativeTime,
    });
    this.reset();
  }
  reset() {
    this.integral = 0;
    this.previousMeasurement = null;
    this.derivative = 0;
  }

  compute(target, measured, dt) {
    if (![target, measured, dt].every(Number.isFinite) || dt <= 0) return 0;
    const error = target - measured;
    // Derivative on measurement avoids a kick when the target changes.
    const rawDerivative =
      this.previousMeasurement === null
        ? 0
        : -(measured - this.previousMeasurement) / dt;
    this.derivative +=
      (rawDerivative - this.derivative) *
      (1 - Math.exp(-dt / this.derivativeTime));
    this.previousMeasurement = measured;
    const proposedIntegral = clamp(
      this.integral + error * dt,
      -this.integralLimit,
      this.integralLimit,
    );
    const raw =
      this.kp * error + this.ki * proposedIntegral + this.kd * this.derivative;
    // Stop integrating when saturation and the error push in the same direction.
    if (!((raw > this.max && error > 0) || (raw < this.min && error < 0)))
      this.integral = proposedIntegral;
    return clamp(
      this.kp * error + this.ki * this.integral + this.kd * this.derivative,
      this.min,
      this.max,
    );
  }
}
