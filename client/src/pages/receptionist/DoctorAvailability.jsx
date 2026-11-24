import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { receptionistApi } from '../../api/receptionistApi.js';
import '../../styles/receptionist.css';

/**
 * DoctorAvailability
 * Dedicated page for looking up doctor working hours and real-time appointment slot capacity
 */
export const DoctorAvailability = () => {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchDoc, setSearchDoc] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await receptionistApi.getDoctors({ limit: 100 });
      
      let docs = [];
      if (Array.isArray(res)) docs = res;
      else if (res && Array.isArray(res.data)) docs = res.data;
      else if (res && res.doctors && Array.isArray(res.doctors)) docs = res.doctors;
      else if (res && res.data && res.data.doctors && Array.isArray(res.data.doctors)) docs = res.data.doctors;
      else if (res && res.data && Array.isArray(res.data.data)) docs = res.data.data;
      
      setDoctors(docs);
      if (docs.length > 0) {
        setSelectedDoctorId(docs[0].id);
      }
    } catch (err) {
      setError('Could not load doctor directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      checkAvailability();
    }
  }, [selectedDoctorId, selectedDate]);

  const checkAvailability = async () => {
    setSlotsLoading(true);
    setError(null);
    try {
      const res = await receptionistApi.getDoctorAvailability(selectedDoctorId, selectedDate);
      setAvailability(res.data);
    } catch (err) {
      setError(err.message || 'Failed to check doctor slot availability.');
      setAvailability(null);
    } finally {
      setSlotsLoading(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const filteredDoctors = doctors.filter((doc) => {
    if (!searchDoc) return true;
    const term = searchDoc.toLowerCase();
    const name = doc.user?.name || doc.name || '';
    const spec = doc.specialization || '';
    const dept = doc.department || '';
    return name.toLowerCase().includes(term) || spec.toLowerCase().includes(term) || dept.toLowerCase().includes(term);
  });

  const breadcrumbs = [
    { label: 'Receptionist', path: '/receptionist' },
    { label: 'Doctor Availability' }
  ];

  return (
    <div className="receptionist-container">
      <PageHeader 
        title="Doctor Working Hours & Slot Availability"
        subtitle="Inspect physician schedules, on-duty status, and open consultation slots"
        icon="🩺"
        breadcrumbs={breadcrumbs}
        action={
          <button
            type="button"
            className="rec-btn-action rec-btn-view"
            onClick={() => navigate('/receptionist')}
          >
            ← Back to Hub
          </button>
        }
      />

      {/* Main Grid: Doctor Selector on Left, Slots Detail on Right */}
      <div className="receptionist-grid-layout" style={{ gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
        {/* Left: Doctor Roster Selector */}
        <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-alt)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>👨‍⚕️</span> Physicians ({filteredDoctors.length})
            </h2>
          </div>

          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="rec-search-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-alt)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>🔍</span>
              <input
                type="text"
                placeholder="Search physician or specialty..."
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ maxHeight: '550px', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredDoctors.map((doc) => {
              const isSelected = doc.id === selectedDoctorId;
              const isAvailable = doc.availabilityStatus === 'AVAILABLE';
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoctorId(doc.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: isSelected ? '2px solid var(--color-primary-500)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--color-primary-50)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.95rem', color: isSelected ? 'var(--color-primary-700)' : 'var(--text-primary)' }}>
                      Dr. {doc.user?.name || doc.name}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: isAvailable ? 'var(--color-success-50)' : 'var(--color-danger-50)',
                        color: isAvailable ? 'var(--color-success-700)' : 'var(--color-danger-700)'
                      }}
                    >
                      {doc.availabilityStatus || 'AVAILABLE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                    {doc.specialization} · {doc.department || 'General Practice'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Slot Availability & Booking Handoff */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Controls */}
          <div className="enterprise-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Select Consultation Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ width: 'auto' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="rec-btn-action rec-btn-view"
                  style={{ borderRadius: 'var(--radius-full)' }}
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="rec-btn-action rec-btn-view"
                  style={{ borderRadius: 'var(--radius-full)' }}
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  className="rec-btn-action rec-btn-checkin"
                  style={{ borderRadius: 'var(--radius-full)', background: 'var(--color-primary-600)', color: 'white', border: 'none' }}
                  onClick={checkAvailability}
                >
                  🔄 Check
                </button>
              </div>
            </div>
          </div>

          {/* Doctor Info Banner */}
          {selectedDoctor && (
            <div
              className="enterprise-card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem'
              }}
            >
              <div
                style={{
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '50%',
                  background: 'var(--color-primary-50)',
                  color: 'var(--color-primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem'
                }}
              >
                🩺
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  Dr. {selectedDoctor.user?.name || selectedDoctor.name}
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Specialization:</strong> {selectedDoctor.specialization} |{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>Department:</strong> {selectedDoctor.department || 'General Medicine'}
                </div>
              </div>
            </div>
          )}

          {/* Available Slots */}
          <div className="enterprise-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-alt)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⏱️</span> Slot Schedule Breakdown for {selectedDate}
              </h2>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {slotsLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                  Checking slot capacity...
                </div>
              ) : error ? (
                <div className="alert alert-danger">
                  ⚠️ {error}
                </div>
              ) : availability ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {availability.slots?.map((slot) => {
                    const isAvailable = slot.isAvailable;
                    return (
                      <div
                        key={slot.timeSlot}
                        className={`doctor-slot-chip ${isAvailable ? 'open' : 'booked'}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1.25rem 1.5rem',
                          borderRadius: 'var(--radius-lg)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                              {slot.timeSlot}
                            </strong>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              ({slot.hours})
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              color: isAvailable ? 'var(--color-success-600)' : 'var(--color-danger-600)',
                              marginTop: '0.4rem',
                              fontWeight: 500
                            }}
                          >
                            {slot.reason || (isAvailable ? 'Slot open for consultation' : 'Fully booked')}
                          </div>
                        </div>

                        <div>
                          {isAvailable ? (
                            <button
                              type="button"
                              className="rec-btn-action"
                              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-600)', color: 'white', border: 'none', fontWeight: 600 }}
                              onClick={() =>
                                navigate('/receptionist/appointments/book', {
                                  state: {
                                    doctorId: selectedDoctorId,
                                    appointmentDate: selectedDate,
                                    timeSlot: slot.timeSlot
                                  }
                                })
                              }
                            >
                              Book This Slot →
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--color-danger-700)',
                                background: 'var(--color-danger-50)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '9999px'
                              }}
                            >
                              BOOKED
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
