/**
 * Supported User Roles in Hospital Management System
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
  RECEPTIONIST: 'RECEPTIONIST',
  PHARMACIST: 'PHARMACIST',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN'
});

export const ALL_ROLES = Object.values(ROLES);
