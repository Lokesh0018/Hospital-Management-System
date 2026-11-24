import http from 'http';
import { app } from '../src/app.js';
import prisma from '../src/database/prisma.js';
import { ROLES } from '../src/constants/roles.js';

let server;
let baseUrl;

const runTests = async () => {
  console.log('🧪 Starting Patient Module Automated Integration Tests...\n');

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
  let patient1Token = '';
  let patient1Id = '';
  let patient2Id = '';
  const cleanupUserIds = [];

  try {
    // 1. Metadata check
    console.log('Test 1: GET /api/v1/patients/metadata');
    const metaRes = await fetch(`${baseUrl}/api/v1/patients/metadata`);
    const metaJson = await metaRes.json();
    if (metaRes.status !== 200) {
      throw new Error(`Metadata check failed: ${JSON.stringify(metaJson)}`);
    }
    const expectedBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const expectedGenders = ['MALE', 'FEMALE', 'OTHER'];

    for (const bg of expectedBloodGroups) {
      if (!metaJson.data.bloodGroups.includes(bg)) {
        throw new Error(`Missing expected blood group: ${bg}`);
      }
    }
    for (const g of expectedGenders) {
      if (!metaJson.data.genders.includes(g)) {
        throw new Error(`Missing expected gender: ${g}`);
      }
    }
    console.log(`  ✅ Returned all 8 blood groups: ${metaJson.data.bloodGroups.join(', ')}`);
    console.log(`  ✅ Returned all 3 genders: ${metaJson.data.genders.join(', ')}`);

    // 2. Setup Admin and Doctor accounts
    console.log('Test 2: Setup Admin and Doctor accounts');
    const timestamp = Date.now();

    const adminRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Super Admin',
        email: `admin_${timestamp}@hospital.test`,
        password: 'AdminPassword123',
        role: ROLES.ADMIN
      })
    });
    const adminJson = await adminRes.json();
    adminToken = adminJson.data.tokens.accessToken;
    cleanupUserIds.push(adminJson.data.user.id);

    // Doctor
    const docRes = await fetch(`${baseUrl}/api/v1/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. James Wilson',
        email: `dr.wilson_${timestamp}@hospital.test`,
        password: 'DoctorPassword123',
        specialization: 'General Physician',
        department: 'Oncology & Medicine'
      })
    });
    const docJson = await docRes.json();
    cleanupUserIds.push(docJson.data.id);

    const docLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `dr.wilson_${timestamp}@hospital.test`,
        password: 'DoctorPassword123'
      })
    });
    const docLoginJson = await docLoginRes.json();
    doctorToken = docLoginJson.data.tokens.accessToken;

    console.log('  ✅ Admin and Doctor accounts initialized');

    // 3. Validation rejection: Invalid blood group & future DOB
    console.log('Test 3: Reject invalid blood group and future DOB');
    const invalidBgRes = await fetch(`${baseUrl}/api/v1/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Invalid Patient',
        email: `invalid_${timestamp}@hospital.test`,
        password: 'Password123',
        bloodGroup: 'Z+' // Invalid
      })
    });
    if (invalidBgRes.status !== 400) {
      throw new Error(`Expected 400 for invalid blood group, got ${invalidBgRes.status}`);
    }
    console.log('  ✅ Invalid blood group rejected with 400 Bad Request');

    const futureDobRes = await fetch(`${baseUrl}/api/v1/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Future Patient',
        email: `future_${timestamp}@hospital.test`,
        password: 'Password123',
        dateOfBirth: '2099-01-01' // Future
      })
    });
    if (futureDobRes.status !== 400) {
      throw new Error(`Expected 400 for future DOB, got ${futureDobRes.status}`);
    }
    console.log('  ✅ Future date of birth rejected with 400 Bad Request');

    // 4. Admin creates Patient 1 (Sarah Connor)
    console.log('Test 4: Admin creates Patient with full profile');
    const p1Email = `sarah_${timestamp}@hospital.test`;
    const createP1Res = await fetch(`${baseUrl}/api/v1/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: p1Email,
        password: 'PatientPassword123',
        phone: '+1-555-0301',
        gender: 'FEMALE',
        dateOfBirth: '1990-05-15',
        bloodGroup: 'O+',
        emergencyContact: 'John Connor (+1-555-0302)',
        address: '42 Cyberdyne Way, Los Angeles, CA',
        medicalHistory: 'Penicillin allergy. Mild asthma.'
      })
    });
    const createP1Json = await createP1Res.json();
    if (createP1Res.status !== 201) {
      throw new Error(`Create patient failed: ${JSON.stringify(createP1Json)}`);
    }
    patient1Id = createP1Json.data.id;
    cleanupUserIds.push(patient1Id);

    const prof = createP1Json.data.profile;
    if (prof.gender !== 'FEMALE' || prof.bloodGroup !== 'O+' || !prof.age || prof.age < 30) {
      throw new Error(`Patient profile values mismatch: ${JSON.stringify(prof)}`);
    }
    console.log(`  ✅ Patient 1 created: ID ${patient1Id}`);
    console.log(`     Gender: ${prof.gender}, Blood Group: ${prof.bloodGroup}`);
    console.log(`     DOB: ${prof.dateOfBirth}, Computed Age: ${prof.age} years`);
    console.log(`     Emergency Contact: ${prof.emergencyContact}`);
    console.log(`     Address: ${prof.address}`);
    console.log(`     Medical History: ${prof.medicalHistory}`);

    // Create Patient 2 for filtering
    const createP2Res = await fetch(`${baseUrl}/api/v1/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Kyle Reese',
        email: `kyle_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        gender: 'MALE',
        dateOfBirth: '1995-08-20',
        bloodGroup: 'A-'
      })
    });
    const createP2Json = await createP2Res.json();
    patient2Id = createP2Json.data.id;
    cleanupUserIds.push(patient2Id);
    console.log(`  ✅ Patient 2 created: ID ${patient2Id} (MALE, A-)`);

    // 5. Query, Search, and Filtering
    console.log('Test 5: Search and filter patients');
    // Filter by gender FEMALE
    const filterGenderRes = await fetch(`${baseUrl}/api/v1/patients?gender=FEMALE`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const filterGenderJson = await filterGenderRes.json();
    const hasOnlyFemales = filterGenderJson.data.patients.every((p) => p.profile.gender === 'FEMALE');
    if (!hasOnlyFemales || filterGenderJson.data.patients.length === 0) {
      throw new Error(`Gender filter failed: ${JSON.stringify(filterGenderJson)}`);
    }
    console.log(`  ✅ Gender filter (FEMALE): found ${filterGenderJson.data.patients.length} patient(s)`);

    // Filter by bloodGroup O+
    const filterBgRes = await fetch(`${baseUrl}/api/v1/patients?bloodGroup=O%2B`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const filterBgJson = await filterBgRes.json();
    const hasOnlyOPlus = filterBgJson.data.patients.every((p) => p.profile.bloodGroup === 'O+');
    if (!hasOnlyOPlus || filterBgJson.data.patients.length === 0) {
      throw new Error(`Blood group filter failed: ${JSON.stringify(filterBgJson)}`);
    }
    console.log(`  ✅ Blood group filter (O+): found ${filterBgJson.data.patients.length} patient(s)`);

    // Search by text query
    const searchRes = await fetch(`${baseUrl}/api/v1/patients?search=Cyberdyne`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const searchJson = await searchRes.json();
    if (searchJson.data.patients.length === 0 || searchJson.data.patients[0].name !== 'Sarah Connor') {
      throw new Error(`Search by address failed: ${JSON.stringify(searchJson)}`);
    }
    console.log(`  ✅ Text search ('Cyberdyne'): found patient ${searchJson.data.patients[0].name}`);

    // 6. Patient Login and Self-Service Profile
    console.log('Test 6: Patient logs in and accesses self-service profile APIs');
    const p1LoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: p1Email,
        password: 'PatientPassword123'
      })
    });
    const p1LoginJson = await p1LoginRes.json();
    patient1Token = p1LoginJson.data.tokens.accessToken;

    // GET /profile/me
    const myProfileRes = await fetch(`${baseUrl}/api/v1/patients/profile/me`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    });
    const myProfileJson = await myProfileRes.json();
    if (myProfileRes.status !== 200 || myProfileJson.data.email !== p1Email) {
      throw new Error(`GET /profile/me failed: ${JSON.stringify(myProfileJson)}`);
    }
    console.log(`  ✅ Patient fetched own profile via GET /api/v1/patients/profile/me`);

    // PUT /profile/me
    const updateMyProfileRes = await fetch(`${baseUrl}/api/v1/patients/profile/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        emergencyContact: 'Uncle Bob (+1-555-9999)',
        address: '100 Sunset Blvd, Los Angeles, CA'
      })
    });
    const updateMyProfileJson = await updateMyProfileRes.json();
    if (
      updateMyProfileRes.status !== 200 ||
      updateMyProfileJson.data.profile.emergencyContact !== 'Uncle Bob (+1-555-9999)' ||
      updateMyProfileJson.data.profile.address !== '100 Sunset Blvd, Los Angeles, CA'
    ) {
      throw new Error(`PUT /profile/me failed: ${JSON.stringify(updateMyProfileJson)}`);
    }
    console.log(`  ✅ Patient updated own emergency contact & address via PUT /profile/me`);

    // 7. Medical History Management
    console.log('Test 7: Doctor views and appends to Medical History');
    // Doctor views medical history
    const medHistoryRes = await fetch(`${baseUrl}/api/v1/patients/${patient1Id}/medical-history`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const medHistoryJson = await medHistoryRes.json();
    if (medHistoryRes.status !== 200 || !medHistoryJson.data.medicalHistory.includes('Penicillin allergy')) {
      throw new Error(`Medical history fetch failed: ${JSON.stringify(medHistoryJson)}`);
    }
    console.log(`  ✅ Doctor viewed medical history: "${medHistoryJson.data.medicalHistory}"`);

    // Doctor appends a clinical note
    const appendNoteRes = await fetch(`${baseUrl}/api/v1/patients/${patient1Id}/medical-history`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        medicalHistory: 'Patient consulted for regular checkup. Vitals stable.',
        append: true
      })
    });
    const appendNoteJson = await appendNoteRes.json();
    if (
      appendNoteRes.status !== 200 ||
      !appendNoteJson.data.medicalHistory.includes('Penicillin allergy') ||
      !appendNoteJson.data.medicalHistory.includes('Vitals stable')
    ) {
      throw new Error(`Medical history append failed: ${JSON.stringify(appendNoteJson)}`);
    }
    console.log(`  ✅ Doctor appended clinical note to medical history successfully`);

    // 8. RBAC Security
    console.log('Test 8: RBAC enforcement against unauthorized access');
    // Patient cannot browse all patients
    const patientListRes = await fetch(`${baseUrl}/api/v1/patients`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    });
    if (patientListRes.status !== 403) {
      throw new Error(`Expected 403 for patient browsing all patients, got ${patientListRes.status}`);
    }
    console.log('  ✅ Patient blocked from browsing all patients (403 Forbidden)');

    // Patient cannot view another patient's profile
    const unauthViewRes = await fetch(`${baseUrl}/api/v1/patients/${patient2Id}`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    });
    if (unauthViewRes.status !== 403) {
      throw new Error(`Expected 403 for viewing another patient, got ${unauthViewRes.status}`);
    }
    console.log('  ✅ Patient blocked from viewing another patient record (403 Forbidden)');

    // Patient cannot delete accounts
    const unauthDeleteRes = await fetch(`${baseUrl}/api/v1/patients/${patient2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${patient1Token}` }
    });
    if (unauthDeleteRes.status !== 403) {
      throw new Error(`Expected 403 for patient deleting account, got ${unauthDeleteRes.status}`);
    }
    console.log('  ✅ Patient blocked from deleting patient account (403 Forbidden)');

    // 9. Admin Updates and Deletes Patient
    console.log('Test 9: Admin updates and deletes patient');
    const adminUpdateRes = await fetch(`${baseUrl}/api/v1/patients/${patient2Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        bloodGroup: 'AB+'
      })
    });
    const adminUpdateJson = await adminUpdateRes.json();
    if (adminUpdateRes.status !== 200 || adminUpdateJson.data.profile.bloodGroup !== 'AB+') {
      throw new Error(`Admin update failed: ${JSON.stringify(adminUpdateJson)}`);
    }
    console.log(`  ✅ Admin updated patient blood group to AB+`);

    // Admin deletes Patient 2
    const deleteRes = await fetch(`${baseUrl}/api/v1/patients/${patient2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const deleteJson = await deleteRes.json();
    if (deleteRes.status !== 200) {
      throw new Error(`Delete patient failed: ${JSON.stringify(deleteJson)}`);
    }
    console.log(`  ✅ Patient 2 deleted successfully`);

    // Verify 404
    const notFoundRes = await fetch(`${baseUrl}/api/v1/patients/${patient2Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected 404 for deleted patient, got ${notFoundRes.status}`);
    }
    console.log(`  ✅ Verified deleted patient returns 404 Not Found`);

    console.log('\n🎉 ALL 9 PATIENT TEST SUITES PASSED SUCCESSFULLY!');
  } finally {
    try {
      if (cleanupUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: cleanupUserIds } }
        });
      }
    } catch (_) {}

    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('[Test Teardown] Server closed cleanly.');
    }
    await prisma.$disconnect();
  }
};

runTests().catch((err) => {
  console.error('\n❌ Patient Test Suite Failed with Error:');
  console.error(err);
  process.exit(1);
});
