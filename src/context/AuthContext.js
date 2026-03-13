import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { apiClient } from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => window.localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const validateSession = useCallback(
    async ({ logoutOn401 = true } = {}) => {
      if (!window.localStorage.getItem("token")) {
        if (logoutOn401) {
          clearSession();
        }
        return false;
      }

      try {
        const res = await apiClient.get("/auth/me");
        setUser(res.data);
        window.localStorage.setItem("user", JSON.stringify(res.data));
        return true;
      } catch (err) {
        if (logoutOn401 && (err.response?.status === 401 || err.response?.status === 403)) {
          clearSession();
        }
        return false;
      }
    },
    [clearSession],
  );

  useEffect(() => {
    const storedUser = window.localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        window.localStorage.removeItem("user");
      }
    }

    if (!token) {
      setLoading(false);
      return;
    }

    validateSession({ logoutOn401: true }).finally(() => {
      setLoading(false);
    });
  }, [token, validateSession]);

  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(() => {
      validateSession();
    }, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [token, validateSession]);

  const login = async (email, password) => {
    const res = await apiClient.post("/auth/login", {
      email,
      password,
    });

    const nextToken = res.data?.token;
    if (!nextToken) {
      throw new Error("Login succeeded but token was missing");
    }

    window.localStorage.setItem("token", nextToken);
    setToken(nextToken);

    const isValid = await validateSession({ logoutOn401: false });
    if (!isValid) {
      clearSession();
      throw new Error("Session validation failed");
    }
  };

  const signup = async (name, email, password) => {
    const res = await apiClient.post("/auth/signup", {
      name,
      email,
      password,
    });

    const nextToken = res.data?.token;
    const nextUser = res.data?.user;
    if (!nextToken || !nextUser) {
      throw new Error("Signup succeeded but auth payload was missing");
    }

    window.localStorage.setItem("token", nextToken);
    window.localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Best-effort cookie cleanup only.
    } finally {
      clearSession();
    }
  }, [clearSession]);

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
