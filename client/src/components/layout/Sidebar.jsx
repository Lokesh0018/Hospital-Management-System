import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Logo } from '../common/Logo.jsx';
import {
  Activity,
  Users,
  UserCheck,
  Calendar,
  FileText,
  Pill,
  LayoutDashboard,
  LogOut,
  CalendarPlus,
  Stethoscope,
  Clock,
  CreditCard
} from 'lucide-react';

export const Sidebar = ({ isOpen, onCloseMobile, isCollapsed = false }) => {
  const { user, logout } = useAuth();

  const getRoleLinks = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { label: 'Admin Dashboard', to: '/admin', icon: LayoutDashboard },
          { label: 'Doctor Management', to: '/admin/doctors', icon: Stethoscope },
          { label: 'Patient Management', to: '/admin/patients', icon: Users },
          { label: 'Appointments', to: '/admin/appointments', icon: Calendar },
          { label: 'Medical Reports', to: '/admin/reports', icon: FileText },
          { label: 'Prescriptions', to: '/admin/prescriptions', icon: Pill },
          { label: 'Billing & Payments', to: '/admin/billing', icon: CreditCard },
        ];
      case 'DOCTOR':
        return [
          { label: 'Doctor Overview', to: '/doctor', icon: LayoutDashboard },
          { label: 'My Appointments', to: '/doctor/appointments', icon: Calendar },
          { label: 'Assigned Reports', to: '/doctor/reports', icon: FileText },
          { label: 'Prescriptions', to: '/doctor/prescriptions', icon: Pill },
        ];
      case 'RECEPTIONIST':
        return [
          { label: 'Front Desk Hub', to: '/receptionist', icon: LayoutDashboard },
          { label: 'Patient Registry', to: '/receptionist/patients', icon: Users },
          { label: 'Register Patient', to: '/receptionist/patients/register', icon: UserCheck },
          { label: 'Doctor Availability', to: '/receptionist/doctors/availability', icon: Stethoscope },
          { label: 'Daily Schedule', to: '/receptionist/doctors/schedule', icon: Clock },
          { label: 'Book Appointment', to: '/receptionist/appointments/book', icon: CalendarPlus },
          { label: 'All Appointments', to: '/receptionist/appointments', icon: Calendar },
          { label: 'Billing & Payments', to: '/receptionist/billing', icon: CreditCard },
          { label: 'Upload Report', to: '/reports/upload', icon: FileText },
          { label: 'All Reports', to: '/reports', icon: Activity },
        ];
      case 'PATIENT':
      default:
        return [
          { label: 'Patient Overview', to: '/patient', icon: LayoutDashboard },
          { label: 'Book Appointment', to: '/patient/book', icon: CalendarPlus },
          { label: 'My Appointments', to: '/patient/appointments', icon: Calendar },
          { label: 'Medical Reports', to: '/patient/reports', icon: FileText },
          { label: 'My Prescriptions', to: '/patient/prescriptions', icon: Pill },
          { label: 'Billing & Payments', to: '/patient/billing', icon: CreditCard },
        ];
    }
  };

  const navLinks = getRoleLinks();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand" style={{ minHeight: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo variant={isCollapsed ? "collapsed" : "large"} />
      </div>

      {/* Navigation Items */}
      <div className="sidebar-nav-container">
        <div className="sidebar-section-title">{user?.role || 'User'} Navigation</div>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin' || link.to === '/doctor' || link.to === '/patient' || link.to === '/receptionist'}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
            >
              <Icon size={18} className="nav-icon" />
              <span style={{ flex: 1 }}>{link.label}</span>
              {link.badge && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: 'rgba(2, 132, 199, 0.25)',
                    color: 'var(--color-primary-200)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(2, 132, 199, 0.4)'
                  }}
                >
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user-box">
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'Logged User'}</div>
            <div className="sidebar-user-role">{user?.role} Portal</div>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={logout}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
