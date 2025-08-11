/**
 * Simple Express backend with SQLite for employee verification and daily claim blocking.
 * - POST /api/verify { employeeId }
 *   returns { allowed: true/false, name, reason }
 *
 * To run:
 * 1. npm install
 * 2. node init_db.js   # creates ./data/employees.db with sample employees
 * 3. node server.js
 */

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'employees.db');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve frontend (public folder)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// open DB
if(!fs.existsSync(DB_PATH)){
  console.error('Database not found. Run init_db.js first to create a sample DB at ' + DB_PATH);
  process.exit(1);
}
const db = new sqlite3.Database(DB_PATH);

// Helper: check if employee already claimed today
function claimedToday(employeeId, callback){
  const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD
  const sql = `SELECT COUNT(1) as c FROM claims WHERE employee_id = ? AND date = ?`;
  db.get(sql, [employeeId, today], (err, row) => {
    if(err) return callback(err);
    callback(null, row.c > 0);
  });
}

// API endpoint
app.post('/api/verify', (req, res) => {
  const { employeeId } = req.body;
  if(!employeeId) return res.status(400).json({ message: 'employeeId required' });

  // lookup employee
  db.get('SELECT id, name, active FROM employees WHERE id = ? OR emp_number = ?', [employeeId, employeeId], (err, row) => {
    if(err) return res.status(500).json({ message: 'DB error' });
    if(!row) return res.json({ allowed:false, reason: 'Employee not found' });

    if(!row.active){
      return res.json({ allowed:false, reason: 'Not active', name: row.name });
    }

    claimedToday(row.id, (err, claimed) => {
      if(err) return res.status(500).json({ message: 'DB error' });
      if(claimed){
        return res.json({ allowed:false, reason: 'Already claimed today', name: row.name });
      }
      // record claim
      const today = new Date().toISOString().slice(0,10);
      const now = new Date().toISOString();
      const ins = 'INSERT INTO claims(employee_id, date, timestamp) VALUES(?,?,?)';
      db.run(ins, [row.id, today, now], function(err2){
        if(err2) return res.status(500).json({ message: 'Failed to record claim' });
        return res.json({ allowed:true, name: row.name });
      });
    });
  });
});

// Simple endpoint to fetch latest claims (for vendor UI polling if desired)
app.get('/api/claims/recent', (req, res) => {
  db.all('SELECT c.id, c.employee_id, e.name, c.date, c.timestamp FROM claims c JOIN employees e ON e.id = c.employee_id ORDER BY c.timestamp DESC LIMIT 50', [], (err, rows) => {
    if(err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
