import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { AppSidebar } from './AppSidebar';
import Navbar from './Navbar';

import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <NotificationsProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col h-screen w-full">
            <Navbar />
            <main className="flex-1 overflow-y-auto pt-8 bg-[#f7f8fa] dark:bg-gray-900">
              <div className="px-4 sm:px-8">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </NotificationsProvider>
    </SidebarProvider>
  );
};

export default DashboardLayout;
