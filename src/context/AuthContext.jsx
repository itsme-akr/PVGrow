/** @jsxImportSource @emotion/react */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // TEMPORARY MOCK AUTH
  useEffect(() => {
    setUser({
      id: 1,
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'admin',
    });

    setToken('mock-token');

    apiClient.defaults.headers.common.Authorization = `Bearer mock-token`;

    setLoading(false);
  }, []);

  // TEMPORARY LOGIN
  const login = async () => {
    setUser({
      id: 1,
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'admin',
    });

    setToken('mock-token');

    apiClient.defaults.headers.common.Authorization = `Bearer mock-token`;
  };

  // TEMPORARY LOGOUT
  const handleLogout = () => {
    setUser(null);
    setToken(null);

    delete apiClient.defaults.headers.common.Authorization;

    setLoading(false);

    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);