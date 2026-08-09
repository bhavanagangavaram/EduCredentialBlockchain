const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../backend-node/voters.db');
console.log(`Opening DB at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening DB:", err.message);
        process.exit(1);
    }
});

const wallet = "0xCc792B595Fe3167515724783f2c3c6A59a09E445";
const mobile = "9381996621";
const email = "bhavanagangavaram1@gmail.com";

db.serialize(() => {
    db.get("SELECT * FROM voters WHERE wallet_address = ?", [wallet], (err, row) => {
        if (err) {
            console.error("Error fetching user:", err);
            return;
        }
        if (!row) {
            console.log("⚠️ User not found in DB!");
        } else {
            console.log("Current User Data:", row);

            db.run("UPDATE voters SET mobile = ?, email = ? WHERE wallet_address = ?", [mobile, email, wallet], function (err) {
                if (err) {
                    console.error("❌ Update Error:", err.message);
                } else {
                    console.log(`✅ Success! Row(s) updated: ${this.changes}`);
                }
            });
        }
    });
});

db.close();
