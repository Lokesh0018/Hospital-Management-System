import React from 'react';
import {
  Heart,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  ShieldCheck,
  User
} from 'lucide-react';

export const PatientHeroCard = ({ profile, onEditProfile }) => {
  const userObj = profile?.user || profile;
  const patientProfile = profile?.profile || profile;

  const userName = userObj?.name || 'Patient';
  const email = userObj?.email || '';
  const phone = userObj?.phone || patientProfile?.emergencyContact || 'Not recorded';
  const bloodGroup = patientProfile?.bloodGroup || 'Unknown';
  const gender = patientProfile?.gender ? patientProfile.gender.charAt(0) + patientProfile.gender.slice(1).toLowerCase() : 'Not specified';
  const address = patientProfile?.address || 'No address provided';

  // Calculate age if DOB exists or use precomputed age
  let age = patientProfile?.age || null;
  if (!age && patientProfile?.dateOfBirth) {
    const dob = new Date(patientProfile.dateOfBirth);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    age = Math.abs(ageDt.getUTCFullYear() - 1970);
  }

  const profileId = patientProfile?.id || userObj?.id;

  // Get Initials
  const getInitials = (name) => {
    if (!name) return 'PT';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="patient-profile-hero">
      <div className="patient-profile-left">
        <div className="patient-avatar-box">
          {getInitials(userName)}
        </div>

        <div className="patient-welcome-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1>Welcome back, {userName}</h1>
          </div>
          <p>Your personalized healthcare portal and health records summary</p>

          <div className="patient-tag-row">
            <span className="blood-badge">
              <Heart size={13} fill="currentColor" />
              Blood Group: {bloodGroup}
            </span>

            <span className="patient-id-badge">
              <ShieldCheck size={13} />
              MRN: #{profileId ? profileId.substring(0, 8).toUpperCase() : 'PENDING'}
            </span>

            {(patientProfile?.gender || userObj?.gender) && (
              <span className="patient-id-badge">
                <User size={13} />
                {gender} {age ? `• ${age} yrs` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="patient-profile-right">
        <div className="patient-meta-grid">
          <div className="patient-meta-item">
            <span className="patient-meta-label">Emergency Contact</span>
            <span className="patient-meta-val">
              <Phone size={14} color="#a7f3d0" />
              {patientProfile?.emergencyContact || phone}
            </span>
          </div>

          <div className="patient-meta-item">
            <span className="patient-meta-label">Primary Residence</span>
            <span className="patient-meta-val" title={address} style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <MapPin size={14} color="#a7f3d0" />
              {address}
            </span>
          </div>

          {(patientProfile?.dateOfBirth || userObj?.dateOfBirth) && (
            <div className="patient-meta-item">
              <span className="patient-meta-label">Date of Birth</span>
              <span className="patient-meta-val">
                <Calendar size={14} color="#a7f3d0" />
                {patientProfile?.dateOfBirth || userObj?.dateOfBirth}
              </span>
            </div>
          )}
        </div>

        <button
          id="btn-open-edit-profile"
          onClick={onEditProfile}
          className="btn-edit-profile"
        >
          <Edit3 size={15} />
          <span>Edit Health Profile</span>
        </button>
      </div>
    </div>
  );
};

export default PatientHeroCard;
