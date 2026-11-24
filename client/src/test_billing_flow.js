import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runFlow() {
  console.log('--- STARTING BILLING & PAYMENTS WORKFLOW INTEGRATION TEST ---');

  // 1. Admin Login
  console.log('\n1. Logging in as Admin (admin@hospital.test)...');
  const admLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'admin@hospital.test', password: 'AdminPassword123' }
  );
  const adminToken = admLogin.data?.data?.tokens?.accessToken;
  if (!adminToken) throw new Error('Admin login failed: ' + JSON.stringify(admLogin.data));
  console.log('✓ Admin login successful!');

  // 2. Patient Login
  console.log('\n2. Logging in as Patient (patient@hospital.test)...');
  const patLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'patient@hospital.test', password: 'PatientPassword123' }
  );
  const patientToken = patLogin.data?.data?.tokens?.accessToken;
  if (!patientToken) throw new Error('Patient login failed: ' + JSON.stringify(patLogin.data));
  console.log('✓ Patient login successful! Name: Sarah Connor');

  // Resolve Sarah Connor's patientProfile ID
  const pProfileRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/patients/profile/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${patientToken}` }
  });
  const patientProfileId = pProfileRes.data?.data?.id || pProfileRes.data?.data?.profile?.id;
  console.log('✓ Patient Profile ID:', patientProfileId);

  // 3. Admin queries initial statistics
  console.log('\n3. Admin querying initial billing statistics...');
  const initStatsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/billing/stats',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✓ Initial Billed:', initStatsRes.data?.data?.financials?.totalBilled);
  console.log('✓ Initial Collected:', initStatsRes.data?.data?.financials?.totalCollected);

  // 4. Admin creates invoice for Sarah Connor
  console.log('\n4. Admin generating new hospital invoice for Sarah Connor...');
  const createInvRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/billing/invoices',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      }
    },
    {
      patientId: patientProfileId,
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
      discount: 20.0,
      tax: 10.0,
      notes: 'Outpatient cardiology consultation, resting ECG, and beta-blocker prescription.',
      items: [
        {
          itemType: 'CONSULTATION',
          description: 'Specialist Cardiology Consultation',
          quantity: 1,
          unitPrice: 150.0
        },
        {
          itemType: 'PROCEDURE',
          description: '12-Lead Resting Electrocardiogram (ECG)',
          quantity: 1,
          unitPrice: 80.0
        },
        {
          itemType: 'MEDICATION',
          description: 'Cardiovascular Therapy - Metoprolol 50mg',
          quantity: 1,
          unitPrice: 40.0
        }
      ]
    }
  );

  if (createInvRes.status !== 201 || !createInvRes.data?.data?.id) {
    throw new Error('Invoice creation failed: ' + JSON.stringify(createInvRes.data));
  }
  const createdInvoice = createInvRes.data.data;
  console.log(`✓ Invoice created: ${createdInvoice.invoiceNumber}`);
  console.log(`  Subtotal: $270 | Discount: $20 | Tax: $10 | Total: $${createdInvoice.totalAmount} | Due: $${createdInvoice.dueAmount}`);

  // 5. Patient fetches their invoices
  console.log('\n5. Patient fetching their invoices from /my-invoices...');
  const patientInvoicesRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/billing/invoices/my-invoices',
    method: 'GET',
    headers: { Authorization: `Bearer ${patientToken}` }
  });
  const patInvoicesList = patientInvoicesRes.data?.data?.invoices || [];
  const found = patInvoicesList.find((i) => i.id === createdInvoice.id);
  if (!found) throw new Error('Created invoice not found in patient invoice list!');
  console.log(`✓ Found invoice #${found.invoiceNumber} in patient statement list with status: ${found.status}`);

  // 6. Patient makes a partial payment ($100 via ONLINE)
  console.log('\n6. Patient submitting partial payment ($100 via ONLINE)...');
  const pay1Res = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/billing/invoices/${createdInvoice.id}/payments`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      }
    },
    {
      amount: 100.0,
      paymentMethod: 'ONLINE',
      notes: 'First installment via patient online portal'
    }
  );

  if (pay1Res.status !== 200) throw new Error('Partial payment failed: ' + JSON.stringify(pay1Res.data));
  const afterPay1 = pay1Res.data.data;
  console.log(`✓ Partial payment successful! Paid: $${afterPay1.paidAmount} | Remaining Due: $${afterPay1.dueAmount} | Status: ${afterPay1.status}`);

  // 7. Patient pays remaining balance ($160 via CREDIT_CARD)
  console.log('\n7. Patient paying remaining balance ($160 via CREDIT_CARD)...');
  const pay2Res = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/billing/invoices/${createdInvoice.id}/payments`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      }
    },
    {
      amount: 160.0,
      paymentMethod: 'CREDIT_CARD',
      notes: 'Final balance settlement via Visa credit card'
    }
  );

  if (pay2Res.status !== 200) throw new Error('Final payment failed: ' + JSON.stringify(pay2Res.data));
  const afterPay2 = pay2Res.data.data;
  console.log(`✓ Final payment successful! Paid: $${afterPay2.paidAmount} | Remaining Due: $${afterPay2.dueAmount} | Status: ${afterPay2.status}`);

  // 8. Verify invoice details by ID
  console.log('\n8. Verifying full invoice statement details by ID...');
  const detailsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/v1/billing/invoices/${createdInvoice.id}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${patientToken}` }
  });
  const details = detailsRes.data.data;
  console.log(`✓ Statement verified. Payments count: ${details.payments?.length}`);
  details.payments.forEach((p, idx) => {
    console.log(`   ${idx + 1}. [${p.transactionId}] $${p.amount} via ${p.paymentMethod} on ${p.paidAt}`);
  });

  // 9. Admin queries updated statistics
  console.log('\n9. Admin querying updated statistics...');
  const finalStatsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/billing/stats',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const finalFin = finalStatsRes.data?.data?.financials;
  console.log(`✓ Updated Total Billed: $${finalFin.totalBilled}`);
  console.log(`✓ Updated Total Collected: $${finalFin.totalCollected}`);
  console.log(`✓ Updated Collection Rate: ${finalFin.collectionRate}%`);

  console.log('\n================================================================');
  console.log('✓ ALL BILLING & PAYMENTS WORKFLOW INTEGRATION TESTS COMPLETED!');
  console.log('================================================================\n');
}

runFlow().catch((err) => {
  console.error('❌ TEST RUN FAILED:', err);
  process.exit(1);
});
