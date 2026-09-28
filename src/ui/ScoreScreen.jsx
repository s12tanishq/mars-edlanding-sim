import React, { useEffect, useRef } from "react";
import { number, missionTime } from "./format.js";

export default function ScoreScreen({ result, time, onClose, onReplay }) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  const checks = [
    {
      label: "Touchdown velocity",
      value: number(result.verticalSpeed, 2),
      unit: "m/s",
      limit: "Below 2.5 m/s",
      pass: result.checks.verticalSpeed,
    },
    {
      label: "Distance from target",
      value: number(result.distance, 1),
      unit: "m",
      limit: "Within 50 metres",
      pass: result.checks.distance,
    },
    {
      label: "Peak flight load",
      value: number(result.peakG, 2),
      unit: "G",
      limit: "Below 5 G",
      pass: result.checks.peakG,
    },
  ];
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ time, ...result }, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "mars-edl-mission-result.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <dialog
      ref={dialog}
      className="score-dialog"
      onCancel={onClose}
      aria-labelledby="score-heading"
    >
      <button
        className="close-button"
        aria-label="Close mission result"
        onClick={onClose}
      >
        ×
      </button>
      <span className="eyebrow">MISSION DEBRIEF · T+ {missionTime(time)}</span>
      <div className={`score-mark ${result.success ? "" : "failed"}`}>
        {result.success ? "✓" : "!"}
      </div>
      <h2 id="score-heading">
        {result.success ? "Hello, Mars." : "Mission limits exceeded."}
      </h2>
      <p>
        {result.success
          ? "Autonomous landing confirmed. All three mission criteria satisfied."
          : "The recorded flight did not meet every landing criterion. Inspect the telemetry to understand why."}
      </p>
      <div className="score-checks">
        {checks.map((check) => (
          <div key={check.label}>
            <label>{check.label}</label>
            <strong>
              {check.value}
              <small> {check.unit}</small>
            </strong>
            <span className={check.pass ? "green" : "danger"}>
              {check.pass ? "✓ PASS" : "× FAIL"} <small>{check.limit}</small>
            </span>
          </div>
        ))}
      </div>
      <div className="score-fuel">
        Propellant remaining <b>{number(result.fuelRemaining, 1)} kg</b>
      </div>
      <p>Fuel used: {number(result.fuelUsed,1)} kg · Reserve: {number(result.fuelEfficiency,1)}%<br/>Efficiency grade: {result.efficiencyGrade}</p>
      <div className="score-actions">
        <button onClick={onReplay} className="primary-button">
          Replay mission ↻
        </button>
        <button onClick={onClose} className="secondary-button">
          Inspect landing site
        </button>
        <button onClick={download} className="text-button">
          Export result ↓
        </button>
      </div>
    </dialog>
  );
}
