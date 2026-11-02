// ==========================================================================
// CampusCare — Chat page (list of pengaduan with real-time discussions)
// Messages are sent via REST and broadcast over Socket.io to the room.
// ==========================================================================
import { io } from 'socket.io-client';
import { SERVER_URL } from '../config.js';
import api from '../api.js';
import { icon } from '../icons.js';
import { $, $$, escapeHtml, avatar, timeAgo, emptyState, toastError } from '../ui.js';
import { state } from '../store.js';

/* ---------- Socket connection (singleton) ---------- */
let socket = null;
let currentRoomId = null;
let renderedIds = new Set();

function ensureSocket() {
  if (socket) return socket;

  socket = io(SERVER_URL || '/', {
    path: '/socket.io',
    transports: ['websocket'],
    reconnection: true,
  });

  socket.on('connect', () => {
    setLive('connecting');
    const token = localStorage.getItem('accessToken');
    if (token) socket.emit('authenticate', token);
  });

  socket.on('authenticated', (res) => {
    if (!res?.success) {
      setLive('off');
      return;
    }
    setLive('live');
    // (Re)join the room after every connect / reconnect.
    if (currentRoomId) joinRoom(currentRoomId);
  });

  socket.on('disconnect', () => setLive('off'));

  socket.on('chat:message', (msg) => {
    if (!msg) return;
    if (String(msg.pengaduan_id) !== String(currentRoomId)) return;
    appendMessage(msg);
  });

  return socket;
}

function joinRoom(id) {
  if (!socket || !id) return;
  socket.emit('join-pengaduan', id);
  if (state.user?.role && state.user.role !== 'mahasiswa') {
    socket.emit('join-pengaduan-internal', id);
  }
}

function leaveRoom(id) {
  if (!socket || !id) return;
  socket.emit('leave-pengaduan', id);
}

function setLive(status) {
  const el = document.getElementById('chat-live');
  if (!el) return;
  el.classList.toggle('is-live', status === 'live');
  el.classList.toggle('is-off', status === 'off');
  if (status === 'live') el.innerHTML = `${icon('zap', { size: 12 })} Live · tersambung`;
  else if (status === 'off') el.innerHTML = `${icon('alertCircle', { size: 12 })} Terputus`;
  else el.innerHTML = `${icon('refresh', { size: 12 })} Menghubungkan...`;
}

