import http from 'http';
import { app } from '../src/app.js';
import prisma from '../src/database/prisma.js';
import { ROLES } from '../src/constants/roles.js';

let server;
let baseUrl;

const runTests = async () => {
  console.log('🧪 Starting Billing & Payments Module Automated Integration Tests...\n');

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Setup] Test server listening on ${baseUrl}`);
      resolve();
    });
  });

  let adminToken = '';
  let doctorToken = '';
  let doctorId = '';
  let patient1Token = '';
  let patient1Id = '';
  let patient2Token = '';
  let patient2Id = '';
  let invoice1Id = '';
  let invoice2Id = '';
  const cleanupUserIds = [];

  try {
    // -------------------------------------------------------------------
    // Test 1: Metadata Check
    // -------------------------------------------------------------------
    console.log('Test 1: GET /api/v1/billing/metadata');
    const metaRes = await fetch(`${baseUrl}/api/v1/billing/metadata`);
    const metaJson = await metaRes.json();
    if (metaRes.status !== 200) {
      throw new Error(`Metadata fetch failed: ${JSON.stringify(metaJson)}`);
    }
    const expectedStatuses = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'];
    for (const s of expectedStatuses) {
      if (!metaJson.data.statuses.includes(s)) {
        throw new Error(`Missing expected billing status: ${s}`);
      }
    }
    const expectedMethods = ['CASH', 'CREDIT_CARD', 'ONLINE', 'UPI'];
    for (const m of expectedMethods) {
      if (!metaJson.data.paymentMethods.includes(m)) {
        throw new Error(`Missing expected payment method: ${m}`);
      }
    }
    console.log(`  ✅ Returned all statuses: ${metaJson.data.statuses.join(', ')}`);
    console.log(`  ✅ Returned all payment methods: ${metaJson.data.paymentMethods.join(', ')}`);

    // -------------------------------------------------------------------
    // Test 2: Setup Test Accounts: Admin, Doctor, and 2 Patients
    // -------------------------------------------------------------------
    console.log('\nTest 2: Setup Admin, Doctor, and Patient accounts');
    const timestamp = Date.now();

    // Admin
    const adminRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Finance Admin',
        email: `finance_admin_${timestamp}@hospital.test`,
        password: 'AdminPassword123',
        role: ROLES.ADMIN
      })
    });
    const adminData = await adminRes.json();
    adminToken = adminData.data.tokens.accessToken;
    cleanupUserIds.push(adminData.data.user.id);

    // Doctor
    const docRes = await fetch(`${baseUrl}/api/v1/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Allison Cameron',
        email: `doctor_cameron_${timestamp}@hospital.test`,
        password: 'DoctorPassword123',
        specialization: 'Neurologist',
        department: 'Diagnostic Medicine'
      })
    });
    const docJson = await docRes.json();
    if (!docJson.data?.id) {
      throw new Error(`Failed to create doctor: ${JSON.stringify(docJson)}`);
    }
    doctorId = docJson.data.id;
    const docUserId = docJson.data.userId || docJson.data.user?.id;
    if (docUserId) cleanupUserIds.push(docUserId);

    const docLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `doctor_cameron_${timestamp}@hospital.test`,
        password: 'DoctorPassword123'
      })
    });
    const docLoginData = await docLoginRes.json();
    doctorToken = docLoginData.data.tokens.accessToken;

    // Patient 1
    const p1Res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arthur Dent',
        email: `arthur_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const p1Data = await p1Res.json();
    patient1Token = p1Data.data.tokens.accessToken;
    patient1Id = p1Data.data.user.id;
    cleanupUserIds.push(patient1Id);

    // Patient 2
    const p2Res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ford Prefect',
        email: `ford_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const p2Data = await p2Res.json();
    patient2Token = p2Data.data.tokens.accessToken;
    patient2Id = p2Data.data.user.id;
    cleanupUserIds.push(patient2Id);

    console.log('  ✅ Admin, Doctor, and 2 Patients registered and initialized');

    // -------------------------------------------------------------------
    // Test 3: Admin generates Invoice with line items, tax, and discount
    // -------------------------------------------------------------------
    console.log('\nTest 3: POST /api/v1/billing/invoices - Generate Invoice');
    const invoicePayload = {
      patientId: patient1Id,
      doctorId: doctorId,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      discount: 20.0,
      tax: 10.0,
      notes: 'Initial clinical evaluation, allergy panel, and antihistamine course.',
      items: [
        {
          itemType: 'CONSULTATION',
          description: 'Specialist Immunology Consultation (Dr. Cameron)',
          quantity: 1,
          unitPrice: 150.0
        },
        {
          itemType: 'LAB_TEST',
          description: 'Comprehensive Allergen Blood Panel',
          quantity: 2,
          unitPrice: 60.0
        },
        {
          itemType: 'MEDICATION',
          description: 'Prescription Antihistamine 10mg (30 Tablets)',
          quantity: 1,
          unitPrice: 30.0
        }
      ]
    };

    const createRes = await fetch(`${baseUrl}/api/v1/billing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify(invoicePayload)
    });
    const createJson = await createRes.json();
    if (createRes.status !== 201 || !createJson.data) {
      throw new Error(`Failed to create invoice: ${JSON.stringify(createJson)}`);
    }

    const created = createJson.data;
    invoice1Id = created.id;

    // Verify Calculations:
    // Subtotal: (1 * 150) + (2 * 60) + (1 * 30) = 150 + 120 + 30 = 300
    // TotalAmount: 300 - 20 (discount) + 10 (tax) = 290
    if (created.totalAmount !== 290) {
      throw new Error(`Expected totalAmount 290, got: ${created.totalAmount}`);
    }
    if (created.dueAmount !== 290) {
      throw new Error(`Expected dueAmount 290, got: ${created.dueAmount}`);
    }
    if (created.paidAmount !== 0) {
      throw new Error(`Expected paidAmount 0, got: ${created.paidAmount}`);
    }
    if (created.status !== 'PENDING') {
      throw new Error(`Expected status PENDING, got: ${created.status}`);
    }
    if (created.items.length !== 3) {
      throw new Error(`Expected 3 items, got: ${created.items.length}`);
    }

    console.log(`  ✅ Invoice created successfully: ${created.invoiceNumber}`);
    console.log(`     Total: $${created.totalAmount} | Due: $${created.dueAmount} | Status: ${created.status}`);

    // -------------------------------------------------------------------
    // Test 4: Get Invoice Details by ID
    // -------------------------------------------------------------------
    console.log('\nTest 4: GET /api/v1/billing/invoices/:id - Retrieve Details');
    const detailsRes = await fetch(`${baseUrl}/api/v1/billing/invoices/${invoice1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const detailsJson = await detailsRes.json();
    if (detailsRes.status !== 200 || detailsJson.data.id !== invoice1Id) {
      throw new Error(`Failed to get invoice details: ${JSON.stringify(detailsJson)}`);
    }
    console.log(`  ✅ Details retrieved. Patient: ${detailsJson.data.patient?.name}`);

    // -------------------------------------------------------------------
    // Test 5: Patient 1 views their own invoices
    // -------------------------------------------------------------------
    console.log('\nTest 5: GET /api/v1/billing/invoices/my-invoices');
    const myInvoicesRes = await fetch(`${baseUrl}/api/v1/billing/invoices/my-invoices`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    });
    const myInvoicesJson = await myInvoicesRes.json();
    if (myInvoicesRes.status !== 200 || !myInvoicesJson.data.invoices) {
      throw new Error(`Failed to fetch my-invoices: ${JSON.stringify(myInvoicesJson)}`);
    }
    const foundMine = myInvoicesJson.data.invoices.find((i) => i.id === invoice1Id);
    if (!foundMine) {
      throw new Error('Created invoice was not found in patient 1 my-invoices list');
    }
    console.log(`  ✅ Patient 1 successfully retrieved their invoice (Total found: ${myInvoicesJson.data.invoices.length})`);

    // -------------------------------------------------------------------
    // Test 6: Partial Payment by Patient ($100 via CREDIT_CARD)
    // -------------------------------------------------------------------
    console.log('\nTest 6: POST /api/v1/billing/invoices/:id/payments - Record Partial Payment');
    const pay1Res = await fetch(`${baseUrl}/api/v1/billing/invoices/${invoice1Id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        amount: 100.0,
        paymentMethod: 'CREDIT_CARD',
        notes: 'Online credit card payment installment 1'
      })
    });
    const pay1Json = await pay1Res.json();
    if (pay1Res.status !== 200) {
      throw new Error(`Partial payment failed: ${JSON.stringify(pay1Json)}`);
    }
    const afterPay1 = pay1Json.data;
    if (afterPay1.paidAmount !== 100.0 || afterPay1.dueAmount !== 190.0 || afterPay1.status !== 'PARTIALLY_PAID') {
      throw new Error(`Invalid state after partial payment: Paid: ${afterPay1.paidAmount}, Due: ${afterPay1.dueAmount}, Status: ${afterPay1.status}`);
    }
    if (afterPay1.payments.length !== 1) {
      throw new Error(`Expected 1 payment record, got: ${afterPay1.payments.length}`);
    }
    console.log(`  ✅ Partial payment processed: Paid: $${afterPay1.paidAmount}, Due: $${afterPay1.dueAmount}, Status: ${afterPay1.status}`);

    // -------------------------------------------------------------------
    // Test 7: Final Payment ($190 via ONLINE) -> Full Settle (PAID)
    // -------------------------------------------------------------------
    console.log('\nTest 7: Record Final Balance Payment -> Transition to PAID');
    const pay2Res = await fetch(`${baseUrl}/api/v1/billing/invoices/${invoice1Id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        amount: 190.0,
        paymentMethod: 'ONLINE',
        notes: 'Final balance settlement via portal'
      })
    });
    const pay2Json = await pay2Res.json();
    if (pay2Res.status !== 200) {
      throw new Error(`Final payment failed: ${JSON.stringify(pay2Json)}`);
    }
    const afterPay2 = pay2Json.data;
    if (afterPay2.paidAmount !== 290.0 || afterPay2.dueAmount !== 0.0 || afterPay2.status !== 'PAID') {
      throw new Error(`Invalid state after full payment: Paid: ${afterPay2.paidAmount}, Due: ${afterPay2.dueAmount}, Status: ${afterPay2.status}`);
    }
    console.log(`  ✅ Final payment processed: Paid: $${afterPay2.paidAmount}, Due: $${afterPay2.dueAmount}, Status: ${afterPay2.status}`);

    // -------------------------------------------------------------------
    // Test 8: Prevent Overpayment on fully settled invoice
    // -------------------------------------------------------------------
    console.log('\nTest 8: Prevent overpayment when invoice is already PAID');
    const overpayRes = await fetch(`${baseUrl}/api/v1/billing/invoices/${invoice1Id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        amount: 50.0,
        paymentMethod: 'CASH'
      })
    });
    if (overpayRes.status !== 400) {
      throw new Error(`Expected 400 on overpaying settled invoice, got: ${overpayRes.status}`);
    }
    console.log('  ✅ Overpayment correctly blocked with 400 Bad Request');

    // -------------------------------------------------------------------
    // Test 9: Create Invoice 2 and Cancel it (Admin)
    // -------------------------------------------------------------------
    console.log('\nTest 9: Create second invoice and test cancellation');
    const inv2Res = await fetch(`${baseUrl}/api/v1/billing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        patientId: patient2Id,
        notes: 'Routine checkup invoice (to be cancelled)',
        items: [
          {
            itemType: 'CONSULTATION',
            description: 'Routine Health Check',
            quantity: 1,
            unitPrice: 80.0
          }
        ]
      })
    });
    const inv2Json = await inv2Res.json();
    invoice2Id = inv2Json.data.id;

    const cancelRes = await fetch(`${baseUrl}/api/v1/billing/invoices/${invoice2Id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ reason: 'Patient cancelled consultation appointment' })
    });
    const cancelJson = await cancelRes.json();
    if (cancelRes.status !== 200 || cancelJson.data.status !== 'CANCELLED') {
      throw new Error(`Cancellation failed: ${JSON.stringify(cancelJson)}`);
    }
    console.log(`  ✅ Invoice 2 cancelled successfully. Status: ${cancelJson.data.status}`);

    // Prevent payment on cancelled invoice
    const payCancelledRes = await fetch(`${baseUrl}/api/v1/billing/invoices/${invoice2Id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ amount: 80.0, paymentMethod: 'CASH' })
    });
    if (payCancelledRes.status !== 400) {
      throw new Error(`Expected 400 on paying cancelled invoice, got: ${payCancelledRes.status}`);
    }
    console.log('  ✅ Payment on cancelled invoice correctly blocked with 400 Bad Request');

    // Prevent cancelling an invoice with recorded payments
    const cancelPaidRes = await fetch(`${baseUrl}/api/v1/billing/invoices/${invoice1Id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ reason: 'Attempting invalid cancellation' })
    });
    if (cancelPaidRes.status !== 400) {
      throw new Error(`Expected 400 when cancelling paid invoice, got: ${cancelPaidRes.status}`);
    }
    console.log('  ✅ Cancelling invoice with recorded payments correctly blocked with 400 Bad Request');

    // -------------------------------------------------------------------
    // Test 10: RBAC Authorization Restrictions
    // -------------------------------------------------------------------
    console.log('\nTest 10: RBAC Enforcement');

    // 10a. Patient cannot create an invoice (requires ADMIN or RECEPTIONIST)
    const patientCreateRes = await fetch(`${baseUrl}/api/v1/billing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        patientId: patient1Id,
        items: [{ itemType: 'CONSULTATION', description: 'Test', quantity: 1, unitPrice: 50 }]
      })
    });
    if (patientCreateRes.status !== 403) {
      throw new Error(`Expected 403 when Patient attempts invoice creation, got: ${patientCreateRes.status}`);
    }
    console.log('  ✅ Patient blocked from generating invoices (403 Forbidden)');

    // 10b. Patient 2 cannot access Patient 1's invoice
    const p2AccessP1Res = await fetch(`${baseUrl}/api/v1/billing/invoices/${invoice1Id}`, {
      headers: { Authorization: `Bearer ${patient2Token}` }
    });
    if (p2AccessP1Res.status !== 403) {
      throw new Error(`Expected 403 when Patient 2 accesses Patient 1 invoice, got: ${p2AccessP1Res.status}`);
    }
    console.log('  ✅ Cross-patient unauthorized invoice access blocked (403 Forbidden)');

    // 10c. Patient 2 cannot pay Patient 1's invoice
    const p2PayP1Res = await fetch(`${baseUrl}/api/v1/billing/invoices/${invoice1Id}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`
      },
      body: JSON.stringify({ amount: 10, paymentMethod: 'ONLINE' })
    });
    if (p2PayP1Res.status !== 403) {
      throw new Error(`Expected 403 when Patient 2 attempts payment on Patient 1 bill, got: ${p2PayP1Res.status}`);
    }
    console.log('  ✅ Cross-patient payment unauthorized attempt blocked (403 Forbidden)');

    // -------------------------------------------------------------------
    // Test 11: Financial Analytics & Dashboard Statistics
    // -------------------------------------------------------------------
    console.log('\nTest 11: GET /api/v1/billing/stats - Financial Analytics');
    const statsRes = await fetch(`${baseUrl}/api/v1/billing/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const statsJson = await statsRes.json();
    if (statsRes.status !== 200 || !statsJson.data.financials) {
      throw new Error(`Stats fetch failed: ${JSON.stringify(statsJson)}`);
    }
    const financials = statsJson.data.financials;
    console.log('  ✅ Financial Metrics:');
    console.log(`     Total Billed: $${financials.totalBilled}`);
    console.log(`     Total Collected: $${financials.totalCollected}`);
    console.log(`     Total Outstanding: $${financials.totalOutstanding}`);
    console.log(`     Collection Rate: ${financials.collectionRate}%`);
    console.log(`     Paid Invoices: ${statsJson.data.invoiceCounts.paid}`);

    // -------------------------------------------------------------------
    // Test 12: Admin lists payment ledger
    // -------------------------------------------------------------------
    console.log('\nTest 12: GET /api/v1/billing/payments - Payments Ledger');
    const paymentsRes = await fetch(`${baseUrl}/api/v1/billing/payments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const paymentsJson = await paymentsRes.json();
    if (paymentsRes.status !== 200 || !paymentsJson.data.payments) {
      throw new Error(`Payments ledger fetch failed: ${JSON.stringify(paymentsJson)}`);
    }
    console.log(`  ✅ Retrieved ${paymentsJson.data.payments.length} payment transactions in ledger.`);

    console.log('\n======================================================');
    console.log('🎉 ALL 12 BILLING & PAYMENTS TEST SUITES PASSED!');
    console.log('======================================================\n');
  } finally {
    // Teardown test accounts cleanly
    if (cleanupUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: cleanupUserIds } }
      });
      console.log('[Test Teardown] Cleaned up temporary test accounts.');
    }
    server.close();
    console.log('[Test Teardown] Test server closed cleanly.');
  }
};

runTests().catch((err) => {
  console.error('\n❌ BILLING TEST FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
