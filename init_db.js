/**
 * Creates a simple SQLite DB with two tables:
 * - employees (id, emp_number, name, active)
 * - claims (id, employee_id, date, timestamp)
 *
 * Adds a few sample employees.
 */
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, 'data');
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = path.join(dataDir, 'employees.db');
if(fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new sqlite3.Database(dbPath);
db.serialize(()=> {
  db.run(`CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_number TEXT UNIQUE,
    name TEXT,
    active INTEGER DEFAULT 1
  )`);
  db.run(`CREATE TABLE claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    date TEXT,
    timestamp TEXT,
    FOREIGN KEY(employee_id) REFERENCES employees(id)
  )`);
  const stmt = db.prepare('INSERT INTO employees(emp_number, name, active) VALUES(?,?,?)');
  stmt.run(['E1001', 'Rajesh Kumar', 1]);
  stmt.run(['E1002', 'Sunita Sharma', 1]);
  stmt.run(['E1003', 'Amit Patel', 0]); // inactive
  stmt.finalize();
  console.log('Sample DB created at', dbPath);
});
db.close();
