import { api } from '../../config/api.js';

const RETURN_KEY = 'returnHome';
const COUNTDOWN_MS = 120000;
let countdownInterval = null;

/* ── Helpers ───────────────────────────────────────────── */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Countdown ─────────────────────────────────────────── */

function startCountdown() {
  const deadline = Date.now() + COUNTDOWN_MS;
  localStorage.setItem(RETURN_KEY, String(deadline));
  updateCountdownDisplay(deadline);
  countdownInterval = setInterval(() => updateCountdownDisplay(deadline), 1000);
}

function stopCountdown() {
  localStorage.removeItem(RETURN_KEY);
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = null;
  const el = document.getElementById('countdown');
  if (el) el.remove();
}

function checkExpiredCountdown() {
  const stored = localStorage.getItem(RETURN_KEY);
  if (stored && Date.now() >= Number(stored)) {
    stopCountdown();
    window.location.hash = '#home';
    return true;
  }
  return false;
}

function updateCountdownDisplay(deadline) {
  const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  if (remaining <= 0) {
    stopCountdown();
    window.location.hash = '#home';
    return;
  }
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  let el = document.getElementById('countdown');
  if (!el) {
    el = document.createElement('div');
    el.id = 'countdown';
    el.className = 'countdown';
    document.body.appendChild(el);
  }
  el.textContent = `↩ ${min}:${String(sec).padStart(2, '0')}`;
}

/* ── Render ────────────────────────────────────────────── */

function render(customerId) {
  const section = document.createElement('section');
  section.className = 'customer-section';
  section.innerHTML = `
    <div class="customer-header">
      <button id="back-btn" class="btn btn-secondary">← Home</button>
      <h2>Customer <span class="mono">${escapeHtml(customerId)}</span></h2>
    </div>
    <div id="redeem-banner" hidden></div>
    <div id="services-table-wrap">
      <p class="loading-text">Loading services…</p>
    </div>
  `;
  return section;
}

function renderTable(services) {
  if (services.length === 0) {
    return '<p class="no-data">No services found for this customer.</p>';
  }

  const rows = services.map((s, i) => `
    <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
      <td>${fmtDate(s.service_id)}</td>
      <td>${s.redemption_id ? fmtDate(s.redemption_id) : '<span class="text-muted">—</span>'}</td>
      <td>${s.redeemer ? '<span class="badge-redeemer">★ FREE</span>' : ''}</td>
    </tr>`).join('');

  return `
    <table class="services-table">
      <thead>
        <tr>
          <th>Service Date</th>
          <th>Redeemed</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderRedeemBanner(unredeemedCount) {
  const banner = document.getElementById('redeem-banner');
  if (unredeemedCount >= 10) {
    banner.hidden = false;
    banner.className = 'redeem-banner';
    banner.innerHTML = `
      <div class="redeem-content">
        <p class="redeem-title">🎉 FREE Oil Change Earned!</p>
        <p class="redeem-sub">${unredeemedCount} unredeemed services — 10 will be applied.</p>
        <div class="redeem-actions">
          <button id="redeem-btn" class="btn btn-success">Redeem Free Service</button>
          <button id="cancel-redeem-btn" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    `;
  } else {
    banner.hidden = false;
    banner.className = 'progress-banner';
    banner.innerHTML = `
      <div class="progress-content">
        <p>${unredeemedCount} of 10 services toward free oil change</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(unredeemedCount / 10) * 100}%"></div>
        </div>
      </div>
    `;
  }
}

/* ── Data ──────────────────────────────────────────────── */

async function fetchServices(customerId) {
  return api(`services?customer_id:startsWith=${encodeURIComponent(customerId)}&_sort=-service_id`);
}

async function fetchUnredeemed(customerId) {
  return api(`services?customer_id:startsWith=${encodeURIComponent(customerId)}&redemption_id:eq=&_sort=service_id`);
}

async function redeemServices(customerId) {
  const unredeemed = await fetchUnredeemed(customerId);
  if (unredeemed.length < 10) return false;

  const batch = unredeemed.slice(0, 10);
  const redemptionId = new Date().toISOString();

  const updates = batch.map((s, i) => {
    const isRedeemer = i === 9; // 10th (newest of the batch, last in asc order)
    return api(`services/${s.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        redemption_id: redemptionId,
        redeemer: isRedeemer,
      }),
    });
  });

  await Promise.all(updates);
  return true;
}

/* ── Page controller ───────────────────────────────────── */

async function loadPage(container, customerId) {
  const wrap = document.getElementById('services-table-wrap');

  try {
    const services = await fetchServices(customerId);
    wrap.innerHTML = renderTable(services);

    const unredeemedCount = services.filter(s => !s.redemption_id).length;
    renderRedeemBanner(unredeemedCount);

    if (unredeemedCount >= 10) {
      document.getElementById('redeem-btn').addEventListener('click', async () => {
        const btn = document.getElementById('redeem-btn');
        btn.disabled = true;
        btn.textContent = 'Redeeming…';
        try {
          await redeemServices(customerId);
          await loadPage(container, customerId);
        } catch (err) {
          btn.textContent = 'Failed — Retry';
          btn.disabled = false;
          console.error(err);
        }
      });
      document.getElementById('cancel-redeem-btn').addEventListener('click', () => {
        document.getElementById('redeem-banner').hidden = true;
      });
    }
  } catch (err) {
    wrap.innerHTML = '<p class="error-text">Failed to load services. Is the server running?</p>';
    console.error(err);
  }
}

export function initCustomer(container, customerId) {
  // Check if a prior countdown expired
  if (checkExpiredCountdown()) return;

  container.innerHTML = '';
  container.appendChild(render(customerId));

  document.getElementById('back-btn').addEventListener('click', () => {
    stopCountdown();
    window.location.hash = '#home';
  });

  // Visibility change: check expiry when tab re-focused
  const onVisibility = () => {
    if (!document.hidden) checkExpiredCountdown();
  };
  document.addEventListener('visibilitychange', onVisibility);

  // Store cleanup ref so router can remove it
  container._cleanupCustomer = () => {
    stopCountdown();
    document.removeEventListener('visibilitychange', onVisibility);
  };

  startCountdown();
  loadPage(container, customerId);
}
