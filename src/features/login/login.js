import { signIn } from '../../services/auth.js';

function render() {
  const section = document.createElement('section');
  section.className = 'login-section';
  section.innerHTML = `
    <div class="login-card">
      <h2>Sign In</h2>
      <form id="login-form" autocomplete="on">
        <label for="login-email">Email</label>
        <input type="email" id="login-email" name="email" required autocomplete="email" />

        <label for="login-password">Password</label>
        <input type="password" id="login-password" name="password" required autocomplete="current-password" />

        <p id="login-error" class="error-text" hidden></p>

        <button type="submit" id="login-btn" class="btn btn-primary login-submit">Sign In</button>
      </form>
    </div>
  `;
  return section;
}

function showError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.hidden = false;
}

function clearError() {
  document.getElementById('login-error').hidden = true;
}

export function initLogin(container, onSuccess) {
  container.innerHTML = '';
  container.appendChild(render());

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showError('Email and password are required');
      return;
    }

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.textContent = 'Signing in…';

    const { error } = await signIn(email, password);

    if (error) {
      showError(error.message || 'Sign in failed');
      btn.disabled = false;
      btn.textContent = 'Sign In';
      return;
    }

    if (onSuccess) onSuccess();
  });

  document.getElementById('login-email').focus();
}
