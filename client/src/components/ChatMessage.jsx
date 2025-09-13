import React, { useState, useEffect } from "react";
import { User, BotMessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { VegaLite } from 'react-vega';
import MessageActions from "./MessageActions.jsx";

// Ensure Vega-Lite is properly configured
import * as vega from 'vega';
import * as vegaLite from 'vega-lite';

const ChatMessage = ({
  message,
  darkMode,
  showSqlToggle,
  toggleSqlQuery,
  generateGraph,
  graphData,
  showGraph,
  toggleGraph,
}) => {
  const [chartType, setChartType] = useState("bar");
  const [currentSpec, setCurrentSpec] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(10);
  
  // Calculate pagination
  const totalRows = message.data ? message.data.length : 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const currentData = message.data ? message.data.slice(startIndex, endIndex) : [];

  useEffect(() => {
    if (chartType && message.data && Array.isArray(message.data) && message.data.length > 0) {
      try {
        console.log('Creating chart with:', { chartType, dataLength: message.data.length });
        
        const columns = Object.keys(message.data[0]);
        if (columns.length < 2) {
          console.warn('Insufficient columns for chart:', columns);
          setCurrentSpec(null);
          return;
        }
        
        const [xField, yField] = columns;
        let spec = null;
        
        switch (chartType) {
          case 'bar':
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v6.json",
              data: { values: message.data },
              mark: { 
                type: 'bar',
                color: darkMode ? "#3b82f6" : "#6366f1"
              },
              encoding: {
                x: { field: xField, type: 'nominal', axis: { labelAngle: -45 } },
                y: { field: yField, type: 'quantitative' }
              },
              width: 400,
              height: 300
            };
            break;
            
          case 'line':
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v6.json",
              data: { values: message.data },
              mark: { 
                type: 'line',
                color: darkMode ? "#3b82f6" : "#6366f1",
                strokeWidth: 2,
                point: true
              },
              encoding: {
                x: { field: xField, type: 'ordinal' },
                y: { field: yField, type: 'quantitative' }
              },
              width: 400,
              height: 300
            };
            break;
            
          case 'scatter':
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v6.json",
              data: { values: message.data },
              mark: { 
                type: 'point',
                color: darkMode ? "#3b82f6" : "#6366f1",
                size: 60
              },
              encoding: {
                x: { field: xField, type: 'quantitative' },
                y: { field: yField, type: 'quantitative' }
              },
              width: 400,
              height: 300
            };
            break;
            
          case 'area':
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v6.json",
              data: { values: message.data },
              mark: { 
                type: 'area',
                color: darkMode ? "#3b82f6" : "#6366f1",
                opacity: 0.7
              },
              encoding: {
                x: { field: xField, type: 'ordinal' },
                y: { field: yField, type: 'quantitative' }
              },
              width: 400,
              height: 300
            };
            break;
            
          case 'pie':
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v6.json",
              data: { values: message.data },
              mark: { type: 'arc', tooltip: true },
              encoding: {
                theta: { field: yField, type: 'quantitative' },
                color: { 
                  field: xField, 
                  type: 'nominal',
                  scale: {
                    range: darkMode 
                      ? ["#3b82f6", "#1d4ed8", "#2563eb", "#1e40af", "#1e3a8a"]
                      : ["#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81"]
                  }
                }
              },
              width: 400,
              height: 300,
              view: { stroke: null }
            };
            break;
            
          default:
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v6.json",
              data: { values: message.data },
              mark: { 
                type: 'bar',
                color: darkMode ? "#3b82f6" : "#6366f1"
              },
              encoding: {
                x: { field: xField, type: 'nominal', axis: { labelAngle: -45 } },
                y: { field: yField, type: 'quantitative' }
              },
              width: 400,
              height: 300
            };
        }
        
        if (spec) {
          spec.background = darkMode ? "#1e293b" : "#ffffff";
          spec.autosize = {
            type: "fit",
            contains: "padding"
          };
          spec.config = {
            view: { strokeWidth: 0 },
            axis: {
              domainColor: darkMode ? "#3b82f6" : "#6366f1",
              tickColor: darkMode ? "#3b82f6" : "#6366f1",
              labelColor: darkMode ? "#e2e8f0" : "#1e293b",
              titleColor: darkMode ? "#e2e8f0" : "#1e293b",
              gridColor: darkMode ? "#334155" : "#e2e8f0",
            },
            legend: {
              labelColor: darkMode ? "#e2e8f0" : "#1e293b",
              titleColor: darkMode ? "#e2e8f0" : "#1e293b",
            }
          };
          
          console.log('Generated chart spec:', spec);
          console.log('Chart data length:', message.data?.length);
          console.log('Chart type:', chartType);
          setCurrentSpec(spec);
        } else {
          setCurrentSpec(null);
        }
      } catch (error) {
        console.error('Error creating chart spec:', error);
        setCurrentSpec(null);
      }
    } else {
      setCurrentSpec(null);
    }
  }, [chartType, message.data, darkMode]);

  useEffect(() => {
    setCurrentPage(0);
  }, [message.data]);

  const formatTimestamp = (timestamp) =>
    new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div
      className={`flex px-2 sm:px-4 ${
        message.type === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex w-full max-w-[95%] sm:max-w-[85%] lg:max-w-[80%] xl:max-w-[75%] ${
          message.type === "user" ? "flex-row-reverse" : "flex-row"
        }`}
      >        
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-transform duration-300 ${
            message.type === "user" ? "ml-2 sm:ml-4" : "mr-2 sm:mr-4"
          }`}
          style={{
            background: message.type === "user"
              ? (darkMode 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)')
              : (darkMode
                  ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                  : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'),
            border: message.type === "bot" && !darkMode ? '1px solid rgba(99, 102, 241, 0.2)' : 'none'
          }}
        >
          {message.type === "user" ? (
            <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          ) : (
            <BotMessageSquare className={`w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? 'text-blue-300' : 'text-indigo-600'}`} />
          )}
        </div>

        {/* Message Content */}
        <div
          className={`rounded-2xl px-3 py-3 sm:px-6 sm:py-4 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
            message.type === "user"
              ? "text-white"
              : darkMode
              ? "text-blue-50"
              : "text-slate-900"
          }`}
          style={{
            background: message.type === "user"
              ? (darkMode 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)')
              : (darkMode
                  ? 'rgba(30, 41, 59, 0.8)'
                  : 'rgba(255, 255, 255, 0.9)'),
            border: message.type === "bot" 
              ? (darkMode 
                  ? '1px solid rgba(59, 130, 246, 0.2)'
                  : '1px solid rgba(99, 102, 241, 0.2)')
              : 'none',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Message Text */}
          <div className="text-xs sm:text-sm leading-relaxed break-words">{message.content}</div>

          {/* Image if exists */}
          {message.imageUrl && (
            <div className="mt-3 sm:mt-4">
              <img
                src={message.imageUrl}
                alt="Data visualization"
                className="rounded-xl max-w-full h-auto shadow-lg"
              />
            </div>
          )}

          {/* Message Actions */}
          <MessageActions
            darkMode={darkMode}
            message={message}
            showSqlToggle={showSqlToggle}
            toggleSqlQuery={toggleSqlQuery}
            generateGraph={generateGraph}
          />          

          {/* SQL Query Display */}
          {showSqlToggle[message.id] && message.sqlQuery && (
            <div
              className={`mt-3 p-3 sm:p-4 rounded-xl text-xs font-mono transition-all break-all ${
                darkMode ? "text-blue-200 border" : "text-indigo-800 border"
              }`}
              style={{
                background: darkMode 
                  ? 'rgba(15, 23, 42, 0.6)'
                  : 'rgba(248, 250, 252, 0.8)',
                borderColor: darkMode 
                  ? 'rgba(59, 130, 246, 0.2)'
                  : 'rgba(99, 102, 241, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {message.sqlQuery}
            </div>
          )}

          {/* Data Table */}
          {message.data && message.data.length > 0 && (
            <div className="mt-3 sm:mt-4">
              <div className="overflow-x-auto -mx-3 sm:-mx-6">
                <div className="min-w-full inline-block align-middle">
                  <table
                    className={`min-w-full text-xs sm:text-sm border-collapse rounded-xl shadow-lg overflow-hidden ${
                      darkMode ? "text-blue-50" : "text-slate-900"
                    }`}
                    style={{
                      background: darkMode 
                        ? 'rgba(30, 41, 59, 0.8)'
                        : 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <thead>
                      <tr>
                        {Object.keys(message.data[0]).map((key) => (
                          <th
                            key={key}
                            className={`px-2 py-2 sm:px-4 sm:py-3 border-b font-semibold text-left whitespace-nowrap ${
                              darkMode ? "border-blue-500/20" : "border-indigo-500/20"
                            }`}
                            style={{
                              background: darkMode 
                                ? 'rgba(59, 130, 246, 0.1)'
                                : 'rgba(99, 102, 241, 0.1)'
                            }}
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.map((row, rowIndex) => (
                        <tr key={startIndex + rowIndex} className={`transition-all duration-200 ${
                          darkMode ? "hover:bg-blue-500/10" : "hover:bg-indigo-500/10"
                        }`}>
                          {Object.values(row).map((value, colIndex) => (
                            <td
                              key={colIndex}
                              className={`px-2 py-2 sm:px-4 sm:py-3 border-b whitespace-nowrap ${
                                darkMode ? "border-blue-500/10" : "border-indigo-500/10"
                              }`}
                            >
                              <div className="max-w-[150px] sm:max-w-[200px] truncate">
                                {value !== null ? value.toString() : "—"}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className={`mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm gap-2 sm:gap-0 ${
                  darkMode ? "text-blue-200/70" : "text-indigo-600/70"
                }`}>
                  <div className="text-center sm:text-left">
                    Showing {startIndex + 1}-{endIndex} of {totalRows} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                      className={`flex items-center px-2 py-1 sm:px-4 sm:py-2 rounded-xl border transition-all duration-200 hover:scale-105 text-xs sm:text-sm ${
                        currentPage === 0 ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"
                      }`}
                      style={{
                        background: currentPage === 0 
                          ? 'rgba(156, 163, 175, 0.3)'
                          : darkMode
                            ? 'rgba(59, 130, 246, 0.1)'
                            : 'rgba(99, 102, 241, 0.1)',
                        borderColor: darkMode 
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(99, 102, 241, 0.2)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </button>
                    
                    <span 
                      className={`px-2 py-1 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm ${darkMode ? "text-blue-200" : "text-indigo-700"}`}
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
                      <span className="hidden sm:inline">Page {currentPage + 1} of {totalPages}</span>
                      <span className="sm:hidden">{currentPage + 1}/{totalPages}</span>
                    </span>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages - 1}
                      className={`flex items-center px-2 py-1 sm:px-4 sm:py-2 rounded-xl border transition-all duration-200 hover:scale-105 text-xs sm:text-sm ${
                        currentPage === totalPages - 1 ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg"
                      }`}
                      style={{
                        background: currentPage === totalPages - 1 
                          ? 'rgba(156, 163, 175, 0.3)'
                          : darkMode
                            ? 'rgba(59, 130, 246, 0.1)'
                            : 'rgba(99, 102, 241, 0.1)',
                        borderColor: darkMode 
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(99, 102, 241, 0.2)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span className="sm:hidden">Next</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chart Visualization */}
          {message.data && message.data.length > 0 && (
            <div className="mt-3 sm:mt-4">              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
                <label className={`text-xs sm:text-sm font-medium ${
                  darkMode ? "text-blue-200" : "text-indigo-700"
                }`}>
                  Chart Type:
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className={`px-2 py-1 sm:px-3 sm:py-2 border rounded-xl text-xs sm:text-sm transition-all focus:ring-2 focus:border-transparent ${
                    darkMode
                      ? "text-blue-100 focus:ring-blue-500/50"
                      : "text-indigo-900 focus:ring-indigo-500/50"
                  }`}
                  style={{
                    background: darkMode 
                      ? 'rgba(30, 41, 59, 0.8)'
                      : 'rgba(255, 255, 255, 0.9)',
                    borderColor: darkMode 
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(99, 102, 241, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="scatter">Scatter Plot</option>
                </select>
              </div>

              {/* Chart Display */}
              {currentSpec && (
                <div 
                  className="w-full max-w-full overflow-hidden rounded-2xl border shadow-xl"
                  style={{
                    borderColor: darkMode 
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(99, 102, 241, 0.2)',
                    background: darkMode 
                      ? 'rgba(30, 41, 59, 0.8)'
                      : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="p-3 sm:p-6">
                    <div className="w-full" style={{ minHeight: '350px', maxWidth: '500px', margin: '0 auto' }}>
                      <VegaLite 
                        spec={currentSpec} 
                        actions={false}
                        renderer="svg"
                        mode="vega-lite"
                        onError={(error) => {
                          console.error('VegaLite error:', error);
                        }}
                        onSignalTooltip={(name, value) => {
                          console.log('VegaLite tooltip:', name, value);
                        }}
                        onNewView={(view) => {
                          console.log('VegaLite view created:', view);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {!currentSpec && message.data && message.data.length > 0 && (
                <div 
                  className={`w-full p-3 sm:p-4 text-center rounded-xl border text-xs sm:text-sm ${
                    darkMode ? "text-blue-300" : "text-indigo-600"
                  }`}
                  style={{
                    borderColor: darkMode 
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(99, 102, 241, 0.2)',
                    background: darkMode 
                      ? 'rgba(30, 41, 59, 0.6)'
                      : 'rgba(248, 250, 252, 0.8)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  Unable to generate chart for the selected data and chart type.
                </div>
              )}
            </div>
          )}          

          {/* Timestamp */}
          <div
            className={`text-xs mt-2 ${
              message.type === "user"
                ? "text-white/70"
                : darkMode
                ? "text-blue-200/60"
                : "text-indigo-600/60"
            }`}
          >
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
