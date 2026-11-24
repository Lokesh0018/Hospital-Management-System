import React from 'react';
import { Search, RotateCcw, Pill, CheckCircle2, FileCheck, AlertCircle } from 'lucide-react';

const STATUS_PILLS = [
  { id: 'ALL', label: 'All Statuses', icon: null, classModifier: '' },
  { id: 'ACTIVE', label: 'Active Regimen', icon: Pill, classModifier: 'pill-active' },
  { id: 'COMPLETED', label: 'Completed', icon: FileCheck, classModifier: 'pill-completed' },
  { id: 'CANCELLED', label: 'Discontinued', icon: AlertCircle, classModifier: 'pill-cancelled' }
];

export const PrescriptionFilters = ({
  search = '',
  onSearchChange,
  status = 'ALL',
  onStatusChange,
  doctorId = '',
  onDoctorChange,
  patientId = '',
  onPatientChange,
  doctors = [],
  patients = [],
  showDoctorFilter = true,
  showPatientFilter = true,
  onClear
}) => {
  const hasActiveFilters = search || status !== 'ALL' || doctorId || patientId;

  return (
    <div className="appointments-filter-bar">
      {/* Search & Selects Row */}
      <div className="filter-controls-row">
        {/* Search */}
        <div className="search-input-box">
          <Search size={16} />
          <input
            id="input-prescription-search"
            type="text"
            placeholder="Search by diagnosis, medicine name, patient, or physician..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Doctor Filter (Admin & Patient) */}
        {showDoctorFilter && (
          <select
            id="select-prescription-doctor-filter"
            className="filter-select"
            value={doctorId}
            onChange={(e) => onDoctorChange(e.target.value)}
          >
            <option value="">All Prescribing Doctors</option>
            {doctors.map((doc) => {
              const name = doc?.name || doc?.user?.name || `Dr. #${doc.id.substring(0, 5)}`;
              return (
                <option key={doc.id} value={doc.id}>
                  {name}
                </option>
              );
            })}
          </select>
        )}

        {/* Patient Filter (Admin & Doctor) */}
        {showPatientFilter && (
          <select
            id="select-prescription-patient-filter"
            className="filter-select"
            value={patientId}
            onChange={(e) => onPatientChange(e.target.value)}
          >
            <option value="">All Patients</option>
            {patients.map((p) => {
              const name = p.name || p.user?.name || `Patient #${p.id.substring(0, 5)}`;
              return (
                <option key={p.id} value={p.id}>
                  {name}
                </option>
              );
            })}
          </select>
        )}

        {/* Reset */}
        {hasActiveFilters && (
          <button
            id="btn-clear-prescription-filters"
            className="btn-clear-filters"
            onClick={onClear}
            title="Reset prescription filters"
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Status Pills */}
      <div className="status-pills-row">
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '0.25rem' }}>
          Status:
        </span>
        {STATUS_PILLS.map((pill) => {
          const Icon = pill.icon;
          const isActive = status === pill.id;

          return (
            <button
              key={pill.id}
              id={`filter-rx-status-${pill.id.toLowerCase()}`}
              className={`status-pill-btn ${isActive ? `active ${pill.classModifier}` : ''}`}
              onClick={() => onStatusChange(pill.id)}
            >
              {Icon && <Icon size={12} />}
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PrescriptionFilters;
