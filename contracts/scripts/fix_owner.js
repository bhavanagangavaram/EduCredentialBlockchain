import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read contract address dynamically from backend-node/.env
function getContractAddress() {
    const envPath = path.join(__dirname, "../../backend-node/.env");
    if (!fs.existsSync(envPath)) {
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
    const NEW_OWNER = "0x6d2bf180b54a3BeF95A2B871aa1a4217775e4070";

    console.log(`Transferring ownership of ${CONTRACT_ADDRESS} to ${NEW_OWNER}...`);

    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = Voting.attach(CONTRACT_ADDRESS);

    // Get current owner (Deployer / Account #0)
    const [deployer] = await hre.ethers.getSigners();
    console.log("Current Owner (Deployer):", deployer.address);

    const tx = await voting.connect(deployer).transferOwnership(NEW_OWNER);
    await tx.wait();

    console.log("✅ Ownership Transferred Successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
