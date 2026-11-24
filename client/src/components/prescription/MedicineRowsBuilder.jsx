import React from 'react';
import { Plus, Trash2, Pill, Clock, Calendar, HelpCircle } from 'lucide-react';

export const MedicineRowsBuilder = ({
  medicines = [],
  onChange,
  disabled = false
}) => {
  const handleMedicineFieldChange = (index, field, value) => {
    const updated = medicines.map((med, idx) =>
      idx === index ? { ...med, [field]: value } : med
    );
    onChange(updated);
  };

  const handleAddRow = () => {
    onChange([
      ...medicines,
      {
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }
    ]);
  };

  const handleRemoveRow = (index) => {
    if (medicines.length <= 1) return;
    onChange(medicines.filter((_, idx) => idx !== index));
  };

  return (
    <div className="medicine-builder-container">
      {medicines.map((med, index) => (
        <div key={index} className="medicine-row-card">
          <div className="medicine-row-header">
            <span className="medicine-row-title">
              <Pill size={15} color="var(--color-primary-600)" />
              <span>Medication #{index + 1}</span>
            </span>

            {medicines.length > 1 && (
              <button
                type="button"
                className="btn-remove-medicine"
                onClick={() => handleRemoveRow(index)}
                disabled={disabled}
                title="Remove this medication"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="medicine-inputs-grid">
            {/* Medicine Name */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.785rem' }}>
                Medicine / Drug Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Amoxicillin 500mg, Lisinopril"
                value={med.medicineName}
                onChange={(e) => handleMedicineFieldChange(index, 'medicineName', e.target.value)}
                disabled={disabled}
              />
            </div>

            {/* Dosage */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.785rem' }}>
                Dosage <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. 500mg, 1 tablet, 10ml"
                value={med.dosage}
                onChange={(e) => handleMedicineFieldChange(index, 'dosage', e.target.value)}
                disabled={disabled}
              />
            </div>

            {/* Frequency */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.785rem' }}>
                Frequency <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Twice daily, Once in morning"
                value={med.frequency}
                onChange={(e) => handleMedicineFieldChange(index, 'frequency', e.target.value)}
                disabled={disabled}
              />
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.785rem' }}>
                Duration <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. 7 days, 1 month, 90 days"
                value={med.duration}
                onChange={(e) => handleMedicineFieldChange(index, 'duration', e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Instructions per medicine */}
          <div className="form-group" style={{ margin: 0 }}>
            <input
              type="text"
              className="form-control"
              style={{ fontSize: '0.8rem', background: 'white' }}
              placeholder="Patient guidance for this medicine (e.g. Take immediately after breakfast with full glass of water)"
              value={med.instructions || ''}
              onChange={(e) => handleMedicineFieldChange(index, 'instructions', e.target.value)}
              disabled={disabled}
              maxLength={500}
            />
          </div>
        </div>
      ))}

      <button
        id="btn-add-medicine-row"
        type="button"
        className="btn-add-medicine-row"
        onClick={handleAddRow}
        disabled={disabled}
      >
        <Plus size={16} />
        <span>Add Another Medication to Regimen</span>
      </button>
    </div>
  );
};

export default MedicineRowsBuilder;
