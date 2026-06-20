import React, { useState, useEffect } from "react";
import { FaUserPlus, FaSearch, FaTrash, FaUserInjured, FaTimes, FaSpinner, FaServer, FaCheck, FaUserMd } from "react-icons/fa";
import { getPatients, createPatient, deletePatient, getDoctors, assignDoctor, getDoctorAssignedToPatient } from "../../services/api";

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [assignments, setAssignments] = useState({}); // patientId -> doctorId
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [apiConnectionMessage, setApiConnectionMessage] = useState("");
  const [apiLoading, setApiLoading] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newGender, setNewGender] = useState("Male");
  const [newBloodGroup, setNewBloodGroup] = useState("O+");
  const [newAddress, setNewAddress] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDiagnosis, setNewDiagnosis] = useState("");
  const [newDoctorId, setNewDoctorId] = useState("");

  const loadData = async () => {
    setApiLoading(true);
    try {
      const pts = await getPatients();
      const docs = await getDoctors();
      setDoctors(docs);
      
      const assignMap = {};
      await Promise.all(pts.map(async (p) => {
        try {
          const assign = await getDoctorAssignedToPatient(p.patientId);
          if (assign && assign.doctorId) {
            assignMap[p.patientId] = assign.doctorId;
          }
        } catch (err) {
          // No active assignment
        }
      }));
      
      setAssignments(assignMap);
      setPatients(pts);
      setApiConnectionMessage(`Synchronized: Loaded ${pts.length} patients and ${docs.length} doctors`);
    } catch (err) {
      console.error("Failed to connect to patient-service via gateway:", err);
      setApiConnectionMessage("Offline (Cannot reach Patient Service at Gateway port 9090)");
    } finally {
      setApiLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newAge || !newDiagnosis) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setApiLoading(true);
      const patientPayload = {
        fullName: newName,
        email: newEmail,
        age: parseInt(newAge),
        gender: newGender,
        bloodGroup: newBloodGroup,
        address: newAddress || "Not specified",
        contactNumber: newPhone || "+1 (555) 000-0000",
        medicalHistory: newDiagnosis
      };

      const savedPatient = await createPatient(patientPayload);
      
      // If a doctor was selected, assign them
      if (newDoctorId) {
        await assignDoctor(savedPatient.patientId, newDoctorId);
      }

      setShowModal(false);
      
      // Clear form
      setNewName("");
      setNewEmail("");
      setNewAge("");
      setNewGender("Male");
      setNewBloodGroup("O+");
      setNewAddress("");
      setNewPhone("");
      setNewDiagnosis("");
      setNewDoctorId("");

      // Refresh list
      await loadData();
    } catch (err) {
      alert("Failed to save patient record: " + (err.response?.data?.message || err.message));
    } finally {
      setApiLoading(false);
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (window.confirm("Are you sure you want to remove this patient record?")) {
      try {
        setApiLoading(true);
        await deletePatient(patientId);
        await loadData();
      } catch (err) {
        alert("Failed to delete patient: " + err.message);
      } finally {
        setApiLoading(false);
      }
    }
  };

  const handleAssignDoctorInline = async (patientId, docId) => {
    try {
      setApiLoading(true);
      if (docId === "") {
        return;
      }
      await assignDoctor(patientId, docId);
      await loadData();
    } catch (err) {
      alert("Failed to assign doctor: " + err.message);
    } finally {
      setApiLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.medicalHistory.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-heading text-slate-800 m-0">
            Manage <span className="text-blue-600">Patients</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">Register, browse, and assign doctors to patients.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="glass-button-primary flex items-center space-x-2 shrink-0 self-start md:self-auto"
        >
          <FaUserPlus />
          <span>Add Patient</span>
        </button>
      </div>

      {/* API Gateway Synchronization Status Widget */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FaServer className="text-lg" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-700">patient-service sync (Eureka Gateway)</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">Real-time authentication handshake status:</p>
          </div>
        </div>
        <div>
          {apiLoading ? (
            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <FaSpinner className="animate-spin text-blue-500" />
              <span>Querying Service...</span>
            </div>
          ) : (
            <div className={`text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-2 ${
              apiConnectionMessage.includes("Synchronized")
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              <FaCheck className="text-[10px]" />
              <span className="font-semibold truncate max-w-xs md:max-w-md">{apiConnectionMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Search Header */}
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800 font-heading m-0 flex items-center space-x-2">
            <FaUserInjured className="text-blue-500" />
            <span>Patient Registry ({filteredPatients.length})</span>
          </h3>
          <div className="relative max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FaSearch />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-10 py-2 text-sm"
              placeholder="Search patients..."
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center space-x-2">
              <FaSpinner className="animate-spin text-blue-600" />
              <span>Loading patient registry...</span>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-12 text-center text-slate-450">
              No patient records found matching query.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 pl-6">Patient Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Demographics</th>
                  <th className="p-4">Diagnosis</th>
                  <th className="p-4">Assigned Doctor</th>
                  <th className="p-4 pr-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredPatients.map((p) => {
                  const assignedDocId = assignments[p.patientId] || "";
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="font-semibold text-slate-800">{p.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-bold">ID: {p.patientId}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-700">{p.email}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{p.contactNumber}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-700">{p.age} yrs</span>
                        <span className="text-slate-300 text-[10px] mx-1.5">|</span>
                        <span className="text-slate-500 text-xs font-semibold">{p.gender} (BG: {p.bloodGroup})</span>
                      </td>
                      <td className="p-4">
                        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {p.medicalHistory}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <select
                            value={assignedDocId}
                            onChange={(e) => handleAssignDoctorInline(p.patientId, e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg text-xs text-slate-700 py-1.5 px-2 cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="">-- Assign Doctor --</option>
                            {doctors.map(d => (
                              <option key={d.id} value={d.doctorId}>{d.fullName} ({d.specialization})</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <button
                          onClick={() => handleDeletePatient(p.patientId)}
                          className="glass-button-danger p-2 rounded-lg inline-flex items-center text-xs justify-center cursor-pointer"
                          title="Delete Patient Profile"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Floating Add Patient Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur Layer */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-heading text-slate-800 m-0">Register New Patient</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm"
                    placeholder="Enter name"
                  />
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Age *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="120"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm"
                    placeholder="e.g. 35"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Gender *
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm bg-white cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Blood Group *
                  </label>
                  <select
                    value={newBloodGroup}
                    onChange={(e) => setNewBloodGroup(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm bg-white cursor-pointer"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Phone number
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm"
                    placeholder="Enter street address"
                  />
                </div>

                {/* Assigned Doctor */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Assigned Doctor
                  </label>
                  <select
                    value={newDoctorId}
                    onChange={(e) => setNewDoctorId(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm bg-white cursor-pointer"
                  >
                    <option value="">Select doctor...</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.doctorId}>{d.fullName} ({d.specialization})</option>
                    ))}
                  </select>
                </div>

                {/* Diagnosis */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Diagnosis / Medical History *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDiagnosis}
                    onChange={(e) => setNewDiagnosis(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm"
                    placeholder="Enter diagnosis or symptoms"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="glass-button-secondary w-full py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-button-primary w-full py-2.5"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePatients;
