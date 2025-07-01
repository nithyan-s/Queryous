import React, { useState, useEffect } from "react";
import { User, BotMessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { VegaLite } from 'react-vega';
import MessageActions from "./MessageActions.jsx";

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
  const [rowsPerPage] = useState(10); // Fixed rows per page
  
  // Calculate pagination
  const totalRows = message.data ? message.data.length : 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const currentData = message.data ? message.data.slice(startIndex, endIndex) : [];

  useEffect(() => {
    if (message.data && message.data.length > 0) {
      
      try {
        // Create spec directly here instead of relying on graphHelper
        const columns = Object.keys(message.data[0]);
        if (columns.length < 2) {
          console.warn('Insufficient columns for chart');
          setCurrentSpec(null);
          return;
        }
        
        const [xField, yField] = columns;
        let spec = null;
        
        // Create VegaLite spec based on chart type
        switch (chartType) {
          case 'bar':
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v5.json",
              data: { values: message.data },
              mark: { 
                type: 'bar',
                color: darkMode ? "#9ca3af" : "#4b5563"
              },
              encoding: {
                x: { field: xField, type: 'nominal', axis: { labelAngle: -45 } },
                y: { field: yField, type: 'quantitative' }
              },
              width: 500,
              height: 300
            };
            break;
            
          case 'line':
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v5.json",
              data: { values: message.data },
              mark: { 
                type: 'line',
                color: darkMode ? "#9ca3af" : "#4b5563",
                strokeWidth: 2,
                point: true
              },
              encoding: {
                x: { field: xField, type: 'ordinal' },
                y: { field: yField, type: 'quantitative' }
              },
              width: 500,
              height: 300
            };
            break;
            
          case 'scatter':
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v5.json",
              data: { values: message.data },
              mark: { 
                type: 'point',
                color: darkMode ? "#9ca3af" : "#4b5563",
                size: 60
              },
              encoding: {
                x: { field: xField, type: 'quantitative' },
                y: { field: yField, type: 'quantitative' }
              },
              width: 500,
              height: 300
            };
            break;
            
          case 'area':
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v5.json",
              data: { values: message.data },
              mark: { 
                type: 'area',
                color: darkMode ? "#9ca3af" : "#4b5563",
                opacity: 0.7
              },
              encoding: {
                x: { field: xField, type: 'ordinal' },
                y: { field: yField, type: 'quantitative' }
              },
              width: 500,
              height: 300
            };
            break;
            
          case 'pie':
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v5.json",
              data: { values: message.data },
              mark: { type: 'arc', tooltip: true },
              encoding: {
                theta: { field: yField, type: 'quantitative' },
                color: { 
                  field: xField, 
                  type: 'nominal',
                  scale: {
                    range: darkMode 
                      ? ["#9ca3af", "#6b7280", "#4b5563", "#374151", "#d1d5db", "#f3f4f6"]
                      : ["#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db"]
                  }
                }
              },
              width: 500,
              height: 300,
              view: { stroke: null }
            };
            break;
            
          default:
            spec = {
              $schema: "https://vega.github.io/schema/vega-lite/v5.json",
              data: { values: message.data },
              mark: { 
                type: 'bar',
                color: darkMode ? "#9ca3af" : "#4b5563"
              },
              encoding: {
                x: { field: xField, type: 'nominal', axis: { labelAngle: -45 } },
                y: { field: yField, type: 'quantitative' }
              },
              width: 500,
              height: 300
            };
        }
        
        if (spec) {
          // Apply global theming
          spec.background = darkMode ? "#1f2937" : "#ffffff";
          spec.config = {
            axis: {
              domainColor: darkMode ? "#d1d5db" : "#374151",
              tickColor: darkMode ? "#d1d5db" : "#374151",
              labelColor: darkMode ? "#f3f4f6" : "#1f2937",
              titleColor: darkMode ? "#f3f4f6" : "#1f2937",
              gridColor: darkMode ? "#374151" : "#e5e7eb",
            },
            legend: {
              labelColor: darkMode ? "#f3f4f6" : "#1f2937",
              titleColor: darkMode ? "#f3f4f6" : "#1f2937",
            }
          };
          
          console.log('Generated spec:', spec);
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

  // Reset pagination when data changes
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

  // Debug function to test chart rendering
  const createTestChart = () => {
    const testData = [
      { category: 'A', value: 28 },
      { category: 'B', value: 55 },
      { category: 'C', value: 43 },
      { category: 'D', value: 91 },
      { category: 'E', value: 81 }
    ];
    
    const testSpec = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      data: { values: testData },
      mark: 'bar',
      encoding: {
        x: { field: 'category', type: 'nominal' },
        y: { field: 'value', type: 'quantitative' }
      },
      width: 500,
      height: 300
    };
    
    setCurrentSpec(testSpec);
  };

  
  return (
    <div
      className={`flex ${
        message.type === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex max-w-[85%] ${
          message.type === "user" ? "flex-row-reverse" : "flex-row"
        }`}
      >        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
            message.type === "user"
              ? darkMode
                ? "bg-white text-black ml-4"
                : "bg-black text-white ml-4"
              : darkMode
                ? "bg-black text-white mr-4"
                : "bg-white text-black mr-4 border border-gray-300"
          }`}
        >
          {message.type === "user" ? (
            <User className="w-5 h-5" />
          ) : (
            <BotMessageSquare className="w-5 h-5" />
          )}
        </div>
        <div
          className={`rounded-lg px-6 py-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
            message.type === "user"
              ? darkMode
                ? "bg-white text-black"
                : "bg-black text-white"
              : darkMode
              ? "bg-gray-800 text-gray-100 border border-gray-700"
              : "bg-white text-gray-900 border border-gray-200"
          }`}
        >
          <div className="text-sm leading-relaxed">{message.content}</div>

          {message.imageUrl && (
            <div className="mt-4">
              <img
                src={message.imageUrl}
                alt="Data visualization"
                className="rounded-xl max-w-full h-auto shadow-lg"
              />
            </div>
          )}

          <MessageActions
            darkMode={darkMode}
            message={message}
            showSqlToggle={showSqlToggle}
            toggleSqlQuery={toggleSqlQuery}
            generateGraph={generateGraph}
          />          {showSqlToggle[message.id] && message.sqlQuery && (
            <div
              className={`mt-3 p-3 rounded-lg text-xs font-mono transition-all ${
                darkMode
                  ? "bg-gray-900 text-gray-300 border border-gray-700"
                  : "bg-gray-50 text-gray-800 border border-gray-200"
              }`}
            >
              {message.sqlQuery}
            </div>
          )}{/* Render Table if Data Exists */}
          {message.data && message.data.length > 0 && (
            <div className="mt-4">
              {/* Table */}
              <div className="overflow-x-auto">
                <table
                  className={`min-w-full text-sm border-collapse rounded-lg shadow-md ${
                    darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
                  }`}
                >
                  <thead>
                    <tr>
                      {Object.keys(message.data[0]).map((key) => (
                        <th
                          key={key}
                          className={`px-4 py-2 border-b font-semibold ${
                            darkMode ? "border-gray-700" : "border-gray-300"
                          }`}
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((row, rowIndex) => (
                      <tr key={startIndex + rowIndex} className={`${
                        darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                      }`}>
                        {Object.values(row).map((value, colIndex) => (
                          <td
                            key={colIndex}
                            className={`px-4 py-2 border-b ${
                              darkMode ? "border-gray-700" : "border-gray-300"
                            }`}
                          >
                            {value !== null ? value.toString() : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className={`mt-4 flex items-center justify-between text-sm ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}>
                  <div>
                    Showing {startIndex + 1}-{endIndex} of {totalRows} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                      className={`flex items-center px-3 py-1 rounded border transition-all ${
                        currentPage === 0
                          ? darkMode 
                            ? "bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                          : darkMode
                            ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                            : "bg-white text-black border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </button>
                    
                    <span className={`px-3 py-1 ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}>
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages - 1}
                      className={`flex items-center px-3 py-1 rounded border transition-all ${
                        currentPage === totalPages - 1
                          ? darkMode 
                            ? "bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed"
                            : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                          : darkMode
                            ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                            : "bg-white text-black border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}          {/* Graph Dropdown + VegaLite */}
          {message.data && message.data.length > 0 && (
            <div className="mt-4">              <div className="flex items-center space-x-2 mb-3">
                <label className={`text-sm font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  Chart Type:
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className={`px-3 py-1 border rounded text-sm transition-all ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-gray-500"
                      : "bg-white border-gray-300 text-black focus:ring-gray-400"
                  } focus:ring-2 focus:border-transparent`}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="scatter">Scatter Plot</option>
                </select>
              </div>{currentSpec && (
                <div className={`w-full max-w-full overflow-hidden rounded-lg border shadow-lg ${
                  darkMode 
                    ? "border-gray-700 bg-gray-800" 
                    : "border-gray-300 bg-white"
                }`}>
                  <div className="p-4">
                    <div className="w-full min-h-[320px] flex items-center justify-center">
                      <VegaLite 
                        spec={currentSpec} 
                        actions={false}
                        renderer="svg"
                        onError={(error) => {
                          console.error('VegaLite error:', error);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {!currentSpec && message.data && message.data.length > 0 && (
                <div className={`w-full p-4 text-center rounded-lg border ${
                  darkMode 
                    ? "border-gray-700 bg-gray-800 text-gray-300" 
                    : "border-gray-300 bg-gray-50 text-gray-600"
                }`}>
                  Unable to generate chart for the selected data and chart type.
                </div>
              )}
            </div>
          )}          <div
            className={`text-xs mt-2 ${
              message.type === "user"
                ? darkMode
                  ? "text-black"
                  : "text-white"
                : darkMode
                ? "text-gray-400"
                : "text-gray-500"
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
