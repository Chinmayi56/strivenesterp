import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/Toast";
import { SuperAdminRoutes } from "./routes/AppRoutes";
import "./styles/index.css";

export const SuperAdminApp: React.FC<{ basename?: string }> = ({ basename }) => {
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <ToastProvider>
          <SuperAdminRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default SuperAdminApp;
