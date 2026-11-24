import prisma from '../../database/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { ROLES } from '../../constants/roles.js';
import {
  BILL_STATUS,
  BILL_ITEM_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS
} from './billing.validation.js';

export class BillingService {
  /**
   * Helper: Round number to two decimal places
   */
  static round(val) {
    return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Helper: Generates unique official invoice number
   * Format: INV-YYYYMMDD-XXXX (e.g. INV-20260919-4821)
   */
  static generateInvoiceNumber() {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-${dateStr}-${rand}`;
  }

  /**
   * Helper: Generates unique transaction ID
   * Format: TXN-YYYYMMDD-XXXXXX
   */
  static generateTransactionId() {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `TXN-${dateStr}-${rand}`;
  }

  /**
   * Standardizes database invoice representation for API responses
   */
  static formatInvoiceResponse(bill) {
    if (!bill) return null;

    return {
      id: bill.id,
      invoiceNumber: bill.invoiceNumber,
      status: bill.status,
      totalAmount: bill.totalAmount,
      discount: bill.discount,
      tax: bill.tax,
      paidAmount: bill.paidAmount,
      dueAmount: bill.dueAmount,
      issuedDate: bill.issuedDate,
      dueDate: bill.dueDate,
      notes: bill.notes,
      patient: bill.patient
        ? {
            id: bill.patient.id,
            userId: bill.patient.user?.id,
            name: bill.patient.user?.name,
            email: bill.patient.user?.email,
            phone: bill.patient.user?.phone,
            gender: bill.patient.gender,
            bloodGroup: bill.patient.bloodGroup,
            emergencyContact: bill.patient.emergencyContact,
            address: bill.patient.address
          }
        : null,
      doctor: bill.doctor
        ? {
            id: bill.doctor.id,
            userId: bill.doctor.user?.id,
            name: bill.doctor.user?.name,
            email: bill.doctor.user?.email,
            phone: bill.doctor.user?.phone,
            specialization: bill.doctor.specialization,
            department: bill.doctor.department
          }
        : null,
      appointment: bill.appointment
        ? {
            id: bill.appointment.id,
            appointmentDate: bill.appointment.appointmentDate,
            timeSlot: bill.appointment.timeSlot,
            status: bill.appointment.status,
            reason: bill.appointment.reason
          }
        : null,
      items: (bill.items || []).map((item) => ({
        id: item.id,
        itemType: item.itemType,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      payments: (bill.payments || []).map((p) => ({
        id: p.id,
        transactionId: p.transactionId,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        status: p.status,
        paidAt: p.paidAt,
        notes: p.notes
      })),
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt
    };
  }

  /**
   * Resolves target PatientProfile
   */
  static async resolvePatient(patientId) {
    let patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient) {
      patient = await prisma.patientProfile.findFirst({
        where: { userId: patientId },
        include: { user: true }
      });
    }

    if (!patient) {
      throw ApiError.notFound(`Patient with ID '${patientId}' was not found.`);
    }

    return patient;
  }

  /**
   * Resolves optional DoctorProfile
   */
  static async resolveDoctor(doctorId) {
    if (!doctorId) return null;

    let doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true }
    });

    if (!doctor) {
      doctor = await prisma.doctorProfile.findFirst({
        where: { userId: doctorId },
        include: { user: true }
      });
    }

    if (!doctor) {
      throw ApiError.notFound(`Doctor with ID '${doctorId}' was not found.`);
    }

    return doctor;
  }

  /**
   * Create a new hospital Invoice with line items
   */
  static async createInvoice(data, currentUser) {
    const patient = await this.resolvePatient(data.patientId);
    const doctor = await this.resolveDoctor(data.doctorId);

    let appointment = null;
    if (data.appointmentId) {
      appointment = await prisma.appointment.findUnique({
        where: { id: data.appointmentId }
      });
      if (!appointment) {
        throw ApiError.notFound(`Appointment with ID '${data.appointmentId}' was not found.`);
      }
    }

    // Process line items & calculate financial totals
    const preparedItems = data.items.map((item) => {
      const qty = parseInt(item.quantity, 10) || 1;
      const unit = parseFloat(item.unitPrice) || 0;
      const itemTotal = this.round(qty * unit);
      return {
        itemType: item.itemType,
        description: item.description.trim(),
        quantity: qty,
        unitPrice: unit,
        totalPrice: itemTotal
      };
    });

    const subtotal = preparedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const discount = this.round(parseFloat(data.discount) || 0);
    const tax = this.round(parseFloat(data.tax) || 0);
    const totalAmount = Math.max(0, this.round(subtotal - discount + tax));
    const dueAmount = totalAmount;
    const initialStatus = totalAmount === 0 ? BILL_STATUS.PAID : BILL_STATUS.PENDING;

    // Retry loop for unique invoice number in rare collision
    let invoiceNumber = this.generateInvoiceNumber();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.bill.findUnique({ where: { invoiceNumber } });
      if (!existing) break;
      invoiceNumber = this.generateInvoiceNumber();
      attempts++;
    }

    const createdBill = await prisma.$transaction(async (tx) => {
      return await tx.bill.create({
        data: {
          invoiceNumber,
          patientId: patient.id,
          doctorId: doctor?.id || null,
          appointmentId: appointment?.id || null,
          totalAmount,
          discount,
          tax,
          paidAmount: 0.0,
          dueAmount,
          status: initialStatus,
          issuedDate: new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: data.notes?.trim() || null,
          items: {
            create: preparedItems
          }
        },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          appointment: true,
          items: true,
          payments: true
        }
      });
    });

    return this.formatInvoiceResponse(createdBill);
  }

  /**
   * List invoices with filtering, search, and pagination
   */
  static async getAllInvoices(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const where = {};

    if (query.status) {
      where.status = query.status.toUpperCase();
    }

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.doctorId) {
      where.doctorId = query.doctorId;
    }

    if (query.startDate || query.endDate) {
      where.issuedDate = {};
      if (query.startDate) where.issuedDate.gte = new Date(query.startDate);
      if (query.endDate) where.issuedDate.lte = new Date(query.endDate);
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { invoiceNumber: { contains: term } },
        { notes: { contains: term } },
        { patient: { user: { name: { contains: term } } } },
        { patient: { user: { email: { contains: term } } } }
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = (query.sortOrder || 'desc').toLowerCase();

    const [total, bills] = await Promise.all([
      prisma.bill.count({ where }),
      prisma.bill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          appointment: true,
          items: true,
          payments: true
        }
      })
    ]);

    return {
      invoices: bills.map((b) => this.formatInvoiceResponse(b)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Retrieve single invoice by ID with ownership enforcement
   */
  static async getInvoiceById(id, currentUser) {
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true,
        items: true,
        payments: { orderBy: { paidAt: 'desc' } }
      }
    });

    if (!bill) {
      throw ApiError.notFound(`Invoice with ID '${id}' was not found.`);
    }

    // Role-based access validation
    if (currentUser.role === ROLES.PATIENT) {
      if (bill.patient?.userId !== currentUser.id) {
        throw ApiError.forbidden('You are not authorized to view this billing record.');
      }
    }

    return this.formatInvoiceResponse(bill);
  }

  /**
   * Process and record a payment transaction against an invoice
   */
  static async recordPayment(invoiceId, paymentData, currentUser) {
    const bill = await prisma.bill.findUnique({
      where: { id: invoiceId },
      include: {
        patient: { include: { user: true } },
        payments: true
      }
    });

    if (!bill) {
      throw ApiError.notFound(`Invoice with ID '${invoiceId}' was not found.`);
    }

    // Role check: Patients can only pay their own invoices
    if (currentUser.role === ROLES.PATIENT && bill.patient?.userId !== currentUser.id) {
      throw ApiError.forbidden('You are not authorized to make payments for this invoice.');
    }

    if (bill.status === BILL_STATUS.CANCELLED) {
      throw ApiError.badRequest('Cannot record payment against a cancelled invoice.');
    }

    if (bill.dueAmount <= 0.001) {
      throw ApiError.badRequest('This invoice has already been fully paid.');
    }

    const payAmount = this.round(parseFloat(paymentData.amount));
    if (payAmount <= 0) {
      throw ApiError.badRequest('Payment amount must be greater than zero.');
    }

    if (payAmount > this.round(bill.dueAmount + 0.01)) {
      throw ApiError.badRequest(
        `Payment amount ($${payAmount.toFixed(2)}) exceeds outstanding due balance ($${bill.dueAmount.toFixed(2)}).`
      );
    }

    // Generate unique transaction ID
    let transactionId = this.generateTransactionId();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.payment.findUnique({ where: { transactionId } });
      if (!existing) break;
      transactionId = this.generateTransactionId();
      attempts++;
    }

    const updatedBill = await prisma.$transaction(async (tx) => {
      // 1. Create Payment transaction
      await tx.payment.create({
        data: {
          transactionId,
          billId: bill.id,
          patientId: bill.patientId,
          amount: payAmount,
          paymentMethod: paymentData.paymentMethod,
          status: PAYMENT_STATUS.SUCCESS,
          paidAt: new Date(),
          notes: paymentData.notes?.trim() || null
        }
      });

      // 2. Re-calculate paid and due balance
      const newPaidAmount = this.round(bill.paidAmount + payAmount);
      const newDueAmount = Math.max(0, this.round(bill.totalAmount - newPaidAmount));
      const newStatus = newDueAmount <= 0.001 ? BILL_STATUS.PAID : BILL_STATUS.PARTIALLY_PAID;

      // 3. Update Bill
      return await tx.bill.update({
        where: { id: bill.id },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newStatus
        },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          appointment: true,
          items: true,
          payments: { orderBy: { paidAt: 'desc' } }
        }
      });
    });

    return this.formatInvoiceResponse(updatedBill);
  }

  /**
   * Cancel an invoice (Admin only, requires zero payments)
   */
  static async cancelInvoice(invoiceId, reason = null) {
    const bill = await prisma.bill.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!bill) {
      throw ApiError.notFound(`Invoice with ID '${invoiceId}' was not found.`);
    }

    if (bill.paidAmount > 0 || bill.payments.length > 0) {
      throw ApiError.badRequest(
        'Cannot cancel an invoice with recorded payments. Please void or refund transactions first.'
      );
    }

    if (bill.status === BILL_STATUS.CANCELLED) {
      throw ApiError.badRequest('Invoice is already cancelled.');
    }

    const cancellationNote = reason
      ? `${bill.notes ? bill.notes + ' | ' : ''}Cancellation Reason: ${reason}`
      : bill.notes;

    const cancelledBill = await prisma.bill.update({
      where: { id: invoiceId },
      data: {
        status: BILL_STATUS.CANCELLED,
        dueAmount: 0.0,
        notes: cancellationNote
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true,
        items: true,
        payments: true
      }
    });

    return this.formatInvoiceResponse(cancelledBill);
  }

  /**
   * Update invoice notes, due date, tax, discount (if not fully paid)
   */
  static async updateInvoice(invoiceId, updateData) {
    const bill = await prisma.bill.findUnique({
      where: { id: invoiceId },
      include: { items: true, payments: true }
    });

    if (!bill) {
      throw ApiError.notFound(`Invoice with ID '${invoiceId}' was not found.`);
    }

    if (bill.status === BILL_STATUS.CANCELLED) {
      throw ApiError.badRequest('Cannot update a cancelled invoice.');
    }

    const patch = {};
    if (updateData.notes !== undefined) patch.notes = updateData.notes;
    if (updateData.dueDate !== undefined) patch.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;

    if (updateData.discount !== undefined || updateData.tax !== undefined) {
      if (bill.paidAmount > 0) {
        throw ApiError.badRequest('Cannot recalculate tax/discount on an invoice with active payments.');
      }
      const subtotal = bill.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const discount = updateData.discount !== undefined ? this.round(updateData.discount) : bill.discount;
      const tax = updateData.tax !== undefined ? this.round(updateData.tax) : bill.tax;
      const totalAmount = Math.max(0, this.round(subtotal - discount + tax));

      patch.discount = discount;
      patch.tax = tax;
      patch.totalAmount = totalAmount;
      patch.dueAmount = totalAmount;
      patch.status = totalAmount === 0 ? BILL_STATUS.PAID : BILL_STATUS.PENDING;
    }

    const updated = await prisma.bill.update({
      where: { id: invoiceId },
      data: patch,
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true,
        items: true,
        payments: true
      }
    });

    return this.formatInvoiceResponse(updated);
  }

  /**
   * Query all payment transactions
   */
  static async getAllPayments(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const where = {};
    if (query.patientId) where.patientId = query.patientId;
    if (query.billId) where.billId = query.billId;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod.toUpperCase();

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: {
          patient: { include: { user: true } },
          bill: true
        }
      })
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Comprehensive Hospital Billing & Financial Analytics
   */
  static async getStatistics(query = {}) {
    const today = new Date();
    const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

    const [
      totalInvoices,
      pendingCount,
      partiallyPaidCount,
      paidCount,
      cancelledCount,
      allBills,
      todayPayments,
      allSuccessfulPayments,
      recentPayments
    ] = await Promise.all([
      prisma.bill.count(),
      prisma.bill.count({ where: { status: BILL_STATUS.PENDING } }),
      prisma.bill.count({ where: { status: BILL_STATUS.PARTIALLY_PAID } }),
      prisma.bill.count({ where: { status: BILL_STATUS.PAID } }),
      prisma.bill.count({ where: { status: BILL_STATUS.CANCELLED } }),
      prisma.bill.findMany({
        where: { status: { not: BILL_STATUS.CANCELLED } },
        select: { totalAmount: true, paidAmount: true, dueAmount: true }
      }),
      prisma.payment.findMany({
        where: {
          status: PAYMENT_STATUS.SUCCESS,
          paidAt: { gte: startOfToday, lte: endOfToday }
        },
        select: { amount: true }
      }),
      prisma.payment.findMany({
        where: { status: PAYMENT_STATUS.SUCCESS },
        select: { amount: true, paymentMethod: true }
      }),
      prisma.payment.findMany({
        take: 8,
        orderBy: { paidAt: 'desc' },
        include: {
          patient: { include: { user: true } },
          bill: { select: { invoiceNumber: true } }
        }
      })
    ]);

    // Financial aggregates
    const totalBilled = this.round(allBills.reduce((sum, b) => sum + b.totalAmount, 0));
    const totalCollected = this.round(allBills.reduce((sum, b) => sum + b.paidAmount, 0));
    const totalOutstanding = this.round(allBills.reduce((sum, b) => sum + b.dueAmount, 0));
    const todayCollectionAmount = this.round(todayPayments.reduce((sum, p) => sum + p.amount, 0));

    // Breakdown by payment method
    const paymentMethodBreakdown = {};
    for (const method of Object.values(PAYMENT_METHODS)) {
      paymentMethodBreakdown[method] = 0;
    }
    for (const p of allSuccessfulPayments) {
      paymentMethodBreakdown[p.paymentMethod] = this.round(
        (paymentMethodBreakdown[p.paymentMethod] || 0) + p.amount
      );
    }

    return {
      financials: {
        totalBilled,
        totalCollected,
        totalOutstanding,
        todayCollectionAmount,
        collectionRate: totalBilled > 0 ? this.round((totalCollected / totalBilled) * 100) : 0
      },
      invoiceCounts: {
        total: totalInvoices,
        pending: pendingCount,
        partiallyPaid: partiallyPaidCount,
        paid: paidCount,
        cancelled: cancelledCount
      },
      paymentMethodBreakdown,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        transactionId: p.transactionId,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        paidAt: p.paidAt,
        patientName: p.patient?.user?.name || 'Patient',
        invoiceNumber: p.bill?.invoiceNumber
      }))
    };
  }

  /**
   * System metadata (supported statuses, methods, line item types)
   */
  static getMetadata() {
    return {
      statuses: Object.values(BILL_STATUS),
      itemTypes: Object.values(BILL_ITEM_TYPES),
      paymentMethods: Object.values(PAYMENT_METHODS),
      paymentStatuses: Object.values(PAYMENT_STATUS)
    };
  }
}
