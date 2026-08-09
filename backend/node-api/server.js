const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Setup
const db = new sqlite3.Database('./voters.db', (err) => {
    if (err) console.error("DB Error:", err.message);
    else console.log("Connected to SQLite Database.");
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS voters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet_address TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        voter_id TEXT UNIQUE NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT NOT NULL,
        face_descriptor TEXT NOT NULL,
        is_registered INTEGER DEFAULT 1,
        age INTEGER,
        dob TEXT
    )`);

    // Migration: Add age column if it doesn't exist
    db.run("ALTER TABLE voters ADD COLUMN age INTEGER", (err) => {
        // Ignore error if column already exists
    });

    // Migration: Add dob column if it doesn't exist
    db.run("ALTER TABLE voters ADD COLUMN dob TEXT", (err) => {
        // Ignore error if column already exists
    });
});

// Storage for Images
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Ensure uploads dir
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// --- Routes ---

// 1. Admin Register Voter
const crypto = require('crypto');
const ENC_KEY = process.env.ENC_KEY;
const IV = process.env.IV;

if (!ENC_KEY || ENC_KEY.length !== 32) {
    console.error("FATAL ERROR: ENC_KEY must be exactly 32 characters.");
    process.exit(1);
}
if (!IV || IV.length !== 16) {
    console.error("FATAL ERROR: IV must be exactly 16 characters.");
    process.exit(1);
}

// Helper: Encrypt
function encrypt(text) {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENC_KEY), Buffer.from(IV));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}

// Helper: Decrypt
function decrypt(text) {
    let encryptedText = Buffer.from(text, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENC_KEY), Buffer.from(IV));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Helper: Euclidean Distance for Face Matching
function getEuclideanDistance(d1, d2) {
    if (d1.length !== d2.length) return 1.0;
    let sum = 0;
    for (let i = 0; i < d1.length; i++) {
        sum += (d1[i] - d2[i]) * (d1[i] - d2[i]);
    }
    return Math.sqrt(sum);
}

app.post('/admin/register', upload.single('face_image'), (req, res) => {
    const { name, wallet_address, voter_id, mobile, email, face_descriptor, dob } = req.body;

    // Relaxed validation for Booth Users (who might not have mobile/email)
    if (!name || !wallet_address || !voter_id || !face_descriptor || !dob) {
        return res.status(400).json({ error: "Missing required fields (Name, Wallet, ID, Face, DOB)" });
    }

    // Calculate Age from DOB
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 18) {
        return res.status(400).json({ error: "Voter must be 18 or older to register." });
    }

    // Mobile/Email are optional now (can be empty string or "N/A")


    // 3. Biometric Deduplication Check
    db.all("SELECT face_descriptor FROM voters", [], (err, rows) => {
        if (err) return res.status(500).json({ error: "DB Error during check" });

        let newDescriptor;
        try {
            newDescriptor = JSON.parse(face_descriptor);
        } catch (e) {
            return res.status(400).json({ error: "Invalid face descriptor format" });
        }

        for (const row of rows) {
            try {
                const storedDesc = JSON.parse(decrypt(row.face_descriptor));
                const distance = getEuclideanDistance(newDescriptor, storedDesc);
                if (distance < 0.45) { // Threshold logic (0.6 is typical, 0.45 is stricter)
                    return res.status(400).json({ error: "Face already registered! Duplicate detected." });
                }
            } catch (e) {
                console.error("Skipping invalid stored face:", e.message);
            }
        }

        // 4. Proceed to Insert if Unique
        // 4a. Compute Hash for Blockchain (SHA-256)
        const faceHash = '0x' + crypto.createHash('sha256').update(face_descriptor).digest('hex');

        // 4b. Encrypt for DB
        const faceEncrypted = encrypt(face_descriptor);

        const stmt = db.prepare("INSERT INTO voters (name, wallet_address, voter_id, mobile, email, face_descriptor, age, dob) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        stmt.run(name, wallet_address, voter_id, mobile, email, faceEncrypted, age, dob, function (err) {
            if (err) {
                return res.status(400).json({ error: "User already registered (Wallet/ID) or DB Error: " + err.message });
            }
            res.json({ status: "success", id: this.lastID, faceHash: faceHash, message: "Voter Registered & Encrypted" });
        });
        stmt.finalize();
    });
});

// 1.5 Update Voter Details (Mobile/Email)
app.post('/admin/update-voter', (req, res) => {
    const { wallet_address, mobile, email } = req.body;

    if (!wallet_address || !mobile || !email) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const stmt = db.prepare("UPDATE voters SET mobile = ?, email = ? WHERE wallet_address = ?");
    stmt.run(mobile, email, wallet_address, function (err) {
        if (err) {
            return res.status(500).json({ error: "DB Error: " + err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Voter not found" });
        }
        res.json({ status: "success", message: "Voter details updated successfully" });
    });
    stmt.finalize();
});

// 2. Get Voter by Address
app.get('/voter/:address', (req, res) => {
    const address = req.params.address;
    db.get("SELECT * FROM voters WHERE wallet_address = ?", [address], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Voter not found" });

        // Decrypt Face Descriptor on the fly
        try {
            row.face_descriptor = decrypt(row.face_descriptor);
        } catch (e) {
            console.error("Decryption failed for user:", address);
        }

        res.json(row);
    });
});

// 2.5 Get All Registered Voters (for Booth Mode Dropdown)
app.get('/admin/voters', (req, res) => {
    db.all("SELECT name, wallet_address, voter_id, mobile, email, is_registered FROM voters", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. Faucet (Send Sepolia ETH)
const { ethers } = require('ethers');
const PROVIDER_URL = process.env.RPC_URL || "https://1rpc.io/sepolia";
const FAUCET_PRIVATE_KEY = process.env.PRIVATE_KEY;

app.post('/admin/faucet', async (req, res) => {
    const { wallet_address } = req.body;
    if (!wallet_address) return res.status(400).json({ error: "Wallet address required" });

    if (!FAUCET_PRIVATE_KEY) {
        return res.status(500).json({ error: "Faucet not configured — PRIVATE_KEY not set in .env" });
    }

    try {
        const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
        const wallet = new ethers.Wallet(FAUCET_PRIVATE_KEY, provider);

        // Check deployer balance first
        const balance = await provider.getBalance(wallet.address);
        const sendAmount = ethers.parseEther("0.01"); // 0.01 ETH on Sepolia (conserve funds)

        if (balance < sendAmount) {
            return res.status(400).json({
                error: "Faucet wallet low on Sepolia ETH. Use an external faucet: https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
            });
        }

        const tx = await wallet.sendTransaction({
            to: wallet_address.trim(),
            value: sendAmount
        });

        console.log(`Sent 0.01 Sepolia ETH to ${wallet_address} | Hash: ${tx.hash}`);
        res.json({
            status: "success",
            message: "Sent 0.01 Sepolia ETH",
            txHash: tx.hash,
            explorerUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`
        });
    } catch (e) {
        console.error("Faucet Error:", e);
        res.status(500).json({ error: "Faucet Failed: " + e.message });
    }
});

