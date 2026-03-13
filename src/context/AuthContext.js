import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { apiClient } from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  const clearServerSession = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Best-effort cleanup for stale or invalid cookies.
    }
  }, []);

  const validateSession = useCallback(
    async ({ logoutOn401 = true, cleanupInvalidCookie = false } = {}) => {
      try {
        const res = await apiClient.get("/auth/me");
        setUser(res.data);
        return true;
      } catch (err) {
        if (logoutOn401 && (err.response?.status === 401 || err.response?.status === 403)) {
          clearSession();
        }
        if (cleanupInvalidCookie && (err.response?.status === 401 || err.response?.status === 403)) {
          await clearServerSession();
        }
        return false;
      }
    },
    [clearServerSession, clearSession],
  );

  useEffect(() => {
    validateSession({ logoutOn401: false, cleanupInvalidCookie: true }).finally(() => {
      setLoading(false);
    });
  }, [validateSession]);

  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      validateSession();
    }, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user, validateSession]);

  const login = async (email, password) => {
    try {
      await apiClient.post("/auth/login", {
        email,
        password,
      });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        await clearServerSession();
        clearSession();
      }
      throw err;
    }

    const isValid = await validateSession({ logoutOn401: false, cleanupInvalidCookie: true });
    if (!isValid) {
      await clearServerSession();
      clearSession();
      throw new Error("Session validation failed");
    }
  };

  const signup = async (name, email, password) => {
    try {
      await apiClient.post("/auth/signup", {
        name,
        email,
        password,
      });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        await clearServerSession();
        clearSession();
      }
      throw err;
    }

    const isValid = await validateSession({ logoutOn401: false, cleanupInvalidCookie: true });
    if (!isValid) {
      await clearServerSession();
      clearSession();
      throw new Error("Session validation failed");
    }
  };

  const logout = useCallback(async () => {
    try {
      await clearServerSession();
    } catch {
      // Clear local auth state even if the server cookie was already missing.
    } finally {
      clearSession();
    }
  }, [clearServerSession, clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
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
