import React, { useState } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition, } from "react-speech-recognition";

const ChatInput = ({
  darkMode,
  inputValue,
  setInputValue,
  isLoading,
  handleSendMessage,
  handleKeyPress,
  inputRef,
  connectedDb
}) => {
  const [isListening, setIsListening] = useState(false);
  
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  
  const handleListening = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
      if (transcript) {
        setInputValue(prevInput => prevInput + transcript);
      }
      resetTranscript();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
    setIsListening(!isListening);
  };
  
  // Update input when transcript changes
  React.useEffect(() => {
    if (isListening && transcript) {
      setInputValue(prevInput => {
        // Only replace the input if it was empty, otherwise append
        return prevInput ? prevInput : transcript;
      });
    }
  }, [transcript, isListening, setInputValue]);

  return (
    <div 
      className="border-t p-3 sm:p-6"
      style={{
        borderColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(99, 102, 241, 0.2)',
        background: darkMode 
          ? 'rgba(15, 23, 42, 0.8)'
          : 'rgba(248, 250, 252, 0.8)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="flex space-x-2 sm:space-x-4">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your data... (e.g., 'Show sales trends for last 6 months')"
            className={`w-full px-3 sm:px-6 py-3 sm:py-4 rounded-2xl resize-none focus:outline-none focus:ring-2 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base ${
              darkMode
                ? 'text-white placeholder-blue-300/50 focus:ring-blue-500/50'
                : 'text-slate-900 placeholder-indigo-400/60 focus:ring-indigo-500/50'
            }`}
            style={{
              background: darkMode 
                ? 'rgba(30, 41, 59, 0.6)'
                : 'rgba(255, 255, 255, 0.8)',
              border: darkMode 
                ? '1px solid rgba(59, 130, 246, 0.2)'
                : '1px solid rgba(99, 102, 241, 0.2)',
              backdropFilter: 'blur(10px)',
              minHeight: '48px', 
              maxHeight: '120px'
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          {isListening && (
            <div className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="w-1 bg-red-400 rounded-full animate-pulse"
                  style={{ 
                    height: `${(i + 1) * 4}px`, 
                    animation: `soundWave ${0.5 + i * 0.1}s infinite alternate`,
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>
        {browserSupportsSpeechRecognition && (
          <button
            onClick={handleListening}
            className={`px-3 sm:px-6 py-3 sm:py-4 rounded-2xl focus:outline-none focus:ring-2 transition-all flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 ${
              isListening
                ? 'focus:ring-red-400'
                : 'focus:ring-blue-400'
            }`}
            style={{
              background: isListening 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : darkMode
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'rgba(99, 102, 241, 0.1)',
              border: isListening 
                ? 'none'
                : darkMode 
                  ? '1px solid rgba(59, 130, 246, 0.2)'
                  : '1px solid rgba(99, 102, 241, 0.2)',
              color: isListening ? 'white' : (darkMode ? '#93c5fd' : '#6366f1'),
              backdropFilter: 'blur(10px)'
            }}
          >
            {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        )}
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="px-3 sm:px-6 py-3 sm:py-4 rounded-2xl focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105"
          style={{
            background: (!inputValue.trim() || isLoading) 
              ? 'rgba(156, 163, 175, 0.5)'
              : darkMode 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            focusRing: darkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(99, 102, 241, 0.5)'
          }}
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
      <div className={`mt-2 sm:mt-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 ${
        darkMode ? 'text-blue-200/70' : 'text-indigo-600/70'
      }`}>
        <span className="text-xs sm:text-sm">
          {isListening ? (
            <span className="text-red-400 flex items-center">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-2"></span>
              Listening...
            </span>
          ) : (
            <>
              <span className="hidden sm:inline">Press Enter to send • Shift+Enter for new line</span>
              <span className="sm:hidden">Tap Send or press Enter</span>
            </>
          )}
        </span>
        {connectedDb && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Connected to {connectedDb}</span>
              <span className="sm:hidden">Connected</span>
            </span>
          </div>
        )}
      </div>
      {/* Add CSS for the sound wave animation */}
      <style>{`
        @keyframes soundWave {
          0% {
            height: 4px;
          }
          100% {
            height: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatInput;
