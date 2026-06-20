import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { analyzeMedicalReport, uploadPolicyDocument } from "../services/api";
import { 
  FaCloudUploadAlt, FaFilePdf, FaCheckCircle, 
  FaNotesMedical, FaStethoscope, FaPills, 
  FaUserInjured, FaUserMd, FaChevronRight, FaShieldAlt
} from "react-icons/fa";

const AIReportAnalysis = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [activeTab, setActiveTab] = useState("report");

  // Report analyzer states
  const [reportFile, setReportFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [reportError, setReportError] = useState("");

  // Policy ingestion states
  const [policyFile, setPolicyFile] = useState(null);
  const [ingesting, setIngesting] = useState(false);
  const [policySuccess, setPolicySuccess] = useState("");
  const [policyError, setPolicyError] = useState("");

  const handleReportUpload = async (e) => {
    e.preventDefault();
    if (!reportFile) return;

    setAnalyzing(true);
    setAnalysisResult(null);
    setReportError("");

    try {
      const result = await analyzeMedicalReport(reportFile);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setReportError(err.response?.data?.detail || "Failed to analyze medical report. Ensure it is a valid PDF and the AI service is active.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePolicyUpload = async (e) => {
    e.preventDefault();
    if (!policyFile) return;

    setIngesting(true);
    setPolicySuccess("");
    setPolicyError("");

    try {
      const res = await uploadPolicyDocument(policyFile);
      setPolicySuccess(res.message || "Policy successfully indexed into vector database!");
      setPolicyFile(null);
    } catch (err) {
      console.error(err);
      setPolicyError(err.response?.data?.detail || "Failed to index policy guideline document.");
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-800">AI Document Analysis</h2>
          <p className="text-xs text-slate-400 mt-1">
            Extract medical insights from clinical reports or update the hospital standard operating procedure (SOP) repository.
          </p>
        </div>
        
        {/* Tab Selection */}
        <div className="flex bg-slate-50 border border-slate-250/60 p-1 rounded-xl mt-4 md:mt-0 self-start">
          <button
            onClick={() => setActiveTab("report")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "report" 
                ? "bg-white text-blue-600 shadow-sm border border-slate-100" 
                : "text-slate-500 hover:text-slate-850"
            }`}
          >
            Clinical Report Analyzer
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("policy")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === "policy"
                  ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                  : "text-slate-500 hover:text-slate-850"
              }`}
            >
              Hospital Policy Ingestor
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === "report" ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Uploader Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-slate-850 font-bold text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FaNotesMedical />
                </div>
                <span>Clinical Report Extractor</span>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload patient lab reports, prescriptions, or clinical summaries in PDF format. The AI model will parse, classify, and format key fields automatically.
              </p>

              <form onSubmit={handleReportUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/10 rounded-2xl p-6 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer relative group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      setReportFile(e.target.files[0]);
                      setReportError("");
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FaCloudUploadAlt className="text-3xl text-slate-400 group-hover:text-blue-500 transition-colors duration-200 mb-2.5" />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-blue-700">
                    {reportFile ? reportFile.name : "Select Clinical PDF Report"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">Supports PDF (max 10MB)</span>
                </div>

                {reportError && (
                  <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs font-semibold text-red-600">
                    {reportError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={analyzing || !reportFile}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-750 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {analyzing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-350 border-t-white rounded-full animate-spin"></div>
                      <span>Extracting Clinical Data...</span>
                    </>
                  ) : (
                    <span>Analyze Document</span>
                  )}
                </button>
              </form>
            </div>
            
            <div className="pt-6 border-t border-slate-100 mt-6 text-[10px] text-slate-400 flex items-center space-x-1.5 justify-center">
              <FaShieldAlt className="text-blue-500" />
              <span>HIPAA Compliant Secure Analysis</span>
            </div>
          </div>

          {/* Results Card */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm min-h-[300px] flex flex-col justify-center">
            {analyzing ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Processing Medical Document</h4>
                  <p className="text-xs text-slate-400 mt-1">Gemini API is parsing patient records and structures...</p>
                </div>
              </div>
            ) : analysisResult ? (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <FaCheckCircle className="text-emerald-500 text-lg animate-scaleIn" />
                    <span className="text-sm font-bold text-slate-800">Clinical Data Extracted Successfully</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-150">
                    Structured Output
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient Name */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex items-start space-x-3.5">
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <FaUserInjured />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold tracking-wider block uppercase">PATIENT NAME</span>
                      <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                        {analysisResult.patient_name || "Unknown Patient"}
                      </span>
                    </div>
                  </div>

                  {/* Primary Doctor */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex items-start space-x-3.5">
                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                      <FaUserMd />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold tracking-wider block uppercase">PRIMARY DOCTOR</span>
                      <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                        {analysisResult.doctor || "Unknown / Unspecified"}
                      </span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex items-start space-x-3.5 md:col-span-2">
                    <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
                      <FaStethoscope />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold tracking-wider block uppercase">DIAGNOSIS SUMMARY</span>
                      <span className="text-sm font-bold text-slate-850 mt-0.5 block leading-relaxed">
                        {analysisResult.diagnosis || "No specific diagnosis found."}
                      </span>
                    </div>
                  </div>

                  {/* Prescribed Medicines */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 md:col-span-2 space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                      <FaPills className="text-indigo-500 text-sm" />
                      <span>PRESCRIBED MEDICINES</span>
                    </div>
                    {analysisResult.medicines && analysisResult.medicines.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.medicines.map((med, i) => (
                          <span key={i} className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded border border-indigo-150 shadow-sm">
                            {med}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-450 italic">No prescription medicines detected.</span>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 md:col-span-2 space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                      <FaNotesMedical className="text-teal-500 text-sm" />
                      <span>CLINICAL RECOMMENDATIONS</span>
                    </div>
                    {analysisResult.recommendations && analysisResult.recommendations.length > 0 ? (
                      <ul className="space-y-1.5">
                        {analysisResult.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start text-xs font-semibold text-slate-700">
                            <FaChevronRight className="text-[8px] text-blue-500 mr-2 mt-1.5 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs font-medium text-slate-450 italic">No recommendations listed.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <FaFilePdf className="text-5xl mx-auto text-slate-300" />
                <h4 className="text-sm font-bold text-slate-600">No Document Analyzed Yet</h4>
                <p className="text-xs text-slate-400">Select a patient PDF report from the left panel and click Analyze.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Policy tab */
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 text-slate-850 font-bold text-sm">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <FaFilePdf />
            </div>
            <span>Hospital SOP Policy Ingestor</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Ingest hospital guidelines, insurance SOP files, and policy parameters. Documents are segmented, vectorized using Google Embeddings, and indexed into ChromaDB. The AI Assistant can query this knowledge base using RAG.
          </p>

          <form onSubmit={handlePolicyUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/10 rounded-2xl p-8 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer relative group">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  setPolicyFile(e.target.files[0]);
                  setPolicySuccess("");
                  setPolicyError("");
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FaCloudUploadAlt className="text-4xl text-slate-400 group-hover:text-blue-500 transition-colors duration-200 mb-3" />
              <span className="text-xs font-bold text-slate-600 group-hover:text-blue-700">
                {policyFile ? policyFile.name : "Select SOP / Policy Document"}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Supports guidelines in PDF (max 20MB)</span>
            </div>

            {policySuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-150 rounded-xl text-xs font-semibold text-emerald-700 flex items-center space-x-2">
                <FaCheckCircle className="shrink-0" />
                <span>{policySuccess}</span>
              </div>
            )}

            {policyError && (
              <div className="p-3.5 bg-red-50 border border-red-150 rounded-xl text-xs font-semibold text-red-700">
                {policyError}
              </div>
            )}

            <button
              type="submit"
              disabled={ingesting || !policyFile}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {ingesting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-350 border-t-white rounded-full animate-spin"></div>
                  <span>Vectorizing and Chunking SOP...</span>
                </>
              ) : (
                <span>Upload SOP into AI Memory</span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIReportAnalysis;
