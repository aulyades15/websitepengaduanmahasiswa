// ==========================================================================
// CampusCare — Pengaduan pages: List / New / Detail
// ==========================================================================
import api from '../api.js';
import { icon } from '../icons.js';
import {
  $, $$, toast, toastError, toastSuccess, escapeHtml, statusBadge, slaBadge,
  formatDate, timeAgo, emptyState, skeletonRows, debounce, paginate, openModal,
  closeModal, withButtonLoading, avatar, statusLabel, roleLabel,
} from '../ui.js';
import { state, loadKategori, loadUnit } from '../store.js';
import { navigate } from '../router.js';

/* ==========================================================================
   LIST
   ========================================================================== */
export async function renderPengaduanList(root) {
  // support ?search= from global search
  const hashQuery = location.hash.split('?')[1];
  const initialSearch = hashQuery ? new URLSearchParams(hashQuery).get('search') || '' : '';
  const role = state.user.role;
  const isAdminLike = ['admin', 'pimpinan', 'unit'].includes(role);

  const [kategori, unit] = await Promise.all([loadKategori(), loadUnit()]);

  root.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">${isAdminLike ? 'Semua Pengaduan' : 'Pengaduan Saya'}</h1>
        <p class="page-header__subtitle">${isAdminLike ? 'Kelola dan tindak lanjuti seluruh pengaduan masuk.' : 'Lacak semua pengaduan yang pernah Anda buat.'}</p>
      </div>
      <div class="page-header__actions">
        ${role === 'mahasiswa' ? `<a href="#/pengaduan/baru" class="btn btn--primary">${icon('plus', { size: 18 })} Buat Pengaduan</a>` : ''}
      </div>
    </div>

    <div class="toolbar">
      <div class="search-input">
        ${icon('search', { size: 17 })}
        <input class="form-input" id="f-search" placeholder="Cari judul / kode pengaduan..." value="${escapeHtml(initialSearch)}">
      </div>
      <div class="toolbar__filters">
        <select class="form-select" id="f-status" aria-label="Filter status">
          <option value="">Semua Status</option>
          <option value="menunggu">Menunggu</option>
          <option value="diproses">Diproses</option>
          <option value="selesai">Selesai</option>
          <option value="ditolak">Ditolak</option>
          <option value="tertunda">Tertunda</option>
        </select>
        <select class="form-select" id="f-kategori" aria-label="Filter kategori">
          <option value="">Semua Kategori</option>
          ${kategori.map((k) => `<option value="${k.id}">${escapeHtml(k.nama)}</option>`).join('')}
        </select>
        ${isAdminLike ? `<select class="form-select" id="f-unit" aria-label="Filter unit">
          <option value="">Semua Unit</option>
          ${unit.map((u) => `<option value="${u.id}">${escapeHtml(u.nama)}</option>`).join('')}
        </select>` : ''}
        <button class="btn btn--ghost" id="f-urgent" aria-pressed="false">${icon('zap', { size: 17 })} Urgent</button>
        <button class="btn btn--ghost" id="f-overdue" aria-pressed="false">${icon('alert', { size: 17 })} Terlambat</button>
      </div>
    </div>

    <div id="bulk-bar"></div>
    <div class="card">
      <div class="card__body card__body--flush" id="list-container">
        ${skeletonRows(6, '72px')}
      </div>
      <div id="pagination"></div>
    </div>
  `;

  const filterState = {
    page: 1,
    per_page: 10,
    search: initialSearch,
    status: '',
    kategori_id: '',
    unit_id: '',
    is_urgent: '',
    is_overdue: '',
    selected: new Set(),
  };

  const load = () => loadList(filterState, isAdminLike);
  const debouncedSearch = debounce(() => { filterState.search = $('#f-search').value.trim(); filterState.page = 1; load(); }, 400);

  $('#f-search').addEventListener('input', debouncedSearch);
  $('#f-status').addEventListener('change', (e) => { filterState.status = e.target.value; filterState.page = 1; load(); });
  $('#f-kategori').addEventListener('change', (e) => { filterState.kategori_id = e.target.value; filterState.page = 1; load(); });
  $('#f-unit')?.addEventListener('change', (e) => { filterState.unit_id = e.target.value; filterState.page = 1; load(); });

  $('#f-urgent').addEventListener('click', (e) => {
    const active = e.currentTarget.getAttribute('aria-pressed') === 'true';
    e.currentTarget.setAttribute('aria-pressed', String(!active));
    e.currentTarget.classList.toggle('btn--soft-brand', !active);
    filterState.is_urgent = !active ? 'true' : '';
    filterState.page = 1; load();
  });
  $('#f-overdue').addEventListener('click', (e) => {
    const active = e.currentTarget.getAttribute('aria-pressed') === 'true';
    e.currentTarget.setAttribute('aria-pressed', String(!active));
    e.currentTarget.classList.toggle('btn--soft-danger', !active);
    filterState.is_overdue = !active ? 'true' : '';
    filterState.page = 1; load();
  });

  load();
}

async function loadList(f, isAdminLike) {
  const container = $('#list-container');
  container.innerHTML = skeletonRows(5, '72px');
  try {
    const params = {
      page: f.page,
      limit: f.per_page,
      search: f.search,
      status: f.status,
      kategori_id: f.kategori_id,
      unit_id: f.unit_id,
      is_urgent: f.is_urgent,
      is_overdue: f.is_overdue,
    };
    const res = await api.getPengaduanList(params);
    const { items, pagination } = res.data;

    if (!items.length) {
      container.innerHTML = emptyState({
        title: 'Tidak ada pengaduan',
        text: f.search || f.status || f.kategori_id ? 'Tidak ada hasil yang cocok dengan filter Anda.' : 'Belum ada pengaduan tercatat.',
        iconName: 'search',
      });
      $('#pagination').innerHTML = '';
      renderBulkBar(f, isAdminLike);
      return;
    }

    container.innerHTML = `<div class="pengaduan-list stagger" style="padding:var(--space-5)">
      ${items.map((p) => pengaduanCard(p, f, isAdminLike)).join('')}
    </div>`;

    // card click
    $$('.pengaduan-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('input,button,a')) return;
        navigate(`#/pengaduan/${card.dataset.id}`);
      });
    });

    // checkbox select
    $$('.pengaduan-card__check input').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) { f.selected.add(id); e.target.closest('.pengaduan-card').classList.add('is-selected'); }
        else { f.selected.delete(id); e.target.closest('.pengaduan-card').classList.remove('is-selected'); }
        renderBulkBar(f, isAdminLike);
      });
    });

    renderPagination(pagination, f, isAdminLike);
    renderBulkBar(f, isAdminLike);
  } catch (err) {
    container.innerHTML = emptyState({ title: 'Gagal memuat', text: err.message, iconName: 'alertCircle' });
  }
}

