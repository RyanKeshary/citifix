import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (userData) => {
    if (!userData) {
      return null;
    }

    return {
      ...userData,
      role: String(userData.role || 'citizen').toLowerCase(),
    };
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('citifix_user');
    if (storedUser) {
      setUser(normalizeUser(JSON.parse(storedUser)));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
    localStorage.setItem('citifix_user', JSON.stringify(normalizedUser));

    if (token) {
      localStorage.setItem('citifix_token', token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('citifix_user');
    localStorage.removeItem('citifix_token');
  };

  const updateUser = (updates) => {
    const updatedUser = normalizeUser({ ...user, ...updates });
    setUser(updatedUser);
    localStorage.setItem('citifix_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};