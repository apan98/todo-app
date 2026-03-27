import React, { useState, createContext, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(response => {
          setUser(response.data);
          setLoading(false);
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const response = await axios.post('http://localhost:5000/api/auth/login', { username, password });
    setToken(response.data.token);
    localStorage.setItem('token', response.data.token);
  };

  const register = async (username, password) => {
    await axios.post('http://localhost:5000/api/auth/register', { username, password });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, api, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