function pengaduanCard(p, f, isAdminLike) {
  const isUrgent = p.is_urgent || p.urgency_level === 'tinggi' || p.urgency_level === 'kritis';
  const overdue = p.is_overdue_calc || (p.sla_deadline && new Date(p.sla_deadline) < Date.now() && !['selesai', 'ditolak'].includes(p.status));
  const selected = f.selected.has(String(p.id));
  return `<div class="pengaduan-card ${isUrgent ? 'pengaduan-card--urgent' : ''} ${overdue ? 'pengaduan-card--overdue' : ''} ${selected ? 'is-selected' : ''}" data-id="${p.id}">
    ${isAdminLike ? `<div class="pengaduan-card__check"><input type="checkbox" data-id="${p.id}" ${selected ? 'checked' : ''} aria-label="Pilih ${escapeHtml(p.kode_pengaduan || p.id)}"></div>` : '<div></div>'}
    <div class="pengaduan-card__main">
      <div class="pengaduan-card__head">
        <span class="pengaduan-card__code">${escapeHtml(p.kode_pengaduan || '#' + p.id)}</span>
        ${statusBadge(p.status)}
        ${isUrgent ? `<span class="badge badge--urgent">${icon('zap', { size: 12 })} Urgent</span>` : ''}
        ${overdue ? `<span class="badge badge--overdue">${icon('alert', { size: 12 })} Terlambat</span>` : ''}
      </div>
      <div class="pengaduan-card__title">${escapeHtml(p.judul)}</div>
      <div class="pengaduan-card__excerpt line-clamp-2">${escapeHtml(p.deskripsi || '')}</div>
      <div class="pengaduan-card__meta">
        <span class="pengaduan-card__meta-item">${icon('tag', { size: 14 })} ${escapeHtml(p.kategori_nama || '-')}</span>
        ${p.lokasi ? `<span class="pengaduan-card__meta-item">${icon('mapPin', { size: 14 })} ${escapeHtml(p.lokasi)}</span>` : ''}
        ${p.unit_nama ? `<span class="pengaduan-card__meta-item">${icon('building', { size: 14 })} ${escapeHtml(p.unit_nama)}</span>` : ''}
        ${isAdminLike && p.pelapor_nama ? `<span class="pengaduan-card__meta-item">${icon('user', { size: 14 })} ${escapeHtml(p.pelapor_nama)}</span>` : ''}
        <span class="pengaduan-card__meta-item">${icon('clock', { size: 14 })} ${timeAgo(p.created_at)}</span>
      </div>
    </div>
    <div class="pengaduan-card__side">
      ${slaBadge(p.sla_deadline, p.status)}
      <button class="btn btn--ghost btn--sm" aria-label="Buka detail">${icon('chevronRight', { size: 17 })}</button>
    </div>
  </div>`;
}

