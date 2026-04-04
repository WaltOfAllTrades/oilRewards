function cleanCustomerId(raw) {
  return raw.trim().replace(/\D/g, '');
}

function isValidCustomerId(cleaned) {
  return /^\d{6}$/.test(cleaned);
}

function render() {
  const section = document.createElement('section');
  section.className = 'home-section';
  section.innerHTML = `
    <div class="home-card">
      <img src="src/drip.svg" alt="" class="drip-icon" />
      <h2>Service Log</h2>

      <input type="text" id="customer-id" placeholder="Customer ID (e.g. 042619)"
             maxlength="10" autocomplete="off" />
      <p id="input-error" class="error-text" hidden></p>

      <div class="home-actions">
        <button id="paste-go-btn" class="btn btn-outline-red">Paste + Go</button>
        <button id="go-btn" class="btn btn-outline-white">Go</button>
      </div>
    </div>
  `;
  return section;
}

function showError(msg) {
  const el = document.getElementById('input-error');
  el.textContent = msg;
  el.hidden = false;
}

function clearError() {
  document.getElementById('input-error').hidden = true;
}

function getValidatedId() {
  const raw = document.getElementById('customer-id').value;
  const cleaned = cleanCustomerId(raw);
  if (!isValidCustomerId(cleaned)) {
    showError('Customer ID must be exactly 6 digits');
    return null;
  }
  clearError();
  return cleaned;
}

async function handlePasteAndGo() {
  try {
    const text = await navigator.clipboard.readText();
    const cleaned = cleanCustomerId(text);
    document.getElementById('customer-id').value = cleaned;
    clearError();
    handleGo();
  } catch {
    showError('Clipboard access denied — type the ID manually');
  }
}

function handleGo() {
  const customerId = getValidatedId();
  if (!customerId) return;
  window.location.hash = `#customer/${customerId}`;
}

export function initHome(container) {
  container.innerHTML = '';
  container.appendChild(render());

  document.getElementById('go-btn').addEventListener('click', handleGo);
  document.getElementById('paste-go-btn').addEventListener('click', handlePasteAndGo);
  document.getElementById('customer-id').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleGo();
  });

  // Auto-focus input
  document.getElementById('customer-id').focus();
}
