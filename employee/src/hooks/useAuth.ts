import { useEmployeeAuth } from "../contexts/AuthContext";

export const useAuth = () => {
  return useEmployeeAuth();
};
