import test from "node:test";
import assert from "node:assert/strict";
import { Simulation } from "../src/shared/Simulation.js";
import { CONFIG } from "../src/shared/constants.js";
import { createSimulationState } from "../src/shared/simulationState.js";
import { densityAt } from "../src/physics/atmosphere.js";
import { computeForces } from "../src/physics/forces.js";
import { stepPhysics } from "../src/physics/equationsOfMotion.js";
import { updatePhase } from "../src/physics/phases.js";
import { GuidanceComputer } from "../src/control/guidance.js";
import { PIDController } from "../src/control/pidController.js";
import { evaluateMission } from "../src/shared/scoring.js";
import {terrainHeight} from "../src/shared/terrain.js";

const off = { throttle: 0, steering: { x: 0, z: 0 } };
const calm = { x: 0, y: 0, z: 0 };
function run(scenario = "nominal", options = {}) {
  const sim = new Simulation(scenario, options);
  while (!sim.complete) sim.step();
  return sim;
}

test("density decays exponentially; drag opposes AIR-relative velocity", () => {
  assert.equal(densityAt(0), CONFIG.densityAtSurface);
  assert.ok(densityAt(10000) < densityAt(1000));
  const state = createSimulationState();
  state.velocity = { x: 10, y: 0, z: 0 };
  const sameAir = computeForces(state, off, state.velocity, CONFIG.dt);
  assert.equal(Math.hypot(sameAir.drag.x, sameAir.drag.y, sameAir.drag.z), 0);
  const tailwind = computeForces(state, off, { x: 20, y: 0, z: 0 }, CONFIG.dt);
  assert.ok(tailwind.drag.x > 0);
});

test("physics creates a new truth snapshot, preserves its shape, and burns finite fuel", () => {
  const state = createSimulationState({ fuel: 0.001 });
  state.phase = "poweredDescent";
  const copy = structuredClone(state);
  Object.freeze(state.position);
  Object.freeze(state.velocity);
  Object.freeze(state);
  const { state: next, diagnostics } = stepPhysics(
    state,
    { throttle: 1, steering: { x: 1, z: 1 } },
    CONFIG.dt,
    calm,
  );
  assert.deepEqual(state, copy);
  assert.deepEqual(Object.keys(next), Object.keys(state));
  assert.equal(next.fuel, 0);
  assert.ok(diagnostics.actualThrottle < 1);
  assert.equal(next.altitude, Math.max(0,next.position.y-terrainHeight(next.position.x,next.position.z)));
  assert.equal(next.speed, Math.hypot(...Object.values(next.velocity)));
  assert.ok(
    Math.abs(Math.hypot(...Object.values(diagnostics.direction)) - 1) < 1e-10,
  );
  assert.throws(() => stepPhysics(state, off, NaN, calm));
});

test("phase transitions use physical gates and only advance forward", () => {
  const state = createSimulationState();
  state.altitude = 9000;
  state.position.y = 9000;
  assert.equal(
    updatePhase(state, { airspeed: 300, dynamicPressure: 500 }),
    "aerobraking",
  );
  assert.equal(
    updatePhase(state, { airspeed: 300, dynamicPressure: 300 }),
    "parachute",
  );
  state.phase = "parachute";
  state.altitude = 1200;
  assert.equal(
    updatePhase(state, { airspeed: 100, dynamicPressure: 20 }),
    "poweredDescent",
  );
  state.phase = "poweredDescent";
  state.altitude = 9000;
  assert.equal(
    updatePhase(state, { airspeed: 300, dynamicPressure: 300 }),
    "poweredDescent",
  );
});

