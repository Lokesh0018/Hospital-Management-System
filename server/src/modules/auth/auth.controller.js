import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return ApiResponse.created(res, result, 'User registered successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user with email & password
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return ApiResponse.ok(res, result, 'Login successful.');
    } catch (error) {
      console.error(`[AuthController.login] Error during login:`, error.message);
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req, res, next) {
    try {
      const token = req.body.refreshToken || req.cookies?.refreshToken;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token is required.'
        });
      }

      const tokens = await AuthService.refreshTokens(token);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return ApiResponse.ok(res, tokens, 'Tokens refreshed successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user and revoke refresh token
   */
  static async logout(req, res, next) {
    try {
      const token = req.body.refreshToken || req.cookies?.refreshToken;
      await AuthService.logout(token);

      res.clearCookie('refreshToken');
      return ApiResponse.ok(res, null, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get authenticated user profile
   */
  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getCurrentUser(req.user.id);
      return ApiResponse.ok(res, user, 'User profile retrieved.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user.id, currentPassword, newPassword);

      res.clearCookie('refreshToken');
      return ApiResponse.ok(res, null, 'Password updated successfully. Please login again.');
    } catch (error) {
      next(error);
    }
  }
}
