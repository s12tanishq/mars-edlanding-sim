import { CONTROL } from "../shared/constants.js";
import { createRandom } from "../shared/random.js";

export class SensorSuite {
  constructor(seed = 43, strength = 1) {
    this.seed = seed;
    this.strength = strength;
    this.reset();
  }
  reset() {
    this.random = createRandom(this.seed);
    this.filtered = null;
    this.dropout=false;
  }
  noise(amount) {
    return (this.random() * 2 - 1) * amount * this.strength;
  }

  read(truth, dt) {
    if(this.dropout&&this.filtered)return {...this.filtered,altitude:Math.max(0,this.filtered.position.y-(truth.position.y-truth.altitude)),fuel:truth.fuel,phase:truth.phase,stale:true};
    const sample = {
      position: {
        x: truth.position.x + this.noise(0.5),
        y: Math.max(
          0,
          truth.position.y + this.noise(0.15 + truth.altitude * 0.001),
        ),
        z: truth.position.z + this.noise(0.5),
      },
      velocity: Object.fromEntries(
        ["x", "y", "z"].map((axis) => [
          axis,
          truth.velocity[axis] + this.noise(0.15),
        ]),
      ),
    };
    if (!this.filtered) this.filtered = sample;
    else {
      const blend = 1 - Math.exp(-dt / CONTROL.filterTime);
      for (const field of ["position", "velocity"]) {
        for (const axis of ["x", "y", "z"])
          this.filtered[field][axis] +=
            (sample[field][axis] - this.filtered[field][axis]) * blend;
      }
    }
    return {
      ...this.filtered,
      altitude: Math.max(0,this.filtered.position.y - (truth.position.y-truth.altitude)),
      fuel: truth.fuel,
      phase: truth.phase,
      stale:false,
    };
  }
}
