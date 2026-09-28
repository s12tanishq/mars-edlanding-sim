import { createRandom } from "../shared/random.js";

// Wind is air velocity (m/s), not an extra force on top of aerodynamic drag.
// A smooth seeded gust field prevents artificial instantaneous force impulses.
export class WindField {
  constructor(seed = 42, strength = 1) {
    this.random = createRandom(seed);
    this.strength = strength;
    this.current = { x: 0, y: 0, z: 0 };
    this.target = { x: 0, y: 0, z: 0 };
    this.nextGust = 0;
  }

  sample(time, altitude, dt) {
    if (time >= this.nextGust) {
      this.target = {
        x: (this.random() * 2 - 1) * 18 * this.strength,
        y: (this.random() * 2 - 1) * 1.5 * this.strength,
        z: (this.random() * 2 - 1) * 18 * this.strength,
      };
      this.nextGust = time + 3 + this.random() * 5;
    }
    const blend = 1 - Math.exp(-dt / 1.5);
    const shear = 0.45 + 0.55 * Math.exp(-Math.max(altitude, 0) / 4500);
    for (const axis of ["x", "y", "z"]) {
      this.current[axis] +=
        (this.target[axis] * shear - this.current[axis]) * blend;
    }
    return { ...this.current };
  }
}

export class Environment {
  constructor(seed=42, strength=0) {
    const random=createRandom(seed+908);
    this.onset=45+random()*15;
    this.duration=170+random()*45;
    this.strength=strength;
    this.direction=random()*Math.PI*2;
  }
  sample(time,altitude,wind) {
    const age=(time-this.onset)/this.duration;
    const envelope=age>0&&age<1 ? Math.sin(age*Math.PI)**.7 : 0;
    const storm=envelope*this.strength;
    const local=storm*Math.exp(-Math.max(0,altitude)/7000);
    return {
      storm:local, frontStrength:storm,
      densityScale:1+local*.12,
      sensorMultiplier:1+local*1.8,
      wind:{x:wind.x+Math.cos(this.direction)*local*22,y:wind.y+local*Math.sin(time*.3),z:wind.z+Math.sin(this.direction)*local*22},
    };
  }
}