/* ---------- Page ---------- */
export async function renderChat(root) {
  if (currentRoomId) leaveRoom(currentRoomId);
  currentRoomId = null;
  renderedIds = new Set();
  ensureSocket();

  root.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Diskusi</h1>
        <p class="page-header__subtitle">Percakapan dan tindak lanjut setiap pengaduan.</p>
      </div>
    </div>
    <div class="chat-layout">
      <div class="chat-list">
        <div class="chat-list__header">
          <div class="search-input">${icon('search', { size: 17 })}<input class="form-input" id="chat-search" placeholder="Cari pengaduan..."></div>
        </div>
        <div class="chat-list__items" id="chat-items"><div style="padding:var(--space-6)"><div class="skeleton" style="height:56px;margin-bottom:10px"></div><div class="skeleton" style="height:56px;margin-bottom:10px"></div><div class="skeleton" style="height:56px"></div></div></div>
      </div>
      <div class="chat-room" id="chat-room">
        <div class="empty-state" style="margin:auto">
          <div class="empty-state__icon">${icon('message', { size: 34 })}</div>
          <div class="empty-state__title">Pilih percakapan</div>
          <div class="empty-state__text">Pilih pengaduan dari daftar untuk membuka diskusi.</div>
        </div>
      </div>
    </div>
  `;

  loadChatList();

  $('#chat-search').addEventListener('input', debounce((e) => loadChatList(e.target.value), 300));
}

let debounceT;
function debounce(fn, delay) {
  clearTimeout(debounceT);
  return (...a) => { debounceT = setTimeout(() => fn(...a), delay); };
}

async function loadChatList(search = '') {
  const items = $('#chat-items');
  try {
    const res = await api.getPengaduanList({ limit: 50, search });
    const list = res.data?.items || [];
    if (!list.length) {
      items.innerHTML = emptyState({ title: 'Belum ada diskusi', text: 'Pengaduan yang dibuat akan muncul di sini.', iconName: 'message' });
      return;
    }
    items.innerHTML = list.map((p) => `
      <div class="chat-list__item" data-id="${p.id}">
        ${avatar(p.pelapor_nama || 'U', { size: 'sm', seed: p.pelapor_nama })}
        <div class="chat-list__info">
          <div class="chat-list__name">${escapeHtml(p.judul)}</div>
          <div class="chat-list__preview">${escapeHtml(p.kategori_nama || '')} · ${escapeHtml(p.kode_pengaduan || '')}</div>
        </div>
        <div class="chat-list__time">${timeAgo(p.created_at)}</div>
      </div>
    `).join('');

    $$('.chat-list__item').forEach((it) => {
      it.addEventListener('click', () => {
        $$('.chat-list__item').forEach((x) => x.classList.remove('is-active'));
        it.classList.add('is-active');
        openRoom(it.dataset.id, it.querySelector('.chat-list__name').textContent);
      });
    });

    // open first by default
    const first = items.querySelector('.chat-list__item');
    if (first) { first.classList.add('is-active'); openRoom(first.dataset.id, first.querySelector('.chat-list__name').textContent); }
  } catch (err) {
    items.innerHTML = emptyState({ title: 'Gagal memuat', text: err.message, iconName: 'alertCircle' });
  }
}

async function openRoom(id, title) {
  const room = $('#chat-room');
  room.innerHTML = `
    <div class="chat-room__header">
      <div style="flex:1;min-width:0">
        <div style="font-weight:700" class="truncate">${escapeHtml(title)}</div>
        <div class="chat-live" id="chat-live">${icon('refresh', { size: 12 })} Menghubungkan...</div>
      </div>
      <a href="#/pengaduan/${id}" class="btn btn--ghost btn--sm">Detail ${icon('chevronRight', { size: 15 })}</a>
    </div>
    <div class="chat-room__messages" id="room-messages"><div class="spinner spinner-lg" style="margin:auto"></div></div>
    <div class="chat-room__input">
      <textarea class="form-textarea" id="room-input" rows="1" placeholder="Tulis pesan..."></textarea>
      <button class="btn btn--primary" id="room-send">${icon('send', { size: 18 })}</button>
    </div>
  `;

  if (currentRoomId && currentRoomId !== id) leaveRoom(currentRoomId);
  currentRoomId = id;
  renderedIds = new Set();
  joinRoom(id);
  setLive(socket?.connected ? 'live' : 'connecting');

  await loadRoom(id);
  $('#room-send').addEventListener('click', () => sendRoom(id));
  $('#room-input').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRoom(id); } });
}

async function loadRoom(id) {
  const box = $('#room-messages');
  try {
    const res = await api.getMessages(id, 1, 100);
    const msgs = res.data?.items || [];
    renderedIds = new Set(msgs.map((m) => String(m.id)));

    box.innerHTML = msgs.length ? msgs.map((m) => messageHtml(m)).join('')
      : `<div class="chat-empty text-muted text-sm" style="text-align:center;padding:var(--space-6)">Belum ada pesan.</div>`;
    box.scrollTop = box.scrollHeight;
  } catch (err) {
    box.innerHTML = `<div class="text-muted text-sm" style="text-align:center;padding:var(--space-6)">Gagal memuat pesan.</div>`;
  }
}

function messageHtml(m) {
  const own = String(m.sender_id) === String(state.user.id);
  return `<div class="msg ${own ? 'msg--out' : ''} ${m.is_internal ? 'msg--internal' : ''}">
    ${avatar(m.sender_name || 'U', { size: 'sm', seed: m.sender_name })}
    <div>
      ${m.is_internal ? `<div class="msg__internal-tag">${icon('lock', { size: 11 })} Internal</div>` : ''}
      <div class="msg__bubble"><div class="msg__text">${escapeHtml(m.message)}</div></div>
      <div class="msg__time">${escapeHtml(m.sender_name || '')} · ${timeAgo(m.created_at)}</div>
    </div>
  </div>`;
}

/** Append a message received over WebSocket (or from the REST response). */
function appendMessage(m) {
  // Never show internal notes to students.
  if (m.is_internal && state.user?.role === 'mahasiswa') return;

  const box = document.getElementById('room-messages');
  if (!box) return;

  const key = m.id != null ? String(m.id) : null;
  if (key) {
    if (renderedIds.has(key)) return;
    renderedIds.add(key);
  }

  box.querySelector('.chat-empty')?.remove();

  const wrapper = document.createElement('div');
  wrapper.innerHTML = messageHtml({ ...m, created_at: m.created_at || new Date().toISOString() });
  box.appendChild(wrapper.firstElementChild);
  box.scrollTop = box.scrollHeight;
}

async function sendRoom(id) {
  const input = $('#room-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  try {
    const res = await api.sendMessage(id, text, false);
    // The WebSocket broadcast usually arrives first; appending the REST
    // response covers the case where the socket is not connected yet
    // (dedupe by id keeps it from appearing twice).
    if (res?.data) appendMessage({ ...res.data, sender_name: state.user.nama });
  } catch (err) {
    toastError(err.message);
    input.value = text;
  }
}
