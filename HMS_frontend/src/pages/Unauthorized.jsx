import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaShieldAlt, FaHome, FaSignOutAlt } from "react-icons/fa";

const Unauthorized = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Direct user to their correct authorized dashboard
    if (user.role === "ADMIN") navigate("/admin");
    else if (user.role === "DOCTOR") navigate("/doctor");
    else if (user.role === "PATIENT") navigate("/patient");
    else navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Backdrops */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-red-100/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Shield icon with custom ping glow */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-50 text-red-500 border border-red-200 rounded-2xl flex items-center justify-center text-4xl shadow-md animate-pulse-subtle">
            <FaShieldAlt />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold font-heading text-slate-800 tracking-tight mb-2">
          Access <span className="text-red-600">Denied</span>
        </h1>
        
        <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
          Your credentials do not grant authorization to view this secure medical zone. If you believe this is an error, please coordinate with system administration.
        </p>

        {/* Action Panel */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <button
            onClick={handleGoHome}
            className="w-full glass-button-primary flex items-center justify-center space-x-2"
          >
            <FaHome />
            <span>Return to Dashboard</span>
          </button>
          
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center justify-center space-x-2 text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors mt-2 cursor-pointer"
          >
            <FaSignOutAlt className="text-[10px]" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
