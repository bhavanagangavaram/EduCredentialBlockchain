import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

async function main() {
    // Read address from Frontend Config
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const frontendPath = path.join(__dirname, "../../frontend/components/VotingApp.js");
    const frontendContent = fs.readFileSync(frontendPath, "utf8");
    const match = frontendContent.match(/const CONTRACT_ADDRESS = "(.*)";/);

    if (!match) {
        throw new Error("Could not find CONTRACT_ADDRESS in VotingApp.js");
    }
    const votingAddress = match[1];
    console.log(`Using Contract Address from Frontend: ${votingAddress}`);

    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = Voting.attach(votingAddress);

    try {
        const owner = await voting.owner();
        console.log(`Current Owner: ${owner}`);

        const accounts = await hre.ethers.getSigners();
        if (accounts[0].address === owner) {
            console.log("✅ Owner matches Hardhat Account #0");
            console.log(`   Owner: ${owner}`);
            console.log(`   Account #0: ${accounts[0].address}`);
        } else {
            console.log("⚠️ Owner does NOT match Hardhat Account #0");
            console.log(`   Owner: ${owner}`);
            console.log(`   Account #0: ${accounts[0].address}`);
        }
    } catch (e) {
        console.error("Error fetching owner (Contract might not exist at this address):", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
