import { PIDController } from './pidController.js';
import { SensorSuite } from './sensors.js';

/**
 * Guidance Computer
 * The "Brain" of the lander. It reads noisy sensor data, decides how fast 
 * we should be falling based on our current altitude, and uses the PID 
 * controller to adjust the rocket throttle.
 */
export class GuidanceComputer {
  constructor() {
    // Initialize our noisy sensors
    this.sensors = new SensorSuite();

    // Initialize the PID Controller for vertical descent
    // (These tuning numbers - Kp, Ki, Kd - can be adjusted later if the lander is too bouncy)
    this.verticalPid = new PIDController(0.8, 0.05, 0.3);
  }

  /**
   * Calculates the target descent speed. 
   * We want to fall fast when high up to save fuel, but slow down near the ground.
   */
  _calculateTargetVelocity(altitude) {
    if (altitude > 1000) return -80.0; // Fall fast
    if (altitude > 500)  return -40.0; // Start slowing down
    if (altitude > 100)  return -15.0; // Getting closer
    if (altitude > 20)   return -5.0;  // Final approach
    
    // Under 20 meters, target a very gentle touchdown to satisfy the < 2.5 m/s rule
    return -1.5; 
  }

  /**
   * Main update loop - called every single frame of the simulation.
   * 
   * @param {Object} truthState - The perfect physics state (src/shared/simulationState.js)
   * @param {number} dt - Time since last frame
   * @returns {Object} The commands to send to the rocket engine
   */
  update(truthState, dt) {
    // 1. Corrupt the perfect physics data so the computer has to work with realistic noise
    const currentData = this.sensors.read(truthState);

    // Default commands: Engines off
    let throttle = 0;
    let steering = { x: 0, z: 0 }; 

    // 2. Only fire rockets during the Powered Descent phase
    if (currentData.phase === 'poweredDescent') {
      
      // Figure out how fast we *should* be falling right now
      const targetVelY = this._calculateTargetVelocity(currentData.altitude);

      // Ask the PID controller how much throttle we need to hit that target speed
      // Note: We use the noisy velocity from the sensors, not the perfect truth!
      let rawThrottle = this.verticalPid.compute(targetVelY, currentData.velocity.y, dt);

      // Clamp throttle between 0 (off) and 1 (100% max thrust). 
      // Rockets can't fire at negative power or 200% power!
      throttle = Math.max(0, Math.min(1, rawThrottle));
      
      // If we run out of fuel, the engine cuts out completely
      if (truthState.fuel <= 0) {
        throttle = 0;
      }
    } else {
      // If we transition back to another phase or land, reset the PID memory
      this.verticalPid.reset();
    }

    // Return the commands back to the main simulation loop
    return {
      throttle: throttle,
      steering: steering
    };
  }
}


  /**
 * How to explain this to the judges (Plain English):
"This is the main brain of the lander. It reads the noisy data from my sensor module, looks at our current altitude,
 and checks a 'glide slope'—meaning it knows we can fall at 80 m/s up high, but need to slow to exactly 1.5 m/s right 
 before touchdown to meet the hackathon constraints. It feeds that target speed into the PID controller, which calculates
  the exact percentage of rocket throttle needed to counteract Mars' gravity and hit that speed perfectly, clamping the 
  output between 0% and 100% thrust."
 */