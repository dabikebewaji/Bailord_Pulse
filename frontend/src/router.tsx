import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import RetailerRegister from './pages/RetailerRegister';
import Dashboard from './pages/Dashboard';
import Retailers from './pages/Retailers';
import RetailerProfile from './pages/RetailerProfile';
import Projects from './pages/Projects';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
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
            index: true,
            element: <Register />
          },
          {
            path: 'retailer',
            element: <RetailerRegister />
          }
        ]
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
            path: 'projects',
            element: <Projects />
          },
          {
            path: 'messages',
            element: <Messages />
          },
          {
            path: 'analytics',
            element: <Analytics />
          },
          {
            path: 'settings',
            element: <Settings />
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