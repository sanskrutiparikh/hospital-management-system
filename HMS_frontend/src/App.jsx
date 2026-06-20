import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// General Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";

// Admin Dashboard Components
import AdminOverview from "./pages/admin/Overview";
import ManagePatients from "./pages/admin/ManagePatients";
import ManageDoctors from "./pages/admin/ManageDoctors";
import AdminBilling from "./pages/admin/Billing";

// Doctor Dashboard Components
import DoctorDashboard from "./pages/doctor/DoctorDashboard";

// Patient Dashboard Components
import PatientDashboard from "./pages/patient/PatientDashboard";

// AI Dashboard Components
import AIAssistant from "./pages/AIAssistant";
import AIReportAnalysis from "./pages/AIReportAnalysis";
import AIInsights from "./pages/AIInsights";

// Dynamic Home redirector checking active roles
const HomeRedirector = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route securely based on user role
  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  } else if (user.role === "DOCTOR") {
    return <Navigate to="/doctor" replace />;
  } else if (user.role === "PATIENT") {
    return <Navigate to="/patient" replace />;
  }

  return <Navigate to="/unauthorized" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Root Redirector */}
          <Route path="/" element={<HomeRedirector />} />

          {/* Secure Admin Section */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Layout>
                  <AdminOverview />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/patients"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Layout>
                  <ManagePatients />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Layout>
                  <ManageDoctors />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/billing"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Layout>
                  <AdminBilling />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Secure Doctor Section */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR"]}>
                <Layout>
                  <DoctorDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR"]}>
                <Layout>
                  <DoctorDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR"]}>
                <Layout>
                  <DoctorDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Secure Patient Section */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={["PATIENT"]}>
                <Layout>
                  <PatientDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/records"
            element={
              <ProtectedRoute allowedRoles={["PATIENT"]}>
                <Layout>
                  <PatientDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={["PATIENT"]}>
                <Layout>
                  <PatientDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/billing"
            element={
              <ProtectedRoute allowedRoles={["PATIENT"]}>
                <Layout>
                  <PatientDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Secure AI Section */}
          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "DOCTOR", "PATIENT"]}>
                <Layout>
                  <AIAssistant />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-report-analysis"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "DOCTOR"]}>
                <Layout>
                  <AIReportAnalysis />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-insights"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Layout>
                  <AIInsights />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;