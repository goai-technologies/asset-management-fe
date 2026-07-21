export const USER_ACCOUNT_CHANGED = "eams:user-account-changed";

const PROFILE_KEY = "eams_user_profiles";
const PREFERENCES_KEY = "eams_user_preferences";

export type StoredUserProfile = {
  fullName: string;
  phone: string;
  location: string;
  profilePicture: string | null;
};

export type UserPreferences = {
  darkMode: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  darkMode: false,
  emailNotifications: true,
  inAppNotifications: true,
};

function readMap<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, T>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap<T>(key: string, data: Record<string, T>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(USER_ACCOUNT_CHANGED));
}

export const UserAccountStore = {
  getProfile(userId: string): StoredUserProfile | null {
    return readMap<StoredUserProfile>(PROFILE_KEY)[userId] ?? null;
  },

  saveProfile(userId: string, profile: StoredUserProfile) {
    const all = readMap<StoredUserProfile>(PROFILE_KEY);
    all[userId] = profile;
    writeMap(PROFILE_KEY, all);
  },

  getPreferences(userId: string): UserPreferences {
    return { ...DEFAULT_PREFERENCES, ...readMap<Partial<UserPreferences>>(PREFERENCES_KEY)[userId] };
  },

  savePreferences(userId: string, preferences: UserPreferences) {
    const all = readMap<UserPreferences>(PREFERENCES_KEY);
    all[userId] = preferences;
    writeMap(PREFERENCES_KEY, all);
  },
};
