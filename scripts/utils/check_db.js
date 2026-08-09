const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'backend-node/voters.db');
console.log(`Checking DB at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening DB:", err.message);
        process.exit(1);
    }
});

const wallet = "0xCc792B595Fe3167515724783f2c3c6A59a09E445";

db.get("SELECT * FROM voters WHERE wallet_address = ?", [wallet], (err, row) => {
    if (err) {
        console.error("Error fetching user:", err);
    } else if (!row) {
        console.log("⚠️ User NOT found in DB!");
    } else {
        console.log("✅ Current DB Data:");
        console.log("Mobile:", row.mobile);
        console.log("Email:", row.email);
    }
    db.close();
});
