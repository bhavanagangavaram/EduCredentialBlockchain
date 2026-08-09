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

    const db = new sqlite3.Database('../backend-node/voters.db', sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error(err.message);
            process.exit(1);
        }
    });

    db.all(`SELECT id, name, wallet_address, face_descriptor FROM voters`, async (err, rows) => {
        if (err) {
            console.error(err.message);
            return;
        }

        console.log(`Found ${rows.length} voters in the database.`);

        for (const row of rows) {
            if (!row.wallet_address || row.wallet_address === "undefined") {
                console.log(`Skipping voter ${row.name} - no wallet address.`);
                continue;
            }

            try {
                // Check if already registered on-chain
                const voterData = await voting.voters(row.wallet_address);
                if (voterData.isRegistered) {
                    console.log(`Voter ${row.name} (${row.wallet_address}) is already registered on-chain. Skipping.`);
                    continue;
                }

                console.log(`Registering voter ${row.name} (${row.wallet_address}) to blockchain...`);
                // Generate a mockup faceHash from the descriptor (normally the backend does this)
                const faceHash = ethers.id(row.face_descriptor || "default_mock_face_data");

                const tx = await voting.connect(owner).registerVoter(row.wallet_address, faceHash);
                await tx.wait();
                console.log(`✅ Successfully registered ${row.name} to blockchain.`);
            } catch (error) {
                console.error(`❌ Failed to register ${row.name}:`, error.reason || error.message);
            }
        }

        db.close();
        console.log("\nSync complete.");
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
