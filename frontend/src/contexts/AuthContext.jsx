import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  getCurrentUser,
} from '../services/api';
import { unwrap } from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sentinelx_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await getCurrentUser();
        const data = unwrap(res);
        setUser(data.user);
      } catch {
        localStorage.removeItem('sentinelx_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = useCallback(async (credentials) => {
    try {
      const res = await apiLogin(credentials);
      const { token: newToken, user: userData } = unwrap(res);

      localStorage.setItem('sentinelx_token', newToken);

      setToken(newToken);
      setUser(userData);

      toast.success(`Welcome back, ${userData?.username || 'Agent'}!`);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';

      toast.error(message);

      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const res = await apiRegister(userData);

      const { token: newToken, user: newUser } = unwrap(res);

      localStorage.setItem('sentinelx_token', newToken);

      setToken(newToken);
      setUser(newUser);

      toast.success('Account created successfully!');

      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed';

      toast.error(message);

      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sentinelx_token');

    setToken(null);
    setUser(null);

    toast.success('Logged out successfully');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getCurrentUser();
      const data = unwrap(res);
      setUser(data.user);
    } catch {
      localStorage.removeItem('sentinelx_token');
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}

export default AuthContext;