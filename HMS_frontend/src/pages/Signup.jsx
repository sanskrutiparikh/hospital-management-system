import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../services/api";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaHeartbeat, FaSpinner, FaUserTag, FaCheckCircle } from "react-icons/fa";

const Signup = () => {
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PATIENT");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await signupUser({ name, email, password, role });
      setSuccess("Account created successfully! Redirecting to login...");
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Signup failed:", err);
      let errMsg = "Failed to register. Please check details or verify if the email is already in use.";
      if (err.response) {
        const data = err.response.data;
        if (typeof data === "string") {
          errMsg = data;
        } else if (data && typeof data === "object") {
          if (data.validationErrors) {
            errMsg = Object.entries(data.validationErrors)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join(", ");
          } else if (data.message) {
            errMsg = data.message;
          } else if (data.detail) {
            errMsg = data.detail;
          } else if (data.error) {
            errMsg = data.error;
          }
        }
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background gradients */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md my-8">
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

        {/* Signup Container */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-100/60 relative">
          <h2 className="text-2xl font-bold text-slate-800 mb-2 font-heading">Get Started</h2>
          <p className="text-slate-500 text-sm mb-6">Create your medical portal account</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start">
              <span className="font-semibold mr-1">Error:</span> {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm flex items-center space-x-2">
              <FaCheckCircle className="text-emerald-500 text-lg flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <FaUser />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full pl-11"
                  placeholder="John Doe"
                  disabled={loading || success}
                />
              </div>
            </div>

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
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
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
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={loading || success}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Role Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Account Type / Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 z-10">
                  <FaUserTag />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="glass-input w-full pl-11 appearance-none cursor-pointer bg-white pr-10 text-slate-800"
                  disabled={loading || success}
                >
                  <option value="PATIENT" className="text-slate-800">Patient</option>
                  <option value="DOCTOR" className="text-slate-800">Doctor</option>
                  <option value="ADMIN" className="text-slate-800">Administrator</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                  <span className="text-xs">▼</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="glass-button-primary w-full flex items-center justify-center space-x-2 mt-4"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin text-lg" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center text-slate-500 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
