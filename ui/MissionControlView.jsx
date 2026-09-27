// src/ui/MissionControlView.jsx
//
// MissionControlView is a secondary, read-only monitoring layout intended
// for a teammate or instructor to watch telemetry in parallel with the
// primary simulation view.
//
// SCOPE ASSUMPTION: Built as a togglable panel within the same page,
// reusing the existing chart components and simulationState — NOT a
// separate browser window/view. This was an open question in the project
// notes ("confirm scope with the team"). If the team wants a genuinely
// separate view (e.g. a second browser tab/window), this file will need
// to be restructured — flag that decision back to me once confirmed.

import React from "react";
import ChartAltitudeVelocity from "./ChartAltitudeVelocity";
import ChartFuelTime from "./ChartFuelTime";
import ChartHeatTime from "./ChartHeatTime";

function MissionControlView({ simulationState, elapsedTime, onClose }) {
  const { altitude, speed, velocity, fuel, heat, phase, gForce } = simulationState;

  return (
    <div className="mission-control-view">
      <div className="mission-control-header">
        <h2>Mission Control</h2>
        {/* onClose lets the parent component toggle this panel off,
            returning to the primary simulation view. */}
        <button className="close-button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="mission-control-stats">
        <div className="stat-block">
          <span className="stat-label">Phase</span>
          <span className="stat-value">{phase}</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Altitude</span>
          <span className="stat-value">{altitude.toFixed(1)} m</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Speed</span>
          <span className="stat-value">{speed.toFixed(1)} m/s</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">G-Force</span>
          <span className="stat-value">{gForce.toFixed(2)} G</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Fuel</span>
          <span className="stat-value">{fuel.toFixed(0)}%</span>
        </div>
      </div>

      <div className="mission-control-charts">
        <ChartAltitudeVelocity altitude={altitude} velocity={velocity} speed={speed} />
        <ChartFuelTime fuel={fuel} elapsedTime={elapsedTime} />
        <ChartHeatTime heat={heat} elapsedTime={elapsedTime} />
      </div>
    </div>
  );
}

export default MissionControlView;