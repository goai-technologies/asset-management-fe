export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "eams_theme";
export const THEME_CHANGED = "eams:theme-changed";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent(THEME_CHANGED, { detail: theme }));
}

export function themeFromDarkMode(darkMode: boolean): Theme {
  return darkMode ? "dark" : "light";
}
