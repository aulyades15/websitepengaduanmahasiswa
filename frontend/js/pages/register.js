// ==========================================================================
// CampusCare — Register page (Mahasiswa only)
// ==========================================================================
import api from '../api.js';
import { icon } from '../icons.js';
import { $, $$, toast, toastError, toastSuccess, withButtonLoading } from '../ui.js';
import { navigate } from '../router.js';

const PRODI_OPTIONS = [
  { value: 1, label: 'Teknik Informatika' },
  { value: 2, label: 'Sistem Informasi' },
  { value: 3, label: 'Teknik Elektro' },
  { value: 4, label: 'Manajemen' },
  { value: 5, label: 'Akuntansi' },
];

export function renderRegister() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth">
      <div class="auth__panel">
        <a href="#/login" class="auth__back">${icon('chevronLeft', { size: 16 })} Kembali ke Login</a>
        <div class="auth__box animate-slide">
          <div class="auth__box-head">
            <h2 class="auth__box-title">Daftar Akun Mahasiswa</h2>
            <p class="auth__box-sub">Isi data diri untuk mendaftar ke CampusCare.</p>
          </div>

          <div id="auth-alert"></div>

          <form id="register-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="nim">NIM <span class="required">*</span></label>
              <input class="form-input" id="nim" name="nim" type="text" inputmode="numeric" placeholder="Contoh: 230101001" autocomplete="username" required minlength="8" maxlength="12" pattern="\d{8,12}">
              <div class="form-hint">8–12 digit angka (sesuai kartu mahasiswa).</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="nama">Nama Lengkap <span class="required">*</span></label>
              <input class="form-input" id="nama" name="nama" type="text" placeholder="Contoh: Budi Santoso" autocomplete="name" required minlength="2" maxlength="100">
            </div>

            <div class="form-group">
              <label class="form-label" for="email">Email Kampus <span class="required">*</span></label>
              <input class="form-input" id="email" name="email" type="email" placeholder="Contoh: budi@student.uin.ac.id" autocomplete="email" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="phone">Nomor HP <span class="required">*</span></label>
              <input class="form-input" id="phone" name="phone" type="tel" placeholder="Contoh: 081234567890" autocomplete="tel" required pattern="08\d{8,11}">
              <div class="form-hint">Diawali 08, 10–13 digit.</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="prodi_id">Program Studi <span class="required">*</span></label>
              <select class="form-select" id="prodi_id" name="prodi_id" required>
                <option value="">Pilih program studi...</option>
                ${PRODI_OPTIONS.map((p) => `<option value="${p.value}">${p.label}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Kata Sandi <span class="required">*</span></label>
              <div style="position:relative">
                <input class="form-input" id="password" name="password" type="password" placeholder="Min. 8 karakter, huruf besar, kecil, angka" autocomplete="new-password" required style="padding-right:3rem">
                <button type="button" class="icon-btn" id="toggle-pass" aria-label="Tampilkan kata sandi" style="position:absolute;right:4px;top:50%;transform:translateY(-50%)">${icon('eye', { size: 19 })}</button>
              </div>
              <div class="form-hint">Kombinasi huruf besar, kecil, dan angka.</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="password_confirmation">Konfirmasi Kata Sandi <span class="required">*</span></label>
              <input class="form-input" id="password_confirmation" name="password_confirmation" type="password" placeholder="Ulangi kata sandi" autocomplete="new-password" required>
            </div>

            <button type="submit" class="btn btn--primary btn--lg btn--block" id="register-btn">
              ${icon('userPlus', { size: 18 })} Daftar
            </button>
          </form>

          <div class="auth__foot" style="margin-top:var(--space-5);text-align:center">
            Sudah punya akun? <a href="#/login" class="text-link">Masuk di sini</a>
          </div>
        </div>
      </div>
    </div>
  `;

  bindRegisterEvents();
}

function bindRegisterEvents() {
  const form = $('#register-form');
  const passInput = $('#password');
  const toggleBtn = $('#toggle-pass');

  toggleBtn?.addEventListener('click', (e) => {
    const isPassword = passInput.type === 'password';
    passInput.type = isPassword ? 'text' : 'password';
    e.currentTarget.innerHTML = icon(isPassword ? 'eyeOff' : 'eye', { size: 19 });
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const data = {
      nim: $('#nim').value.trim(),
      nama: $('#nama').value.trim(),
      email: $('#email').value.trim().toLowerCase(),
      phone: $('#phone').value.trim(),
      prodi_id: parseInt($('#prodi_id').value),
      password: $('#password').value,
      password_confirmation: $('#password_confirmation').value,
    };

    if (!data.nim) return showError('nim', 'NIM wajib diisi.');
    if (!/^\d{8,12}$/.test(data.nim)) return showError('nim', 'NIM harus 8–12 digit angka.');
    if (!data.nama) return showError('nama', 'Nama wajib diisi.');
    if (!data.email) return showError('email', 'Email wajib diisi.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return showError('email', 'Format email tidak valid.');
    if (!data.phone) return showError('phone', 'Nomor HP wajib diisi.');
    if (!/^08\d{8,11}$/.test(data.phone)) return showError('phone', 'Nomor HP harus diawali 08 dan 10–13 digit.');
    if (!data.prodi_id) return showError('prodi_id', 'Pilih program studi.');
    if (!data.password) return showError('password', 'Kata sandi wajib diisi.');
    if (data.password.length < 8) return showError('password', 'Kata sandi minimal 8 karakter.');
    if (!/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/\d/.test(data.password)) {
      return showError('password', 'Kata sandi harus mengandung huruf besar, kecil, dan angka.');
    }
    if (data.password !== data.password_confirmation) return showError('password_confirmation', 'Konfirmasi kata sandi tidak cocok.');

    const btn = $('#register-btn');
    try {
      await withButtonLoading(btn, async () => {
        const res = await api.register(data);
        toastSuccess('Pendaftaran berhasil! Silakan masuk.');
      });
      navigate('#/login');
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
  $$('.form-input.is-error, .form-select.is-error').forEach((i) => i.classList.remove('is-error'));
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