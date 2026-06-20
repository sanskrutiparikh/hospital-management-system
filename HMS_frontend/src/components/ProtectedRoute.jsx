import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute w-[300px] h-[300px] bg-indigo-100/30 rounded-full blur-[80px] animate-pulse delay-700"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Double ring loading spinner */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-blue-200/40 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-indigo-200/30 rounded-full"></div>
            <div className="absolute inset-2 border-4 border-indigo-400 border-b-transparent rounded-full animate-spin [animation-duration:1.5s]"></div>
          </div>
          
          <h2 className="text-xl font-medium font-heading tracking-wide mt-6 text-blue-700 animate-pulse">
            Securing Session...
          </h2>
          <p className="text-sm text-slate-400 mt-2">Connecting to Hospital Services</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated users to login and record the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect users to unauthorized page if their role doesn't match
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
