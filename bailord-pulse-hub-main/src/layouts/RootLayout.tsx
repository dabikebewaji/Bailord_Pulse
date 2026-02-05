import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationsProvider } from '@/context/NotificationsContext';

export const RootLayout = () => {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Outlet />
      </NotificationsProvider>
    </AuthProvider>
  );
};