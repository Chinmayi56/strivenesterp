import React from "react";
import { BrowserRouter } from "react-router-dom";
import { EmployeeAuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/Toast";
import { EmployeeRoutes } from "./routes/AppRoutes";
import "./styles/index.css";

export const EmployeeApp: React.FC<{ basename?: string }> = ({ basename }) => {
  return (
    <BrowserRouter basename={basename}>
      <EmployeeAuthProvider>
        <ToastProvider>
          <EmployeeRoutes />
        </ToastProvider>
      </EmployeeAuthProvider>
    </BrowserRouter>
  );
};

export default EmployeeApp;
