import http from 'http';
import { app } from '../src/app.js';
import prisma from '../src/database/prisma.js';
import { ROLES } from '../src/constants/roles.js';

let server;
let baseUrl;

const runTests = async () => {
  console.log('🧪 Starting Medical Reports Module Automated Integration Tests...\n');

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
  let labTechToken = '';
  let report1Id = '';
  let report2Id = '';
  const cleanupUserIds = [];

  try {
    // 1. Metadata check
    console.log('Test 1: GET /api/v1/reports/metadata');
    const metaRes = await fetch(`${baseUrl}/api/v1/reports/metadata`);
    const metaJson = await metaRes.json();
    if (metaRes.status !== 200) {
      throw new Error(`Metadata check failed: ${JSON.stringify(metaJson)}`);
    }

    const expectedTypes = ['X-Ray', 'MRI', 'CT Scan', 'Blood Test', 'ECG', 'Other'];
    const expectedStatuses = ['UPLOADED', 'UNDER_REVIEW', 'REVIEWED'];

    for (const t of expectedTypes) {
      if (!metaJson.data.reportTypes.includes(t)) {
        throw new Error(`Missing expected report type: ${t}`);
      }
    }
    for (const s of expectedStatuses) {
      if (!metaJson.data.statuses.includes(s)) {
        throw new Error(`Missing expected status: ${s}`);
      }
    }
    console.log(`  ✅ Returned all 6 report types: ${metaJson.data.reportTypes.join(', ')}`);
    console.log(`  ✅ Returned all 3 statuses: ${metaJson.data.statuses.join(', ')}`);

    // 2. Setup Accounts: Admin, Doctor, Patient 1, Patient 2, Lab Technician
    console.log('Test 2: Setup Admin, Doctor, Patients, and Lab Technician accounts');
    const timestamp = Date.now();

    // Admin
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
        name: 'Dr. Gregory House',
        email: `dr.house_${timestamp}@hospital.test`,
        password: 'DoctorPassword123',
        specialization: 'Neurologist',
        department: 'Diagnostic Medicine'
      })
    });
    const docJson = await docRes.json();
    doctorId = docJson.data.id;
    cleanupUserIds.push(doctorId);

    const docLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `dr.house_${timestamp}@hospital.test`,
        password: 'DoctorPassword123'
      })
    });
    const docLoginJson = await docLoginRes.json();
    doctorToken = docLoginJson.data.tokens.accessToken;

    // Patient 1
    const p1Res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Connor',
        email: `sarah_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const p1Json = await p1Res.json();
    patient1Token = p1Json.data.tokens.accessToken;
    patient1Id = p1Json.data.user.id;
    cleanupUserIds.push(patient1Id);

    // Patient 2
    const p2Res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kyle Reese',
        email: `kyle_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const p2Json = await p2Res.json();
    patient2Token = p2Json.data.tokens.accessToken;
    cleanupUserIds.push(p2Json.data.user.id);

    // Lab Technician
    const labRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Labtech',
        email: `labtech_${timestamp}@hospital.test`,
        password: 'LabPassword123',
        role: ROLES.LAB_TECHNICIAN
      })
    });
    const labJson = await labRes.json();
    labTechToken = labJson.data.tokens.accessToken;
    cleanupUserIds.push(labJson.data.user.id);

    console.log('  ✅ Admin, Doctor, Patients, and Lab Technician initialized');

    // 3. Reject invalid report type
    console.log('Test 3: Reject invalid report type');
    const invalidTypeRes = await fetch(`${baseUrl}/api/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${labTechToken}`
      },
      body: JSON.stringify({
        title: 'Horoscope Analysis',
        reportType: 'Astrology', // Invalid
        patientId: patient1Id
      })
    });
    if (invalidTypeRes.status !== 400) {
      throw new Error(`Expected 400 for invalid report type, got ${invalidTypeRes.status}`);
    }
    console.log('  ✅ Invalid report type rejected with 400 Bad Request');

    // 4. Lab Technician uploads Report 1 (MRI Scan linked to Patient and assigned to Doctor)
    console.log('Test 4: Lab Technician uploads Report metadata (MRI Scan)');
    const uploadRes1 = await fetch(`${baseUrl}/api/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${labTechToken}`
      },
      body: JSON.stringify({
        title: 'Brain MRI Scan - Axial & Sagittal',
        description: '3.0T High-resolution cranial scan with contrast enhancement',
        reportType: 'MRI',
        fileUrl: 'https://cdn.hospital.test/reports/mri_brain_001.pdf',
        fileType: 'application/pdf',
        fileSize: 4500000,
        reportDate: '2026-09-18',
        patientId: patient1Id,
        doctorId: doctorId
      })
    });
    const uploadJson1 = await uploadRes1.json();
    if (uploadRes1.status !== 201) {
      throw new Error(`Upload report failed: ${JSON.stringify(uploadJson1)}`);
    }
    report1Id = uploadJson1.data.id;
    if (
      uploadJson1.data.status !== 'UPLOADED' ||
      uploadJson1.data.reportType !== 'MRI' ||
      !uploadJson1.data.doctor ||
      !uploadJson1.data.patient
    ) {
      throw new Error(`Report attributes mismatch: ${JSON.stringify(uploadJson1.data)}`);
    }
    console.log(`  ✅ Report 1 uploaded: ID ${report1Id}`);
    console.log(`     Type: ${uploadJson1.data.reportType}, Status: ${uploadJson1.data.status}`);
    console.log(`     Linked Patient: ${uploadJson1.data.patient.name}`);
    console.log(`     Assigned Doctor: ${uploadJson1.data.doctor.name}`);

    // Create Report 2 (Blood Test)
    const uploadRes2 = await fetch(`${baseUrl}/api/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${labTechToken}`
      },
      body: JSON.stringify({
        title: 'Complete Blood Count (CBC) with Differential',
        reportType: 'Blood Test',
        fileUrl: 'https://cdn.hospital.test/reports/cbc_002.pdf',
        patientId: patient1Id,
        doctorId: doctorId
      })
    });
    const uploadJson2 = await uploadRes2.json();
    report2Id = uploadJson2.data.id;
    console.log(`  ✅ Report 2 (Blood Test) uploaded: ID ${report2Id}`);

    // 5. Doctor views assigned reports
    console.log('Test 5: Doctor views assigned reports');
    const assignedRes = await fetch(`${baseUrl}/api/v1/reports/assigned`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const assignedJson = await assignedRes.json();
    if (assignedRes.status !== 200 || assignedJson.data.reports.length !== 2) {
      throw new Error(`Doctor assigned reports check failed: ${JSON.stringify(assignedJson)}`);
    }
    console.log(`  ✅ Doctor successfully viewed 2 assigned reports via GET /api/v1/reports/assigned`);

    // 6. Patient views own reports
    console.log('Test 6: Patient views own reports');
    const p1ReportsRes = await fetch(`${baseUrl}/api/v1/reports`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    });
    const p1ReportsJson = await p1ReportsRes.json();
    if (p1ReportsRes.status !== 200 || p1ReportsJson.data.reports.length !== 2) {
      throw new Error(`Patient reports check failed: ${JSON.stringify(p1ReportsJson)}`);
    }
    console.log(`  ✅ Patient successfully viewed their 2 reports via GET /api/v1/reports`);

    // 7. Doctor reviews report and adds clinical notes
    console.log('Test 7: Doctor reviews report and adds clinical notes');
    const reviewRes = await fetch(`${baseUrl}/api/v1/reports/${report1Id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        doctorNotes: 'No signs of acute ischemia, midline shift, or intracranial mass. Normal study.',
        status: 'REVIEWED'
      })
    });
    const reviewJson = await reviewRes.json();
    if (
      reviewRes.status !== 200 ||
      reviewJson.data.status !== 'REVIEWED' ||
      !reviewJson.data.doctorNotes.includes('Normal study') ||
      !reviewJson.data.reviewedAt
    ) {
      throw new Error(`Doctor review failed: ${JSON.stringify(reviewJson)}`);
    }
    console.log(`  ✅ Doctor review saved: Status: ${reviewJson.data.status}`);
    console.log(`     Doctor Notes: "${reviewJson.data.doctorNotes}"`);
    console.log(`     Reviewed At: ${reviewJson.data.reviewedAt}`);

    // 8. Filter reports by type and status
    console.log('Test 8: Filter reports by reportType and status');
    const filterRes = await fetch(`${baseUrl}/api/v1/reports?reportType=MRI&status=REVIEWED`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const filterJson = await filterRes.json();
    if (filterJson.data.reports.length !== 1 || filterJson.data.reports[0].id !== report1Id) {
      throw new Error(`Filter failed: ${JSON.stringify(filterJson)}`);
    }
    console.log(`  ✅ Filter (Type: MRI, Status: REVIEWED) found exactly 1 reviewed report`);

    // 9. RBAC Security
    console.log('Test 9: RBAC enforcement against unauthorized access');
    // Patient cannot review reports
    const unauthReviewRes = await fetch(`${baseUrl}/api/v1/reports/${report1Id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({ doctorNotes: 'I am patient pretending to be doctor' })
    });
    if (unauthReviewRes.status !== 403) {
      throw new Error(`Expected 403 for patient reviewing report, got ${unauthReviewRes.status}`);
    }
    console.log('  ✅ Patient blocked from reviewing reports (403 Forbidden)');

    // Patient 2 cannot access Patient 1's report details
    const unauthViewRes = await fetch(`${baseUrl}/api/v1/reports/${report1Id}`, {
      headers: { Authorization: `Bearer ${patient2Token}` }
    });
    if (unauthViewRes.status !== 403) {
      throw new Error(`Expected 403 for viewing another patient report, got ${unauthViewRes.status}`);
    }
    console.log('  ✅ Patient blocked from accessing another patient report (403 Forbidden)');

    // 10. Admin updates report metadata
    console.log('Test 10: Admin updates report metadata');
    const updateRes = await fetch(`${baseUrl}/api/v1/reports/${report2Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        description: 'Verified with automated hematology analyzer model XN-1000'
      })
    });
    const updateJson = await updateRes.json();
    if (
      updateRes.status !== 200 ||
      !updateJson.data.description.includes('automated hematology analyzer')
    ) {
      throw new Error(`Admin update failed: ${JSON.stringify(updateJson)}`);
    }
    console.log(`  ✅ Report metadata updated successfully`);

    // 11. Admin deletes report
    console.log('Test 11: Admin deletes report');
    const deleteRes = await fetch(`${baseUrl}/api/v1/reports/${report2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const deleteJson = await deleteRes.json();
    if (deleteRes.status !== 200) {
      throw new Error(`Delete failed: ${JSON.stringify(deleteJson)}`);
    }
    console.log(`  ✅ Report deleted successfully`);

    const notFoundRes = await fetch(`${baseUrl}/api/v1/reports/${report2Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected 404 for deleted report, got ${notFoundRes.status}`);
    }
    console.log(`  ✅ Verified deleted report returns 404 Not Found`);

    console.log('\n🎉 ALL 11 MEDICAL REPORT TEST SUITES PASSED SUCCESSFULLY!');
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
  console.error('\n❌ Medical Reports Test Suite Failed with Error:');
  console.error(err);
  process.exit(1);
});
