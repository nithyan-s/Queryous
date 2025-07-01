const SESSION_KEY = "chatbot_sessions";

export const getSessions = () => {
  const sessions = sessionStorage.getItem(SESSION_KEY);
  return sessions ? JSON.parse(sessions) : [];
};

export const getSessionById = (id) => {
  const sessions = getSessions();
  return sessions.find(s => s._id === id);
};

export const saveSession = (session) => {
  const sessions = getSessions();
  const updated = [session, ...sessions.filter((s) => s._id !== session._id)];
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
};

export const updateSessionMessages = (sessionId, messages) => {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(s => s._id === sessionId);
  if (sessionIndex !== -1) {
    sessions[sessionIndex].messages = messages;
    sessions[sessionIndex].updatedAt = new Date().toISOString();
    
    // Update title if it's still "New Chat" and there's a user message
    if (sessions[sessionIndex].title === "New Chat") {
      const firstUserMessage = messages.find(msg => msg.type === "user");
      if (firstUserMessage) {
        sessions[sessionIndex].title = firstUserMessage.content.slice(0, 50) + 
          (firstUserMessage.content.length > 50 ? "..." : "");
      }
    }
    
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
    return sessions[sessionIndex];
  }
  return null;
};

export const deleteSession = (id) => {
  const sessions = getSessions();
  const updated = sessions.filter((s) => s._id !== id);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
};

export const createNewSession = (title) => {
  const newSession = {
    _id: Date.now().toString(),
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveSession(newSession);
  return newSession;
};
