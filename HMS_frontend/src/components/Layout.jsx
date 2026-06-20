import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FaHeartbeat, FaHome, FaUserInjured, FaUserMd, 
  FaFileInvoiceDollar, FaSignOutAlt, FaCalendarCheck, 
  FaFileMedical, FaUserCircle, FaBars, FaRobot, FaBrain, FaChartBar
} from "react-icons/fa";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Define navigation links based on user roles
  const getNavLinks = () => {
    switch (user.role) {
      case "ADMIN":
        return [
          { path: "/admin", name: "Overview", icon: <FaHome /> },
          { path: "/admin/patients", name: "Manage Patients", icon: <FaUserInjured /> },
          { path: "/admin/doctors", name: "Manage Doctors", icon: <FaUserMd /> },
          { path: "/admin/billing", name: "Billing & Revenue", icon: <FaFileInvoiceDollar /> },
          { path: "/ai-assistant", name: "AI Assistant", icon: <FaRobot /> },
          { path: "/ai-report-analysis", name: "AI Report Analysis", icon: <FaBrain /> },
          { path: "/ai-insights", name: "AI Insights", icon: <FaChartBar /> },
        ];
      case "DOCTOR":
        return [
          { path: "/doctor", name: "Overview", icon: <FaHome /> },
          { path: "/doctor/patients", name: "Assigned Patients", icon: <FaUserInjured /> },
          { path: "/doctor/appointments", name: "Appointments", icon: <FaCalendarCheck /> },
          { path: "/ai-assistant", name: "AI Assistant", icon: <FaRobot /> },
          { path: "/ai-report-analysis", name: "AI Report Analysis", icon: <FaBrain /> },
        ];
      case "PATIENT":
        return [
          { path: "/patient", name: "Overview", icon: <FaHome /> },
          { path: "/patient/records", name: "My Records", icon: <FaFileMedical /> },
          { path: "/patient/appointments", name: "Appointments", icon: <FaCalendarCheck /> },
          { path: "/patient/billing", name: "Billing Portal", icon: <FaFileInvoiceDollar /> },
          { path: "/ai-assistant", name: "AI Assistant", icon: <FaRobot /> },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-50 text-red-700 border-red-200";
      case "DOCTOR":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PATIENT":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden text-slate-850">
      {/* Subtle healthcare background patterns */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 1. Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-slate-200/80 flex flex-col z-20 shrink-0 shadow-sm">
        {/* Brand/Header */}
        <div className="p-6 border-b border-slate-200/80 flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/10">
            <FaHeartbeat className="text-white text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-900 tracking-wide leading-none">
              Med<span className="text-blue-600">Pulse</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
              Management
            </span>
          </div>
        </div>

        {/* User Mini Profile */}
        <div className="p-6 border-b border-slate-200/40 bg-slate-50/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <FaUserCircle className="text-3xl" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-slate-800 truncate">{user.name}</h4>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 mt-1 border rounded-full uppercase ${getRoleBadgeStyle(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <span className={`text-lg transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`}>
                  {link.icon}
                </span>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-200/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-200 cursor-pointer"
          >
            <FaSignOutAlt className="text-lg" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header/Navbar */}
        <header className="h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 z-10 shadow-sm">
          {/* Left: Breadcrumbs / Title */}
          <div>
            <h1 className="text-lg font-bold font-heading text-slate-800 m-0 leading-none">
              Welcome back, <span className="text-blue-600 font-extrabold">{user.name.split(" ")[0]}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              MedPulse Portal is synchronized and online.
            </p>
          </div>

          {/* Right: Actions / Info */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400 font-medium font-sans">Server Status</p>
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end space-x-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Port 9090 (Gateway)</span>
              </p>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
