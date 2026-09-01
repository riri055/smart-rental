import React, { useState } from 'react';

// ==========================================
// 1. ENTERPRISE SINGLE / GROUPED BAR CHART
// ==========================================
export interface BarItem {
  label: string;
  value?: number;
  secondaryValue?: number;
  valueLabel?: string;
  secondaryLabel?: string;
  sublabel?: string;
}

export const EnterpriseBarChart: React.FC<{
  data: BarItem[];
  height?: number;
  unit?: string;
  maxValue?: number;
  primaryColor?: string;
  secondaryColor?: string;
  primaryName?: string;
  secondaryName?: string;
}> = ({
  data,
  height = 220,
  unit = '%',
  maxValue,
  primaryColor = '#F7C83E',
  secondaryColor = '#242424',
  primaryName = 'Value',
  secondaryName
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const max = maxValue || Math.max(
    ...data.map((d) => Math.max(d.value || 0, d.secondaryValue || 0)),
    100
  );

  const isGrouped = secondaryName !== undefined;
  const paddingX = 40;
  const paddingBottom = 30;
  const paddingTop = 20;
  const chartWidth = 500;
  const chartHeight = height - paddingBottom - paddingTop;

  return (
    <div className="w-full relative select-none">
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="w-full h-auto overflow-visible font-mono text-[10px]"
      >
        {/* Horizontal Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = paddingTop + chartHeight * (1 - pct);
          const val = Math.round(max * pct);
          return (
            <g key={pct}>
              <line
                x1={paddingX}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#EAE5D8"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={paddingX - 6}
                y={y + 3}
                textAnchor="end"
                fill="#78756E"
                className="font-mono text-[9px]"
              >
                {val}{unit}
              </text>
            </g>
          );
        })}

        {/* Baseline Axis */}
        <line
          x1={paddingX}
          y1={paddingTop + chartHeight}
          x2={chartWidth}
          y2={paddingTop + chartHeight}
          stroke="#242424"
          strokeWidth={1.5}
        />

        {/* Bars */}
        {data.map((item, idx) => {
          const totalSlots = data.length;
          const availableWidth = chartWidth - paddingX;
          const slotWidth = availableWidth / totalSlots;
          const barWidth = isGrouped ? Math.min(22, slotWidth * 0.35) : Math.min(42, slotWidth * 0.55);
          const centerX = paddingX + slotWidth * idx + slotWidth / 2;

          const val1 = item.value || 0;
          const bar1Height = (val1 / max) * chartHeight;
          const bar1Y = paddingTop + chartHeight - bar1Height;

          const val2 = item.secondaryValue || 0;
          const bar2Height = (val2 / max) * chartHeight;
          const bar2Y = paddingTop + chartHeight - bar2Height;

          const isHovered = hoveredIndex === idx;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              {/* Invisible trigger area */}
              <rect
                x={paddingX + slotWidth * idx}
                y={paddingTop}
                width={slotWidth}
                height={chartHeight}
                fill="transparent"
              />

              {isGrouped ? (
                <>
                  {/* Primary Bar */}
                  <rect
                    x={centerX - barWidth - 2}
                    y={bar1Y}
                    width={barWidth}
                    height={Math.max(2, bar1Height)}
                    fill={primaryColor}
                    stroke="#242424"
                    strokeWidth={1.2}
                    rx={2}
                    className="transition-all duration-150"
                    opacity={hoveredIndex === null || isHovered ? 1 : 0.6}
                  />

                  {/* Secondary Bar */}
                  <rect
                    x={centerX + 2}
                    y={bar2Y}
                    width={barWidth}
                    height={Math.max(2, bar2Height)}
                    fill={secondaryColor}
                    stroke="#242424"
                    strokeWidth={1.2}
                    rx={2}
                    className="transition-all duration-150"
                    opacity={hoveredIndex === null || isHovered ? 1 : 0.6}
                  />
                </>
              ) : (
                /* Single Bar */
                <rect
                  x={centerX - barWidth / 2}
                  y={bar1Y}
                  width={barWidth}
                  height={Math.max(2, bar1Height)}
                  fill={primaryColor}
                  stroke="#242424"
                  strokeWidth={1.5}
                  rx={3}
                  className="transition-all duration-150"
                  opacity={hoveredIndex === null || isHovered ? 1 : 0.7}
                />
              )}

              {/* X Axis Label */}
              <text
                x={centerX}
                y={paddingTop + chartHeight + 16}
                textAnchor="middle"
                fill={isHovered ? '#242424' : '#605D57'}
                fontWeight={isHovered ? 700 : 500}
                className="text-[10px] font-sans"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating HTML Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="absolute z-20 pointer-events-none bg-[#FFFDF7] border border-[#242424] p-2 rounded-md shadow-[3px_3px_0px_rgba(36,36,36,0.2)] text-xs text-[#242424]"
          style={{
            left: `${((hoveredIndex + 0.5) / data.length) * 80 + 10}%`,
            top: '10px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-bold border-b border-[#242424]/10 pb-1 mb-1 font-mono">
            {data[hoveredIndex].label}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: primaryColor }} />
            <span>{primaryName}:</span>
            <strong className="font-mono">{data[hoveredIndex].value}{unit}</strong>
          </div>
          {isGrouped && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: secondaryColor }} />
              <span>{secondaryName}:</span>
              <strong className="font-mono">{data[hoveredIndex].secondaryValue}{unit}</strong>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {isGrouped && (
        <div className="flex items-center justify-center gap-4 text-xs mt-2 text-[#78756E]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-[#242424]" style={{ backgroundColor: primaryColor }} />
            <span className="font-medium text-[#242424]">{primaryName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-[#242424]" style={{ backgroundColor: secondaryColor }} />
            <span className="font-medium text-[#242424]">{secondaryName}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. ENTERPRISE DONUT CHART
// ==========================================
export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export const EnterpriseDonutChart: React.FC<{
  data: DonutSlice[];
  height?: number;
  centerTitle?: string;
  centerValue?: string | number;
}> = ({ data, height = 180, centerTitle = 'Total', centerValue }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          {data.map((slice, idx) => {
            const percent = slice.value / total;
            const strokeDashoffset = circumference * (1 - percent);
            const rotation = accumulatedPercent * 360;
            accumulatedPercent += percent;

            const isHovered = hoveredIndex === idx;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-[#78756E] tracking-wider font-mono">
            {hoveredIndex !== null ? data[hoveredIndex].label : centerTitle}
          </span>
          <span className="text-xl font-bold font-mono text-[#242424]">
            {hoveredIndex !== null ? data[hoveredIndex].value : centerValue || total}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. ENTERPRISE SMOOTH AREA / TREND CHART
// ==========================================
export interface AreaPoint {
  label: string;
  operating: number;
  idle: number;
}

export const EnterpriseAreaChart: React.FC<{
  data: AreaPoint[];
  height?: number;
}> = ({ data, height = 220 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = Math.max(...data.map((d) => Math.max(d.operating, d.idle)), 14);
  const chartWidth = 500;
  const paddingX = 35;
  const paddingTop = 20;
  const paddingBottom = 30;
  const chartHeight = height - paddingTop - paddingBottom;

  const pointsCount = data.length;
  const stepX = (chartWidth - paddingX - 15) / Math.max(1, pointsCount - 1);

  // Generate SVG Path
  const generatePath = (key: 'operating' | 'idle') => {
    return data
      .map((d, i) => {
        const x = paddingX + i * stepX;
        const y = paddingTop + chartHeight - (d[key] / maxVal) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const operatingPath = generatePath('operating');
  const idlePath = generatePath('idle');

  const operatingArea = `${operatingPath} L ${paddingX + (pointsCount - 1) * stepX} ${
    paddingTop + chartHeight
  } L ${paddingX} ${paddingTop + chartHeight} Z`;

  const idleArea = `${idlePath} L ${paddingX + (pointsCount - 1) * stepX} ${
    paddingTop + chartHeight
  } L ${paddingX} ${paddingTop + chartHeight} Z`;

  return (
    <div className="w-full relative select-none">
      <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full h-auto overflow-visible font-mono text-[10px]">
        {/* Gridlines */}
        {[0, 0.33, 0.66, 1].map((pct) => {
          const y = paddingTop + chartHeight * (1 - pct);
          const val = Math.round(maxVal * pct);
          return (
            <g key={pct}>
              <line x1={paddingX} y1={y} x2={chartWidth} y2={y} stroke="#EAE5D8" strokeDasharray="3 3" />
              <text x={paddingX - 6} y={y + 3} textAnchor="end" fill="#78756E" className="text-[9px]">
                {val}h
              </text>
            </g>
          );
        })}

        {/* Operating Area */}
        <path d={operatingArea} fill="#242424" fillOpacity={0.15} />
        <path d={operatingPath} fill="none" stroke="#242424" strokeWidth={2.5} />

        {/* Idle Area */}
        <path d={idleArea} fill="#C62828" fillOpacity={0.12} />
        <path d={idlePath} fill="none" stroke="#C62828" strokeWidth={2} strokeDasharray="4 2" />

        {/* Interactive Point circles & X labels */}
        {data.map((d, i) => {
          const x = paddingX + i * stepX;
          const yOp = paddingTop + chartHeight - (d.operating / maxVal) * chartHeight;
          const yId = paddingTop + chartHeight - (d.idle / maxVal) * chartHeight;
          const isHovered = hoveredIndex === i;

          return (
            <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
              {/* Trigger slice */}
              <rect x={x - stepX / 2} y={paddingTop} width={stepX} height={chartHeight} fill="transparent" />

              {/* Guide vertical bar on hover */}
              {isHovered && (
                <line x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartHeight} stroke="#242424" strokeWidth={1} strokeDasharray="2 2" />
              )}

              {/* Operating Dot */}
              <circle cx={x} cy={yOp} r={isHovered ? 4.5 : 3} fill="#242424" stroke="#FFFDF7" strokeWidth={1.5} />

              {/* Idle Dot */}
              <circle cx={x} cy={yId} r={isHovered ? 4.5 : 3} fill="#C62828" stroke="#FFFDF7" strokeWidth={1.5} />

              {/* X Label */}
              <text x={x} y={paddingTop + chartHeight + 16} textAnchor="middle" fill={isHovered ? '#242424' : '#78756E'} fontWeight={isHovered ? 700 : 400}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="absolute z-20 pointer-events-none bg-[#FFFDF7] border border-[#242424] p-2 rounded-md shadow-[3px_3px_0px_rgba(36,36,36,0.2)] text-xs text-[#242424]"
          style={{
            left: `${((hoveredIndex + 0.5) / data.length) * 80 + 10}%`,
            top: '5px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-bold border-b border-[#242424]/10 pb-1 mb-1 font-mono">
            Date: {data[hoveredIndex].label}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#242424]" />
            <span>Operating:</span>
            <strong className="font-mono">{data[hoveredIndex].operating} hrs</strong>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C62828]" />
            <span>Idle Time:</span>
            <strong className="font-mono text-[#C62828]">{data[hoveredIndex].idle} hrs</strong>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs mt-2 text-[#78756E]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-[#242424] inline-block" />
          <span className="font-semibold text-[#242424]">Productive Run Time</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-[#C62828] border-b border-dashed inline-block" />
          <span className="font-semibold text-[#C62828]">Idle Time Overhead</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. ENTERPRISE HORIZONTAL BAR CHART
// ==========================================
export interface HorizontalBarItem {
  label: string;
  name: string;
  value: number;
  color?: string;
}

export const EnterpriseHorizontalBarChart: React.FC<{
  data: HorizontalBarItem[];
  maxValue?: number;
  unit?: string;
}> = ({ data, maxValue = 100, unit = '%' }) => {
  return (
    <div className="space-y-3 font-mono">
      {data.map((item, idx) => {
        const pct = Math.min(100, (item.value / maxValue) * 100);
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#242424] font-mono">{item.label} · {item.name}</span>
              <span className="font-bold text-[#242424]">{item.value}{unit}</span>
            </div>
            <div className="w-full bg-[#EAE5D8] h-3 rounded-md overflow-hidden border border-[#242424]/10">
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: item.color || '#2E7D32'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
