import { getCurrentUser } from './storage';
import { listAssistanceRequestsDirectory, requirePersonnelAuth } from './supabaseStorage';

/**
 * Shared assistance-request counts.
 *
 * Kept in a tiny external store so the tab-bar badge, the dashboard summary and
 * the assistance list all read the same numbers and stay in sync: approving a
 * request anywhere updates the red dot everywhere without prop drilling.
 */

export type AssistanceCounts = { total: number; pending: number };

let counts: AssistanceCounts = { total: 0, pending: 0 };
const subscribers = new Set<() => void>();

export const getAssistanceCounts = () => counts;

const emit = () => subscribers.forEach((fn) => fn());

export const subscribeToAssistanceCounts = (fn: () => void) => {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
};

export const resetAssistanceCounts = () => {
  counts = { total: 0, pending: 0 };
  emit();
};

/**
 * Reloads the counts using the cached personnel credentials. Silently keeps the
 * previous value on failure so a transient network error does not clear the
 * badge or flash a misleading zero.
 */
export const refreshAssistanceCounts = async () => {
  try {
    const me = await getCurrentUser();
    const c = requirePersonnelAuth(me?.username ?? '');
    const rows = await listAssistanceRequestsDirectory(c.username, c.password);
    counts = {
      total: rows.length,
      pending: rows.filter((r: any) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length,
    };
  } catch {
    return;
  }
  emit();
};
