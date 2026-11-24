import React from 'react';
import { AppointmentStatusBadge } from './AppointmentStatusBadge.jsx';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Eye,
  CheckCircle2,
  CalendarCheck,
  CalendarClock,
  Ban,
  Phone,
  FileText
} from 'lucide-react';

export const AppointmentTable = ({
  appointments = [],
  currentRole = 'PATIENT',
  onViewDetails,
  onConfirm,
  onComplete,
  onReschedule,
  onCancel
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="table-responsive">
      <table className="table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Patient Details</th>
            <th>Attending Doctor</th>
            <th>Date & Time Slot</th>
            <th>Reason / Symptoms</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((apt) => {
            const patientName =
              apt.patient?.name ||
              apt.patient?.user?.name ||
              `Patient #${apt.patientId?.substring(0, 5) || 'Record'}`;
            const patientPhone =
              apt.patient?.phone ||
              apt.patient?.user?.phone ||
              apt.patient?.emergencyContact ||
              '';
            const patientBlood = apt.patient?.bloodGroup;

            const doctorName =
              apt.doctor?.name ||
              apt.doctor?.user?.name ||
              `Dr. #${apt.doctorId?.substring(0, 5) || 'Physician'}`;
            const specialty =
              apt.doctor?.specialization ||
              apt.doctor?.profile?.specialization ||
              'General Practice';

            const isFutureOrToday = apt.appointmentDate >= todayStr;
            const canReschedule =
              (apt.status === 'PENDING' || apt.status === 'CONFIRMED') &&
              isFutureOrToday;
            const canCancel =
              apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED';

            const canDoctorConfirm =
              (currentRole === 'DOCTOR' || currentRole === 'ADMIN') &&
              apt.status === 'PENDING';
            const canDoctorComplete =
              (currentRole === 'DOCTOR' || currentRole === 'ADMIN') &&
              apt.status === 'CONFIRMED';

            return (
              <tr key={apt.id}>
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {patientBlood && <span>{patientBlood} • </span>}
                        <span>{patientPhone || `ID: #${apt.id.substring(0, 6)}`}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Doctor Details */}
                <td>
                  <div className="appointment-user-cell">
                    <div className="appointment-avatar avatar-doctor">
                      <Stethoscope size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                        {doctorName}
                      </div>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', marginTop: 2 }}>
                        {specialty}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Date & Slot */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-slate-800)', fontSize: '0.85rem' }}>
                      {apt.appointmentDate}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Clock size={12} />
                      {apt.timeSlotDetails?.hours || apt.timeSlot}
                    </span>
                  </div>
                </td>

                {/* Reason & Notes */}
                <td style={{ maxWidth: 200 }}>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-slate-700)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={apt.reason || 'None specified'}>
                    {apt.reason || 'General Consultation'}
                  </div>
                  {apt.notes && (
                    <div style={{ fontSize: '0.725rem', color: '#047857', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <FileText size={11} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={apt.notes}>
                        Notes recorded
                      </span>
                    </div>
                  )}
                </td>

                {/* Status */}
                <td>
                  <AppointmentStatusBadge status={apt.status} />
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <div className="appointment-actions-group">
                    {/* View Details */}
                    <button
                      id={`btn-view-apt-${apt.id}`}
                      className="btn-table-action btn-action-view"
                      onClick={() => onViewDetails(apt.id)}
                      title="View Consultation Dossier"
                    >
                      <Eye size={13} />
                      <span>Details</span>
                    </button>

                    {/* Doctor/Admin Confirm Action */}
                    {canDoctorConfirm && (
                      <button
                        id={`btn-confirm-apt-${apt.id}`}
                        className="btn-table-action btn-action-confirm"
                        onClick={() => onConfirm(apt.id)}
                        title="Confirm Patient Booking"
                      >
                        <CheckCircle2 size={13} />
                        <span>Confirm</span>
                      </button>
                    )}

                    {/* Doctor/Admin Complete Action */}
                    {canDoctorComplete && (
                      <button
                        id={`btn-complete-apt-${apt.id}`}
                        className="btn-table-action btn-action-complete"
                        onClick={() => onComplete(apt)}
                        title="Record Notes & Complete Visit"
                      >
                        <CalendarCheck size={13} />
                        <span>Complete</span>
                      </button>
                    )}

                    {/* Patient/Admin Reschedule Action */}
                    {canReschedule && (currentRole === 'PATIENT' || currentRole === 'ADMIN') && (
                      <button
                        id={`btn-reschedule-apt-${apt.id}`}
                        className="btn-table-action btn-action-reschedule"
                        onClick={() => onReschedule(apt)}
                        title="Reschedule Appointment Date/Slot"
                      >
                        <CalendarClock size={13} />
                        <span>Reschedule</span>
                      </button>
                    )}

                    {/* Cancel Action */}
                    {canCancel && (
                      <button
                        id={`btn-cancel-apt-${apt.id}`}
                        className="btn-table-action btn-action-cancel"
                        onClick={() => onCancel(apt)}
                        title="Cancel Appointment"
                      >
                        <Ban size={13} />
                        <span>Cancel</span>
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

export default AppointmentTable;
