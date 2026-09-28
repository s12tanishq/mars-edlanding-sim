import React from "react";

const modules = [
  {
    n: "01",
    name: "Physics",
    folder: "src/physics/",
    color: "#cb593c",
    text: "Owns ground truth. Integrates gravity, air-relative drag, commanded lift, heat flux, thrust and fuel use. Resolves terrain contact and physical phase gates.",
    files: "atmosphere · forces · equationsOfMotion · phases · disturbances",
  },
  {
    n: "02",
    name: "Control / GN&C",
    folder: "src/control/",
    color: "#74866b",
    text: "Reads noisy sensor measurements. Uses velocity PID loops, a continuous descent profile and lateral target guidance to command the engines.",
    files: "guidance · pidController · sensors",
  },
  {
    n: "03",
    name: "Scene",
    folder: "src/scene/",
    color: "#b88a4d",
    text: "Reads the published flight snapshot. Renders the lander, heat shield, canopy, actual-throttle plumes, terrain and persistent 3D trajectory.",
    files:
      "Scene · Lander · Parachute · RocketPlume · TrajectoryLine · Terrain",
  },
  {
    n: "04",
    name: "Interface & assets",
    folder: "src/ui/",
    color: "#6c8993",
    text: "Displays telemetry, recorded samples and the shared score. Provides observation controls and licensed model replacements.",
    files:
      "Dashboard · charts · MissionControlView · ScoreScreen · BriefingPanel",
  },
];

export default function BuildGuide() {
  return (
    <section className="build-guide">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SYSTEM / 03</span>
          <h1>
            Four modules. One flight<span>.</span>
          </h1>
          <p>
            The final four-module architecture behind AREION's autonomous
            flight, visualization and telemetry.
          </p>
        </div>
      </div>
      <div className="architecture">
        <span>Physics state</span>
        <b>→</b>
        <span>Noisy sensors + GN&C</span>
        <b>→</b>
        <span>Engine command</span>
        <b>→</b>
        <span>Physics step</span>
        <b>→</b>
        <span>Scene + dashboard</span>
      </div>
      <div className="module-grid">
        {modules.map((module) => (
          <article key={module.n} style={{ "--module-color": module.color }}>
            <div className="module-number">{module.n}</div>
            <h2>{module.name}</h2>
            <code>{module.folder}</code>
            <p>{module.text}</p>
            <small>{module.files}</small>
          </article>
        ))}
      </div>
      <div className="guide-columns">
        <section>
          <h2>The shared agreement</h2>
          <dl>
            <div>
              <dt>Coordinates</dt>
              <dd>Metres; +Y is up; X/Z form the ground plane.</dd>
            </div>
            <div>
              <dt>Clock</dt>
              <dd>
                Physics and Control run at 60 fixed steps per simulated second.
                Playback speed changes pacing only.
              </dd>
            </div>
            <div>
              <dt>Commands</dt>
              <dd>
                Throttle 0–1. Steering X/Z is a bounded tilt command with a
                maximum 35° engine angle.
              </dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>
                Altitude is height above local terrain; position Y uses a fixed datum.
                State now also carries heat flux, shield temperature and heat load.
              </dd>
            </div>
            <div>
              <dt>Heat / load</dt>
              <dd>
                Heat flux is W/m²; shield temperature is kelvin. G is non-gravitational
                acceleration divided by Earth standard gravity.
              </dd>
            </div>
            <div>
              <dt>Reset</dt>
              <dd>
                One run ID resets the entire mission, including seeded noise,
                controllers, charts and trajectory.
              </dd>
            </div>
          </dl>
        </section>
        <section>
          <h2>Model scope and simplifications</h2>
          <ul>
            <li>
              3 degrees of freedom: translation only. Visible attitude
              illustrates thrust direction.
            </li>
            <li>
              Approximate exponential atmosphere and selected demo vehicle
              parameters.
            </li>
            <li>
              Analytical terrain contact. Scattered rocks and individual wheels
              do not have collision geometry.
            </li>
            <li>
              Engineering heat-flux correlation and an illustrative lumped thermal
              layer. Glow is amplified false-colour heating.
            </li>
            <li>
              Instant aerodynamic configuration changes; canopy opening is a
              short visual transition.
            </li>
            <li>
              Optimized NASA rover for flight, with the original available for
              inspection. Stage, tethers and vehicle tilt remain illustrative.
            </li>
          </ul>
          <div className="guide-note">
            The fuel-contingency scenario deliberately fails. A successful
            animation is never substituted for a failed simulation.
          </div>
        </section>
      </div>
      <div className="guide-footer">
        <b>Start with the integration guide in the project’s docs folder.</b>
        <p>
          It includes the APIs, ownership rules, Control changes, test commands,
          and asset handoff checklist.
        </p>
      </div>
    </section>
  );
}
