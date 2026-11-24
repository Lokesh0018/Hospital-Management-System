import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * QuickActionsPanel
 * Instant shortcut bar for common front-desk receptionist workflows
 */
export const QuickActionsPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="quick-actions-card" id="receptionist-quick-actions">
      <div className="quick-actions-title">Front Desk Quick Actions</div>
      <div className="quick-actions-grid">
        <button
          type="button"
          id="action-register-patient"
          className="quick-action-btn"
          onClick={() => navigate('/receptionist/patients/register')}
        >
          <div className="quick-action-icon blue">👤+</div>
          <div>
            <div>Register Patient</div>
            <small style={{ color: '#64748b', fontWeight: 400 }}>New walk-in intake</small>
          </div>
        </button>

        <button
          type="button"
          id="action-book-appointment"
          className="quick-action-btn"
          onClick={() => navigate('/receptionist/appointments/book')}
        >
          <div className="quick-action-icon emerald">📅+</div>
          <div>
            <div>Book Appointment</div>
            <small style={{ color: '#64748b', fontWeight: 400 }}>Schedule consultation</small>
          </div>
        </button>

        <button
          type="button"
          id="action-doctor-availability"
          className="quick-action-btn"
          onClick={() => navigate('/receptionist/doctors/availability')}
        >
          <div className="quick-action-icon amber">🩺🔍</div>
          <div>
            <div>Doctor Availability</div>
            <small style={{ color: '#64748b', fontWeight: 400 }}>Live slot explorer</small>
          </div>
        </button>

        <button
          type="button"
          id="action-daily-schedule"
          className="quick-action-btn"
          onClick={() => navigate('/receptionist/doctors/schedule')}
        >
          <div className="quick-action-icon purple">⏱️</div>
          <div>
            <div>Daily Schedule</div>
            <small style={{ color: '#64748b', fontWeight: 400 }}>Time slots & queues</small>
          </div>
        </button>

        <button
          type="button"
          id="action-issue-invoice"
          className="quick-action-btn"
          onClick={() => navigate('/billing')}
        >
          <div className="quick-action-icon rose">💵</div>
          <div>
            <div>Billing & Payments</div>
            <small style={{ color: '#64748b', fontWeight: 400 }}>Issue or collect fees</small>
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuickActionsPanel;
