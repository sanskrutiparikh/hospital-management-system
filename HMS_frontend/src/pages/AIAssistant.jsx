import React, { useState, useEffect, useRef } from "react";
import { askAIAssistant } from "../services/api";
import { FaPaperPlane, FaRobot, FaUser, FaRegLightbulb, FaDatabase, FaBook, FaGlobe } from "react-icons/fa";

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am MediPulse AI, your clinical and operational intelligence assistant. How can I help you today?",
      category: "GENERAL",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Math.random().toString(36).substr(2, 9)}`);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (!textToSend) setInput("");
    
    // Add user message
    const userMsg = {
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await askAIAssistant(query, sessionId);
      const assistantMsg = {
        role: "assistant",
        content: res.response,
        category: res.category,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      let errMsg = "AI service is temporarily unavailable.";
      if (err.response) {
        const data = err.response.data;
        if (data && typeof data === "object") {
          if (data.error) {
            errMsg = data.error;
          } else if (data.detail && typeof data.detail === "string") {
            errMsg = data.detail;
          }
        }
      } else if (err.message) {
        errMsg = err.message;
      }

      // Map to Phase 7 required friendly messages
      if (errMsg.includes("Internal Server Error") || errMsg.includes("unexpected error") || errMsg.includes("500") || errMsg.includes("unavailable") || errMsg.includes("error")) {
        errMsg = "AI service is temporarily unavailable.";
      }
      
      const isRagQuery = query.toLowerCase().includes("policy") || query.toLowerCase().includes("guideline") || query.toLowerCase().includes("sop") || errMsg.toLowerCase().includes("knowledge");
      if (isRagQuery) {
        errMsg = "Knowledge base is currently unavailable.";
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errMsg,
          category: "GENERAL",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
          failedQuery: query
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { text: "List diabetic patients above age 50", type: "db" },
    { text: "What is the policy for insurance pre-authorization?", type: "policy" },
    { text: "Show total billing amount group by status", type: "db" },
    { text: "Tell me how to manage a critical high blood pressure reading", type: "general" }
  ];

  // Helper to format text with simple HTML equivalents (bolding, newlines, bullet points)
  const formatResponse = (text) => {
    if (!text) return "";
    
    // Split into lines
    const lines = text.split("\n");
    return lines.map((line, index) => {
      let formattedLine = line;
      
      // Handle bold text (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(formattedLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(formattedLine.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < formattedLine.length) {
        parts.push(formattedLine.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : formattedLine;

      // Handle lists (lines starting with - or * or digit.)
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={index} className="ml-6 list-disc my-1 text-slate-700">
            {typeof content === "string" ? content.replace(/^[-*]\s+/, "") : content}
          </li>
        );
      }
      
      if (/^\d+\.\s+/.test(line.trim())) {
        return (
          <li key={index} className="ml-6 list-decimal my-1 text-slate-700">
            {typeof content === "string" ? content.replace(/^\d+\.\s+/, "") : content}
          </li>
        );
      }

      return (
        <p key={index} className="min-h-[1.25rem] my-1 text-slate-700 leading-relaxed">
          {content}
        </p>
      );
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "SQL":
        return <span className="flex items-center text-xs font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-150"><FaDatabase className="mr-1.5" /> Database Query</span>;
      case "RAG":
        return <span className="flex items-center text-xs font-semibold px-2 py-1 rounded bg-teal-50 text-teal-700 border border-teal-150"><FaBook className="mr-1.5" /> SOP Knowledge Base</span>;
      default:
        return <span className="flex items-center text-xs font-semibold px-2 py-1 rounded bg-slate-155 text-slate-700 border border-slate-200"><FaGlobe className="mr-1.5" /> General AI Response</span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <FaRobot className="text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">MediPulse Clinical AI Assistant</h3>
            <p className="text-[10px] text-blue-100 flex items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Synchronized with DB & SOP Policy Index
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] bg-white/10 text-white font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Gemini 1.5 Flash
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex items-start max-w-3xl space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white" 
                  : "bg-white border border-slate-200 text-blue-600"
              }`}>
                {msg.role === "user" ? <FaUser className="text-xs" /> : <FaRobot className="text-xs" />}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col space-y-1">
                <div className={`px-5 py-3.5 rounded-2xl shadow-sm border ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white border-blue-600 rounded-tr-none"
                    : msg.isError
                      ? "bg-red-50 text-red-800 border-red-200 rounded-tl-none animate-shake"
                      : "bg-white text-slate-800 border-slate-200/80 rounded-tl-none"
                }`}>
                  {msg.role === "user" ? (
                    <p className="text-sm font-medium leading-relaxed break-words">{msg.content}</p>
                  ) : (
                    <div className="text-sm space-y-1">
                      {formatResponse(msg.content)}
                      {msg.isError && (
                        <div className="mt-2 pt-2 border-t border-red-100 flex items-center">
                          <button
                            type="button"
                            onClick={() => handleSend(msg.failedQuery)}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-[10px] font-bold rounded-lg border border-red-200 transition-all duration-150 cursor-pointer"
                          >
                            Retry Query
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Meta details */}
                <div className={`flex items-center text-[10px] text-slate-400 mt-1 space-x-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <span>{msg.timestamp}</span>
                  {msg.role !== "user" && msg.category && (
                    <>
                      <span>•</span>
                      {getCategoryIcon(msg.category)}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start max-w-xl space-x-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0">
                <FaRobot className="text-xs animate-bounce" />
              </div>
              <div className="bg-white border border-slate-200/80 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-xs font-semibold text-slate-400">AI is formulating response...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Prompts */}
      {messages.length === 1 && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200/60">
          <div className="flex items-center space-x-2 mb-2 text-xs font-bold text-slate-400">
            <FaRegLightbulb className="text-amber-500 text-sm" />
            <span>SUGGESTED QUERIES</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s.text)}
                className="text-left px-3.5 py-2.5 rounded-lg border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/20 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-all duration-200 cursor-pointer shadow-sm"
              >
                {s.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 bg-white border-t border-slate-200/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask anything about patients, bills, appointments, or policies..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl shadow-md shadow-blue-500/10 transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <FaPaperPlane className="text-sm" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
