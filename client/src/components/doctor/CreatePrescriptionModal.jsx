import React, { useState, useEffect } from 'react';
import { doctorApi } from '../../api/doctorApi.js';
import { X, Pill, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button.jsx';

export const CreatePrescriptionModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialPatient = null,
  initialAppointmentId = null,
  initialReportId = null,
}) => {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(initialPatient?.id || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [medicines, setMedicines] = useState([
    { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialPatient?.id) {
      setPatientId(initialPatient.id);
    } else if (isOpen) {
      // Fetch patients for dropdown using doctorApi (which uses correct axiosClient)
      doctorApi
        .getPatients({ limit: 100 })
        .then((res) => {
          const list = res?.data?.patients || res?.data || (Array.isArray(res) ? res : []);
          setPatients(Array.isArray(list) ? list : []);
          // Do NOT auto-select — require explicit selection
        })
        .catch((err) => console.warn('Could not fetch patients for selector:', err));
    }
  }, [isOpen, initialPatient]);

  if (!isOpen) return null;

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    if (medicines.length <= 1) return;
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) {
      setError('Please select a patient.');
      return;
    }
    if (!diagnosis.trim()) {
      setError('Please provide a clinical diagnosis.');
      return;
    }

    // Verify medicine rows
    for (let i = 0; i < medicines.length; i++) {
      const m = medicines[i];
      if (!m.medicineName.trim() || !m.dosage.trim() || !m.frequency.trim() || !m.duration.trim()) {
        setError(`Please fill in all required fields for medicine #${i + 1} (Name, Dosage, Frequency, Duration).`);
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        patientId,
        appointmentId: initialAppointmentId || undefined,
        reportId: initialReportId || undefined,
        diagnosis: diagnosis.trim(),
        instructions: instructions.trim() || undefined,
        medicines: medicines.map((m) => ({
          medicineName: m.medicineName.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency.trim(),
          duration: m.duration.trim(),
          instructions: m.instructions?.trim() || undefined,
        })),
      };

      const response = await doctorApi.createPrescription(payload);
      if (onSuccess) {
        onSuccess(response?.data);
      }
      onClose();
    } catch (err) {
      console.error('[CreatePrescriptionModal] Submit error:', err);
      // axiosClient transforms the error into { status, message, errors }
      if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const details = err.errors.map((e) => `${e.field || 'field'}: ${e.message}`).join(' | ');
        setError(`Validation failed — ${details}`);
      } else {
        setError(err?.message || 'Failed to create prescription. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Pill size={20} color="var(--color-primary-600)" />
            <span>Create Clinical Prescription</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="patientSelect">
                  Patient <span style={{ color: 'var(--color-accent-rose)' }}>*</span>
                </label>
                {initialPatient ? (
                  <input
                    type="text"
                    disabled
                    className="form-input"
                    value={initialPatient.name || 'Selected Patient'}
                    style={{ background: 'var(--color-slate-100)', fontWeight: 600 }}
                  />
                ) : (
                  <select
                    id="patientSelect"
                    className="form-input"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    required
                  >
                    <option value="">Select Patient...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.user?.name} {p.email ? `(${p.email || p.user?.email})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="diagnosis">
                  Diagnosis / Condition <span style={{ color: 'var(--color-accent-rose)' }}>*</span>
                </label>
                <input
                  id="diagnosis"
                  type="text"
                  required
                  placeholder="e.g. Acute Migraine, Essential Hypertension"
                  className="form-input"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
            </div>

            {/* Medicines List Builder */}
            <div className="form-group">
              <label className="form-label">
                Prescribed Medicines & Dosage Schedule <span style={{ color: 'var(--color-accent-rose)' }}>*</span>
              </label>

              <div className="medicines-builder">
                {medicines.map((med, index) => (
                  <div key={index} className="medicine-row">
                    <input
                      type="text"
                      required
                      placeholder="Medicine name (e.g. Amoxicillin)"
                      className="medicine-input"
                      value={med.medicineName}
                      onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Dosage (500mg)"
                      className="medicine-input"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Frequency (Twice daily)"
                      className="medicine-input"
                      value={med.frequency}
                      onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Duration (5 days)"
                      className="medicine-input"
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={medicines.length <= 1}
                      className="btn-remove-med"
                      onClick={() => handleRemoveMedicine(index)}
                      title="Remove medicine"
                      style={{ opacity: medicines.length <= 1 ? 0.3 : 1 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn-add-med"
                  onClick={handleAddMedicine}
                >
                  <Plus size={14} />
                  <span>Add Another Medication</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="rxInstructions">
                Patient Advice & General Instructions
              </label>
              <textarea
                id="rxInstructions"
                rows={2}
                className="form-input"
                style={{ padding: '0.65rem', height: 'auto', resize: 'vertical' }}
                placeholder="e.g. Take immediately after meals. Stay hydrated and rest."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loading} icon={CheckCircle}>
              Issue & Save Prescription
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePrescriptionModal;
