import React from 'react';

/**
 * Receptionist Dashboard KPI Cards
 * Displays front-desk operational metrics: appointments, check-ins, registrations, pending dues, doctors
 */
export const ReceptionistKPICards = ({ statistics = {} }) => {
  const todayAppts = statistics?.todayAppointments || {};
  const patients = statistics?.patients || {};
  const billing = statistics?.billing || {};
  const doctors = statistics?.doctors || {};

  const cards = [
    {
      id: 'today-total',
      label: "Today's Appointments",
      value: todayAppts.total ?? 0,
      sub: `${todayAppts.pending ?? 0} Pending · ${todayAppts.confirmed ?? 0} In Clinic`,
      icon: '📅',
      type: 'primary'
    },
    {
      id: 'waiting-room',
      label: 'Checked In / Active',
      value: todayAppts.confirmed ?? 0,
      sub: 'Patients in clinic waiting room',
      icon: '🏥',
      type: 'success'
    },
    {
      id: 'pending-checkin',
      label: 'Pending Check-In',
      value: todayAppts.pending ?? 0,
      sub: 'Awaiting front desk arrival',
      icon: '⏳',
      type: 'warning'
    },
    {
      id: 'new-patients',
      label: 'New Patients Today',
      value: patients.registeredToday ?? 0,
      sub: `Total directory: ${patients.total ?? 0}`,
      icon: '👤',
      type: 'purple'
    },
    {
      id: 'pending-bills',
      label: 'Unpaid Dues',
      value: `$${(billing.pendingAmount ?? 0).toLocaleString()}`,
      sub: `${billing.pendingInvoicesCount ?? 0} invoices awaiting payment`,
      icon: '💳',
      type: 'danger'
    },
    {
      id: 'doctors-on-duty',
      label: 'Doctors On Duty',
      value: doctors.availableOnDuty ?? 0,
      sub: `${doctors.total ?? 0} doctors active in directory`,
      icon: '🩺',
      type: 'teal'
    }
  ];

  return (
    <div className="receptionist-kpi-grid" id="receptionist-kpi-cards">
      {cards.map((card) => (
        <div key={card.id} className="rec-kpi-card">
          <div className={`rec-kpi-icon ${card.type}`}>
            {card.icon}
          </div>
          <div className="rec-kpi-info">
            <span className="rec-kpi-value">{card.value}</span>
            <span className="rec-kpi-label">{card.label}</span>
            <span className="rec-kpi-sub">{card.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReceptionistKPICards;
