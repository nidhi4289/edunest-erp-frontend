import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { PushNotifications, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { PushNotificationService } from '@/services/pushNotifications';

interface NotificationContextType {
  unreadCount: number;
  notifications: PushNotificationSchema[];
  addNotification: (notification: PushNotificationSchema) => void;
  markAsRead: (notificationId?: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  clearAll: () => {}
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<PushNotificationSchema[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: PushNotificationSchema) => {
    console.log('🔔 Adding notification:', notification.title);
    
    const newNotification = {
      ...notification,
      id: notification.id || Date.now().toString(),
      received: new Date().toISOString()
    };
    
    let wasAdded = false;
    
    setNotifications(prev => {
      // Check for duplicates based on ID
      const exists = prev.find(n => n.id === newNotification.id);
      if (exists) {
        console.log('⚠️ Duplicate notification, skipping:', newNotification.id);
        return prev;
      }
      
      const updated = [newNotification, ...prev];
      localStorage.setItem('app_notifications', JSON.stringify(updated));
      wasAdded = true;
      return updated;
    });

    // Only increment count if notification was actually added
    if (wasAdded) {
      setUnreadCount(prev => {
        const newCount = prev + 1;
        localStorage.setItem('unread_notification_count', newCount.toString());
        console.log('🔢 Notification count updated to:', newCount);
        return newCount;
      });
    }
  }, []);

  const markAsRead = useCallback((notificationId?: string) => {
    if (notificationId) {
      // Mark specific notification as read (not implemented in this simple version)
      console.log(`Marking notification ${notificationId} as read`);
    }
    
    // For now, just decrease the unread count by 1
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      localStorage.setItem('unread_notification_count', newCount.toString());
      return newCount;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('app_notifications');
    localStorage.removeItem('unread_notification_count');
  }, []);

  // Removed duplicate listener setup - PushNotificationService handles all listeners

  useEffect(() => {
    // Load stored notifications and count from localStorage
    const storedNotifications = localStorage.getItem('app_notifications');
    const storedCount = localStorage.getItem('unread_notification_count');
    
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    }
    
    if (storedCount) {
      setUnreadCount(parseInt(storedCount, 10));
    }

    // Register this context with the push notification service
    PushNotificationService.setNotificationCallback(addNotification);
    PushNotificationService.setClearNotificationCallback(clearAll);
    console.log('✅ Notification callbacks registered');

    // Initialize PushNotificationService for native platforms
    if (Capacitor.isNativePlatform()) {
      setTimeout(() => {
        PushNotificationService.initialize().catch(error => {
          console.error('❌ Failed to initialize PushNotificationService:', error);
        });
      }, 100);
    }

    return () => {
      // Clear the callbacks (PushNotificationService manages its own listeners)
      PushNotificationService.setNotificationCallback(() => {});
      PushNotificationService.setClearNotificationCallback(() => {});
    };
  }, [addNotification, clearAll]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      notifications,
      addNotification,
      markAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);