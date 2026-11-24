import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import prisma from '../database/prisma.js';

let io = null;

/**
 * Initialize Socket.IO server attached to HTTP server
 * @param {import('http').Server} httpServer
 */
export const initSocket = (httpServer) => {
  const allowedOrigins =
    ENV.CORS_ORIGIN === '*'
      ? '*'
      : [ENV.CORS_ORIGIN, 'http://localhost:3000', 'http://localhost:5173'];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    },
    pingTimeout: 30000,
    pingInterval: 25000
  });

  // Socket.IO Handshake Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication failed: Missing token'));
      }

      if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
      }

      const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
      if (!decoded || !decoded.userId) {
        return next(new Error('Authentication failed: Invalid token payload'));
      }

      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return next(new Error('Authentication failed: User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  // Client Connection Handler
  io.on('connection', (socket) => {
    const user = socket.user;
    if (!user) return;

    // Join private user room and role channel room
    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);

    console.log(
      `[Socket.IO] 🔌 Client connected: ${socket.id} | User: ${user.name} | Role: ${user.role}`
    );

    // Optional client ping-pong for liveness
    socket.on('client:ping', () => {
      socket.emit('server:pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      console.log(
        `[Socket.IO] ❌ Client disconnected: ${socket.id} (${user.name}) - Reason: ${reason}`
      );
    });
  });

  return io;
};

/**
 * Get active Socket.IO server instance
 */
export const getIO = () => {
  return io;
};

/**
 * Emit event to a specific user
 * @param {string} userId
 * @param {string} event
 * @param {any} data
 */
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Emit event to a specific role channel
 * @param {string} role ADMIN | DOCTOR | PATIENT | RECEPTIONIST
 * @param {string} event
 * @param {any} data
 */
export const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

/**
 * Broadcast event to all connected clients
 * @param {string} event
 * @param {any} data
 */
export const broadcastEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

/**
 * Persist an in-app notification in database and broadcast in real-time
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.role]
 * @param {string} [options.userId]
 * @param {string} [options.event]
 * @param {any} [options.data]
 */
export const sendNotification = async ({
  title,
  message,
  role = null,
  userId = null,
  event = null,
  data = {}
}) => {
  try {
    // 1. Persist notification to database
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        role: role || null,
        userId: userId || null,
        isRead: false
      }
    });

    // 2. Real-time delivery
    if (io) {
      const payload = {
        notification,
        event,
        data,
        timestamp: new Date().toISOString()
      };

      if (userId) {
        io.to(`user:${userId}`).emit('notification:new', payload);
      } else if (role) {
        io.to(`role:${role}`).emit('notification:new', payload);
      } else {
        io.emit('notification:new', payload);
      }

      // Also emit custom domain event if provided
      if (event) {
        if (userId) io.to(`user:${userId}`).emit(event, data);
        if (role) io.to(`role:${role}`).emit(event, data);
      }
    }

    return notification;
  } catch (error) {
    console.error('[Socket.IO] Failed to send notification:', error);
    return null;
  }
};

export default {
  initSocket,
  getIO,
  emitToUser,
  emitToRole,
  broadcastEvent,
  sendNotification
};
