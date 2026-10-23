// ==========================================================================
// CampusCare — Profile page
// ==========================================================================
import api from '../api.js';
import { icon } from '../icons.js';
import { $, toast, toastSuccess, toastError, escapeHtml, avatar, withButtonLoading, roleLabel } from '../ui.js';
import { state, setUser } from '../store.js';

export async function renderProfile(root) {
  const u = state.user;
  const isMahasiswa = u.role === 'mahasiswa';

  // stats
  let stats = {};
  if (isMahasiswa) {
    try { stats = (await api.getPengaduanStats()).data || {}; } catch {}
  }

  root.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Profil Saya</h1>
        <p class="page-header__subtitle">Kelola informasi akun dan keamanan Anda.</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:320px 1fr;gap:var(--space-6);align-items:start" class="profile-grid">
      <div>
        <div class="card" style="margin-bottom:var(--space-5)">
          <div class="card__body" style="text-align:center">
            ${avatar(u.nama, { size: 'lg', seed: u.nama })}
            <div style="font-size:var(--text-lg);font-weight:700;margin-top:var(--space-3)">${escapeHtml(u.nama)}</div>
            <div class="badge badge--brand" style="margin-top:var(--space-2)">${icon('shield', { size: 13 })} ${roleLabel(u.role)}</div>
            <div class="text-sm text-muted mt-2">${escapeHtml(u.email || '')}</div>
          </div>
        </div>

        ${isMahasiswa && stats.total !== undefined ? `<div class="card">
          <div class="card__header"><div class="card__title">${icon('barChart')} Aktivitas</div></div>
          <div class="card__body">
            <div class="info-list">
              <div class="info-list__item"><span class="info-list__label">Total Pengaduan</span><span class="info-list__value">${stats.total ?? 0}</span></div>
              <div class="info-list__item"><span class="info-list__label">Menunggu</span><span class="info-list__value text-info">${stats.menunggu ?? 0}</span></div>
              <div class="info-list__item"><span class="info-list__label">Diproses</span><span class="info-list__value text-warning">${stats.diproses ?? 0}</span></div>
              <div class="info-list__item"><span class="info-list__label">Selesai</span><span class="info-list__value text-success">${stats.selesai ?? 0}</span></div>
            </div>
          </div>
        </div>` : ''}
      </div>

      <div>
        <div class="card" style="margin-bottom:var(--space-6)">
          <div class="card__header"><div class="card__title">${icon('user')} Informasi Akun</div></div>
          <div class="card__body">
            <form id="profile-form">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
                <div class="form-group">
                  <label class="form-label" for="p-nama">Nama Lengkap</label>
                  <input class="form-input" id="p-nama" value="${escapeHtml(u.nama || '')}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="p-nim">NIM</label>
                  <input class="form-input" id="p-nim" value="${escapeHtml(u.nim || '')}" disabled>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="p-email">Email</label>
                <input class="form-input" id="p-email" type="email" value="${escapeHtml(u.email || '')}">
              </div>
              <div class="form-group">
                <label class="form-label" for="p-phone">No. Telepon</label>
                <input class="form-input" id="p-phone" value="${escapeHtml(u.phone || '')}" placeholder="Opsional">
              </div>
              <button type="submit" class="btn btn--primary" id="save-profile">${icon('save', { size: 17 })} Simpan Perubahan</button>
            </form>
          </div>
        </div>

        <div class="card">
          <div class="card__header"><div class="card__title">${icon('lock')} Ubah Kata Sandi</div></div>
          <div class="card__body">
            <form id="password-form">
              <div class="form-group">
                <label class="form-label" for="pw-old">Kata Sandi Lama <span class="required">*</span></label>
                <input class="form-input" id="pw-old" type="password" autocomplete="current-password">
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
                <div class="form-group">
                  <label class="form-label" for="pw-new">Kata Sandi Baru <span class="required">*</span></label>
                  <input class="form-input" id="pw-new" type="password" autocomplete="new-password">
                </div>
                <div class="form-group">
                  <label class="form-label" for="pw-confirm">Konfirmasi <span class="required">*</span></label>
                  <input class="form-input" id="pw-confirm" type="password" autocomplete="new-password">
                </div>
              </div>
              <button type="submit" class="btn btn--secondary" id="save-pw">${icon('shieldCheck', { size: 17 })} Perbarui Kata Sandi</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  $('#profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#save-profile');
    try {
      await withButtonLoading(btn, async () => {
        const res = await api.updateProfile({
          nama: $('#p-nama').value.trim(),
          email: $('#p-email').value.trim(),
          phone: $('#p-phone').value.trim() || undefined,
        });
        setUser({ ...state.user, ...(res.data || {}) });
        toastSuccess('Profil berhasil diperbarui.');
      });
    } catch (err) { toastError(err.message); }
  });

  $('#password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPw = $('#pw-old').value;
    const newPw = $('#pw-new').value;
    const confirm = $('#pw-confirm').value;
    if (!oldPw || !newPw) return toastError('Semua kolom kata sandi wajib diisi.');
    if (newPw.length < 6) return toastError('Kata sandi baru minimal 6 karakter.');
    if (newPw !== confirm) return toastError('Konfirmasi kata sandi tidak cocok.');
    const btn = $('#save-pw');
    try {
      await withButtonLoading(btn, async () => {
        await api.changePassword({ old_password: oldPw, new_password: newPw });
        toastSuccess('Kata sandi berhasil diperbarui.');
      });
      $('#password-form').reset();
    } catch (err) { toastError(err.message); }
  });
}
