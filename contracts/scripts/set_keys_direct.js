import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATIC_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApT4TlNveCsFMKBV1muSC
EQdyEakqir7xALMGr8oTPP6/hAdr2qxdLQP4mCvzAXhk2ROsL2oCLXXcNgAlXh2B
urMm9s4JBtLev1jYsVEcwltjvD2OWdRAArFsIu1wbw6pYDjUeXflkKqvvhgRrfHi
TrJomsbrQf1F+YkNX8GNYisRyr/NQjPTsgzb3zNt3izTbj3q8F0FKNyu+NmpmH+O
QwPUYCdxyZKDnzzzM6YiHF4QyX6i1B+QGx8Zjs//zf+HfMRXuCBFlAT3mNeMso6p
bUe7vTeTE8+yt2zg8sP5aR6OQj4lC3lrQLUPW0JJatO30KrDSWkIlwh+0GmTMu7c
QwIDAQAB
-----END PUBLIC KEY-----`;

// Read contract address dynamically from backend-node/.env
function getContractAddress() {
    const envPath = path.join(__dirname, "../../backend-node/.env");
    if (!fs.existsSync(envPath)) {
        // Fallback: try backend/.env
        const backendEnvPath = path.join(__dirname, "../../backend/.env");
        if (!fs.existsSync(backendEnvPath)) {
            throw new Error("No .env file found in backend-node/ or backend/");
        }
        const content = fs.readFileSync(backendEnvPath, "utf8");
        const match = content.match(/CONTRACT_ADDRESS=(.+)/);
        if (!match) throw new Error("CONTRACT_ADDRESS not found in backend/.env");
        return match[1].trim();
    }
    const content = fs.readFileSync(envPath, "utf8");
    const match = content.match(/CONTRACT_ADDRESS=(.+)/);
    if (!match) throw new Error("CONTRACT_ADDRESS not found in backend-node/.env");
    return match[1].trim();
}

async function main() {
    const CONTRACT_ADDRESS = getContractAddress();
    console.log(`Setting election keys for contract at ${CONTRACT_ADDRESS}...`);

    // Impersonate the owner (who was set during deploy)
    const newOwnerAddress = "0xDb4a3540D12eaB1C21ec7a14Cb166AE4852eCe62";

    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [newOwnerAddress],
    });
    const ownerSigner = await hre.ethers.getSigner(newOwnerAddress);
    console.log(`Using owner account: ${ownerSigner.address}`);

    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = Voting.attach(CONTRACT_ADDRESS).connect(ownerSigner);

    const tx = await voting.setElectionPublicKey(STATIC_PUBLIC_KEY);
    await tx.wait();

    await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [newOwnerAddress],
    });

    console.log("✅ Election Public Key Set Successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
