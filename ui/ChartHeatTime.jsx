// src/ui/ChartHeatTime.jsx
//
// Live-updating chart plotting heat shield temperature (y-axis) against
// elapsed time (x-axis). Structurally identical to ChartFuelTime.jsx —
// just plotting "heat" instead of "fuel" — since both are single numeric
// values from simulationState tracked over time the same way.
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

function ChartHeatTime({ heat, elapsedTime }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Append the newest {time, heat} pair to our running history.
    setHistory((prevHistory) => [
      ...prevHistory,
      { time: elapsedTime, heat },
    ]);
  }, [elapsedTime, heat]);

  return (
    <div className="chart-container">
      <h3>Heat vs. Time</h3>
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
            label={{ value: "Heat", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="heat"
            stroke="#e07a5f"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ChartHeatTime;