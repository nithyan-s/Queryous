import React from "react";
import ChatHeader from "../components/ChatHeader.jsx";
import ChatMessage from "../components/ChatMessage.jsx";
import ChatInput from "../components/ChatInput.jsx";
import ConnectModal from "../components/ConnectModal.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import SessionHistory from "../components/SessionHistory.jsx";

const Chat = ({
  lastPrompt,
  rawTable,
  showDashboard,
  messages,
  setMessages,
  isInitialLoading,
  animations,
  darkMode,
  setDarkMode,
  showConnectModal,
  setShowConnectModal,
  connectedDb,
  handleDisconnectDb,
  dbCredentials,
  setDbCredentials,
  handleConnectDb,
  isConnecting,
  inputValue,
  setInputValue,
  isLoading,
  handleSendMessage,
  handleKeyPress,
  inputRef,
  showSqlToggle,
  toggleSqlQuery,
  generateGraph,
  graphData,
  showGraphForMessage,
  toggleGraph,
  messagesEndRef,  
  onNewSession,
  onSwitchSession,
  currentSessionId,
  csvMode,
  csvUploading,
  handleCsvUpload,
  handleClearCsv,
  lastSqlQuery,
  handleExportCsv,
  showNotification,
}) => {
  // Simple sidebar state - starts open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = React.useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-open sidebar on desktop, but keep user preference on mobile
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  return (
    <>
      <style>{animations}</style>

      {isInitialLoading && <LoadingScreen />}      
      
      {/* Main Chat Interface with animated background */}
      <div
        className={`min-h-screen transition-all duration-500 relative overflow-hidden ${
          isInitialLoading ? "opacity-0" : "opacity-100"
        }`}
        style={{
          background: darkMode 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)'
        }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating Orbs */}
          <div 
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 animate-pulse"
            style={{
              background: darkMode 
                ? 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
              animation: 'float 6s ease-in-out infinite'
            }}
          ></div>
          <div 
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20 animate-pulse"
            style={{
              background: darkMode 
                ? 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
              animation: 'float 8s ease-in-out infinite reverse'
            }}
          ></div>
          
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: darkMode 
                ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)'
                : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }}
          ></div>
        </div>

        <div className="flex h-screen relative z-10">
          {/* Sidebar - ChatGPT style */}
          <div className={`${
            sidebarOpen ? 'w-80' : 'w-0'
          } transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}>
            <SessionHistory 
              sidebarOpen={sidebarOpen} 
              setSidebarOpen={setSidebarOpen}
              onNewSession={onNewSession}
              onSwitchSession={onSwitchSession}
              currentSessionId={currentSessionId}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              isMobile={isMobile}
            />
          </div>
          
          {/* Main Content Area */}
          <div className="flex flex-col flex-1 min-w-0 relative">
            <ChatHeader
              prompt={lastPrompt}
              rawTable={rawTable}
              messages={messages}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              setShowConnectModal={setShowConnectModal}
              connectedDb={connectedDb}
              handleDisconnectDb={handleDisconnectDb}
              csvMode={csvMode}
              lastSqlQuery={lastSqlQuery}
              handleExportCsv={handleExportCsv}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              isMobile={isMobile}
            />            
            <ConnectModal
              darkMode={darkMode}
              showConnectModal={showConnectModal}
              setShowConnectModal={setShowConnectModal}
              dbCredentials={dbCredentials}
              setDbCredentials={setDbCredentials}
              handleConnectDb={handleConnectDb}
              handleDisconnectDb={handleDisconnectDb}
              isConnecting={isConnecting}
              connectedDb={connectedDb}
              csvMode={csvMode}
              handleCsvUpload={handleCsvUpload}
              csvUploading={csvUploading}
              handleClearCsv={handleClearCsv}
              showNotification={showNotification}
            />
            
            
            <div className="flex flex-col h-[calc(100vh-80px)] w-full">
              {/* Messages Area */}
              <div 
                className="flex-1 overflow-y-auto py-4 sm:py-6 space-y-4 sm:space-y-6 px-2 sm:px-4 max-w-4xl mx-auto w-full"
                style={{
                  backdropFilter: 'blur(10px)',
                  background: darkMode 
                    ? 'rgba(15, 23, 42, 0.6)'
                    : 'rgba(248, 250, 252, 0.6)'
                }}
              >
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    darkMode={darkMode}
                    showSqlToggle={showSqlToggle}
                    toggleSqlQuery={toggleSqlQuery}
                    generateGraph={generateGraph}
                    graphData={graphData}
                    showGraph={!showGraphForMessage[message.id]}
                    toggleGraph={() => toggleGraph(message.id)}
                  />
                ))}

                {isLoading && (
                  <ChatMessage
                    message={{
                      id: "loading",
                      type: "bot",
                      content: "Analyzing your query...",
                      timestamp: new Date(),
                    }}
                    darkMode={darkMode}
                    showSqlToggle={{}}
                    toggleSqlQuery={() => {}}
                    generateGraph={() => {}}
                    graphData={{}}
                  />
                )}

                <div ref={messagesEndRef} />
              </div>              
              {/* Input Area */}
              <div 
                className="px-2 sm:px-4 max-w-4xl mx-auto w-full pb-safe"
                style={{
                  backdropFilter: 'blur(10px)',
                  background: darkMode 
                    ? 'rgba(15, 23, 42, 0.8)'
                    : 'rgba(248, 250, 252, 0.8)'
                }}
              >                
                <ChatInput
                  darkMode={darkMode}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  isLoading={isLoading}
                  handleSendMessage={handleSendMessage}
                  handleKeyPress={handleKeyPress}
                  inputRef={inputRef}
                  connectedDb={connectedDb || csvMode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
      `}</style>
    </>
  );
};

export default Chat;
