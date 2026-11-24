import http from 'http';
import { app } from '../src/app.js';
import prisma from '../src/database/prisma.js';
import { ROLES } from '../src/constants/roles.js';
import { sendNotification } from '../src/socket/socket.init.js';

let server;
let baseUrl;
let port;

const runTests = async () => {
  console.log('🧪 Starting Notification Module Automated Integration Tests...\n');

  // Start temporary server
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Setup] Test server listening on ${baseUrl}`);
      resolve();
    });
  });

  const cleanupUserIds = [];

  try {
    const timestamp = Date.now();
    
    // 1. Setup Patient
    const p1Res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Notification Patient',
        email: `notif_pat_${timestamp}@hospital.test`,
        password: 'PatientPassword123',
        role: ROLES.PATIENT
      })
    });
    const p1Json = await p1Res.json();
    const patientToken = p1Json.data.tokens.accessToken;
    const patientId = p1Json.data.user.id;
    cleanupUserIds.push(patientId);

    console.log('  ✅ Test accounts created successfully');

    // 2. Fetch Notifications (Empty initially)
    console.log('Test 1: GET /api/v1/notifications (Empty state)');
    const initialRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const initialJson = await initialRes.json();
    if (initialRes.status !== 200 || initialJson.data.notifications.length !== 0) {
      throw new Error(`Expected empty notifications, got: ${JSON.stringify(initialJson)}`);
    }
    console.log('  ✅ Returned empty notifications correctly');

    // 3. Create Notification directly using helper
    console.log('Test 2: Creating a notification via helper');
    await sendNotification({
      title: 'Test Notification',
      message: 'This is a test notification',
      userId: patientId,
      event: 'test_event',
      data: { test: true }
    });
    console.log('  ✅ Notification created successfully');

    // 4. Fetch Notifications (Should have 1 unread)
    console.log('Test 3: GET /api/v1/notifications (With data)');
    const withDataRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const withDataJson = await withDataRes.json();
    if (withDataRes.status !== 200 || withDataJson.data.notifications.length !== 1) {
      throw new Error(`Expected 1 notification, got: ${JSON.stringify(withDataJson)}`);
    }
    if (withDataJson.data.unreadCount !== 1) {
      throw new Error(`Expected 1 unread notification, got: ${withDataJson.data.unreadCount}`);
    }
    const notificationId = withDataJson.data.notifications[0].id;
    console.log('  ✅ Returned 1 unread notification correctly');

    // 5. Mark as read
    console.log('Test 4: PATCH /api/v1/notifications/:id/read');
    const readRes = await fetch(`${baseUrl}/api/v1/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const readJson = await readRes.json();
    if (readRes.status !== 200 || readJson.data.isRead !== true) {
      throw new Error(`Expected notification to be read, got: ${JSON.stringify(readJson)}`);
    }
    console.log('  ✅ Marked notification as read correctly');

    // 6. Check unread count is now 0
    console.log('Test 5: Verify unread count is 0');
    const verifyRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const verifyJson = await verifyRes.json();
    if (verifyJson.data.unreadCount !== 0) {
      throw new Error(`Expected 0 unread notification, got: ${verifyJson.data.unreadCount}`);
    }
    console.log('  ✅ Unread count is correctly 0');

    // 7. Clear notifications
    console.log('Test 6: DELETE /api/v1/notifications');
    const clearRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    if (clearRes.status !== 200) {
      throw new Error(`Expected 200 on clear, got: ${clearRes.status}`);
    }
    
    const finalRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const finalJson = await finalRes.json();
    if (finalJson.data.notifications.length !== 0) {
      throw new Error(`Expected 0 notifications after clear, got: ${finalJson.data.notifications.length}`);
    }
    console.log('  ✅ Notifications cleared correctly');

    console.log('\n🎉 ALL NOTIFICATION TEST SUITES PASSED SUCCESSFULLY!');

  } finally {
    // Cleanup created test records
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
  console.error('\n❌ Notification Test Suite Failed with Error:');
  console.error(err);
  process.exit(1);
});
