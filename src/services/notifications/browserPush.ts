/**
 * HTML5 Desktop Web Notification service.
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function showPushNotification(
  title: string,
  body: string,
  tag?: string
): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      tag: tag || `stockobs_${Date.now()}`,
      icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚨</text></svg>',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('[BrowserPush] Failed to show notification:', err);
    return null;
  }
}

