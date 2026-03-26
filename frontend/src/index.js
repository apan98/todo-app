import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import setupAxiosInterceptors from "./services/axiosInterceptor";

const AppWrapper = () => {
  const { logout } = useAuth();
  setupAxiosInterceptors(logout);

  return <App />;
};

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
