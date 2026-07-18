import { describe, it, expect } from 'vitest';
import { spell, deg } from '../../src/engine/spell';

describe('spell', () => {
  it('uses sharp preference in sharp keys', () => {
    expect(spell(1, 'G')).toBe('C#');
    expect(spell(6, 'D')).toBe('F#');
  });
  it('uses flat preference in flat keys', () => {
    expect(spell(1, 'F')).toBe('Db');
    expect(spell(6, 'Bb')).toBe('Gb');
  });
  it('honors quality flavor in auto mode', () => {
    expect(spell(1, 'auto', 'm7')).toBe('Db');   // minor → flat
    expect(spell(1, 'auto', '')).toBe('C#');      // major → sharp
  });
});

describe('deg — chord degrees with upper extensions', () => {
  it('labels root, 3rd, 5th for major triad', () => {
    expect(deg(0, '')).toBe('1');
    expect(deg(4, '')).toBe('3');
    expect(deg(7, '')).toBe('5');
  });

  it('labels b3 for minor qualities', () => {
    expect(deg(3, 'm')).toBe('b3');
    expect(deg(3, 'm7')).toBe('b3');
    expect(deg(3, 'dim')).toBe('b3');
  });

  it('labels #9 for altered dominants', () => {
    expect(deg(3, '7#9')).toBe('#9');
    expect(deg(3, '7')).toBe('#9');
  });

  it('labels upper extensions (9, 11, 13)', () => {
    expect(deg(2, 'maj9')).toBe('9');
    expect(deg(5, 'm11')).toBe('11');
    expect(deg(9, '13')).toBe('13');
  });

  it('labels altered tensions (b9, #11, b13)', () => {
    expect(deg(1, '7b9')).toBe('b9');
    expect(deg(6, '7#11')).toBe('#11');
    expect(deg(8, '7b13')).toBe('b13');
  });

  it('labels the tritone as b5 (not #11) when the chord symbol names a flat-five', () => {
    // Per Levine (Jazz Theory Book ch. 2) and Berklee's Jazz Harmony: the chord
    // symbol dictates the spelling. m7b5, 7b5, 7b5b9 explicitly name a b5 — they
    // have no natural 5, so the tritone is the chord's 5th, not an upper extension.
    expect(deg(6, 'm7b5')).toBe('b5');
    expect(deg(6, '7b5')).toBe('b5');
    expect(deg(6, '7b5b9')).toBe('b5');
    // Diminished qualities likewise — they own the b5.
    expect(deg(6, 'dim')).toBe('b5');
    expect(deg(6, 'dim7')).toBe('b5');
    // But a chord with a natural 5 (7#11, maj7#11, etc.) keeps #11 as an extension.
    expect(deg(6, 'maj7#11')).toBe('#11');
    expect(deg(6, '9#11')).toBe('#11');
    // And '7b13' must not be mis-parsed as having a b5 (the 'b' goes with '13').
    expect(deg(6, '7b13')).toBe('#11');
  });

  it('labels 6 distinctly from 13 in sixth chords', () => {
    expect(deg(9, '6')).toBe('6');
    expect(deg(9, 'maj13')).toBe('13');
  });

  it('labels bb7 in dim7', () => {
    expect(deg(9, 'dim7')).toBe('bb7');
  });

  it('labels #5 in augmented', () => {
    expect(deg(8, 'aug')).toBe('#5');
    expect(deg(8, '7#5')).toBe('#5');
  });
});
