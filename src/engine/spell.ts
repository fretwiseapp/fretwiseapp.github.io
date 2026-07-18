import type { PitchClass, Key } from './types';
import { SHARP, FLAT, KEY_PREFS } from './constants';
import { isMinorQuality } from './qualities';

/**
 * Spell a pitch class as a note name, honoring key preference or quality-flavor fallback.
 *
 * Decision order:
 *  1. If `key` is not 'auto' and the key has an explicit sharp/flat preference, follow that.
 *  2. Otherwise, if the chord quality is minor/flat-flavored, use flats.
 *  3. Otherwise, use sharps.
 */
export function spell(pc: PitchClass, key: Key = 'auto', qualitySym = ''): string {
  const normalized = ((pc % 12) + 12) % 12;
  if (key !== 'auto') {
    const pref = KEY_PREFS[key];
    if (pref === 'f') return FLAT[normalized]!;
    if (pref === 's') return SHARP[normalized]!;
  }
  // Flat-flavor applies to:
  //   - minor-family chords (m, m7, m7b5, mMaj7, …) — minor 3rd canonically spelled flat
  //   - diminished chords (dim, dim7) — b3/b5 canonically flat
  //   - any symbol explicitly containing a flat token (b9, b5, b13, ♭)
  // Augmented-family chords (aug, maj7#5, 7#5, 7#5#9) use SHARPS because the symbol
  // itself names the sharpened fifth; spelling the #5 as an Ab contradicts the symbol.
  const flatFlavor = /^(m(?!aj)|dim)/.test(qualitySym) || /[b♭]/.test(qualitySym);
  return flatFlavor ? FLAT[normalized]! : SHARP[normalized]!;
}

/**
 * Name an interval (0..11) as a chord degree, honoring quality context.
 *
 * Spelling convention follows standard jazz harmony:
 *   - The tritone (iv=6) is 'b5' when the chord symbol names a flat-five (7b5, m7b5,
 *     7b5b9, dim, dim7) and '#11' when it is an upper extension on a chord with a
 *     natural 5th (7#11, maj7#11, 9#11, etc.). Labeling m7b5's tritone as '#11'
 *     is a naming bug — Mark Levine, *The Jazz Theory Book* ch. 2; Berklee
 *     *Jazz Harmony* (Mulholland/Hojnacki).
 *   - The augmented fifth (iv=8) is '#5' when the chord name says so (aug, 7#5,
 *     maj7#5, 7#5#9) and 'b13' when it is a dominant tension on a chord with a
 *     natural 5th (13b9 with b13 variant, etc.).
 *
 * Examples:
 *  - deg(3, 'm7') = 'b3'   (minor third in minor chord)
 *  - deg(3, '7#9') = '#9'  (augmented ninth in altered dominant)
 *  - deg(6, 'm7b5') = 'b5' (NOT '#11' — m7b5 has no natural 5)
 *  - deg(6, 'maj7#11') = '#11' (upper extension over a natural 5)
 *  - deg(9, '13')  = '13'  (major sixth becomes 13 in extended chord)
 *  - deg(9, '6')   = '6'   (stays '6' in sixth chord where there's no 7th)
 *  - deg(9, 'dim7') = 'bb7' (double-flat seventh in full diminished)
 */
export function deg(interval: number, qualitySym = ''): string {
  const iv = ((interval % 12) + 12) % 12;
  const minor = isMinorQuality(qualitySym);
  const isDim = qualitySym.includes('dim');
  const isAug = qualitySym.includes('aug') || qualitySym.includes('#5');
  const isSixth = qualitySym.includes('6') && !qualitySym.includes('13');
  // A chord symbol that explicitly names a flat-five: 7b5, m7b5, 7b5b9, etc.
  // Use a regex instead of substring to avoid false positives like '7b13' (has 'b1', not 'b5').
  const hasFlatFive = /b5/.test(qualitySym);
  switch (iv) {
    case 0: return '1';
    case 1: return 'b9';
    case 2: return '9';
    case 3: return minor || isDim ? 'b3' : '#9';
    case 4: return '3';
    case 5: return '11';
    case 6: return (isDim || hasFlatFive) ? 'b5' : '#11';
    case 7: return '5';
    case 8: return isAug ? '#5' : 'b13';
    case 9:
      if (qualitySym === 'dim7') return 'bb7';
      return isSixth ? '6' : '13';
    case 10: return 'b7';
    case 11: return '7';
    default: return '?';
  }
}
