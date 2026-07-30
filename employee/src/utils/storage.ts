const ACCESS_TOKEN_KEY = "strivenest_employee_access_token";
const REFRESH_TOKEN_KEY = "strivenest_employee_refresh_token";
const REMEMBER_ME_KEY = "strivenest_employee_remember_me";

export const getStoredTokens = (): { accessToken: string | null; refreshToken: string | null } => {
  const remember = localStorage.getItem(REMEMBER_ME_KEY) === "true";
  const storage = remember ? localStorage : sessionStorage;

  const accessToken = storage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);

  return { accessToken, refreshToken };
};

export const setStoredTokens = (accessToken: string, refreshToken: string, rememberMe: boolean = false): void => {
  localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "true" : "false");
  const storage = rememberMe ? localStorage : sessionStorage;

  const altStorage = rememberMe ? sessionStorage : localStorage;
  altStorage.removeItem(ACCESS_TOKEN_KEY);
  altStorage.removeItem(REFRESH_TOKEN_KEY);

  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearStoredTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};
