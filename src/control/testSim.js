import { GuidanceComputer } from './guidance.js';

// 1. Setup a fake starting state (high above Mars)
let fakeState = {
  altitude: 1500,
  velocity: { x: 0, y: -90, z: 0 }, // Falling at 90 m/s
  fuel: 1000,
  phase: 'poweredDescent'
};

const brain = new GuidanceComputer();
const dt = 0.1;           // 100ms per frame
const gravity = -3.71;    // Mars gravity (m/s^2)
const maxThrust = 15.0;   // How strong the rockets are

console.log("🚀 Starting Descent Test...");

// 2. Run a loop until we hit the ground
for (let time = 0; time < 120; time += dt) { // Max 120 seconds of simulation
  if (fakeState.altitude <= 0) {
    console.log(`\n🛬 TOUCHDOWN! Final Speed: ${fakeState.velocity.y.toFixed(2)} m/s`);
    // Hackathon rule: must be slower than -2.5 m/s
    if (fakeState.velocity.y > -2.5) console.log("✅ SUCCESS! Perfect landing.");
    else console.log("❌ CRASH! We hit too hard.");
    break;
  }

  // Ask your GN&C brain what throttle to apply
  const command = brain.update(fakeState, dt);

  // Apply fake physics: gravity pulls down (-), thrust pushes up (+)
  const acceleration = gravity + (command.throttle * maxThrust);
  fakeState.velocity.y += acceleration * dt;
  fakeState.altitude += fakeState.velocity.y * dt;
  fakeState.fuel -= command.throttle * dt * 5; // Fake fuel burn

  // Print telemetry to the console every 2 simulated seconds
  if (Math.abs(time % 2.0) < dt) {
    console.log(
      `Alt: ${fakeState.altitude.toFixed(0).padStart(4, ' ')}m | ` +
      `Vel: ${fakeState.velocity.y.toFixed(2).padStart(6, ' ')} m/s | ` +
      `Throttle: ${(command.throttle * 100).toFixed(0).padStart(3, ' ')}%`
    );
  }
}