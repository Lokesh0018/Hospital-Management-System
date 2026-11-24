import React, { useState } from 'react';
import adminApi from '../../api/adminApi';
import { X, User, Mail, Lock, Phone, Stethoscope, Briefcase, DollarSign, Clock } from 'lucide-react';

const DOCTOR_SPECIALIZATIONS = [
  'Cardiologist',
  'Dentist',
  'Neurologist',
  'Dermatologist',
  'Orthopedic',
  'General Physician'
];

export const AddDoctorModal = ({ isOpen, onClose, onDoctorAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: 'General Physician',
    department: '',
    experienceYears: 0,
    consultationFee: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      await adminApi.createDoctor(formData);
      onDoctorAdded(); // Trigger refresh on parent
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={backdropStyle} onClick={onClose}>
      <div className="modal-dialog" style={dialogStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stethoscope size={20} color="var(--color-primary-600)" />
            Add New Doctor
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

            {/* Email */}
            <div className="form-group">
              <label style={labelStyle}>Email Address *</label>
              <div style={inputWrapperStyle}>
                <Mail size={16} style={iconStyle} />
                <input required type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} placeholder="doctor@hospital.com" />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label style={labelStyle}>Temporary Password *</label>
              <div style={inputWrapperStyle}>
                <Lock size={16} style={iconStyle} />
                <input required type="password" name="password" value={formData.password} onChange={handleChange} style={inputStyle} placeholder="Temp@1234" minLength={8} />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label style={labelStyle}>Phone Number</label>
              <div style={inputWrapperStyle}>
                <Phone size={16} style={iconStyle} />
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="+1 234 567 8900" />
              </div>
            </div>

            {/* Specialization */}
            <div className="form-group">
              <label style={labelStyle}>Specialization *</label>
              <div style={inputWrapperStyle}>
                <Stethoscope size={16} style={iconStyle} />
                <select name="specialization" value={formData.specialization} onChange={handleChange} style={inputStyle}>
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
                <input type="text" name="department" value={formData.department} onChange={handleChange} style={inputStyle} placeholder="e.g. Cardiology" />
              </div>
            </div>

            {/* Experience Years */}
            <div className="form-group">
              <label style={labelStyle}>Experience (Years)</label>
              <div style={inputWrapperStyle}>
                <Clock size={16} style={iconStyle} />
                <input type="number" name="experienceYears" min="0" value={formData.experienceYears} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            {/* Consultation Fee */}
            <div className="form-group">
              <label style={labelStyle}>Consultation Fee ($)</label>
              <div style={inputWrapperStyle}>
                <DollarSign size={16} style={iconStyle} />
                <input type="number" name="consultationFee" min="0" step="0.01" value={formData.consultationFee} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={footerStyle}>
            <button type="button" onClick={onClose} style={cancelBtnStyle} disabled={loading}>Cancel</button>
            <button type="submit" style={submitBtnStyle} disabled={loading}>
              {loading ? 'Creating...' : 'Create Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Internal inline styles to keep it self-contained
const backdropStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, backdropFilter: 'blur(4px)'
};
const dialogStyle = {
  background: 'white', borderRadius: '12px', width: '100%', maxWidth: '650px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
};
const headerStyle = {
  padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: '#f8fafc'
};
const closeBtnStyle = {
  background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem'
};
const formStyle = {
  padding: '1.5rem', overflowY: 'auto'
};
const errorBannerStyle = {
  background: '#fef2f2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '6px',
  marginBottom: '1.5rem', border: '1px solid #fecaca', fontSize: '0.875rem'
};
const gridStyle = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem'
};
const labelStyle = {
  display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem'
};
const inputWrapperStyle = {
  position: 'relative', display: 'flex', alignItems: 'center'
};
const iconStyle = {
  position: 'absolute', left: '0.75rem', color: '#94a3b8'
};
const inputStyle = {
  width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem',
  border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a',
  outline: 'none', boxSizing: 'border-box'
};
const footerStyle = {
  marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem',
  paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0'
};
const cancelBtnStyle = {
  padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1',
  borderRadius: '6px', color: '#475569', fontWeight: 500, cursor: 'pointer'
};
const submitBtnStyle = {
  padding: '0.5rem 1.25rem', background: 'var(--color-primary-600)', border: 'none',
  borderRadius: '6px', color: 'white', fontWeight: 600, cursor: 'pointer'
};

export default AddDoctorModal;
