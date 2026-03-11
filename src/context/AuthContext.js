import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";

import { API } from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const validateSession = useCallback(
    async (activeToken, { logoutOn401 = true } = {}) => {
      try {
        const res = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
        return true;
      } catch (err) {
        if (logoutOn401 && (err.response?.status === 401 || err.response?.status === 403)) {
          logout();
        }
        return false;
      }
    },
    [logout],
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    // Instant restore to avoid dashboard flicker while we validate in background.
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    validateSession(storedToken).finally(() => {
      setLoading(false);
    });
  }, [validateSession]);

  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(() => {
      validateSession(token);
    }, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [token, validateSession]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, {
      email,
      password,
    });

    const nextToken = res.data.token;
    localStorage.setItem("token", nextToken);
    setToken(nextToken);

    const isValid = await validateSession(nextToken, { logoutOn401: false });
    if (!isValid) {
      logout();
      throw new Error("Session validation failed");
    }
  };

  const signup = async (name, email, password) => {
    const res = await axios.post(`${API}/auth/signup`, {
      name,
      email,
      password,
    });

    const nextToken = res.data?.token;
    const nextUser = res.data?.user;
    if (!nextToken || !nextUser) {
      throw new Error("Signup succeeded but auth payload was missing");
    }

    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
