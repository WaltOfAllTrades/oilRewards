import { api } from '../../config/api.js';

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
      <h2>Log Service</h2>

      <input type="text" id="customer-id" placeholder="Customer ID (e.g. 042619)"
             maxlength="10" autocomplete="off" />
      <p id="input-error" class="error-text" hidden></p>

      <div class="home-actions">
        <button id="go-btn" class="btn btn-outline-white">Go</button>
        <button id="paste-go-btn" class="btn btn-outline-red">Paste + Go</button>
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
    setTimeout(() => handleGo(), 200);
  } catch {
    showError('Clipboard access denied — type the ID manually');
  }
}

async function handleGo() {
  const customerId = getValidatedId();
  if (!customerId) return;

  const btn = document.getElementById('go-btn');
  btn.disabled = true;
  btn.textContent = '…';

  try {
    const service = {
      service_id: new Date().toISOString(),
      customer_id: customerId,
      redemption_id: '',
      redeemer: false,
    };
    await api('services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
    window.location.hash = `#customer/${customerId}`;
  } catch (err) {
    showError('Failed to log service. Is the server running?');
    console.error(err);
    btn.disabled = false;
    btn.textContent = 'Go';
  }
}

export function initHome(container) {
  container.innerHTML = '';
  container.appendChild(render());

  document.getElementById('go-btn').addEventListener('click', handleGo);
  document.getElementById('paste-go-btn').addEventListener('click', handlePasteAndGo);

  // Auto-focus input
  document.getElementById('customer-id').focus();
}
