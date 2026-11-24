import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { receptionistApi } from '../../api/receptionistApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import '../../styles/receptionist.css';

/**
 * PatientRegistration
 * Dedicated front-desk page for walk-in patient registration and onboarding
 */
export const PatientRegistration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'PatientPassword123',
    phone: '',
    gender: 'MALE',
    dateOfBirth: '',
    bloodGroup: 'O+',
    emergencyContact: '',
    address: '',
    medicalHistory: ''
  });

  const [bookImmediately, setBookImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [registeredPatient, setRegisteredPatient] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password || 'PatientPassword123',
        phone: formData.phone.trim() || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        address: formData.address.trim() || undefined,
        medicalHistory: formData.medicalHistory.trim() || undefined
      };

      const res = await receptionistApi.registerPatient(payload);
      const created = res.data;
      setRegisteredPatient(created);

      if (bookImmediately) {
        navigate('/receptionist/appointments/book', {
          state: {
            patientId: created.id,
            patientName: created.name
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to register patient. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      password: 'PatientPassword123',
      phone: '',
      gender: 'MALE',
      dateOfBirth: '',
      bloodGroup: 'O+',
      emergencyContact: '',
      address: '',
      medicalHistory: ''
    });
    setRegisteredPatient(null);
    setError(null);
  };

  const breadcrumbs = [
    { label: 'Receptionist', path: '/receptionist' },
    { label: 'Patients', path: '/receptionist/patients' },
    { label: 'Register Patient' }
  ];

  return (
    <div className="receptionist-container">
      <PageHeader 
        title="New Patient Registration & Intake"
        subtitle="Register new walk-in or emergency patients and immediately establish clinical profiles"
        icon="👤"
        breadcrumbs={breadcrumbs}
        action={
          <button
            type="button"
            className="rec-btn-action rec-btn-view"
            onClick={() => navigate('/receptionist/patients')}
          >
            ← Patient Directory
          </button>
        }
      />

      {registeredPatient && !bookImmediately ? (
        <div className="enterprise-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: 'var(--color-success-600)', margin: '0 0 0.5rem 0' }}>
            Patient Registered Successfully!
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            <strong>{registeredPatient.name}</strong> has been enrolled with ID:{' '}
            <code className="mono">{registeredPatient.id}</code>
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2.5rem' }}>
            <button
              type="button"
              className="rec-btn-action rec-btn-checkin"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
              onClick={() =>
                navigate('/receptionist/appointments/book', {
                  state: {
                    patientId: registeredPatient.id,
                    patientName: registeredPatient.name
                  }
                })
              }
            >
              📅 Schedule Consultation Now
            </button>
            <button
              type="button"
              className="rec-btn-action rec-btn-view"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
              onClick={handleReset}
            >
              Register Another Patient
            </button>
          </div>
        </div>
      ) : (
        <div className="enterprise-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  required
                  placeholder="e.g. Johnathan Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  required
                  placeholder="patient@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  placeholder="+1-555-0199"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select
                  name="bloodGroup"
                  className="form-control"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="form-control"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Contact</label>
                <input
                  type="text"
                  name="emergencyContact"
                  className="form-control"
                  placeholder="Contact person & phone number"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Residential Address</label>
              <input
                type="text"
                name="address"
                className="form-control"
                placeholder="Street address, city, postal code"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Known Allergies & Clinical History</label>
              <textarea
                name="medicalHistory"
                className="form-control"
                rows={3}
                placeholder="List any drug allergies, pre-existing chronic conditions, or ongoing treatments..."
                value={formData.medicalHistory}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '1rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-lg)' }}>
              <input
                type="checkbox"
                id="book-immediately-check"
                checked={bookImmediately}
                onChange={(e) => setBookImmediately(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
              />
              <label
                htmlFor="book-immediately-check"
                style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                Proceed immediately to book an appointment for this patient upon registration
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="button"
                className="rec-btn-action rec-btn-view"
                onClick={handleReset}
                disabled={submitting}
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="rec-btn-action rec-btn-checkin"
                disabled={submitting}
                style={{ padding: '0.75rem 2rem', background: 'var(--color-primary-600)', color: '#ffffff', borderColor: 'var(--color-primary-600)', fontSize: '0.9rem' }}
              >
                {submitting ? 'Registering Patient...' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientRegistration;
