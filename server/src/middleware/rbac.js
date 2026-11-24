import { ApiError } from '../utils/apiError.js';

/**
 * Role-Based Access Control (RBAC) Guard
 * @param  {...string} allowedRoles Roles that have access to this route
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User must be authenticated before checking permissions.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource. Allowed: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
};
