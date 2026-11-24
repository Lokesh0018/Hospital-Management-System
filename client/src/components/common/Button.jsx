import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon = null,
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          background: 'var(--color-slate-100)',
          color: 'var(--color-slate-700)',
          border: '1px solid var(--color-slate-200)',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--color-primary-600)',
          border: '1.5px solid var(--color-primary-600)',
        };
      case 'danger':
        return {
          background: 'var(--color-accent-rose)',
          color: 'white',
          border: 'none',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--color-slate-600)',
          border: 'none',
        };
      case 'primary':
      default:
        return {
          background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' };
      case 'lg':
        return { padding: '0.85rem 1.5rem', fontSize: '1rem', borderRadius: 'var(--radius-md)' };
      case 'md':
      default:
        return { padding: '0.65rem 1.15rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)' };
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontWeight: 600,
        transition: 'all var(--transition-fast)',
        opacity: disabled || loading ? 0.65 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      className={`btn ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
