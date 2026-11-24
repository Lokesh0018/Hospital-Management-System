import React from 'react';
import { Search, RotateCcw, Filter, FileText, Clock, CheckCircle2 } from 'lucide-react';

const STATUS_PILLS = [
  { id: 'ALL', label: 'All Statuses', icon: null, classModifier: '' },
  { id: 'UPLOADED', label: 'Uploaded (Pending)', icon: FileText, classModifier: 'pill-uploaded' },
  { id: 'UNDER_REVIEW', label: 'Under Review', icon: Clock, classModifier: 'pill-under-review' },
  { id: 'REVIEWED', label: 'Reviewed & Signed', icon: CheckCircle2, classModifier: 'pill-reviewed' }
];

const REPORT_TYPE_OPTIONS = [
  'All Diagnostic Types',
  'X-Ray',
  'MRI',
  'CT Scan',
  'Blood Test',
  'ECG',
  'Other'
];

export const ReportFilters = ({
  search = '',
  onSearchChange,
  reportType = 'All Diagnostic Types',
  onReportTypeChange,
  status = 'ALL',
  onStatusChange,
  onClear
}) => {
  const hasActiveFilters = search || reportType !== 'All Diagnostic Types' || status !== 'ALL';

  return (
    <div className="appointments-filter-bar">
      {/* Top Filter Row */}
      <div className="filter-controls-row">
        {/* Search */}
        <div className="search-input-box">
          <Search size={16} />
          <input
            id="input-report-search"
            type="text"
            placeholder="Search reports by title, patient name, or doctor..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Report Type Filter */}
        <select
          id="select-report-type-filter"
          className="filter-select"
          value={reportType}
          onChange={(e) => onReportTypeChange(e.target.value)}
        >
          {REPORT_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            id="btn-clear-report-filters"
            className="btn-clear-filters"
            onClick={onClear}
            title="Reset report filters"
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
              id={`filter-report-status-${pill.id.toLowerCase()}`}
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

export default ReportFilters;
