const http = require('http');

function testLogin(email) {
  const data = JSON.stringify({ email, password: 'MedPulse@123' });
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`[${email}] Status: ${res.statusCode}`);
      console.log(body);
    });
  });

  req.on('error', error => {
    console.error(`[${email}] Error:`, error.message);
  });

  req.write(data);
  req.end();
}

testLogin('admin@medpulse.com');
testLogin('gregory@medpulse.com');
testLogin('reception@medpulse.com');
testLogin('patient1@medpulse.com');
