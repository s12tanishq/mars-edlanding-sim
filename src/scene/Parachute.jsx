import React, { useId } from "react";

/**
 * Phase-driven parachute placeholder. Mounting this component starts a short
 * opening transition; visibility itself remains controlled by `active`.
 */
export default function Parachute({ active, lineLength = 105 }) {
  const id = useId().replace(/:/g, "");

  if (!active) return null;

  return (
    <g aria-label="Deployed parachute" role="img">
      <defs>
        <linearGradient id={`${id}-canopy`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff6df" />
          <stop offset="0.72" stopColor="#e35b3e" />
          <stop offset="1" stopColor="#8e2f27" />
        </linearGradient>
        <filter id={`${id}-canopy-shadow`} x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#090e17" floodOpacity="0.55" />
        </filter>
      </defs>

      <g filter={`url(#${id}-canopy-shadow)`}>
        <path
          d="M -106 -119 C -82 -184, 82 -184, 106 -119 C 68 -136, 35 -118, 0 -128 C -35 -118, -68 -136, -106 -119 Z"
          fill={`url(#${id}-canopy)`}
          stroke="#ffd9b7"
          strokeWidth="2"
        />
        <path d="M -69 -131 C -51 -174 -21 -177 0 -128" fill="#f7d6b6" opacity="0.8" />
        <path d="M 69 -131 C 51 -174 21 -177 0 -128" fill="#b33e35" opacity="0.72" />
        <path d="M 0 -128 L 0 -169" stroke="#fff0dc" strokeWidth="2" opacity="0.65" />
        <animateTransform
          attributeName="transform"
          dur="0.75s"
          from="scale(0.16 0.25)"
          to="scale(1 1)"
          type="scale"
          fill="freeze"
        />
      </g>

      {[-92, -48, 0, 48, 92].map((canopyX, index) => {
        const anchorX = (index - 2) * 8;
        return (
          <path
            d={`M ${canopyX} -121 Q ${canopyX * 0.48} ${-72 + index * 2} ${anchorX} ${-18 + lineLength - 105}`}
            fill="none"
            key={canopyX}
            stroke="#e9e3d2"
            strokeOpacity="0.82"
            strokeWidth="1.35"
          />
        );
      })}
    </g>
  );
}
