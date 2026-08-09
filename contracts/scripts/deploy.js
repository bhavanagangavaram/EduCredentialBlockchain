import hre from "hardhat";

async function main() {
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();

    await voting.waitForDeployment(); // Updated for Ethers v6

    const address = await voting.getAddress();
    console.log(`Voting contract deployed to ${address}`);

    // Transfer ownership to user's specified address
    const newOwnerAddress = "0xDb4a3540D12eaB1C21ec7a14Cb166AE4852eCe62";
    console.log(`Transferring ownership to ${newOwnerAddress}...`);
    const txTransfer = await voting.transferOwnership(newOwnerAddress);
    await txTransfer.wait();
    console.log(`Ownership successfully transferred to ${newOwnerAddress}`);

    // Default candidates removed. Admin must add them manually.
    /*
    const candidates = ["Alice", "Bob", "Charlie"];
    for (const name of candidates) {
        const tx = await voting.addCandidate(name);
        await tx.wait();
        console.log(`Added candidate: ${name}`);
    }
    */

    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Update Backend .env (Python)
    const envPath = path.join(__dirname, "../../backend/.env");
    let envContent = fs.readFileSync(envPath, "utf8");
    envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${address}`);
    fs.writeFileSync(envPath, envContent);
    console.log("Updated backend .env");

    // Update Backend-Node .env (Node)
    const nodeEnvPath = path.join(__dirname, "../../backend-node/.env");
    if (fs.existsSync(nodeEnvPath)) {
        let nodeEnvContent = fs.readFileSync(nodeEnvPath, "utf8");
        nodeEnvContent = nodeEnvContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${address}`);
        fs.writeFileSync(nodeEnvPath, nodeEnvContent);
        console.log("Updated backend-node .env");
    } else {
        console.log("Warning: backend-node/.env not found, skipping update.");
    }

    // Copy ABI to Frontend
    const artifactPath = path.join(__dirname, "../artifacts/contracts/Voting.sol/Voting.json");
    const frontendArtifactDir = path.join(__dirname, "../../frontend/utils");
    const frontendArtifactPath = path.join(frontendArtifactDir, "Voting.json");

    if (!fs.existsSync(frontendArtifactDir)) {
        fs.mkdirSync(frontendArtifactDir, { recursive: true });
    }

    fs.copyFileSync(artifactPath, frontendArtifactPath);
    console.log(`Copied Voting.json to ${frontendArtifactPath}`);

    // Update Frontend config.js
    const configPath = path.join(__dirname, "../../frontend/utils/config.js");
    if (fs.existsSync(configPath)) {
        let configContent = fs.readFileSync(configPath, "utf8");
        configContent = configContent.replace(/CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS \|\| ".*"/, `CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "${address}"`);
        fs.writeFileSync(configPath, configContent);
        console.log(`Updated frontend config.js with address ${address}`);
    } else {
        console.warn("⚠️ Frontend config.js not found!");
    }

    // --- AUTO-SYNC DATABASE TO BLOCKCHAIN ON STARTUP ---
    if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
        console.log("\n--- Syncing Database to Blockchain ---");

        // Fund the owner address so it can pay gas for sync transactions
        await hre.network.provider.send("hardhat_setBalance", [
            newOwnerAddress,
            "0x56BC75E2D63100000", // 100 ETH in hex
        ]);
        console.log("Funded owner account with 100 ETH for gas.");

        // Impersonate owner to add candidates and voters
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [newOwnerAddress],
        });
        const ownerSigner = await hre.ethers.getSigner(newOwnerAddress);

        // 1. Sync Candidates
        const candidatesPath = path.join(__dirname, "../../backend-node/data/candidates.json");
        if (fs.existsSync(candidatesPath)) {
            try {
                const candidates = JSON.parse(fs.readFileSync(candidatesPath, "utf8"));
                console.log(`Found ${candidates.length} candidates in database.`);
                for (const name of candidates) {
                    const tx = await voting.connect(ownerSigner).addCandidate(name);
                    await tx.wait();
                    console.log(`✅ Synced candidate: ${name}`);
                }
            } catch (e) {
                console.error("Failed to sync candidates:", e.message);
            }
        } else {
            console.log("No candidates found in database to sync.");
        }

        // 2. Sync Voters from DB
        const sqlite3 = await import("sqlite3");
        const dbPath = path.join(__dirname, "../../backend-node/voters.db");

        if (fs.existsSync(dbPath)) {
            const db = new sqlite3.default.Database(dbPath, sqlite3.default.OPEN_READONLY);

            await new Promise((resolve, reject) => {
                db.all(`SELECT name, wallet_address, face_descriptor FROM voters WHERE is_registered = 1 AND wallet_address IS NOT NULL AND wallet_address != 'undefined'`, async (err, rows) => {
                    if (err) {
                        console.error("Failed to read voters:", err.message);
                        return resolve();
                    }
                    console.log(`Found ${rows.length} voters in database.`);
                    for (const row of rows) {
                        try {
                            const faceHash = hre.ethers.id(row.face_descriptor || "default_mock_face_data");
                            const tx = await voting.connect(ownerSigner).registerVoter(row.wallet_address, faceHash);
                            await tx.wait();
                            console.log(`✅ Synced voter: ${row.name}`);
                        } catch (error) {
                            console.error(`❌ Failed to sync voter ${row.name}:`, error.reason || error.message);
                        }
                    }
                    resolve();
                });
            });
            db.close();
        } else {
            console.log("No voters database found.");
        }

        // Stop impersonating
        await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [newOwnerAddress],
        });

        console.log("--- Sync Complete ---\n");
    } else {
        console.log(`\n--- Skipping Auto-Sync on ${hre.network.name} ---`);
        console.log("Auto-sync uses hardhat_impersonateAccount which is only available on local networks.");
        console.log("Please manually sync candidates/voters using the frontend or separate scripts if needed.\n");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
