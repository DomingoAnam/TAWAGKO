import { supabase } from './supabase';

type Account = {
  id: string;
  full_name: string;
  username: string;
  position: string | null;
  department: string | null;
  phone: string | null;
  facebook_url: string | null;
  needs_token?: boolean;
};

const rpc = async <T = any>(fn: string, args: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return (data ?? null) as T;
};

/** Creates a personnel account. Access is withheld until the token is claimed. */
export const createPersonnelAccount = (input: {
  username: string;
  password: string;
  fullName: string;
  position?: string;
  department?: string;
}) =>
  rpc<Account>('create_personnel_account', {
    p_username: input.username.trim(),
    p_password: input.password,
    p_full_name: input.fullName.trim(),
    p_position: input.position ?? null,
    p_department: input.department ?? null,
  });

/** Returns the account, or null on bad credentials. `needs_token` gates access. */
export const personnelSignIn = (username: string, password: string) =>
  rpc<Account | null>('personnel_sign_in', {
    p_username: (username || '').trim(),
    p_password: password || '',
  });

/** Presents the shared personnel token to unlock dashboard access. */
export const claimPersonnelToken = (username: string, password: string, token: string) =>
  rpc<Account>('claim_personnel_token', {
    p_username: (username || '').trim(),
    p_password: password || '',
    p_token: (token || '').replace(/\s+/g, ''),
  });

/** Updates the signed-in personnel member's own profile. */
export const updatePersonnelProfile = (input: {
  username: string;
  password: string;
  fullName: string;
  position?: string;
  department?: string;
  phone?: string;
  facebookUrl?: string;
}) =>
  rpc<Account>('update_personnel_profile', {
    p_username: input.username.trim(),
    p_password: input.password,
    p_full_name: input.fullName.trim(),
    p_position: input.position ?? null,
    p_department: input.department ?? null,
    p_phone: input.phone ?? null,
    p_facebook_url: input.facebookUrl ?? null,
  });

// Announcements
// Single-row writes via SECURITY DEFINER functions. These replace the previous
// "delete everything then re-insert" approach, which destroyed row ids on every
// publish and lost the whole table if the insert failed.

type Creds = { username: string; password: string };

const creds = (c: Creds) => ({ p_username: c.username.trim(), p_password: c.password });

export const publishAnnouncement = (
  c: Creds,
  input: {
    title: string;
    description: string;
    category?: string;
    date?: string;
    time?: string;
    important?: boolean;
  }
) =>
  rpc<string>('publish_announcement', {
    ...creds(c),
    p_title: input.title,
    p_description: input.description,
    p_category: input.category ?? 'COMMUNITY',
    p_date: input.date ?? null,
    p_time: input.time ?? null,
    p_important: input.important ?? false,
  });

export const updateAnnouncement = (
  c: Creds,
  id: string,
  input: {
    title: string;
    description: string;
    category?: string;
    date?: string;
    time?: string;
    important?: boolean;
  }
) =>
  rpc<boolean>('update_announcement', {
    ...creds(c),
    p_id: id,
    p_title: input.title,
    p_description: input.description,
    p_category: input.category ?? 'COMMUNITY',
    p_date: input.date ?? null,
    p_time: input.time ?? null,
    p_important: input.important ?? false,
  });

export const deleteAnnouncement = (c: Creds, id: string) =>
  rpc<boolean>('delete_announcement', { ...creds(c), p_id: id });

// Officials directory
// An official is a personnel account that has claimed the personnel token.
export type Official = {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  phone: string | null;
  facebook_url: string | null;
};

export const listOfficialsDirectory = () => rpc<Official[]>('list_officials_directory', {});

// Emergency contacts (personnel writes, everyone reads)
export type EmergencyContact = {
  id: string;
  serviceName: string;
  description: string | null;
  contactNumber: string;
  availability: string;
  lastUpdated: string | null;
  photoUri: string | null;
  address: string | null;
  postalCode: string | null;
};

export const listEmergencyContacts = () => rpc<EmergencyContact[]>('list_emergency_contacts', {});

export const upsertEmergencyContact = (
  c: Creds,
  input: {
    id?: string | null;
    serviceName: string;
    description?: string;
    contactNumber: string;
    availability?: string;
    photoUri?: string | null;
    address?: string;
    postalCode?: string;
  }
) =>
  rpc<string>('upsert_emergency_contact', {
    ...creds(c),
    p_service_name: input.serviceName,
    p_contact_number: input.contactNumber,
    p_description: input.description ?? null,
    p_availability: input.availability ?? 'Available',
    p_id: input.id ?? null,
    p_photo: input.photoUri ?? null,
    p_address: input.address ?? null,
    p_postal_code: input.postalCode ?? null,
  });

export const deleteEmergencyContact = (c: Creds, id: string) =>
  rpc<boolean>('delete_emergency_contact', { ...creds(c), p_id: id });

// Barangay services (personnel writes, everyone reads)
export type Service = {
  id: string;
  serviceName: string;
  contactNumber: string | null;
  location: string | null;
  officeHours: string | null;
  availability: string;
  description: string | null;
  photoUri: string | null;
  postalCode: string | null;
};

export const listBarangayServices = () => rpc<Service[]>('list_barangay_services', {});

export const upsertBarangayService = (
  c: Creds,
  input: {
    id?: string | null;
    serviceName: string;
    contactNumber?: string;
    location?: string;
    officeHours?: string;
    availability?: string;
    description?: string;
    photoUri?: string | null;
    postalCode?: string;
  }
) =>
  rpc<string>('upsert_barangay_service', {
    ...creds(c),
    p_service_name: input.serviceName,
    p_contact_number: input.contactNumber ?? null,
    p_location: input.location ?? null,
    p_office_hours: input.officeHours ?? null,
    p_availability: input.availability ?? 'Available',
    p_description: input.description ?? null,
    p_id: input.id ?? null,
    p_photo: input.photoUri ?? null,
    p_postal_code: input.postalCode ?? null,
  });

