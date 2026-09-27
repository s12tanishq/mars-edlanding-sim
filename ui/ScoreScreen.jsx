// src/ui/ScoreScreen.jsx
//
// ScoreScreen is shown after the simulation ends (phase becomes "landed"
// or "crashed"). It compares the final simulationState values against the
// three mission success thresholds and shows a clear pass/fail result.
//
// This component does NOT calculate physics — it only reads final values
// that Physics/Control have already computed, and formats/judges them
// against fixed thresholds.

import React from "react";

// Same placeholder thresholds as BriefingPanel. Once confirmed, both files
// should import these from a shared location (e.g. src/shared/constants.js)
// instead of each hardcoding their own copy.
const THRESHOLDS = {
  maxSafeVerticalSpeed: 2.5, // m/s
  maxLandingDistance: 50, // meters
  maxSafeGForce: 5, // G
};

// Calculates straight-line distance between two {x, z} points on the ground
// plane. We ignore y (altitude) here since landing accuracy is a horizontal
// distance-from-target measurement, not a 3D one.
function calculateLandingDistance(finalPosition, targetPosition) {
  const dx = finalPosition.x - targetPosition.x;
  const dz = finalPosition.z - targetPosition.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function ScoreScreen({ simulationState, targetPosition }) {
  const { phase, velocity, gForce, position } = simulationState;

  // If the lander crashed, we skip the threshold math entirely — it's an
  // automatic fail regardless of the numbers.
  const crashed = phase === "crashed";

  const verticalSpeed = Math.abs(velocity.y);
  const landingDistance = calculateLandingDistance(position, targetPosition);

  const passedSpeed = verticalSpeed < THRESHOLDS.maxSafeVerticalSpeed;
  const passedDistance = landingDistance < THRESHOLDS.maxLandingDistance;
  const passedGForce = gForce < THRESHOLDS.maxSafeGForce;

  const overallSuccess = !crashed && passedSpeed && passedDistance && passedGForce;

  return (
    <div className="score-screen">
      <h1>{crashed ? "Mission Failed: Lander Crashed" : "Mission Complete"}</h1>

      {!crashed && (
        <>
          <h2 className={overallSuccess ? "result-pass" : "result-fail"}>
            {overallSuccess ? "SUCCESSFUL LANDING" : "LANDING UNSUCCESSFUL"}
          </h2>

          <ul className="score-details">
            <li className={passedSpeed ? "pass" : "fail"}>
              Vertical Speed at Touchdown: {verticalSpeed.toFixed(2)} m/s
              (needed under {THRESHOLDS.maxSafeVerticalSpeed} m/s) —{" "}
              {passedSpeed ? "PASS" : "FAIL"}
            </li>
            <li className={passedDistance ? "pass" : "fail"}>
              Distance from Target: {landingDistance.toFixed(1)} m (needed
              under {THRESHOLDS.maxLandingDistance} m) —{" "}
              {passedDistance ? "PASS" : "FAIL"}
            </li>
            <li className={passedGForce ? "pass" : "fail"}>
              Max G-Force: {gForce.toFixed(2)}G (needed under{" "}
              {THRESHOLDS.maxSafeGForce}G) — {passedGForce ? "PASS" : "FAIL"}
            </li>
          </ul>
        </>
      )}
    </div>
  );
}

export default ScoreScreen;