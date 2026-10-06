// Presentation only. These functions never write to simulationState.
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export function ease(t) {
  // Cubic Bezier (0.22, 0, 0.32, 1), with x inverted to respect elapsed time.
  t = clamp01(t);
  if (t === 0 || t === 1) return t;
  let lo = 0,
    hi = 1,
    u = t;
  for (let i = 0; i < 14; i++) {
    u = (lo + hi) / 2;
    const x = 3 * (1 - u) ** 2 * u * 0.22 + 3 * (1 - u) * u * u * 0.32 + u ** 3;
    if (x < t) lo = u;
    else hi = u;
  }
  return 3 * (1 - u) * u * u + u ** 3;
}
export const damp = (a, b, rate, dt) =>
  a + (b - a) * (1 - Math.exp(-rate * Math.max(0, dt)));
export function createVisualTimeline() {
  let clock = 0,
    previousTime = null,
    terminalAge = 0;
  const marks = new Map();
  return {
    reset(){clock=0;previousTime=null;terminalAge=0;marks.clear();},
    update(snapshot, wallDt, briefing = false, playing) {
      const advances = previousTime !== null && snapshot.time > previousTime;
      let dt = (playing ?? advances) && !briefing ? Math.min(wallDt, 0.05) : 0;
      if (snapshot.complete && terminalAge < 0.9) {
        dt = Math.min(wallDt, 0.05, 0.9 - terminalAge);
        terminalAge += dt;
      }
      clock += dt;
      previousTime = snapshot.time;
      const phase = briefing ? "preview" : snapshot.state.phase;
      if (!marks.has(phase)) marks.set(phase, clock);
      const age = (p) =>
        marks.has(p) ? Math.max(0, clock - marks.get(p)) : null;
      return { dt, clock, phase, age };
    },
  };
}
export function stageHeight(altitude) {
  // Illustrative tether geometry, not an extra physics body or cable solver.
  return 2.9 + 5.8 * ease((28 - altitude) / 25);
}
export function deploymentVisual(frame) {
  const opening = frame.age("parachute"),
    released = frame.age("poweredDescent");
  const openingAge = opening ?? 0;
  return {
    pilot: opening === null ? 0 : ease(openingAge / 0.32),
    lineStretch: opening === null ? 0 : ease((openingAge - 0.18) / 0.72),
    canopy: opening === null ? 0 : ease((openingAge - 0.48) / 1.45),
    shieldRelease: opening === null ? 0 : ease((openingAge - 0.32) / 1.15),
    release: released === null ? 0 : ease(released / 1.15),
    releaseAge: released ?? 0,
    stageReveal: released === null ? 0 : ease(released / 0.72),
  };
}
