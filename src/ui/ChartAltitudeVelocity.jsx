import React from "react";
import Chart from "./Chart.jsx";
export default function ChartAltitudeVelocity({ history, state }) {
  return (
    <Chart
      title="Altitude / velocity"
      subtitle="Flight envelope · altitude in metres"
      data={history}
      xKey="speed"
      yKey="altitude"
      current={state.speed}
      unit="m/s"
      xUnit="m/s"
      color="#be573a"
      maxY={35000}
    />
  );
}
