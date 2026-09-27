// src/ui/ChartAltitudeVelocity.jsx
//
// Live-updating chart plotting altitude (y-axis) against velocity (x-axis)
// as the descent progresses. Each render adds one new point to the trail,
// so the chart traces the lander's altitude/speed relationship over time.
//
// DEPENDENCY: This file assumes "recharts" is installed via
// CreatorCode: Install Asset. Confirm before pushing — if your team uses
// chart.js + react-chartjs-2 instead, this file needs to be rewritten.

import React, { useState, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Recharts wants an array of point objects, not raw numbers. We build that
// history ourselves inside this component using local state.
function ChartAltitudeVelocity({ altitude, velocity }) {
  const [history, setHistory] = useState([]);

  // We only care about the magnitude of velocity (speed), not its x/y/z
  // direction, for this particular chart's x-axis.
  const speedMagnitude = Math.sqrt(
    velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
  );

  useEffect(() => {
    // Append the newest altitude/speed pair to our running history.
    // This is what makes the chart "live" — every time altitude or
    // velocity changes, we add one more plotted point.
    setHistory((prevHistory) => [
      ...prevHistory,
      { altitude, speed: speedMagnitude },
    ]);
  }, [altitude, speedMagnitude]);

  return (
    <div className="chart-container">
      <h3>Altitude vs. Velocity</h3>
      <ResponsiveContainer width="100%" height={200}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="speed"
            name="Speed"
            unit=" m/s"
            label={{ value: "Speed (m/s)", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            type="number"
            dataKey="altitude"
            name="Altitude"
            unit=" m"
            label={{ value: "Altitude (m)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={history} fill="#e07a5f" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ChartAltitudeVelocity;