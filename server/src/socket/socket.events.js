import {
  emitToRole,
  emitToUser,
  broadcastEvent,
  sendNotification
} from './socket.init.js';

export const SocketEvents = {
  /**
   * Broadcast appointment:created
   */
  appointmentCreated: async (appointment) => {
    emitToRole('ADMIN', 'appointment:created', appointment);
    emitToRole('RECEPTIONIST', 'appointment:created', appointment);

    const docUserId = appointment.doctor?.doctorId || appointment.doctor?.userId;
    const patUserId = appointment.patient?.patientId || appointment.patient?.userId;

    if (docUserId) {
      emitToUser(docUserId, 'appointment:created', appointment);
      sendNotification({
        title: 'New Appointment Scheduled',
        message: `Patient ${appointment.patient?.name || 'Walk-in'} booked ${appointment.timeSlot} slot on ${appointment.appointmentDate}`,
        userId: docUserId,
        event: 'appointment:created',
        data: appointment
      }).catch(() => {});
    }

    if (patUserId) {
      emitToUser(patUserId, 'appointment:created', appointment);
      sendNotification({
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${appointment.doctor?.name || 'Physician'} has been scheduled for ${appointment.appointmentDate} (${appointment.timeSlot})`,
        userId: patUserId,
        event: 'appointment:created',
        data: appointment
      }).catch(() => {});
    }

    sendNotification({
      title: 'New Appointment Booked',
      message: `${appointment.patient?.name || 'Patient'} scheduled consultation with Dr. ${appointment.doctor?.name || 'Physician'} on ${appointment.appointmentDate}`,
      role: 'ADMIN',
      event: 'appointment:created',
      data: appointment
    }).catch(() => {});
  },

  /**
   * Broadcast appointment:confirmed (Check-in)
   */
  appointmentConfirmed: async (appointment) => {
    emitToRole('ADMIN', 'appointment:confirmed', appointment);
    emitToRole('RECEPTIONIST', 'appointment:confirmed', appointment);

    const docUserId = appointment.doctor?.doctorId || appointment.doctor?.userId;
    const patUserId = appointment.patient?.patientId || appointment.patient?.userId;

    if (docUserId) {
      emitToUser(docUserId, 'appointment:confirmed', appointment);
      sendNotification({
        title: 'Patient Checked In',
        message: `${appointment.patient?.name || 'Patient'} arrived and checked in for ${appointment.timeSlot} consultation.`,
        userId: docUserId,
        event: 'appointment:confirmed',
        data: appointment
      }).catch(() => {});
    }

    if (patUserId) {
      emitToUser(patUserId, 'appointment:confirmed', appointment);
      sendNotification({
        title: 'Check-In Confirmed',
        message: `Your arrival has been marked. Please take a seat in the waiting room.`,
        userId: patUserId,
        event: 'appointment:confirmed',
        data: appointment
      }).catch(() => {});
    }
  },

  /**
   * Broadcast appointment:rescheduled
   */
  appointmentRescheduled: async (appointment) => {
    emitToRole('ADMIN', 'appointment:rescheduled', appointment);
    emitToRole('RECEPTIONIST', 'appointment:rescheduled', appointment);

    const docUserId = appointment.doctor?.doctorId || appointment.doctor?.userId;
    const patUserId = appointment.patient?.patientId || appointment.patient?.userId;

    if (docUserId) {
      emitToUser(docUserId, 'appointment:rescheduled', appointment);
      sendNotification({
        title: 'Appointment Rescheduled',
        message: `Consultation with ${appointment.patient?.name || 'Patient'} moved to ${appointment.appointmentDate} (${appointment.timeSlot}).`,
        userId: docUserId,
        event: 'appointment:rescheduled',
        data: appointment
      }).catch(() => {});
    }

    if (patUserId) {
      emitToUser(patUserId, 'appointment:rescheduled', appointment);
      sendNotification({
        title: 'Appointment Rescheduled',
        message: `Your appointment with Dr. ${appointment.doctor?.name || 'Physician'} was moved to ${appointment.appointmentDate} (${appointment.timeSlot}).`,
        userId: patUserId,
        event: 'appointment:rescheduled',
        data: appointment
      }).catch(() => {});
    }
  },

  /**
   * Broadcast appointment:cancelled
   */
  appointmentCancelled: async (appointment) => {
    emitToRole('ADMIN', 'appointment:cancelled', appointment);
    emitToRole('RECEPTIONIST', 'appointment:cancelled', appointment);

    const docUserId = appointment.doctor?.doctorId || appointment.doctor?.userId;
    const patUserId = appointment.patient?.patientId || appointment.patient?.userId;

    if (docUserId) {
      emitToUser(docUserId, 'appointment:cancelled', appointment);
      sendNotification({
        title: 'Appointment Cancelled',
        message: `Appointment on ${appointment.appointmentDate} with ${appointment.patient?.name || 'Patient'} was cancelled.`,
        userId: docUserId,
        event: 'appointment:cancelled',
        data: appointment
      }).catch(() => {});
    }

    if (patUserId) {
      emitToUser(patUserId, 'appointment:cancelled', appointment);
      sendNotification({
        title: 'Appointment Cancelled',
        message: `Your appointment on ${appointment.appointmentDate} has been cancelled.`,
        userId: patUserId,
        event: 'appointment:cancelled',
        data: appointment
      }).catch(() => {});
    }
  },

  /**
   * Broadcast appointment:completed
   */
  appointmentCompleted: async (appointment) => {
    emitToRole('ADMIN', 'appointment:completed', appointment);
    emitToRole('RECEPTIONIST', 'appointment:completed', appointment);

    const docUserId = appointment.doctor?.doctorId || appointment.doctor?.userId;
    const patUserId = appointment.patient?.patientId || appointment.patient?.userId;

    if (docUserId) emitToUser(docUserId, 'appointment:completed', appointment);
    if (patUserId) {
      emitToUser(patUserId, 'appointment:completed', appointment);
      sendNotification({
        title: 'Consultation Completed',
        message: `Your consultation with Dr. ${appointment.doctor?.name || 'Physician'} has finished.`,
        userId: patUserId,
        event: 'appointment:completed',
        data: appointment
      }).catch(() => {});
    }
  },

  /**
   * Broadcast report:uploaded & report:assigned
   */
  reportUploaded: async (report) => {
    // Requirements explicitly specify: "Notify ONLY: Assigned Doctor, Related Patient. Do not notify other users."
    const docUserId = report.doctor?.doctorId || report.doctor?.userId;
    const patUserId = report.patient?.patientId || report.patient?.userId;

    if (docUserId) {
      emitToUser(docUserId, 'report:uploaded', report);
      emitToUser(docUserId, 'report:assigned', report);
      sendNotification({
        title: 'Diagnostic Report Assigned',
        message: `Report "${report.title}" for patient ${report.patient?.name || 'Patient'} is awaiting your clinical review.`,
        userId: docUserId,
        event: 'report:assigned',
        data: report
      }).catch(() => {});
    }

    if (patUserId) {
      emitToUser(patUserId, 'report:uploaded', report);
      sendNotification({
        title: 'New Medical Report Uploaded',
        message: `Diagnostic report "${report.title}" has been uploaded to your file.`,
        userId: patUserId,
        event: 'report:uploaded',
        data: report
      }).catch(() => {});
    }
  },

  /**
   * Broadcast report:reviewed
   */
  reportReviewed: async (report) => {
    // Requirements explicitly specify: "Notify ONLY: Assigned Doctor, Related Patient. Do not notify other users."
    const patUserId = report.patient?.patientId || report.patient?.userId;
    if (patUserId) {
      emitToUser(patUserId, 'report:reviewed', report);
      sendNotification({
        title: 'Report Reviewed by Doctor',
        message: `Dr. ${report.doctor?.name || 'Physician'} has reviewed and signed off on "${report.title}".`,
        userId: patUserId,
        event: 'report:reviewed',
        data: report
      }).catch(() => {});
    }
  },

  /**
   * Broadcast report:deleted
   */
  reportDeleted: async (reportId, patientUserId) => {
    emitToRole('ADMIN', 'report:deleted', { id: reportId });
    if (patientUserId) {
      emitToUser(patientUserId, 'report:deleted', { id: reportId });
    }
  },

  /**
   * Broadcast prescription:created
   */
  prescriptionCreated: async (prescription) => {
    emitToRole('ADMIN', 'prescription:created', prescription);
    emitToRole('RECEPTIONIST', 'prescription:created', prescription);

    const patUserId = prescription.patient?.patientId || prescription.patient?.userId;
    if (patUserId) {
      emitToUser(patUserId, 'prescription:created', prescription);
      sendNotification({
        title: 'Prescription Issued',
        message: `Dr. ${prescription.doctor?.name || 'Physician'} prescribed medication for: ${prescription.diagnosis}.`,
        userId: patUserId,
        event: 'prescription:created',
        data: prescription
      }).catch(() => {});
    }
  },

  /**
   * Broadcast prescription:updated
   */
  prescriptionUpdated: async (prescription) => {
    emitToRole('ADMIN', 'prescription:updated', prescription);

    const patUserId = prescription.patient?.patientId || prescription.patient?.userId;
    if (patUserId) {
      emitToUser(patUserId, 'prescription:updated', prescription);
      sendNotification({
        title: 'Prescription Updated',
        message: `Dosage or instructions updated for your prescription: ${prescription.diagnosis}.`,
        userId: patUserId,
        event: 'prescription:updated',
        data: prescription
      }).catch(() => {});
    }
  },

  /**
   * Broadcast prescription:completed
   */
  prescriptionCompleted: async (prescription) => {
    emitToRole('ADMIN', 'prescription:completed', prescription);
    const patUserId = prescription.patient?.patientId || prescription.patient?.userId;
    if (patUserId) {
      emitToUser(patUserId, 'prescription:completed', prescription);
    }
  },

  /**
   * Broadcast prescription:cancelled
   */
  prescriptionCancelled: async (prescription) => {
    emitToRole('ADMIN', 'prescription:cancelled', prescription);
    const patUserId = prescription.patient?.patientId || prescription.patient?.userId;
    if (patUserId) {
      emitToUser(patUserId, 'prescription:cancelled', prescription);
    }
  },

  /**
   * Broadcast billing:invoice_created
   */
  invoiceCreated: async (invoice) => {
    emitToRole('ADMIN', 'billing:invoice_created', invoice);
    emitToRole('RECEPTIONIST', 'billing:invoice_created', invoice);

    const patUserId = invoice.patient?.userId || invoice.patient?.user?.id;
    if (patUserId) {
      emitToUser(patUserId, 'billing:invoice_created', invoice);
      sendNotification({
        title: 'New Hospital Bill Issued',
        message: `Invoice #${invoice.invoiceNumber} generated for $${(invoice.totalAmount || 0).toFixed(2)}.`,
        userId: patUserId,
        event: 'billing:invoice_created',
        data: invoice
      }).catch(() => {});
    }
  },

  /**
   * Broadcast billing:payment_received
   */
  paymentReceived: async (payment, invoice) => {
    const payload = { payment, invoice };
    emitToRole('ADMIN', 'billing:payment_received', payload);
    emitToRole('RECEPTIONIST', 'billing:payment_received', payload);

    const patUserId = invoice?.patient?.userId || invoice?.patient?.user?.id;
    if (patUserId) {
      emitToUser(patUserId, 'billing:payment_received', payload);
      sendNotification({
        title: 'Payment Received',
        message: `Payment of $${(payment.amount || 0).toFixed(2)} recorded for #${invoice?.invoiceNumber || 'Invoice'}.`,
        userId: patUserId,
        event: 'billing:payment_received',
        data: payload
      }).catch(() => {});
    }
  },

  /**
   * Broadcast patient:registered
   */
  patientRegistered: async (patient) => {
    emitToRole('ADMIN', 'patient:registered', patient);
    emitToRole('RECEPTIONIST', 'patient:registered', patient);
  }
};

export default SocketEvents;
