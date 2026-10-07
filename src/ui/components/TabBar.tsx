/**
 * Top-level section navigation.
 *
 * This is the product's primary split, not a view toggle: each tab is a
 * different *mode of use*, not a different rendering of the same data.
 *   - Explorar: the reference surface (what is this chord, where do I play it).
 *   - Practicar: the timed surface (play this now, here's how you did).
 *
 * NOTE: this is deliberately NOT the old "Constructor" tab that commit 4e0135f
 * removed. That one split a single task across two screens, which is the thing
 * we decided against. These are genuinely separate products sharing one engine.
 *
 * Implements the WAI-ARIA tabs pattern: roving tabindex, ←/→ to move, Home/End
 * to jump. Each tab panel must carry `role="tabpanel"` + the matching ids.
 */

export type TabId = 'explore' | 'practice';

interface TabDef {
  id: TabId;
  label: string;
  /** Screen-reader-only clarification of what the section is for. */
  hint: string;
}

export const TABS: readonly TabDef[] = [
  { id: 'explore', label: 'Explorar', hint: 'Identificar y construir acordes y escalas en el diapasón' },
  { id: 'practice', label: 'Practicar', hint: 'Ejercicios con tempo y seguimiento' },
] as const;

export function tabPanelId(id: TabId): string {
  return `panel-${id}`;
}

function tabButtonId(id: TabId): string {
  return `tab-${id}`;
}

interface TabBarProps {
  active: TabId;
  onChange: (id: TabId) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    const i = TABS.findIndex((t) => t.id === active);
    if (i < 0) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const target = TABS[next]!;
    onChange(target.id);
    // Move focus with the selection so keyboard users stay on the active tab.
    document.getElementById(tabButtonId(target.id))?.focus();
  };

  return (
    <div className="tabbar" role="tablist" aria-label="Secciones de Fretwise" onKeyDown={onKeyDown}>
      {TABS.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            id={tabButtonId(t.id)}
            role="tab"
            type="button"
            className={on ? 'tabbar-tab on' : 'tabbar-tab'}
            aria-selected={on}
            aria-controls={tabPanelId(t.id)}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
          >
            {t.label}
            <span className="sr-only"> — {t.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
