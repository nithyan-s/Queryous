import React, { useState } from 'react';
import { Database, X, Upload } from 'lucide-react';
import { GrMysql } from 'react-icons/gr';
import { BiLogoPostgresql } from 'react-icons/bi';

const ConnectModal = ({
  darkMode,
  dbCredentials,
  setDbCredentials,
  showConnectModal,
  setShowConnectModal,
  handleConnectDb,
  handleDisconnectDb,
  connectedDb,
  isConnecting,
  csvMode,
  handleCsvUpload,
  csvUploading,
  handleClearCsv,
  showNotification
}) => {
  const [activeTab, setActiveTab] = useState('database');
  const [selectedFile, setSelectedFile] = useState(null);
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      showNotification('error', 'Invalid File', 'Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (selectedFile && handleCsvUpload) {
      await handleCsvUpload(selectedFile);
      setSelectedFile(null);
      setActiveTab('database'); // Switch back to show status
    }
  };

  if (!showConnectModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-10">
      <div className={`w-full max-w-md rounded-lg shadow-xl transition-all ${
        darkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-gray-300'
      }`}>
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-black'}`} />
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Data Connection
              </h3>
            </div>
            <button
              onClick={() => setShowConnectModal(false)}
              className={`p-1 rounded-md ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              aria-label="Close connect modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-300">
            <button
              onClick={() => setActiveTab('database')}
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                activeTab === 'database'
                  ? darkMode 
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'border-b-2 border-blue-500 text-blue-600'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Database
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`flex-1 py-2 px-4 text-sm font-medium ${
                activeTab === 'csv'
                  ? darkMode 
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'border-b-2 border-blue-500 text-blue-600'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              CSV Upload
            </button>
          </div>

          {/* Database Connection Tab */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              {csvMode && (
                <div className={`p-3 rounded-md ${darkMode ? 'bg-green-900/20 border border-green-500' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                    ✅ CSV mode is active. You can now query your uploaded data!
                  </p>
                  <button
                    onClick={handleClearCsv}
                    className={`mt-2 text-xs px-2 py-1 rounded ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                  >
                    Clear CSV Data
                  </button>
                </div>
              )}

              {!csvMode && (
                <>
                  {/* Database Type Selector */}
                  <div className="space-y-1">
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Database Type:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['mysql', 'postgresql'].map((type) => {
                        const isSelected = dbCredentials.type === type;
                        const Icon = type === 'mysql' ? GrMysql : BiLogoPostgresql;
                        return (
                          <label key={type} className={`flex items-center space-x-2 p-2 rounded-md border cursor-pointer text-sm ${
                            darkMode
                              ? `border-gray-600 hover:border-gray-500 ${isSelected ? 'bg-gray-700 border-white' : ''}`
                              : `border-gray-300 hover:border-gray-400 ${isSelected ? 'bg-gray-100 border-black' : ''}`
                          }`}>
                            <input
                              type="radio"
                              name="type"
                              value={type}
                              checked={isSelected}
                              onChange={(e) => setDbCredentials(prev => ({ ...prev, type: e.target.value }))}
                              className="hidden"
                            />
                            <Icon className={`text-base ${isSelected ? (darkMode ? 'text-white' : 'text-black') : 'text-gray-400'}`} />
                            <span className={`${isSelected ? (darkMode ? 'text-white' : 'text-black') : darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3">
                    {['url', 'name', 'username', 'password'].map((field) => {
                      const labels = {
                        url: 'Host URL',
                        name: 'Database Name',
                        username: 'Username',
                        password: 'Password'
                      };
                      const type = field === 'password' ? 'password' : 'text';
                      const placeholder = {
                        url: 'jdbc:mysql://localhost:5432/...',
                        name: 'my_database',
                        username: 'username',
                        password: 'password'
                      }[field];
                      return (
                        <div key={field}>
                          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {labels[field]}
                          </label>
                          <input
                            type={type}
                            value={dbCredentials[field]}
                            onChange={(e) => setDbCredentials(prev => ({ ...prev, [field]: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-md border text-sm focus:ring-2 focus:border-transparent ${
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-gray-400'
                            }`}
                            placeholder={placeholder}
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Footer Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowConnectModal(false)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
                    darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Close
                </button>
                {!csvMode && (
                  <>
                    {connectedDb ? (
                      <button
                        onClick={handleDisconnectDb}
                        className="flex-1 py-2 px-3 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-all"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectDb}
                        disabled={isConnecting}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all disabled:opacity-50 ${
                          darkMode
                            ? 'bg-white text-black hover:bg-gray-100'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* CSV Upload Tab */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              {connectedDb && (
                <div className={`p-3 rounded-md ${darkMode ? 'bg-yellow-900/20 border border-yellow-500' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    Database is connected. Disconnect to upload CSV files.
                  </p>
                </div>
              )}

              {!connectedDb && (
                <>
                  <div className="space-y-2">
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Upload CSV File
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Upload a CSV file to analyze your data with natural language queries
                    </p>
                  </div>

                  <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    darkMode 
                      ? 'border-gray-600 hover:border-gray-500' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <Upload className={`mx-auto h-8 w-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <div className="space-y-2">
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedFile ? selectedFile.name : 'Select a CSV file'}
                      </p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className={`inline-block px-4 py-2 text-sm font-medium rounded-md cursor-pointer ${
                          darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Choose File
                      </label>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedFile(null)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
                          darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={csvUploading}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all disabled:opacity-50 ${
                          darkMode
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {csvUploading ? 'Uploading...' : 'Upload & Analyze'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;