function renderBulkBar(f, isAdminLike) {
  const bar = $('#bulk-bar');
  if (!bar) return;
  if (!isAdminLike || f.selected.size === 0) { bar.innerHTML = ''; return; }
  bar.innerHTML = `<div class="bulk-bar animate-scale">
    <span class="bulk-bar__count">${f.selected.size} pengaduan dipilih</span>
    <button class="btn btn--success btn--sm" id="bulk-verify">${icon('shieldCheck', { size: 15 })} Verifikasi Massal</button>
    <button class="btn btn--ghost btn--sm" id="bulk-clear">Batalkan Pilihan</button>
  </div>`;
  $('#bulk-clear').addEventListener('click', () => {
    f.selected.clear();
    $$('.pengaduan-card').forEach((c) => c.classList.remove('is-selected'));
    $$('.pengaduan-card__check input').forEach((c) => (c.checked = false));
    renderBulkBar(f, isAdminLike);
  });
  $('#bulk-verify').addEventListener('click', () => openBulkVerifyModal(f));
}

async function openBulkVerifyModal(f) {
  const unit = await loadUnit();
  openModal(`
    <div class="modal__header">
      <div class="modal__title">${icon('shieldCheck', { size: 20 })} Verifikasi Massal</div>
      <button class="modal__close" data-close-modal aria-label="Tutup">${icon('x', { size: 20 })}</button>
    </div>
    <div class="modal__body">
      <p class="text-secondary mb-4">Anda akan memverifikasi <strong>${f.selected.size}</strong> pengaduan sekaligus.</p>
      <div class="form-group">
        <label class="form-label" for="bulk-unit">Tujuan Unit <span class="required">*</span></label>
        <select class="form-select" id="bulk-unit">
          <option value="">Pilih unit penanganan...</option>
          ${unit.map((u) => `<option value="${u.id}">${escapeHtml(u.nama)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="bulk-notes">Catatan</label>
        <textarea class="form-textarea" id="bulk-notes" rows="3" placeholder="Catatan untuk tim unit (opsional)"></textarea>
      </div>
    </div>
    <div class="modal__footer">
      <button class="btn btn--secondary" data-close-modal>Batal</button>
      <button class="btn btn--success" id="bulk-submit">${icon('check', { size: 18 })} Verifikasi ${f.selected.size} Pengaduan</button>
    </div>
  `, {
    onMount(modal) {
      modal.querySelector('#bulk-submit').addEventListener('click', (e) => {
        const unitId = modal.querySelector('#bulk-unit').value;
        const notes = modal.querySelector('#bulk-notes').value;
        if (!unitId) { toastError('Pilih unit tujuan terlebih dahulu.'); return; }
        withButtonLoading(e.currentTarget, async () => {
          await api.bulkVerify([...f.selected], unitId, notes || undefined);
          toastSuccess(`${f.selected.size} pengaduan berhasil diverifikasi.`);
          f.selected.clear();
          closeModal();
          loadList(f, true);
        });
      });
    },
  });
}

function renderPagination(pagination, f, isAdminLike) {
  const el = $('#pagination');
  if (!pagination || pagination.total_pages <= 1) { el.innerHTML = ''; return; }
  const pages = paginate(pagination.current_page, pagination.total_pages);
  const from = (pagination.current_page - 1) * pagination.per_page + 1;
  const to = Math.min(pagination.current_page * pagination.per_page, pagination.total);
  el.innerHTML = `<div class="pagination">
    <div class="pagination__info">Menampilkan <strong>${from}-${to}</strong> dari <strong>${pagination.total}</strong> pengaduan</div>
    <div class="pagination__pages">
      <button class="pagination__btn" data-p="${pagination.current_page - 1}" ${!pagination.has_prev ? 'disabled' : ''}>${icon('chevronLeft', { size: 16 })}</button>
      ${pages.map((p) => `<button class="pagination__btn ${p === pagination.current_page ? 'is-active' : ''}" data-p="${p}">${p}</button>`).join('')}
      <button class="pagination__btn" data-p="${pagination.current_page + 1}" ${!pagination.has_next ? 'disabled' : ''}>${icon('chevronRight', { size: 16 })}</button>
    </div>
  </div>`;
  $$('#pagination .pagination__btn[data-p]').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.disabled) return;
      f.page = parseInt(b.dataset.p);
      loadList(f, isAdminLike);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* ==========================================================================
   NEW (create form)
   ========================================================================== */
export async function renderPengaduanNew(root) {
  const kategori = await loadKategori();

  root.innerHTML = `
    <a href="#/pengaduan" class="back-link">${icon('chevronLeft', { size: 17 })} Kembali ke daftar pengaduan</a>
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Buat Pengaduan Baru</h1>
        <p class="page-header__subtitle">Sampaikan masalah atau keluhan Anda secara jelas dan bertanggung jawab.</p>
      </div>
    </div>

    <div style="max-width:760px">
      <div class="card">
        <div class="card__body">
          <form id="pengaduan-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="judul">Judul Pengaduan <span class="required">*</span></label>
              <input class="form-input" id="judul" placeholder="Contoh: WiFi laboratorium lambat sejak 3 hari" maxlength="200" required>
              <div class="form-hint">Ringkas dan spesifik (maks. 200 karakter).</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="kategori">Kategori <span class="required">*</span></label>
              <select class="form-select" id="kategori" required>
                <option value="">Pilih kategori...</option>
                ${kategori.map((k) => `<option value="${k.id}">${k.icon || ''} ${escapeHtml(k.nama)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="deskripsi">Uraian Masalah <span class="required">*</span></label>
              <textarea class="form-textarea" id="deskripsi" rows="6" placeholder="Jelaskan kronologi, lokasi, dampak, dan apa yang Anda harapkan..." required></textarea>
              <div class="form-hint">Semakin detail, semakin cepat ditindaklanjuti.</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="lokasi">Lokasi Kejadian</label>
              <input class="form-input" id="lokasi" placeholder="Contoh: Lab Komputer Lt.2, Gedung B">
            </div>

            <div class="form-group">
              <label class="form-check">
                <input type="checkbox" id="anonim">
                <div>
                  <div class="form-check__label">Kirim sebagai anonim</div>
                  <div class="form-check__desc">Identitas Anda tidak ditampilkan publik, tetapi tetap tercatat untuk admin.</div>
                </div>
              </label>
            </div>

            <div class="form-group">
              <label class="form-label" for="lampiran">Lampiran Bukti <span class="form-hint" style="display:inline;font-weight:400">(opsional · maks. 5 file · 10 MB/file)</span></label>
              <input class="form-input form-input--file" type="file" id="lampiran" multiple
                accept="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
              <div class="form-hint">Format didukung: JPG, PNG, GIF, PDF, DOC, DOCX.</div>
              <div class="file-list" id="lampiran-preview"></div>
            </div>

            <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;padding-top:var(--space-2)">
              <button type="submit" class="btn btn--primary btn--lg" id="submit-btn">${icon('send', { size: 18 })} Kirim Pengaduan</button>
              <a href="#/pengaduan" class="btn btn--ghost btn--lg">Batal</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  $('#pengaduan-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors();

    const judul = $('#judul').value.trim();
    const kategoriId = $('#kategori').value;
    const deskripsi = $('#deskripsi').value.trim();
    const lokasi = $('#lokasi').value.trim();
    const is_anonim = $('#anonim').checked;

    let ok = true;
    if (!judul) { setFieldError('judul', 'Judul wajib diisi.'); ok = false; }
    if (!kategoriId) { setFieldError('kategori', 'Pilih kategori pengaduan.'); ok = false; }
    if (!deskripsi || deskripsi.length < 20) { setFieldError('deskripsi', 'Uraian minimal 20 karakter.'); ok = false; }
    if (!ok) return;

    const btn = $('#submit-btn');
    const files = Array.from($('#lampiran')?.files || []);
    const MAX_FILES = 5;
    const MAX_SIZE = 10 * 1024 * 1024;

    if (files.length > MAX_FILES) {
      toastError(`Maksimal ${MAX_FILES} lampiran.`);
      return;
    }
    const tooBig = files.find((f) => f.size > MAX_SIZE);
    if (tooBig) {
      toastError(`File "${tooBig.name}" melebihi batas 10 MB.`);
      return;
    }

    let createdId = null;
    let uploadError = '';
    try {
      await withButtonLoading(btn, async () => {
        const res = await api.createPengaduan({
          judul,
          deskripsi,
          kategori_id: parseInt(kategoriId),
          lokasi: lokasi || undefined,
          is_anonim,
        });
        createdId = res.data.id;

        // Upload lampiran setelah pengaduan berhasil dibuat (best effort).
        if (files.length && createdId) {
          try {
            await api.uploadPengaduanFiles(createdId, files);
          } catch (uerr) {
            uploadError = uerr.message;
          }
        }

        toastSuccess(`Pengaduan ${res.data.kode_pengaduan || ''} berhasil dikirim!`);
      });
      if (uploadError) {
        toastError(`Pengaduan terkirim, tetapi lampiran gagal diunggah: ${uploadError}`);
      }
      navigate(createdId ? `#/pengaduan/${createdId}` : '#/pengaduan');
    } catch (err) {
      toastError(err.message);
    }
  });

  // Preview file yang dipilih + tombol hapus per file.
  const fileInput = $('#lampiran');
  const preview = $('#lampiran-preview');
  fileInput?.addEventListener('change', () => renderFilePreview(fileInput, preview));
}

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function renderFilePreview(input, preview) {
  if (!preview) return;
  const files = Array.from(input.files || []);
  if (!files.length) {
    preview.innerHTML = '';
    return;
  }
  preview.innerHTML = files.map((f, i) => `
    <div class="file-item">
      <span class="file-item__icon">${icon('fileText', { size: 16 })}</span>
      <span class="file-item__name">${escapeHtml(f.name)}</span>
      <span class="file-item__size">${formatBytes(f.size)}</span>
      <button type="button" class="file-item__remove" data-idx="${i}" aria-label="Hapus ${escapeHtml(f.name)}">${icon('x', { size: 14 })}</button>
    </div>
  `).join('');

  preview.querySelectorAll('.file-item__remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const removeIdx = Number(btn.dataset.idx);
      const dt = new DataTransfer();
      Array.from(input.files).forEach((f, idx) => {
        if (idx !== removeIdx) dt.items.add(f);
      });
      input.files = dt.files;
      renderFilePreview(input, preview);
    });
  });
}

