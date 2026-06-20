import React, { useState, useEffect } from "react";
import { 
  FaCalendarCheck, FaClock, FaClipboardList, FaUserInjured, 
  FaFileMedical, FaTimes, FaSpinner, FaFileSignature 
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { getDoctorByEmail, getPatientsAssignedToDoctor, getAppointmentsForDoctor, updateAppointmentStatus, getPatient, updatePatient } from "../../services/api";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState([
    { title: "Today's Appointments", value: "0", icon: <FaCalendarCheck />, color: "from-blue-600 to-indigo-500" },
    { title: "Active Assignments", value: "0", icon: <FaUserInjured />, color: "from-emerald-600 to-teal-500" },
    { title: "Years Experience", value: "0", icon: <FaClipboardList />, color: "from-amber-600 to-orange-500" },
  ]);

  // Medical Record Overlay Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [reportAdded, setReportAdded] = useState(false);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      // Fetch Doctor details by email
      const doc = await getDoctorByEmail(user.email);
      setDoctorProfile(doc);

      // Fetch assigned patients
      const assignedPatients = await getPatientsAssignedToDoctor(doc.doctorId);
      setPatients(assignedPatients);

      // Fetch appointments
      const apps = await getAppointmentsForDoctor(doc.doctorId);
      setAppointments(apps);

      // Update stats
      const pendingCount = apps.filter(a => a.appointmentStatus === "PENDING" || a.appointmentStatus === "Pending").length;
      setStats([
        { title: "Pending Appointments", value: pendingCount.toString(), icon: <FaCalendarCheck />, color: "from-blue-600 to-indigo-500" },
        { title: "Assigned Patients", value: assignedPatients.length.toString(), icon: <FaUserInjured />, color: "from-emerald-600 to-teal-500" },
        { title: "Experience Level", value: `${doc.yearsOfExperience} yrs`, icon: <FaClipboardList />, color: "from-amber-600 to-orange-500" },
      ]);

    } catch (err) {
      console.error("Failed to load doctor dashboard details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email) {
      loadDoctorData();
    }
  }, [user]);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !symptoms || !prescription) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setReportAdded(true);
      
      // Fetch patient profile
      const pt = await getPatient(selectedPatientId);
      
      // Format check-up report to append to medicalHistory
      const todayStr = new Date().toISOString().split("T")[0];
      const checkupReport = `\n[Report Date: ${todayStr} (Dr. ${doctorProfile.fullName})] Symptoms: ${symptoms} | Rx: ${prescription} | Notes: ${notes}`;
      const updatedHistory = pt.medicalHistory ? `${pt.medicalHistory}; ${checkupReport}` : checkupReport;
      
      // Update Patient record
      await updatePatient(selectedPatientId, {
        ...pt,
        medicalHistory: updatedHistory
      });

      // Autocomplete any pending appointment for this patient if it exists
      const matchingApp = appointments.find(a => 
        a.patientId === selectedPatientId && 
        (a.appointmentStatus === "PENDING" || a.appointmentStatus === "Pending")
      );
      if (matchingApp) {
        await updateAppointmentStatus(matchingApp.appointmentId, "COMPLETED");
      }

      alert("Clinical report filed and patient records updated successfully.");
      setShowModal(false);

      // Clear Form
      setSelectedPatientId("");
      setSymptoms("");
      setPrescription("");
      setNotes("");

      await loadDoctorData();
    } catch (err) {
      alert("Failed to file clinical report: " + err.message);
    } finally {
      setReportAdded(false);
    }
  };

  const handleMarkCompleted = async (appointmentId) => {
    try {
      setActionLoading(true);
      await updateAppointmentStatus(appointmentId, "COMPLETED");
      await loadDoctorData();
    } catch (err) {
      alert("Failed to complete appointment: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Critical":
        return "bg-red-50 text-red-700 border-red-205";
      case "Recovering":
        return "bg-indigo-50 text-indigo-700 border-indigo-205";
      default:
        return "bg-slate-50 text-slate-700 border-slate-205";
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-heading text-slate-800 m-0">
            Doctor Portal <span className="text-blue-600">Overview</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">Supervise admissions, review schedules, and file reports.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="glass-button-primary flex items-center space-x-2 shrink-0 self-start md:self-auto"
        >
          <FaFileSignature />
          <span>Write Diagnosis Report</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {stat.title}
                </span>
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight block">
                  {stat.value}
                </span>
              </div>
              <div className={`w-10 h-10 bg-gradient-to-tr ${stat.color} text-white rounded-xl flex items-center justify-center text-lg shadow-sm`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Catalog Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Assigned Patients Grid */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 font-heading m-0 flex items-center space-x-2">
              <FaUserInjured className="text-blue-500" />
              <span>Assigned Ward Patients ({patients.length})</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading patients...</div>
            ) : patients.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No assigned patients found.</div>
            ) : (
              <table className="w-full text-left border-collapse border-slate-100">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 pl-6">Patient Name</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">Diagnosis</th>
                    <th className="p-4">Acuity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 pl-6 font-semibold text-slate-800">
                        <div>{p.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{p.age} yrs • {p.gender}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-700">
                        <div>{p.email}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{p.contactNumber}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
                          {p.medicalHistory}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 border rounded-full uppercase tracking-wider ${getStatusBadge("Normal")}`}>
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Appointment Scheduler */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 font-heading m-0 flex items-center space-x-2">
              <FaCalendarCheck className="text-blue-500" />
              <span>Today's Appointments ({appointments.length})</span>
            </h3>
          </div>
          <div className="p-4 space-y-3.5 flex-1 overflow-y-auto max-h-[290px] pr-1 bg-slate-50/40">
            {loading ? (
              <div className="text-center p-6 text-slate-400 text-sm">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="text-center p-6 text-slate-500 text-sm">No appointments scheduled.</div>
            ) : (
              appointments.map((app) => (
                <div
                  key={app.appointmentId}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 hover:shadow-sm flex items-start justify-between space-x-4 transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Patient ID: {app.patientId}</h4>
                    <p className="text-[10px] text-slate-450 mt-1 flex items-center space-x-1 font-semibold">
                      <FaClock className="text-[8px]" />
                      <span>{app.appointmentTime} • Date: {app.appointmentDate}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 border rounded uppercase ${
                      app.appointmentStatus === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {app.appointmentStatus}
                    </span>
                    {(app.appointmentStatus === "PENDING" || app.appointmentStatus === "Pending") && (
                      <button
                        onClick={() => handleMarkCompleted(app.appointmentId)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold transition-colors cursor-pointer"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Add Diagnosis modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>

          <div className="relative z-10 w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-heading text-slate-800 m-0 flex items-center space-x-2">
                <FaFileMedical className="text-blue-500" />
                <span>Write Check-up Report</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Select Assigned Patient *
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="glass-input w-full py-2.5 text-sm bg-white cursor-pointer"
                >
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.patientId}>{p.fullName} ({p.patientId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Recorded Symptoms / Signs *
                </label>
                <input
                  type="text"
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="glass-input w-full py-2.5 text-sm"
                  placeholder="e.g. Chest tightness, shallow respiration"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Prescription / Pharmacological Orders *
                </label>
                <input
                  type="text"
                  required
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  className="glass-input w-full py-2.5 text-sm"
                  placeholder="e.g. Lisinopril 10mg QD, rest orders"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Clinical Examination Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="glass-input w-full py-2.5 text-sm h-24 resize-none"
                  placeholder="Enter medical evaluation remarks..."
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="glass-button-secondary w-full py-2.5"
                  disabled={reportAdded}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-button-primary w-full py-2.5 flex items-center justify-center space-x-2"
                  disabled={reportAdded}
                >
                  {reportAdded ? (
                    <>
                      <FaSpinner className="animate-spin text-sm" />
                      <span>Filing Report...</span>
                    </>
                  ) : (
                    <span>Save Diagnosis</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
