import Joi from 'joi';

export const schemas = {
  register: Joi.object({
    nim: Joi.string().pattern(/^\d{8,12}$/).required().messages({
      'string.pattern.base': 'NIM harus 8-12 digit angka',
      'any.required': 'NIM wajib diisi'
    }),
    nama: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nama minimal 2 karakter',
      'any.required': 'Nama wajib diisi'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Format email tidak valid',
      'any.required': 'Email wajib diisi'
    }),
    phone: Joi.string().pattern(/^08\d{8,11}$/).optional().messages({
      'string.pattern.base': 'Nomor HP harus diawali 08 dan 10-13 digit'
    }),
    prodi_id: Joi.number().integer().positive().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
      'string.min': 'Password minimal 8 karakter',
      'string.pattern.base': 'Password harus mengandung huruf besar, kecil, dan angka',
      'any.required': 'Password wajib diisi'
    }),
    password_confirmation: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Konfirmasi password tidak cocok',
      'any.required': 'Konfirmasi password wajib diisi'
    })
  }),

  login: Joi.object({
    nim: Joi.string().pattern(/^\d{8,12}$/).required(),
    password: Joi.string().required()
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
    new_password_confirmation: Joi.string().valid(Joi.ref('new_password')).required()
  }),

  createPengaduan: Joi.object({
    judul: Joi.string().min(5).max(200).required(),
    deskripsi: Joi.string().min(20).required(),
    kategori_id: Joi.number().integer().positive().required(),
    lokasi: Joi.string().max(200).optional().allow(''),
    is_anonim: Joi.boolean().default(false)
  }),

  updatePengaduan: Joi.object({
    judul: Joi.string().min(5).max(200).optional(),
    deskripsi: Joi.string().min(20).optional(),
    kategori_id: Joi.number().integer().positive().optional(),
    lokasi: Joi.string().max(200).optional().allow('')
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('menunggu', 'diproses', 'selesai', 'ditolak', 'tertunda').required(),
    unit_id: Joi.number().integer().positive().optional(),
    notes: Joi.string().max(1000).optional().allow('')
  }),

  rejectPengaduan: Joi.object({
    reason: Joi.string().min(10).max(1000).required()
  }),

  resolvePengaduan: Joi.object({
    resolution_note: Joi.string().min(10).max(2000).required()
  }),

  ratePengaduan: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    feedback: Joi.string().max(2000).optional().allow('')
  }),

  sendMessage: Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    is_internal: Joi.boolean().default(false)
  }),

  createTemplate: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    content: Joi.string().min(10).required(),
    kategori_id: Joi.number().integer().positive().optional()
  }),

  notificationPrefs: Joi.object({
    preferences: Joi.array().items(
      Joi.object({
        channel: Joi.string().valid('email', 'whatsapp', 'push', 'sms').required(),
        notification_type: Joi.string().required(),
        is_enabled: Joi.boolean().default(true)
      })
    ).required()
  }),

  updateSettings: Joi.object({
    value: Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.object(),
      Joi.array()
    ).required()
  })
};

export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data yang dikirim tidak valid',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      }
    });
  }
  
  req.body = value;
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  if (error) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Query parameter tidak valid',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      }
    });
  }
  
  req.query = value;
  next();
};

export const querySchemas = {
  pengaduanList: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('menunggu', 'diproses', 'selesai', 'ditolak', 'tertunda').optional(),
    kategori_id: Joi.number().integer().positive().optional(),
    is_urgent: Joi.boolean().optional(),
    is_overdue: Joi.boolean().optional(),
    search: Joi.string().max(100).optional().allow(''),
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional(),
    sort: Joi.string().valid('created_at', 'updated_at', 'judul', 'status', 'sla_deadline').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  notifications: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    is_read: Joi.boolean().optional()
  }),

  analytics: Joi.object({
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional(),
    unit_id: Joi.number().integer().positive().optional(),
    kategori_id: Joi.number().integer().positive().optional()
  })
};