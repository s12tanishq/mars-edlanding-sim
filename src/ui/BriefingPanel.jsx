import React from "react";
export default function BriefingPanel({ onBegin }) {
  return (
    <div className="briefing">
      <span className="eyebrow">MISSION BRIEF / 001</span>
      <h2>
        One chance.
        <br />
        Three phases.
        <br />
        <em>A softer landing.</em>
      </h2>
      <p>
        From hypersonic entry to the Martian surface. Observe the autonomous
        guidance system bring the lander home.
      </p>
      <button className="primary-button" onClick={onBegin}>
        Begin entry <span>↗</span>
      </button>
      <small>35 km altitude · 1,300 m/s · autonomous flight</small>
    </div>
  );
}
