// ==========================================================================
// Multi-channel notification sender (Email + WhatsApp + In-app).
// Called after creating in-app notification. Reads user preferences.
// ==========================================================================
import nodemailer from 'nodemailer';
import { query } from '../config/database.js';
import { getPreferences } from './notificationService.js';

// ---------- Email transporter ----------
let emailTransporter = null;

function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;
  
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, EMAIL_FROM_NAME } = process.env;
  
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️  Email not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing). Email notifications disabled.');
    return null;
  }
  
  emailTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT) || 587,
    secure: (SMTP_PORT === '465'),
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  
  return emailTransporter;
}

// ---------- WhatsApp webhook ----------
async function sendWhatsApp(waNumber, message) {
  const { WHATSAPP_WEBHOOK_URL, WHATSAPP_WEBHOOK_TOKEN } = process.env;
  
  if (!WHATSAPP_WEBHOOK_URL) {
    console.warn('⚠️  WhatsApp webhook not configured (WHATSAPP_WEBHOOK_URL missing). WA notifications disabled.');
    return false;
  }
  
  try {
    const res = await fetch(WHATSAPP_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(WHATSAPP_WEBHOOK_TOKEN ? { 'Authorization': `Bearer ${WHATSAPP_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({ to: waNumber, message }),
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error('❌ WhatsApp webhook error:', res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.error('❌ WhatsApp send failed:', err.message);
    return false;
  }
}

// ---------- Email templates ----------
function renderEmailTemplate({ title, message, actionUrl, userName, pengaduanCode }) {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = actionUrl ? `${appUrl}${actionUrl}` : appUrl;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;background:#f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px;text-align:center;">
        <div style="width:56px;height:56px;border-radius:14px;background:#fff;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="24" fill="#4f46e5"/><path d="M50 22 26 32v18c0 16 10 26 24 30 14-4 24-14 24-30V32L50 22Z" fill="none" stroke="white" stroke-width="7" stroke-linejoin="round"/><path d="m40 50 7 7 14-14" fill="none" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">CampusCare</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Sistem Pengaduan Mahasiswa UIN Gus Dur</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;font-weight:700;">${title}</h2>
        <p style="margin:0 0 24px;color:#334155;line-height:1.6;font-size:15px;">Halo <strong>${userName || 'Mahasiswa'}</strong>,</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;color:#1e293b;line-height:1.7;font-size:15px;">
          ${message}
          ${pengaduanCode ? `<p style="margin:12px 0 0;font-family:monospace;font-size:13px;color:#64748b;">Kode: <strong>${pengaduanCode}</strong></p>` : ''}
        </div>
        ${actionUrl ? `
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Lihat Pengaduan</a>
        </div>` : ''}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
          Email ini dikirim otomatis oleh sistem CampusCare. Jika Anda tidak mengharapkan email ini, abaikan saja.
          <br><br>
          © ${new Date().getFullYear()} UIN Gus Dur · Sistem Informasi Pengaduan Mahasiswa
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------- Core sender ----------
async function sendEmail({ to, subject, html }) {
  const transporter = getEmailTransporter();
  if (!transporter) return false;
  
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'CampusCare UIN Gus Dur'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    return false;
  }
}

// ---------- Public API ----------
/**
 * Send notification via all enabled channels for a user.
 * @param {Object} opts
 * @param {number} opts.userId - Target user ID
 * @param {string} opts.type - Notification type (e.g., 'pengaduan_baru', 'status_berubah', 'chat_baru')
 * @param {string} opts.title - Short title
 * @param {string} opts.message - Full message
 * @param {string} [opts.actionUrl] - Relative URL (e.g., '/pengaduan/12')
 * @param {string} [opts.pengaduanCode] - Kode pengaduan for reference
 * @param {number} [opts.pengaduanId] - Pengaduan ID (for logging)
 */
export async function sendMultiChannelNotification(opts) {
  const { userId, type, title, message, actionUrl, pengaduanCode, pengaduanId } = opts;
  
  // Get user + preferences
  const userRes = await query('SELECT id, nama, email, phone, role FROM users WHERE id = $1 AND is_active = true', [userId]);
  if (userRes.rows.length === 0) return { email: false, wa: false, reason: 'user_not_found' };
  
  const user = userRes.rows[0];
  const prefs = await getPreferences(userId);
  
  // Check if this type+channel is enabled
  const emailEnabled = prefs.some(p => p.channel === 'email' && p.notification_type === type && p.is_enabled);
  const waEnabled = prefs.some(p => p.channel === 'whatsapp' && p.notification_type === type && p.is_enabled);
  // push/in-app already handled by createNotification
  
  const results = { email: false, wa: false };
  const promises = [];
  
  // --- Email ---
  if (emailEnabled && user.email) {
    const html = renderEmailTemplate({ title, message, actionUrl, userName: user.nama, pengaduanCode });
    promises.push(
      sendEmail({ to: user.email, subject: `[CampusCare] ${title}`, html })
        .then(ok => { results.email = ok; })
        .catch(err => { console.error('Email promise error:', err); results.email = false; })
    );
  }
  
  // --- WhatsApp ---
  if (waEnabled && user.phone) {
    // Format: "🔔 CampusCare\n\nJudul: ...\n\nPesan: ...\n\nKode: PDU-..."
    const waMsg = `🔔 *CampusCare UIN Gus Dur*\n\n*${title}*\n\n${message}${pengaduanCode ? `\n\nKode: ${pengaduanCode}` : ''}${actionUrl ? `\n\n${process.env.FRONTEND_URL || 'http://localhost:5173'}${actionUrl}` : ''}`;
    promises.push(
      sendWhatsApp(user.phone, waMsg)
        .then(ok => { results.wa = ok; })
        .catch(err => { console.error('WA promise error:', err); results.wa = false; })
    );
  }
  
  if (promises.length) await Promise.allSettled(promises);
  
  // Log for audit
  if (pengaduanId) {
    await query(`
      INSERT INTO notification_delivery_log (pengaduan_id, user_id, type, email_sent, wa_sent, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT DO NOTHING
    `, [pengaduanId, userId, type, results.email, results.wa]).catch(() => {}); // table may not exist yet
  }
  
  return results;
}

// --- Helper to create in-app + send multi-channel in one call ---
export async function createAndSendNotification(opts) {
  const { userId, pengaduanId, type, title, message, actionUrl, pengaduanCode } = opts;
  
  // 1) Create in-app notification
  const notif = await query(`
    INSERT INTO notifications (user_id, pengaduan_id, type, title, message, action_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [userId, pengaduanId, type, title, message, actionUrl]);
  
  // 2) Fire-and-forget multi-channel send
  sendMultiChannelNotification({ userId, pengaduanId, type, title, message, actionUrl, pengaduanCode })
    .catch(err => console.error('Multi-channel send error:', err));
  
  return notif.rows[0];
}

// --- Initialize delivery log table (idempotent) ---
export async function initDeliveryLogTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS notification_delivery_log (
      id BIGSERIAL PRIMARY KEY,
      pengaduan_id BIGINT REFERENCES pengaduan(id) ON DELETE SET NULL,
      user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      type VARCHAR(50) NOT NULL,
      email_sent BOOLEAN DEFAULT FALSE,
      wa_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await query('CREATE INDEX IF NOT EXISTS idx_notif_delivery_pengaduan ON notification_delivery_log(pengaduan_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_notif_delivery_user ON notification_delivery_log(user_id)');
}