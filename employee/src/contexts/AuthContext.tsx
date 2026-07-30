import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { EmployeeUser, EmployeeRole } from "../types/user";
import { EmployeeAuthState, EmployeeLoginCredentials } from "../types/auth";
import { employeeAuthService } from "../services/authService";
import { getStoredTokens, setStoredTokens, clearStoredTokens } from "../utils/storage";

interface EmployeeAuthContextType extends EmployeeAuthState {
  login: (credentials: EmployeeLoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getCurrentUser: () => Promise<EmployeeUser | null>;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined);

export const EmployeeAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<EmployeeUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenState, setRefreshTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const role: EmployeeRole | null = user?.role || null;
  const authenticated = Boolean(user && accessToken);

  const initSession = useCallback(async () => {
    const { accessToken: storedAccess, refreshToken: storedRefresh } = getStoredTokens();
    if (!storedAccess) {
      setLoading(false);
      return;
    }

    setAccessToken(storedAccess);
    setRefreshTokenState(storedRefresh);

    try {
      const userData = await employeeAuthService.getCurrentUser();
      setUser(userData);
    } catch {
      if (storedRefresh) {
        try {
          const newTokens = await employeeAuthService.refreshToken(storedRefresh);
          setStoredTokens(
            newTokens.access_token,
            newTokens.refresh_token,
            localStorage.getItem("strivenest_employee_remember_me") === "true"
          );
          setAccessToken(newTokens.access_token);
          setRefreshTokenState(newTokens.refresh_token);
          setUser(newTokens.user);
        } catch {
          clearStoredTokens();
          setUser(null);
          setAccessToken(null);
          setRefreshTokenState(null);
        }
      } else {
        clearStoredTokens();
        setUser(null);
        setAccessToken(null);
        setRefreshTokenState(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();

    const handleUnauthorized = () => {
      clearStoredTokens();
      setUser(null);
      setAccessToken(null);
      setRefreshTokenState(null);
    };

    window.addEventListener("strivenest:employee_unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("strivenest:employee_unauthorized", handleUnauthorized);
    };
  }, [initSession]);

  const login = async (credentials: EmployeeLoginCredentials) => {
    setLoading(true);
    try {
      const tokenData = await employeeAuthService.login(credentials);
      setStoredTokens(
        tokenData.access_token,
        tokenData.refresh_token,
        credentials.remember_me || false
      );
      setAccessToken(tokenData.access_token);
      setRefreshTokenState(tokenData.refresh_token);
      setUser(tokenData.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const { refreshToken: storedRefresh } = getStoredTokens();
    if (storedRefresh) {
      try {
        await employeeAuthService.logout(storedRefresh);
      } catch (err) {
        console.error("Employee logout error:", err);
      }
    }
    clearStoredTokens();
    setUser(null);
    setAccessToken(null);
    setRefreshTokenState(null);
  };

  const refresh = async () => {
    const { refreshToken: storedRefresh } = getStoredTokens();
    if (!storedRefresh) throw new Error("No refresh token stored.");
    const tokenData = await employeeAuthService.refreshToken(storedRefresh);
    setStoredTokens(
      tokenData.access_token,
      tokenData.refresh_token,
      localStorage.getItem("strivenest_employee_remember_me") === "true"
    );
    setAccessToken(tokenData.access_token);
    setRefreshTokenState(tokenData.refresh_token);
    setUser(tokenData.user);
  };

  const getCurrentUser = async (): Promise<EmployeeUser | null> => {
    try {
      const userData = await employeeAuthService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch {
      return null;
    }
  };

  return (
    <EmployeeAuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken: refreshTokenState,
        role,
        loading,
        authenticated,
        login,
        logout,
        refresh,
        getCurrentUser,
      }}
    >
      {children}
    </EmployeeAuthContext.Provider>
  );
};

export const AuthContext = EmployeeAuthContext;
export const AuthProvider = EmployeeAuthProvider;

export const useEmployeeAuth = () => {
  const context = useContext(EmployeeAuthContext);

  if (!context) {
    throw new Error("useEmployeeAuth must be used within EmployeeAuthProvider");
  }

  return context;
};

export const useAuthContext = useEmployeeAuth;