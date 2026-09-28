import React from "react";
import Chart from "./Chart.jsx";
export default function ChartHeatTime({ history, state }) {
  return (
    <Chart
      title="Aerothermal load"
      subtitle="Convective stagnation heat flux · kW/m²"
      data={history}
      xKey="time"
      yKey="heatFlux"
      current={state.heatFlux / 1000}
      unit="kW/m²"
      maxY={10}
      color="#c08a37"
    />
  );
}
