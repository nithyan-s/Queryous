import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, X } from 'lucide-react';

const Notification = ({ 
  notification, 
  onClose, 
  darkMode 
}) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'warning':
        return 'border-yellow-500';
      default:
        return 'border-blue-500';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full animate-in slide-in-from-right duration-300`}>
      <div className={`
        rounded-lg shadow-lg border-l-4 ${getBorderColor()} p-4 
        ${darkMode 
          ? 'bg-gray-800 border-r border-t border-b border-gray-700' 
          : 'bg-white border-r border-t border-b border-gray-200'
        }
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {notification.title}
            </h3>
            {notification.message && (
              <p className={`mt-1 text-sm ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {notification.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className={`
                rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 
                ${darkMode 
                  ? 'text-gray-400 hover:text-gray-300 focus:ring-gray-500' 
                  : 'text-gray-400 hover:text-gray-500 focus:ring-gray-500'
                }
              `}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
