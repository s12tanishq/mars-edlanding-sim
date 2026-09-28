import { CONFIG, CONTROL, LANDING_TARGET, clamp } from "../shared/constants.js";
import { PIDController } from "./pidController.js";
import { SensorSuite } from "./sensors.js";

export const enginesOff = () => ({ throttle: 0, steering: { x: 0, z: 0 } });

export class GuidanceComputer {
  constructor({ seed = 43, noise = 1, target = LANDING_TARGET, tuning = {} } = {}) {
    this.sensors = new SensorSuite(seed, noise);
    this.verticalPid = new PIDController({...CONTROL.vertical,kp:CONTROL.vertical.kp*(tuning.response ?? 1)});
    this.xPid = new PIDController(CONTROL.horizontal);
    this.zPid = new PIDController(CONTROL.horizontal);
    this.target = target;
    this.positionGain=CONTROL.horizontalPositionGain*(tuning.precision ?? 1);
    this.lastThrottle = 0;
    this.telemetry = {};
    this.lastCommand=enginesOff();
  }

  reset() {
    this.sensors.reset();
    this.verticalPid.reset();
    this.xPid.reset();
    this.zPid.reset();
    this.lastThrottle = 0;
    this.telemetry = {};
    this.lastCommand=enginesOff();
  }

  update(truth, dt) {
    if (!Number.isFinite(dt) || dt <= 0) return enginesOff();
    const measured = this.sensors.read(truth, dt);
    if(measured.stale&&measured.phase==="poweredDescent"&&measured.fuel>0){this.telemetry={...this.telemetry,mode:"SENSOR HOLD · LAST VALID COMMAND"};return this.lastCommand;}
    if(measured.phase === "aerobraking") {
      const x=clamp((this.target.x-measured.position.x)*.0015-measured.velocity.x*.09,-1,1);
      const z=clamp((this.target.z-measured.position.z)*.0015-measured.velocity.z*.09,-1,1);
      this.telemetry={mode:"LIFT GUIDANCE",measuredAltitude:measured.altitude,measuredVelocityY:measured.velocity.y,targetVelocityY:null,liftX:x,liftZ:z};
      return {...enginesOff(),lift:{x,z}};
    }
    if (measured.phase !== "poweredDescent" || measured.fuel <= 0) {
      this.verticalPid.reset();
      this.xPid.reset();
      this.zPid.reset();
      this.lastThrottle = 0;
      this.telemetry = {
        mode: measured.phase === "parachute" ? "PASSIVE CANOPY · MONITORING" : "ENGINES SECURED",
        measuredAltitude: measured.altitude,
        targetVelocityY: null,
      };
      return enginesOff();
    }
    const altitude = Math.max(0, measured.altitude);
    // Continuous braking envelope with a slow terminal segment below 3 m.
    const targetVelocityY = -Math.min(
      65,
      Math.sqrt(0.8 ** 2 + 2 * 0.55 * Math.max(0, altitude - 3)),
    );
    const targetX = clamp(
      (this.target.x - measured.position.x) * this.positionGain,
      -CONTROL.maxHorizontalSpeed,
      CONTROL.maxHorizontalSpeed,
    );
    const targetZ = clamp(
      (this.target.z - measured.position.z) * this.positionGain,
      -CONTROL.maxHorizontalSpeed,
      CONTROL.maxHorizontalSpeed,
    );
    const ax = this.xPid.compute(targetX, measured.velocity.x, dt);
    const az = this.zPid.compute(targetZ, measured.velocity.z, dt);
    const ay =
      CONFIG.gravity +
      this.verticalPid.compute(targetVelocityY, measured.velocity.y, dt);
    // Model-based command allocation. Physics still owns every applied force.
    const horizontal = Math.hypot(ax, az);
    const maxHorizontal = Math.max(0, ay) * Math.tan(CONFIG.maxTilt);
    const scale = horizontal > maxHorizontal ? maxHorizontal / horizontal : 1;
    const demand = Math.hypot(ax * scale, ay, az * scale);
    const requested = clamp(
      (demand * (CONFIG.dryMass + measured.fuel)) / CONFIG.maxThrust,
      0,
      1,
    );
    const throttle = clamp(
      requested,
      this.lastThrottle - CONTROL.throttleRate * dt,
      this.lastThrottle + CONTROL.throttleRate * dt,
    );
    this.lastThrottle = throttle;
    const steering =
      demand > 0
        ? {
            x: (ax * scale) / demand / Math.sin(CONFIG.maxTilt),
            z: (az * scale) / demand / Math.sin(CONFIG.maxTilt),
          }
        : { x: 0, z: 0 };
    this.telemetry = {
      mode: "POWERED GUIDANCE",
      targetVelocityY,
      measuredAltitude: measured.altitude,
      measuredVelocityY: measured.velocity.y,
      verticalError: targetVelocityY - measured.velocity.y,
    };
    this.lastCommand={throttle,steering};return this.lastCommand;
  }
}
