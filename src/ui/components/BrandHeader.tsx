import type { ReactNode } from 'react';

/**
 * Brand header — the app's masthead.
 *
 * Renders the Chord Lab lockup (mark + wordmark) inline so it works in a
 * single-file build without a font file or external SVG. Mark geometry
 * mirrors `brand/logo-mark.svg`:
 *   - wood-dark square (1a1a1a) with rounded corners
 *   - 6 vertical strings on a neutral dark background
 *   - cream nut (c8b896) along the top
 *   - 3 dots in the sacred brand colors: red (1) / blue (3) / amber (5)
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
      <a className="brand-lockup" href="#" aria-label="Chord Lab — inicio">
        {/* Mark */}
        <svg
          className="brand-mark"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <rect width="64" height="64" rx="12" fill="#1a1a1a" />
          <g stroke="#3a3a3a" strokeWidth="1" strokeLinecap="round">
            <path d="M12 12v44M20 12v44M28 12v44M36 12v44M44 12v44M52 12v44" />
            <path d="M8 24h48M8 40h48" />
          </g>
          <rect x="8" y="10" width="48" height="2" rx="1" fill="#c8b896" />
          <circle cx="20" cy="32" r="6.5" fill="#c0392b" />
          <circle cx="36" cy="48" r="6.5" fill="#2e86c1" />
          <circle cx="52" cy="16" r="6.5" fill="#f39c12" />
        </svg>

        {/* Wordmark + tagline */}
        <div className="brand-text">
          <div className="brand-wordmark">CHORD LAB</div>
          <div className="brand-tagline">El laboratorio de acordes</div>
        </div>
      </a>

      {children ? <div className="header-actions">{children}</div> : null}
    </header>
  );
}
