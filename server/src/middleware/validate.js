import { ApiError } from '../utils/apiError.js';

/**
 * Validates request payload (body, query, or params) against a Zod schema
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} source 
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const errorDetails = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return next(ApiError.badRequest('Validation failed', errorDetails));
      }
      next(err);
    }
  };
};
