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
    <div className={`border-t p-6 ${
      darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your data... (e.g., 'Show sales trends for last 6 months')"
            className={`w-full px-6 py-4 rounded-lg resize-none focus:outline-none focus:ring-2 transition-all shadow-lg ${
              darkMode
                ? 'bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:ring-gray-500'
                : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300 focus:ring-gray-400'
            }`}
            rows={1}
            style={{ minHeight: '60px', maxHeight: '120px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          {isListening && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={`h-${i + 1} w-1 bg-red-500 rounded-full animate-pulse`}
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
            className={`px-6 py-4 rounded-lg focus:outline-none focus:ring-2 transition-all flex items-center justify-center shadow-lg hover:opacity-80 ${
              isListening
                ? 'bg-red-500 text-white focus:ring-red-400'
                : darkMode
                ? 'bg-gray-600 text-white focus:ring-gray-400'
                : 'bg-gray-200 text-black focus:ring-gray-400'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          className={`px-6 py-4 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:opacity-80 ${
            darkMode
              ? 'bg-white text-black focus:ring-gray-400'
              : 'bg-black text-white focus:ring-gray-600'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      <div className={`mt-3 text-xs flex items-center justify-between ${
        darkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>
        <span>
          {isListening ? (
            <span className="text-red-500 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
              Listening...
            </span>
          ) : (
            "Press Enter to send • Shift+Enter for new line"
          )}
        </span>
        {connectedDb && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Connected to {connectedDb}</span>
          </div>
        )}
      </div>
      {/* Add CSS for the sound wave animation */}
      <style jsx>{`
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
