import { User } from '../types';

export const MOCK_ADMIN_USER: User = {
  id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  email: 'admin@telecom.demo',
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
