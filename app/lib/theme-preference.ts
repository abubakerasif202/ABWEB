export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "ab-theme";

export const THEME_META_COLORS: Record<ThemeMode, string> = {
  dark: "#070708",
  light: "#f6f3ec",
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "dark" || value === "light";
}

export function resolveInitialTheme({
  storedTheme,
  systemPrefersLight,
}: {
  storedTheme: unknown;
  systemPrefersLight: boolean;
}): ThemeMode {
  if (isThemeMode(storedTheme)) {
    return storedTheme;
  }
  return systemPrefersLight ? "light" : "dark";
}

export function getNextTheme(current: ThemeMode): ThemeMode {
  return current === "light" ? "dark" : "light";
}

export function getThemeToggleLabel(current: ThemeMode): string {
  return current === "light" ? "Switch to dark mode" : "Switch to light mode";
}

export function getThemeAnnouncement(active: ThemeMode): string {
  return active === "light" ? "Switched to light mode" : "Switched to dark mode";
}

export function applyThemeToDocument(theme: ThemeMode, rootDoc: Document = document): void {
  const root = rootDoc.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = rootDoc.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEME_META_COLORS[theme]);
  }
}

/**
 * Synchronous pre-paint boot script placed in RootLayout so the first frame
 * matches saved user preference or OS prefers-color-scheme with zero flash.
 */
export const themeBootScript = `(() => {
  try {
    var s = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var l = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    var t = s === "light" || s === "dark" ? s : (l ? "light" : "dark");
    var r = document.documentElement;
    r.dataset.theme = t;
    r.style.colorScheme = t;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "light" ? ${JSON.stringify(THEME_META_COLORS.light)} : ${JSON.stringify(THEME_META_COLORS.dark)});
  } catch (e) {
    var d = document.documentElement;
    if (!d.dataset.theme) d.dataset.theme = "dark";
  }
})();`;
