async function testEndpoint() {
    console.log("Testing OTP Endpoint at http://localhost:4000/send-otp...");
    try {
        const response = await fetch('http://localhost:4000/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'bhavanagangavaram1@gmail.com' })
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Response Data:", data);

        if (data.status === 'success') {
            console.log("✅ API is working and claimed to send email.");
        } else {
            console.log("❌ API returned error.");
        }
    } catch (error) {
        console.error("❌ Connection Failed:", error.message);
        console.log("Is the server running? Did you run 'npm run start'?");
    }
}

testEndpoint();
