import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/api";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaHeartbeat, FaSpinner } from "react-icons/fa";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser({ email, password });
      if (data && data.token) {
        const userRole = login(data.token);
        
        // Handle Remember Me if needed
        if (rememberMe) {
          localStorage.setItem("hms_remember_email", email);
        } else {
          localStorage.removeItem("hms_remember_email");
        }

        // Redirect to intended route, or fall back to dashboard routing
        if (from) {
          navigate(from, { replace: true });
        } else {
          // Dynamic dashboard routing based on role
          if (userRole === "ADMIN") navigate("/admin");
          else if (userRole === "DOCTOR") navigate("/doctor");
          else if (userRole === "PATIENT") navigate("/patient");
          else navigate("/unauthorized");
        }
      } else {
        setError("Invalid credentials returned from authentication service.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        err.response?.data?.message || 
        err.response?.data || 
        "Authentication failed. Please verify your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill email if remember me was previously checked
  React.useEffect(() => {
    const savedEmail = localStorage.getItem("hms_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle healthcare background patterns */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse-subtle">
            <FaHeartbeat className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-extrabold font-heading tracking-tight mt-4 text-slate-900">
            Med<span className="text-blue-600">Pulse</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Hospital Management System</p>
        </div>

        {/* Login Container */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-100/60 relative">
          <h2 className="text-2xl font-bold text-slate-800 mb-2 font-heading">Welcome Back</h2>
          <p className="text-slate-500 text-sm mb-6">Sign in to access your secure health dashboard</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start">
              <span className="font-semibold mr-1">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-11"
                  placeholder="name@hospital.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <FaLock />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-11 pr-11"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Please coordinate with System Administration to reset your security credentials.");
                }}
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="glass-button-primary w-full flex items-center justify-center space-x-2 mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin text-lg" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-8 text-center text-slate-500 text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
