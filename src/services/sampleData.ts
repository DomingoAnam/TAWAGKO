import { seedSampleData } from './supabaseStorage';

export const initAppData = async () => {
  // There is no default personnel account: personnel self-register and then
  // present the shared token. Only reference data is seeded here.
  await seedSampleData();
};
