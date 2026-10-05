import React from 'react';
import { DirectoryCard } from './DirectoryCard';

export const ServiceItem = ({ item, onPress }: any) => (
  <DirectoryCard item={item} kind="service" onPress={onPress} />
);
