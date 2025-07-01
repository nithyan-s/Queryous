import React from 'react';
import { Bot } from 'lucide-react';
import animations from '../styles/animation';

const LoadingScreen = () => (
  <>
    <style>{animations}</style>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center space-y-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center animate-pulse shadow-lg">
            <Bot className="w-10 h-10 text-black" />
          </div>
          <div className="absolute inset-0 animate-spin">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-400 rounded-full animate-bounce"></div>
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}>
            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-3 h-3 bg-gray-500 rounded-full animate-ping"></div>
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in">
            Data Analytics Assistant
          </h1>
          <div className="flex items-center space-x-1 text-gray-300">
            <span className="animate-typing">Initializing</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
        <div className="w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-loading-bar"></div>
        </div>
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gray-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-gray-500 rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-gray-600 rounded-full animate-float opacity-30" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-gray-400 rounded-full animate-float opacity-50" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </div>
  </>
);

export default LoadingScreen;
