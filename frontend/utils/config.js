const config = {
    // Backend Node.js Service (Database, Faucet, etc.)
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",

    // OTP Service (Email/SMS)
    OTP_SERVICE_URL: process.env.NEXT_PUBLIC_OTP_SERVICE_URL || "http://localhost:4000",

    // Blockchain Contract Address (Public)
    CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0C2Cf528350f31eB62192E4aB630Fec35150eDd2"
};

export default config;
