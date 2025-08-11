# Subsidised Lunch — QR-based Tracking System

## What this package contains
- **Frontend (public/)**: `index.html`, `styles.css`, `script.js`, and a `logo-placeholder.png`.  
  - Vendor opens the `index.html` on a tablet browser and scans employee QR codes.
  - The page links to a Google Sheet (replace the placeholder link in `index.html`).

- **Backend**: `server.js` (Express) with a small SQLite DB (`data/employees.db`) to store employees and daily claims.  
  - `init_db.js` creates a sample DB with a few employees.
  - `package.json` includes dependencies and scripts.

## Quick setup (local)
1. Install Node.js (v16+ recommended).
2. Unzip and `cd` into the project.
3. Run `npm install`.
4. Initialize DB: `node init_db.js`  (or `npm run init-db`)
5. Start server: `node server.js`  (or `npm start`)
6. Open `http://localhost:3000` on a tablet/phone to use the scanner.

## How it works
- Each employee should have a QR code that contains either the `emp_number` (like `E1001`) or a small JSON like `{"employeeId":"E1001"}`.
- When vendor scans QR, frontend `POST /api/verify` with the scanned string.
- Backend checks:
  - Employee exists and is active.
  - Employee hasn't already claimed lunch today.
  - Logs the claim and returns allowed/denied.

## Customization ideas
- Integrate with company HR/AD via API to sync master employee data.
- Replace SQLite with a central DB and host server on a reachable endpoint.
- Add vendor authentication and offline-syncing (Android app).
- Export daily reports to Google Sheets using Apps Script or Google Sheets API.

## Google Sheet
- Replace the link in `public/index.html` with your spreadsheet URL.