function clearFormErrors() {
  $$('.form-input.is-error, .form-select.is-error, .form-textarea.is-error').forEach((i) => i.classList.remove('is-error'));
  $$('.form-error').forEach((e) => e.remove());
}

function setFieldError(id, message) {
  const input = $(`#${id}`);
  if (!input) return;
  input.classList.add('is-error');
  const err = document.createElement('div');
  err.className = 'form-error';
  err.innerHTML = `${icon('alertCircle', { size: 14 })}<span>${message}</span>`;
  input.insertAdjacentElement('afterend', err);
}

/* ==========================================================================
   DETAIL
   ========================================================================== */
export async function renderPengaduanDetail(root, id) {
  let p;
  try {
    const res = await api.getPengaduanById(id);
    p = res.data;
  } catch (err) {
    root.innerHTML = emptyState({ title: 'Gagal memuat pengaduan', text: err.message, iconName: 'alertCircle', action: `<a href="#/pengaduan" class="btn btn--primary">Kembali</a>` });
    return;
  }

  const role = state.user.role;
  const isAdminLike = ['admin', 'pimpinan', 'unit'].includes(role);
  const isOwner = String(p.user_id) === String(state.user.id);
  const canManage = isAdminLike;
  const overdue = p.is_overdue_calc || (p.sla_deadline && new Date(p.sla_deadline) < Date.now() && !['selesai', 'ditolak'].includes(p.status));

  root.innerHTML = `
    <a href="#/pengaduan" class="back-link">${icon('chevronLeft', { size: 17 })} Kembali ke daftar pengaduan</a>

    <div class="detail-hero animate-slide">
      <div class="detail-hero__badges">
        <span class="pengaduan-card__code">${escapeHtml(p.kode_pengaduan || '#' + p.id)}</span>
        ${statusBadge(p.status, { pulse: true })}
        ${(p.is_urgent) ? `<span class="badge badge--urgent">${icon('zap', { size: 12 })} Urgent</span>` : ''}
        ${overdue ? `<span class="badge badge--overdue">${icon('alert', { size: 12 })} Melewati SLA</span>` : ''}
        ${slaBadge(p.sla_deadline, p.status)}
      </div>
      <h1 class="detail-hero__title">${escapeHtml(p.judul)}</h1>
      <div class="detail-hero__meta">
        <span class="detail-hero__meta-item">${icon('tag')} ${escapeHtml(p.kategori_nama || '-')}</span>
        <span class="detail-hero__meta-item">${icon('calendar')} ${formatDate(p.created_at)}</span>
        ${p.lokasi ? `<span class="detail-hero__meta-item">${icon('mapPin')} ${escapeHtml(p.lokasi)}</span>` : ''}
        ${p.unit_nama ? `<span class="detail-hero__meta-item">${icon('building')} ${escapeHtml(p.unit_nama)}</span>` : ''}
      </div>
    </div>

    <div class="detail-grid">
      <div>
        <div class="card" style="margin-bottom:var(--space-6)">
          <div class="card__header"><div class="card__title">${icon('fileText')} Uraian Masalah</div></div>
          <div class="card__body">
            <div class="detail-desc">${escapeHtml(p.deskripsi || '-')}</div>
          </div>
        </div>

        ${p.attachments && p.attachments.length ? `<div class="card" style="margin-bottom:var(--space-6)">
          <div class="card__header"><div class="card__title">${icon('paperclip')} Lampiran (${p.attachments.length})</div></div>
          <div class="card__body">
            <div class="flex flex-wrap gap-3">
              ${p.attachments.map((a) => {
                const url = a.file_url || a.url || `/uploads/${a.filename}`;
                const name = a.original_filename || a.file_name || a.filename || 'File';
                const size = a.file_size ? ` · ${formatBytes(a.file_size)}` : '';
                return `<a class="chip" href="${url}" target="_blank" rel="noopener">${icon('paperclip', { size: 15 })} ${escapeHtml(name)}${size}</a>`;
              }).join('')}
            </div>
          </div>
        </div>` : ''}

        <div class="card">
          <div class="card__header">
            <div class="card__title">${icon('message')} Diskusi & Tindak Lanjut</div>
            <div class="card__subtitle">Kolom komunikasi antara pelapor dan penanganan</div>
          </div>
          <div class="card__body" id="chat-container" data-pengaduan-id="${p.id}">
            <div class="empty-state"><div class="spinner spinner-lg"></div></div>
          </div>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom:var(--space-6)">
          <div class="card__header"><div class="card__title">${icon('info')} Informasi</div></div>
          <div class="card__body">
            <div class="info-list">
              <div class="info-list__item"><span class="info-list__label">Status</span><span class="info-list__value">${statusBadge(p.status)}</span></div>
              <div class="info-list__item"><span class="info-list__label">Dibuat</span><span class="info-list__value">${formatDate(p.created_at)}</span></div>
              <div class="info-list__item"><span class="info-list__label">SLA Target</span><span class="info-list__value">${p.sla_target_hours || '-'} jam</span></div>
              ${p.sla_deadline ? `<div class="info-list__item"><span class="info-list__label">Tenggat</span><span class="info-list__value">${formatDate(p.sla_deadline)}</span></div>` : ''}
              ${p.resolved_at ? `<div class="info-list__item"><span class="info-list__label">Selesai</span><span class="info-list__value">${formatDate(p.resolved_at)}</span></div>` : ''}
              ${p.rejection_reason ? `<div class="info-list__item"><span class="info-list__label">Alasan Tolak</span><span class="info-list__value text-danger">${escapeHtml(p.rejection_reason)}</span></div>` : ''}
              ${!p.is_anonim && p.pelapor_nama ? `<div class="info-list__item"><span class="info-list__label">Pelapor</span><span class="info-list__value">${escapeHtml(p.pelapor_nama)}</span></div>` : (p.is_anonim ? `<div class="info-list__item"><span class="info-list__label">Pelapor</span><span class="info-list__value">Anonim</span></div>` : '')}
            </div>
          </div>
        </div>

        ${canManage && p.status !== 'selesai' && p.status !== 'ditolak' ? adminActions(p) : ''}
        ${renderRatingCard(p, isOwner, canManage)}
      </div>
    </div>
  `;

  bindDetailEvents(p, canManage, isOwner);
  loadChatInto(p.id, canManage);
}

