import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type Theme = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'fretwise:theme';

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/** Resolves 'auto' to the effective theme using the OS preference. */
export function resolveTheme(t: Theme): 'light' | 'dark' {
  if (t === 'auto') return systemPrefersDark() ? 'dark' : 'light';
  return t;
}

/**
 * Theme hook. Persists user choice and follows the OS when 'auto' is selected.
 * Applies `data-theme` attribute on <html> so CSS variables re-cascade.
 */
export function useTheme(): [Theme, (t: Theme) => void, 'light' | 'dark'] {
  const [theme, setTheme] = useLocalStorage<Theme>(STORAGE_KEY, 'auto');
  const effective = resolveTheme(theme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', effective);
    // Also update color-scheme so native controls (scrollbars, selects) match.
    root.style.colorScheme = effective;
  }, [effective]);

  // React to OS changes when user has chosen 'auto'.
  useEffect(() => {
    if (theme !== 'auto' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (): void => {
      const root = document.documentElement;
      const next: 'light' | 'dark' = mq.matches ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      root.style.colorScheme = next;
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return [theme, setTheme, effective];
}
