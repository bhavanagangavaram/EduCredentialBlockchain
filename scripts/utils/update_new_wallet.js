const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'backend-node/voters.db');
console.log(`Open DB at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening DB:", err.message);
        process.exit(1);
    }
});

const wallet = "0x24610453B421063A7D79F8FdcB8C09082C0499a5";
const mobile = "9381996621";
const email = "bhavanagangavaram1@gmail.com";

db.serialize(() => {
    db.run("UPDATE voters SET mobile = ?, email = ? WHERE wallet_address = ?", [mobile, email, wallet], function (err) {
        if (err) {
            console.error("❌ Update Error:", err.message);
        } else {
            if (this.changes > 0) {
                console.log(`✅ Success! Updated ${website} to test data.`);
                console.log(`Rows updated: ${this.changes}`);
            } else {
                console.log(`⚠️ Wallet ${wallet} NOT FOUND in DB. Cannot update.`);
                console.log("Please register this wallet first via the Admin panel.");
            }
        }
        db.close();
    });
});
