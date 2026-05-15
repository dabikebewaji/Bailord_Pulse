(async () => {
  try {
    const base = 'http://localhost:5000/api';
    const email = 'thecheat233@gmail.com';
    const password = 'michel1717';

    // Try login
    let token = null;
    try {
      const loginRes = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.token) {
        token = loginData.token;
        console.log('Logged in, token obtained');
      } else {
        console.log('Login failed (will attempt register):', loginData.message || loginData);
      }
    } catch (err) {
      console.log('Login request failed, will attempt register:', err.message || err);
    }

    if (!token) {
      // Register
      const registerRes = await fetch(`${base}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', email, password }),
      });
      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        console.error('Register failed:', registerData);
        return;
      }
      token = registerData.token;
      console.log('Registered and obtained token');
    }

    // Now create retailer
    const payload = {
      name: "John Doe",
      email: "johndoe@example.com",
      phone: "0123456789",
      businessName: "Doe Grocery",
      businessType: "Grocery",
      registrationNumber: "REG-12345",
      address: {
        street: "123 Main St",
        city: "Exampleville",
        state: "EX",
        zipCode: "12345",
        country: "USA"
      },
      bankDetails: {
        bankName: "Example Bank",
        accountNumber: "000111222",
        accountName: "Doe Grocery"
      }
    };

    const res = await fetch(`${base}/retailers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    const body = await res.text();
    console.log('Create retailer status:', res.status);
    console.log('Create retailer body:', body);

  } catch (err) {
    console.error('Request failed:', err);
  }
})();
