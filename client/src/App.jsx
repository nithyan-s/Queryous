/* * App.jsx
  Main application component that handles routing, state management, and core functionality
  for the data analytics chat bot project.
*/

import React, { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Chat from "./pages/Chat.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import Notification from "./components/Notification.jsx";
import ConfirmationModal from "./components/ConfirmationModal.jsx";
import animations from "./styles/animation.js";
import useAutoScroll from "./hooks/useAutoScroll.js";
import { getSessionById, updateSessionMessages, createNewSession } from "./utils/sessionHelper.js";

const App = () => {
  const [theme, colorMode] = useMode();
  
  // Add darkMode state for the chat interface
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage or default to true
    const savedDarkMode = localStorage.getItem('darkMode');
    return savedDarkMode !== null ? JSON.parse(savedDarkMode) : true;
  });
  
  // Debug darkMode state
  console.log("App component darkMode:", darkMode);
  console.log("App component setDarkMode type:", typeof setDarkMode);
  
  // Save darkMode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  
  // Initialize messages from session storage or set default welcome message
  const [messages, setMessages] = useState(() => {
    return [
      {
        id: 1,
        type: "bot",
        content: `Hi! I'm your data analytics assistant. Ask me anything about your database - like "Show sales trends" or "What are the top products?"`,
        timestamp: new Date(),
        sqlQuery: null,
      },
    ];
  });

  // ===== UI STATE =====
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // ===== SESSION STATE =====
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // ===== DATABASE CONNECTION STATE =====
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [dbCredentials, setDbCredentials] = useState({
    type: "",
    url: "",
    name: "",
    username: "",
    password: "",
  });
  const [connectedDb, setConnectedDb] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // ===== CSV STATE =====
  const [csvMode, setCsvMode] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [lastSqlQuery, setLastSqlQuery] = useState("");

  // ===== NOTIFICATION STATE =====
  const [notification, setNotification] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning"
  });

  // ===== VISUALIZATION STATE =====
  const [showSqlToggle, setShowSqlToggle] = useState({});
  const [graphData, setGraphData] = useState({});
  const [showGraphForMessage, setShowGraphForMessage] = useState({});

  // ===== DATA STATE =====
  const [rawTable, setRawTable] = useState([]);
  const [title, setTitle] = useState("");

  // ===== REFS =====
  const inputRef = useRef(null);
  const messagesEndRef = useAutoScroll([messages]);

  // ===== EFFECTS =====
  // Handle initial loading screen
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // ===== SESSION PERSISTENCE =====
  
  // Save messages to current session when messages change
  useEffect(() => {
    if (messages.length > 1 && currentSessionId) { 
      // Save to the current session
      updateSessionMessages(currentSessionId, messages);
      
      // Update session title based on first user message if not set
      const session = getSessionById(currentSessionId);
      const firstUserMessage = messages.find(msg => msg.type === "user");
      if (firstUserMessage && session && session.title === "New Chat") {
        const sessionTitle = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "");
        const updatedSession = { ...session, title: sessionTitle };
        // Update the session with new title
        updateSessionMessages(currentSessionId, messages);
      }
    }
    
    // Also save to general session storage for backup
    sessionStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages, currentSessionId]);

  // ===== NOTIFICATION FUNCTIONS =====
  const showNotification = (type, title, message, duration = 5000) => {
    setNotification({ type, title, message, duration });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const showConfirmation = (title, message, onConfirm, type = "warning") => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const hideConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  };

  // ===== GRAPH FUNCTIONS =====
  /**
   * Toggle graph visibility for a specific message
   * @param {number} messageId - The ID of the message to toggle graph for
   */
  const toggleGraph = (messageId) => {
    setShowGraphForMessage((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  /**
   * Generate graph data for a specific message
   * @param {number} messageId - The ID of the message to generate graph for
   */
  const generateGraph = (messageId) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (message && message.visualization) {
      setGraphData((prev) => ({
        ...prev,
        [messageId]: JSON.parse(message.visualization),
      }));
    }
  };

  /**
   * Toggle SQL query visibility for a specific message
   * @param {number} messageId - The ID of the message to toggle SQL for
   */
  const toggleSqlQuery = (messageId) => {
    setShowSqlToggle((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  // ===== MESSAGE HANDLING =====
  
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // If no current session, create one when user sends first message
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession = createNewSession("New Chat");
      sessionId = newSession._id;
      setCurrentSessionId(sessionId);
    }

    // Create user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
      sqlQuery: null,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      // Send request to backend
      const response = await fetch("http://localhost:8001/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: inputValue }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setTitle(data.title);
      setRawTable(data.data || []);
      setLastSqlQuery(data.sql_query || "");

      // Create bot response message
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: data.response || "Sorry, I couldn't process that request.",
        timestamp: new Date(),
        data: data.data || [],
        visualization: data.visualization || null,
        sqlQuery: data.sql_query || null,
        heading: data.title || null,
      };
      
      setMessages((prev) => [...prev, botMessage]);
      
    } catch (error) {
      console.error("Query error:", error);
      // Handle error with detailed error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "bot",
          content: `Error: ${error.message || "I'm having trouble connecting to the server. Please try again later."}`,
          timestamp: new Date(),
          sqlQuery: null,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle key press events for the input field
   * @param {KeyboardEvent} e - The keyboard event
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ===== CSV HANDLING FUNCTIONS =====
  const handleCsvUpload = async (file) => {
    setCsvUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch("http://localhost:8001/upload-csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setCsvMode(true);
        setConnectedDb(false); // Disconnect from database when CSV is uploaded
        showNotification(
          'success',
          'CSV Upload Successful!',
          `Table "${data.table_name}" uploaded with ${data.rows} rows and ${data.columns.length} columns.`
        );
      } else {
        throw new Error(data.detail || "Upload failed");
      }
    } catch (error) {
      console.error("CSV upload failed:", error);
      showNotification(
        'error',
        'Upload Failed',
        `Failed to upload CSV file: ${error.message}`
      );
    } finally {
      setCsvUploading(false);
    }
  };

  const handleClearCsv = async () => {
    try {
      const response = await fetch("http://localhost:8001/clear-csv", {
        method: "POST",
      });

      if (response.ok) {
        setCsvMode(false);
        showNotification('success', 'CSV Cleared', 'CSV data cleared successfully. You can now connect to a database.');
      }
    } catch (error) {
      console.error("Failed to clear CSV:", error);
      showNotification('error', 'Clear Failed', 'Failed to clear CSV data');
    }
  };

  const handleExportCsv = async (sqlQuery, filename) => {
    try {
      const response = await fetch("http://localhost:8001/export-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql_query: sqlQuery, filename }),
      });

      if (response.ok) {
        // Create download link for the CSV file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('success', 'Export Complete', 'Query results exported successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Export failed");
      }
    } catch (error) {
      console.error("Export failed:", error);
      showNotification('error', 'Export Failed', `Failed to export CSV: ${error.message}`);
    }
  };

  // Check CSV status on component mount
  useEffect(() => {
    const checkCsvStatus = async () => {
      try {
        const response = await fetch("http://localhost:8001/csv-status");
        const data = await response.json();
        setCsvMode(data.is_csv_mode);
      } catch (error) {
        console.error("Failed to check CSV status:", error);
      }
    };
    
    checkCsvStatus();
  }, []);

  // ===== DATABASE CONNECTION FUNCTIONS =====
  const handleConnectDb = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("http://localhost:8001/connect-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbCredentials),
      });

      if (response.ok) {
        setConnectedDb(dbCredentials.name || "Database");
        setShowConnectModal(false);
        // Reset credentials for security
        setDbCredentials({
          type: "",
          url: "",
          name: "",
          username: "",
          password: "",
        });
      }
    } catch (error) {
      console.error("Database connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Handle database disconnection
   * Notifies backend and resets connection state
   */
  const handleDisconnectDb = async () => {
    try {
      await fetch("http://localhost:8001/disconnect-db", {
        method: "POST",
      });
      console.log("Disconnected from DB.");
    } catch (error) {
      console.error("Failed to notify backend:", error);
    } finally {
      setConnectedDb(null);
      // Reset credentials
      setDbCredentials({
        type: "",
        url: "",
        name: "",
        username: "",
        password: "",
      });
    }
  };

  // ===== SESSION HANDLING =====
  
  /**
   * Handle creation of a new session
   * Creates a new session and switches to it, clearing CSV mode
   */
  const handleNewSession = async () => {
    // Notify user if they were in CSV mode
    if (csvMode) {
      showConfirmation(
        "Start New Chat",
        "You're currently in CSV mode. Starting a new chat will clear the uploaded CSV data and return to database mode. Continue?",
        async () => {
          await executeNewSession();
        },
        "warning"
      );
    } else {
      await executeNewSession();
    }
  };

  const executeNewSession = async () => {
    // Clear CSV data on backend for fresh session
    try {
      await fetch("http://localhost:8001/clear-csv", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to clear CSV data:", error);
    }
    
    // Create new session
    const newSession = createNewSession("New Chat");
    
    // Switch to the new session
    setCurrentSessionId(newSession._id);
    
    // Clear CSV mode for fresh session
    setCsvMode(false);
    setLastSqlQuery("");
    
    // Clear current messages and reset to welcome message
    const welcomeMessage = {
      id: 1,
      type: "bot",
      content: `Hi! I'm your data analytics assistant. Ask me anything about your database - like "Show sales trends" or "What are the top products?"`,
      timestamp: new Date(),
      sqlQuery: null,
    };
    
    setMessages([welcomeMessage]);
    setInputValue("");
    setShowSqlToggle({});
    setGraphData({});
    setShowGraphForMessage({});
    setRawTable([]);
    setTitle("");
  };

  /**
   * Handle switching to an existing session
   * @param {string} sessionId - The ID of the session to switch to
   */
  const handleSwitchSession = async (sessionId) => {
    // Warn user if they're switching sessions while in CSV mode
    if (csvMode) {
      showConfirmation(
        "Switch Session",
        "You're currently in CSV mode. Switching sessions will clear the uploaded CSV data. Continue?",
        async () => {
          await executeSwitchSession(sessionId);
        },
        "warning"
      );
    } else {
      await executeSwitchSession(sessionId);
    }
  };

  const executeSwitchSession = async (sessionId) => {
    // Clear CSV data on backend when switching sessions
    try {
      await fetch("http://localhost:8001/clear-csv", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to clear CSV data:", error);
    }
    
    const session = getSessionById(sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      
      if (session.messages && session.messages.length > 0) {
        // Load messages from the session
        const sessionMessages = session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(sessionMessages);
      } else {
        // Session exists but has no messages, start with welcome message
        const welcomeMessage = {
          id: 1,
          type: "bot",
          content: `Hi! I'm your data analytics assistant. Ask me anything about your database - like "Show sales trends" or "What are the top products?"`,
          timestamp: new Date(),
          sqlQuery: null,
        };
        setMessages([welcomeMessage]);
      }
      
      // Reset CSV mode when switching sessions - each session starts fresh
      setCsvMode(false);
      setLastSqlQuery("");
      
      // Reset other states
      setInputValue("");
      setShowSqlToggle({});
      setGraphData({});
      setShowGraphForMessage({});
      setRawTable([]);
      setTitle("");
    }
  };

  // ===== COMPUTED VALUES =====
  // Get the last user prompt for dashboard navigation
  const lastPrompt = messages.filter((msg) => msg.type === "user").slice(-1)[0]?.content || "";


  // ===== RENDER =====
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="min-h-screen">
          <Routes>
            {/* Landing Page Route */}
            <Route path="/" element={<Landing />} />
            
            {/* Authentication Route */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Chat Application Route */}
            <Route
              path="/chat"
              element={
                <Chat
                  lastPrompt={lastPrompt} 
                  rawTable={rawTable}
                  messages={messages}
                  setMessages={setMessages}
                  isInitialLoading={isInitialLoading}
                  animations={animations}
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  showConnectModal={showConnectModal}
                  setShowConnectModal={setShowConnectModal}
                  connectedDb={connectedDb}
                  handleDisconnectDb={handleDisconnectDb}
                  dbCredentials={dbCredentials}
                  setDbCredentials={setDbCredentials}
                  handleConnectDb={handleConnectDb}
                  isConnecting={isConnecting}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  isLoading={isLoading}
                  handleSendMessage={handleSendMessage}
                  handleKeyPress={handleKeyPress}
                  inputRef={inputRef}
                  showSqlToggle={showSqlToggle}
                  toggleSqlQuery={toggleSqlQuery}
                  generateGraph={generateGraph}
                  graphData={graphData}
                  showGraphForMessage={showGraphForMessage}
                  toggleGraph={toggleGraph}
                  messagesEndRef={messagesEndRef}
                  onNewSession={handleNewSession}
                  onSwitchSession={handleSwitchSession}
                  currentSessionId={currentSessionId}
                  csvMode={csvMode}
                  csvUploading={csvUploading}
                  handleCsvUpload={handleCsvUpload}
                  handleClearCsv={handleClearCsv}
                  lastSqlQuery={lastSqlQuery}
                  handleExportCsv={handleExportCsv}
                  showNotification={showNotification}
                />
              }
            />
            {/* Dashboard route with dynamic ID */}
            <Route path="/dashboard/:id" element={<DashboardPage />} />
          </Routes>

          {/* Notification Component */}
          <Notification 
            notification={notification} 
            onClose={hideNotification}
          />

          {/* Confirmation Modal */}
          <ConfirmationModal 
            isOpen={confirmationModal.isOpen}
            onClose={hideConfirmation}
            onConfirm={confirmationModal.onConfirm}
            title={confirmationModal.title}
            message={confirmationModal.message}
            type={confirmationModal.type}
          />
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;
