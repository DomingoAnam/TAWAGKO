import { notifyNow } from './push';

/**
 * Real heads-up banner via expo-notifications. Falls back to nothing if the
 * user has not granted the notification permission.
 */
export const localBanner = (title: string, body?: string) => {
  void notifyNow(title, body ?? '');
};