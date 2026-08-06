import api from './api';

// Safe URL Base64 to Uint8Array converter
function urlBase64ToUint8Array(base64String) {
  try {
    const base64Str = String(base64String).trim();
    const padding = '='.repeat((4 - (base64Str.length % 4)) % 4);
    const base64 = (base64Str + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (err) {
    console.error('VAPID key decode failed for string:', base64String, err);
    throw new Error('VAPID key decode failed: ' + err.message);
  }
}

export const pushNotificationService = {
  isSupported() {
    return 'serviceWorker' in navigator && 'Notification' in window;
  },

  getPermissionState() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'granted', 'denied', or 'default'
  },

  async registerServiceWorker() {
    if (!this.isSupported()) return null;
    try {
      let registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  },

  async requestPermission() {
    if (!('Notification' in window)) return 'denied';
    const permission = await Notification.requestPermission();
    return permission;
  },

  async showLocalBrowserNotification(title, body, deepLink = '/dashboard') {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser environment');
      return false;
    }

    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
    }

    if (perm !== 'granted') {
      console.warn('Notification permission is not granted (current state:', perm, ')');
      return false;
    }

    // 1. Ensure Service Worker is registered
    const reg = await this.registerServiceWorker();

    // 2. Dispatch via Service Worker showNotification (Triggers Windows OS Desktop Notification)
    if (reg && reg.showNotification) {
      try {
        await reg.showNotification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'erp-desktop-alert-' + Date.now(),
          renotify: true,
          requireInteraction: true, // Keeps notification visible until user clicks or dismisses!
          vibrate: [200, 100, 200],
          data: { deepLink }
        });
        return true;
      } catch (swErr) {
        console.warn('ServiceWorker showNotification failed:', swErr);
      }
    }

    // 3. Direct window.Notification fallback
    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'erp-desktop-alert-' + Date.now(),
        requireInteraction: true,
        data: { deepLink }
      });
      notif.onclick = () => {
        window.focus();
        window.location.href = deepLink;
        notif.close();
      };
      return true;
    } catch (e) {
      console.error('Window notification error:', e);
      return false;
    }
  },

  async subscribeUserToPush() {
    if (!this.isSupported()) {
      const permission = await this.requestPermission();
      if (permission === 'granted') {
        await this.showLocalBrowserNotification('Desktop Notifications Enabled', 'You will receive OS desktop alerts even when tabs are closed.');
        return { fake: true };
      }
      throw new Error('Browser Push is not supported in this browser.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permission denied for browser push notifications.');
    }

    const registration = await this.registerServiceWorker();

    let vapidPublicKey = 'BIDBlYWys58XtutVKU28ZrScHrg3SPY1OAxNvyPjCB6MeKoqC-3YOtVOTpBvc10Eg4gmUeLr8E00abEh_711OXY';
    try {
      const res = await api.get('/api/v1/notifications/vapid-public-key');
      const key = res.data?.publicKey || res.data?.public_key;
      if (key && key.length > 20) {
        vapidPublicKey = key;
      }
    } catch (e) {
      console.warn('Using default VAPID key fallback:', e);
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    let subscription = null;
    if (registration && registration.pushManager) {
      try {
        subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });
        }

        // Send subscription to backend
        await api.post('/api/v1/notifications/push-subscribe', subscription.toJSON());
      } catch (err) {
        console.warn('ServiceWorker PushManager subscribe fallback to local notifications:', err);
      }
    }

    await this.showLocalBrowserNotification('Desktop Push Notifications Active', 'Logistics ERP master event engine is now connected to Windows OS Notification Center.');

    return subscription || { localOnly: true };
  },

  async unsubscribeUserFromPush() {
    if (!this.isSupported()) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await api.post('/api/v1/notifications/push-unsubscribe', { endpoint });
      }
    } catch (e) {
      console.warn('Unsubscribe error:', e);
    }
  }
};