function adminActions(p) {
  return `<div class="card" style="margin-bottom:var(--space-6)">
    <div class="card__header"><div class="card__title">${icon('sliders')} Aksi Admin</div></div>
    <div class="card__body">
      <div class="flex flex-col gap-3">
        ${p.status === 'menunggu' ? `<button class="btn btn--success btn--block" id="act-verify">${icon('shieldCheck', { size: 18 })} Verifikasi & Teruskan</button>` : ''}
        ${p.status === 'diproses' || p.status === 'menunggu' ? `<button class="btn btn--primary btn--block" id="act-resolve">${icon('checkCircle', { size: 18 })} Tandai Selesai</button>` : ''}
        ${p.status !== 'ditolak' ? `<button class="btn btn--soft-danger btn--block" id="act-reject">${icon('x', { size: 18 })} Tolak Pengaduan</button>` : ''}
      </div>
    </div>
  </div>`;
}

function renderRatingCard(p, isOwner, canManage) {
  const canRate = isOwner && p.status === 'selesai' && !p.rating;
  const showRating = p.status === 'selesai' && (p.rating || canRate);
  if (!showRating) return '';
  if (canRate) {
    return `<div class="card">
      <div class="card__header"><div class="card__title">${icon('star')} Beri Penilaian</div></div>
      <div class="card__body">
        <p class="text-secondary mb-4 text-sm">Seberapa puas Anda terhadap penanganan pengaduan ini?</p>
        <div class="stars" id="rating-stars" role="radiogroup" aria-label="Rating">
          ${[1, 2, 3, 4, 5].map((i) => `<button class="stars__btn" data-v="${i}" role="radio" aria-checked="false" aria-label="${i} bintang">${icon('star', { size: 28 })}</button>`).join('')}
        </div>
        <div class="form-group mt-4">
          <textarea class="form-textarea" id="rating-feedback" rows="3" placeholder="Feedback tambahan (opsional)"></textarea>
        </div>
        <button class="btn btn--primary" id="rating-submit" disabled>${icon('send', { size: 17 })} Kirim Penilaian</button>
      </div>
    </div>`;
  }
  return `<div class="card">
    <div class="card__header"><div class="card__title">${icon('star')} Penilaian Pelapor</div></div>
    <div class="card__body">
      <div class="stars stars--display mb-2">${Array.from({ length: 5 }, (_, i) => `<span class="stars__btn ${i < p.rating ? 'is-active' : ''}">${icon('star', { size: 16, fill: i < p.rating })}</span>`).join('')}</div>
      ${p.feedback ? `<p class="text-secondary text-sm">"${escapeHtml(p.feedback)}"</p>` : ''}
    </div>
  </div>`;
}

