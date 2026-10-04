import { Linking, Alert } from 'react-native';

/**
 * Opens the system dialer pre-filled with the number.
 *
 * `tel:` hands off to the dialer with the number already entered; it does not
 * place the call itself, so the user still presses call to connect.
 *
 * NOTE: this deliberately does not call `Linking.canOpenURL` first. On Android
 * that check returns false for `tel:` unless the app declares a matching
 * <queries> entry in AndroidManifest.xml, which would make every Call button
 * report "Unavailable" even on devices that can dial. Opening directly and
 * handling the rejection is the reliable approach.
 */
export const makeCall = (phoneNumber: string) => {
  const cleaned = String(phoneNumber || '').replace(/[^0-9+]/g, '');
  if (!cleaned) {
    Alert.alert('No number available', 'This contact has no phone number yet.');
    return;
  }

  Linking.openURL(`tel:${cleaned}`).catch(() => {
    Alert.alert(
      'Could not open dialer',
      `This device could not open the phone app. Please dial ${cleaned} manually.`
    );
  });
};

export const openFacebook = (url: string) => {
  if (!url || !url.startsWith('http')) {
    Alert.alert('No Facebook page', 'This official has not added a Facebook page yet.');
    return;
  }
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open link', 'No app on this device can open that page.');
  });
};
