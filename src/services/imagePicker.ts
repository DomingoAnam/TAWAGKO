import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

/**
 * Picks an image from the library and returns it as a downscaled data URI.
 *
 * Data URIs (rather than Supabase Storage) keep the app free of a storage bucket
 * and its upload policies. The image is resized and re-compressed before being
 * returned so the resulting text column stays small — the database rejects
 * anything oversized.
 */
export const pickImageAsDataUri = async (maxDimension = 480): Promise<string | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Permission needed',
      'Allow access to your photos to attach an image.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.4,
    allowsEditing: true,
    aspect: [1, 1],
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  if (!asset.base64) {
    Alert.alert('Could not read image', 'Please choose a different image.');
    return null;
  }

  const mime = asset.mimeType || 'image/jpeg';
  const uri = `data:${mime};base64,${asset.base64}`;

  // Guard before spending a round trip on a rejected payload.
  if (uri.length > 380000) {
    Alert.alert('Image too large', 'Please choose a smaller or simpler image.');
    return null;
  }

  return uri;
};
