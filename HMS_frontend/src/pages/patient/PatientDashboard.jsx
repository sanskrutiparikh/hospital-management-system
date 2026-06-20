import React, { useState, useEffect } from "react";
import { 
  FaCalendarCheck, FaFileMedical, FaFileInvoiceDollar, FaUserMd, 
  FaSpinner, FaCheckCircle, FaTimes, FaCreditCard, FaLock, FaCalendarAlt
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { getPatientByEmail, getDoctorAssignedToPatient, getDoctor, getAppointmentsForPatient, getBillsForPatient, updateBillStatus, getDoctors, bookAppointment, cancelAppointment } from "../../services/api";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [patientProfile, setPatientProfile] = useState(null);
  const [assignedDoctor, setAssignedDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Bill payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Appointment booking states
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  const loadPatientData = async () => {
    try {
      setLoading(true);
      // Fetch patient profile by email
      const patient = await getPatientByEmail(user.email);
      setPatientProfile(patient);

      // Fetch assigned doctor details
      try {
        const assignment = await getDoctorAssignedToPatient(patient.patientId);
        if (assignment && assignment.doctorId) {
          const doc = await getDoctor(assignment.doctorId);
          setAssignedDoctor(doc);
        }
      } catch (err) {
        // No assigned doctor yet
      }

      // Fetch patient's appointments
      const apps = await getAppointmentsForPatient(patient.patientId);
      setAppointments(apps);

      // Fetch patient's bills
      const patientBills = await getBillsForPatient(patient.patientId);
      setBills(patientBills);

      // Fetch doctors list for booking
      const docs = await getDoctors();
      setDoctorsList(docs);

    } catch (err) {
      console.error("Failed to load patient dashboard information:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email) {
      loadPatientData();
    }
  }, [user]);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill || !cardName || !cardNumber || !cardExpiry || !cardCvv) {
      alert("Please fill in all credit card details.");
      return;
    }

    try {
      setActionLoading(true);
      // Process payment status on backend
      await updateBillStatus(selectedBill.billId, "PAID");
      setPaymentSuccess(true);

      setTimeout(() => {
        setPaymentSuccess(false);
        setShowPaymentModal(false);
        setSelectedBill(null);
        // Clear card form
        setCardName("");
        setCardNumber("");
        setCardExpiry("");
        setCardCvv("");
        loadPatientData();
      }, 2000);

    } catch (err) {
      alert("Payment failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !bookingDate || !bookingTime) {
      alert("Please select all scheduling parameters.");
      return;
    }

    try {
      setActionLoading(true);
      const appPayload = {
        patientId: patientProfile.patientId,
        doctorId: selectedDoctorId,
        appointmentDate: bookingDate,
        appointmentTime: bookingTime
      };

      await bookAppointment(appPayload);
      alert("Your appointment booking has been registered successfully.");
      setShowBookModal(false);
      
      // Clear booking form
      setSelectedDoctorId("");
      setBookingDate("");
      setBookingTime("");

      await loadPatientData();
    } catch (err) {
      alert("Failed to book appointment: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAppointment = async (appId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        setActionLoading(true);
        await cancelAppointment(appId);
        await loadPatientData();
      } catch (err) {
        alert("Failed to cancel appointment: " + err.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Compute stats
  const nextApp = appointments.find(a => a.appointmentStatus === "PENDING" || a.appointmentStatus === "Pending");
  const unpaidBills = bills.filter(b => b.paymentStatus === "UNPAID" || b.paymentStatus === "Unpaid");
  const outstandingSum = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

  // Parse checkup history list from medicalHistory
  const getTimelineEvents = () => {
    if (!patientProfile || !patientProfile.medicalHistory) return [];
    
    // Check if there are checkup reports separated by semicolons
    const historyString = patientProfile.medicalHistory;
    const parts = historyString.split(";");
    
    return parts.map((part, i) => {
      // Look for format: [Report Date: YYYY-MM-DD (Dr. Name)] Symptoms: ... | Rx: ... | Notes: ...
      const dateMatch = part.match(/Report Date:\s*([\d-]+)/);
      const docMatch = part.match(/\((Dr\.\s*[^)]+)\)/);
      
      const date = dateMatch ? dateMatch[1] : "Previous History";
      const doctor = docMatch ? docMatch[1] : "Medical Registry";
      
      let diagnosis = "Medical Review / Symptoms Check";
      let notes = part.trim();
      
      if (part.includes("Symptoms:")) {
        const symptomsIndex = part.indexOf("Symptoms:");
        notes = part.substring(symptomsIndex).trim();
      }

      return {
        date,
        doctor,
        diagnosis,
        notes,
        status: "Normal"
      };
    }).reverse(); // Latest report first
  };

  const timelineEvents = getTimelineEvents();

  return (
    <div className="space-y-8">
      {/* Patient Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-heading text-slate-800 m-0">
            Patient Portal <span className="text-blue-600">Overview</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">Review your digital medical charts, billing, and appointments.</p>
        </div>
        <div className="flex space-x-3 self-start md:self-auto shrink-0">
          <button
            onClick={() => setShowBookModal(true)}
            className="glass-button-secondary flex items-center space-x-2 cursor-pointer py-2 px-4"
          >
            <FaCalendarCheck />
            <span>Book Appointment</span>
          </button>
          {outstandingSum > 0 && (
            <button
              onClick={() => {
                setSelectedBill(unpaidBills[0]);
                setShowPaymentModal(true);
              }}
              className="glass-button-primary flex items-center space-x-2 cursor-pointer py-2 px-4"
            >
              <FaCreditCard />
              <span>Settle Balance (${outstandingSum})</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Appointment */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Next Appointment
              </span>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight block">
                {nextApp ? `${nextApp.appointmentDate} ${nextApp.appointmentTime}` : "No Pending Booking"}
              </span>
              <span className="text-slate-400 text-[10px] font-bold block mt-1">
                {nextApp ? `Doctor ID: ${nextApp.doctorId}` : "Schedule a checkup above"}
              </span>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center text-lg shadow-sm">
              <FaCalendarCheck />
            </div>
          </div>
        </div>

        {/* Assigned Doctor */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Assigned Doctor
              </span>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight block">
                {assignedDoctor ? assignedDoctor.fullName : "None Assigned"}
              </span>
              <span className="text-slate-400 text-[10px] font-bold block mt-1">
                {assignedDoctor ? `${assignedDoctor.specialization} • ${assignedDoctor.phone}` : "Request assignment via admin"}
              </span>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center justify-center text-lg shadow-sm">
              <FaUserMd />
            </div>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Outstanding Balance
              </span>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight block">
                ${outstandingSum.toLocaleString()}
              </span>
              <span className="text-slate-400 text-[10px] font-bold block mt-1">
                {outstandingSum > 0 ? "Payment Overdue" : "Account Cleared"}
              </span>
            </div>
            <div className="w-10 h-10 bg-red-50 text-red-500 border border-red-100 rounded-xl flex items-center justify-center text-lg shadow-sm">
              <FaFileInvoiceDollar />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Medical Timeline History */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 font-heading flex items-center space-x-2">
            <FaFileMedical className="text-blue-500" />
            <span>Digital Medical History Timeline</span>
          </h3>

          {loading ? (
            <div className="text-center p-6 text-slate-400 text-sm">Loading timeline...</div>
          ) : timelineEvents.length === 0 ? (
            <div className="text-center p-6 text-slate-450 text-sm">No clinical evaluations recorded yet.</div>
          ) : (
            <div className="relative border-l border-slate-200 pl-6 space-y-8 ml-2">
              {timelineEvents.map((item, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border border-white ring-4 ring-blue-500/10"></span>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-blue-600 font-bold font-mono">{item.date}</span>
                      <span className="text-slate-350 text-xs">|</span>
                      <span className="text-sm font-semibold text-slate-700 flex items-center space-x-1">
                        <FaUserMd className="text-xs text-slate-400" />
                        <span>{item.doctor}</span>
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-bold text-slate-850 mb-1">{item.diagnosis}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono whitespace-pre-wrap">
                    {item.notes}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Personal Statements & Invoices */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-6 font-heading flex items-center space-x-2">
              <FaFileInvoiceDollar className="text-blue-500" />
              <span>Billing Portal Ledger ({bills.length})</span>
            </h3>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center text-slate-400 text-xs">Loading ledger...</div>
              ) : bills.length === 0 ? (
                <div className="text-center text-slate-450 text-xs">No invoices issued.</div>
              ) : (
                bills.map(b => (
                  <div key={b.billId} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span>INV-{b.billId}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                        b.paymentStatus === "UNPAID" || b.paymentStatus === "Unpaid"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-xs text-slate-500 flex flex-col space-y-1">
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span className="text-slate-700 font-semibold">{b.serviceRendered}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="text-slate-700 font-semibold">{b.generatedDate}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-800 mt-1 pt-1 border-t border-slate-200/60">
                        <span>Charge:</span>
                        <span>${b.amount}</span>
                      </div>
                    </div>

                    {(b.paymentStatus === "UNPAID" || b.paymentStatus === "Unpaid") && (
                      <button
                        onClick={() => {
                          setSelectedBill(b);
                          setShowPaymentModal(true);
                        }}
                        className="glass-button-primary w-full mt-3 py-1.5 text-xs flex items-center justify-center space-x-1"
                      >
                        <FaCreditCard />
                        <span>Pay Online</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowBookModal(false)}></div>

          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-heading text-slate-800 m-0">Schedule Consultation</h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-705 transition-colors flex items-center justify-center cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Choose Medical Specialist *
                </label>
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="glass-input w-full py-2.5 text-sm bg-white cursor-pointer"
                >
                  <option value="">Select doctor...</option>
                  {doctorsList.map(d => (
                    <option key={d.id} value={d.doctorId}>{d.fullName} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Select Date *
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="glass-input w-full py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Select Time Slot *
                </label>
                <input
                  type="text"
                  required
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="glass-input w-full py-2.5 text-sm"
                  placeholder="e.g. 10:30 AM"
                />
              </div>

              <div className="flex space-x-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
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
                  <span>Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animated Pay Invoice Card Modal Overlay */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !actionLoading && setShowPaymentModal(false)}></div>

          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-heading text-slate-800 m-0 flex items-center space-x-2">
                <FaCreditCard className="text-blue-500" />
                <span>Settle Account Due</span>
              </h3>
              {!actionLoading && (
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {paymentSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-150 flex items-center justify-center text-4xl shadow-lg">
                  <FaCheckCircle className="animate-bounce" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Payment Authorized!</h4>
                <p className="text-xs text-slate-500 text-center">Receipt processed. Thank you!</p>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="space-y-4">
                {/* Charge Review */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Amount Owed:</span>
                  <span className="text-slate-850 font-extrabold text-sm">${selectedBill.amount.toFixed(2)}</span>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="glass-input w-full py-2 text-sm"
                    placeholder="John Doe"
                    disabled={actionLoading}
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center space-x-1">
                    <FaCreditCard className="text-slate-400 text-[10px]" />
                    <span>Card Number</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="19"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="glass-input w-full py-2 text-sm font-mono"
                    placeholder="4111 2222 3333 4444"
                    disabled={actionLoading}
                  />
                </div>

                {/* Exp & CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center space-x-1">
                      <FaCalendarAlt className="text-slate-400 text-[10px]" />
                      <span>Expiration</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="5"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="glass-input w-full py-2 text-sm font-mono"
                      placeholder="MM/YY"
                      disabled={actionLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center space-x-1">
                      <FaLock className="text-slate-400 text-[10px]" />
                      <span>Security Code (CVV)</span>
                    </label>
                    <input
                      type="password"
                      required
                      maxLength="3"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="glass-input w-full py-2 text-sm font-mono"
                      placeholder="•••"
                      disabled={actionLoading}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 mt-6 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="glass-button-secondary w-full py-2.5"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="glass-button-primary w-full py-2.5 flex items-center justify-center space-x-2"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <FaSpinner className="animate-spin text-sm" />
                        <span>Authorizing...</span>
                      </>
                    ) : (
                      <span>Settle Charge</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
