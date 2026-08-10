import api from './api';
import { UserSettings, ProfileUpdateData, PasswordChangeData } from '@/types/user';

export const userService = {
  // Update profile information
  updateProfile: async (data: ProfileUpdateData) => {
    const response = await api.patch('/users/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: PasswordChangeData) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  // Get user settings
  getSettings: async () => {
    const response = await api.get('/users/settings');
    return response.data;
  },

  // Update user settings
  updateSettings: async (settings: Partial<UserSettings>) => {
    const response = await api.patch('/users/settings', settings);
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences: {
    emailNotifications: boolean;
    projectUpdates: boolean;
    messageAlerts: boolean;
    weeklyReports: boolean;
  }) => {
    const response = await api.patch('/users/notification-preferences', preferences);
    return response.data;
  },

  // Update app preferences
  updateAppPreferences: async (preferences: {
    compactView: boolean;
    autoSave: boolean;
  }) => {
    const response = await api.patch('/users/app-preferences', preferences);
    return response.data;
  }
};