// --- Persistence & Reset APIs ---

const CANDIDATES_FILE = path.join(__dirname, 'data', 'candidates.json');

// 1. Get Candidates (for restore script or UI)
app.get('/admin/candidates', (req, res) => {
    if (fs.existsSync(CANDIDATES_FILE)) {
        try {
            const data = fs.readFileSync(CANDIDATES_FILE);
            res.json(JSON.parse(data));
        } catch (e) {
            res.json([]);
        }
    } else {
        res.json([]);
    }
});

// 2. Add Candidate (Persistence Only - Contract call done by Frontend or Restore)
app.post('/admin/candidates', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    let candidates = [];
    if (fs.existsSync(CANDIDATES_FILE)) {
        try {
            candidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE));
        } catch (e) { candidates = []; }
    }
    // Avoid duplicates
    if (!candidates.includes(name)) {
        candidates.push(name);
        fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2));
    }
    res.json({ message: "Candidate saved to disk", candidates });
});

// 3. Reset Candidates (Clear JSON only - Contract reset is done by Frontend via MetaMask)
app.delete('/admin/candidates', async (req, res) => {
    try {
        fs.writeFileSync(CANDIDATES_FILE, JSON.stringify([]));
        console.log("Candidates JSON cleared.");
        res.json({ message: "Candidates cleared from disk." });
    } catch (e) {
        console.error("Reset Error:", e);
        res.status(500).json({ error: "Failed to reset candidates: " + e.message });
    }
});

// 4. Reset Voters (Clear DB)
app.delete('/admin/voters', (req, res) => {
    db.serialize(() => {
        db.run("DELETE FROM voters", (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ message: "All voters deleted from Database." });
            }
        });
    });
});
// 5. Election Dates
const DATES_FILE = path.join(__dirname, 'data', 'election-dates.json');

// Ensure data dir
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

app.get('/admin/election-dates', (req, res) => {
    if (fs.existsSync(DATES_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(DATES_FILE));
            res.json(data);
        } catch (e) {
            res.json({ startDate: '', endDate: '' });
        }
    } else {
        res.json({ startDate: '', endDate: '' });
    }
});

app.post('/admin/election-dates', (req, res) => {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ error: "Both dates required" });
    if (new Date(endDate) <= new Date(startDate)) return res.status(400).json({ error: "End date must be after start date" });
    fs.writeFileSync(DATES_FILE, JSON.stringify({ startDate, endDate }, null, 2));
    res.json({ status: "success", message: "Election dates saved", startDate, endDate });
});

app.delete('/admin/election-dates', (req, res) => {
    if (fs.existsSync(DATES_FILE)) {
        fs.unlinkSync(DATES_FILE);
    }
    res.json({ status: "success", message: "Election dates reset" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
