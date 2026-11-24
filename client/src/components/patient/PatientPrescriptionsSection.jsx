import React, { useState } from 'react';
import {
  Pill,
  Calendar,
  User,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ChevronDown,
  Info
} from 'lucide-react';

export const PatientPrescriptionsSection = ({ prescriptions = [] }) => {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'all'

  const activePrescriptions = prescriptions.filter((p) => p.status === 'ACTIVE');
  const historyPrescriptions = prescriptions.filter((p) => p.status !== 'ACTIVE');

  const currentList = activeTab === 'active' ? activePrescriptions : prescriptions;

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle2 size={12} /> Active Regimen
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileCheck size={12} /> Course Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertCircle size={12} /> Discontinued
          </span>
        );
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div className="patient-section-header">
        <div className="patient-section-title">
          <Pill size={22} color="#059669" />
          <div>
            <h3>Prescriptions & Medications</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', margin: 0 }}>
              Track active medicinal therapies, dosages, schedules, and clinical instructions
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="patient-tabs">
          <button
            id="tab-active-prescriptions"
            className={`patient-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <span>Active Medications</span>
            <span className="tab-counter">{activePrescriptions.length}</span>
          </button>

          <button
            id="tab-all-prescriptions"
            className={`patient-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>All Prescriptions</span>
            <span className="tab-counter">{prescriptions.length}</span>
          </button>
        </div>
      </div>

      {/* Prescription Feed */}
      {currentList.length === 0 ? (
        <div className="empty-feed-card">
          <div className="empty-icon-circle" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Pill size={28} />
          </div>
          <h4>{activeTab === 'active' ? 'No Active Medications' : 'No Prescriptions Recorded'}</h4>
          <p>
            {activeTab === 'active'
              ? 'You do not have any active medication courses currently in progress.'
              : 'No prescription history is recorded for your profile.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {currentList.map((rx) => {
            const doctorName =
              rx.doctor?.name ||
              rx.doctor?.user?.name ||
              (rx.doctorId ? `Dr. #${rx.doctorId.substring(0, 5)}` : 'Hospital Physician');
            const specialty =
              rx.doctor?.profile?.specialization ||
              rx.doctor?.specialization ||
              'Clinical Medicine';
            const dateStr = rx.createdAt
              ? new Date(rx.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : 'Recent';

            const medicines = rx.medicines || [];

            return (
              <div key={rx.id} className="prescription-card">
                {/* Header */}
                <div className="prescription-header">
                  <div>
                    <div className="rx-diagnosis-title">
                      <span>Diagnosis: {rx.diagnosis || 'Clinical Consultation'}</span>
                    </div>

                    <div className="rx-meta-row">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Stethoscope size={13} color="#059669" />
                        Prescribed by <strong>{doctorName}</strong> ({specialty})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={13} />
                        Date Issued: {dateStr}
                      </span>
                      <span>Rx ID: #{rx.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                  </div>

                  <div>{renderStatusBadge(rx.status)}</div>
                </div>

                {/* Medicines Table */}
                {medicines.length > 0 ? (
                  <div className="table-responsive">
                    <table className="medicine-table">
                      <thead>
                        <tr>
                          <th>Medication</th>
                          <th>Dosage</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                          <th>Patient Guidance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicines.map((med, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                                {med.medicineName || med.name}
                              </div>
                            </td>
                            <td>
                              <span className="dosage-badge">{med.dosage}</span>
                            </td>
                            <td style={{ color: 'var(--color-slate-700)' }}>{med.frequency}</td>
                            <td style={{ color: 'var(--color-slate-700)' }}>{med.duration}</td>
                            <td style={{ color: 'var(--color-slate-600)', fontSize: '0.8rem' }}>
                              {med.instructions || 'As directed by physician'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontStyle: 'italic', margin: 0 }}>
                    No individual medicines tabulated for this prescription record.
                  </p>
                )}

                {/* Overall instructions */}
                {rx.instructions && (
                  <div className="rx-instructions-box">
                    <Info size={16} color="#b45309" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong>Physician General Advice: </strong>
                      <span>{rx.instructions}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptionsSection;
