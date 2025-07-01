import React from 'react';
import { Code, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MessageActions = ({
  darkMode,
  message,
  showSqlToggle,
  toggleSqlQuery,
  generateGraph,
  toggleGraph
}) => {
  const navigate = useNavigate();
  if (!message.sqlQuery) return null;

  const handleViewAsDashboard = () => {
    // You may want to generate a unique id or use message.id
    navigate(`/dashboard/${message.id}`, {
      state: {
        rawTable: message.data, // or the correct data prop
        title: message.summary // or the correct title prop
      }
    });
  };

  return (    <div className="mt-4 flex flex-wrap gap-2">
      <button
        onClick={() => toggleSqlQuery(message.id)}
        className={`flex items-center space-x-2 text-xs px-3 py-2 rounded-lg transition-all hover:opacity-80 ${
          message.type === 'user'
            ? darkMode
              ? 'bg-black/20 hover:bg-black/30 text-black'
              : 'bg-white/20 hover:bg-white/30 text-white'
            : darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
        }`}
      >
        <Code className="w-3 h-3" />
        <span>{showSqlToggle[message.id] ? 'Hide' : 'Show'} SQL</span>
      </button>

      <button
        onClick={handleViewAsDashboard}
        className={`flex items-center space-x-2 text-xs px-3 py-2 rounded-lg transition-all hover:opacity-80 ${
          message.type === 'user'
            ? darkMode
              ? 'bg-black/20 hover:bg-black/30 text-black'
              : 'bg-white/20 hover:bg-white/30 text-white'
            : darkMode
              ? 'bg-white text-black hover:bg-gray-100 border border-gray-600'
              : 'bg-black text-white hover:bg-gray-800 border border-gray-300'
        }`}
      >
        <BarChart3 className="w-3 h-3" />
        <span>View as Dashboard</span>
      </button>
    </div>
  );
};

export default MessageActions;