function bindDetailEvents(p, canManage, isOwner) {
  $('#act-verify')?.addEventListener('click', () => openVerifyModal(p));
  $('#act-resolve')?.addEventListener('click', () => openResolveModal(p));
  $('#act-reject')?.addEventListener('click', () => openRejectModal(p));

  // rating
  const stars = $('#rating-stars');
  if (stars) {
    let selected = 0;
    const btns = $$('.stars__btn', stars);
    btns.forEach((b) => {
      b.addEventListener('click', () => {
        selected = parseInt(b.dataset.v);
        btns.forEach((x, i) => { x.classList.toggle('is-active', i < selected); x.setAttribute('aria-checked', String(i + 1 === selected)); });
        $('#rating-submit').disabled = false;
      });
    });
    $('#rating-submit').addEventListener('click', (e) => {
      if (!selected) return;
      withButtonLoading(e.currentTarget, async () => {
        await api.ratePengaduan(p.id, selected, $('#rating-feedback').value.trim() || undefined);
        toastSuccess('Terima kasih atas penilaian Anda!');
      }).then(() => renderPengaduanDetail(document.getElementById('main-content'), p.id));
    });
  }
}

/* ---------- Chat within detail ---------- */
async function loadChatInto(pengaduanId, canManage) {
  const container = $('#chat-container');
  try {
    const [msgs] = await Promise.all([
      api.getMessages(pengaduanId, 1, 100),
      canManage ? Promise.resolve() : api.markMessagesAsRead(pengaduanId).catch(() => {}),
    ]);
    const items = msgs.data?.items || [];
    container.innerHTML = `
      <div id="msg-list" style="display:flex;flex-direction:column;gap:var(--space-3);max-height:420px;overflow-y:auto;padding:var(--space-2);background:var(--bg-surface-2);border-radius:var(--radius-lg);margin-bottom:var(--space-4)">
        ${items.length ? items.map(renderMsg).join('') : `<div class="text-muted text-sm" style="text-align:center;padding:var(--space-6)">Belum ada diskusi. Mulai percakapan di bawah.</div>`}
      </div>
      <div style="display:flex;gap:var(--space-3);align-items:flex-end">
        <div style="flex:1">
          <textarea class="form-textarea" id="msg-input" rows="2" placeholder="Tulis pesan..."></textarea>
          ${canManage ? `<label class="form-check" style="min-height:auto;margin-top:4px"><input type="checkbox" id="msg-internal"><span class="form-check__desc">Tandai sebagai catatan internal (hanya terlihat admin)</span></label>` : ''}
        </div>
        <button class="btn btn--primary" id="msg-send">${icon('send', { size: 18 })}</button>
      </div>
    `;
    const list = $('#msg-list');
    list.scrollTop = list.scrollHeight;

    $('#msg-send').addEventListener('click', () => sendMsg(pengaduanId, canManage));
    $('#msg-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(pengaduanId, canManage); }
    });
  } catch (err) {
    container.innerHTML = `<div class="text-muted text-sm">Gagal memuat diskusi: ${escapeHtml(err.message)}</div>`;
  }
}

