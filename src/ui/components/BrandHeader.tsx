import type { ReactNode } from 'react';

/**
 * Brand header — the app's masthead.
 *
 * Renders the Fretwise lockup (mark + wordmark) inline so it works in a
 * single-file build without a font file or external SVG. Mark geometry
 * mirrors `brand/logo-mark.svg` (monochrome + indigo):
 *   - black square (#111) with rounded corners
 *   - 3 vertical strings on a dark background
 *   - 3 dots ascending; the lowest (root) in the brand indigo (#635BFF), rest white
 *
 * Keep this component presentation-only — the theme toggle and any other
 * header actions are passed in as `children` so this stays brand-first.
 */

interface BrandHeaderProps {
  /** Header actions (ThemeToggle, etc.) rendered on the right-hand side. */
  children?: ReactNode;
}

export function BrandHeader({ children }: BrandHeaderProps) {
  return (
    <header className="brand-header" role="banner">
      <a className="brand-lockup" href="#" aria-label="Fretwise — inicio">
        {/* Mark */}
        <svg
          className="brand-mark"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <rect width="64" height="64" rx="14" fill="#111111" />
          <g stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round">
            <path d="M16 12v40M32 12v40M48 12v40" />
          </g>
          <circle cx="16" cy="42" r="6" fill="#635BFF" />
          <circle cx="32" cy="30" r="6" fill="#ffffff" />
          <circle cx="48" cy="18" r="6" fill="#ffffff" />
        </svg>

        {/* Wordmark + tagline */}
        <div className="brand-text">
          <div className="brand-wordmark">fretwise</div>
          <div className="brand-tagline">Teoría que se ve en el diapasón</div>
        </div>
      </a>

      {children ? <div className="header-actions">{children}</div> : null}
    </header>
  );
}
