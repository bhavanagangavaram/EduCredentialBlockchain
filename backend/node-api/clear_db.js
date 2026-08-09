const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./voters.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the voters database.');
});

db.serialize(() => {
    db.run("DELETE FROM voters", (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log("Deleted all rows from voters table.");
        }
    });
});

db.close();
