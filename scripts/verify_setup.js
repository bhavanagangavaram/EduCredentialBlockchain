const fs = require('fs');
const path = require('path');

const backendEnvPath = path.join('d:', 'FinalProj', 'backend-node', '.env');
const otpEnvPath = path.join('d:', 'FinalProj', 'otp-service', '.env');
const frontendConfigPath = path.join('d:', 'FinalProj', 'frontend', 'utils', 'config.js');

function checkFile(filePath, requiredKeys = []) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Missing file: ${filePath}`);
        return false;
    }
    console.log(`✅ Found file: ${filePath}`);

    if (requiredKeys.length > 0) {
        const content = fs.readFileSync(filePath, 'utf8');
        let allKeysFound = true;
        requiredKeys.forEach(key => {
            if (!content.includes(key)) {
                console.error(`   ❌ Missing key: ${key}`);
                allKeysFound = false;
            }
        });
        if (allKeysFound) console.log(`   ✅ All keys present: ${requiredKeys.join(', ')}`);
    }
    return true;
}

console.log("Starting Verification...");

checkFile(backendEnvPath, ['ENC_KEY', 'IV']);
checkFile(otpEnvPath, ['EMAIL_USER', 'EMAIL_PASS']);
checkFile(frontendConfigPath, ['BACKEND_URL', 'OTP_SERVICE_URL', 'CONTRACT_ADDRESS']);

console.log("Verification Complete.");
