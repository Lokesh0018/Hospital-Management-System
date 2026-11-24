import http from 'http';
import { io as Client } from 'socket.io-client';
import { app } from '../src/app.js';
import prisma from '../src/database/prisma.js';
import { initSocket } from '../src/socket/socket.init.js';
import { ROLES } from '../src/constants/roles.js';

let server;
let baseUrl;
let socketClient;
let port;

const runTests = async () => {
  console.log('🧪 Starting Socket.IO Automated Integration Tests...\n');

  // Start temporary server
  await new Promise((resolve) => {
    server = http.createServer(app);
    initSocket(server); // Initialize global socket io instance
    server.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Setup] Test server with Socket.IO listening on ${baseUrl}`);
      resolve();
    });
  });

  const cleanupUserIds = [];

  try {
    const timestamp = Date.now();
    
    // 1. Setup Patient and Admin for tests
    const adminRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Socket Admin',
        email: `admin_sock_${timestamp}@hospital.test`,
        password: 'AdminPassword123',
        role: ROLES.ADMIN
      })
    });
    const adminJson = await adminRes.json();
    const adminToken = adminJson.data.tokens.accessToken;
    cleanupUserIds.push(adminJson.data.user.id);

    const docRes = await fetch(`${baseUrl}/api/v1/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Dr. Socket',
        email: `dr.socket_${timestamp}@hospital.test`,
        password: 'DoctorPassword123',
        specialization: 'Neurologist',
        department: 'Neurology',
        availableDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
        availabilityStatus: 'AVAILABLE',
        consultationFee: 250.0
      })
    });
    const docJson = await docRes.json();
    const doctorId = docJson.data.id;
    cleanupUserIds.push(doctorId);

    const p1Res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Socket Patient',
        email: `patient_sock_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const p1Json = await p1Res.json();
    const patient1Token = p1Json.data.tokens.accessToken;
    cleanupUserIds.push(p1Json.data.user.id);

    console.log('  ✅ Test accounts created successfully');

    // 2. Test Unauthenticated Socket Connection (should be rejected/disconnected)
    console.log('Test 1: Unauthenticated Socket Connection');
    const unauthClient = Client(baseUrl, {
      reconnection: false
    });
    
    await new Promise((resolve) => {
      unauthClient.on('connect_error', (err) => {
        if (err.message.includes('Authentication') || err.message.includes('token')) {
          console.log('  ✅ Connection correctly rejected without token');
          resolve();
        } else {
          throw new Error('Expected auth error but got: ' + err.message);
        }
      });
      unauthClient.on('connect', () => {
        throw new Error('Connection should not have succeeded');
      });
    });
    unauthClient.close();

    // 3. Test Authenticated Socket Connection
    console.log('Test 2: Authenticated Socket Connection');
    socketClient = Client(baseUrl, {
      auth: { token: adminToken },
      reconnection: false
    });

    await new Promise((resolve, reject) => {
      socketClient.on('connect', () => {
        console.log('  ✅ Authenticated socket connected successfully');
        resolve();
      });
      socketClient.on('connect_error', reject);
    });

    // 4. Test Notification Emitted over Socket upon Appointment Creation
    console.log('Test 3: Appointment Creation Event Broadcasting');
    
    // We will listen for both the domain event and the notification event
    let domainEventReceived = false;
    let notificationEventReceived = false;

    socketClient.on('appointment:created', (data) => {
      if (data && data.id) {
        domainEventReceived = true;
      }
    });

    socketClient.on('notification:new', (payload) => {
      if (payload && payload.event === 'appointment:created') {
        notificationEventReceived = true;
      }
    });

    // Determine target date (tomorrow)
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const targetDateStr = date.toISOString().split('T')[0];

    const bookRes1 = await fetch(`${baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        doctorId,
        appointmentDate: targetDateStr,
        timeSlot: 'Morning',
        reason: 'Testing socket events'
      })
    });
    
    if (bookRes1.status !== 201) {
      const bRes = await bookRes1.json();
      throw new Error(`Failed to book: ${JSON.stringify(bRes)}`);
    }
    
    // Wait for socket events to arrive (allow up to 2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (!domainEventReceived) {
      throw new Error('Did not receive appointment:created socket event');
    }
    console.log('  ✅ Received appointment:created socket domain event');
    
    if (!notificationEventReceived) {
      // NOTE: Notifications are sent to specific users, usually Admin and Doctor, and Patient.
      // Since our socket client is connected as Admin, they should receive it because Admin has role ADMIN.
      throw new Error('Did not receive APPOINTMENT_CREATED notification event for Admin');
    }
    console.log('  ✅ Received notification socket event for Admin');

    console.log('\n🎉 ALL SOCKET TEST SUITES PASSED SUCCESSFULLY!');

  } finally {
    // Cleanup created test records
    try {
      if (cleanupUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: cleanupUserIds } }
        });
      }
    } catch (_) {}

    if (socketClient) {
      socketClient.close();
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('[Test Teardown] Server closed cleanly.');
    }
    await prisma.$disconnect();
  }
};

runTests().catch((err) => {
  console.error('\n❌ Socket Test Suite Failed with Error:');
  console.error(err);
  process.exit(1);
});
