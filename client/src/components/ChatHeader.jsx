import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Moon, Sun, Plus, Download, Database } from "lucide-react";

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
  showNotification
}) => {
  const navigate = useNavigate();
  
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

  return (
  <div
      className={`border-b transition-all duration-300 ${
        darkMode
          ? "bg-gray-800 border-gray-700 shadow-lg"
          : "bg-white border-gray-200 shadow-lg"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
            darkMode ? "bg-white" : "bg-black"
          }`}>
            <Bot className={`w-6 h-6 ${darkMode ? "text-black" : "text-white"}`} />
          </div>
          <div>            <h1 className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-black"
            }`}>
              Data Analytics Assistant {csvMode && <span className="text-sm font-normal text-blue-500">(CSV Mode)</span>}
            </h1>
            <p
              className={`text-sm ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {csvMode 
                ? "Ask questions about your uploaded CSV data in natural language"
                : "Ask questions about your database in natural language"
              }
            </p>
          </div>
        </div>        <div className="flex items-center space-x-3">
          {/* Export Button - show when there's query results to export */}
          {lastSqlQuery && (
            <button
              onClick={handleExport}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:opacity-80 ${
                darkMode
                  ? "bg-green-600 text-white shadow-lg hover:bg-green-700"
                  : "bg-green-500 text-white shadow-lg hover:bg-green-600"
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Connection Status and Controls */}
          {connectedDb ? (
            <button
              onClick={handleDisconnectDb}
              disabled={csvMode} // Disable when in CSV mode
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                csvMode 
                  ? "opacity-50 cursor-not-allowed bg-gray-400 text-white"
                  : darkMode
                    ? "bg-red-600 text-white shadow-lg hover:bg-red-700 hover:opacity-80"
                    : "bg-red-500 text-white shadow-lg hover:bg-red-600 hover:opacity-80"
              }`}
            >
              <span>Disconnect DB</span>
            </button>
          ) : (
            <button
              onClick={() => setShowConnectModal(true)}
              disabled={csvMode && !connectedDb} // Disable when in CSV mode unless switching from DB
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                csvMode 
                  ? "opacity-50 cursor-not-allowed bg-gray-400 text-white"
                  : darkMode
                    ? "bg-white text-black shadow-lg hover:bg-gray-100 hover:opacity-80"
                    : "bg-black text-white shadow-lg hover:bg-gray-800 hover:opacity-80"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>{csvMode ? "CSV Mode Active" : "Connect"}</span>
            </button>
          )}

          <button
            onClick={handleToggleDarkMode}
            className={`p-3 rounded-lg transition-all duration-300 hover:opacity-80 ${
              darkMode
                ? "bg-white text-black shadow-lg hover:bg-gray-100"
                : "bg-black text-white shadow-lg hover:bg-gray-800"
            }`}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
