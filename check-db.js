const Database = require('better-sqlite3');
const db = new Database('farm-to-market.db');
console.log('Users:', db.prepare('SELECT id, name, role, status FROM users').all());
console.log('Crops:', db.prepare('SELECT id, name, SUBSTR(description, 1, 50) as description FROM crops').all());
db.prepare(`DELETE FROM crops WHERE description LIKE '%I can see the 404 error%'`).run();
console.log('Deleted bad crops.');
