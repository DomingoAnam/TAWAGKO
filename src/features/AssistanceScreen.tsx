import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme';
import { PrimaryButton, SecondaryButton } from '../components/ReusableComponents';
import { createAssistanceRequest, recordCheckin } from '../services/supabaseStorage';
import { pushToRole } from '../services/push';

const NEEDS = [
  'Medical Assistance',
  'Food & Water',
  'Temporary Shelter',
  'Transportation',
  'Family / Contact Assistance',
  'Emotional Support',
  'Other',
];

export default function AssistanceScreen({ navigation }: any) {
  const [step, setStep] = useState<'checkin' | 'fineConfirm' | 'fineDone' | 'needForm' | 'confirm' | 'submitted' | 'stillNeedAny'>('checkin');
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [details, setDetails] = useState('');
  const [urgency, setUrgency] = useState<'Urgent' | 'Can Wait' | null>(null);
  const [lastRequestId, setLastRequestId] = useState('');

  const toggleNeed = (n: string) =>
    setSelectedNeeds((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const handleImFine = () => {
    Alert.alert(
      'Are you sure?',
      'If you are fine for now, no assistance request will be sent. You can check in again later if your situation changes.',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: async () => {
            try {
              await recordCheckin(false);
              navigation.navigate('Home');
            } catch (error: any) {
              Alert.alert('Could not record', error?.message ?? 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleStillNeedAfterFine = () => {
    setStep('needForm');
  };

  const handleFineConfirmed = async () => {
    setStep('fineDone');
  };

  const handleNeedSubmit = () => {
    if (selectedNeeds.length === 0) {
      Alert.alert('No selection', 'Please select at least one assistance need.');
      return;
    }
    if (selectedNeeds.includes('Other') && !otherText.trim()) {
      Alert.alert('Specify need', 'Please specify your need.');
      return;
    }
    if (!urgency) {
      Alert.alert('Urgency', 'Please select an urgency level.');
      return;
    }
    setStep('confirm');
  };

  const handleSubmitRequest = async () => {
    const needs = selectedNeeds.map((n) => (n === 'Other' ? `Other: ${otherText}` : n));
    try {
      // The RPC mints the request id, links the resident via auth.uid() and
      // records the check-in in the same transaction.
      const created = await createAssistanceRequest({
        needs,
        urgency: urgency!,
        details,
      });
      setLastRequestId(created.request_id);
      // Alert every personnel device right away, app open or not.
      void pushToRole(
        'personnel',
        'New assistance request',
        `${needs} — ${urgency!.replace(/_/g, ' ')}. Open Assistance to respond.`,
        { requestId: created.request_id }
      );
      setStep('submitted');
    } catch (error: any) {
      Alert.alert('Could not submit', error?.message ?? 'Please try again.');
    }
  };

  const reset = () => {
    setStep('checkin');
    setSelectedNeeds([]);
    setOtherText('');
    setDetails('');
    setUrgency(null);
  };

  if (step === 'checkin') {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>POST-EMERGENCY CHECK-IN</Text>
        <Text style={styles.message}>We want to know if you still need help after an emergency.</Text>
        <Text style={styles.question}>Are you still in need of assistance?</Text>
        <PrimaryButton title="YES, I NEED ASSISTANCE" onPress={() => setStep('needForm')} style={{ marginTop: 24 }} />
        <SecondaryButton title="I'M FINE FOR NOW" onPress={handleImFine} style={{ marginTop: SPACING.md }} />
      </View>
    );
  }

  if (step === 'fineConfirm') {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Thank You for Checking In</Text>
        <Text style={styles.message}>Your status has been recorded.</Text>
        <View style={styles.divider} />
        <Text style={styles.question}>Are you sure you do not need any further assistance?</Text>
        <PrimaryButton title="YES, I'M FINE" onPress={handleFineConfirmed} style={{ marginTop: 24 }} />
        <SecondaryButton title="I STILL NEED ASSISTANCE" onPress={handleStillNeedAfterFine} style={{ marginTop: SPACING.md }} />
      </View>
    );
  }

  if (step === 'fineDone') {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Thank You!</Text>
        <Text style={styles.message}>
          Thank you. If your situation changes, you can submit an assistance request anytime.
        </Text>
        <PrimaryButton title="BACK TO HOME" onPress={() => navigation.navigate('Home')} style={{ marginTop: 24 }} />
        <SecondaryButton title="START OVER" onPress={reset} style={{ marginTop: SPACING.md }} />
      </View>
    );
  }

  if (step === 'needForm') {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Tell Us What You Need</Text>
        {NEEDS.map((n) => (
          <TouchableOpacity key={n} style={styles.checkRow} onPress={() => toggleNeed(n)}>
            <View style={[styles.checkbox, selectedNeeds.includes(n) && styles.checkboxOn]}>
              {selectedNeeds.includes(n) && (
                <Ionicons name="checkmark" size={14} color={COLORS.onBrand} />
              )}
            </View>
            <Text style={styles.checkLabel}>{n}</Text>
          </TouchableOpacity>
        ))}
        {selectedNeeds.includes('Other') && (
          <>
            <Text style={styles.label}>Please specify your need.</Text>
            <TextInput style={styles.input} value={otherText} onChangeText={setOtherText} placeholder="Describe your need…" placeholderTextColor={COLORS.textHint} />
          </>
        )}
        <Text style={styles.label}>Additional Details (optional)</Text>
        <TextInput
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          value={details}
          onChangeText={setDetails}
          multiline
          placeholder="Tell us more about what you need."
          placeholderTextColor={COLORS.textHint}
        />
        <Text style={styles.label}>Urgency Level</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[styles.urgencyBtn, urgency === 'Urgent' && styles.urgencyOn]}
            onPress={() => setUrgency('Urgent')}
          >
            <Text style={[styles.urgencyText, urgency === 'Urgent' && { color: COLORS.white }]}>URGENT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.urgencyBtn, urgency === 'Can Wait' && styles.urgencyOnGreen]}
            onPress={() => setUrgency('Can Wait')}
          >
            <Text style={[styles.urgencyText, urgency === 'Can Wait' && { color: COLORS.white }]}>CAN WAIT</Text>
          </TouchableOpacity>
        </View>
        <PrimaryButton title="CONTINUE" onPress={handleNeedSubmit} style={{ marginTop: SPACING.lg }} />

        {/* Lets the resident abandon the request without submitting anything. */}
        <SecondaryButton
          title="BACK"
          onPress={() => {
            setStep('checkin');
            setSelectedNeeds([]);
            setOtherText('');
            setDetails('');
            setUrgency(null);
          }}
          style={{ marginTop: SPACING.md }}
        />
      </ScrollView>
    );
  }

  if (step === 'confirm') {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Confirm Assistance Request</Text>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Assistance Needed:</Text>
          <Text style={styles.summaryValue}>{selectedNeeds.join(', ')}</Text>
          <Text style={styles.summaryLabel}>Urgency:</Text>
          <Text style={styles.summaryValue}>{urgency}</Text>
          <Text style={styles.summaryLabel}>Additional Details:</Text>
          <Text style={styles.summaryValue}>{details || 'None'}</Text>
        </View>
        <Text style={styles.question}>Do you still need any further assistance?</Text>
        <PrimaryButton title="YES, SUBMIT REQUEST" onPress={handleSubmitRequest} style={{ marginTop: 20 }} />
        <SecondaryButton title="NO, I'M FINE NOW" onPress={() => { Alert.alert('Recorded', 'Your check-in has been recorded. No further assistance request was submitted.'); setStep('fineDone'); }} style={{ marginTop: SPACING.md }} />
      </View>
    );
  }

  if (step === 'submitted') {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Request Recorded</Text>
        <Text style={styles.message}>Your assistance request has been recorded.</Text>
        <Text style={styles.requestId}>{lastRequestId}</Text>
        <Text style={styles.message}>
          Barangay personnel may review your request and contact you if further assistance is needed.
        </Text>
        <PrimaryButton title="VIEW REQUEST" onPress={() => navigation.navigate('MyRequests')} style={{ marginTop: 20 }} />
        <SecondaryButton title="BACK TO HOME" onPress={() => navigation.navigate('Home')} style={{ marginTop: SPACING.md }} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Non-scrolling steps centre their content with `container`.
  // ScrollView must NOT receive justifyContent via `style`, so the scrolling step
  // uses these two instead (see the Invariant Violation otherwise).
  container: { flex: 1, backgroundColor: COLORS.lightGray, padding: 24, justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: COLORS.lightGray },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { fontSize: 20, fontWeight: '800', color: COLORS.primaryGreen, textAlign: 'center', marginBottom: 12 },
  message: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  question: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginTop: 20 },
  divider: { height: 1, backgroundColor: COLORS.mediumGray, marginVertical: 20 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxOn: { backgroundColor: COLORS.primaryGreen },
  
  checkLabel: { fontSize: 15, color: COLORS.textPrimary },
  urgencyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primaryGreen,
    alignItems: 'center',
  },
  urgencyOn: { backgroundColor: COLORS.accentRed, borderColor: COLORS.accentRed },
  urgencyOnGreen: { backgroundColor: COLORS.primaryGreen },
  urgencyText: { fontWeight: '700', color: COLORS.primaryGreen },
  summaryBox: { backgroundColor: COLORS.lightGray, borderRadius: 16, padding: 16, marginTop: 16 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginTop: 8 },
  summaryValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
  requestId: { fontSize: 22, fontWeight: '800', color: COLORS.accentRed, textAlign: 'center', marginVertical: 12 },
});
