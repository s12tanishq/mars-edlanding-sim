import { CONFIG, SCENARIOS, TERMINAL_PHASES } from "./constants.js";
import { createSimulationState, snapshotState } from "./simulationState.js";
import { GuidanceComputer, enginesOff } from "../control/guidance.js";
import { WindField, Environment } from "../physics/disturbances.js";
import { stepPhysics } from "../physics/equationsOfMotion.js";
import { evaluateMission } from "./scoring.js";

// The only coordinator. Neither Scene nor UI calls Physics or Control.
export class Simulation {
  constructor(scenario = "nominal", options = {}) {
    this.reset(scenario, options);
  }

  reset(scenario = this.scenario, options = {}) {
    this.scenario = scenario;
    const setup = { ...SCENARIOS[scenario], ...options };
    if (!SCENARIOS[scenario]) throw new Error("Unknown scenario");
    this.state = createSimulationState(setup);
    this.setup=setup;
    this.initialFuel=this.state.fuel;
    this.dt=options.dt ?? CONFIG.dt;
    this.brain = new GuidanceComputer({
      seed: setup.seed + 1,
      noise: setup.noise,
      tuning: setup.tuning,
    });
    this.windField = new WindField(setup.seed, setup.wind);
    this.environmentModel=new Environment(setup.seed,setup.storm ?? .25);
    this.environment=this.environmentModel.sample(0,this.state.altitude,{x:0,y:0,z:0});
    this.stormAnnounced=false;
    this.dropoutActive=false;
    this.command = enginesOff();
    this.time = 0;
    this.diagnostics = {};
    this.wind = { x: 0, y: 0, z: 0 };
    this.metrics = { peakG: 0, peakHeat: 0, peakTemperature:210, peakHeatFlux:0 };
    this.history = [];
    this.trajectory = [];
    this.events = [];
    this.result = null;
    this.timedOut = false;
    this.nextHistory = 0;
    this.nextTrajectory = 0;
    this.recordEvent("Entry interface", "aerobraking");
    this.record(true);
  }

  get complete() {
    return TERMINAL_PHASES.has(this.state.phase) || this.timedOut;
  }

  recordEvent(message, phase) {
    this.events.push({
      time: this.time,
      phase,
      altitude: this.state.altitude,
      message,
    });
  }

  record(force = false) {
    if (force || this.time >= this.nextHistory - 1e-8) {
      this.history.push({
        time: this.time,
        altitude: this.state.altitude,
        speed: this.state.speed,
        velocityY: this.state.velocity.y,
        fuel: this.state.fuel,
        heat: this.state.heat,
        heatFlux: this.state.heatFlux / 1000,
        temperature: this.state.shieldTemperature,
        gForce: this.state.gForce,
        throttle: this.command.throttle,
      });
      this.nextHistory += CONFIG.historyInterval;
    }
    if (force || this.time >= this.nextTrajectory - 1e-8) {
      this.trajectory.push({ ...this.state.position });
      this.nextTrajectory += CONFIG.trajectoryInterval;
    }
  }

  step() {
    if (this.complete) return;
    const dt = this.dt;
    const oldPhase = this.state.phase;
    const oldFuel = this.state.fuel;
    this.wind = this.windField.sample(this.time, this.state.altitude, dt);
    this.environment=this.environmentModel.sample(this.time,this.state.altitude,this.wind);
    this.environment.engineEfficiency=this.state.phase==="poweredDescent"?(this.setup.engineEfficiency??1):1;
    const dropout=Boolean(this.setup.dropout&&this.time>=145&&this.time<146);
    if(dropout!==this.dropoutActive){this.recordEvent(dropout?"Navigation signal interrupted · command hold":"Navigation signal recovered",this.state.phase);this.dropoutActive=dropout;}
    this.brain.sensors.dropout=dropout;
    this.wind=this.environment.wind;
    this.brain.sensors.strength=this.setup.noise*this.environment.sensorMultiplier;
    this.command = this.brain.update(this.state, dt);
    if(this.environment.storm>.18&&!this.stormAnnounced) {
      this.recordEvent("Dust front · wind, density and sensor noise increasing",this.state.phase);
      this.stormAnnounced=true;
    }
    const next = stepPhysics(this.state, this.command, dt, this.wind,this.environment);
    this.state = next.state;
    this.diagnostics = next.diagnostics;
    this.time += next.diagnostics.elapsed;
    this.metrics.peakG = Math.max(this.metrics.peakG, this.state.gForce);
    this.metrics.peakHeat = Math.max(this.metrics.peakHeat, this.state.heat);
    this.metrics.peakTemperature=Math.max(this.metrics.peakTemperature,this.state.shieldTemperature);
    this.metrics.peakHeatFlux=Math.max(this.metrics.peakHeatFlux,this.state.heatFlux);
    if (oldFuel > 0 && this.state.fuel === 0)
      this.recordEvent("Fuel depleted · engines cut off", this.state.phase);
    if (this.state.phase !== oldPhase) {
      const labels = {
        parachute: "Parachute deployed · pressure gate cleared",
        poweredDescent: "Canopy released · powered guidance engaged",
        landed: "Surface contact · engines secured",
        crashed: "Hard impact · mission ended",
      };
      this.recordEvent(labels[this.state.phase], this.state.phase);
    }
    if (TERMINAL_PHASES.has(this.state.phase)) {
      this.command = enginesOff();
      this.diagnostics.actualThrottle = 0;
      this.result = evaluateMission(this.state, this.metrics,this.initialFuel);
    }
    if (this.time >= CONFIG.maxSimulationTime && !this.result) {
      this.timedOut = true;
      this.command = enginesOff();
      this.recordEvent(
        "Time limit reached · mission incomplete",
        this.state.phase,
      );
    }
    this.record(this.complete);
  }

  snapshot() {
    return {
      state: snapshotState(this.state),
      command: { ...this.command, steering: { ...this.command.steering } },
      time: this.time,
      metrics: { ...this.metrics },
      wind: { ...this.wind },
      diagnostics: { ...this.diagnostics },
      telemetry: { ...this.brain.telemetry },
      history: this.history,
      trajectory: this.trajectory,
      events: this.events,
      result: this.result,
      complete: this.complete,
      timedOut: this.timedOut,
      environment: {...this.environment,wind:{...this.wind}},
      scenario:this.scenario,
      seed:this.setup.seed,
    };
  }
}
