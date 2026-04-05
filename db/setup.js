const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'aegis.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) { console.error('Failed to open database:', err.message); process.exit(1); }
  console.log('Connected to aegis.db');
});

const schema = fs.readFileSync(schemaPath, 'utf8');

db.serialize(() => {
  db.exec(schema, (err) => {
    if (err) { console.error('Schema error:', err.message); process.exit(1); }
    console.log('Database schema applied successfully.');
  });
});

db.close();
