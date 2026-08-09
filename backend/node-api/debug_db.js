const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./voters.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the voters database.');
});

db.serialize(() => {
    db.all(`SELECT id, name, wallet_address, voter_id FROM voters`, (err, rows) => {
        if (err) {
            console.error(err.message);
        }
        console.log(`Row count: ${rows.length}`);
        rows.forEach((row) => {
            console.log(`${row.id}: ${row.name} - ${row.wallet_address} (${row.voter_id})`);
        });
    });
});

db.close();
