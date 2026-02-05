// Types for messages
export interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// Transform database response to frontend format
export const transformMessageResponse = (msg: MessageResponse): Message => ({
  id: msg.id,
  senderId: msg.sender_id,
  recipientId: msg.recipient_id,
  content: msg.content,
  isRead: msg.is_read,
  createdAt: msg.created_at,
  updatedAt: msg.updated_at,
});