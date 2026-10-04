import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { listOfficialsDirectory, listEmergencyContacts, listBarangayServices, listMyAssistanceRequests, cachePersonnelPassword } from './supabaseStorage';

const PERSONNEL_SESSION_KEY = 'personnel_session';

export const getPersonnelSession = async () => {
  const raw = await AsyncStorage.getItem(PERSONNEL_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setPersonnelSession = async (session: any) => {
  await AsyncStorage.setItem(PERSONNEL_SESSION_KEY, JSON.stringify(session));
};

export const clearPersonnelSession = async () => {
  await AsyncStorage.removeItem(PERSONNEL_SESSION_KEY);
};

// Users
export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return (data || []).map(mapUserRow);
};

/**
 * The `users` table is snake_case but every screen reads camelCase. Selecting
 * `*` returned raw columns, so `user.fullName` was undefined and the resident
 * profile rendered blank fields.
 */
const mapUserRow = (row: any) => ({
  id: row.id,
  fullName: row.full_name,
  username: row.username,
  email: row.email,
  contactNumber: row.contact_number,
  address: row.address,
  role: row.role,
  profilePhoto: row.profile_photo,
  verificationStatus: row.verification_status,
  createdAt: row.created_at,
});

export const getCurrentUser = async () => {
  const personnelSession = await getPersonnelSession();
  if (personnelSession) return personnelSession;

  // `get_my_resident_profile` returns the camelCase shape directly and is scoped
  // to auth.uid(), so it can never return another resident's row.
  const { data, error } = await supabase.rpc('get_my_resident_profile');
  if (error) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;
    return mapUserRow(userData.user);
  }
  return data ?? null;
};

export const setCurrentUser = async (user: any) => {
  if (!user.email) {
    // Sign up
    const { data, error } = await supabase.auth.signUp({
      email: user.email || user.username,
      password: user.password,
    });
    if (error) throw error;
    return data;
  } else {
    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email || user.username,
      password: user.password,
    });
    if (error) throw error;
    return data;
  }
};

export const clearCurrentUser = async () => {
  // Never leave a personnel password in memory after sign-out.
  cachePersonnelPassword(null);
  await clearPersonnelSession();
  await supabase.auth.signOut();
};

// Emergency Contacts
export const getEmergencyContacts = async () => listEmergencyContacts();

// Writes go through the credential-checked RPCs in ./supabaseStorage.

// Barangay Services
export const getBarangayServices = async () => listBarangayServices();

// Officials
// NOTE: officials are no longer hand-created rows. An official IS a personnel
// account that has claimed the personnel token; see `listOfficialsDirectory`
// in ./supabaseStorage, which goes through a SECURITY DEFINER function so
// `personnel_accounts` stays locked to the anon key.
export const getOfficials = async () => listOfficialsDirectory();

// Announcements
// Newest first so the resident feed and the personnel list agree on ordering.
export const getAnnouncements = async () => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    date: row.date,
    time: row.time,
    important: row.important,
    createdBy: row.created_by,
  }));
};

// Assistance Requests
// Residents read only their own rows via the auth-scoped RPC.
export const getAssistanceRequests = async () => listMyAssistanceRequests();

// Verification Requests
export const getVerificationRequests = async () => {
  const { data, error } = await supabase.from('verification_requests').select('*');
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    residentId: row.resident_id,
    residentName: row.resident_name,
    documentUri: row.document_uri,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    correctionReason: row.correction_reason,
  }));
};

// Post Emergency Check-ins
export const getPostEmergencyCheckins = async () => {
  const { data, error } = await supabase.from('post_emergency_checkins').select('*');
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    residentId: row.resident_id,
    stillNeedsAssistance: row.still_needs_assistance,
    submittedAt: row.submitted_at,
  }));
};

// Personnel Accounts
// NOTE: `personnel_accounts` has no anon RLS policy (the anon key must never be
// able to read credentials or the shared token). Personnel sign-up, sign-in,
// token claim, profile edits and password changes all go through SECURITY
// DEFINER functions in ./supabaseStorage, which re-verify credentials server-side.

export const getPersonnelAccounts = async () => {
  console.warn('getPersonnelAccounts is unavailable: personnel_accounts is not anon-readable.');
  return [];
};

export const setPersonnelAccounts = async (_v: any[]) => {
  console.warn('setPersonnelAccounts is unavailable: personnel_accounts is not anon-writable.');
  return false;
};

// Office Info
export const getOfficeInfo = async () => {
  const { data, error } = await supabase.from('office_info').select('*').single();
  return data;
};

export const setOfficeInfo = async (v: any) => {
  await supabase.from('office_info').delete().neq('id', '');
  await supabase.from('office_info').insert({
    address: v.address,
    office_hours: v.officeHours,
    contact_number: v.contactNumber,
    services: v.services,
  });
  return true;
};