test("control consumes noisy data, stays bounded, steers to target, and resets", () => {
  const brain = new GuidanceComputer({ noise: 0 });
  const state = createSimulationState();
  state.phase = "poweredDescent";
  state.position = { x: 100, y: 100, z: -100 };
  state.altitude = 100;
  state.velocity = { x: 0, y: -20, z: 0 };
  Object.freeze(state);
  Object.freeze(state.velocity);
  Object.freeze(state.position);
  for (let i = 0; i < 180; i++) {
    const command = brain.update(state, CONFIG.dt);
    assert.ok(command.throttle >= 0 && command.throttle <= 1);
    assert.ok(command.steering.x < 0 && command.steering.z > 0);
    assert.ok(Math.hypot(command.steering.x, command.steering.z) <= 1 + 1e-10);
  }
  for (const phase of ["aerobraking", "parachute", "landed", "crashed"])
    assert.equal(brain.update({ ...state, phase }, CONFIG.dt).throttle, 0);
  assert.equal(brain.update({ ...state, fuel: 0 }, CONFIG.dt).throttle, 0);
  assert.equal(brain.update(state, NaN).throttle, 0);
  brain.reset();
  assert.equal(brain.verticalPid.integral, 0);
  assert.equal(brain.sensors.filtered, null);
});

test("PID avoids derivative kick on a target change and resists saturation windup", () => {
  const pid = new PIDController({ kp: 0, ki: 0, kd: 1 });
  pid.compute(1, 0, 0.1);
  assert.equal(pid.compute(100, 0, 0.1), 0);
  const bounded = new PIDController({ kp: 1, ki: 1, kd: 0, min: -1, max: 1 });
  for (let i = 0; i < 1000; i++) bounded.compute(100, 0, 0.1);
  assert.equal(bounded.integral, 0);
});

test("nominal and gust scenarios complete every phase and meet all three criteria", () => {
  for (const scenario of ["nominal", "gusts"]) {
    const sim = run(scenario);
    assert.equal(sim.result.success, true, JSON.stringify(sim.result));
    assert.deepEqual(
      [...new Set(sim.events.map((e) => e.phase))],
      ["aerobraking", "parachute", "poweredDescent", "landed"],
    );
    assert.ok(
      sim.history.every((p) => Object.values(p).every(Number.isFinite)),
    );
    assert.equal(sim.trajectory[0].y, 35000);
    assert.equal(sim.trajectory.at(-1).y, terrainHeight(sim.state.position.x,sim.state.position.z));
    assert.equal(sim.command.throttle, 0);
    const frozen = JSON.stringify(sim.snapshot());
    sim.step();
    assert.equal(JSON.stringify(sim.snapshot()), frozen);
  }
});

test("fuel contingency honestly fails and never produces negative propellant", () => {
  const sim = run("fuel");
  assert.equal(sim.result.success, false);
  assert.equal(sim.state.phase, "crashed");
  assert.equal(sim.state.fuel, 0);
  assert.equal(sim.command.throttle, 0);
  assert.ok(sim.events.some((e) => e.message.includes("Fuel depleted")));
  assert.ok(sim.history.every((p) => p.fuel >= 0));
});

test("same seed gives identical results; reset clears all mission history", () => {
  const first = run(),
    second = run();
  assert.deepEqual(first.snapshot(), second.snapshot());
  first.reset();
  assert.equal(first.time, 0);
  assert.equal(first.history.length, 1);
  assert.equal(first.trajectory.length, 1);
  assert.equal(first.metrics.peakG, 0);
  assert.equal(first.result, null);
  while (!first.complete) first.step();
  assert.deepEqual(first.result, second.result);
});

test("scoring uses impact speed magnitude and peak load, including strict limits", () => {
  const state = createSimulationState();
  state.phase = "landed";
  state.position = { x: 0, y: 0, z: 0 };
  state.velocity.y = 3;
  assert.equal(
    evaluateMission(state, { peakG: 1 }).checks.verticalSpeed,
    false,
  );
  state.velocity.y = -2.5;
  assert.equal(
    evaluateMission(state, { peakG: 1 }).checks.verticalSpeed,
    false,
  );
  state.velocity.y = -1;
  assert.equal(evaluateMission(state, { peakG: 5 }).success, false);
  state.position.x = 50;
  assert.equal(evaluateMission(state, { peakG: 4 }).success, true);
  state.position.x = 50.01;
  assert.equal(evaluateMission(state, { peakG: 4 }).success, false);
});

test("controller completes a small seed sweep with disturbances enabled", () => {
  for (let seed = 1; seed <= 12; seed++) {
    const sim = run("nominal", { seed });
    assert.equal(
      sim.result.success,
      true,
      `seed ${seed}: ${JSON.stringify(sim.result)}`,
    );
  }
});
