import React from 'react';

/**
 * PatientProfileModal
 * Displays patient details, emergency contact, blood group, and medical history drawer
 */
export const PatientProfileModal = ({ isOpen, patient, onClose, onBookAppointment }) => {
  if (!isOpen || !patient) return null;

  const profile = patient.profile || patient.patientProfile || {};

  return (
    <div className="rec-modal-backdrop" onClick={onClose}>
      <div className="rec-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="rec-modal-header">
          <h2>
            <span>👤</span> Patient Profile Dossier
          </h2>
          <button
            type="button"
            className="rec-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="rec-modal-body">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem'
            }}
          >
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700
              }}
            >
              {patient.name?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>{patient.name}</h3>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                {patient.email} · {patient.phone || 'No phone recorded'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Blood Group</div>
              <div style={{ fontWeight: 700, color: '#e11d48', fontSize: '1rem' }}>
                {profile.bloodGroup || 'Not set'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Gender</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                {profile.gender || 'MALE'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Age / DOB</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                {profile.age ? `${profile.age} yrs` : profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
              Emergency Contact
            </div>
            <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              {profile.emergencyContact || 'No emergency contact on file'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
              Address
            </div>
            <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              {profile.address || 'No residential address recorded'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
              Clinical History & Known Conditions
            </div>
            <div
              style={{
                padding: '0.75rem 0.85rem',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#334155',
                whiteSpace: 'pre-line',
                minHeight: '60px'
              }}
            >
              {profile.medicalHistory || 'No previous medical conditions or allergies logged.'}
            </div>
          </div>
        </div>

        <div className="rec-modal-footer">
          <button
            type="button"
            className="rec-btn-action rec-btn-view"
            onClick={onClose}
          >
            Close
          </button>
          {onBookAppointment && (
            <button
              type="button"
              className="rec-btn-action rec-btn-checkin"
              style={{ padding: '0.6rem 1.25rem', background: '#2563eb', color: '#ffffff', borderColor: '#2563eb' }}
              onClick={() => {
                onBookAppointment(patient);
                onClose();
              }}
            >
              Book Appointment →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfileModal;
