import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'deali-theme'

type Theme = 'light' | 'dark'

/** Returns the initial theme: localStorage → OS preference → 'light' */
function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage not available (e.g. private mode on some browsers)
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Apply theme class to <html> and set color-scheme on <meta> */
function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.style.colorScheme = theme
}

/**
 * useDarkMode — manages light/dark theme.
 * Persists preference in localStorage, falls back to OS preference.
 */
export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // Apply on mount and every change
  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore write errors
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle, isDark: theme === 'dark' }
}
