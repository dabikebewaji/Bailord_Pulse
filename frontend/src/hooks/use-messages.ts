import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@/services/api';
import { Message, MessageResponse, transformMessageResponse } from '@/types/messages';
import { useSocket } from './use-socket';

interface Conversation {
  id: number;
  name: string;
  company: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface UseMessagesProps {
  userId: number;
}

export function useMessages({ userId }: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useSocket();

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Conversation[]>('/messages/conversations');
      setConversations(response.data || []);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      // If server error or not found, set empty conversations but don't show error
      if (error?.response?.status === 404 || error?.response?.status === 500) {
        setConversations([]);
        return;
      }
      toast.error(error?.response?.data?.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationUserId?: number) => {
    if (!conversationUserId) {
      console.log('No conversation ID provided for fetching messages');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Fetching messages for conversation:', conversationUserId);
      const response = await api.get<MessageResponse[]>(`/messages/conversations/${conversationUserId}`);
      console.log('Received messages:', response.data);
      const transformedMessages = response.data.map(transformMessageResponse);
      console.log('Transformed messages:', transformedMessages);
      setMessages(transformedMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      if (error?.response?.status === 404) {
        // No messages yet is a valid state
        console.log('No messages found for conversation');
        setMessages([]);
      } else {
        toast.error(error?.response?.data?.message || 'Failed to load messages');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (recipientId: number, content: string) => {
    try {
      setIsLoading(true);
      const response = await api.post<MessageResponse>('/messages', {
        recipient_id: recipientId,
        content
      });
      const newMessage = transformMessageResponse(response.data);
      
      // Emit the message via socket for real-time delivery
      if (socket) {
        socket.emit('send_message', {
          recipient_id: recipientId,
          content,
          message_id: newMessage.id
        });
      }
      
      setMessages(prev => [...prev, newMessage]);
      toast.success('Message sent successfully');
      // Refresh conversations list after sending a message
      fetchConversations();
      return newMessage;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error?.response?.data?.message || 'Failed to send message');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [socket, fetchConversations]);

  const markAsRead = useCallback(async (messageId: number) => {
    try {
      const response = await api.patch<MessageResponse>(`/messages/${messageId}/read`);
      const updatedMessage = transformMessageResponse(response.data);
      
      // Emit the read status via socket
      if (socket) {
        socket.emit('mark_read', {
          message_id: messageId,
          reader_id: userId
        });
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      toast.error(error?.response?.data?.message || 'Failed to mark message as read');
    }
  }, [socket, userId]);

  const getUnreadCount = useCallback(() => {
    return messages.filter(msg => !msg.isRead && msg.recipientId === userId).length;
  }, [messages, userId]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('new_message', async (messageData: MessageResponse) => {
      const newMessage = transformMessageResponse(messageData);
      
      // Update messages if we're in the relevant conversation
      setMessages(prev => {
        const isRelevantConversation = prev.some(msg => 
          msg.senderId === newMessage.senderId || msg.senderId === newMessage.recipientId ||
          msg.recipientId === newMessage.senderId || msg.recipientId === newMessage.recipientId
        );
        return isRelevantConversation ? [...prev, newMessage] : prev;
      });

      // Immediately fetch updated conversations to reflect new message
      await fetchConversations();

      if (newMessage.recipientId === userId) {
        const sender = conversations.find(c => c.id === newMessage.senderId);
        toast.info(`New message from ${sender?.name || 'someone'}`, {
          action: {
            label: 'View',
            onClick: () => fetchMessages(newMessage.senderId),
          },
        });
      }
    });

    // Listen for message read acknowledgements
    socket.on('message_read', ({ messageId }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    return () => {
      socket.off('new_message');
      socket.off('message_read');
    };
  }, [socket, userId]);

  const createConversation = useCallback(async (targetUserId: string) => {
    try {
      console.log('Creating conversation with target user:', targetUserId);
      setIsLoading(true);
      
      // First check if a conversation already exists
      const existingConversation = conversations.find(conv => 
        String(conv.id) === String(targetUserId)
      );
      
      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation);
        return existingConversation;
      }

      // If no existing conversation, create a new one
      console.log('No existing conversation found, creating new one');
      const response = await api.post<Conversation>('/messages/conversations', { 
        userId: targetUserId 
      });
      
      const newConversation = response.data;
      console.log('Created new conversation:', newConversation);
      
      // Update conversations list with the new conversation
      setConversations(prev => {
        // Avoid duplicates
        const exists = prev.some(c => c.id === newConversation.id);
        if (!exists) {
          return [...prev, newConversation];
        }
        return prev;
      });
      
      return newConversation;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast.error(error?.response?.data?.message || 'Failed to create conversation');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [conversations]);

  return {
    messages,
    conversations,
    isLoading,
    fetchMessages,
    fetchConversations,
    sendMessage,
    markAsRead,
    getUnreadCount,
    createConversation
  };
}