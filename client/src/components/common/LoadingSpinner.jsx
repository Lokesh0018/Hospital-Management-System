import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 24, text = 'Loading...', fullScreen = false }) => {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
      <Loader2 size={size} className="animate-spin" style={{ color: 'var(--color-primary-600)' }} />
      {text && <span style={{ fontSize: '0.875rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)'
      }}>
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
