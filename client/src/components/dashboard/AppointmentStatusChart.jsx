import React from 'react';
import { Calendar } from 'lucide-react';

const STATUS_CONFIG = {
  COMPLETED: {
    label: 'Completed',
    color: '#10b981', // Emerald
    bgColor: '#ecfdf5',
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: '#0284c7', // Sky Blue
    bgColor: '#f0f9ff',
  },
  PENDING: {
    label: 'Pending',
    color: '#f59e0b', // Amber
    bgColor: '#fffbeb',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#f43f5e', // Rose
    bgColor: '#fff1f2',
  },
};

export const AppointmentStatusChart = ({ data }) => {
  const total = data?.totalAppointments || 0;
  const breakdown = data?.breakdown || {
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  // SVG Donut calculation constants
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2; // 70
  const circumference = 2 * Math.PI * radius; // ~439.82

  let accumulatedPercent = 0;

  const slices = Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
    const count = breakdown[statusKey] || 0;
    const ratio = total > 0 ? count / total : 0;
    const strokeDasharray = `${ratio * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += ratio;

    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';

    return {
      statusKey,
      label: config.label,
      color: config.color,
      count,
      percentage,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div className="analytics-card-title">
          <Calendar size={18} color="var(--color-primary-600)" />
          <span>Appointment Status Distribution</span>
        </div>
        <span className="analytics-card-badge">Total: {total}</span>
      </div>

      <div className="donut-chart-wrapper">
        {/* SVG Donut Circle */}
        <div className="donut-svg-container">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background Empty Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {/* Segment Slices */}
            {total > 0 &&
              slices.map((slice) =>
                slice.count > 0 ? (
                  <circle
                    key={slice.statusKey}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                ) : null
              )}
          </svg>

          {/* Central Metric Counter */}
          <div className="donut-center-text">
            <div className="donut-center-count">{total}</div>
            <div className="donut-center-label">Bookings</div>
          </div>
        </div>

        {/* Legend & Breakdown List */}
        <div className="donut-legend">
          {slices.map((slice) => (
            <div key={slice.statusKey} className="legend-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="legend-color-dot" style={{ backgroundColor: slice.color }} />
                <span style={{ fontWeight: 600, color: 'var(--color-slate-700)' }}>{slice.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-slate-900)' }}>{slice.count}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>({slice.percentage})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppointmentStatusChart;
