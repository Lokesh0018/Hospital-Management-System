import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import prisma from '../database/prisma.js';

/**
 * Authentication Middleware: Verifies JWT access token and attaches user record to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      // Or check HTTP-only cookie
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token is required. Please login.'));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Access token has expired. Please refresh your token.'));
      }
      return next(ApiError.unauthorized('Invalid authentication token.'));
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return next(ApiError.unauthorized('User account no longer exists.'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('User account has been deactivated. Please contact administration.'));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
