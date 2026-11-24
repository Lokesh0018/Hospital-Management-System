import React, { useState, useEffect } from 'react';
import { appointmentApi } from '../../api/appointmentApi.js';
import { Sun, Sunset, Moon, Clock, CheckCircle } from 'lucide-react';

const SLOTS_CONFIG = [
  { id: 'MORNING', label: 'Morning Slot', hours: '09:00 AM - 12:00 PM', icon: Sun },
  { id: 'AFTERNOON', label: 'Afternoon Slot', hours: '02:00 PM - 05:00 PM', icon: Sunset },
  { id: 'EVENING', label: 'Evening Slot', hours: '06:00 PM - 09:00 PM', icon: Moon }
];

export const LiveSlotSelector = ({
  doctorId,
  date,
  selectedSlot,
  onSelectSlot,
  disabled = false
}) => {
  const [availableSlots, setAvailableSlots] = useState({
    MORNING: true,
    AFTERNOON: true,
    EVENING: true
  });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!doctorId || !date) return;

    let isMounted = true;
    const checkAvailability = async () => {
      try {
        setChecking(true);
        const res = await appointmentApi.getDoctorSlotAvailability(doctorId, date);
        if (!isMounted) return;

        const data = res?.data;
        if (data?.availableSlots) {
          const map = {
            MORNING: data.availableSlots.includes('MORNING'),
            AFTERNOON: data.availableSlots.includes('AFTERNOON'),
            EVENING: data.availableSlots.includes('EVENING')
          };
          setAvailableSlots(map);

          // If current selection is booked, switch to first open slot
          if (!map[selectedSlot] && data.availableSlots.length > 0) {
            onSelectSlot(data.availableSlots[0]);
          }
        }
      } catch (err) {
        console.warn('Slot availability query fallback:', err);
        if (isMounted) {
          setAvailableSlots({ MORNING: true, AFTERNOON: true, EVENING: true });
        }
      } finally {
        if (isMounted) setChecking(false);
      }
    };

    checkAvailability();

    return () => {
      isMounted = false;
    };
  }, [doctorId, date]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <label className="form-label" style={{ margin: 0 }}>
          Consultation Time Slot <span style={{ color: '#dc2626' }}>*</span>
        </label>
        {checking && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} className="animate-spin" /> Checking slot availability...
          </span>
        )}
      </div>

      <div className="slot-selector-grid">
        {SLOTS_CONFIG.map((slot) => {
          const Icon = slot.icon;
          const isAvail = availableSlots[slot.id] !== false;
          const isSelected = selectedSlot === slot.id;

          return (
            <div
              key={slot.id}
              className={`slot-option-card ${isSelected ? 'selected' : ''} ${
                !isAvail ? 'unavailable' : ''
              }`}
              onClick={() => {
                if (isAvail && !disabled) {
                  onSelectSlot(slot.id);
                }
              }}
              style={{ cursor: isAvail && !disabled ? 'pointer' : 'not-allowed' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Icon size={18} color={isSelected ? '#059669' : '#64748b'} />
                {isSelected && <CheckCircle size={14} color="#059669" />}
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#065f46' : 'inherit' }}>
                {slot.label}
              </div>

              <span className="slot-time-text">{slot.hours}</span>

              {!isAvail && (
                <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, marginTop: 2 }}>
                  Slot Booked
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveSlotSelector;
