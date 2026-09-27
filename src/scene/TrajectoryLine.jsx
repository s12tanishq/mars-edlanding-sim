import React, { useId } from "react";

/** Draws the already-sampled descent path in screen space. */
export default function TrajectoryLine({ points = [] }) {
  const id = useId().replace(/:/g, "");

  if (points.length < 2) return null;

  const coordinates = points.map((point) => `${point.x},${point.y}`).join(" ");
  const latest = points[points.length - 1];

  return (
    <g aria-label="Persistent descent trajectory" role="img">
      <defs>
        <linearGradient id={`${id}-trail`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#42c6ff" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#6ce5ff" stopOpacity="0.78" />
          <stop offset="1" stopColor="#f6f4bf" stopOpacity="1" />
        </linearGradient>
        <filter id={`${id}-trail-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <polyline
        fill="none"
        filter={`url(#${id}-trail-glow)`}
        opacity="0.35"
        points={coordinates}
        stroke="#4bd7ff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
      />
      <polyline
        fill="none"
        points={coordinates}
        stroke={`url(#${id}-trail)`}
        strokeDasharray="3 7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <circle cx={latest.x} cy={latest.y} fill="#e8fbff" r="4" stroke="#46d7ff" strokeWidth="2" />
    </g>
  );
}
