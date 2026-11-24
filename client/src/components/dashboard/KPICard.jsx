import React, { useState, useEffect } from 'react';

export const KPICard = ({
  title,
  value,
  icon: Icon,
  iconClass = 'kpi-icon-blue',
  subtext,
  pillText,
  pillClass = 'kpi-pill-blue',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const end = value;
      const duration = 600;
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = (end - start) / steps;

      let current = start;
      const timer = setInterval(() => {
        current += increment;
        if ((increment >= 0 && current >= end) || (increment < 0 && current <= end)) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, stepTime);

      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <div className="kpi-card glass-card card-hover animate-fade-in-up" style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="kpi-card-top">
        <span className="kpi-title" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</span>
        <div className={`kpi-icon-box ${iconClass}`}>
          {Icon && <Icon size={20} />}
        </div>
      </div>

      <div className="kpi-value" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '-0.03em' }}>
        {typeof value === 'number' ? displayValue.toLocaleString() : (value ?? '--')}
      </div>

      {(subtext || pillText) && (
        <div className="kpi-card-bottom">
          {pillText && (
            <span className={`kpi-pill ${pillClass}`}>
              {pillText}
            </span>
          )}
          {subtext && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{subtext}</span>}
        </div>
      )}
    </div>
  );
};

export default KPICard;

