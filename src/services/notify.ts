import { ToastAndroid } from 'react-native';

/**
 * Lightweight local "banner". There is no push backend wired up, so this is the
 * closest thing to a system notification we can produce: an Android system
 * toast that pops above the app while it is open.
 *
 * It is intentionally tiny — if/when a real push service is added, replace the
 * body of this one function and the rest of the app keeps working.
 */
export const localBanner = (message: string) => {
  try {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } catch {
    // Non-Android or headless — ignore silently.
  }
};
