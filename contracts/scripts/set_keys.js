import hre from "hardhat";
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.attach(contractAddress);

    // 1. Generate or Load Keys
    console.log("Generating new RSA keys...");
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    const frontendDir = path.join(__dirname, "../../frontend");
    // Ensure dir exists
    if (!fs.existsSync(frontendDir)) {
        console.warn("Frontend directory not found relative to script");
    } else {
        fs.writeFileSync(path.join(frontendDir, 'pub.txt'), publicKey);
        fs.writeFileSync(path.join(frontendDir, 'priv.txt'), privateKey);
        console.log(`✅ Keys generated and saved to ${frontendDir}`);
    }

    // 2. Set Public Key on Contract
    console.log("Setting election public key on contract...");
    const tx = await voting.setElectionPublicKey(publicKey);
    await tx.wait();

    console.log("✅ Election Public Key set successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
