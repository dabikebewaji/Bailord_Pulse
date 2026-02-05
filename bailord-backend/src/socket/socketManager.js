import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// Store active user connections
const userSockets = new Map(); // userId -> Set of socket IDs
const socketUsers = new Map(); // socketId -> userId

export function initializeSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Auth middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected on socket ${socket.id}`);

        // Add to our tracking maps
        if (!userSockets.has(socket.userId)) {
            userSockets.set(socket.userId, new Set());
        }
        userSockets.get(socket.userId).add(socket.id);
        socketUsers.set(socket.id, socket.userId);

        // Join private room for this user
        socket.join(`user:${socket.userId}`);

        // Handle new message
        socket.on('send_message', async (data) => {
            try {
                const { recipient_id, content } = data;
                
                // Emit to all recipient's sockets
                io.to(`user:${recipient_id}`).emit('new_message', {
                    id: data.id,
                    sender_id: socket.userId,
                    recipient_id,
                    content,
                    created_at: new Date(),
                    is_read: false
                });

                // Emit to all sender's sockets (for multi-tab/device sync)
                io.to(`user:${socket.userId}`).emit('message_sent', {
                    id: data.id,
                    recipient_id,
                    content,
                    created_at: new Date()
                });
            } catch (error) {
                console.error('Error handling message:', error);
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        // Handle marking messages as read
        socket.on('mark_read', async (data) => {
            try {
                const { message_id } = data;
                
                // Emit to sender that their message was read
                io.to(`user:${data.sender_id}`).emit('message_read', {
                    message_id,
                    reader_id: socket.userId
                });
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        });

        // Handle typing indicators
        socket.on('typing_start', (data) => {
            io.to(`user:${data.recipient_id}`).emit('user_typing', {
                user_id: socket.userId
            });
        });

        socket.on('typing_stop', (data) => {
            io.to(`user:${data.recipient_id}`).emit('user_stopped_typing', {
                user_id: socket.userId
            });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected from ${socket.id}`);
            
            // Remove from tracking maps
            const userSocketSet = userSockets.get(socket.userId);
            if (userSocketSet) {
                userSocketSet.delete(socket.id);
                if (userSocketSet.size === 0) {
                    userSockets.delete(socket.userId);
                }
            }
            socketUsers.delete(socket.id);
        });
    });

    return io;
}

// Utility to check if a user is online
export function isUserOnline(userId) {
    return userSockets.has(userId) && userSockets.get(userId).size > 0;
}

// Utility to emit to all sockets of a specific user
export function emitToUser(userId, event, data) {
    const io = global.io; // Access the global io instance
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
}