import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// Zero-dependency utility function to decode JWT claims securely
const decodeJWT = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT token:", error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("hms_token");
      if (token) {
        const decoded = decodeJWT(token);
        if (decoded) {
          // Check expiration
          const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
          if (!isExpired) {
            setUser({
              email: decoded.sub, // 'sub' field holds the email
              role: decoded.role, // 'role' field holds the user's role
              name: decoded.name || decoded.sub.split("@")[0], // Fallback if name is empty
              token: token,
            });
          } else {
            console.warn("JWT token has expired");
            localStorage.removeItem("hms_token");
          }
        } else {
          localStorage.removeItem("hms_token");
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (token) => {
    localStorage.setItem("hms_token", token);
    const decoded = decodeJWT(token);
    if (decoded) {
      setUser({
        email: decoded.sub,
        role: decoded.role,
        name: decoded.name || decoded.sub.split("@")[0],
        token: token,
      });
      return decoded.role; // Return role to allow dynamic dashboard routing
    }
    return null;
  };

  const logout = () => {
    localStorage.removeItem("hms_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
