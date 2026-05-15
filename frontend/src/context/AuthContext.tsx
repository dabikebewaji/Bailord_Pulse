import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'retailer';
}

interface RetailerData {
  type: 'retailer';
  businessName: string;
  phone: string;
  address: string;
  description: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, retailerData?: RetailerData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Flag to prevent multiple validations
    let isValidating = false;
    
    const validateSession = async () => {
      // If already validating or manual logout, skip
      if (isValidating || localStorage.getItem('bailord_user_logged_out')) return;
      
      const stored = localStorage.getItem('bailord_user');
      if (!stored) return;

      try {
        isValidating = true;
        const parsed = JSON.parse(stored);
        
        // Set initial user state from storage
        if (parsed.user) {
          setUser(parsed.user);
        }

        // If no valid tokens, clear everything
        if (!parsed.accessToken || !parsed.refreshToken) {
          localStorage.removeItem('bailord_user');
          setUser(null);
          return;
        }

        // Only validate profile if on a protected route
        const isProtectedRoute = !window.location.pathname.match(/^\/(login|register)$/);
        if (!isProtectedRoute) return;

        try {
          console.log('Fetching profile...');
          const response = await api.get('/auth/profile');
          console.log('Profile response:', response);
          const updatedUser = response.data;
          
          if (!updatedUser) {
            console.error('No user data in profile response');
            throw new Error('No user data returned from profile');
          }
          
          // Only update if there are actual changes
          if (JSON.stringify(updatedUser) !== JSON.stringify(parsed.user)) {
            console.log('Updating user profile...', updatedUser);
            setUser(updatedUser);
            localStorage.setItem('bailord_user', JSON.stringify({
              ...parsed,
              user: updatedUser
            }));
          }
        } catch (err: any) {
          console.error('Profile fetch error:', err);
          console.error('Response:', err?.response);
          if (err?.response?.status === 401) {
            console.warn('Session invalid:', err);
            localStorage.removeItem('bailord_user');
            setUser(null);
            
            // Only navigate if on a protected route
            if (isProtectedRoute) {
              navigate('/login', { replace: true });
            }
          }
        }
      } catch (err) {
        console.warn('Failed to parse stored user:', err);
        localStorage.removeItem('bailord_user');
        setUser(null);
      } finally {
        isValidating = false;
      }
    };

    validateSession();
    // Cleanup function to abort any ongoing validation when component unmounts
    return () => {
      isValidating = true; // Prevent any pending validation from completing
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      // First, clear any existing auth data
      localStorage.removeItem('bailord_user');
      setUser(null);

      console.log('Attempting login with:', { email });
      const res = await api.post('/auth/login', { email, password });
      console.log('Login response:', res);
      
      const { accessToken, refreshToken, user: returnedUser } = res.data;
      
      // Basic validation
      if (!accessToken || !refreshToken || !returnedUser) {
        throw new Error('Invalid response from server: missing required data');
      }
      
      // Store auth data
      localStorage.setItem('bailord_user', JSON.stringify({
        accessToken,
        refreshToken,
        user: returnedUser
      }));
      
      // Clear logout flag and update state
      localStorage.removeItem('bailord_user_logged_out');
      setUser(returnedUser);
      
      toast.success('Login successful!');
      navigate('/dashboard', { replace: true });

      // Store auth data
      const authData = { 
        accessToken,
        refreshToken,
        user: returnedUser 
      };
      localStorage.setItem('bailord_user', JSON.stringify(authData));
      // Remove any manual-logout flag so dev seeding may occur later if needed
      localStorage.removeItem('bailord_user_logged_out');      // Update state
      setUser(returnedUser);
      toast.success('Login successful!');
      
      // Use navigate for smoother transition
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Login failed';
      toast.error(msg);
      // Clear any partial auth data
      localStorage.removeItem('bailord_user');
      setUser(null);
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string, retailerData?: RetailerData) => {
    try {
      // First, clear any existing auth data
      localStorage.removeItem('bailord_user');
      setUser(null);

      const res = await api.post('/auth/register', { 
        name, 
        email, 
        password,
        ...retailerData 
      });
      
      const { accessToken, refreshToken } = res.data;
      if (!accessToken) throw new Error('No access token returned from register');
      if (!refreshToken) throw new Error('No refresh token returned from register');
      if (typeof accessToken !== 'string' || !accessToken.trim()) {
        throw new Error('Invalid access token format');
      }
      if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
        throw new Error('Invalid refresh token format');
      }

      // Store temporary tokens for profile fetch
      const tempAuthData = { accessToken, refreshToken };
      localStorage.setItem('bailord_user', JSON.stringify(tempAuthData));

      try {
        // Fetch user profile from protected endpoint
        const profileRes = await api.get('/auth/profile');
        const profileUser = profileRes.data;

        if (!profileUser) throw new Error('No profile data returned');

        // Store complete auth data
        const authData = { 
          accessToken, 
          refreshToken,
          user: profileUser 
        };
        localStorage.setItem('bailord_user', JSON.stringify(authData));
        setUser(profileUser);
  // Remove manual logout flag after successful register
  localStorage.removeItem('bailord_user_logged_out');
        
        toast.success('Registration successful!');
        navigate('/dashboard', { replace: true });
      } catch (profileErr) {
        // If profile fetch fails, clear everything
        localStorage.removeItem('bailord_user');
        setUser(null);
        throw new Error('Failed to fetch user profile');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Registration failed';
      toast.error(msg);
      // Clear any partial auth data
      localStorage.removeItem('bailord_user');
      setUser(null);
      throw err;
    }
  };

