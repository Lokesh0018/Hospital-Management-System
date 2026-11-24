import React, { useState, useEffect } from 'react';
import { doctorApi } from '../../api/doctorApi.js';
import { Stethoscope, Calendar, Clock, DollarSign, Award, Check, AlertCircle } from 'lucide-react';

export const DoctorProfileCard = ({ profile, onAvailabilityChange }) => {
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(profile?.availabilityStatus || 'AVAILABLE');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (profile?.availabilityStatus && profile.availabilityStatus !== status) {
      setStatus(profile.availabilityStatus);
    }
  }, [profile?.availabilityStatus]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === status || updating || !profile?.id) return;

    try {
      setUpdating(true);
      setSuccessMsg('');
      setErrorMsg('');
      await doctorApi.updateAvailability(profile.id, newStatus);
      setStatus(newStatus);
      setSuccessMsg('Availability updated successfully');
      if (onAvailabilityChange) onAvailabilityChange(newStatus);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update availability status:', err);
      setErrorMsg('Failed to update availability status');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const doctorUser = profile?.user || {};
  const initials = doctorUser.name
    ? doctorUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'DR';

  return (
    <div className="doctor-profile-hero">
      <div className="doctor-profile-info">
        <div className="doctor-avatar-box">
          {initials}
        </div>
        <div className="doctor-name-title">
          <h2>{doctorUser.name || 'Doctor'}</h2>
          <div className="doctor-badges-row">
            <span className="badge badge-specialty">
              {profile?.specialization || 'General Physician'}
            </span>
            {profile?.department && (
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                {profile.department}
              </span>
            )}
            {profile?.qualification && (
              <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                {profile.qualification}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="doctor-meta-grid">
        <div className="doctor-meta-item">
          <span className="doctor-meta-label">Experience</span>
          <span className="doctor-meta-val">{profile?.experienceYears || 0} Years</span>
        </div>

        <div className="doctor-meta-item">
          <span className="doctor-meta-label">Consultation Fee</span>
          <span className="doctor-meta-val">${profile?.consultationFee || 0}</span>
        </div>

        <div className="doctor-meta-item">
          <span className="doctor-meta-label">Available Days</span>
          <span className="doctor-meta-val" style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile?.availableDays || 'Mon - Fri'}
          </span>
        </div>

        <div className="doctor-meta-item">
          <span className="doctor-meta-label">Availability Status</span>
          <div className="availability-toggle-group" style={{ marginTop: '0.25rem' }}>
            <button
              type="button"
              disabled={updating}
              className={`availability-btn ${status === 'AVAILABLE' ? 'active available' : ''}`}
              onClick={() => handleStatusChange('AVAILABLE')}
            >
              Available
            </button>
            <button
              type="button"
              disabled={updating}
              className={`availability-btn ${status === 'BUSY' ? 'active busy' : ''}`}
              onClick={() => handleStatusChange('BUSY')}
            >
              Busy
            </button>
            <button
              type="button"
              disabled={updating}
              className={`availability-btn ${status === 'ON_LEAVE' ? 'active on_leave' : ''}`}
              onClick={() => handleStatusChange('ON_LEAVE')}
            >
              On Leave
            </button>
          </div>
          {successMsg && (
            <span style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Check size={12} /> {successMsg}
            </span>
          )}
          {errorMsg && (
            <span style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <AlertCircle size={12} /> {errorMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileCard;
