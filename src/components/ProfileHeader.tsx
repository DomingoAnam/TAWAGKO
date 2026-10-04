import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../theme';
import { VerificationBadge } from './ReusableComponents';

export const ProfileHeader = ({ user }: any) => (
  <View style={styles.container}>
    <View style={styles.avatar}>
      {user?.profilePhoto ? (
        <Image source={{ uri: user.profilePhoto }} style={styles.avatarImg} />
      ) : (
        <Text style={styles.avatarInitial}>
          {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
        </Text>
      )}
    </View>
    <Text style={styles.name}>{user?.fullName}</Text>
    {user?.address ? <Text style={styles.address}>{user.address}</Text> : null}
    <VerificationBadge status={user?.verificationStatus || 'PENDING_VERIFICATION'} />
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImg: { width: 92, height: 92, borderRadius: 46 },
  avatarInitial: { fontSize: 38, fontWeight: '700', color: COLORS.primaryGreen },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  address: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
