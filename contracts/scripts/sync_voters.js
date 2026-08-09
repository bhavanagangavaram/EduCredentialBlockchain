import hre from "hardhat";
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Backend Env for Decryption
dotenv.config({ path: path.resolve(__dirname, '../../backend-node/.env') });

const ENC_KEY = process.env.ENC_KEY;
const IV = process.env.IV;

// Helper: Decrypt
function decrypt(text) {
    let encryptedText = Buffer.from(text, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENC_KEY), Buffer.from(IV));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

async function main() {
    console.log("🔄 Starting Database <-> Blockchain Sync (Hardhat Mode)...");

    if (!ENC_KEY || !IV) {
        console.error("❌ Error: ENC_KEY or IV missing in backend-node/.env");
        return;
    }

    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const DB_PATH = path.resolve(__dirname, '../../backend-node/voters.db');

    // 1. Connect to Contract
    const Voting = await hre.ethers.getContractFactory("Voting");
    let voting = Voting.attach(CONTRACT_ADDRESS);

    // 2. Check Owner & Impersonate if needed
    const ownerAddr = await voting.owner();
    console.log(`Contract Owner: ${ownerAddr}`);

    // Impersonate the owner to execute admin commands
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [ownerAddr],
    });
    const signer = await hre.ethers.getSigner(ownerAddr);

    // Fund the owner if low balance
    const balance = await hre.ethers.provider.getBalance(ownerAddr);
    if (balance < hre.ethers.parseEther("1.0")) {
        console.log("Funding owner account...");
        const [funder] = await hre.ethers.getSigners();
        await funder.sendTransaction({
            to: ownerAddr,
            value: hre.ethers.parseEther("5.0"),
        });
    }

    // Connect signer to contract
    voting = voting.connect(signer);

    // 3. Read Database
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);

    const rows = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM voters", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    console.log(`Found ${rows.length} voters in ID matching database.`);

    for (const row of rows) {
        try {
            // Decrypt face descriptor
            const descriptor = decrypt(row.face_descriptor);
            // Re-hash for Blockchain
            const faceHash = '0x' + crypto.createHash('sha256').update(descriptor).digest('hex');

            console.log(`Syncing ${row.name} (${row.wallet_address})...`);

            try {
                // Check if already registered? (Optimization, but `registerVoter` reverts if true)
                // We'll just try-catch the transaction
                const tx = await voting.registerVoter(row.wallet_address, faceHash);
                await tx.wait();
                console.log(`✅ Registered ${row.name} on Blockchain.`);
            } catch (e) {
                if (e.message.includes("Voter already registered")) {
                    console.log(`ℹ️  ${row.name} already registered.`);
                } else {
                    console.error(`❌ Failed to register ${row.name}:`, e.message);
                }
            }

        } catch (e) {
            console.error(`❌ Error processing ${row.name}:`, e.message);
        }
    }

    await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [ownerAddr],
    });

    db.close();
    console.log("✅ Sync Complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