function renderMsg(m) {
  const isOut = m.sender_role === 'admin' || m.sender_role === 'pimpinan' || m.sender_role === 'unit';
  // "out" = from staff perspective when admin views; simpler: align own messages right
  const own = String(m.sender_id) === String(state.user.id);
  return `<div class="msg ${own ? 'msg--out' : ''} ${m.is_internal ? 'msg--internal' : ''}">
    ${avatar(m.sender_name || 'User', { size: 'sm', seed: m.sender_name })}
    <div>
      ${m.is_internal ? `<div class="msg__internal-tag">${icon('lock', { size: 11 })} Internal</div>` : ''}
      <div class="msg__bubble">
        <div class="msg__text">${escapeHtml(m.message)}</div>
      </div>
      <div class="msg__time">${escapeHtml(m.sender_name || '')} · ${timeAgo(m.created_at)}</div>
    </div>
  </div>`;
}

async function sendMsg(pengaduanId, canManage) {
  const input = $('#msg-input');
  const text = input.value.trim();
  if (!text) return;
  const internal = $('#msg-internal')?.checked || false;
  input.value = '';
  try {
    await api.sendMessage(pengaduanId, text, internal);
    loadChatInto(pengaduanId, canManage);
  } catch (err) {
    toastError(err.message);
    input.value = text;
  }
}

