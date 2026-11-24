async function test() {
  const baseURL = 'http://localhost:5000/api/v1';
  try {
    const loginRes = await fetch(baseURL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hospital.com', password: 'Password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.tokens.accessToken;
    
    const pRes = await fetch(baseURL + '/patients', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const pData = await pRes.json();
    const patientId = pData.data.patients[0].id;

    const dRes = await fetch(baseURL + '/doctors', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const dData = await dRes.json();
    const doctorId = dData.data.doctors[0].id;
    
    const payload = {
      patientId,
      doctorId,
      diagnosis: 'Test Diagnosis',
      instructions: 'Test instructions',
      medicines: [{
        medicineName: 'Test Med',
        dosage: '10mg',
        frequency: 'Daily',
        duration: '7 days',
        instructions: 'After food'
      }]
    };
    
    const rxRes = await fetch(baseURL + '/prescriptions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token 
      },
      body: JSON.stringify(payload)
    });
    
    const rxData = await rxRes.json();
    console.log('RESULT:', JSON.stringify(rxData, null, 2));
  } catch(err) {
    console.error('ERROR:', err.message);
  }
}
test();
