import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/errorReporting";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * Convert a base64 VAPID key to a Uint8Array for the subscribe() call.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission from the user.
 * Returns the permission state: 'granted', 'denied', or 'default'.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.requestPermission();
}

/**
 * Get the active service worker registration.
 */
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.ready;
}

/**
 * Subscribe to push notifications and save the subscription to Supabase.
 */
export async function subscribeToPush(profileId: string): Promise<boolean> {
  try {
    if (!VAPID_PUBLIC_KEY) {
      console.warn("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not configured");
      return false;
    }

    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      return false;
    }

    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return false;
    }

    // Check for existing subscription first
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });
    }

    // Save subscription to Supabase
    const supabase = createClient();
    const subscriptionJSON = subscription.toJSON();

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        profile_id: profileId,
        endpoint: subscription.endpoint,
        p256dh: subscriptionJSON.keys?.p256dh ?? "",
        auth: subscriptionJSON.keys?.auth ?? "",
      },
      { onConflict: "profile_id,endpoint" }
    );

    if (error) {
      reportError(error, { source: "pushSubscription.subscribe", meta: { profileId } });
      return false;
    }

    return true;
  } catch (err) {
    reportError(err, { source: "pushSubscription.subscribe", meta: { profileId } });
    return false;
  }
}

/**
 * Unsubscribe from push notifications and remove the subscription from Supabase.
 */
export async function unsubscribeFromPush(profileId: string): Promise<boolean> {
  try {
    const registration = await getServiceWorkerRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    }

    // Remove subscription from Supabase
    const supabase = createClient();
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("profile_id", profileId);

    if (error) {
      reportError(error, { source: "pushSubscription.unsubscribe", meta: { profileId } });
    }

    return true;
  } catch (err) {
    reportError(err, { source: "pushSubscription.unsubscribe", meta: { profileId } });
    return false;
  }
}

/**
 * Check if the user currently has an active push subscription.
 */
export async function hasPushSubscription(): Promise<boolean> {
  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}
