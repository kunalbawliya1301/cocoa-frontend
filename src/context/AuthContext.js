import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { apiClient } from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  const validateSession = useCallback(
    async ({ logoutOn401 = true } = {}) => {
      try {
        const res = await apiClient.get("/auth/me");
        setUser(res.data);
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
    validateSession({ logoutOn401: false }).finally(() => {
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
    await apiClient.post("/auth/login", {
      email,
      password,
    });

    const isValid = await validateSession({ logoutOn401: false });
    if (!isValid) {
      clearSession();
      throw new Error("Session validation failed");
    }
  };

  const signup = async (name, email, password) => {
    await apiClient.post("/auth/signup", {
      name,
      email,
      password,
    });

    const isValid = await validateSession({ logoutOn401: false });
    if (!isValid) {
      clearSession();
      throw new Error("Session validation failed");
    }
  };

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Clear local auth state even if the server cookie was already missing.
    } finally {
      clearSession();
    }
  }, [clearSession]);

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
