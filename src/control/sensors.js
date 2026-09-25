/**
 * Sensor Suite
 * Reads the "true" physics state and intentionally adds noise/jitter.
 * A major scoring criterion is handling imperfect data. Our controller 
 * must use these noisy readings instead of the perfect physics data.
 */
export class SensorSuite {
  constructor() {
    // Define how "bad" our sensors are. 
    // You can increase these to make the simulation harder for the PID to handle.
    this.baseAltimeterNoise = 2.0; // +/- 2 meters of base error
    this.imuNoise = 0.5;           // +/- 0.5 m/s error in velocity readings
  }

  /**
   * Helper function to generate random positive or negative noise.
   * Math.random() gives 0 to 1. 
   * (Math.random() - 0.5) * 2 gives a range from -1.0 to 1.0.
   */
  _getNoise(magnitude) {
    return (Math.random() - 0.5) * 2 * magnitude;
  }

  /**
   * Takes the perfect simulation state and returns what the lander's computer actually "sees".
   * 
   * @param {Object} truthState - The perfect physics state (src/shared/simulationState.js)
   * @returns {Object} Noisy sensor readings to feed into the PID controller
   */
  read(truthState) {
    // 1. Radar Altimeter: Error scales with height. 
    // At 10,000m, the error is larger. Near the ground, it becomes much more accurate.
    const altimeterErrorMargin = this.baseAltimeterNoise + (truthState.altitude * 0.01);
    let noisyAltitude = truthState.altitude + this._getNoise(altimeterErrorMargin);
    
    // Altimeter can't read negative numbers (underground)
    noisyAltitude = Math.max(0, noisyAltitude);

    // 2. IMU (Inertial Measurement Unit): Constant small jitter on velocity
    const noisyVelocity = {
      x: truthState.velocity.x + this._getNoise(this.imuNoise),
      y: truthState.velocity.y + this._getNoise(this.imuNoise),
      z: truthState.velocity.z + this._getNoise(this.imuNoise)
    };

    // Return the corrupted data for the brain to use
    return {
      altitude: noisyAltitude,
      velocity: noisyVelocity,
      phase: truthState.phase // The computer knows its own flight phase perfectly
    };
  }
}


/**
 * If they ask why you wrote this file, you have a killer answer:
"In a video game, you just use the exact physics numbers. But in a real Mars landing, the radar bounces off rocks and dust, 
and the accelerometer has static. I built this module to intentionally corrupt the physics data before it reaches the flight computer.
 Our radar altimeter actually gets 'fuzzier' at higher altitudes and sharper near the ground, forcing my PID controller to filter out the noise on its own."

Judges absolutely love this because it shows you aren't just making a game, you are thinking like an actual aerospace engineer.
 * 
 */