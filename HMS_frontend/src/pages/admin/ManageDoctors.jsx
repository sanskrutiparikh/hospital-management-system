import React, { useState, useEffect } from "react";
import { FaUserPlus, FaSearch, FaTrash, FaUserMd, FaTimes, FaBriefcase, FaEnvelope, FaPhone, FaSpinner } from "react-icons/fa";
import { getDoctors, createDoctor, deleteDoctor } from "../../services/api";

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [newExperience, setNewExperience] = useState("");
  const [newStatus, setNewStatus] = useState("AVAILABLE");

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await getDoctors();
      setDoctors(data);
    } catch (err) {
      console.error("Failed to fetch doctors registry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newSpecialization || !newExperience) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setActionLoading(true);
      const doctorPayload = {
        fullName: newName,
        email: newEmail,
        phone: newPhone || "+1 (555) 000-0000",
        specialization: newSpecialization,
        yearsOfExperience: parseInt(newExperience),
        availabilityStatus: newStatus,
      };

      await createDoctor(doctorPayload);
      setShowModal(false);

      // Clear form
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewSpecialization("");
      setNewExperience("");
      setNewStatus("AVAILABLE");

      await loadDoctors();
    } catch (err) {
      alert("Failed to register doctor: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (window.confirm("Are you sure you want to remove this doctor from the registry?")) {
      try {
        setActionLoading(true);
        await deleteDoctor(doctorId);
        await loadDoctors();
      } catch (err) {
        alert("Failed to delete doctor: " + err.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const filteredDoctors = doctors.filter((d) =>
    d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.doctorId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-heading text-slate-800 m-0">
            Manage <span className="text-blue-600">Doctors</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">Supervise medical staff, shift schedules, and directories.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="glass-button-primary flex items-center space-x-2 shrink-0 self-start md:self-auto"
        >
          <FaUserPlus />
          <span>Register Doctor</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Search Header */}
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800 font-heading m-0 flex items-center space-x-2">
            <FaUserMd className="text-blue-500" />
            <span>Staff Directory ({filteredDoctors.length})</span>
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
              placeholder="Search doctors..."
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center space-x-2">
              <FaSpinner className="animate-spin text-blue-600" />
              <span>Loading staff directory...</span>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No staff records found matching query.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 pl-6">Doctor Details</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Specialization</th>
                  <th className="p-4">Experience</th>
                  <th className="p-4">Duty Status</th>
                  <th className="p-4 pr-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredDoctors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-slate-800">{d.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-bold">Staff ID: {d.doctorId}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-700">{d.email}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{d.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {d.specialization}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-700">{d.yearsOfExperience} years</td>
                    <td className="p-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider ${
                        d.availabilityStatus === "AVAILABLE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {d.availabilityStatus}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <button
                        onClick={() => handleDeleteDoctor(d.doctorId)}
                        disabled={actionLoading}
                        className="glass-button-danger p-2 rounded-lg inline-flex items-center text-xs justify-center cursor-pointer disabled:opacity-50"
                        title="Delete Doctor"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Floating Add Doctor Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>

          <div className="relative z-10 w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-heading text-slate-800 m-0">Register New Medical Staff</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-750 transition-colors flex items-center justify-center cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center space-x-1">
                    <FaUserMd className="text-blue-500" />
                    <span>Doctor Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm"
                    placeholder="Dr. Alexander Fleming"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center space-x-1">
                    <FaEnvelope className="text-blue-500" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm"
                    placeholder="docname@medpulse.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center space-x-1">
                    <FaPhone className="text-blue-500" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center space-x-1">
                    <FaBriefcase className="text-blue-500" />
                    <span>Specialization *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm"
                    placeholder="e.g. Cardiology"
                  />
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="60"
                    value={newExperience}
                    onChange={(e) => setNewExperience(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm"
                    placeholder="e.g. 10"
                  />
                </div>

                {/* Duty Status */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Availability Status *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="glass-input w-full py-2.5 text-sm bg-white cursor-pointer"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                  </select>
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
                  disabled={actionLoading}
                  className="glass-button-primary w-full py-2.5 flex items-center justify-center space-x-2"
                >
                  {actionLoading ? <FaSpinner className="animate-spin" /> : null}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDoctors;
