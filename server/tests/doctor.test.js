import http from 'http';
import { app } from '../src/app.js';
import prisma from '../src/database/prisma.js';
import { ROLES } from '../src/constants/roles.js';

let server;
let baseUrl;

const runTests = async () => {
  console.log('🧪 Starting Doctor Module Automated Integration Tests...\n');

  // Start temporary server
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
  let patientToken = '';
  let createdDoctorId = '';
  let secondDoctorId = '';

  try {
    // 1. Check /health
    console.log('Test 1: Health check endpoint');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    if (healthRes.status !== 200 || healthJson.data?.status !== 'healthy') {
      throw new Error(`Health check failed: ${JSON.stringify(healthJson)}`);
    }
    console.log('  ✅ Health check passed');

    // 2. Check /api/v1/doctors/specializations
    console.log('Test 2: GET /api/v1/doctors/specializations metadata');
    const specRes = await fetch(`${baseUrl}/api/v1/doctors/specializations`);
    const specJson = await specRes.json();
    if (specRes.status !== 200) {
      throw new Error(`Specializations check failed: ${JSON.stringify(specJson)}`);
    }
    const expectedSpecs = [
      'Cardiologist',
      'Dentist',
      'Neurologist',
      'Dermatologist',
      'Orthopedic',
      'General Physician'
    ];
    for (const spec of expectedSpecs) {
      if (!specJson.data.specializations.includes(spec)) {
        throw new Error(`Missing expected specialization: ${spec}`);
      }
    }
    console.log(`  ✅ Returned all 6 specializations: ${specJson.data.specializations.join(', ')}`);
    console.log(`  ✅ Returned availability statuses: ${specJson.data.availabilityStatuses.join(', ')}`);

    // 3. Register / Setup Admin user
    console.log('Test 3: Setup Admin and Patient accounts');
    const adminEmail = `admin_${Date.now()}@hospital.test`;
    const adminRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'System Admin',
        email: adminEmail,
        password: 'AdminPassword123',
        role: ROLES.ADMIN
      })
    });
    const adminJson = await adminRes.json();
    if (adminRes.status !== 201) {
      throw new Error(`Admin register failed: ${JSON.stringify(adminJson)}`);
    }
    adminToken = adminJson.data.tokens.accessToken;
    console.log('  ✅ Admin user created and authenticated');

    // Setup Patient user for RBAC tests
    const patientEmail = `patient_${Date.now()}@hospital.test`;
    const patientRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Patient',
        email: patientEmail,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const patientJson = await patientRes.json();
    patientToken = patientJson.data.tokens.accessToken;
    console.log('  ✅ Patient user created and authenticated');

    // 4. Test validation error: create doctor with invalid specialization
    console.log('Test 4: Reject doctor creation with invalid specialization');
    const invalidSpecRes = await fetch(`${baseUrl}/api/v1/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Quack',
        email: `invalid_${Date.now()}@hospital.test`,
        password: 'Password123',
        specialization: 'Astrology', // Invalid
        department: 'Mystic'
      })
    });
    const invalidSpecJson = await invalidSpecRes.json();
    if (invalidSpecRes.status !== 400) {
      throw new Error(`Expected 400 for invalid specialization, got: ${invalidSpecRes.status}`);
    }
    console.log('  ✅ Invalid specialization rejected with 400 Bad Request');

    // 5. Admin creates doctor with full profile
    console.log('Test 5: Admin creates doctor with full details');
    const doctorEmail = `dr.house_${Date.now()}@hospital.test`;
    const createDocRes = await fetch(`${baseUrl}/api/v1/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Gregory House',
        email: doctorEmail,
        password: 'DoctorPassword123',
        phone: '+1-555-0144',
        specialization: 'Neurologist',
        department: 'Diagnostics & Neurology',
        qualification: 'MD, Head of Diagnostic Medicine',
        experienceYears: 18,
        consultationFee: 350.0,
        availableDays: 'Monday,Tuesday,Thursday',
        availabilityStatus: 'AVAILABLE'
      })
    });
    const createDocJson = await createDocRes.json();
    if (createDocRes.status !== 201) {
      throw new Error(`Create doctor failed: ${JSON.stringify(createDocJson)}`);
    }
    createdDoctorId = createDocJson.data.id;
    if (createDocJson.data.profile.specialization !== 'Neurologist' ||
        createDocJson.data.profile.experienceYears !== 18 ||
        createDocJson.data.profile.consultationFee !== 350.0 ||
        createDocJson.data.profile.availabilityStatus !== 'AVAILABLE') {
      throw new Error(`Doctor profile attributes mismatch: ${JSON.stringify(createDocJson.data.profile)}`);
    }
    console.log(`  ✅ Doctor created successfully with ID: ${createdDoctorId}`);
    console.log(`     Specialization: ${createDocJson.data.profile.specialization}`);
    console.log(`     Experience: ${createDocJson.data.profile.experienceYears} years`);
    console.log(`     Fee: $${createDocJson.data.profile.consultationFee}`);
    console.log(`     Status: ${createDocJson.data.profile.availabilityStatus}`);

    // Create a 2nd doctor for search/filtering testing
    const doc2Res = await fetch(`${baseUrl}/api/v1/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Allison Cameron',
        email: `dr.cameron_${Date.now()}@hospital.test`,
        password: 'DoctorPassword123',
        specialization: 'Cardiologist',
        department: 'Cardiology',
        experienceYears: 7,
        consultationFee: 200.0,
        availableDays: 'Wednesday,Friday',
        availabilityStatus: 'BUSY'
      })
    });
    const doc2Json = await doc2Res.json();
    secondDoctorId = doc2Json.data.id;
    console.log(`  ✅ Second doctor (Cardiologist) created with ID: ${secondDoctorId}`);

    // 6. Test GET /api/v1/doctors with filters & search
    console.log('Test 6: GET /api/v1/doctors with filtering, search, and pagination');
    // Filter by specialization
    const filterSpecRes = await fetch(`${baseUrl}/api/v1/doctors?specialization=Neurologist`);
    const filterSpecJson = await filterSpecRes.json();
    const hasOnlyNeurologists = filterSpecJson.data.doctors.every(d => d.profile.specialization === 'Neurologist');
    if (!hasOnlyNeurologists || filterSpecJson.data.doctors.length === 0) {
      throw new Error(`Specialization filter failed: ${JSON.stringify(filterSpecJson)}`);
    }
    console.log(`  ✅ Filter by specialization (Neurologist): found ${filterSpecJson.data.doctors.length} doctor(s)`);

    // Filter by availabilityStatus
    const filterStatusRes = await fetch(`${baseUrl}/api/v1/doctors?availabilityStatus=BUSY`);
    const filterStatusJson = await filterStatusRes.json();
    const hasOnlyBusy = filterStatusJson.data.doctors.every(d => d.profile.availabilityStatus === 'BUSY');
    if (!hasOnlyBusy || filterStatusJson.data.doctors.length === 0) {
      throw new Error(`Status filter failed: ${JSON.stringify(filterStatusJson)}`);
    }
    console.log(`  ✅ Filter by availabilityStatus (BUSY): found ${filterStatusJson.data.doctors.length} doctor(s)`);

    // Search query
    const searchRes = await fetch(`${baseUrl}/api/v1/doctors?search=Gregory`);
    const searchJson = await searchRes.json();
    if (searchJson.data.doctors.length === 0 || !searchJson.data.doctors[0].name.includes('Gregory')) {
      throw new Error(`Search filter failed: ${JSON.stringify(searchJson)}`);
    }
    console.log(`  ✅ Search query ('Gregory'): found doctor ${searchJson.data.doctors[0].name}`);

    // Pagination
    const pageRes = await fetch(`${baseUrl}/api/v1/doctors?page=1&limit=1`);
    const pageJson = await pageRes.json();
    if (pageJson.data.doctors.length !== 1 || pageJson.data.pagination.limit !== 1) {
      throw new Error(`Pagination failed: ${JSON.stringify(pageJson)}`);
    }
    console.log(`  ✅ Pagination verified: page ${pageJson.data.pagination.page} of ${pageJson.data.pagination.totalPages}`);

    // 7. GET doctor by ID
    console.log('Test 7: GET /api/v1/doctors/:id');
    const getByIdRes = await fetch(`${baseUrl}/api/v1/doctors/${createdDoctorId}`);
    const getByIdJson = await getByIdRes.json();
    if (getByIdRes.status !== 200 || getByIdJson.data.id !== createdDoctorId) {
      throw new Error(`Get by ID failed: ${JSON.stringify(getByIdJson)}`);
    }
    console.log(`  ✅ Retrieved doctor details by ID`);

    // 8. Doctor Login and Profile Self-Management
    console.log('Test 8: Doctor logs in and accesses Profile APIs');
    const docLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: doctorEmail,
        password: 'DoctorPassword123'
      })
    });
    const docLoginJson = await docLoginRes.json();
    if (docLoginRes.status !== 200) {
      throw new Error(`Doctor login failed: ${JSON.stringify(docLoginJson)}`);
    }
    doctorToken = docLoginJson.data.tokens.accessToken;
    console.log('  ✅ Doctor logged in successfully');

    // Doctor GET /profile/me
    const myProfileRes = await fetch(`${baseUrl}/api/v1/doctors/profile/me`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const myProfileJson = await myProfileRes.json();
    if (myProfileRes.status !== 200 || myProfileJson.data.email !== doctorEmail) {
      throw new Error(`GET /profile/me failed: ${JSON.stringify(myProfileJson)}`);
    }
    console.log(`  ✅ Doctor accessed own profile via GET /api/v1/doctors/profile/me`);

    // Doctor PUT /profile/me
    console.log('Test 9: Doctor updates own profile via PUT /api/v1/doctors/profile/me');
    const updateProfileRes = await fetch(`${baseUrl}/api/v1/doctors/profile/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        consultationFee: 400.0,
        experienceYears: 19,
        availableDays: 'Monday,Tuesday,Wednesday,Thursday'
      })
    });
    const updateProfileJson = await updateProfileRes.json();
    if (updateProfileRes.status !== 200 || updateProfileJson.data.profile.consultationFee !== 400.0) {
      throw new Error(`PUT /profile/me failed: ${JSON.stringify(updateProfileJson)}`);
    }
    console.log(`  ✅ Doctor updated profile: Fee updated to $${updateProfileJson.data.profile.consultationFee}`);

    // Doctor PATCH /profile/status
    console.log('Test 10: Doctor updates availability status via PATCH /api/v1/doctors/profile/status');
    const updateStatusRes = await fetch(`${baseUrl}/api/v1/doctors/profile/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        availabilityStatus: 'ON_LEAVE'
      })
    });
    const updateStatusJson = await updateStatusRes.json();
    if (updateStatusRes.status !== 200 || updateStatusJson.data.availabilityStatus !== 'ON_LEAVE') {
      throw new Error(`PATCH /profile/status failed: ${JSON.stringify(updateStatusJson)}`);
    }
    console.log(`  ✅ Doctor status updated to: ${updateStatusJson.data.availabilityStatus}`);

    // 11. RBAC Tests: Patient cannot mutate doctor records
    console.log('Test 11: RBAC enforcement against unauthorized roles');
    // Patient attempts POST /api/v1/doctors
    const patientCreateRes = await fetch(`${baseUrl}/api/v1/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        name: 'Unauthorized Doctor',
        email: `hacker_${Date.now()}@hospital.test`,
        password: 'Password123',
        specialization: 'Dentist'
      })
    });
    if (patientCreateRes.status !== 403) {
      throw new Error(`Expected 403 for patient creating doctor, got ${patientCreateRes.status}`);
    }
    console.log('  ✅ Patient blocked from creating doctor (403 Forbidden)');

    // Patient attempts DELETE /api/v1/doctors/:id
    const patientDeleteRes = await fetch(`${baseUrl}/api/v1/doctors/${createdDoctorId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    if (patientDeleteRes.status !== 403) {
      throw new Error(`Expected 403 for patient deleting doctor, got ${patientDeleteRes.status}`);
    }
    console.log('  ✅ Patient blocked from deleting doctor (403 Forbidden)');

    // Patient attempts GET /profile/me
    const patientProfileMeRes = await fetch(`${baseUrl}/api/v1/doctors/profile/me`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    if (patientProfileMeRes.status !== 403) {
      throw new Error(`Expected 403 for patient calling doctor /profile/me, got ${patientProfileMeRes.status}`);
    }
    console.log('  ✅ Patient blocked from accessing doctor profile/me (403 Forbidden)');

    // 12. Admin updates doctor details and availability status by ID
    console.log('Test 12: Admin updates doctor details and status by ID');
    const adminStatusRes = await fetch(`${baseUrl}/api/v1/doctors/${createdDoctorId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ availabilityStatus: 'AVAILABLE' })
    });
    const adminStatusJson = await adminStatusRes.json();
    if (adminStatusRes.status !== 200 || adminStatusJson.data.availabilityStatus !== 'AVAILABLE') {
      throw new Error(`Admin status update failed: ${JSON.stringify(adminStatusJson)}`);
    }
    console.log('  ✅ Admin updated doctor availability status to AVAILABLE');

    const adminPutRes = await fetch(`${baseUrl}/api/v1/doctors/${createdDoctorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        department: 'Nephrology & Diagnostics',
        phone: '+1-555-9999'
      })
    });
    const adminPutJson = await adminPutRes.json();
    if (adminPutRes.status !== 200 || adminPutJson.data.phone !== '+1-555-9999') {
      throw new Error(`Admin PUT doctor failed: ${JSON.stringify(adminPutJson)}`);
    }
    console.log('  ✅ Admin updated doctor details successfully');

    // 13. Admin deletes doctor
    console.log('Test 13: Admin deletes doctor');
    const deleteRes = await fetch(`${baseUrl}/api/v1/doctors/${createdDoctorId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const deleteJson = await deleteRes.json();
    if (deleteRes.status !== 200) {
      throw new Error(`Delete doctor failed: ${JSON.stringify(deleteJson)}`);
    }
    console.log('  ✅ Doctor deleted successfully');

    // Verify doctor is no longer found
    const verifyNotFoundRes = await fetch(`${baseUrl}/api/v1/doctors/${createdDoctorId}`);
    if (verifyNotFoundRes.status !== 404) {
      throw new Error(`Expected 404 for deleted doctor, got ${verifyNotFoundRes.status}`);
    }
    console.log('  ✅ Verified deleted doctor returns 404 Not Found');

    console.log('\n🎉 ALL 13 TEST SUITES PASSED SUCCESSFULLY!');
  } finally {
    // Clean up created records from SQLite dev database
    try {
      if (secondDoctorId) {
        await prisma.user.deleteMany({
          where: { id: secondDoctorId }
        });
      }
    } catch (_) {}

    // Close server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('[Test Teardown] Server closed cleanly.');
    }
    await prisma.$disconnect();
  }
};

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed with Error:');
  console.error(err);
  process.exit(1);
});
