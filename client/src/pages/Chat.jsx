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
  // State for sidebar - starts expanded
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  return (
    <>
      <style>{animations}</style>

      {isInitialLoading && <LoadingScreen />}      
      <div
        className={`min-h-screen transition-all duration-500 ${
          isInitialLoading ? "opacity-0" : "opacity-100"
        } ${
          darkMode
            ? "bg-gray-900"
            : "bg-white"
        }`}
      >
        <div className="flex h-screen">
          <div className="flex-shrink-0">
            <SessionHistory 
              sidebarOpen={sidebarOpen} 
              setSidebarOpen={setSidebarOpen}
              onNewSession={onNewSession}
              onSwitchSession={onSwitchSession}
              currentSessionId={currentSessionId}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">            
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
            <div className="flex flex-col h-[calc(100vh-100px)] w-full">
              <div className="flex-1 overflow-y-auto py-6 space-y-6 px-4 max-w-6xl mx-auto w-full">{messages.map((message) => (
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
              </div>              <div className="px-4 max-w-6xl mx-auto w-full">                
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
    </>
  );
};

export default Chat;
