import { useCallback, useEffect, useState } from 'react';

/**
 * Safe localStorage access — handles SSR, disabled storage (private mode), and quota errors.
 * Falls back to in-memory state if storage is unavailable.
 */
const memoryStore = new Map<string, string>();

function safeGet(key: string): string | null {
  try {
    if (typeof window === 'undefined') return memoryStore.get(key) ?? null;
    return window.localStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    /* quota / disabled — fall through to memory */
  }
  memoryStore.set(key, value);
}

/** Reactive wrapper around localStorage. Reads once on mount, writes on every change. */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const raw = safeGet(key);
    if (raw === null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        try {
          safeSet(key, JSON.stringify(next));
        } catch {
          /* non-serializable — skip persistence, keep state */
        }
        return next;
      });
    },
    [key]
  );

  // Cross-tab sync: listen for changes from other tabs/windows.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent): void => {
      if (e.key !== key || e.newValue === null) return;
      try {
        setValue(JSON.parse(e.newValue) as T);
      } catch {
        /* ignore malformed cross-tab write */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, set];
}
