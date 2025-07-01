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

function SessionHistory({ sidebarOpen, setSidebarOpen, onNewSession, onSwitchSession, currentSessionId, darkMode, setDarkMode }) {
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
  const handleSessionClick = (id) => {
    if (onSwitchSession) {
      onSwitchSession(id);
    }
  };

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
  };  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Update parent component about sidebar state (inverted because we're setting the NEW state)
    if (setSidebarOpen) {
      setSidebarOpen(isCollapsed); // If currently collapsed, we're opening (true), if open, we're closing (false)
    }
  };

  const handleThemeToggle = () => {
    if (typeof setDarkMode === 'function') {
      setDarkMode(!darkMode);
    } 
  };
  
  return (
    <aside className={`h-screen border-r flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    } ${
      darkMode 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-300'
    }`}>
      {/* Header with squeeze button */}
      <div className={`border-b relative ${
        darkMode ? 'border-gray-700' : 'border-gray-300'
      }`}>
        <div className="flex items-center justify-between">
          <GradientTitle isCollapsed={isCollapsed} darkMode={darkMode} />
          <button
            onClick={toggleSidebar}
            className={`absolute top-4 -right-3 border rounded-full p-1 shadow-md hover:shadow-lg transition-all duration-200 z-10 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' 
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            ) : (
              <ChevronLeft className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            )}
          </button>
        </div>        
        {/* New Chat Button */}
        <div className={`px-4 pb-4 transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={handleNewChat}
            className={`flex w-full items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:opacity-80 shadow-lg gap-2 ${
              isCollapsed ? 'px-2' : ''
            } ${
              darkMode 
                ? 'bg-white text-black hover:bg-gray-100' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
            title={isCollapsed ? "New Chat" : ""}
          >
            <CopyPlus className="w-4 h-4" />
            {!isCollapsed && <span>New Chat</span>}
          </button>
        </div>
      </div>      {/* Sessions List */}
      <div className={`flex-1 overflow-y-auto px-4 py-2 space-y-2 transition-all duration-300 ${
        isCollapsed ? 'px-2' : ''
      }`}>
        {sessions.length === 0 ? (
          !isCollapsed && (
            <div className={`text-center mt-4 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No query history found
            </div>
          )
        ) : (
          sessions.map((session) => {
            const isSelected = session._id === currentSessionId;
            return (
              <div key={session._id} className="group relative">
                <button
                  onClick={() => handleSessionClick(session._id)}
                  className={`w-full py-3 rounded-lg text-sm flex items-center transition-all ${
                    isSelected
                      ? darkMode
                        ? "bg-gray-700 text-white shadow border border-gray-600"
                        : "bg-gray-100 text-black shadow border border-gray-300"
                      : darkMode
                        ? "hover:bg-gray-800 text-gray-200"
                        : "hover:bg-gray-50 text-gray-800"
                  } ${isCollapsed ? 'px-2 justify-center' : 'px-4 justify-between'}`}
                  title={isCollapsed ? session.title : ""}
                >
                  {isCollapsed ? (
                    // Collapsed view - show only first letter
                    <div className="font-bold text-lg">
                      {session.title.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    // Expanded view - show full content
                    <>
                      <div className="flex flex-col items-start overflow-hidden text-left max-w-[85%]">
                        <span className="font-medium truncate w-full">
                          {session.title}
                        </span>
                        <span className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        ref={(el) => (menuButtonRefs.current[session._id] = el)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                        onClick={(e) => handleMenuClick(e, session._id)}
                      >
                        <BsThreeDotsVertical size={16} />
                      </div>
                    </>
                  )}
                </button>
              </div>
            );
          })        )}
      </div>

      {/* Theme Toggle Footer */}
      <div className={`border-t p-4 transition-all duration-300 ${
        isCollapsed ? 'px-2' : ''
      } ${
        darkMode ? 'border-gray-700' : 'border-gray-300'
      }`}>        <button
          onClick={handleThemeToggle}
          className={`flex w-full items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${
            isCollapsed ? 'px-2' : ''
          } ${
            darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
          }`}
          title={isCollapsed ? (darkMode ? "Switch to Light Mode" : "Switch to Dark Mode") : ""}
        >
          {darkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          {!isCollapsed && (
            <span className="ml-2 text-sm font-medium">
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>
      </div>      {/* Menu Popup - only show when not collapsed */}
      {openMenuId && !isCollapsed && (
        <div
          data-menu-popup
          className={`fixed z-[60] w-12 border rounded-lg shadow-lg p-2 flex flex-col items-center space-y-1 ${
            darkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-300'
          }`}
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={`p-2 rounded-full transition-colors ${
              darkMode
                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                : 'text-red-500 hover:text-red-700 hover:bg-red-100'
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
    </aside>
  );
}

export default SessionHistory;
