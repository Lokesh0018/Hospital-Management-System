import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Enterprise Breadcrumb Component
 * @param {Array} items - Array of objects { label, path } 
 */
export const Breadcrumb = ({ items }) => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      fontSize: '0.85rem', 
      color: 'var(--text-secondary)', 
      marginBottom: '0.75rem', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem',
      fontWeight: 500
    }}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span style={{ opacity: 0.5 }}>/</span>}
          {item.path ? (
            <span 
              style={{ 
                cursor: 'pointer', 
                transition: 'color var(--transition-fast)' 
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-600)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </span>
          ) : (
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Enterprise Page Header Component
 * @param {String} title
 * @param {String} subtitle
 * @param {String} icon
 * @param {ReactNode} action
 * @param {Array} breadcrumbs - passed to Breadcrumb
 */
export const PageHeader = ({ title, subtitle, icon, action, breadcrumbs }) => {
  return (
    <div className="page-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
        <h1 className="page-title">
          {icon && <span>{icon}</span>}
          {title}
        </h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {action}
        </div>
      )}
    </div>
  );
};
