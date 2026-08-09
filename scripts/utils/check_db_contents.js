const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Determine path based on where we think it is. 
// Based on previous ls, `voting_app.db` is in root d:/FinalProj/voting_app.db
// And `voters.db` is in `backend-node/voters.db`
// Let's check `backend-node/voters.db` first as that's what server.js uses

const dbPath = path.join(__dirname, 'backend-node', 'voters.db');
const dbPath2 = path.join(__dirname, 'voting_app.db');

console.log("Checking databases...");

function checkDB(pathStr) {
    console.log(`\n📂 Connecting to: ${pathStr}`);
    const db = new sqlite3.Database(pathStr, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error(`❌ Error opening ${pathStr}:`, err.message);
            return;
        }
    });

    db.all("SELECT * FROM voters", [], (err, rows) => {
        if (err) {
            console.error(`❌ Error reading voters from ${pathStr}:`, err.message);
        } else {
            console.log(`✅ Found ${rows.length} voters in ${pathStr}:`);
            rows.forEach((row) => {
                console.log(`   - Name: ${row.name}`);
                console.log(`     Wallet: ${row.wallet_address}`);
                console.log(`     Mobile: ${row.mobile}`);
                console.log(`     Email: ${row.email}`);
                console.log(`     Voter ID: ${row.voter_id}`);
                console.log(`     Registered: ${row.is_registered ? 'Yes' : 'No'}`);
                console.log("--------------------------------------------------");
            });
        }
        db.close();
    });
}

// Check both for completeness
checkDB(dbPath);
checkDB(dbPath2);
