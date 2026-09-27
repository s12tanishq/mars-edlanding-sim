// src/ui/Dashboard.jsx
//
// Dashboard is the layout container that arranges the three live telemetry
// charts during flight. It reads simulationState once per render and passes
// the relevant slices down to each chart — it does NOT do any calculation
// itself, just organizes layout and passes data through.
//
// IMPORTANT: This file imports the three chart components but does not
// implement them — those are separate files (ChartAltitudeVelocity.jsx,
// ChartFuelTime.jsx, ChartHeatTime.jsx) built once the charting library
// (chart.js or recharts) is confirmed on the allowlist.

import React from "react";
import ChartAltitudeVelocity from "./ChartAltitudeVelocity";
import ChartFuelTime from "./ChartFuelTime";
import ChartHeatTime from "./ChartHeatTime";

function Dashboard({ simulationState, elapsedTime }) {
  const { altitude, speed, velocity, fuel, heat, phase } = simulationState;

  // Once the lander has landed or crashed, there's no more live telemetry
  // to show — the parent component should swap to ScoreScreen instead.
  // This check is a safety net in case Dashboard stays mounted a moment
  // longer than expected during the phase transition.
  if (phase === "landed" || phase === "crashed") {
    return null;
  }

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Live Telemetry</h2>

      <div className="dashboard-charts">
        <ChartAltitudeVelocity altitude={altitude} velocity={velocity} speed={speed} />
        <ChartFuelTime fuel={fuel} elapsedTime={elapsedTime} />
        <ChartHeatTime heat={heat} elapsedTime={elapsedTime} />
      </div>

      <div className="dashboard-phase-indicator">
        Current Phase: <strong>{phase}</strong>
      </div>
    </div>
  );
}

export default Dashboard;