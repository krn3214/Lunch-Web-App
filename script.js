const resultEl = document.getElementById('result');
const logEl = document.getElementById('log');
const startBtn = document.getElementById('start-scan');
const stopBtn = document.getElementById('stop-scan');
const manualSubmit = document.getElementById('manual-submit');
const manualInput = document.getElementById('employee-id');

let html5QrcodeScanner;
let scanning = false;

function addLog(text){
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleString()} — ${text}`;
  logEl.prepend(li);
}

function showResult(message, ok){
  resultEl.textContent = message;
  resultEl.className = 'result ' + (ok ? 'success' : 'error');
}

async function verifyEmployee(employeeId){
  try{
    showResult('Verifying...', true);
    const resp = await fetch('/api/verify', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ employeeId })
    });
    const data = await resp.json();
    if(resp.ok){
      if(data.allowed){
        showResult(`✅ ${data.name || employeeId} — Allowed.`, true);
        addLog(`${data.name || employeeId} — Allowed`);
      } else {
        showResult(`❌ ${data.name || employeeId} — ${data.reason || 'Not allowed'}`, false);
        addLog(`${data.name || employeeId} — Denied: ${data.reason || 'N/A'}`);
      }
    } else {
      showResult('Server error: ' + (data.message||resp.statusText), false);
      addLog('Server error');
    }
  }catch(err){
    console.error(err);
    showResult('Network or server error', false);
    addLog('Network/server error');
  }
}

// Manual submit
manualSubmit.addEventListener('click', () => {
  const v = manualInput.value && manualInput.value.trim();
  if(!v) return alert('Enter employee id');
  verifyEmployee(v);
});

// Start scanner
startBtn.addEventListener('click', async () => {
  if(scanning) return;
  const reader = document.getElementById('reader');
  html5QrcodeScanner = new Html5Qrcode(/* element id*/ "reader");
  try{
    await html5QrcodeScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      qrCodeMessage => {
        // on success
        console.log("QR code:", qrCodeMessage);
        // assume QR contains employeeId (or JSON with {employeeId:..})
        let emp = qrCodeMessage;
        try{
          const parsed = JSON.parse(qrCodeMessage);
          if(parsed.employeeId) emp = parsed.employeeId;
          else if(parsed.emp) emp = parsed.emp;
        }catch(e){}
        verifyEmployee(emp);
        // temporarily stop scanning for 2 seconds to avoid duplicate reads
        html5QrcodeScanner.pause(true);
        setTimeout(()=> html5QrcodeScanner.resume(), 2000);
      },
      errorMessage => {
        // ignore decode errors
      }
    );
    scanning = true;
    showResult('Scanner active — show QR to camera', true);
  }catch(err){
    console.error(err);
    showResult('Camera error or permission denied', false);
  }
});

// Stop scanner
stopBtn.addEventListener('click', async () => {
  if(!scanning || !html5QrcodeScanner) return;
  await html5QrcodeScanner.stop();
  html5QrcodeScanner.clear();
  scanning = false;
  showResult('Scanner stopped', true);
});
