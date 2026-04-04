import { getServices, getUnredeemedServices, redeemServices, logService } from '../../config/api.js';

const RETURN_KEY = 'returnHome';
const COUNTDOWN_MS = 300000;      // 5 minutes
const REDIRECT_WARN_MS = 30000;   // show overlay 30s before timeout
let countdownInterval = null;
let redirectOverlayShown = false;

/* ── Helpers ───────────────────────────────────────────── */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function fmtDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtDateFull(iso) {
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
  redirectOverlayShown = false;
  const el = document.getElementById('countdown');
  if (el) el.remove();
  const overlay = document.getElementById('redirect-overlay');
  if (overlay) overlay.remove();
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
  const timeStr = `${min}:${String(sec).padStart(2, '0')}`;

  // Update inline countdown in the header widget
  const inlineEl = document.getElementById('countdown-inline');
  if (inlineEl) {
    inlineEl.textContent = timeStr;
  }

  // Also keep the fixed-position countdown for scroll visibility
  let el = document.getElementById('countdown');
  if (!el) {
    el = document.createElement('div');
    el.id = 'countdown';
    el.className = 'countdown';
    document.body.appendChild(el);
  }
  el.textContent = `↩ ${timeStr}`;

  // Show redirect warning overlay in last 30 seconds
  const remainingMs = remaining * 1000;
  if (remainingMs <= REDIRECT_WARN_MS && !redirectOverlayShown) {
    redirectOverlayShown = true;
    showRedirectOverlay();
  }
  // Update overlay countdown if visible
  const overlayTimer = document.getElementById('redirect-timer');
  if (overlayTimer) {
    overlayTimer.textContent = `${sec}s`;
  }
}

function showRedirectOverlay() {
  let overlay = document.getElementById('redirect-overlay');
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = 'redirect-overlay';
  overlay.className = 'redirect-overlay';
  overlay.innerHTML = `
    <div class="redirect-card">
      <p>Redirecting to home in: <strong id="redirect-timer"></strong></p>
      <button id="cancel-redirect-btn" class="btn btn-secondary">Cancel</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('cancel-redirect-btn').addEventListener('click', () => {
    // Cancel: restart the full countdown
    stopCountdown();
    startCountdown();
  });
}

/* ── Render ────────────────────────────────────────────── */

function render(customerId) {
  const section = document.createElement('section');
  section.className = 'customer-section';
  section.innerHTML = `
    <div class="customer-header">
      <button id="back-btn" class="btn btn-secondary home-btn">
        <span class="home-label">Home</span>
        <span id="countdown-inline" class="countdown-inline"></span>
      </button>
      <h2>Customer ID: <span class="mono">${escapeHtml(customerId)}</span></h2>
      <button id="log-service-btn" class="btn btn-primary">Log Service</button>
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

  const rows = services.map((s, i) => {
    const tooltipLines = [
      `Service: ${s.number || '—'}`,
      `Date: ${fmtDateFull(s.created_on)}`,
      `Redemption: ${s.redemption || '—'}`,
      `Redeemed: ${s.redemption_date ? fmtDateFull(s.redemption_date) : '—'}`,
    ];
    if (s.is_redeemer) tooltipLines.push('★ FREE SERVICE');
    const tooltip = escapeHtml(tooltipLines.join('\n'));

    return `
    <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'} has-tooltip" data-tooltip="${tooltip}">
      <td class="mono">${escapeHtml(s.number || '—')}</td>
      <td>${fmtDateShort(s.created_on)}</td>
      <td class="mono">${s.redemption ? escapeHtml(s.redemption) : '<span class="text-muted">—</span>'}</td>
      <td>${s.is_redeemer ? '<span class="badge-redeemer">★ FREE</span>' : ''}</td>
    </tr>`;
  }).join('');

  return `
    <table class="services-table">
      <thead>
        <tr>
          <th>Service #</th>
          <th>Date</th>
          <th>Redemption</th>
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
    banner.className = 'redeem-btn-wrap';
    banner.innerHTML = `
      <button id="redeem-btn" class="btn btn-redeem">Redeem free Oil Change</button>
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

/* ── Page controller ───────────────────────────────────── */

async function loadPage(container, customerId) {
  const wrap = document.getElementById('services-table-wrap');

  try {
    const services = await getServices(customerId);
    wrap.innerHTML = renderTable(services);

    const unredeemedCount = services.filter(s => !s.redemption).length;
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

    }
  } catch (err) {
    wrap.innerHTML = '<p class="error-text">Failed to load services.</p>';
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

  document.getElementById('log-service-btn').addEventListener('click', async () => {
    const btn = document.getElementById('log-service-btn');
    btn.disabled = true;
    btn.textContent = '…';
    try {
      await logService(customerId);
      await loadPage(container, customerId);
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Log Service';
    }
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
