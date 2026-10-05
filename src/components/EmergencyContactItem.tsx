import React from 'react';
import { DirectoryCard } from './DirectoryCard';

export const EmergencyContactItem = ({ item }: any) => (
  <DirectoryCard item={item} kind="contact" />
);
