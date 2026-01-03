import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {Toast, ToastType} from '../components/Toast';

interface Notification {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface NotificationContextValue {
  showNotification: (
    message: string,
    type?: ToastType,
    options?: {
      duration?: number;
      action?: {label: string; onPress: () => void};
    },
  ) => void;
  hideNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({
  children,
}: NotificationProviderProps): React.JSX.Element {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const idCounterRef = useRef(0);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      options?: {
        duration?: number;
        action?: {label: string; onPress: () => void};
      },
    ) => {
      const id = `notification-${++idCounterRef.current}`;
      const duration = options?.duration ?? (type === 'error' ? 5000 : 3000);

      const notification: Notification = {
        id,
        message,
        type,
        duration,
        action: options?.action,
      };

      setNotifications(prev => [...prev, notification]);

      // Auto-dismiss unless it has an action (user needs to interact)
      if (!options?.action) {
        setTimeout(() => {
          hideNotification(id);
        }, duration);
      }
    },
    [hideNotification],
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{showNotification, hideNotification, clearAll}}>
      {children}
      {notifications.map((notification, index) => (
        <Toast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          visible={true}
          onDismiss={() => hideNotification(notification.id)}
          action={notification.action}
          index={index}
        />
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider',
    );
  }
  return context;
}
