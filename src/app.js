import { initHome } from './features/home/home.js';
import { initCustomer } from './features/customer/customer.js';
import { initLogin } from './features/login/login.js';
import { getSession, signOut, onAuthStateChange } from './services/auth.js';
import { deleteAllServices } from './config/api.js';

let authenticated = false;

/* ── Auth gate ──────────────────────────────────────────── */

async function checkAuth() {
  const { session } = await getSession();
  authenticated = !!session;
  updateLogoutButton();
  route();
}

function updateLogoutButton() {
  const btn = document.getElementById('logout-btn');
  btn.hidden = !authenticated;
}

/* ── Router ─────────────────────────────────────────────── */

function route() {
  const main = document.getElementById('main-content');

  // Cleanup previous page if needed
  if (main._cleanupCustomer) {
    main._cleanupCustomer();
    main._cleanupCustomer = null;
  }

  if (!authenticated) {
    document.getElementById('db-control-btn').hidden = true;
    initLogin(main, () => {
      // onSuccess callback — auth state change will handle re-route
    });
    return;
  }

  const hash = window.location.hash || '#home';
  const [page, param] = hash.slice(1).split('/');

  // Show db-control only on home page
  const dbBtn = document.getElementById('db-control-btn');

  switch (page) {
    case 'customer':
      dbBtn.hidden = true;
      if (param) {
        initCustomer(main, param);
      } else {
        window.location.hash = '#home';
      }
      break;
    default:
      dbBtn.hidden = false;
      initHome(main);
      break;
  }
}

/* ── Init ──────────────────────────────────────────────── */

window.addEventListener('hashchange', route);
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  onAuthStateChange((session) => {
    authenticated = !!session;
    updateLogoutButton();
    if (!session) {
      window.location.hash = '#home';
    }
    route();
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut();
    // Auth state change listener will handle the rest
  });
});

/* ── Database Control overlay ──────────────────────────── */

function showOverlay(html) {
  const overlay = document.getElementById('db-overlay');
  overlay.innerHTML = html;
  overlay.hidden = false;
}

function hideOverlay() {
  const overlay = document.getElementById('db-overlay');
  overlay.hidden = true;
  overlay.innerHTML = '';
}

function showDeleteCard() {
  showOverlay(`
    <div class="db-card">
      <button class="db-card-close db-card-x" id="db-close-btn">✕</button>
      <button class="db-card-delete btn" id="db-delete-btn">Delete all logged services</button>
    </div>
  `);
  document.getElementById('db-close-btn').addEventListener('click', hideOverlay);
  document.getElementById('db-delete-btn').addEventListener('click', showConfirmCard);
  document.getElementById('db-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('db-overlay')) hideOverlay();
  });
}

function showConfirmCard() {
  showOverlay(`
    <div class="db-card">
      <button class="db-card-close db-card-x" id="db-close-btn">✕</button>
      <p class="db-card-label">Type <strong>DELETEALL</strong> to confirm</p>
      <input type="text" id="db-confirm-input" class="db-confirm-input" autocomplete="off" />
      <button id="db-confirm-btn" class="db-card-delete btn">Submit</button>
    </div>
  `);
  document.getElementById('db-close-btn').addEventListener('click', hideOverlay);
  const input = document.getElementById('db-confirm-input');
  const btn = document.getElementById('db-confirm-btn');
  input.focus();
  btn.addEventListener('click', () => attemptDelete(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptDelete(input.value);
  });
  document.getElementById('db-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('db-overlay')) hideOverlay();
  });
}

async function attemptDelete(value) {
  if (value.trim() !== 'DELETEALL') return;
  const btn = document.getElementById('db-confirm-btn');
  btn.disabled = true;
  btn.textContent = 'Deleting…';
  try {
    await deleteAllServices();
    showDoneCard();
  } catch (err) {
    btn.textContent = 'Failed — Retry';
    btn.disabled = false;
    console.error(err);
  }
}

function showDoneCard() {
  showOverlay(`
    <div class="db-card">
      <p class="db-card-label">All services deleted.</p>
      <button id="db-done-btn" class="db-card-close">✕</button>
    </div>
  `);
  document.getElementById('db-done-btn').addEventListener('click', () => {
    hideOverlay();
    window.location.hash = '#home';
    route();
  });
}

document.getElementById('db-control-btn').addEventListener('click', showDeleteCard);
