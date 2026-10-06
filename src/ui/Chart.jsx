import React, { useId, useMemo } from "react";
import { number } from "./format.js";

// SVG charts avoid another charting dependency. Inputs are recorded sim-time samples.
export default function Chart({
  title,
  subtitle,
  data,
  xKey,
  yKey,
  color = "#cb5838",
  unit,
  xUnit = "s",
  maxY,
  current,
  id,
}) {
  const uid = useId().replaceAll(":", "");
  const W = 340,
    H = 104,
    left = 42,
    top = 9,
    right = 8,
    bottom = 23;
  const {xMax,yMax,line,area,sampled,project}=useMemo(()=>{
  const xMax = Math.max(1, ...data.map((p) => p[xKey]));
  const yMax = Math.max(maxY || 1, ...data.map((p) => p[yKey]));
  const step = Math.max(1, Math.floor(data.length / 250));
  const sampled = data.filter(
    (_, i) => i % step === 0 || i === data.length - 1,
  );
  const project = (p) =>
    `${left + (p[xKey] / xMax) * (W - left - right)},${H - bottom - (p[yKey] / yMax) * (H - top - bottom)}`;
  const line = sampled.map(project).join(" ");
  const area =
    sampled.length > 1
      ? `${left},${H - bottom} ${line} ${left + (sampled.at(-1)[xKey] / xMax) * (W - left - right)},${H - bottom}`
      : "";
  return {xMax,yMax,line,area,sampled,project};
  },[data,xKey,yKey,maxY]);
  return (
    <section className="chart-card" aria-label={title} id={id}>
      <div className="chart-title">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span style={{ color }}>
          {number(current, unit === "%" ? 0 : 1)} <small>{unit}</small>
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title}, latest ${number(current, 1)} ${unit}`}
      >
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".17" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={left}
              x2={W - right}
              y1={H - bottom - f * (H - top - bottom)}
              y2={H - bottom - f * (H - top - bottom)}
              stroke="#dfdfd6"
              strokeDasharray="3 4"
            />
            <text
              x={left - 8}
              y={H - bottom - f * (H - top - bottom) + 3}
              textAnchor="end"
            >
              {number(yMax * f, yMax < 10 ? 1 : 0)}
            </text>
          </g>
        ))}
        {area && <polygon points={area} fill={`url(#${uid})`} />}
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {sampled.length > 1 && (
          <circle
            cx={project(sampled.at(-1)).split(",")[0]}
            cy={project(sampled.at(-1)).split(",")[1]}
            r="3"
            fill={color}
          />
        )}
        <text x={left} y={H - 4}>
          0
        </text>
        <text x={W - right} y={H - 4} textAnchor="end">
          {number(xMax)} {xUnit}
        </text>
      </svg>
    </section>
  );
}
