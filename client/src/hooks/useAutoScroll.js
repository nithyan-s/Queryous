import { useEffect, useRef } from 'react';

const useAutoScroll = (dependencies = []) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, dependencies);

  return messagesEndRef;
};

export default useAutoScroll;
