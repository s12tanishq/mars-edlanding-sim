import React, { useEffect, useMemo, useRef, useState } from "react";
import Lander from "./Lander";
import Parachute from "./Parachute";
import RocketPlume from "./RocketPlume";
import Terrain from "./Terrain";
import TrajectoryLine from "./TrajectoryLine";

const VIEWBOX_WIDTH = 1200;
const GROUND_Y = 530;
const DEFAULT_TARGET = Object.freeze({ x: 0, y: 0, z: 0 });
const VALID_PHASES = new Set([
  "aerobraking",
  "parachute",
  "poweredDescent",
  "landed",
  "crashed",
]);

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const labelForPhase = (phase) =>
  ({
    aerobraking: "AEROBRAKING",
    parachute: "PARACHUTE",
    poweredDescent: "POWERED DESCENT",
    landed: "TOUCHDOWN",
    crashed: "MISSION LOST",
  })[phase] || "AWAITING DATA";

function readSimulationState(source) {
  const position = source?.position || {};
  const velocity = source?.velocity || {};
  const incomingPhase = source?.phase;

  return {
    position: {
      x: asNumber(position.x),
      y: asNumber(position.y),
      z: asNumber(position.z),
    },
    velocity: {
      x: asNumber(velocity.x),
      y: asNumber(velocity.y),
      z: asNumber(velocity.z),
    },
    altitude: asNumber(source?.altitude),
    speed: asNumber(source?.speed),
    fuel: asNumber(source?.fuel),
    heat: asNumber(source?.heat),
    gForce: asNumber(source?.gForce),
    phase: VALID_PHASES.has(incomingPhase) ? incomingPhase : "unknown",
  };
}

/**
 * Responsive placeholder scene for the Mars EDL simulation.
 *
 * No flight values are calculated here. The small calculations below are only
 * screen projection, input guarding, and trail sampling for rendering.
 *
 * `throttle` is deliberately a separate prop until Control confirms where it
 * will live. This avoids silently inventing a field on `simulationState`.
 */
