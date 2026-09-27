// src/ui/BriefingPanel.jsx
//
// BriefingPanel shows the mission briefing before the simulation starts.
// It's a static, read-only screen — no live data yet, since the descent
// hasn't begun. Its job is to make the mission and lander limits clear
// to someone with zero domain knowledge (a judging requirement).

import React from "react";

// These are placeholder values until the Physics/shared team confirms
// where target coordinates and structural limits actually live
// (likely src/shared/constants.js). Swap these out once that's confirmed.
const MISSION_INFO = {
  targetCoordinates: { lat: -14.5684, lon: 175.472 }, // Jezero Crater-style example
  landingRadius: 50, // meters, success threshold
  maxSafeVerticalSpeed: 2.5, // m/s, success threshold
  maxSafeGForce: 5, // G, success threshold
};

function BriefingPanel({ onBeginDescent }) {
  return (
    <div className="briefing-panel">
      <h1>Mission Briefing: Mars EDL Sequence</h1>

      <p>
        You are about to observe an autonomous Entry-Descent-Landing (EDL)
        sequence. This is <strong>not</strong> a game — you cannot control
        the lander. An onboard guidance system will fly the full descent
        automatically, reacting in real time to atmospheric drag, wind
        shear, and sensor noise.
      </p>

      <h2>Mission Phases</h2>
      <ol>
        <li>
          <strong>Hypersonic Aero-braking</strong> — the lander uses
          atmospheric drag to slow down. The heat shield will glow based on
          friction and speed.
        </li>
        <li>
          <strong>Parachute Deployment</strong> — triggers automatically once
          speed and altitude cross a safe threshold.
        </li>
        <li>
          <strong>Powered Descent</strong> — retro-rockets fire to bring the
          lander to a controlled, soft landing.
        </li>
      </ol>

      <h2>Target Landing Site</h2>
      <p>
        Latitude: {MISSION_INFO.targetCoordinates.lat}°, Longitude:{" "}
        {MISSION_INFO.targetCoordinates.lon}°
      </p>

      <h2>Success Criteria</h2>
      <ul>
        <li>
          Land within {MISSION_INFO.landingRadius} meters of the target site
        </li>
        <li>
          Touch down at less than {MISSION_INFO.maxSafeVerticalSpeed} m/s
          vertical speed
        </li>
        <li>
          Stay under {MISSION_INFO.maxSafeGForce}G of force throughout the
          descent
        </li>
      </ul>

      <button className="begin-descent-button" onClick={onBeginDescent}>
        Begin Descent
      </button>
    </div>
  );
}

export default BriefingPanel;