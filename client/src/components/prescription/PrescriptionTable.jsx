import React from 'react';
import { PrescriptionStatusBadge } from './PrescriptionStatusBadge.jsx';
import {
  Pill,
  User,
  Stethoscope,
  Eye,
  Calendar,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Edit3,
  Trash2,
  ChevronRight
} from 'lucide-react';

export const PrescriptionTable = ({
  prescriptions = [],
  currentRole = 'PATIENT',
  onViewDetails,
  onUpdateStatus,
  onEdit,
  onDelete
}) => {
  return (
    <div className="table-responsive">
      <table className="table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Diagnosis & Reference</th>
            <th>Patient Details</th>
            <th>Prescribing Doctor</th>
            <th>Medications Summary</th>
            <th>Date Issued</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {prescriptions.map((rx) => {
            const patientName =
              rx.patient?.name ||
              rx.patient?.user?.name ||
              `Patient #${rx.patientId?.substring(0, 5) || 'Record'}`;
            const patientPhone =
              rx.patient?.phone ||
              rx.patient?.user?.phone ||
              rx.patient?.emergencyContact ||
              '';

            const doctorName =
              rx.doctor?.name ||
              rx.doctor?.user?.name ||
              (rx.doctorId ? `Dr. #${rx.doctorId.substring(0, 5)}` : 'Hospital Physician');
            const specialty =
              rx.doctor?.specialization ||
              rx.doctor?.department ||
              'Clinical Medicine';

            const dateStr = rx.createdAt?.split('T')[0] || 'Recent';
            const medicines = rx.medicines || [];

            const canManage = currentRole === 'DOCTOR' || currentRole === 'ADMIN';

            return (
              <tr key={rx.id}>
                {/* Diagnosis & Ref */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-md)',
                        background: '#eff6ff',
                        color: 'var(--color-primary-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Pill size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-slate-900)', fontSize: '0.875rem' }}>
                        {rx.diagnosis || 'Clinical Prescription'}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)', marginTop: 2 }}>
                        Rx ID: #{rx.id.substring(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Patient Details */}
                <td>
                  <div className="appointment-user-cell">
                    <div className="appointment-avatar avatar-patient">
                      <User size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {patientName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {rx.patient?.bloodGroup ? `${rx.patient.bloodGroup} • ` : ''}
                        {patientPhone || `ID: #${rx.id.substring(0, 6)}`}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Prescribing Doctor */}
                <td>
                  <div className="appointment-user-cell">
                    <div className="appointment-avatar avatar-doctor">
                      <Stethoscope size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {doctorName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {specialty}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Medicines Preview */}
                <td style={{ maxWidth: 260 }}>
                  <div className="medicines-preview-cluster">
                    {medicines.slice(0, 2).map((med, idx) => (
                      <span key={idx} className="medicine-chip">
                        <Pill size={10} color="#059669" />
                        <span>{med.medicineName} ({med.dosage})</span>
                      </span>
                    ))}
                    {medicines.length > 2 && (
                      <span className="medicine-chip" style={{ background: '#f8fafc', color: 'var(--color-slate-500)' }}>
                        +{medicines.length - 2} more
                      </span>
                    )}
                  </div>
                </td>

                {/* Date */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-slate-700)', fontSize: '0.85rem' }}>
                    <Calendar size={14} color="var(--color-slate-400)" />
                    <span>{dateStr}</span>
                  </div>
                </td>

                {/* Status */}
                <td>
                  <PrescriptionStatusBadge status={rx.status} />
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <div className="appointment-actions-group">
                    {/* View Details */}
                    <button
                      id={`btn-view-rx-${rx.id}`}
                      className="btn-table-action btn-action-view"
                      onClick={() => onViewDetails(rx.id)}
                      title="View Prescription Details"
                    >
                      <Eye size={13} />
                      <span>Details</span>
                    </button>

                    {/* Doctor/Admin Complete Action */}
                    {canManage && rx.status === 'ACTIVE' && (
                      <button
                        id={`btn-complete-rx-${rx.id}`}
                        className="btn-table-action btn-action-confirm"
                        onClick={() => onUpdateStatus(rx, 'COMPLETED')}
                        title="Mark Treatment Completed"
                      >
                        <FileCheck size={13} />
                        <span>Complete</span>
                      </button>
                    )}

                    {/* Doctor/Admin Cancel Action */}
                    {canManage && rx.status === 'ACTIVE' && (
                      <button
                        id={`btn-cancel-rx-${rx.id}`}
                        className="btn-table-action btn-action-cancel"
                        onClick={() => onUpdateStatus(rx, 'CANCELLED')}
                        title="Discontinue Medication Course"
                      >
                        <AlertCircle size={13} />
                        <span>Discontinue</span>
                      </button>
                    )}

                    {/* Admin Delete Action */}
                    {currentRole === 'ADMIN' && (
                      <button
                        id={`btn-delete-rx-${rx.id}`}
                        className="btn-table-action btn-action-cancel"
                        onClick={() => onDelete(rx)}
                        title="Delete Prescription Record"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PrescriptionTable;
