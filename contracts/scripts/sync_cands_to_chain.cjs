const sqlite3 = require('sqlite3').verbose();
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.attach(contractAddress);

    // Impersonate the actual owner to bypass 'Only owner can call this'
    const ownerAddress = "0xDb4a3540D12eaB1C21ec7a14Cb166AE4852eCe62";
    await ethers.provider.send("hardhat_impersonateAccount", [ownerAddress]);
    const owner = await ethers.getSigner(ownerAddress);

    // Give owner some ETH to pay gas just in case
    await ethers.provider.send("hardhat_setBalance", [
        ownerAddress,
        "0x1000000000000000000" // 1 ETH
    ]);

    console.log(`Using owner account: ${owner.address}`);

    const fs = require('fs');
    const path = require('path');
    const candidatesPath = path.join(__dirname, '../../backend-node/data/candidates.json');

    if (!fs.existsSync(candidatesPath)) {
        console.log("No candidates.json file found. Nothing to sync.");
        return;
    }

    const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
    console.log(`Found ${candidates.length} candidates in candidates.json.`);

    for (const name of candidates) {
        try {
            console.log(`Registering candidate ${name} to blockchain...`);
            const tx = await voting.connect(owner).addCandidate(name);
            await tx.wait();
            console.log(`✅ Successfully uploaded candidate ${name}.`);
        } catch (error) {
            console.error(`❌ Failed to upload candidate ${name}:`, error.reason || error.message);
        }
    }

    console.log("\nCandidates Sync complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
