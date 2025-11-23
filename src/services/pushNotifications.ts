import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// Global callback for notifications (will be set by NotificationContext)
let notificationCallback: ((notification: PushNotificationSchema) => void) | null = null;

// Global navigation callback (will be set by App component)
let navigationCallback: ((path: string) => void) | null = null;

// Global notification clearing callback (will be set by NotificationContext)
let clearNotificationCallback: (() => void) | null = null;

export class PushNotificationService {
  
  static setNotificationCallback(callback: (notification: PushNotificationSchema) => void): void {
    notificationCallback = callback;
    console.log('🔗 Notification callback set');
  }
  
  static setNavigationCallback(callback: (path: string) => void): void {
    navigationCallback = callback;
  }
  
  static setClearNotificationCallback(callback: () => void): void {
    clearNotificationCallback = callback;
  }
  
  static async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Request permission for push notifications
    const permStatus = await PushNotifications.requestPermissions();
    console.log('🔐 Permission status:', permStatus);
    
    if (permStatus.receive === 'granted') {
      console.log('✅ Push notification permission granted');
      
      // Register with Apple / Google to receive push via APNS/FCM
      console.log('📋 Registering for push notifications...');
      await PushNotifications.register();
      
      // Set up listeners
      this.setupListeners();
    } else {
      console.log('❌ Push notification permission denied');
    }
  }

  static setupListeners(): void {
    console.log('🔔 Setting up push notification listeners...');
    
    // Remove existing listeners first to avoid duplicates
    PushNotifications.removeAllListeners();
    
    // On registration
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('✅ Push notification token received:', token.value);
      
      // Store the token for backend communication
      localStorage.setItem('pushNotificationToken', token.value);
      
      // Send token to your backend
      this.sendTokenToBackend(token.value);
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ Push notification registration error:', error);
    });

    // On push notification received (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('📱 Push notification received in FOREGROUND:', notification);
      
      // Ensure unique ID for foreground notifications
      const foregroundNotification = {
        ...notification,
        id: notification.id || `fg-${notification.title || 'notification'}-${Date.now()}`,
        data: { ...notification.data, fromForeground: true }
      };
      
      // Handle foreground notification
      this.handleForegroundNotification(foregroundNotification);
    });

    // On push notification tapped (app opened from notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('👆 Push notification action performed (tapped):', notification);
      
      // Handle notification tap (navigate to specific page, etc.)
      this.handleNotificationTap(notification);
    });
    
    console.log('✅ Push notification listeners setup complete');
  }

  static async sendTokenToBackend(token: string): Promise<void> {
    try {
      // Get user data from auth context
      const authToken = localStorage.getItem('authToken');
      const userId = localStorage.getItem('authUserId');
      const studentData = localStorage.getItem('authStudentData');
      
      if (!authToken || !userId) {
        console.log('❌ User not authenticated, skipping token registration');
        return;
      }

      // Detect device platform
      let deviceType = 'Web';
      if (Capacitor.isNativePlatform()) {
        if (Capacitor.getPlatform() === 'ios') {
          deviceType = 'Apple';
        } else if (Capacitor.getPlatform() === 'android') {
          deviceType = 'Android';
        }
      }
      
      // Prepare the payload according to your backend format
      const payload = {
        userId: userId,
        token: token,  // FCM device token
        deviceType: deviceType,
        deviceId: token, // Using FCM token as deviceId
        appVersion: '1' // Version as string
      };
      
      // Send to your backend API
      const url = `${import.meta.env.VITE_API_URL}/api/Notification/register-token`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log('📡 Response received - Status:', response.status, response.statusText);

      if (response.ok) {
        const responseData = await response.text();
        console.log('✅ Push notification token registered successfully');
        console.log('📤 Backend response:', responseData);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to register push notification token:', response.status, response.statusText);
        console.error('❌ Error details from backend:', errorText);
      }

    } catch (error) {
      console.error('Error sending token to backend:', error);
    }
  }



  static handleForegroundNotification(notification: PushNotificationSchema): void {
    console.log('🔔 Handling foreground notification:', notification.title);
    
    // Use the callback to update the notification context
    if (notificationCallback) {
      try {
        notificationCallback(notification);
        console.log('✅ Notification added to context');
      } catch (error) {
        console.error('❌ Error in notification callback:', error);
      }
    } else {
      console.log('❌ No notification callback registered');
      // Fallback: show alert if no callback is registered
      if (notification.title && notification.body) {
        alert(`📱 ${notification.title}\n${notification.body}`);
      }
    }
  }

  static handleNotificationTap(notification: ActionPerformed): void {
    const data = notification.notification.data;
    console.log('👆 Notification tapped with data:', data);
    
    // Add the background notification to the context (this increments the bell icon count)
    // Use a unique ID based on the notification content to avoid duplicates
    const uniqueId = notification.notification.id || 
      `bg-${notification.notification.title}-${Date.now()}`;
    
    const notificationData: PushNotificationSchema = {
      id: uniqueId,
      title: notification.notification.title || 'Notification',
      body: notification.notification.body || '',
      data: { ...data, fromBackground: true }
    };
    
    console.log('📱 Adding background notification to context:', notificationData);
    
    if (notificationCallback) {
      notificationCallback(notificationData);
    }
    
    // Handle navigation based on notification data
    if (data?.screen) {
      // Navigate to specific screen
      console.log(`📍 Navigate to: ${data.screen}`);
      if (navigationCallback) {
        navigationCallback(data.screen);
      }
    } else {
      // Default: navigate to notifications page to show all notifications
      console.log('📍 Navigate to notifications page');
      if (navigationCallback) {
        navigationCallback('/notifications');
      }
    }
  }

  static async getToken(): Promise<string | null> {
    return localStorage.getItem('pushNotificationToken');
  }

  static async testNotification(): Promise<void> {
    const token = await this.getToken();
    if (!token) {
      console.log('No push notification token available');
      return;
    }

    console.log('Testing push notification with token:', token);
    
    // Send a test notification request to your backend
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/Notification/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token,
          title: 'Test Notification',
          body: 'This is a test push notification from EduNest ERP',
          data: { screen: 'dashboard' }
        })
      });

      if (response.ok) {
        console.log('Test notification sent successfully');
        alert('Test notification sent! Check your device.');
      } else {
        console.error('Failed to send test notification');
        alert('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Error sending test notification');
    }
  }

  static async testListeners(): Promise<void> {
    const testNotification: PushNotificationSchema = {
      id: 'test-' + Date.now(),
      title: 'Test Foreground Notification',
      body: 'This is a test to check if foreground listeners work',
      data: { test: true }
    };
    
    this.handleForegroundNotification(testNotification);
    
    if (notificationCallback) {
      notificationCallback(testNotification);
      alert('✅ Direct callback test completed - check notification count!');
    } else {
      alert('❌ Notification callback is not set!');
    }
  }



  static async simulateForegroundNotification(title: string, body: string, data: any = {}): Promise<void> {
    const notification: PushNotificationSchema = {
      id: 'sim-' + Date.now(),
      title,
      body,
      data: { ...data, simulated: true }
    };
    
    this.handleForegroundNotification(notification);
  }

}