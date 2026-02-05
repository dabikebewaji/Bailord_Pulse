export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'retailer';
  phone?: string;
  company?: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserSettings {
  notifications: {
    emailNotifications: boolean;
    projectUpdates: boolean;
    messageAlerts: boolean;
    weeklyReports: boolean;
  };
  preferences: {
    compactView: boolean;
    autoSave: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
}