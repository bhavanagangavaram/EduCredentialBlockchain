const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config({ path: path.resolve(__dirname, '../../backend-node/.env') });

// Configuration
const DB_PATH = path.resolve(__dirname, '../../backend-node/voters.db');
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const PROVIDER_URL = "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000"; // Loaded from environment

// Encryption Keys (from backend .env)
const ENC_KEY = process.env.ENC_KEY;
const IV = process.env.IV;

if (!ENC_KEY || !IV) {
    console.error("❌ Error: ENC_KEY or IV missing in backend-node/.env");
    process.exit(1);
}

// Helper: Decrypt
function decrypt(text) {
    let encryptedText = Buffer.from(text, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENC_KEY), Buffer.from(IV));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

async function main() {
    console.log("🔄 Starting Database <-> Blockchain Sync...");

    // 1. Connect to Blockchain
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // ABI for registerVoter
    const abi = [
        "function registerVoter(address _voter, bytes32 _faceHash) external",
        "function owner() view returns (address)",
        "function transferOwnership(address newOwner) external"
    ];
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

    // Check Owner
    const currentOwner = await contract.owner();
    console.log(`Contract Owner: ${currentOwner}`);

    if (currentOwner.toLowerCase() !== wallet.address.toLowerCase()) {
        console.log("⚠️  Warning: Script wallet is NOT the owner. Impersonating current owner...");
        // This script is running in Node context, we can't easily use Hardhat Impersonation features 
        // unless we run via `npx hardhat run`.
        // BUT, I can try to use the user's owner account if I knew the private key, which I don't.
        // Wait, I transferred ownership to 0x6d2b... in a previous step!
        // So Account #0 is NO LONGER THE OWNER.
        // I must use Hardhat Runtime Environment (HRE) to impersonate the new owner.
        console.error("❌ Cannot sync because ownership was transferred. Please run this script using `npx hardhat run`.");
        process.exit(1);
    }

    // 2. Open Database
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error("❌ DB Error:", err.message);
            process.exit(1);
        }
    });

    db.all("SELECT * FROM voters", [], async (err, rows) => {
        if (err) {
            throw err;
        }
        console.log(`Found ${rows.length} voters in database.`);

        for (const row of rows) {
            try {
                const descriptor = decrypt(row.face_descriptor);
                const faceHash = '0x' + crypto.createHash('sha256').update(descriptor).digest('hex');

                console.log(`Processing ${row.name} (${row.wallet_address})...`);

                try {
                    const tx = await contract.registerVoter(row.wallet_address, faceHash);
                    await tx.wait();
                    console.log(`✅ Registered ${row.name} on Blockchain.`);
                } catch (e) {
                    if (e.message.includes("Voter already registered")) {
                        console.log(`ℹ️  ${row.name} already registered on chain.`);
                    } else {
                        console.error(`❌ Failed to register ${row.name}:`, e.shortMessage || e.message);
                    }
                }

            } catch (e) {
                console.error(`❌ Error processing ${row.name}:`, e.message);
            }
        }
        console.log("✅ Sync Complete.");
    });
}

// Since I realized ownership is transferred, I need to write this as a Hardhat script, not plain node.
// So I will output a Hardhat-compatible script below.
