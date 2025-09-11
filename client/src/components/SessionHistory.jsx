import { useEffect, useRef, useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { CopyPlus, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  getSessions,
  deleteSession,
  createNewSession,
} from "../utils/sessionHelper";

const GradientTitle = ({ isCollapsed, darkMode }) => (
  <h1 className={`text-2xl font-bold transition-all duration-300 ${
    darkMode ? 'text-white' : 'text-black'
  } ${isCollapsed ? 'text-center text-xl px-2 py-3' : 'px-4 py-2'}`}>
    {isCollapsed ? 'H' : 'History'}
  </h1>
);

function SessionHistory({ sidebarOpen, setSidebarOpen, onNewSession, onSwitchSession, currentSessionId, darkMode, setDarkMode, isMobile }) {
  const [sessions, setSessions] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuButtonRefs = useRef({});
  useEffect(() => {
    setSessions(getSessions());
  }, []);
  
  // Refresh sessions when currentSessionId changes (new session created)
  useEffect(() => {
    setSessions(getSessions());
  }, [currentSessionId]);

  const handleMenuClick = (e, id) => {
    e.stopPropagation();
    const rect = menuButtonRefs.current[id].getBoundingClientRect();
    setMenuPosition({
      top: rect.top + rect.height + 8,
      left: rect.left - 20,
    });
    setOpenMenuId((prevId) => (prevId === id ? null : id));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is inside the menu popup
      const menuPopup = document.querySelector('[data-menu-popup]');
      if (menuPopup && menuPopup.contains(e.target)) {
        return; // Don't close if clicking inside menu
      }
      
      // Check if click is on a menu button
      if (
        !Object.values(menuButtonRefs.current).some((ref) =>
          ref?.contains(e.target)
        )
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleDelete = (id) => {
    deleteSession(id);
    // Update local state
    setSessions((prev) => {
      const filtered = prev.filter((s) => s._id !== id);
      console.log("Filtered sessions:", filtered);
      return filtered;
    });
    
    // Close menu
    setOpenMenuId(null);
    
    // If the deleted session was the current one, clear the current session
    if (id === currentSessionId && onNewSession) {
      onNewSession();
    }
  };

  const handleNewChat = () => {
    // Call the parent callback to create a new session
    if (onNewSession) {
      onNewSession();
    }
    // Refresh sessions list to show the new session
    setSessions(getSessions());
  };

  const handleSessionClick = (id) => {
    if (onSwitchSession) {
      onSwitchSession(id);
    }
  };
  
  return (
    <div 
      className="h-screen w-80 border-r flex flex-col"
      style={{
        background: darkMode 
          ? 'rgba(15, 23, 42, 0.95)'
          : 'rgba(248, 250, 252, 0.95)',
        backdropFilter: 'blur(20px)',
        borderColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(99, 102, 241, 0.2)'
      }}
    >
      {/* Header */}
      <div 
        className="border-b p-4"
        style={{
          borderColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(99, 102, 241, 0.2)'
        }}
      >
        <h1 className={`text-xl font-bold mb-3 ${
          darkMode ? 'text-white' : 'text-black'
        }`}>
          History
        </h1>
        
        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="flex w-full items-center justify-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl gap-2"
          style={{
            background: darkMode 
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white'
          }}
        >
          <CopyPlus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {sessions.length === 0 ? (
          <div className={`text-center mt-4 text-sm ${
            darkMode ? 'text-blue-300/70' : 'text-indigo-600/70'
          }`}>
            No query history found
          </div>
        ) : (
          sessions.map((session) => {
            const isSelected = session._id === currentSessionId;
            return (
              <div key={session._id} className="group relative">
                <button
                  onClick={() => handleSessionClick(session._id)}
                  className={`w-full py-3 px-4 rounded-xl text-sm flex items-center justify-between transition-all duration-300 hover:scale-[1.02] ${
                    isSelected
                      ? `shadow-lg text-white`
                      : darkMode
                        ? "hover:bg-slate-800/50 text-blue-100/90 backdrop-blur-sm"
                        : "hover:bg-indigo-50/50 text-indigo-900/90 backdrop-blur-sm"
                  }`}
                  style={isSelected ? {
                    background: darkMode 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                      : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    border: darkMode ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)'
                  } : {}}
                >
                  <div className="flex flex-col items-start overflow-hidden text-left max-w-[85%]">
                    <span className="font-medium truncate w-full text-sm">
                      {session.title}
                    </span>
                    <span className={`text-xs ${
                      isSelected 
                        ? 'text-white/70'
                        : darkMode ? 'text-blue-300/60' : 'text-indigo-600/60'
                    }`}>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    ref={(el) => (menuButtonRefs.current[session._id] = el)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                    onClick={(e) => handleMenuClick(e, session._id)}
                  >
                    <BsThreeDotsVertical size={14} />
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Theme Toggle Footer */}
      <div 
        className="border-t p-4"
        style={{
          borderColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(99, 102, 241, 0.2)'
        }}
      >
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex w-full items-center justify-center px-3 py-3 rounded-xl transition-all duration-200 hover:scale-105"
          style={{
            background: darkMode 
              ? 'rgba(59, 130, 246, 0.1)'
              : 'rgba(99, 102, 241, 0.1)',
            border: darkMode 
              ? '1px solid rgba(59, 130, 246, 0.2)'
              : '1px solid rgba(99, 102, 241, 0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-yellow-300" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
          <span className={`ml-2 text-sm font-medium ${
            darkMode ? 'text-blue-200' : 'text-indigo-700'
          }`}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>      {/* Menu Popup */}
      {openMenuId && (
        <div
          data-menu-popup
          className="fixed z-[60] w-12 border rounded-xl shadow-2xl p-2 flex flex-col items-center space-y-1"
          style={{
            top: menuPosition.top, 
            left: menuPosition.left,
            background: darkMode 
              ? 'rgba(15, 23, 42, 0.95)'
              : 'rgba(248, 250, 252, 0.95)',
            backdropFilter: 'blur(20px)',
            borderColor: darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(99, 102, 241, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
              darkMode
                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                : 'text-red-500 hover:text-red-700 hover:bg-red-100/50'
            }`}
            onClick={(e) => {
              console.log("Delete button clicked for session ID:", openMenuId);
              e.stopPropagation();
              e.preventDefault();
              handleDelete(openMenuId);
            }}
            title="Delete"
          >
            <FaTrashAlt size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default SessionHistory;
