import { notifyNow } from './push';

/**
 * Heads-up banner shown to the user for an event we detected while the app was
 * open. Uses a real system notification in a standalone build and the in-app
 * banner in Expo Go, so callers do not need to care.
 */
export const localBanner = (title: string, body?: string) => {
  void notifyNow(title, body ?? '');
};