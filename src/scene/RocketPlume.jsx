import React, { useId, useMemo } from "react";

const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));

/**
 * Lightweight exhaust effect. Particle count, brightness, width, and travel
 * all scale directly from the throttle supplied by Control.
 */
export default function RocketPlume({ active, throttle = 0 }) {
  const id = useId().replace(/:/g, "");
  const level = clamp01(throttle);
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        delay: -((index * 0.071) % 0.8),
        drift: ((index * 17) % 13) - 6,
        radius: 1.4 + ((index * 7) % 5) * 0.55,
      })),
    [],
  );

  if (!active || level <= 0.01) return null;

  const plumeLength = 28 + level * 72;
  const plumeWidth = 5 + level * 10;
  const visibleParticles = Math.ceil(5 + level * 13);
  const duration = 0.85 - level * 0.35;

  return (
    <g aria-label={`Retro rockets at ${Math.round(level * 100)} percent throttle`} role="img">
      <defs>
        <linearGradient id={`${id}-flame`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fef9d8" stopOpacity="0.98" />
          <stop offset="0.22" stopColor="#74dcff" stopOpacity="0.92" />
          <stop offset="0.58" stopColor="#ff8b34" stopOpacity={0.75 + level * 0.2} />
          <stop offset="1" stopColor="#d73822" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-plume-glow`} x="-120%" y="-30%" width="340%" height="180%">
          <feGaussianBlur stdDeviation={2 + level * 3} />
        </filter>
      </defs>

      {[-19, 19].map((engineX) => (
        <g key={engineX} transform={`translate(${engineX} 18)`}>
          <path
            d={`M ${-plumeWidth / 2} 0 Q 0 ${plumeLength * 0.62} 0 ${plumeLength} Q 0 ${plumeLength * 0.62} ${plumeWidth / 2} 0 Z`}
            fill={`url(#${id}-flame)`}
            filter={`url(#${id}-plume-glow)`}
            opacity={0.44 + level * 0.45}
          />
          <path
            d={`M ${-plumeWidth * 0.3} 0 Q 0 ${plumeLength * 0.55} 0 ${plumeLength * 0.82} Q 0 ${plumeLength * 0.55} ${plumeWidth * 0.3} 0 Z`}
            fill={`url(#${id}-flame)`}
          />
        </g>
      ))}

      {particles.slice(0, visibleParticles).map((particle, index) => {
        const engineX = index % 2 === 0 ? -19 : 19;
        return (
          <circle
            cx={engineX}
            cy="25"
            fill={index % 3 === 0 ? "#ffe9a8" : "#e8592f"}
            key={`${engineX}-${index}`}
            opacity={0.3 + level * 0.55}
            r={particle.radius}
          >
            <animate
              attributeName="cy"
              begin={`${particle.delay}s`}
              dur={`${duration}s`}
              from="25"
              repeatCount="indefinite"
              to={24 + plumeLength}
            />
            <animate
              attributeName="cx"
              begin={`${particle.delay}s`}
              dur={`${duration}s`}
              from={engineX}
              repeatCount="indefinite"
              to={engineX + particle.drift * level}
            />
            <animate
              attributeName="opacity"
              begin={`${particle.delay}s`}
              dur={`${duration}s`}
              from={0.65 + level * 0.25}
              repeatCount="indefinite"
              to="0"
            />
          </circle>
        );
      })}
    </g>
  );
}
