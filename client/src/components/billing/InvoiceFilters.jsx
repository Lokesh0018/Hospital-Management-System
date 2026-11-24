import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'All Invoices', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Cancelled', value: 'CANCELLED' }
];

export const InvoiceFilters = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  patientId,
  onPatientChange,
  patients = [],
  onReset
}) => {
  return (
    <div className="billing-filter-card">
      <div className="filter-row-top">
        {/* Search Bar */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon-inside" />
          <input
            id="input-invoice-search"
            type="text"
            className="form-control"
            placeholder="Search by Invoice # (e.g. INV-2026), patient name, or notes..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Patient Dropdown (if provided) */}
        {patients && patients.length > 0 && (
          <div style={{ minWidth: 220 }}>
            <select
              id="select-invoice-patient"
              className="form-control"
              value={patientId}
              onChange={(e) => onPatientChange(e.target.value)}
            >
              <option value="">All Patients</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.user?.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset Filters */}
        <button
          id="btn-reset-invoice-filters"
          type="button"
          className="btn btn-secondary"
          onClick={onReset}
          title="Clear all filters"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="status-pills-group">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            id={`filter-pill-${opt.value.toLowerCase()}`}
            type="button"
            className={`status-pill-btn ${status === opt.value ? 'active' : ''}`}
            onClick={() => onStatusChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InvoiceFilters;
