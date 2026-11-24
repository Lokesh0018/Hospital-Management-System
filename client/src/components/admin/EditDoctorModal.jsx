import React, { useState, useEffect } from 'react';
import adminApi from '../../api/adminApi';
import { X, User, Mail, Phone, Stethoscope, Briefcase, DollarSign, Clock } from 'lucide-react';

const DOCTOR_SPECIALIZATIONS = [
  'Cardiologist',
  'Dentist',
  'Neurologist',
  'Dermatologist',
  'Orthopedic',
  'General Physician'
];

export const EditDoctorModal = ({ isOpen, onClose, doctor, onDoctorUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'General Physician',
    department: '',
    experienceYears: 0,
    consultationFee: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.user?.name || doctor.name || '',
        email: doctor.user?.email || doctor.email || '',
        phone: doctor.user?.phone || doctor.phone || '',
        specialization: doctor.specialization || 'General Physician',
        department: doctor.department || '',
        experienceYears: doctor.experienceYears || 0,
        consultationFee: doctor.consultationFee || 0,
      });
    }
  }, [doctor]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminApi.updateDoctor(doctor.id, formData);
      onDoctorUpdated(); // Trigger refresh on parent
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={backdropStyle} onClick={onClose}>
      <div className="modal-dialog" style={dialogStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit size={20} color="var(--color-primary-600)" />
            Edit Doctor Details
          </h2>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {error && <div style={errorBannerStyle}>{error}</div>}

          <div style={gridStyle}>
            {/* Name */}
            <div className="form-group">
              <label style={labelStyle}>Full Name *</label>
              <div style={inputWrapperStyle}>
                <User size={16} style={iconStyle} />
                <input required type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} placeholder="Dr. John Doe" />
              </div>
            </div>

            {/* Email (Read-only usually, but left editable here) */}
            <div className="form-group">
              <label style={labelStyle}>Email Address *</label>
              <div style={inputWrapperStyle}>
                <Mail size={16} style={iconStyle} />
                <input required type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} placeholder="doctor@hospital.com" />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label style={labelStyle}>Phone Number</label>
              <div style={inputWrapperStyle}>
                <Phone size={16} style={iconStyle} />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="+1 234 567 8900" />
              </div>
            </div>

            {/* Specialization */}
            <div className="form-group">
              <label style={labelStyle}>Specialization *</label>
              <div style={inputWrapperStyle}>
                <Stethoscope size={16} style={iconStyle} />
                <select name="specialization" value={formData.specialization} onChange={handleChange} style={inputStyle} required>
                  <option value="">Select Specialization...</option>
                  {DOCTOR_SPECIALIZATIONS.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department */}
            <div className="form-group">
              <label style={labelStyle}>Department</label>
              <div style={inputWrapperStyle}>
                <Briefcase size={16} style={iconStyle} />
                <input type="text" name="department" value={formData.department} onChange={handleChange} style={inputStyle} placeholder="e.g. Cardiology Unit" />
              </div>
            </div>

            {/* Experience */}
            <div className="form-group">
              <label style={labelStyle}>Experience (Years)</label>
              <div style={inputWrapperStyle}>
                <Clock size={16} style={iconStyle} />
                <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} style={inputStyle} min="0" />
              </div>
            </div>

            {/* Consultation Fee */}
            <div className="form-group">
              <label style={labelStyle}>Consultation Fee ($)</label>
              <div style={inputWrapperStyle}>
                <DollarSign size={16} style={iconStyle} />
                <input type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange} style={inputStyle} min="0" step="0.01" />
              </div>
            </div>
          </div>

          <div style={footerStyle}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={submitBtnStyle}>
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inline Styles (matching AddDoctorModal)
const backdropStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' };
const dialogStyle = { background: 'var(--surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '600px', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' };
const headerStyle = { padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--surface)' };
const closeBtnStyle = { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' };
const formStyle = { padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' };
const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' };
const inputWrapperStyle = { position: 'relative', display: 'flex', alignItems: 'center' };
const iconStyle = { position: 'absolute', left: '1rem', color: 'var(--color-slate-400)' };
const inputStyle = { width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', fontSize: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-primary)' };
const footerStyle = { padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' };
const cancelBtnStyle = { padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' };
const submitBtnStyle = { padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-full)', border: 'none', background: 'var(--color-primary-600)', color: 'white', fontWeight: 600, cursor: 'pointer' };
const errorBannerStyle = { padding: '0.75rem', backgroundColor: 'var(--bg-danger-light)', color: 'var(--color-danger-700)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' };

import { Edit } from 'lucide-react';

export default EditDoctorModal;
