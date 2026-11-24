import React from 'react';
import {
  Search,
  Calendar,
  User,
  Filter,
  RotateCcw,
  Clock,
  CheckCircle2,
  CalendarCheck,
  CalendarX
} from 'lucide-react';

const STATUS_PILLS = [
  { id: 'ALL', label: 'All Statuses', icon: null, classModifier: '' },
  { id: 'PENDING', label: 'Pending', icon: Clock, classModifier: 'pill-pending' },
  { id: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2, classModifier: 'pill-confirmed' },
  { id: 'COMPLETED', label: 'Completed', icon: CalendarCheck, classModifier: 'pill-completed' },
  { id: 'CANCELLED', label: 'Cancelled', icon: CalendarX, classModifier: 'pill-cancelled' }
];

export const AppointmentFilters = ({
  search = '',
  onSearchChange,
  status = 'ALL',
  onStatusChange,
  doctorId = '',
  onDoctorChange,
  date = '',
  onDateChange,
  doctors = [],
  showDoctorFilter = true,
  onClear
}) => {
  const hasActiveFilters = search || status !== 'ALL' || doctorId || date;

  return (
    <div className="appointments-filter-bar">
      {/* Top Filter Controls */}
      <div className="filter-controls-row">
        {/* Search Input */}
        <div className="search-input-box">
          <Search size={16} />
          <input
            id="input-appointment-search"
            type="text"
            placeholder="Search by patient, physician, or reason..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Doctor Filter (Admin & Patient) */}
        {showDoctorFilter && (
          <select
            id="select-doctor-filter"
            className="filter-select"
            value={doctorId}
            onChange={(e) => onDoctorChange(e.target.value)}
          >
            <option value="">All Attending Doctors</option>
            {doctors.map((doc) => {
              const name = doc?.name || doc?.user?.name || `Dr. #${doc.id.substring(0, 5)}`;
              const specialty = doc?.profile?.specialization || doc?.specialization || '';
              return (
                <option key={doc.id} value={doc.id}>
                  {name} {specialty ? `(${specialty})` : ''}
                </option>
              );
            })}
          </select>
        )}

        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={16} color="var(--color-slate-400)" />
          <input
            id="input-date-filter"
            type="date"
            className="filter-date-input"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            id="btn-clear-appointment-filters"
            className="btn-clear-filters"
            onClick={onClear}
            title="Reset all filters"
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Status Pills */}
      <div className="status-pills-row">
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '0.25rem' }}>
          Filter By:
        </span>
        {STATUS_PILLS.map((pill) => {
          const Icon = pill.icon;
          const isActive = status === pill.id;

          return (
            <button
              key={pill.id}
              id={`filter-status-${pill.id.toLowerCase()}`}
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

export default AppointmentFilters;
