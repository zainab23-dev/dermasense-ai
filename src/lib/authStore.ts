import { UserAccount, UserDataPayload } from '../types';

const USERS_KEY = 'dermasense_users_db';
const ACTIVE_USER_KEY = 'dermasense_active_user';

// Pre-seeded accounts for instant testing
export const DEMO_USERS: (UserAccount & { passwordHash: string })[] = [
  {
    id: 'user_clara_1',
    name: 'Dr. Clara Rose',
    email: 'clara@dermasense.ai',
    passwordHash: 'skincare123',
    avatarColor: 'bg-rose-500',
    skinGoal: 'Barrier Repair & Anti-Aging',
    createdAt: '2026-01-10',
  },
  {
    id: 'user_alex_2',
    name: 'Alex Chen',
    email: 'alex@dermasense.ai',
    passwordHash: 'skincare123',
    avatarColor: 'bg-indigo-500',
    skinGoal: 'Acne Control & Oil Balance',
    createdAt: '2026-02-15',
  },
  {
    id: 'user_sofia_3',
    name: 'Sofia Gomez',
    email: 'sofia@dermasense.ai',
    passwordHash: 'skincare123',
    avatarColor: 'bg-amber-500',
    skinGoal: 'Sensitive Skin & Hydration',
    createdAt: '2026-03-01',
  },
];

export function getRegisteredUsers(): (UserAccount & { passwordHash: string })[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse users database', e);
  }
  // Initialize with demo users
  localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
  return DEMO_USERS;
}

export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get active user', e);
  }
  return null;
}

export function registerUser(
  name: string,
  email: string,
  password: string,
  avatarColor: string = 'bg-[#FF85B3]',
  skinGoal?: string
): { success: boolean; message: string; user?: UserAccount } {
  const users = getRegisteredUsers();
  const cleanEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'An account with this email address already exists. Only one user is allowed per email address.' };
  }

  const newUser: UserAccount & { passwordHash: string } = {
    id: 'user_' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    passwordHash: password,
    avatarColor,
    skinGoal: skinGoal?.trim() || 'Custom Skin Routine',
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updatedUsers = [...users, newUser];
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

  // Strip passwordHash for response
  const { passwordHash: _, ...publicUser } = newUser;

  return { success: true, message: 'Registration successful! Please sign in with your credentials.', user: publicUser };
}

export function loginUser(
  email: string,
  password: string
): { success: boolean; message: string; user?: UserAccount } {
  const users = getRegisteredUsers();
  const cleanEmail = email.trim().toLowerCase();

  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!found) {
    return { success: false, message: 'No account found with this email address.' };
  }

  if (found.passwordHash !== password) {
    return { success: false, message: 'Incorrect password. Please try again.' };
  }

  const { passwordHash: _, ...publicUser } = found;
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(publicUser));

  return { success: true, message: 'Login successful!', user: publicUser };
}

export function logoutUser(): void {
  localStorage.removeItem(ACTIVE_USER_KEY);
}

export function getUserData(userId: string): UserDataPayload {
  const key = `dermasense_user_${userId}_data`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse user data payload', e);
  }
  return {
    profile: null,
    analysisData: null,
    journalLogs: [],
    trackingLogs: [],
  };
}

export function saveUserData(userId: string, data: UserDataPayload): void {
  const key = `dermasense_user_${userId}_data`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save user data payload', e);
  }
}
