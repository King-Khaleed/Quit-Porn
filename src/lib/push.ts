export async function subscribeToPush(): Promise<boolean> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return true;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return false;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });

    return true;
  } catch {
    return false;
  }
}

export async function sendNotification(title: string, body: string, tag?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const options: NotificationOptions & { vibrate?: number[] } = {
      body,
      tag: tag || "qp-notification",
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      vibrate: [100, 50, 100],
    };
    registration.showNotification(title, options);
  } catch {}
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