export default function Scene({
  simulationState,
  throttle = null,
  heatScaleMax = 1,
  landingTarget = DEFAULT_TARGET,
  trajectoryKey = "default-run",
  trailLimit = 2400,
  className,
  style,
}) {
  const state = readSimulationState(simulationState);
  const [trail, setTrail] = useState([]);
  const trajectoryKeyRef = useRef(trajectoryKey);

  const positionX = state.position.x;
  const positionY = state.position.y;
  const positionZ = state.position.z;
  const safeTrailLimit = clamp(Math.floor(asNumber(trailLimit, 2400)), 100, 10000);

  useEffect(() => {
    const nextPoint = { x: positionX, y: positionY, z: positionZ };

    setTrail((currentTrail) => {
      if (trajectoryKeyRef.current !== trajectoryKey) {
        trajectoryKeyRef.current = trajectoryKey;
        return [nextPoint];
      }

      const lastPoint = currentTrail[currentTrail.length - 1];
      if (lastPoint) {
        const dx = nextPoint.x - lastPoint.x;
        const dy = nextPoint.y - lastPoint.y;
        const dz = nextPoint.z - lastPoint.z;

        // Skip sub-pixel-scale movement so long simulations remain smooth.
        if (dx * dx + dy * dy + dz * dz < 0.0625) return currentTrail;
      }

      const nextTrail = [...currentTrail, nextPoint];
      if (nextTrail.length <= safeTrailLimit) return nextTrail;

      // Decimation retains the complete path from entry to landing rather than
      // dropping the oldest part when the render-friendly point cap is reached.
      return nextTrail.filter(
        (_, index) => index === 0 || index === nextTrail.length - 1 || index % 2 === 0,
      );
    });
  }, [positionX, positionY, positionZ, safeTrailLimit, trajectoryKey]);

  const target = {
    x: asNumber(landingTarget?.x),
    y: asNumber(landingTarget?.y),
    z: asNumber(landingTarget?.z),
  };
  const currentPoint = state.position;
  const renderPoints = trail.length ? trail : [currentPoint];

  const projectPoint = useMemo(() => {
    const allPoints = [...renderPoints, currentPoint];
    const maximumHeight = Math.max(
      100,
      ...allPoints.map((point) => Math.max(0, point.y - target.y)),
    );
    const horizontalValues = allPoints.map(
      (point) => point.x - target.x + (point.z - target.z) * 0.34,
    );
    const horizontalExtent = Math.max(60, ...horizontalValues.map(Math.abs));
    const horizontalScale = 390 / horizontalExtent;

    return (point) => ({
      x: clamp(
        VIEWBOX_WIDTH / 2 +
          (point.x - target.x + (point.z - target.z) * 0.34) * horizontalScale,
        70,
        VIEWBOX_WIDTH - 70,
      ),
      y: clamp(
        GROUND_Y - (Math.max(0, point.y - target.y) / maximumHeight) * 390,
        105,
        GROUND_Y,
      ),
    });
  }, [renderPoints, currentPoint, target.x, target.y, target.z]);

  const projectedTrail = renderPoints.map(projectPoint);
  const landerPosition = projectPoint(currentPoint);
  const heatDenominator = Math.max(0.0001, asNumber(heatScaleMax, 1));
  const visualHeat = clamp(state.heat / heatDenominator, 0, 1);
  const throttleAvailable = throttle !== null && Number.isFinite(Number(throttle));
  const throttleLevel = throttleAvailable ? clamp(Number(throttle), 0, 1) : 0;
  const landerTilt = clamp((state.velocity.x + state.velocity.z * 0.34) * 0.18, -13, 13);
  const isPoweredDescent = state.phase === "poweredDescent";
  const isTerminal = state.phase === "landed" || state.phase === "crashed";
  const statusColor = state.phase === "crashed" ? "#ff6a62" : "#65f5c1";

  const wrapperStyle = {
    position: "relative",
    width: "100%",
    minHeight: 420,
    overflow: "hidden",
    borderRadius: 18,
    background: "#050b18",
    boxShadow: "0 24px 70px rgba(2, 6, 18, 0.48)",
    ...style,
  };

  return (
    <div className={className} style={wrapperStyle}>
      <svg
        aria-label={`${labelForPhase(state.phase)}. Altitude ${Math.round(state.altitude)} metres. Speed ${Math.round(state.speed)} metres per second.`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        style={{ display: "block", width: "100%", height: "100%", minHeight: 420 }}
        viewBox="0 0 1200 720"
      >
        <Terrain targetLabel={`TARGET ${target.x.toFixed(0)},${target.z.toFixed(0)}`} />

        <TrajectoryLine points={projectedTrail} />

        <g transform={`translate(${landerPosition.x} ${landerPosition.y})`}>
          <Parachute active={state.phase === "parachute"} />
          <RocketPlume active={isPoweredDescent} throttle={throttleLevel} />
          <Lander heat={visualHeat} phase={state.phase} rotation={landerTilt} />
        </g>

        <g transform="translate(38 36)">
          <rect width="327" height="86" rx="13" fill="#07111f" fillOpacity="0.78" stroke="#7bd4e7" strokeOpacity="0.2" />
          <circle cx="24" cy="24" fill={statusColor} r="5" />
          <text x="39" y="29" fill="#f1f7f6" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="16" fontWeight="700" letterSpacing="1.8">
            {labelForPhase(state.phase)}
          </text>
          <text x="18" y="61" fill="#8fa9b7" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="11" letterSpacing="1.3">
            ALT {Math.round(state.altitude).toLocaleString()} M
          </text>
          <text x="137" y="61" fill="#8fa9b7" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="11" letterSpacing="1.3">
            SPD {Math.round(state.speed).toLocaleString()} M/S
          </text>
          <text x="265" y="61" fill="#8fa9b7" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="11" letterSpacing="1.3">
            {state.gForce.toFixed(1)}G
          </text>
        </g>

        <g transform="translate(976 37)">
          <text fill="#b4c8cf" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10" letterSpacing="1.6">
            HEAT LOAD
          </text>
          <rect y="17" width="184" height="7" rx="3.5" fill="#111d29" stroke="#ffffff" strokeOpacity="0.12" />
          <rect y="17" width={184 * visualHeat} height="7" rx="3.5" fill={visualHeat > 0.72 ? "#fff0bb" : "#ff6d3c"} />
          <text y="43" fill="#879da8" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10">
            INPUT {state.heat.toFixed(2)}
          </text>
        </g>

        {isPoweredDescent && (
          <g transform="translate(976 102)">
            <text fill="#b4c8cf" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10" letterSpacing="1.6">
              RETRO THROTTLE
            </text>
            <rect y="17" width="184" height="7" rx="3.5" fill="#111d29" stroke="#ffffff" strokeOpacity="0.12" />
            <rect y="17" width={184 * throttleLevel} height="7" rx="3.5" fill="#5fddff" />
            <text y="43" fill={throttleAvailable ? "#879da8" : "#ffc36b"} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10">
              {throttleAvailable ? `${Math.round(throttleLevel * 100)}%` : "CONNECT CONTROL INPUT"}
            </text>
          </g>
        )}

        <g transform="translate(38 674)">
          <text fill="#829aa6" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10" letterSpacing="1.2">
            POS X {state.position.x.toFixed(1)}  Y {state.position.y.toFixed(1)}  Z {state.position.z.toFixed(1)}
          </text>
        </g>

        {isTerminal && (
          <g transform="translate(410 288)">
            <rect width="380" height="92" rx="16" fill="#07111f" fillOpacity="0.86" stroke={statusColor} strokeOpacity="0.6" />
            <text x="190" y="40" fill={statusColor} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="21" fontWeight="800" letterSpacing="3" textAnchor="middle">
              {labelForPhase(state.phase)}
            </text>
            <text x="190" y="66" fill="#a9bdc5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="11" letterSpacing="1.2" textAnchor="middle">
              FINAL SPEED {state.speed.toFixed(2)} M/S
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
