import type { Theme } from '../hooks/useTheme';

/** Glyphs for each stored theme choice (not the resolved one — user picks intent). */
const GLYPH: Record<Theme, string> = {
  light: '☀',
  dark: '☾',
  auto: '◐',
};

// Two-state cycle: auto ↔ dark. "Claro" was removed as an explicit choice —
// auto still renders light when the OS is in light mode. A legacy stored
// 'light' self-heals to 'auto' on the next click.
const NEXT: Record<Theme, Theme> = {
  auto: 'dark',
  dark: 'auto',
  light: 'auto',
};

const LABEL: Record<Theme, string> = {
  auto: 'Auto',
  light: 'Claro',
  dark: 'Oscuro',
};

interface ThemeToggleProps {
  theme: Theme;
  effective: 'light' | 'dark';
  onChange: (t: Theme) => void;
}

/**
 * Two-state theme cycle: auto ↔ dark.
 * Shows the *stored* preference (so users can see when they're in 'auto'), and
 * annotates the effective theme as a secondary hint when auto is chosen.
 */
export function ThemeToggle({ theme, effective, onChange }: ThemeToggleProps) {
  const next = NEXT[theme];
  const hint = theme === 'auto' ? `sistema: ${effective === 'dark' ? 'oscuro' : 'claro'}` : null;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => onChange(next)}
      title={`Tema: ${LABEL[theme]}${hint ? ` (${hint})` : ''}. Click para: ${LABEL[next]}`}
      aria-label={`Cambiar tema. Actual: ${LABEL[theme]}. Siguiente: ${LABEL[next]}`}
    >
      <span className="icon" aria-hidden="true">{GLYPH[theme]}</span>
      <span className="label">{LABEL[theme]}</span>
    </button>
  );
}
