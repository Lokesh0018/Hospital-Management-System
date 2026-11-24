import React from 'react';
import logoImage from '../../assets/logo.png';
import '../../styles/logo.css';

export const Logo = ({ className = '', style, variant = 'default' }) => {
  // variant can be 'default', 'collapsed', 'large', 'small'
  return (
    <div className={`app-logo-wrapper ${variant} ${className}`} style={style}>
      <img src={logoImage} alt="MedPulse HMS" className="app-logo-img" />
    </div>
  );
};

export default Logo;
