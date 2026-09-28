import React from "react";
import ChartAltitudeVelocity from "./ChartAltitudeVelocity.jsx";
import ChartFuelTime from "./ChartFuelTime.jsx";
import ChartHeatTime from "./ChartHeatTime.jsx";
import { number } from "./format.js";
import { LANDING_TARGET } from "../shared/constants.js";

export function Telemetry({ snapshot }) {
  const { state, command, diagnostics, metrics, wind } = snapshot;
  const offset = Math.hypot(
    state.position.x - LANDING_TARGET.x,
    state.position.z - LANDING_TARGET.z,
  );
  return (
    <aside className="telemetry">
      <div className="section-eyebrow">
        <span>LIVE TELEMETRY</span>
        <span className="green-dot" />
      </div>
      <div className="metric hero-metric">
        <label>Radar altitude</label>
        <strong>
          {number(state.altitude / 1000, 2)}
          <span>km</span>
        </strong>
        <div className="metric-track">
          <i style={{ width: `${(state.altitude / 35000) * 100}%` }} />
        </div>
      </div>
      <div className="metric">
        <label>
          Vertical velocity <span>↓</span>
        </label>
        <strong>
          {number(state.velocity.y, 1)}
          <span>m/s</span>
        </strong>
      </div>
      <div className="metric-pair">
        <div>
          <label>Downrange</label>
          <b>
            {number(offset)} <small>m</small>
          </b>
        </div>
        <div>
          <label>Peak load</label>
          <b className={metrics.peakG >= 5 ? "danger" : ""}>
            {number(metrics.peakG, 2)} <small>G</small>
          </b>
        </div>
      </div>
      <div className="engine-panel">
        <div className="section-eyebrow">
          <span>RETRO PROPULSION</span>
          <span>
            {state.phase === "poweredDescent" && state.fuel > 0
              ? "ACTIVE"
              : "STANDBY"}
          </span>
        </div>
        <div className="throttle-value">
          {number((diagnostics.actualThrottle || 0) * 100)}
          <span>%</span>
        </div>
        <div className="throttle-bars">
          {Array.from({ length: 24 }, (_, i) => (
            <i
              key={i}
              className={
                (diagnostics.actualThrottle || 0) * 24 > i ? "lit" : ""
              }
            />
          ))}
        </div>
        <p>
          Command {number(command.throttle * 100)}%{" "}
          <span>{number(state.fuel, 1)} kg remaining</span>
        </p>
      </div>
      <div className="telemetry-small">
        <div>
          <span>Dynamic pressure</span>
          <b>{number(diagnostics.dynamicPressure || 0)} Pa</b>
        </div>
        <div>
          <span>Lateral wind</span>
          <b>{number(Math.hypot(wind.x, wind.z), 1)} m/s</b>
        </div>
        <div>
          <span>Sensor stream</span>
          <b className="green">NOISY · FILTERED</b>
        </div>
      </div>
      <div className="limit-note">
        <span>◎</span>
        <p>
          Landing corridor<strong>&lt; 2.5 m/s · ≤ 50 m · &lt; 5 G</strong>
        </p>
      </div>
    </aside>
  );
}

export default function Dashboard({ snapshot }) {
  return (
    <div className="charts">
      <ChartAltitudeVelocity
        history={snapshot.history}
        state={snapshot.state}
      />
      <ChartFuelTime history={snapshot.history} state={snapshot.state} />
      <ChartHeatTime history={snapshot.history} state={snapshot.state} />
    </div>
  );
}
