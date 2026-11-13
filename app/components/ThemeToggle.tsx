"use client";

import { Moon, Sun } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import {
  THEME_STORAGE_KEY,
  ThemeMode,
  applyThemeToDocument,
  getNextTheme,
  getThemeAnnouncement,
  getThemeToggleLabel,
  isThemeMode,
  resolveInitialTheme,
} from "../lib/theme-preference";

function readClientTheme(): ThemeMode {
  const domTheme = document.documentElement.dataset.theme;
  if (isThemeMode(domTheme)) return domTheme;

  let storedTheme: string | null = null;
  try {
    storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    storedTheme = null;
  }

  return resolveInitialTheme({
    storedTheme,
    systemPrefersLight: window.matchMedia("(prefers-color-scheme: light)").matches,
  });
}

function subscribeThemeStore(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

  const syncWithSystemIfUnstored = () => {
    let storedTheme: string | null = null;
    try {
      storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      storedTheme = null;
    }
    if (isThemeMode(storedTheme)) return;
    const osTheme: ThemeMode = mediaQuery.matches ? "light" : "dark";
    if (document.documentElement.dataset.theme !== osTheme) {
      applyThemeToDocument(osTheme);
      onStoreChange();
    }
  };

  syncWithSystemIfUnstored();

  const handleSystemChange = () => {
    syncWithSystemIfUnstored();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    const next = resolveInitialTheme({
      storedTheme: event.newValue,
      systemPrefersLight: mediaQuery.matches,
    });
    applyThemeToDocument(next);
    onStoreChange();
  };

  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.attributeName === "data-theme")) {
      onStoreChange();
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  mediaQuery.addEventListener("change", handleSystemChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    observer.disconnect();
    mediaQuery.removeEventListener("change", handleSystemChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function getServerThemeSnapshot(): ThemeMode | null {
  return null;
}

export function ThemeToggle() {
  const activeTheme = useSyncExternalStore<ThemeMode | null>(
    subscribeThemeStore,
    readClientTheme,
    getServerThemeSnapshot,
  );
  const [announcement, setAnnouncement] = useState("");

  const handleToggle = () => {
    const current = activeTheme ?? "dark";
    const nextTheme = getNextTheme(current);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Proceed cleanly in environments where storage is restricted.
    }
    applyThemeToDocument(nextTheme);
    setAnnouncement(getThemeAnnouncement(nextTheme));
  };

  const buttonLabel = activeTheme ? getThemeToggleLabel(activeTheme) : "Switch color theme";

  return (
    <>
      <button
        type="button"
        className="theme-toggle"
        onClick={handleToggle}
        aria-label={buttonLabel}
        title={buttonLabel}
        data-theme-value={activeTheme ?? undefined}
      >
        <span className="theme-toggle-icon theme-toggle-icon--sun" aria-hidden="true">
          <Sun size={16} strokeWidth={1.5} absoluteStrokeWidth />
        </span>
        <span className="theme-toggle-icon theme-toggle-icon--moon" aria-hidden="true">
          <Moon size={16} strokeWidth={1.5} absoluteStrokeWidth />
        </span>
      </button>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </>
  );
}
