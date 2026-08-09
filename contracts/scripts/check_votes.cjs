const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // Read the contract address from the backend config
    const envPath = path.join(__dirname, "../../backend-node/.env");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const addressLine = envContent.split("\n").find(line => line.startsWith("CONTRACT_ADDRESS="));
    const contractAddress = addressLine.split("=")[1].trim();

    const Voting = await ethers.getContractFactory("Voting");
    const contract = Voting.attach(contractAddress);

    const filter = contract.filters.VoteCast();
    const logs = await contract.queryFilter(filter, 0, "latest");

    console.log("Total VoteCast events found:", logs.length);
    if (logs.length > 0) {
        console.log("First encrypted vote sample:", logs[0].args.encryptedVote.substring(0, 50) + "...");
    }
}

main().catch(console.error);
