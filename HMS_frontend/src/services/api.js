import axios from "axios";

// Dynamic entry-point for all microservices via the API Gateway
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:9090`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically inject JWT token into the headers for all outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("hms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle global response errors (e.g. 401 unauthorized handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials on authentication failure
      localStorage.removeItem("hms_token");
      // Redirect to login if window is available
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// Authentication APIs (routed to auth-service)
// ==========================================

export const loginUser = async (credentials) => {
  const response = await apiClient.post("/auth/login", credentials);
  return response.data;
};

export const signupUser = async (userData) => {
  const response = await apiClient.post("/auth/signup", userData);
  return response.data;
};

// ==========================================
// Patient Service APIs (routed to patient-service)
// ==========================================

export const getPatientsMessage = async () => {
  const response = await apiClient.get("/patients");
  return "Patient Service Response : User Validated Successfully";
};

export const getPatients = async () => {
  const response = await apiClient.get("/patients");
  return response.data;
};

export const getPatient = async (patientId) => {
  const response = await apiClient.get(`/patients/${patientId}`);
  return response.data;
};

export const getPatientByEmail = async (email) => {
  const response = await apiClient.get(`/patients/email/${email}`);
  return response.data;
};

export const createPatient = async (patientData) => {
  const response = await apiClient.post("/patients", patientData);
  return response.data;
};

export const updatePatient = async (patientId, patientData) => {
  const response = await apiClient.put(`/patients/${patientId}`, patientData);
  return response.data;
};

export const deletePatient = async (patientId) => {
  const response = await apiClient.delete(`/patients/${patientId}`);
  return response.data;
};

// ==========================================
// Patient-Doctor Assignment APIs (routed to patient-service)
// ==========================================

export const assignDoctor = async (patientId, doctorId) => {
  const response = await apiClient.post("/patients/assignments", { patientId, doctorId });
  return response.data;
};

export const reassignDoctor = async (patientId, doctorId) => {
  const response = await apiClient.put("/patients/assignments", { patientId, doctorId });
  return response.data;
};

export const getDoctorAssignedToPatient = async (patientId) => {
  const response = await apiClient.get(`/patients/assignments/patient/${patientId}`);
  return response.data;
};

export const getPatientsAssignedToDoctor = async (doctorId) => {
  const response = await apiClient.get(`/patients/assignments/doctor/${doctorId}`);
  return response.data;
};

export const removeDoctorAssignment = async (patientId) => {
  const response = await apiClient.delete(`/patients/assignments/patient/${patientId}`);
  return response.data;
};

// ==========================================
// Doctor Service APIs (routed to doctor-service)
// ==========================================

export const getDoctors = async () => {
  const response = await apiClient.get("/doctors");
  return response.data;
};

export const getDoctor = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}`);
  return response.data;
};

export const getDoctorByEmail = async (email) => {
  const response = await apiClient.get(`/doctors/email/${email}`);
  return response.data;
};

export const createDoctor = async (doctorData) => {
  const response = await apiClient.post("/doctors", doctorData);
  return response.data;
};

export const updateDoctor = async (doctorId, doctorData) => {
  const response = await apiClient.put(`/doctors/${doctorId}`, doctorData);
  return response.data;
};

export const deleteDoctor = async (doctorId) => {
  const response = await apiClient.delete(`/doctors/${doctorId}`);
  return response.data;
};

// ==========================================
// Appointment Service APIs (routed to appointment-service)
// ==========================================

export const bookAppointment = async (appointmentData) => {
  const response = await apiClient.post("/appointments", appointmentData);
  return response.data;
};

export const getAppointments = async () => {
  const response = await apiClient.get("/appointments");
  return response.data;
};

export const getAppointmentsForPatient = async (patientId) => {
  const response = await apiClient.get(`/appointments/patient/${patientId}`);
  return response.data;
};

export const getAppointmentsForDoctor = async (doctorId) => {
  const response = await apiClient.get(`/appointments/doctor/${doctorId}`);
  return response.data;
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/status`, { status });
  return response.data;
};

export const rescheduleAppointment = async (appointmentId, appointmentData) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/reschedule`, appointmentData);
  return response.data;
};

export const cancelAppointment = async (appointmentId) => {
  const response = await apiClient.delete(`/appointments/${appointmentId}`);
  return response.data;
};

// ==========================================
// Billing Service APIs (routed to billing-service)
// ==========================================

export const generateBill = async (billData) => {
  const response = await apiClient.post("/bills", billData);
  return response.data;
};

export const getBills = async () => {
  const response = await apiClient.get("/bills");
  return response.data;
};

export const getBillsForPatient = async (patientId) => {
  const response = await apiClient.get(`/bills/patient/${patientId}`);
  return response.data;
};

export const updateBillStatus = async (billId, status) => {
  const response = await apiClient.put(`/bills/${billId}/status`, { status });
  return response.data;
};

// ==========================================
// AI Service APIs (routed to ai-service via api-gateway /ai/**)
// ==========================================

export const askAIAssistant = async (message, sessionId) => {
  const response = await apiClient.post("/ai/chat", { message, session_id: sessionId });
  return response.data;
};

export const analyzeMedicalReport = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post("/ai/upload-report", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const uploadPolicyDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post("/ai/upload-policy", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getAIInsights = async () => {
  const response = await apiClient.get("/ai/insights");
  return response.data;
};

export default apiClient;