  const logout = async () => {
    try {
      // Invalidate tokens on server
      await api.post('/auth/invalidate');
    } catch (err) {
      console.warn('Failed to invalidate tokens:', err);
      // Continue with logout even if invalidation fails
    }

    setUser(null);
    localStorage.removeItem('bailord_user');
    // mark manual logout so dev seeding doesn't immediately re-create a session
    try { localStorage.setItem('bailord_user_logged_out', '1'); } catch (e) { /* ignore */ }
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const updateUser = async (updatedUser: User) => {
    try {
      console.log('Starting profile update with data:', updatedUser);

      // Get current auth data
      const stored = localStorage.getItem('bailord_user');
      if (!stored) {
        throw new Error('No authentication data found');
      }
      const authData = JSON.parse(stored);

      // First verify profile access still works
      console.log('Verifying profile access...');
      const profileCheck = await api.get('/auth/profile');
      
      if (!profileCheck.data) {
        throw new Error('Could not verify profile access');
      }

      // Prepare update data
      const updateData = {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role || profileCheck.data.role || 'staff'
      };
      console.log('Making profile update request with:', updateData);

      // Make the update request - try common verbs (PATCH, PUT, POST) because different
      // backends sometimes expose profile updates under different HTTP methods.
      let response;
      try {
        response = await api.patch('/auth/profile', updateData);
      } catch (errPatch: any) {
        // If endpoint not found, try PUT then POST before failing
        if (errPatch?.response?.status === 404) {
          try {
            response = await api.put('/auth/profile', updateData);
          } catch (errPut: any) {
            if (errPut?.response?.status === 404) {
              try {
                response = await api.post('/auth/profile', updateData);
              } catch (errPost: any) {
                // Rethrow the last error so outer catch handles it uniformly
                throw errPost;
              }
            } else {
              throw errPut;
            }
          }
        } else {
          throw errPatch;
        }
      }

      console.log('Profile update response:', response);

      // If we don't get proper user data back, construct it from our update
      const responseData = response.data && typeof response.data === 'object' && 'name' in response.data
        ? response.data
        : {
            ...profileCheck.data,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role || profileCheck.data.role || 'staff'
          };

      // Update the user in state and storage
      const updatedUserData = responseData;
      setUser(updatedUserData);
      
      // Update storage while preserving tokens
      localStorage.setItem('bailord_user', JSON.stringify({
        ...authData,
        user: updatedUserData
      }));

      toast.success('Profile updated successfully');
      return updatedUserData;
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      
      // Check for CORS error
      if (error.message === 'Network Error') {
        console.error('CORS Error - Backend needs to allow PATCH method');
        toast.error('Server configuration error - Please contact support');
        throw new Error('CORS configuration error');
      }
      
      // Handle 404 errors specifically
      if (error.response?.status === 404) {
        console.error('Endpoint not found - Backend API mismatch');
        toast.error('API endpoint not available - Please contact support');
        throw new Error('API endpoint not found');
      }

      // Log detailed error information
      console.error('Error details:', {
        response: error?.response?.data,
        status: error?.response?.status,
        message: error.message
      });
      
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || 'Failed to update profile';
      
      toast.error(errorMessage);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
