import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { SERVER_URL } from "../config/config";

interface AuthUser {
  id: number;
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("alumniGridUser");
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Error loading saved user:", err);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credential: string) => {
    try {
      const response = await axios.post(`${SERVER_URL}/auth/google`, {
        credential,
      });
      if (response.data.status === 200) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem("alumniGridUser", JSON.stringify(userData));
      }
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("alumniGridUser");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
