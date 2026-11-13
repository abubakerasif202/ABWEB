import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {
  THEME_META_COLORS,
  THEME_STORAGE_KEY,
  getNextTheme,
  getThemeAnnouncement,
  getThemeToggleLabel,
  isThemeMode,
  resolveInitialTheme,
  themeBootScript,
} from "./theme-preference";

test("isThemeMode accepts only valid dark and light strings", () => {
  assert.equal(isThemeMode("dark"), true);
  assert.equal(isThemeMode("light"), true);
  assert.equal(isThemeMode("system"), false);
  assert.equal(isThemeMode(null), false);
  assert.equal(isThemeMode(undefined), false);
  assert.equal(isThemeMode(""), false);
});

test("resolveInitialTheme prioritizes explicit stored preference over OS preference", () => {
  assert.equal(resolveInitialTheme({ storedTheme: "dark", systemPrefersLight: true }), "dark");
  assert.equal(resolveInitialTheme({ storedTheme: "light", systemPrefersLight: false }), "light");
});

test("resolveInitialTheme falls back to OS prefers-color-scheme when unstored or invalid", () => {
  assert.equal(resolveInitialTheme({ storedTheme: null, systemPrefersLight: true }), "light");
  assert.equal(resolveInitialTheme({ storedTheme: null, systemPrefersLight: false }), "dark");
  assert.equal(resolveInitialTheme({ storedTheme: "sepia", systemPrefersLight: true }), "light");
});

test("getNextTheme and accessible labels toggle cleanly between dark and light", () => {
  assert.equal(getNextTheme("dark"), "light");
  assert.equal(getNextTheme("light"), "dark");
  assert.equal(getThemeToggleLabel("dark"), "Switch to light mode");
  assert.equal(getThemeToggleLabel("light"), "Switch to dark mode");
  assert.equal(getThemeAnnouncement("light"), "Switched to light mode");
  assert.equal(getThemeAnnouncement("dark"), "Switched to dark mode");
});

test("themeBootScript executes synchronously and applies light/dark theme to document", () => {
  const createStubEnv = (stored: string | null, prefersLight: boolean) => {
    const dataset: Record<string, string> = {};
    const style: Record<string, string> = {};
    const metaAttrs: Record<string, string> = { content: THEME_META_COLORS.dark };
    const metaEl = {
      setAttribute: (name: string, value: string) => {
        metaAttrs[name] = value;
      },
    };
    const sandbox = {
      window: {
        localStorage: {
          getItem: (key: string) => (key === THEME_STORAGE_KEY ? stored : null),
        },
        matchMedia: (query: string) => ({
          matches: query.includes("light") ? prefersLight : false,
        }),
      },
      document: {
        documentElement: { dataset, style },
        querySelector: (selector: string) => (selector === 'meta[name="theme-color"]' ? metaEl : null),
      },
    };
    vm.runInNewContext(themeBootScript, sandbox);
    return { dataset, style, metaAttrs };
  };

  const osLight = createStubEnv(null, true);
  assert.equal(osLight.dataset.theme, "light");
  assert.equal(osLight.style.colorScheme, "light");
  assert.equal(osLight.metaAttrs.content, THEME_META_COLORS.light);

  const forcedDark = createStubEnv("dark", true);
  assert.equal(forcedDark.dataset.theme, "dark");
  assert.equal(forcedDark.style.colorScheme, "dark");
  assert.equal(forcedDark.metaAttrs.content, THEME_META_COLORS.dark);

  const defaultDark = createStubEnv(null, false);
  assert.equal(defaultDark.dataset.theme, "dark");
  assert.equal(defaultDark.style.colorScheme, "dark");
  assert.equal(defaultDark.metaAttrs.content, THEME_META_COLORS.dark);
});
