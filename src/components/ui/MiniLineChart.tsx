import React, { useState } from 'react';

interface DataPoint { label: string; value: number; }

interface MiniLineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  domain?: [number, number];
}

/**
 * Tiny zero-dependency SVG line chart — replaces recharts for the momentum trend.
 * ~60 lines vs 344 KB of recharts.
 */
export const MiniLineChart: React.FC<MiniLineChartProps> = ({
  data,
  height = 250,
  color = '#F37324',
  domain = [0, 100],
}) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DataPoint } | null>(null);

  if (data.length === 0) return null;

  const W = 1000; // internal SVG coordinate width (scales to container)
  const H = height;
  const PAD = { top: 16, right: 16, bottom: 28, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const [min, max] = domain;

  const px = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const py = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * chartH;

  // Build SVG path
  const points = data.map((d, i) => `${px(i)},${py(d.value)}`);
  const linePath = `M ${points.join(' L ')}`;
  // Filled area under the line
  const areaPath = `M ${px(0)},${py(min)} L ${points.join(' L ')} L ${px(data.length - 1)},${py(min)} Z`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <line key={v} x1={PAD.left} x2={W - PAD.right} y1={py(v)} y2={py(v)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#area-grad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots + hover targets */}
        {data.map((d, i) => (
          <g key={i}
            onMouseEnter={() => setTooltip({ x: px(i), y: py(d.value), point: d })}
          >
            <circle cx={px(i)} cy={py(d.value)} r="22" fill="transparent" />
            <circle cx={px(i)} cy={py(d.value)} r="5" fill={color} stroke="#11122C" strokeWidth="2" />
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text key={i} x={px(i)} y={H - 4} textAnchor="middle"
            fontSize="18" fontWeight="900" fill="rgba(255,255,255,0.2)">
            {d.label}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none px-3 py-2 bg-prussianblue border border-white/10 rounded-xl text-xs font-bold text-white shadow-xl"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <span className="text-white/40 mr-1">Day {tooltip.point.label}</span>
          <span style={{ color: '#F37324' }}>{tooltip.point.value}</span>
        </div>
      )}
    </div>
  );
};
