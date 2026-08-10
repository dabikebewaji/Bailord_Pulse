(async () => {
  try {
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

    const res = await fetch('http://localhost:5000/api/retailers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (err) {
    console.error('Request failed:', err);
  }
})();
