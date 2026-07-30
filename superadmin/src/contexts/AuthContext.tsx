import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, UserRole } from "../types/user";
import { AuthState, LoginCredentials } from "../types/auth";
import { authService } from "../services/authService";
import { getStoredTokens, setStoredTokens, clearStoredTokens } from "../utils/storage";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenState, setRefreshTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const role: UserRole | null = user?.role || null;
  const authenticated = Boolean(user && accessToken);

  const initAuthSession = useCallback(async () => {
    const { accessToken: storedAccess, refreshToken: storedRefresh } = getStoredTokens();
    if (!storedAccess) {
      setLoading(false);
      return;
    }

    setAccessToken(storedAccess);
    setRefreshTokenState(storedRefresh);

    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.warn("Session restore failed, attempting token refresh...");
      if (storedRefresh) {
        try {
          const newTokens = await authService.refreshToken(storedRefresh);
          setStoredTokens(
            newTokens.access_token,
            newTokens.refresh_token,
            localStorage.getItem("strivenest_superadmin_remember_me") === "true"
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
    initAuthSession();

    const handleUnauthorized = () => {
      clearStoredTokens();
      setUser(null);
      setAccessToken(null);
      setRefreshTokenState(null);
    };

    window.addEventListener("strivenest:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("strivenest:unauthorized", handleUnauthorized);
    };
  }, [initAuthSession]);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const tokenData = await authService.login(credentials);
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
        await authService.logout(storedRefresh);
      } catch (err) {
        console.error("Logout request failed on server:", err);
      }
    }
    clearStoredTokens();
    setUser(null);
    setAccessToken(null);
    setRefreshTokenState(null);
  };

  const refresh = async () => {
    const { refreshToken: storedRefresh } = getStoredTokens();
    if (!storedRefresh) throw new Error("No refresh token available.");
    const tokenData = await authService.refreshToken(storedRefresh);
    setStoredTokens(
      tokenData.access_token,
      tokenData.refresh_token,
      localStorage.getItem("strivenest_superadmin_remember_me") === "true"
    );
    setAccessToken(tokenData.access_token);
    setRefreshTokenState(tokenData.refresh_token);
    setUser(tokenData.user);
  };

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
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
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
