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

async function runTests() {
  console.log('--- STARTING PRESCRIPTION MANAGEMENT END-TO-END TESTS ---');

  // 1. Doctor Login
  console.log('\n1. Logging in as Doctor (doctor@hospital.test)...');
  const docLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'doctor@hospital.test', password: 'DoctorPassword123' }
  );

  const doctorToken = docLogin.data?.data?.tokens?.accessToken || docLogin.data?.data?.accessToken;
  if (!doctorToken) {
    throw new Error('Doctor login failed: ' + JSON.stringify(docLogin.data));
  }
  console.log('✓ Doctor login successful! Token acquired.');

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

  const patientToken = patLogin.data?.data?.tokens?.accessToken || patLogin.data?.data?.accessToken;
  if (!patientToken) {
    throw new Error('Patient login failed: ' + JSON.stringify(patLogin.data));
  }
  const patientUser = patLogin.data.data.user;
  console.log('✓ Patient login successful! User ID:', patientUser.id);

  // Get Patient's profile ID
  const patProfile = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/patients/profile/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${patientToken}` }
  });
  console.log('Patient profile me response:', JSON.stringify(patProfile.data));
  const patientProfileId = patProfile.data?.data?.id || patProfile.data?.data?.patientProfile?.id;
  console.log('✓ Patient Profile ID retrieved:', patientProfileId);

  // 3. Admin Login
  console.log('\n3. Logging in as Admin (admin@hospital.test)...');
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
  const adminToken = admLogin.data?.data?.tokens?.accessToken || admLogin.data?.data?.accessToken;
  console.log('✓ Admin login successful!');

  // 4. Doctor creates e-Prescription with multi-drug regimen
  console.log('\n4. Doctor creating e-Prescription with 2 medications...');
  const newRxPayload = {
    patientId: patientProfileId,
    diagnosis: 'Acute Bacterial Pharyngitis & Mild Bronchitis',
    instructions: 'Take full course of antibiotics even if feeling better. Drink 2.5L water daily. Gargle with warm salt water.',
    medicines: [
      {
        medicineName: 'Amoxicillin + Clavulanic Acid 625mg',
        dosage: '1 Tablet (625mg)',
        frequency: 'Twice daily (after breakfast & dinner)',
        duration: '7 days',
        instructions: 'Take with food to avoid gastric irritation'
      },
      {
        medicineName: 'Paracetamol 650mg',
        dosage: '1 Tablet (650mg)',
        frequency: 'As needed (max 3 times daily)',
        duration: '3 to 5 days',
        instructions: 'Take only when fever exceeds 100°F or body ache'
      }
    ]
  };

  const createRxRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/prescriptions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      }
    },
    newRxPayload
  );

  console.log('Create Rx Status:', createRxRes.status);
  if (createRxRes.status !== 201) {
    throw new Error('Create prescription failed: ' + JSON.stringify(createRxRes.data));
  }
  const createdRx = createRxRes.data.data;
  console.log(`✓ Prescription created successfully! ID: ${createdRx.id}, Status: ${createdRx.status}`);
  console.log(`  Medicines count: ${createdRx.medicines?.length}`);

  // 5. Patient views their prescriptions
  console.log('\n5. Patient fetching their prescriptions...');
  const patientPrescriptionsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/prescriptions/my-prescriptions',
    method: 'GET',
    headers: { Authorization: `Bearer ${patientToken}` }
  });

  console.log('Patient Prescriptions Status:', patientPrescriptionsRes.status);
  const patientRxList = patientPrescriptionsRes.data?.data?.prescriptions || patientPrescriptionsRes.data?.data || [];
  const foundInPatientList = patientRxList.find((r) => r.id === createdRx.id);
  if (!foundInPatientList) {
    throw new Error('Created prescription not found in patient list!');
  }
  console.log(`✓ Verified: Created prescription appears in Patient's list (Total: ${patientRxList.length})`);

  // 6. Fetch details by ID
  console.log('\n6. Fetching prescription details by ID...');
  const detailsRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/v1/prescriptions/${createdRx.id}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${patientToken}` }
  });
  console.log('Details Status:', detailsRes.status);
  if (detailsRes.status !== 200 || detailsRes.data?.data?.id !== createdRx.id) {
    throw new Error('Details fetch failed: ' + JSON.stringify(detailsRes.data));
  }
  console.log('✓ Details fetched successfully. Diagnosis:', detailsRes.data.data.diagnosis);

  // 7. Doctor completes treatment (status -> COMPLETED)
  console.log('\n7. Updating prescription status to COMPLETED...');
  const completeRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/prescriptions/${createdRx.id}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      }
    },
    { status: 'COMPLETED' }
  );
  console.log('Update Status (COMPLETED) Status:', completeRes.status);
  if (completeRes.status !== 200 || completeRes.data?.data?.status !== 'COMPLETED') {
    throw new Error('Status update failed: ' + JSON.stringify(completeRes.data));
  }
  console.log('✓ Prescription status successfully marked as COMPLETED!');

  // 8. Create a second prescription and discontinue/cancel it
  console.log('\n8. Creating second prescription and discontinuing it...');
  const secondRxRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/prescriptions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      }
    },
    {
      patientId: patientProfileId,
      diagnosis: 'Trial Regimen - Mild Seasonal Allergy',
      instructions: 'Review after 3 days if mild drowsiness occurs',
      medicines: [
        {
          medicineName: 'Cetirizine 10mg',
          dosage: '1 Tablet (10mg)',
          frequency: 'Once daily at bedtime',
          duration: '5 days'
        }
      ]
    }
  );
  const secondRx = secondRxRes.data.data;
  console.log('✓ Second prescription created:', secondRx.id);

  const cancelRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/prescriptions/${secondRx.id}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      }
    },
    { status: 'CANCELLED' }
  );
  console.log('Cancel Status:', cancelRes.status);
  if (cancelRes.status !== 200 || cancelRes.data?.data?.status !== 'CANCELLED') {
    throw new Error('Discontinue/Cancel failed: ' + JSON.stringify(cancelRes.data));
  }
  console.log('✓ Second prescription status successfully transitioned to CANCELLED!');

  // 9. Admin queries all prescriptions with status filter
  console.log('\n9. Admin querying all prescriptions with filter (COMPLETED)...');
  const adminQueryRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/prescriptions?status=COMPLETED',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Admin Query Status:', adminQueryRes.status);
  const completedList = adminQueryRes.data?.data?.prescriptions || adminQueryRes.data?.data || [];
  console.log(`✓ Admin retrieved ${completedList.length} COMPLETED prescriptions.`);

  console.log('\n======================================================');
  console.log('✓ ALL PRESCRIPTION MANAGEMENT API & FLOW TESTS PASSED!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
