import React, { useState, useEffect } from "react";
import { FaFileInvoiceDollar, FaSearch, FaCheck, FaCoins, FaClock, FaCheckCircle, FaSpinner, FaTimes } from "react-icons/fa";
import { getBills, generateBill, updateBillStatus, getPatients } from "../../services/api";

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [newService, setNewService] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const billsData = await getBills();
      const patientsData = await getPatients();
      setInvoices(billsData);
      setPatients(patientsData);
    } catch (err) {
      console.error("Failed to load billing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAsPaid = async (id) => {
    if (window.confirm(`Are you sure you want to mark invoice #${id} as fully Paid?`)) {
      try {
        setActionLoading(true);
        await updateBillStatus(id, "PAID");
        await loadData();
      } catch (err) {
        alert("Failed to update payment status: " + err.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !newService || !newAmount) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setActionLoading(true);
      const billPayload = {
        patientId: selectedPatientId,
        serviceRendered: newService,
        amount: parseFloat(newAmount),
        paymentStatus: "UNPAID"
      };

      await generateBill(billPayload);
      setShowModal(false);

      // Clear form
      setSelectedPatientId("");
      setNewService("");
      setNewAmount("");

      await loadData();
    } catch (err) {
      alert("Failed to generate invoice: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const getPatientName = (patientId) => {
    const p = patients.find(pat => pat.patientId === patientId);
    return p ? p.fullName : `Patient ${patientId}`;
  };

  const filteredInvoices = invoices.filter((inv) => {
    const patientName = getPatientName(inv.patientId);
    return (
      patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.billId.toString().includes(searchQuery) ||
      inv.serviceRendered.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Compute billing summary numbers
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices
    .filter((inv) => inv.paymentStatus === "PAID" || inv.paymentStatus === "Paid")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const totalUnpaid = invoices
    .filter((inv) => inv.paymentStatus === "UNPAID" || inv.paymentStatus === "Unpaid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-heading text-slate-800 m-0">
            Billing & <span className="text-blue-600">Revenue</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">Audit accounts, process invoices, and monitor earnings.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="glass-button-primary flex items-center space-x-2 shrink-0 self-start md:self-auto"
        >
          <FaFileInvoiceDollar />
          <span>Generate Invoice</span>
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Invoiced */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Total Invoiced
              </span>
              <span className="text-2xl font-extrabold text-slate-800 tracking-tight block">
                ${totalInvoiced.toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center text-lg shadow-sm">
              <FaFileInvoiceDollar />
            </div>
          </div>
        </div>

        {/* Total Paid Receipts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Paid Receipts
              </span>
              <span className="text-2xl font-extrabold text-emerald-600 tracking-tight block">
                ${totalPaid.toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center text-lg shadow-sm">
              <FaCoins />
            </div>
          </div>
        </div>

        {/* Total Unpaid Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Outstanding Balance
              </span>
              <span className="text-2xl font-extrabold text-red-600 tracking-tight block">
                ${totalUnpaid.toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 bg-red-50 text-red-500 border border-red-100 rounded-xl flex items-center justify-center text-lg shadow-sm">
              <FaClock />
            </div>
          </div>
        </div>
      </div>

      {/* Main Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Search Header */}
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800 font-heading m-0 flex items-center space-x-2">
            <FaFileInvoiceDollar className="text-blue-500" />
            <span>Transaction Ledger ({filteredInvoices.length})</span>
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
              placeholder="Search invoices..."
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center space-x-2">
              <FaSpinner className="animate-spin text-blue-600" />
              <span>Loading transaction ledger...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No invoice records found matching query.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 pl-6">Invoice ID</th>
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Date Issued</th>
                  <th className="p-4">Service Rendered</th>
                  <th className="p-4">Amount Due</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4 pr-6 text-center">Process</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.billId} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 pl-6 font-bold text-blue-600 text-xs">INV-{inv.billId}</td>
                    <td className="p-4 text-sm font-semibold text-slate-800">{getPatientName(inv.patientId)}</td>
                    <td className="p-4 text-xs text-slate-500">{inv.generatedDate}</td>
                    <td className="p-4 text-xs text-slate-600">{inv.serviceRendered}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">${inv.amount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 border rounded-full uppercase tracking-wider ${
                        inv.paymentStatus === "PAID" || inv.paymentStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      {(inv.paymentStatus === "UNPAID" || inv.paymentStatus === "Unpaid") ? (
                        <button
                          onClick={() => handleMarkAsPaid(inv.billId)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <div className="text-emerald-600 flex items-center justify-center space-x-1 text-xs font-semibold">
                          <FaCheckCircle className="text-[10px]" />
                          <span>Cleared</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Generate Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>

          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-heading text-slate-800 m-0">Generate Patient Invoice</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Select Registered Patient *
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="glass-input w-full py-2.5 text-sm bg-white cursor-pointer"
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.patientId}>{p.fullName} ({p.patientId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Service Rendered *
                </label>
                <input
                  type="text"
                  required
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="glass-input w-full py-2.5 text-sm"
                  placeholder="e.g. Cardiological Screening"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Invoice Amount ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="glass-input w-full py-2.5 text-sm"
                  placeholder="e.g. 250.00"
                />
              </div>

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
                  <span>Generate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
