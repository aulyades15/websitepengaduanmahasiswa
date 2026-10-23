import jwt from 'jsonwebtoken';
import { registerUser, loginUser, refreshAccessToken, changePassword, updateProfile } from '../services/authService.js';

const generateTokens = (user) => {
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

export const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);
    const { accessToken, refreshToken } = generateTokens(user);
    
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'REGISTRATION_FAILED', message: error.message }
    });
  }
};

export const login = async (req, res) => {
  try {
    const { nim, password } = req.body;
    const user = await loginUser(nim, password);
    const { accessToken, refreshToken } = generateTokens(user);
    
    res.json({
      success: true,
      message: 'Login berhasil',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'LOGIN_FAILED', message: error.message }
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Refresh token diperlukan' }
      });
    }
    
    const { accessToken } = await refreshAccessToken(refreshToken);
    
    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'REFRESH_FAILED', message: error.message }
    });
  }
};

export const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout berhasil'
  });
};

export const getProfile = async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
};

export const updateProfileController = async (req, res) => {
  try {
    const user = await updateProfile(req.user.id, req.body);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_CHANGES', message: 'Tidak ada data yang diubah' }
      });
    }
    
    res.json({
      success: true,
      message: 'Profil berhasil diupdate',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: error.message }
    });
  }
};

export const changePasswordController = async (req, res) => {
  try {
    await changePassword(req.user.id, req.body.current_password, req.body.new_password);
    
    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'PASSWORD_CHANGE_FAILED', message: error.message }
    });
  }
};