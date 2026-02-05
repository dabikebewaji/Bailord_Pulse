import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// In development, use relative path to let Vite handle proxying
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function useSocket() {
    const socketRef = useRef(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Get token from localStorage
        const stored = localStorage.getItem('bailord_user');
        if (!stored) return;

        const { token } = JSON.parse(stored);
        if (!token) return;

        // Create socket connection with auth
        try {
            socketRef.current = io(SOCKET_URL, {
                auth: { token },
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 3,
                reconnectionDelay: 1000,
                path: '/ws',  // Match the backend path
                transports: ['websocket'],  // Use only websocket transport
                withCredentials: true
            });

            // Connection events
            socketRef.current.on('connect', () => {
                console.log('Socket connected');
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                if (error.message === 'Authentication error') {
                    toast.error('Session expired. Please login again.');
                }
                // Don't show errors for connection issues in development
                if (!import.meta.env.DEV) {
                    toast.error('Chat service unavailable');
                }
            });
        } catch (error) {
            console.error('Failed to initialize socket:', error);
        }

        // Message events
        socketRef.current.on('new_message', (message) => {
            toast.info(`New message from ${message.sender_name || 'someone'}`, {
                description: message.content.substring(0, 50) + '...',
                action: {
                    label: "View",
                    onClick: () => window.location.href = '/messages'
                }
            });
            // You can also update your messages state/cache here
        });

        socketRef.current.on('message_sent', (confirmation) => {
            // Handle successful message send (optional)
            console.log('Message sent:', confirmation);
        });

        socketRef.current.on('message_error', (error) => {
            toast.error('Failed to send message');
        });

        socketRef.current.on('user_typing', (data) => {
            // Handle typing indicator
            console.log('User typing:', data.user_id);
        });

        socketRef.current.on('user_stopped_typing', (data) => {
            // Handle typing indicator removal
            console.log('User stopped typing:', data.user_id);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user]);

    // Function to send a message
    const sendMessage = (recipientId, content) => {
        if (!socketRef.current?.connected) {
            toast.error('Not connected to chat server');
            return;
        }

        socketRef.current.emit('send_message', {
            recipient_id: recipientId,
            content
        });
    };

    // Function to mark messages as read
    const markMessageRead = (messageId, senderId) => {
        if (!socketRef.current?.connected) return;
        
        socketRef.current.emit('mark_read', {
            message_id: messageId,
            sender_id: senderId
        });
    };

    // Typing indicator functions
    const startTyping = (recipientId) => {
        if (!socketRef.current?.connected) return;
        socketRef.current.emit('typing_start', { recipient_id: recipientId });
    };

    const stopTyping = (recipientId) => {
        if (!socketRef.current?.connected) return;
        socketRef.current.emit('typing_stop', { recipient_id: recipientId });
    };

    return {
        socket: socketRef.current,
        sendMessage,
        markMessageRead,
        startTyping,
        stopTyping
    };
}