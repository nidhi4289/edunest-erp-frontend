// src/context/NotificationContext.tsx
import React,
  {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    ReactNode,
  } from 'react';

import { Capacitor, registerPlugin } from '@capacitor/core';
import { PushNotificationSchema } from '@capacitor/push-notifications';
import { PushNotificationService } from '../services/pushNotifications';

export const NotificationContext = createContext<any>(null);

export interface NotificationBridgePlugin {
  getSavedNotifications(): Promise<{ notifications: any[] }>;
  deleteNotification(options: { id?: string; title?: string; body?: string }): Promise<void>;
}

let NotificationBridge: NotificationBridgePlugin | null = null;

if (Capacitor.isNativePlatform()) {
  NotificationBridge = registerPlugin<NotificationBridgePlugin>('NotificationBridge');
} else {
  console.log('[NotificationBridge] Running on web, plugin not available.');
}

export type AnyNotification = {
  id?: string;
  title?: string | null;
  body?: string | null;
  data?: any;
  timestamp?: number;
  received?: string;
};

/**
 * Build a stable key used for dedupe across:
 *  - foreground JS notifications
 *  - native notifications from SharedPreferences
 */
const getNotificationKey = (n: AnyNotification) => {
  const title = (n.title ?? '').trim();
  const body = (n.body ?? '').trim();
  const type = (n.data?.type ?? '').toString().trim();
  const screen = (n.data?.screen ?? '').toString().trim();

  // Only use stable, meaningful fields – ignore fromForeground, simulated, etc.
  return `${title}|||${body}|||${type}|||${screen}`;
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AnyNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Normalize any push notification (foreground or background) into
   * a consistent shape so that keys match native ones.
   */
  const addNotification = useCallback((raw: PushNotificationSchema | AnyNotification) => {
    const anyRaw: any = raw || {};
    const data = anyRaw.data || {};

    // 🔑 This is the crucial bit: prefer JS fields, then fall back to data.title/body
    const title: string = anyRaw.title ?? data.title ?? '';
    const body: string = anyRaw.body ?? data.body ?? '';

    const normalized: AnyNotification = {
      id: anyRaw.id || data.id || Date.now().toString(),
      title,
      body,
      data,
      timestamp: anyRaw.timestamp ?? Date.now(),
      received: new Date().toISOString(),
    };

    console.log('🔔 Adding notification (normalized):', normalized);

    const newKey = getNotificationKey(normalized);
    let actuallyAdded = false;

    setNotifications(prev => {
      const exists = prev.some(n => getNotificationKey(n) === newKey);
      if (exists) {
        console.log('⚠️ Duplicate notification (JS/native), skipping');
        return prev;
      }

      const updated = [normalized, ...prev];
      localStorage.setItem('app_notifications', JSON.stringify(updated));
      actuallyAdded = true;
      return updated;
    });

    if (actuallyAdded) {
      setUnreadCount(prev => {
        const newCount = prev + 1;
        localStorage.setItem('unread_notification_count', newCount.toString());
        console.log('🔢 Notification count updated to:', newCount);
        return newCount;
      });
    }
  }, []);

  const markAsRead = useCallback((notificationId?: string) => {
    if (!notificationId) return;

    console.log(`Marking notification ${notificationId} as read and removing from list`);

    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      localStorage.setItem('app_notifications', JSON.stringify(updated));
      return updated;
    });

    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      localStorage.setItem('unread_notification_count', newCount.toString());
      return newCount;
    });

    if (NotificationBridge && Capacitor.isNativePlatform()) {
      NotificationBridge.deleteNotification({ id: notificationId })
        .then(() => {
          console.log('Deleted notification from native storage:', notificationId);
        })
        .catch(e => {
          console.error('Failed to delete notification from native storage:', e);
        });
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('app_notifications');
    localStorage.removeItem('unread_notification_count');
  }, []);

  const deleteNotification = useCallback((notification: AnyNotification) => {
    const { id, title, body } = notification;

    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('app_notifications', JSON.stringify(updated));
      return updated;
    });

    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      localStorage.setItem('unread_notification_count', newCount.toString());
      return newCount;
    });

    if (Capacitor.isNativePlatform() && NotificationBridge) {
      NotificationBridge.deleteNotification({
        id: id,
        title: title ?? undefined,
        body: body ?? undefined,
      }).catch(e => {
        console.warn('Failed to delete native notification', e);
      });
    }
  }, []);

  /**
   * Merge native notifications (SharedPreferences) into state.
   * Because addNotification already normalizes content, the key
   * built here will match the one built for foreground events.
   */
  const mergeNotifications = useCallback((newNotifs: AnyNotification[]) => {
    if (!newNotifs || newNotifs.length === 0) return;

    let added = 0;

    setNotifications(prev => {
      const existingKeys = new Set(prev.map(n => getNotificationKey(n)));
      const uniqueNew: AnyNotification[] = [];

      for (const raw of newNotifs) {
        const normalized: AnyNotification = {
          ...raw,
          id: raw.id ?? String(raw.timestamp ?? Date.now()),
        };

        const key = getNotificationKey(normalized);
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          uniqueNew.push(normalized);
          added++;
        }
      }

      if (uniqueNew.length === 0) {
        console.log('ℹ️ No new native notifications after dedupe');
        return prev;
      }

      const updated = [...uniqueNew, ...prev];
      localStorage.setItem('app_notifications', JSON.stringify(updated));
      console.log('🟢 Merging native notifications (unique):', uniqueNew);
      console.log('🔔 All notifications after merge:', updated);
      return updated;
    });

    if (added > 0) {
      setUnreadCount(prev => {
        const newCount = prev + added;
        localStorage.setItem('unread_notification_count', newCount.toString());
        console.log('🔢 Unread count after merging native:', newCount);
        return newCount;
      });
    }
  }, []);

  useEffect(() => {
    console.log('📲 NotificationProvider mounted, Capacitor native =', Capacitor.isNativePlatform());

    // Load stored notifications + count (from web/localStorage)
    const storedNotifications = localStorage.getItem('app_notifications');
    const storedCount = localStorage.getItem('unread_notification_count');

    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        setNotifications(parsed);
      } catch (e) {
        console.error('Error parsing stored notifications from localStorage', e);
      }
    }
    if (storedCount) {
      setUnreadCount(parseInt(storedCount, 10) || 0);
    }

    // 🔗 Register callbacks with our service (the only source for JS events)
    PushNotificationService.setNotificationCallback(addNotification);
    PushNotificationService.setClearNotificationCallback(clearAll);
    console.log('✅ Notification callbacks registered (via PushNotificationService only)');

    if (Capacitor.isNativePlatform()) {
      const fetchAndMergeNative = async () => {
        try {
          const nativeNotifs = await fetchNativeNotifications();
          if (Array.isArray(nativeNotifs) && nativeNotifs.length > 0) {
            mergeNotifications(nativeNotifs);
          }
        } catch (e) {
          console.error('Error merging native notifications', e);
        }
      };

      // Initial fetch from SharedPreferences
      fetchAndMergeNative();

      // On resume, fetch again
      document.addEventListener('resume', fetchAndMergeNative);

      return () => {
        document.removeEventListener('resume', fetchAndMergeNative);
        PushNotificationService.setNotificationCallback(() => {});
        PushNotificationService.setClearNotificationCallback(() => {});
      };
    }

    return () => {
      PushNotificationService.setNotificationCallback(() => {});
      PushNotificationService.setClearNotificationCallback(() => {});
    };
  }, [addNotification, clearAll, mergeNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        addNotification,
        markAsRead,
        clearAll,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

/**
 * Fetch notifications from native SharedPreferences via NotificationBridge.
 */
export async function fetchNativeNotifications(): Promise<AnyNotification[]> {
  if (!NotificationBridge) {
    console.warn('NotificationBridge plugin not available');
    return [];
  }
  try {
    const result = await NotificationBridge.getSavedNotifications();
    console.log('📥 Native plugin raw result:', result);

    const arr = (result.notifications || []) as any[];

    const normalized: AnyNotification[] = arr.map((n: any, idx: number) => ({
      id: n.id ?? String(n.timestamp ?? idx),
      title: n.title ?? null,
      body: n.body ?? null,
      data: n.data ?? null,
      timestamp: n.timestamp ?? Date.now(),
      received: new Date().toISOString(),
    }));

    console.log('📦 Native notifications normalized:', normalized);
    return normalized;
  } catch (e) {
    console.error('Error fetching native notifications:', e);
    return [];
  }
}
