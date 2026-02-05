import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'message' | 'project';
  time: Date;
  read: boolean;
  entityId?: string;  // ID of the related entity (project, message, etc.)
  entityType?: string; // Type of the related entity
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  // Helper to format time difference
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    
    return 'Just now';
  };

  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      time: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Get formatted notifications with relative time
  const getFormattedNotifications = () => {
    return notifications.map(notification => ({
      ...notification,
      formattedTime: getTimeAgo(notification.time)
    }));
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    // Example: Subscribe to various events that should trigger notifications
    const events = [
      { type: 'project_update', handler: (data: any) => {
        addNotification({
          title: 'Project Update',
          message: `Project "${data.name}" has been updated`,
          type: 'project',
          entityId: data.id,
          entityType: 'project'
        });
      }},
      { type: 'new_message', handler: (data: any) => {
        addNotification({
          title: 'New Message',
          message: `New message from ${data.sender}`,
          type: 'message',
          entityId: data.conversationId,
          entityType: 'message'
        });
      }},
      { type: 'retailer_status', handler: (data: any) => {
        addNotification({
          title: 'Retailer Status Change',
          message: `Retailer "${data.name}" status changed to ${data.status}`,
          type: data.status === 'active' ? 'success' : 'warning',
          entityId: data.id,
          entityType: 'retailer'
        });
      }}
    ];

    // TODO: Implement real-time event subscription
    // This is where you would connect to your WebSocket or real-time API
    // For now, we'll just add some example notifications
    
    const cleanup = () => {
      // Cleanup subscriptions
    };

    return cleanup;
  }, [user]);

  return {
    notifications: getFormattedNotifications(),
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length
  };
}