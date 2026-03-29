import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import type { ServiceResult } from '../shared/types';

/**
 * Configure default notification handling behavior.
 * Call this once at app startup (e.g., in App.tsx or a root layout).
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request push-notification permissions, retrieve the Expo push token,
 * and persist it to the authenticated user's profile.
 */
export async function registerForPushNotifications(): Promise<ServiceResult<string>> {
  // Check / request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { data: null, error: 'Push notification permission was not granted.' };
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E21833',
    });
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const pushToken = tokenData.data;

  // Save token to the user's profile
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: pushToken, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);

    if (error) {
      console.warn('Failed to save push token to profile:', error.message);
    }
  }

  return { data: pushToken, error: null };
}

/**
 * Schedule a local push notification (useful for event reminders).
 */
export async function schedulePushNotification(
  title: string,
  body: string,
  data: Record<string, string> = {},
  triggerSeconds = 1,
): Promise<ServiceResult<string>> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      },
    });

    return { data: id, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown notification error.';
    return { data: null, error: message };
  }
}

/**
 * Handle a notification response (user tapped a notification).
 * Resolves the target screen and params from the notification data payload.
 *
 * Expected data shapes:
 *   { screen: 'EventDetail', eventId: '...' }
 *   { screen: 'ClubDetail', clubId: '...' }
 *   { screen: 'PostDetail', postId: '...' }
 *
 * Returns navigation params that can be passed directly to navigation.navigate().
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): { screen: string; params: Record<string, string> } | null {
  const data = response.notification.request.content.data as
    | Record<string, string>
    | undefined;

  if (!data?.screen) {
    return null;
  }

  const { screen, ...params } = data;

  return { screen, params };
}

/**
 * Register a listener for when the user taps a notification.
 * Returns a subscription that should be removed on cleanup.
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Register a listener for notifications received while the app is foregrounded.
 * Returns a subscription that should be removed on cleanup.
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(handler);
}