/* ---------- Status action modals ---------- */
function openVerifyModal(p) {
  openModal(`
    <div class="modal__header"><div class="modal__title">${icon('shieldCheck')} Verifikasi Pengaduan</div><button class="modal__close" data-close-modal>${icon('x')}</button></div>
    <div class="modal__body">
      <p class="text-secondary mb-4">Teruskan pengaduan <strong>${escapeHtml(p.kode_pengaduan || p.id)}</strong> ke unit penanganan.</p>
      <div class="form-group"><label class="form-label" for="v-unit">Unit Penanganan <span class="required">*</span></label>
        <select class="form-select" id="v-unit"><option value="">Pilih unit...</option></select></div>
      <div class="form-group"><label class="form-label" for="v-notes">Catatan</label>
        <textarea class="form-textarea" id="v-notes" rows="3" placeholder="Catatan (opsional)"></textarea></div>
    </div>
    <div class="modal__footer"><button class="btn btn--secondary" data-close-modal>Batal</button><button class="btn btn--success" id="v-submit">${icon('check')} Verifikasi</button></div>
  `, {
    async onMount(modal) {
      const unit = await loadUnit();
      const sel = modal.querySelector('#v-unit');
      sel.innerHTML = `<option value="">Pilih unit...</option>` + unit.map((u) => `<option value="${u.id}">${escapeHtml(u.nama)}</option>`).join('');
      modal.querySelector('#v-submit').addEventListener('click', (e) => {
        if (!sel.value) { toastError('Pilih unit tujuan.'); return; }
        withButtonLoading(e.currentTarget, async () => {
          await api.verifyPengaduan(p.id, { unit_id: parseInt(sel.value), notes: modal.querySelector('#v-notes').value || undefined });
          toastSuccess('Pengaduan berhasil diverifikasi.');
          closeModal();
        }).then(() => renderPengaduanDetail(document.getElementById('main-content'), p.id));
      });
    },
  });
}

function openResolveModal(p) {
  openModal(`
    <div class="modal__header"><div class="modal__title">${icon('checkCircle')} Tandai Selesai</div><button class="modal__close" data-close-modal>${icon('x')}</button></div>
    <div class="modal__body">
      <p class="text-secondary mb-4">Konfirmasi penyelesaian pengaduan <strong>${escapeHtml(p.kode_pengaduan || p.id)}</strong>.</p>
      <div class="form-group"><label class="form-label" for="r-note">Catatan Penyelesaian <span class="required">*</span></label>
        <textarea class="form-textarea" id="r-note" rows="3" placeholder="Jelaskan langkah penyelesaian..."></textarea></div>
    </div>
    <div class="modal__footer"><button class="btn btn--secondary" data-close-modal>Batal</button><button class="btn btn--success" id="r-submit">${icon('check')} Selesaikan</button></div>
  `, {
    onMount(modal) {
      modal.querySelector('#r-submit').addEventListener('click', (e) => {
        const note = modal.querySelector('#r-note').value.trim();
        if (!note) { toastError('Catatan penyelesaian wajib diisi.'); return; }
        withButtonLoading(e.currentTarget, async () => {
          await api.resolvePengaduan(p.id, note);
          toastSuccess('Pengaduan ditandai selesai.');
          closeModal();
        }).then(() => renderPengaduanDetail(document.getElementById('main-content'), p.id));
      });
    },
  });
}

function openRejectModal(p) {
  openModal(`
    <div class="modal__header"><div class="modal__title">${icon('x')} Tolak Pengaduan</div><button class="modal__close" data-close-modal>${icon('x')}</button></div>
    <div class="modal__body">
      <p class="text-secondary mb-4">Tolak pengaduan <strong>${escapeHtml(p.kode_pengaduan || p.id)}</strong>. Alasan akan dikirim ke pelapor.</p>
      <div class="form-group"><label class="form-label" for="x-reason">Alasan Penolakan <span class="required">*</span></label>
        <textarea class="form-textarea" id="x-reason" rows="3" placeholder="Jelaskan alasan penolakan..."></textarea></div>
    </div>
    <div class="modal__footer"><button class="btn btn--secondary" data-close-modal>Batal</button><button class="btn btn--danger" id="x-submit">${icon('x')} Tolak</button></div>
  `, {
    onMount(modal) {
      modal.querySelector('#x-submit').addEventListener('click', (e) => {
        const reason = modal.querySelector('#x-reason').value.trim();
        if (!reason) { toastError('Alasan penolakan wajib diisi.'); return; }
        withButtonLoading(e.currentTarget, async () => {
          await api.rejectPengaduan(p.id, reason);
          toastSuccess('Pengaduan ditolak.');
          closeModal();
        }).then(() => renderPengaduanDetail(document.getElementById('main-content'), p.id));
      });
    },
  });
}
