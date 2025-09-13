import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Moon, Sun, Plus, Download, Database, LogOut, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const ChatHeader = ({
  prompt,
  rawTable,
  messages,
  darkMode,
  setDarkMode,
  setShowConnectModal,
  connectedDb,
  handleDisconnectDb,
  csvMode,
  lastSqlQuery,
  handleExportCsv,
  showNotification,
  sidebarOpen,
  setSidebarOpen,
  isMobile
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const handleDashboardClick = () => {
    navigate("/dashboard", {
      state: { prompt, rawTable, heading: messages.heading },
    });
  };
  const handleExport = () => {
    if (lastSqlQuery && handleExportCsv) {
      const filename = `query_results_${new Date().toISOString().slice(0, 10)}.csv`;
      handleExportCsv(lastSqlQuery, filename);
    } else {
      showNotification && showNotification('warning', 'No Data to Export', 'Please run a query first to generate data for export.');
    }
  };

  // Function to safely toggle dark mode
  const handleToggleDarkMode = () => {
    console.log("ChatHeader: Toggling darkMode, current value:", darkMode);
    console.log("ChatHeader: setDarkMode type:", typeof setDarkMode);
    
    if (typeof setDarkMode === 'function') {
      setDarkMode(!darkMode);
      console.log("ChatHeader: darkMode toggled to", !darkMode);
    } else {
      console.error("ChatHeader: setDarkMode is not a function");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div
      className="border-b transition-all duration-300 relative"
      style={{
        background: darkMode 
          ? 'rgba(15, 23, 42, 0.95)'
          : 'rgba(248, 250, 252, 0.95)',
        backdropFilter: 'blur(20px)',
        borderColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(99, 102, 241, 0.2)',
        boxShadow: darkMode 
          ? '0 10px 40px rgba(59, 130, 246, 0.1)'
          : '0 10px 40px rgba(99, 102, 241, 0.1)'
      }}
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Hamburger Menu Button - ChatGPT style */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              darkMode ? 'text-blue-300 hover:bg-blue-500/10' : 'text-indigo-600 hover:bg-indigo-500/10'
            }`}
            style={{
              background: darkMode 
                ? 'rgba(59, 130, 246, 0.1)'
                : 'rgba(99, 102, 241, 0.1)',
              border: darkMode 
                ? '1px solid rgba(59, 130, 246, 0.2)'
                : '1px solid rgba(99, 102, 241, 0.2)'
            }}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-transform duration-300"
            style={{
              background: darkMode 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
            }}
          >
            <Bot className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">            
            <h1 className={`text-lg sm:text-2xl font-bold ${
              darkMode ? "text-white" : "text-slate-900"
            }`}>
              <span className="hidden sm:inline">Queryous</span>
              <span className="sm:hidden">Queryous</span>
              {csvMode && <span className="text-xs sm:text-sm font-normal text-blue-400 block sm:inline"> (CSV Mode)</span>}
            </h1>
            <p
              className={`text-xs sm:text-sm ${
                darkMode ? "text-blue-200/70" : "text-indigo-600/70"
              }`}
            >
              <span className="hidden sm:inline">
                {csvMode 
                  ? "Ask questions about your uploaded CSV data in natural language"
                  : "Ask questions about your database in natural language"
                }
              </span>
              <span className="sm:hidden">
                {csvMode ? "CSV Mode" : "Database Mode"}
              </span>
            </p>
          </div>
        </div>        <div className="flex items-center space-x-2 sm:space-x-3 justify-end">
          {/* Export Button - show when there's query results to export */}
          {lastSqlQuery && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-xs sm:text-sm"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white'
              }}
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          )}

          {/* Connection Status and Controls */}
          {connectedDb ? (
            <button
              onClick={handleDisconnectDb}
              disabled={csvMode} // Disable when in CSV mode
              className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-xs sm:text-sm ${
                csvMode 
                  ? "opacity-50 cursor-not-allowed bg-gray-400 text-white"
                  : "hover:scale-105"
              }`}
              style={!csvMode ? {
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white'
              } : {}}
            >
              <span className="hidden sm:inline">Disconnect DB</span>
              <span className="sm:hidden">Disconnect</span>
            </button>
          ) : (
            <button
              onClick={() => setShowConnectModal(true)}
              disabled={csvMode && !connectedDb} // Disable when in CSV mode unless switching from DB
              className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-xs sm:text-sm ${
                csvMode 
                  ? "opacity-50 cursor-not-allowed bg-gray-400 text-white"
                  : "hover:scale-105"
              }`}
              style={!csvMode ? {
                background: darkMode 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: 'white'
              } : {}}
            >
              <Database className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{csvMode ? "CSV Mode Active" : "Connect"}</span>
              <span className="sm:hidden">{csvMode ? "CSV" : "Connect"}</span>
            </button>
          )}

          {/* User Info and Logout */}
          {user && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg" 
                   style={{
                     background: darkMode 
                       ? 'rgba(59, 130, 246, 0.1)'
                       : 'rgba(99, 102, 241, 0.1)',
                     border: darkMode 
                       ? '1px solid rgba(59, 130, 246, 0.2)'
                       : '1px solid rgba(99, 102, 241, 0.2)'
                   }}>
                <User className="w-4 h-4 text-blue-400" />
                <span className={`text-sm font-medium ${
                  darkMode ? 'text-blue-200' : 'text-indigo-600'
                }`}>
                  {user.username}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 text-sm"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white'
                }}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}

          <button
            onClick={handleToggleDarkMode}
            className="p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            style={{
              background: darkMode 
                ? 'rgba(59, 130, 246, 0.1)'
                : 'rgba(99, 102, 241, 0.1)',
              border: darkMode 
                ? '1px solid rgba(59, 130, 246, 0.2)'
                : '1px solid rgba(99, 102, 241, 0.2)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
