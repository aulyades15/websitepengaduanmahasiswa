// ==========================================================================
// CampusCare — Login / Register page
// ==========================================================================
import api from '../api.js';
import { icon } from '../icons.js';
import { $, $$, toast, toastError, withButtonLoading } from '../ui.js';
import { setUser, state } from '../store.js';
import { navigate } from '../router.js';

const DEMO_ACCOUNTS = [
  { role: 'Mahasiswa', nim: '2210511042', pass: 'mahasiswa123' },
  { role: 'Admin', nim: '9999999999', pass: 'admin123' },
];

function asideHtml() {
  return `
    <aside class="auth__aside">
      <div class="auth__brand">
        <span class="auth__brand-logo">${icon('shieldCheck', { size: 26 })}</span>
        <span class="auth__brand-name">CampusCare</span>
      </div>
      <div class="auth__hero">
        <h1 class="auth__hero-title">Suara Mahasiswa, Langsung Ditindaklanjuti.</h1>
        <p class="auth__hero-text">Sistem pengaduan digital UIN Gus Dur yang transparan. Laporkan masalah kampus, pantau prosesnya secara real-time, dan pantau penyelesaiannya.</p>
        <div class="auth__features">
          <div class="auth__feature"><span class="auth__feature-icon">${icon('zap', { size: 20 })}</span> Proses cepat & terlacak</div>
          <div class="auth__feature"><span class="auth__feature-icon">${icon('bell', { size: 20 })}</span> Notifikasi real-time</div>
          <div class="auth__feature"><span class="auth__feature-icon">${icon('lock', { size: 20 })}</span> Aman & bisa anonim</div>
        </div>
      </div>
      <div class="auth__aside-foot">© ${new Date().getFullYear()} UIN Gus Dur · Sistem Informasi Pengaduan Mahasiswa</div>
    </aside>
  `;
}

function demoHtml() {
  return `
    <div class="auth__demo">
      <div class="auth__demo-title">${icon('lightbulb', { size: 16 })} Akun Demo (klik untuk isi otomatis)</div>
      ${DEMO_ACCOUNTS.map((a) => `
        <div class="auth__demo-row" data-nim="${a.nim}" data-pass="${a.pass}">
          <span>${a.role}</span>
          <code>${a.nim} / ${a.pass}</code>
        </div>
      `).join('')}
    </div>
  `;
}

export function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth">
      ${asideHtml()}
      <div class="auth__panel">
        <a href="#/" class="auth__back">${icon('chevronLeft', { size: 16 })} Kembali ke beranda</a>
        <div class="auth__box animate-slide">
          <div class="auth__box-head">
            <h2 class="auth__box-title">Selamat Datang 👋</h2>
            <p class="auth__box-sub">Masuk menggunakan NIM dan kata sandi Anda.</p>
          </div>

          <div id="auth-alert"></div>

          <form id="login-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="nim">NIM <span class="required">*</span></label>
              <input class="form-input" id="nim" name="nim" type="text" inputmode="numeric" placeholder="Contoh: 2210511042" autocomplete="username" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="password">Kata Sandi <span class="required">*</span></label>
              <div style="position:relative">
                <input class="form-input" id="password" name="password" type="password" placeholder="Masukkan kata sandi" autocomplete="current-password" required style="padding-right:3rem">
                <button type="button" class="icon-btn" id="toggle-pass" aria-label="Tampilkan kata sandi" style="position:absolute;right:4px;top:50%;transform:translateY(-50%)">${icon('eye', { size: 19 })}</button>
              </div>
            </div>
            <button type="submit" class="btn btn--primary btn--lg btn--block" id="login-btn">
              ${icon('logOut', { size: 18 })} Masuk
            </button>
          </form>

          ${demoHtml()}

          <div class="auth__foot">
            Belum punya akun? <a href="#/register" class="text-link">Daftar di sini</a>
            <br><small style="color:var(--text-muted);display:block;margin-top:4px">Atau hubungi admin fakultas untuk data akademik.</small>
          </div>
        </div>
      </div>
    </div>
  `;

  bindLoginEvents();
}

function bindLoginEvents() {
  const form = $('#login-form');
  const passInput = $('#password');

  $('#toggle-pass')?.addEventListener('click', (e) => {
    const isPassword = passInput.type === 'password';
    passInput.type = isPassword ? 'text' : 'password';
    e.currentTarget.innerHTML = icon(isPassword ? 'eyeOff' : 'eye', { size: 19 });
  });

  // demo fill
  $$('.auth__demo-row').forEach((row) => {
    row.addEventListener('click', () => {
      $('#nim').value = row.dataset.nim;
      passInput.value = row.dataset.pass;
      toast('Akun demo diisi otomatis. Klik Masuk.', 'info');
    });
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const nim = $('#nim').value.trim();
    const password = passInput.value;

    if (!nim) return showError('nim', 'NIM wajib diisi.');
    if (!password) return showError('password', 'Kata sandi wajib diisi.');

    const btn = $('#login-btn');
    try {
      await withButtonLoading(btn, async () => {
        const res = await api.login(nim, password);
        api.setTokens(res.data.accessToken, res.data.refreshToken);
        setUser(res.data.user || res.data);
        toast(`Selamat datang, ${res.data.user?.nama || res.data.nama || 'pengguna'}!`, 'success');
      });
      // reload to boot the app
      location.hash = '#/dashboard';
      window.location.reload();
    } catch (err) {
      showAuthAlert(err.message);
      toastError(err.message);
    }
  });
}

function showAuthAlert(message) {
  const box = $('#auth-alert');
  if (box) box.innerHTML = `<div class="auth__alert animate-scale">${icon('alertCircle', { size: 18 })}<span>${message}</span></div>`;
}

function clearErrors() {
  const box = $('#auth-alert');
  if (box) box.innerHTML = '';
  $$('.form-input.is-error').forEach((i) => i.classList.remove('is-error'));
  $$('.form-error').forEach((e) => e.remove());
}

function showError(field, message) {
  const input = $(`#${field}`);
  if (!input) return;
  input.classList.add('is-error');
  const err = document.createElement('div');
  err.className = 'form-error';
  err.innerHTML = `${icon('alertCircle', { size: 14 })}<span>${message}</span>`;
  input.parentElement.after(err);
  input.focus();
}
