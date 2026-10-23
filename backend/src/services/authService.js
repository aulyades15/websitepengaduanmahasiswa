import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';

export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  
  return { accessToken, refreshToken };
};

export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const registerUser = async (userData) => {
  const { nim, nama, email, phone, prodi_id, password } = userData;
  
  // Check if NIM exists
  const existing = await query('SELECT id FROM users WHERE nim = $1 OR email = $2', [nim, email]);
  if (existing.rows.length > 0) {
    throw new Error('NIM atau email sudah terdaftar');
  }
  
  const passwordHash = await hashPassword(password);
  
  const result = await query(`
    INSERT INTO users (nim, nama, email, phone, prodi_id, password_hash, role)
    VALUES ($1, $2, $3, $4, $5, $6, 'mahasiswa')
    RETURNING id, nim, nama, email, phone, role, prodi_id, created_at
  `, [nim, nama, email, phone, prodi_id, passwordHash]);
  
  return result.rows[0];
};

export const loginUser = async (nim, password) => {
  const result = await query(
    'SELECT id, nim, nama, email, phone, role, prodi_id, password_hash, is_active, is_verified FROM users WHERE nim = $1',
    [nim]
  );
  
  if (result.rows.length === 0) {
    throw new Error('NIM atau password salah');
  }
  
  const user = result.rows[0];
  
  if (!user.is_active) {
    throw new Error('Akun tidak aktif');
  }
  
  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('NIM atau password salah');
  }
  
  // Update last login
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  
  const { password_hash, ...userWithoutPass } = user;
  return userWithoutPass;
};

export const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    const result = await query(
      'SELECT id, nim, nama, email, role, prodi_id, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].is_active) {
      throw new Error('User tidak ditemukan atau tidak aktif');
    }
    
    const user = result.rows[0];
    const { accessToken } = generateTokens(user);
    
    return { accessToken };
  } catch (error) {
    throw new Error('Refresh token tidak valid');
  }
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  
  if (result.rows.length === 0) {
    throw new Error('User tidak ditemukan');
  }
  
  const isValid = await comparePassword(currentPassword, result.rows[0].password_hash);
  if (!isValid) {
    throw new Error('Password lama salah');
  }
  
  const newHash = await hashPassword(newPassword);
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
  
  return true;
};

export const updateProfile = async (userId, data) => {
  const { nama, phone, email } = data;
  
  // Check email uniqueness
  if (email) {
    const existing = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (existing.rows.length > 0) {
      throw new Error('Email sudah digunakan');
    }
  }
  
  const fields = [];
  const values = [];
  let paramCount = 1;
  
  if (nama) { fields.push(`nama = $${paramCount++}`); values.push(nama); }
  if (phone) { fields.push(`phone = $${paramCount++}`); values.push(phone); }
  if (email) { fields.push(`email = $${paramCount++}`); values.push(email); }
  
  if (fields.length === 0) return null;
  
  fields.push(`updated_at = NOW()`);
  values.push(userId);
  
  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, nim, nama, email, phone, role, prodi_id`,
    values
  );
  
  return result.rows[0];
};