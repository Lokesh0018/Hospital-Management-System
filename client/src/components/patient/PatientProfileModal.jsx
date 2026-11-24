import React, { useState } from 'react';
import { patientApi } from '../../api/patientApi.js';
import { X, Save, User, Phone, MapPin, Activity, AlertCircle } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

export const PatientProfileModal = ({ profile, onClose, onSaved }) => {
  const userObj = profile?.user || profile;
  const patientProfile = profile?.profile || profile;

  const [formData, setFormData] = useState({
    name: userObj?.name || '',
    phone: userObj?.phone || '',
    gender: patientProfile?.gender || userObj?.gender || 'MALE',
    dateOfBirth: patientProfile?.dateOfBirth || userObj?.dateOfBirth || '',
    bloodGroup: patientProfile?.bloodGroup || 'O+',
    emergencyContact: patientProfile?.emergencyContact || '',
    address: patientProfile?.address || '',
    medicalHistory: patientProfile?.medicalHistory || ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Patient name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      const res = await patientApi.updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
        bloodGroup: formData.bloodGroup,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        address: formData.address.trim() || undefined,
        medicalHistory: formData.medicalHistory.trim() || undefined
      });

      const updated = res?.data;
      if (onSaved) {
        onSaved(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update patient profile:', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save profile changes. Please review your input.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <User size={22} color="#059669" />
            <div>
              <h3>Edit Health Profile</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', margin: 0 }}>
                Update your personal details, emergency contact, and medical records
              </p>
            </div>
          </div>
          <button
            id="btn-close-profile-modal"
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={18} color="#dc2626" />
                <span>{error}</span>
              </div>
            )}

            {/* Name & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="patient-name-input">
                  Full Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="patient-name-input"
                  name="name"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Sarah Connor"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="patient-phone-input">
                  Primary Phone
                </label>
                <input
                  id="patient-phone-input"
                  name="phone"
                  type="tel"
                  className="form-control"
                  placeholder="e.g. +1 (555) 234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Blood Group & Gender */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="patient-blood-input">
                  Blood Group
                </label>
                <select
                  id="patient-blood-input"
                  name="bloodGroup"
                  className="form-control"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="patient-gender-input">
                  Gender
                </label>
                <select
                  id="patient-gender-input"
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="patient-dob-input">
                  Date of Birth
                </label>
                <input
                  id="patient-dob-input"
                  name="dateOfBirth"
                  type="date"
                  className="form-control"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Emergency Contact & Address */}
            <div className="form-group">
              <label className="form-label" htmlFor="patient-emergency-input">
                Emergency Contact (Name & Number)
              </label>
              <input
                id="patient-emergency-input"
                name="emergencyContact"
                type="text"
                className="form-control"
                placeholder="e.g. John Connor (+1-555-987-6543)"
                value={formData.emergencyContact}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="patient-address-input">
                Home Address
              </label>
              <textarea
                id="patient-address-input"
                name="address"
                rows="2"
                className="form-control"
                placeholder="Street address, city, state, zip"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            {/* Medical History */}
            <div className="form-group">
              <label className="form-label" htmlFor="patient-medhistory-input">
                Medical History & Pre-existing Conditions
              </label>
              <textarea
                id="patient-medhistory-input"
                name="medicalHistory"
                rows="3"
                className="form-control"
                placeholder="Known allergies, previous surgeries, chronic illnesses (e.g. Penicillin allergy, Hypertension)..."
                value={formData.medicalHistory}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              id="btn-save-profile-submit"
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ background: '#059669', borderColor: '#059669' }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientProfileModal;
