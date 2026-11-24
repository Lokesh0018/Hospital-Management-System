import React from 'react';

export const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  required = false,
  className = '',
  rightElement,
  ...props
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span style={{ color: 'var(--color-accent-rose)' }}>*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {Icon && <Icon size={18} className="input-icon" />}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`form-input ${error ? 'error' : ''}`}
          style={{
            paddingLeft: Icon ? '2.6rem' : '1rem',
            paddingRight: rightElement ? '2.75rem' : '1rem',
          }}
          {...props}
        />
        {rightElement}
      </div>
      {error && <span className="form-error-msg">{error}</span>}
    </div>
  );
};

export default Input;
