import { createContext, useContext, useState, useEffect } from 'react';
import apiFetch from '../utils/apiFetch';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gymfit_token');
    const saved = localStorage.getItem('gymfit_user');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        clearStorage();
      }
    }
    setLoading(false);
  }, []);

  const clearStorage = () => {
    localStorage.removeItem('gymfit_token');
    localStorage.removeItem('gymfit_user');
  };

  const saveSession = (token, userData) => {
    localStorage.setItem('gymfit_token', token);
    localStorage.setItem('gymfit_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveSession(data.token, data.user);
    return data;
  };

  const adminLogin = async (email, password) => {
    const data = await apiFetch('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveSession(data.token, data.user);
    return data;
  };

  const logout = () => {
    clearStorage();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('gymfit_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        adminLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
