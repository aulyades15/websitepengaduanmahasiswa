import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data yang dikirim tidak valid',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      }
    });
  }
  
  next();
};

export const validateQuery = (req, res, next) => {
  // Validate common query parameters
  const { page = 1, limit = 20, sort = 'created_at', order = 'desc' } = req.query;
  
  req.query.page = Math.max(1, parseInt(page));
  req.query.limit = Math.min(100, Math.max(1, parseInt(limit)));
  req.query.sort = ['created_at', 'updated_at', 'judul', 'status'].includes(sort) ? sort : 'created_at';
  req.query.order = ['asc', 'desc'].includes(order.toLowerCase()) ? order.toLowerCase() : 'desc';
  
  next();
};