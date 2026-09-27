// src/ui/ChartFuelTime.jsx
//
// Live-updating chart plotting remaining fuel (y-axis) against elapsed
// time (x-axis). Unlike ChartAltitudeVelocity, this chart needs an actual
// time value to plot against, since simulationState only gives us a fuel
// number at "now" — not a timestamp. We rely on an elapsedTime prop
// (in seconds) passed down from Dashboard for that.
//
// DEPENDENCY: Assumes "recharts" is installed via CreatorCode: Install
// Asset. Confirm before pushing.

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ChartFuelTime({ fuel, elapsedTime }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Append the newest {time, fuel} pair to our running history.
    setHistory((prevHistory) => [
      ...prevHistory,
      { time: elapsedTime, fuel },
    ]);
  }, [elapsedTime, fuel]);

  return (
    <div className="chart-container">
      <h3>Fuel vs. Time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="number"
            unit="s"
            label={{ value: "Time (s)", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            label={{ value: "Fuel", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="fuel"
            stroke="#3d5a80"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ChartFuelTime;