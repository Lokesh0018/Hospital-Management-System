import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Menu, LogOut, Sun, Moon } from 'lucide-react';
import { NotificationCenter } from '../notifications/NotificationCenter.jsx';
import { Logo } from '../common/Logo.jsx';

export const Navbar = ({ onMobileToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-admin';
      case 'DOCTOR':
        return 'badge-doctor';
      case 'PATIENT':
      default:
        return 'badge-patient';
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="mobile-toggle-btn"
          onClick={onMobileToggle}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>
        <div className="navbar-mobile-logo" style={{ display: 'none' }}>
          <Logo variant="large" />
        </div>

        <div className="navbar-status-badge hide-on-mobile">
          <span className="status-dot" />
          <span>Backend Connected (Port 5000)</span>
        </div>
      </div>

      <div className="navbar-right">
        <button
          onClick={toggleTheme}
          style={{
            padding: '0.5rem',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer'
          }}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <NotificationCenter />
        
        <div className="navbar-user-chip">
          <div className="avatar-circle">
            {getInitials(user?.name)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user?.name || 'User'}
            </span>
            <span className={`badge ${getRoleBadgeClass(user?.role)}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            padding: '0.5rem',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
            transition: 'all var(--transition-fast)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
          title="Logout"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-danger-600)';
            e.currentTarget.style.background = 'var(--bg-danger-light)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
