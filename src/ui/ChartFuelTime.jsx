import React from "react";
import Chart from "./Chart.jsx";
export default function ChartFuelTime({ history, state }) {
  return (
    <Chart
      title="Propellant reserve"
      subtitle="Remaining fuel over mission time"
      data={history}
      xKey="time"
      yKey="fuel"
      current={state.fuel}
      unit="kg"
      maxY={420}
      color="#658367"
    />
  );
}
