import React, { useState, useEffect } from "react";
import { FaUserInjured, FaUserMd, FaCalendarCheck, FaHandHoldingUsd, FaChartLine, FaClock } from "react-icons/fa";
import { getPatients, getDoctors, getAppointments, getBills } from "../../services/api";

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: "Total Patients", value: "0", change: "0%", icon: <FaUserInjured />, gradient: "from-blue-600 to-indigo-500" },
    { title: "Active Doctors", value: "0", change: "0%", icon: <FaUserMd />, gradient: "from-emerald-600 to-teal-500" },
    { title: "Scheduled Appointments", value: "0", change: "0%", icon: <FaCalendarCheck />, gradient: "from-purple-600 to-indigo-500" },
    { title: "Total Revenue", value: "$0", change: "0%", icon: <FaHandHoldingUsd />, gradient: "from-amber-600 to-orange-500" },
  ]);

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const patientsData = await getPatients();
        const doctorsData = await getDoctors();
        const appointmentsData = await getAppointments();
        const billsData = await getBills();

        // Calculate total revenue from PAID bills
        const paidBills = billsData.filter(b => b.paymentStatus === "PAID" || b.paymentStatus === "Paid");
        const revenue = paidBills.reduce((sum, b) => sum + b.amount, 0);

        setStats([
          { title: "Total Patients", value: patientsData.length.toString(), change: "+12.5%", icon: <FaUserInjured />, gradient: "from-blue-600 to-indigo-500" },
          { title: "Active Doctors", value: doctorsData.length.toString(), change: "+3.2%", icon: <FaUserMd />, gradient: "from-emerald-600 to-teal-500" },
          { title: "Scheduled Appointments", value: appointmentsData.length.toString(), change: "+8.4%", icon: <FaCalendarCheck />, gradient: "from-purple-600 to-indigo-500" },
          { title: "Total Revenue", value: `$${revenue.toLocaleString()}`, change: "+15.3%", icon: <FaHandHoldingUsd />, gradient: "from-amber-600 to-orange-500" },
        ]);

        // Synthesize recent activities from actual data
        const activities = [];
        // Add recent patients
        patientsData.slice(-2).reverse().forEach(p => {
          activities.push({
            id: `p-${p.id}`,
            name: p.fullName,
            type: "New Patient Registered",
            time: "Recently",
            status: "Active",
            badge: "bg-blue-50 text-blue-700 border-blue-200"
          });
        });
        // Add recent appointments
        appointmentsData.slice(-2).reverse().forEach(app => {
          activities.push({
            id: `app-${app.appointmentId}`,
            name: `Appointment #${app.appointmentId}`,
            type: `Scheduled for Patient ${app.patientId}`,
            time: app.appointmentTime,
            status: app.appointmentStatus,
            badge: app.appointmentStatus === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
          });
        });

        setRecentActivities(activities.slice(0, 4));

      } catch (err) {
        console.error("Failed to load admin overview data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Overview Title */}
      <div>
        <h2 className="text-3xl font-extrabold font-heading text-slate-800 m-0">
          Admin Dashboard <span className="text-blue-600">Overview</span>
        </h2>
        <p className="text-slate-500 text-sm mt-1">Real-time indicators across hospital microservices.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300"
          >
            {/* Soft decorative glow behind the icon */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-tr ${stat.gradient} opacity-5 group-hover:opacity-10 blur-xl transition-opacity duration-300 rounded-full`}></div>

            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {stat.title}
                </span>
                <span className="text-3xl font-extrabold text-slate-850 tracking-tight block">
                  {stat.value}
                </span>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-tr ${stat.gradient} rounded-xl flex items-center justify-center text-white text-xl shadow-md group-hover:scale-105 transition-transform duration-300`}>
                {stat.icon}
              </div>
            </div>

            <div className="mt-4 flex items-center space-x-2">
              <span className="text-emerald-600 text-xs font-bold flex items-center space-x-0.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <FaChartLine className="text-[10px]" />
                <span>{stat.change}</span>
              </span>
              <span className="text-slate-400 text-[10px] font-semibold">Since last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Layout - Visual Progression & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Occupancy Rate & Staff Distribution */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 font-heading flex items-center space-x-2">
            <span>Capacity & Occupancy Management</span>
          </h3>

          <div className="space-y-6">
            {/* Intensive Care Unit (ICU) */}
            <div>
              <div className="flex justify-between items-center text-sm font-semibold mb-2">
                <span className="text-slate-600">Intensive Care Unit (ICU) Occupancy</span>
                <span className="text-red-600">84% Capacity</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div className="h-full bg-gradient-to-r from-blue-500 to-red-500 rounded-full" style={{ width: "84%" }}></div>
              </div>
            </div>

            {/* General Ward */}
            <div>
              <div className="flex justify-between items-center text-sm font-semibold mb-2">
                <span className="text-slate-600">General Ward Capacity</span>
                <span className="text-emerald-600">62% Capacity</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" style={{ width: "62%" }}></div>
              </div>
            </div>

            {/* Pediatric Unit */}
            <div>
              <div className="flex justify-between items-center text-sm font-semibold mb-2">
                <span className="text-slate-600">Pediatric Admissions Rate</span>
                <span className="text-indigo-600">45% Capacity</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: "45%" }}></div>
              </div>
            </div>

            {/* Emergency Room */}
            <div>
              <div className="flex justify-between items-center text-sm font-semibold mb-2">
                <span className="text-slate-600">Emergency Room (ER) Active Load</span>
                <span className="text-amber-600">92% High Load</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" style={{ width: "92%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Events */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 font-heading flex items-center space-x-2">
            <span>Recent Activities</span>
          </h3>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[290px] pr-1">
            {loading ? (
              <div className="text-center p-6 text-slate-400 text-sm">Loading activities...</div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center p-6 text-slate-400 text-sm">No recent activities.</div>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-250 flex items-start space-x-3.5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FaClock className="text-xs" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{act.name}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0">{act.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{act.type}</p>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-2 uppercase tracking-wide ${act.badge}`}>
                      {act.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
