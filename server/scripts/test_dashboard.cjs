const http = require('http');

function makeRequest(path, token, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

function login(email) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password: 'MedPulse@123' });
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testDashboard(email, rolePaths) {
  try {
    const loginRes = await login(email);
    if (!loginRes.data || !loginRes.data.tokens) {
      console.error(`Login failed for ${email}`, loginRes);
      return;
    }
    const token = loginRes.data.tokens.accessToken;
    console.log(`[${email}] Login OK`);

    for (const p of rolePaths) {
      const res = await makeRequest(p, token);
      console.log(`[${email}] ${p} => ${res.status}`);
      if (res.status === 500 || res.status === 502) {
        console.error(res.body);
      }
    }
  } catch (err) {
    console.error(`Error with ${email}:`, err);
  }
}

async function run() {
  await testDashboard('gregory@medpulse.com', [
    '/api/v1/doctors/profile',
    '/api/v1/doctors/appointments',
    '/api/v1/reports/assigned',
    '/api/v1/prescriptions'
  ]);
  
  await testDashboard('reception@medpulse.com', [
    '/api/v1/receptionist/profile', // Or whatever it is
    '/api/v1/receptionist/appointments',
    '/api/v1/doctors'
  ]);
  
  await testDashboard('patient1@medpulse.com', [
    '/api/v1/patients/profile',
    '/api/v1/patients/appointments',
    '/api/v1/reports',
    '/api/v1/prescriptions'
  ]);
}

run();
