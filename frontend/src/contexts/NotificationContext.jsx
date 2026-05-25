/**
 * NotificationContext — In-app notification queue with auto-dismiss.
 */
import { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext(null);

let idCounter = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef({});

  const addNotification = useCallback((notification) => {
    const id = ++idCounter;
    const item = {
      id,
      type: notification.type || 'info', // info | success | warning | error
      title: notification.title || '',
      message: notification.message || '',
      timestamp: new Date(),
    };

    setNotifications((prev) => [item, ...prev].slice(0, 50));

    // Auto-dismiss after timeout (default 8s)
    const timeout = notification.timeout ?? 8000;
    if (timeout > 0) {
      timersRef.current[id] = setTimeout(() => {
        dismiss(id);
      }, timeout);
    }

    return id;
  }, []);

  const dismiss = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    setNotifications([]);
  }, []);

  const unreadCount = notifications.length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, dismiss, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export default NotificationContext;
