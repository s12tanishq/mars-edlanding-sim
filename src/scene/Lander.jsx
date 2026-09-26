import React, { useId } from "react";

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, Number(value) || 0));

/**
 * Low-poly lander placeholder.
 *
 * `heat` is treated as an already-computed visual input. This component only
 * maps it to colour, bloom, and opacity; it never derives heat from velocity.
 */
export default function Lander({
  heat = 0,
  phase = "aerobraking",
  rotation = 0,
  scale = 1,
}) {
  const id = useId().replace(/:/g, "");
  const normalizedHeat = clamp(heat, 0, 1);
  const shieldHue = 18 + normalizedHeat * 34;
  const shieldLightness = 34 + normalizedHeat * 48;
  const glowOpacity = 0.1 + normalizedHeat * 0.75;
  const isTerminal = phase === "landed" || phase === "crashed";

  return (
    <g
      aria-label="Mars lander"
      role="img"
      transform={`rotate(${rotation}) scale(${scale})`}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f5f0df" />
          <stop offset="0.48" stopColor="#9eaaad" />
          <stop offset="1" stopColor="#434d52" />
        </linearGradient>
        <radialGradient id={`${id}-shield`} cx="50%" cy="35%" r="72%">
          <stop
            offset="0"
            stopColor={`hsl(${shieldHue} 100% ${shieldLightness}%)`}
          />
          <stop offset="0.72" stopColor="#c53a16" />
          <stop offset="1" stopColor="#35120e" />
        </radialGradient>
        <filter id={`${id}-heat-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={3 + normalizedHeat * 7} />
        </filter>
        <filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#080d14" floodOpacity="0.75" />
        </filter>
      </defs>

      <ellipse
        cx="0"
        cy="24"
        fill={`hsl(${shieldHue} 100% ${shieldLightness}%)`}
        filter={`url(#${id}-heat-glow)`}
        opacity={glowOpacity}
        rx={48 + normalizedHeat * 7}
        ry={15 + normalizedHeat * 4}
      />

      <g filter={`url(#${id}-shadow)`}>
        <path d="M -27 4 L -19 -38 L 19 -38 L 27 4 Z" fill={`url(#${id}-body)`} />
        <path d="M -16 -38 L -9 -54 L 9 -54 L 16 -38 Z" fill="#d7d2bf" />
        <rect x="-7" y="-65" width="14" height="12" rx="3" fill="#879297" />
        <circle cx="0" cy="-59" r="3" fill="#9ddcf3" opacity="0.9" />

        <path d="M -23 -23 L -48 -38" stroke="#aab3b4" strokeWidth="4" />
        <path d="M 23 -23 L 48 -38" stroke="#aab3b4" strokeWidth="4" />
        <rect x="-61" y="-47" width="21" height="13" rx="2" fill="#273e61" stroke="#6f8dac" />
        <rect x="40" y="-47" width="21" height="13" rx="2" fill="#273e61" stroke="#6f8dac" />
        <path d="M -7 -53 L -7 -76 M 7 -53 L 7 -76" stroke="#bcc5c4" strokeWidth="2" />
        <path d="M -14 -76 L 14 -76" stroke="#d3dbd8" strokeWidth="2" />

        <path d="M -21 -1 L -42 32 L -51 35" fill="none" stroke="#b6b9af" strokeWidth="4" />
        <path d="M 21 -1 L 42 32 L 51 35" fill="none" stroke="#b6b9af" strokeWidth="4" />
        <path d="M -13 2 L -18 36 L -27 40" fill="none" stroke="#7e898a" strokeWidth="3" />
        <path d="M 13 2 L 18 36 L 27 40" fill="none" stroke="#7e898a" strokeWidth="3" />

        <ellipse
          cx="0"
          cy="7"
          fill={`url(#${id}-shield)`}
          rx="33"
          ry="13"
          stroke={normalizedHeat > 0.55 ? "#ffd587" : "#8d2f1a"}
          strokeWidth={1.5 + normalizedHeat * 2}
        />
        <path d="M -20 7 Q 0 16 20 7" fill="none" stroke="#ffca85" opacity={normalizedHeat * 0.8} />
      </g>

      {isTerminal && (
        <circle
          cx="0"
          cy="-18"
          fill={phase === "landed" ? "#69f0ae" : "#ff5252"}
          r="4"
        />
      )}
    </g>
  );
}
