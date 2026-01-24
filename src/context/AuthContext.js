import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // Restore auth on page refresh
  // --------------------------------------------------
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    axios
      .get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, {
      email,
      password,
    });

    const token = res.data.token;

    localStorage.setItem("token", token);
    setToken(token);

    const me = await axios.get(`${API}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setUser(me.data);
  };

  // --------------------------------------------------
  // SIGNUP  ✅ (THIS WAS MISSING)
  // --------------------------------------------------
  const signup = async (name, email, password) => {
    await axios.post(`${API}/auth/signup`, {
      name,
      email,
      password,
    });
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
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
