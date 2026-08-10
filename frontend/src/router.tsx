import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminOnlyRoute } from '@/components/AdminOnlyRoute';
import DashboardLayout from '@/components/DashboardLayout';
import Login from './pages/Login';
import RetailerRegister from './pages/RetailerRegister';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';
import Retailers from './pages/Retailers';
import RetailerProfile from './pages/RetailerProfile';
import Projects from './pages/Projects';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import AdminCreateUser from './pages/AdminCreateUser';
import NotFound from './pages/NotFound';

import { RootLayout } from '@/layouts/RootLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Enable future flags - includes all v7 flags to prevent warnings
const FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_prependBasename: true,
  v7_normalizeFormMethod: true
};

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          index: true,
          element: <Login />
        },
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'register',
        children: [
          {
            path: 'retailer',
            element: <RetailerRegister />
          }
        ]
      },
      {
        path: 'verify-otp',
        element: <VerifyOtp />
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              {
                path: 'dashboard',
                element: <Dashboard />
              },
          {
            element: <AdminOnlyRoute />,
            children: [
              {
                path: 'retailers',
                children: [
                  {
                    index: true,
                    element: <Retailers />
                  },
                  {
                    path: ':id',
                    element: <RetailerProfile />
                  }
                ]
              },
              {
                path: 'analytics',
                element: <Analytics />
              },
              {
                path: 'products',
                element: <Products />
              },
              {
                path: 'orders',
                element: <Orders />
              },
            ]
          },
          {
            path: 'projects',
            element: <Projects />
          },
          {
            path: 'messages',
            element: <Messages />
          },
          {
            path: 'settings',
            element: <Settings />
          },
          {
            path: 'admin/users',
            element: <AdminCreateUser />
          }
          ]
        }
        ]
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
], {
  future: FUTURE_FLAGS
});