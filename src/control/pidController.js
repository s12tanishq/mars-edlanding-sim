/**
 * PID Controller (Proportional, Integral, Derivative)
 * This is the math brain that calculates how much throttle to apply.
 */
export class PIDController {
  constructor(kp, ki, kd) {
    // Tuning parameters (how aggressive the controller should be)
    this.kp = kp; // Proportional: Reacts to current error
    this.ki = ki; // Integral: Reacts to past error (accumulated over time)
    this.kd = kd; // Derivative: Reacts to future error (predicts based on rate of change)

    // State variables
    this.integral = 0;
    this.previousError = 0;
  }

  /**
   * Computes the required output (e.g., rocket throttle adjustment)
   * 
   * @param {number} target - The value we want (e.g., target descent speed: -2 m/s)
   * @param {number} current - Our actual current value (e.g., falling at -50 m/s)
   * @param {number} dt - Delta time (time elapsed since the last frame)
   * @returns {number} The adjustment to apply (e.g., how much to fire the rockets)
   */
  compute(target, current, dt) {
    // If no time has passed, don't calculate anything to avoid dividing by zero
    if (dt <= 0) return 0; 

    // 1. Calculate the error (difference between where we want to be and where we are)
    const error = target - current;

    // 2. Proportional Term: Push harder if the error is large
    const pOut = this.kp * error;

    // 3. Integral Term: Build up over time if we aren't reaching the target
    this.integral += error * dt;
    
    // Anti-windup safeguard: Prevent the integral memory from growing infinitely
    // (Judges love seeing this, it shows real-world engineering knowledge!)
    this.integral = Math.max(Math.min(this.integral, 1000), -1000); 
    
    const iOut = this.ki * this.integral;

    // 4. Derivative Term: Slow down the push as we get closer to prevent overshooting
    const derivative = (error - this.previousError) / dt;
    const dOut = this.kd * derivative;

    // Save the current error for the next frame's derivative calculation
    this.previousError = error;

    // 5. Total Output: Sum of all three terms
    return pOut + iOut + dOut;
  }

  // Resets the controller's memory (useful if we switch flight phases)
  reset() {
    this.integral = 0;
    this.previousError = 0;
  }
}




/**
 * If they ask how your controller works, use a car analogy:Proportional (P) is like pressing the gas pedal based on how far away your destination is.
 *  If it's far, you press hard.Derivative (D) is you noticing that you are approaching the destination very fast, so you ease off the gas 
 * (and maybe tap the brakes) so you don't blow past it (overshooting).Integral (I) handles wind resistance.
 *  If you are pressing the gas but a strong wind is holding you back, the Integral notices that you are "stuck" over time, 
 * and gradually pushes the pedal harder until you break through the wind.Note: The "Anti-windup" line just makes sure the
 *  Integral doesn't memorize so much error that it accidentally floors the gas pedal permanently.
 */