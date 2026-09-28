import React from "react";
import Dashboard from "./Dashboard.jsx";
import { number, missionTime, phaseLabels } from "./format.js";
import TrajectoryReview from "./TrajectoryReview.jsx";

export default function MissionControlView({ snapshot, performance }) {
  const { state, command, telemetry, events } = snapshot;
  const target = telemetry.targetVelocityY;
  return (
    <section className="mission-control">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OBSERVATION / 02</span>
          <h1>
            Mission control<span>.</span>
          </h1>
          <p>The same flight. Every signal in view.</p>
        </div>
        <span className="read-only-badge">◉ READ-ONLY TELEMETRY</span>
      </div>
      <div className="control-grid">
        <section className="control-card">
          <span className="eyebrow">GUIDANCE COMPUTER</span>
          <h2>Closing the loop.</h2>
          <div className="control-readouts">
            <div>
              <label>Target descent rate</label>
              <strong>
                {target == null ? "—" : number(target, 2)} <small>m/s</small>
              </strong>
            </div>
            <div>
              <label>Sensor velocity</label>
              <strong>
                {number(telemetry.measuredVelocityY, 2)} <small>m/s</small>
              </strong>
            </div>
            <div>
              <label>Vertical error</label>
              <strong>
                {number(telemetry.verticalError, 2)} <small>m/s</small>
              </strong>
            </div>
            <div>
              <label>Throttle command</label>
              <strong>
                {number(command.throttle * 100, 1)} <small>%</small>
              </strong>
            </div>
          </div>
          <p className="muted">
            Filtered measurements → velocity PID → bounded engine command. The
            entry controller steers aerodynamic lift; the canopy is passive; powered guidance controls thrust.
          </p>
          <p>{telemetry.mode} · Seed {snapshot.seed}</p>
          <p>Storm {number((snapshot.environment?.storm??0)*100)}% · Density ×{number(snapshot.environment?.densityScale??1,2)} · Shield {number(state.shieldTemperature)} K</p>
        </section>
        <section className="control-card">
          <span className="eyebrow">GROUND TRACK</span>
          <h2>Finding the target.</h2>
          <svg
            viewBox="0 0 300 170"
            className="ground-track"
            role="img"
            aria-label="Ground track and landing target"
          >
            <defs>
              <pattern
                id="ground-grid"
                width="25"
                height="25"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M25 0H0V25"
                  fill="none"
                  stroke="#deddd4"
                  strokeWidth=".5"
                />
              </pattern>
            </defs>
            <rect width="300" height="170" fill="url(#ground-grid)" />
            <circle cx="150" cy="85" r="10" fill="#b6c7a740" stroke="#718766" />
            <path d="M144 85h12m-6-6v12" stroke="#476b51" />
            <polyline
              points={snapshot.trajectory
                .filter((_, i) => i % 12 === 0)
                .map((p) => `${150 + p.x / 5},${85 + p.z / 5}`)
                .join(" ")}
              fill="none"
              stroke="#d05e3d"
              strokeWidth="1.8"
            />
            <circle
              cx={150 + state.position.x / 5}
              cy={85 + state.position.z / 5}
              r="3.5"
              fill="#d05e3d"
            />
            <text x="10" y="160">
              125 m / grid division
            </text>
          </svg>
          <div className="xyz">
            <span>
              X <b>{number(state.position.x, 1)} m</b>
            </span>
            <span>
              Z <b>{number(state.position.z, 1)} m</b>
            </span>
            <span>
              Steering{" "}
              <b>
                {number(command.steering.x, 2)} /{" "}
                {number(command.steering.z, 2)}
              </b>
            </span>
          </div>
        </section>
      </div>
      <TrajectoryReview snapshot={snapshot}/>
      <Dashboard snapshot={snapshot} />
      {performance&&<p className="performance-readout">Measured primary view: {number(performance.fps)} FPS · {number(performance.frameMs,1)} ms/frame · {performance.drawCalls} draws · {number(performance.triangles)} triangles · render submission {number(performance.submitMs,1)} ms</p>}
      <section className="event-table">
        <div className="section-eyebrow">
          <span>FLIGHT RECORDER</span>
          <span>{events.length} EVENTS</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Mission time</th>
              <th>Event</th>
              <th>Phase</th>
              <th>Altitude</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => (
              <tr key={i}>
                <td>T+ {missionTime(event.time)}</td>
                <td>{event.message}</td>
                <td>{phaseLabels[event.phase]}</td>
                <td>{number(event.altitude)} m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
