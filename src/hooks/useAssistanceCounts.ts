import { useSyncExternalStore } from 'react';
import {
  getAssistanceCounts,
  subscribeToAssistanceCounts,
  type AssistanceCounts,
} from '../services/assistanceCounts';

/** Subscribes a component to the shared assistance-request counts. */
export const useAssistanceCounts = (): AssistanceCounts =>
  useSyncExternalStore(subscribeToAssistanceCounts, getAssistanceCounts, getAssistanceCounts);
