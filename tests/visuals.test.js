import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ease,
  damp,
  stageHeight,
  createVisualTimeline,
  deploymentVisual,
} from "../src/scene/motion.js";
import {
  advanceOrbitalRotation,
  ORBITAL_ROTATION_RATE,
} from "../src/scene/OrbitalMars.js";
import {
  resultRevealDelay,
  RESULT_REVEAL_DELAY_MS,
} from "../src/ui/resultTiming.js";

test("Bezier easing is bounded, monotone and exact at endpoints", () => {
  assert.equal(ease(-1), 0);
  assert.equal(ease(2), 1);
  let previous = 0;
  for (let i = 0; i <= 100; i++) {
    const value = ease(i / 100);
    assert.ok(value >= previous && value <= 1);
    previous = value;
  }
});
test("exponential throttle smoothing is frame-rate independent and freezes at zero dt", () => {
  let a = 0,
    b = 0;
  for (let i = 0; i < 60; i++) a = damp(a, 1, 7, 1 / 60);
  for (let i = 0; i < 30; i++) b = damp(b, 1, 7, 1 / 30);
  assert.ok(Math.abs(a - b) < 1e-12);
  assert.equal(damp(a, 0, 7, 0), a);
  assert.ok(damp(a, 0, 11, 0.1) < a);
});
test("visual time freezes while paused and reset has no stale deployment marks", () => {
  const timeline = createVisualTimeline();
  const snap = { time: 0, complete: false, state: { phase: "aerobraking" } };
  timeline.update(snap, 0.016);
  snap.time = 1;
  timeline.update(snap, 0.016);
  snap.state.phase = "parachute";
  snap.time = 2;
  const start = timeline.update(snap, 0.016);
  const paused = timeline.update(snap, 0.5);
  assert.equal(paused.clock, start.clock);
  assert.equal(paused.age("parachute"), 0);
  const fresh = createVisualTimeline().update(
    { ...snap, state: { phase: "aerobraking" } },
    0.016,
  );
  assert.equal(fresh.age("parachute"), null);
});
test("deployment sequence stages pilot, canopy, cutaway and thrust plate", () => {
  const frame = { age: (phase) => (phase === "parachute" ? 5 : 0) };
  const deployed = deploymentVisual(frame);
  assert.equal(deployed.pilot, 1);
  assert.equal(deployed.lineStretch, 1);
  assert.equal(deployed.canopy, 1);
  assert.equal(deployed.shieldRelease, 1);
  assert.equal(deployed.release, 0);
  assert.equal(deployed.releaseAge, 0);
  assert.equal(deployed.stageReveal, 0);
  const early = deploymentVisual({ age: (p) => (p === "parachute" ? 0.25 : null) });
  assert.ok(early.pilot > 0 && early.lineStretch > 0);
  assert.equal(early.canopy, 0);
  const mid = deploymentVisual({ age: (p) => (p === "parachute" ? 6 : 0.6) });
  assert.ok(mid.release > 0 && mid.release < 1);
  assert.ok(mid.stageReveal > 0 && mid.stageReveal < 1);
});
test("illustrative tether offsets remain bounded without modifying truth", () => {
  assert.equal(stageHeight(100), 2.9);
  assert.ok(Math.abs(stageHeight(0) - 8.7) < 1e-10);
  for (let y = 0; y < 100; y++)
    assert.ok(stageHeight(y) >= 2.9 && stageHeight(y) <= 8.7);
});
test("terminal afterglow settles then freezes, and does not mutate snapshot", () => {
  const snapshot = { time: 190, complete: true, state: { phase: "landed" } };
  const original = JSON.stringify(snapshot),
    timeline = createVisualTimeline();
  let frame;
  for (let i = 0; i < 100; i++) frame = timeline.update(snapshot, 0.016);
  const end = timeline.update(snapshot, 0.016);
  assert.equal(end.dt, 0);
  assert.equal(frame.clock, end.clock);
  assert.equal(JSON.stringify(snapshot), original);
  assert.equal(resultRevealDelay({ success: true }), RESULT_REVEAL_DELAY_MS);
  assert.ok(resultRevealDelay({ success: false }) >= 3000);
  assert.equal(resultRevealDelay(null), 0);
});
test("NASA asset and local decoding/terrain resources are present", () => {
  const root = new URL("../public/", import.meta.url);
  const glb = fs.readFileSync(new URL("assets/perseverance.glb", root));
  assert.equal(glb.readUInt32LE(0), 0x46546c67);
  assert.equal(glb.readUInt32LE(4), 2);
  for (const name of [
    "draco/draco_decoder.wasm",
    "draco/draco_wasm_wrapper.js",
    "assets/mars-panorama.jpg",
    "assets/terrain-color.jpg",
    "assets/terrain-normal.jpg",
    "assets/terrain-roughness.jpg",
  ])
    assert.ok(fs.statSync(new URL(name, root)).size > 100);
  for (let row = 0; row < 4; row += 1)
    for (let column = 0; column < 8; column += 1)
      assert.ok(
        fs.statSync(new URL(`assets/mars-viking-z2/${row}-${column}.jpg`, root)).size > 100,
      );
  for (let row = 202; row <= 205; row += 1)
    for (let column = 730; column <= 733; column += 1)
      assert.ok(
        fs.statSync(new URL(`assets/mars-jezero-z9/${row}-${column}.png`, root)).size > 100,
      );
});
test("high-refresh visual clock advances between fixed physics steps only while playing", () => {
  const timeline = createVisualTimeline(),
    snapshot = { time: 1, complete: false, state: { phase: "parachute" } };
  let frame;
  for (let i = 0; i < 120; i++)
    frame = timeline.update(snapshot, 1 / 120, false, true);
  assert.ok(Math.abs(frame.clock - 1) < 1e-12);
  assert.equal(timeline.update(snapshot, 0.1, false, false).clock, frame.clock);
  const oneStep = advanceOrbitalRotation(0, 1);
  let manySteps = 0;
  for (let i = 0; i < 120; i++) manySteps = advanceOrbitalRotation(manySteps, 1 / 120);
  assert.ok(Math.abs(oneStep - ORBITAL_ROTATION_RATE) < 1e-12);
  assert.ok(Math.abs(oneStep - manySteps) < 1e-12);
});
