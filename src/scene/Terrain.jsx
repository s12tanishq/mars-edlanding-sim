import React, { useId } from "react";

const CRATERS = [
  { x: 112, y: 620, rx: 64, ry: 16 },
  { x: 294, y: 674, rx: 88, ry: 19 },
  { x: 468, y: 601, rx: 39, ry: 10 },
  { x: 770, y: 653, rx: 72, ry: 17 },
  { x: 994, y: 596, rx: 47, ry: 12 },
  { x: 1124, y: 687, rx: 76, ry: 18 },
];

/** Mars sky, ground plane, and a fixed visual target marker. */
export default function Terrain({
  horizon = 525,
  targetX = 600,
  targetY = 573,
  targetLabel = "TARGET 0,0",
}) {
  const id = useId().replace(/:/g, "");

  return (
    <g aria-label="Martian terrain and landing target" role="img">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#050b18" />
          <stop offset="0.48" stopColor="#311a24" />
          <stop offset="0.78" stopColor="#9a4b35" />
          <stop offset="1" stopColor="#e39462" />
        </linearGradient>
        <linearGradient id={`${id}-ground`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8c3f2f" />
          <stop offset="0.48" stopColor="#512820" />
          <stop offset="1" stopColor="#1d1719" />
        </linearGradient>
        <radialGradient id={`${id}-target`}>
          <stop offset="0" stopColor="#c9fff1" stopOpacity="0.76" />
          <stop offset="0.45" stopColor="#4effc4" stopOpacity="0.28" />
          <stop offset="1" stopColor="#4effc4" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-target-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <rect width="1200" height="720" fill={`url(#${id}-sky)`} />

      <g fill="#d7ddd8" opacity="0.55">
        <circle cx="104" cy="93" r="1.1" />
        <circle cx="184" cy="160" r="0.8" />
        <circle cx="355" cy="71" r="1.4" />
        <circle cx="514" cy="121" r="0.75" />
        <circle cx="721" cy="64" r="1.15" />
        <circle cx="851" cy="146" r="0.85" />
        <circle cx="1018" cy="78" r="1.25" />
        <circle cx="1122" cy="197" r="0.7" />
      </g>
      <circle cx="1035" cy="132" fill="#d8a37c" opacity="0.82" r="42" />
      <circle cx="1021" cy="122" fill="#bb795d" opacity="0.35" r="9" />
      <circle cx="1054" cy="145" fill="#b56e56" opacity="0.3" r="12" />

      <path
        d={`M 0 ${horizon + 4} L 0 ${horizon - 20} L 104 ${horizon - 68} L 183 ${horizon - 31} L 285 ${horizon - 105} L 368 ${horizon - 43} L 470 ${horizon - 74} L 568 ${horizon - 28} L 672 ${horizon - 82} L 766 ${horizon - 44} L 872 ${horizon - 95} L 982 ${horizon - 46} L 1089 ${horizon - 79} L 1200 ${horizon - 29} L 1200 ${horizon + 12} Z`}
        fill="#572c2a"
        opacity="0.72"
      />
      <path
        d={`M 0 ${horizon + 12} Q 168 ${horizon - 18} 318 ${horizon + 7} T 623 ${horizon + 3} T 914 ${horizon + 10} T 1200 ${horizon - 2} L 1200 720 L 0 720 Z`}
        fill={`url(#${id}-ground)`}
      />

      {CRATERS.map((crater) => (
        <g key={`${crater.x}-${crater.y}`} opacity="0.74">
          <ellipse {...crater} fill="#28191a" />
          <path
            d={`M ${crater.x - crater.rx} ${crater.y} Q ${crater.x} ${crater.y - crater.ry * 1.3} ${crater.x + crater.rx} ${crater.y}`}
            fill="none"
            stroke="#b26144"
            strokeOpacity="0.42"
            strokeWidth="3"
          />
        </g>
      ))}

      <g transform={`translate(${targetX} ${targetY})`}>
        <ellipse fill={`url(#${id}-target)`} filter={`url(#${id}-target-glow)`} rx="63" ry="19" />
        <ellipse fill="none" rx="48" ry="13" stroke="#64ffd0" strokeDasharray="7 6" strokeWidth="2" />
        <ellipse fill="#54e7be" opacity="0.15" rx="25" ry="7" />
        <path d="M -8 0 H 8 M 0 -7 V 7" stroke="#c4fff0" strokeWidth="2" />
        <text
          fill="#a9ffe7"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="10"
          letterSpacing="1.7"
          textAnchor="middle"
          y="34"
        >
          {targetLabel}
        </text>
      </g>

      <rect y={horizon - 10} width="1200" height="42" fill="#e98055" opacity="0.06" />
    </g>
  );
}
