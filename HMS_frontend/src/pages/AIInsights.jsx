import React, { useState, useEffect } from "react";
import { getAIInsights } from "../services/api";
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  FaChartLine, FaExclamationTriangle, FaHeartbeat, 
  FaUserInjured, FaDollarSign, FaCalendarCheck, FaVirus 
} from "react-icons/fa";

const COLORS = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#6366f1", "#8b5cf6"];

const AIInsights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const insights = await getAIInsights();
        setData(insights);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch analytics from AI insights engine. Make sure the backend AI service is online.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-white rounded-2xl border border-slate-200/85 shadow-sm">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <h4 className="text-sm font-bold text-slate-800">Compiling Operational Insights</h4>
          <p className="text-xs text-slate-400 mt-1">Aggregating clinic databases, financial statements, and clinical records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-150 rounded-2xl text-center space-y-3">
        <FaExclamationTriangle className="text-3xl text-red-500 mx-auto" />
        <h4 className="text-sm font-bold text-red-800">Operational Dashboard Offline</h4>
        <p className="text-xs text-red-600 max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  // Calculate quick metrics
  const totalRevenue = data?.revenue_trends?.reduce((sum, r) => sum + (r.revenue || 0), 0) || 0;
  const totalAppointments = data?.appointment_trends?.reduce((sum, r) => sum + (r.appointments || 0), 0) || 0;
  const highRiskCount = data?.high_risk_patients?.length || 0;
  const totalPatients = data?.patient_growth?.reduce((sum, g) => sum + (g.count || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <FaChartLine />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-800">MediPulse AI Insights & Analytics</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live hospital clinical and financial metrics aggregated using automated database indexing pipelines.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold tracking-wider block uppercase">TOTAL REVENUE (PAID)</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FaDollarSign className="text-lg" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold tracking-wider block uppercase">SCHEDULED APPOINTMENTS</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{totalAppointments}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FaCalendarCheck className="text-lg" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold tracking-wider block uppercase">HIGH RISK WARNINGS</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">{highRiskCount}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <FaHeartbeat className="text-lg animate-pulse" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold tracking-wider block uppercase">ACTIVE PATIENTS</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{totalPatients}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FaUserInjured className="text-lg" />
          </div>
        </div>
      </div>

      {/* Row 1: Revenue Trends & Disease distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-850">Billing Revenue Growth Curve</h3>
            <span className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold">Daily Sum</span>
          </div>
          <div className="h-[300px]">
            {data?.revenue_trends?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No revenue data recorded yet.</div>
            )}
          </div>
        </div>

        {/* Disease Prevalence Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <FaVirus className="text-rose-500 text-sm" />
            <h3 className="text-sm font-bold text-slate-850">Prevalent Diseases</h3>
          </div>
          <div className="h-[220px] relative">
            {data?.disease_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.disease_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.disease_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No diagnostic history records.</div>
            )}
          </div>
          
          {/* Custom Legends */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {data?.disease_distribution?.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-[10px] text-slate-600 font-bold truncate max-w-[85px]" title={item.name}>{item.name}</span>
                <span className="text-[10px] text-slate-400 font-bold">({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Demographic Distribution & High Risk Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Gender Distribution */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-850">Patient Demographics (Gender)</h3>
          <div className="h-[280px]">
            {data?.patient_growth?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.patient_growth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="gender" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Patients count">
                    {data.patient_growth.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No demographic data.</div>
            )}
          </div>
        </div>

        {/* Clinical Alerts List */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaExclamationTriangle className="text-rose-500 text-sm animate-pulse" />
              <h3 className="text-sm font-bold text-slate-850">High-Risk Patients Clinical Monitor</h3>
            </div>
            <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-150">
              Needs Review
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2.5 pr-1">
            {data?.high_risk_patients?.length > 0 ? (
              data.high_risk_patients.map((patient, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between hover:bg-slate-100/50 transition-colors duration-150">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">{patient.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">(Age {patient.age})</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      <span className="font-bold">Indication:</span> {patient.condition}
                    </p>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 border rounded-full uppercase tracking-wider ${
                    patient.risk_level === "High" 
                      ? "bg-red-50 text-red-700 border-red-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {patient.risk_level} Risk
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 py-12">No high-risk warnings active.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