export const deleteBarangayService = (c: Creds, id: string) =>
  rpc<boolean>('delete_barangay_service', { ...creds(c), p_id: id });

// Assistance
export const updateAssistanceStatus = (
  c: Creds,
  id: string,
  status: string,
  extra?: { needs?: string[]; urgency?: string }
) =>
  rpc<boolean>('update_assistance_status', {
    ...creds(c),
    p_id: id,
    p_status: status,
    p_new_needs: extra?.needs ?? null,
    p_new_urgency: extra?.urgency ?? null,
  });

// Verification review (personnel)
export const reviewVerification = (
  c: Creds,
  id: string,
  status: 'VERIFIED' | 'NEEDS_CORRECTION' | 'REJECTED',
  correctionReason?: string
) =>
  rpc<boolean>('review_verification', {
    ...creds(c),
    p_id: id,
    p_status: status,
    p_correction_reason: correctionReason ?? null,
  });

// Verification reads
//
// `verification_requests` has RLS enabled with no SELECT policy, so selecting
// from it directly always returns zero rows. Personnel reads therefore go through
// this credential-checked function.
export type VerificationRequest = {
  id: string;
  residentId: string;
  residentName: string;
  documentUri: string | null;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  correctionReason: string | null;
};

export const listVerificationRequests = (username: string) => {
  const c = requirePersonnelAuth(username);
  return rpc<VerificationRequest[]>('list_verification_requests_directory', {
    p_username: c.username,
    p_password: c.password,
  });
};

export const countPendingVerifications = (username: string) => {
  const c = requirePersonnelAuth(username);
  return rpc<number>('count_pending_verifications', {
    p_username: c.username,
    p_password: c.password,
  });
};

// ---------------------------------------------------------------------------
// Resident-scoped calls. These run as the signed-in Supabase Auth user and are
// scoped to auth.uid() server-side, so a resident can only ever touch their own
// rows.
// ---------------------------------------------------------------------------

export const getMyResidentProfile = () => rpc<any>('get_my_resident_profile', {});

export const updateMyResidentProfile = (input: { phone?: string; address?: string }) =>
  rpc<any>('update_my_resident_profile', {
    p_phone: input.phone ?? null,
    p_address: input.address ?? null,
  });

export const submitVerification = (documentUri: string) =>
  rpc<any>('submit_verification', { p_document_uri: documentUri });

export const createAssistanceRequest = (input: {
  needs: string[];
  urgency: string;
  details?: string;
  contactNumber?: string;
}) =>
  rpc<{ id: string; request_id: string; status: string }>('create_assistance_request', {
    p_needs: input.needs,
    p_urgency: input.urgency,
    p_details: input.details ?? null,
    p_contact_number: input.contactNumber ?? null,
  });

export const recordCheckin = (stillNeedsAssistance: boolean) =>
  rpc<boolean>('record_checkin', { p_still_needs_assistance: stillNeedsAssistance });

export const listMyAssistanceRequests = () => rpc<any[]>('list_my_assistance_requests', {});

/**
 * Personnel-side read of every assistance request. Rows contain resident names and
 * phone numbers, so the database requires the personnel credentials.
 */
let personnelPasswordCache: string | null = null;

export const cachePersonnelPassword = (password: string | null) => {
  personnelPasswordCache = password;
};

/**
 * Credentials for a personnel write, taken from the in-memory cache populated at
 * sign-in. The password is never written to AsyncStorage, so it does not survive
 * an app restart — the app must be signed in again after one.
 *
 * Throws a human-readable error rather than silently failing the RPC.
 */
export const requirePersonnelAuth = (username: string) => {
  const password = personnelPasswordCache;
  if (!password) {
    throw new Error('Your session has expired. Please log out and sign in again to continue.');
  }
  if (!username) {
    throw new Error('You are not signed in as personnel.');
  }
  return { username: username.trim(), password };
};

export const hasPersonnelAuth = () => personnelPasswordCache !== null;

export const listAssistanceRequestsDirectory = (username: string, password: string) =>
  rpc<any[]>('list_assistance_requests_directory', {
    p_username: username.trim(),
    p_password: password,
  });

/** Returns the cached password, or null if personnel have not authenticated yet. */
export const getCachedPersonnelPassword = () => personnelPasswordCache;

/**
 * Changes the signed-in resident's password. The current password is verified by
 * re-authenticating first, because Supabase Auth (unlike the personnel tables)
 * owns the resident credential and there is no bcrypt column to compare against.
 */
export const changeResidentPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  if (newPassword.length < 8) throw new Error('New password must be at least 8 characters.');
  if (newPassword === currentPassword) throw new Error('New password must be different.');

  const { data: userData } = await supabase.auth.getUser();
  const email = userData?.user?.email;
  if (!email) throw new Error('Could not identify your account.');

  // Proves the current password before allowing the change.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInError) throw new Error('Your current password is incorrect.');

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) throw updateError;

  return true;
};

/** Changes the signed-in personnel member's own password. */
export const changePersonnelPassword = (
  username: string,
  oldPassword: string,
  newPassword: string
) => rpc<boolean>('change_personnel_password', {
  p_username: (username || '').trim(),
  p_old_password: oldPassword,
  p_new_password: newPassword,
  });

/**
 * Sample data is intentionally NOT seeded.
 *
 * Emergency contacts, barangay services and announcements are created by
 * personnel from their own management screens, so the app starts empty instead
 * of pre-filled with placeholder rows that would have to be deleted by hand.
 */
export const seedSampleData = async () => {
  // Intentionally a no-op. See the note above.
};