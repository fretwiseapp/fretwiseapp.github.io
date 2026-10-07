/**
 * Practicar — the timed surface.
 *
 * Scaffold only. The real content depends on two pending product decisions
 * (microphone in v1 or not; which exercise type ships first), so this renders
 * the planned modes as a roadmap instead of faking a feature.
 *
 * When the modes land, each card becomes an entry point and the shared
 * machinery (transport clock, note scheduler, scoring) lives in engine/time +
 * audio/transport — never in this component.
 */

interface ModeCard {
  title: string;
  body: string;
  /** Where the content comes from — the real cost driver, worth showing. */
  source: string;
}

const MODES: readonly ModeCard[] = [
  {
    title: 'Escalas y patrones',
    body: 'Recorrer una escala en una posición, a tempo, con el mástil marcando la nota que viene.',
    source: 'Generado por el motor — contenido infinito, costo cero',
  },
  {
    title: 'Licks',
    body: 'Frases cortas sobre una progresión que se repite, guardadas relativas a la tónica para que funcionen en las 12 tonalidades.',
    source: 'Frases originales por estilo',
  },
  {
    title: 'Improvisar',
    body: 'Un loop de acordes y la escala servida sobre el diapasón, sin nota obligada.',
    source: 'Progresiones (no son material protegido)',
  },
];

export function PracticeTab() {
  return (
    <div className="practice-intro">
      <h2 className="practice-title">Practicar</h2>
      <p className="practice-lede">
        Acá la teoría deja de mirarse y se toca: ejercicios con tempo, con el diapasón marcando
        qué viene y por qué esa nota funciona donde funciona.
      </p>

      <div className="practice-modes">
        {MODES.map((m) => (
          <div key={m.title} className="practice-mode">
            <div className="practice-mode-head">
              <h3>{m.title}</h3>
              <span className="practice-badge">En construcción</span>
            </div>
            <p>{m.body}</p>
            <p className="practice-mode-source">{m.source}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
