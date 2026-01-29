import { User } from './types';

// We removed MOCK_PRODUCTS to ensure the app stays in sync with your PostgreSQL database.
// Real data will be fetched via productService.fetchAll() on app load.

export const getStoredUser = (): User | null => {
  const stored = localStorage.getItem('dkut_marketplace_user');
  return stored ? JSON.parse(stored) : null;
};

export const saveUser = (user: User | null) => {
  if (user) {
    localStorage.setItem('dkut_marketplace_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('dkut_marketplace_user');
  }
};
