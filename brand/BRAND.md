# Fretwise — Sistema de marca

> **Versión 1.0** · Último update: 2026-04-18
> Fuente de verdad para identidad visual, voz, copy y aplicación UI.

---

## 1. Esencia

### 1.1 Qué es
Fretwise es un **identificador y laboratorio de acordes para guitarra**. Armás una posición en el diapasón y devuelve nombre, inversiones drop-2, escalas compatibles y audio — en tiempo real, en el navegador, sin registro.

### 1.2 Para quién
Guitarristas intermedios y avanzados · productores musicales · docentes de armonía · estudiantes de teoría · songwriters que arreglan en el instrumento.

**No** es para el guitarrista absoluto principiante que recién aprende la digitación de un Do mayor. Fretwise asume que ya sabés pisar; te da el porqué.

### 1.3 Posicionamiento
> Lo que un diccionario de acordes hace en papel, Fretwise lo hace en **milisegundos**, con teoría correcta, y sin mandar una sola request a un servidor.

Frente a competidores (Chordify, Oolimo, ChordFinder), Fretwise compite por **precisión teórica** (inversiones nombradas correctamente, no "acorde con bajo raro"), **privacidad** (client-side puro), y **velocidad** (single-file HTML, 65 KB gzipped).

### 1.4 Valores
1. **Precisión sobre aproximación.** Si un voicing es `C/E`, decimos `C/E`, no "Do con otra nota en el bajo".
2. **Respeto por el tiempo del usuario.** Menos clicks, menos fricción, menos decoración.
3. **Transparencia técnica.** Todo lo que hace el motor es inspeccionable y explicable.
4. **Privacidad por default.** Nada viaja. Punto.

---

## 2. Nombre y tagline

### 2.1 Nombre
**Fretwise** (una palabra, mayúscula inicial en prosa, VERSALES en logo: FRETWISE).
Nunca: *Fret Wise*, *FretWise*, *fret-wise*, *Fretwize*. En código/URLs/slug: `fretwise`.

### 2.2 Tagline principal
> **El laboratorio de acordes.**

Corta, categórica, sin verbos. Funciona como cierre, como header, como firma de email.

### 2.3 Taglines secundarias (por contexto)

| Contexto | Tagline |
|---|---|
| Hero de landing | *Identificá acordes al instante.* |
| Redes sociales, una línea | *Armás el acorde. Te decimos qué es.* |
| Email de producto | *Identificación en tiempo real, en tu navegador.* |
| Pitch técnico | *Drop-2 · 37 escalas · Karplus-Strong · zero-backend.* |

### 2.4 No usar
- "Descubrí el poder de los acordes" (marketing vacío)
- "La app que revoluciona la guitarra" (exageración)
- "Todos los acordes del mundo" (falso; cubrimos 41 calidades)

---

## 3. Voz y tono

### 3.1 Voz (constante)

**Directa. Técnica. Cercana. Sin florituras.**

Hablamos en español rioplatense cuando el contexto es informal (ej. UI conversacional, docs, tooltips), y en español neutro técnico cuando es documentación formal. Siempre tuteo (*vos* / *tu*), nunca *usted*.

| Somos | No somos |
|---|---|
| Precisos | Pedantes |
| Confiados | Arrogantes |
| Breves | Crípticos |
| Técnicos | Inaccesibles |
| Honestos sobre límites | Evasivos |

### 3.2 Tono (varía por contexto)

| Contexto | Tono | Ejemplo |
|---|---|---|
| Onboarding | Invitador, guía | "Pulsá un traste para empezar." |
| Identificación exitosa | Informativo, neutro | "Cmaj7 · mayor séptima" |
| Error / no-match | Honesto, útil | "No encontré acorde. Las notas son: C · E · Bb." |
| Warning de digitación | Útil sin drama | "Difícil de pisar: 2 dedos en 5ª y 6ª." |
| Tooltip avanzado | Nerd-pero-amable | "Drop-2: bajás la 2da voz más alta una octava. Suena más abierto." |
| Marketing / hero | Categórico | "El laboratorio de acordes." |

### 3.3 Reglas de escritura

- **Microcopy en UI**: imperativo presente, máximo 5 palabras.
  - ✅ "Pulsá un traste."
  - ❌ "Para comenzar, por favor haz click en cualquier traste del diapasón."
- **Números**: siempre en numerales (3 inversiones, no *tres*).
- **Anglicismos musicales**: se aceptan los estándar (voicing, drop-2, tension, root, bass). No traducir forzadamente.
- **Términos traducibles**: traducir siempre (*scale* → escala, *chord* → acorde, *key* → tonalidad).
- **Emojis**: permitidos solo como glifos semánticos (♫, ▶, ◉, ✓). No caritas. No 🎸🎵🎶 decorativos.
- **Puntos finales**: sí en oraciones completas, no en labels/botones/chips.

### 3.4 Ejemplos comparativos

**Error de digitación inválida**
- ✅ "Esta forma no produce sonido — todas las cuerdas están muteadas."
- ❌ "¡Ups! Parece que no pusiste ninguna nota 😅"
- ❌ "Error: no valid notes detected in current voicing state."

**Sugerencia de escala**
- ✅ "Jónica, Lidia y Lidia b7 suenan bien sobre un Cmaj7."
- ❌ "Proba estas escalas que seguro van a quedar re piolas."
- ❌ "The following scales are harmonically compatible with the selected chord quality."

---

## 4. Logo

### 4.1 Anatomía

El logo de Fretwise está compuesto por:

1. **El símbolo (mark)** — un cuadrado redondeado que representa un fragmento de diapasón con 3 puntos de colores: rojo (fundamental), azul (3ra) y ámbar (5ta). Los 3 colores son **sagrados**: son los mismos que usa la app para identificar grados.
2. **El wordmark** — "FRETWISE" en caja alta, tracking ancho (+0.08em), peso 700.

### 4.2 Variantes

| Archivo | Uso |
|---|---|
| `brand/logo-lockup.svg` | Primario: mark + wordmark horizontal. Uso general. |
| `brand/logo-mark.svg` | Solo símbolo: favicons, app icons, avatars, marcas de agua. |
| `brand/logo-wordmark.svg` | Solo texto: contextos donde el mark ya aparece aparte. |
| `brand/logo-stacked.svg` | Vertical: cuando el horizontal no entra (cards cuadradas, stickers). |

### 4.3 Clearspace y tamaño mínimo

- **Clearspace**: igual al diámetro de uno de los puntos del mark, en los 4 lados.
- **Mínimo mark**: 24×24 px en digital, 8 mm en impreso.
- **Mínimo lockup**: 120 px de ancho en digital.

### 4.4 Reglas de uso

✅ **Permitido**
- Sobre fondo `--cream-50` (#fafaf7) o `--ink-950` (#0e0e10).
- Sobre fotos siempre que haya un scrim del 40%+ de contraste.
- Sobre `--wood-900` (#2a1a10) — es nuestro fondo secundario por excelencia.

❌ **Prohibido**
- Cambiar los colores de los 3 puntos.
- Rotar, inclinar, estirar o aplicar efectos (sombras, gradientes, outlines).
- Reemplazar el wordmark por otra fuente.
- Usar sobre fondos con hue cercano al rojo #c0392b (conflicto visual con el dot de fundamental).

---

## 5. Paleta cromática

### 5.1 Tokens fundacionales

Los colores viven como **tokens semánticos**, no como valores crudos. Esto deja que dark mode y futuras variantes se hagan sin reescribir componentes.

#### Neutros
| Token | Hex | Uso |
|---|---|---|
| `--ink-950` | `#0e0e10` | Superficie más profunda (dark mode base) |
| `--ink-900` | `#1a1a1a` | Texto primario (light), superficie (dark) |
| `--ink-700` | `#444444` | Texto secundario |
| `--ink-500` | `#888888` | Texto atenuado, metadata |
| `--ink-300` | `#bfbcb3` | Texto en dark mode |
| `--ink-200` | `#e8e6e0` | Bordes suaves, texto primario en dark |
| `--ink-100` | `#f5f2ea` | Fondos sutiles |
| `--cream-50` | `#fafaf7` | Fondo de página principal (light) |

#### Signature (madera del diapasón)
| Token | Hex | Uso |
|---|---|---|
| `--wood-900` | `#2a1a10` | Fondo del stage (fretboard). Nuestro color ancla de marca. |
| `--wood-700` | `#4a2e1a` | Variantes cálidas secundarias. |

#### Acordes — los 3 sagrados
| Token | Hex | Significado musical | Uso de marca |
|---|---|---|---|
| `--chord-red` | `#c0392b` | Fundamental (1) | Acción primaria, CTA, root |
| `--chord-blue` | `#2e86c1` | Tercera (3) | Acento frío, info |
| `--chord-amber` | `#f39c12` | Quinta (5) | Acento cálido, highlight |

#### Acordes — extendidos
| Token | Hex | Uso |
|---|---|---|
| `--chord-teal` | `#3aa894` | 4/11, alteraciones #11/b5 |
| `--chord-purple` | `#8e44ad` | Tensiones 9 / b9 / #9 |
| `--chord-rose` | `#db3f7b` | Acento decorativo en narrativa |
| `--chord-gold` | `#d68910` | 6 y 13 |
| `--chord-grey` | `#7f8c8d` | Séptimas menores / colores neutros musicales |

### 5.2 Reglas de combinación

- **Texto sobre `--wood-900`**: usar `--ink-200` (#e8e6e0) o más claro. Nunca gris medio.
- **CTA primario**: siempre `--chord-red` fondo + `#ffffff` texto. No negociable.
- **Combinaciones prohibidas**: `--chord-red` sobre `--chord-amber` (vibra feo), `--chord-blue` sobre `--chord-purple` (bajo contraste).

---

## 6. Tipografía

### 6.1 Familia

**Una sola familia**: el system stack nativo del dispositivo. Es veloz, se siente nativo, no requiere fetches externos, y es parte del credo *single-file* de Fretwise.

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter',
             system-ui, 'Segoe UI', sans-serif;
```

Para código y voicings, monospace:
```css
font-family: 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace;
```

### 6.2 Escala

| Token | Tamaño | Línea | Peso | Uso |
|---|---|---|---|---|
| `--fs-hero` | 80px / 5rem | 1.0 | 700 | Hero principal (landing) |
| `--fs-display` | 44px | 1.05 | 700 | Nombre de acorde identificado |
| `--fs-h1` | 36px | 1.1 | 700 | Títulos de sección |
| `--fs-h2` | 24px | 1.2 | 600 | Subtítulos |
| `--fs-h3` | 18px | 1.3 | 600 | Títulos de card |
| `--fs-body` | 15px | 1.55 | 400 | Cuerpo de texto |
| `--fs-small` | 13px | 1.4 | 400 | Metadata, captions |
| `--fs-micro` | 11px | 1.3 | 600 | Labels, eyebrow, uppercase |

### 6.3 Tracking

- **Hero**: `letter-spacing: -0.03em` (tight).
- **Eyebrow / labels uppercase**: `letter-spacing: 0.08em` (loose).
- **Body**: 0 (normal).
- **Wordmark**: `letter-spacing: 0.14em` (muy abierto, premium).

### 6.4 Jerarquía

Dos pesos, tres tamaños por vista. Nunca más. Si hace falta más jerarquía, algo está mal en la arquitectura de información.

---

## 7. Iconografía

### 7.1 Estilo
- **Trazo**: outline, 1.5-2px stroke.
- **Esquinas**: redondeadas, `stroke-linecap="round"`.
- **Grid**: 24×24 canvas.
- **Color**: `currentColor` para heredar del contexto, excepto los 3 sagrados (rojo/azul/ámbar) que mantienen su significado semántico.

### 7.2 Glyphs en UI (no-iconos)
Permitidos: `▶ ♫ ◉ ◎ ◐ ☀ ☾ ✓ ✕ ⚠ 🔗`
Prohibidos: caritas, manos, objetos realistas.

---

## 8. Fotografía e imaginería

Fretwise **no usa fotografía de stock**. Jamás.

Nuestra imaginería es:
1. **Capturas reales del producto** (la app funcionando).
2. **Diagramas SVG vectoriales** (fretboards, diagramas de acordes, diagramas de inversiones).
3. **Ilustraciones geométricas mínimas** que usen la paleta de marca.

Si hace falta "humanizar", mostramos el producto en uso (fragmento de código, hoja de arreglos al lado de la pantalla), no una mano abstracta sosteniendo un teléfono.

---

## 9. Principios de UI

Estos principios son **invariantes** de cualquier superficie de Fretwise:

1. **Un solo color por pitch class.** C es siempre rojo. Nunca cambia entre vistas. La memoria muscular visual es parte del producto.
2. **Un solo color por grado.** 1 es siempre `--chord-red`. 3 es siempre `--chord-blue`. Independiente de la tonalidad.
3. **El fretboard es dark.** Siempre. Aun en light mode. Representa madera, no papel.
4. **Los cards son blancos en light, `--ink-900` en dark.** Nunca intermedios.
5. **Una sola fuente, dos pesos.**
6. **Animaciones: 150ms cubic-bezier(0.2, 0.8, 0.2, 1)** o ninguna. Respetamos `prefers-reduced-motion`.

---

## 10. Copy de producto — biblioteca

Frases canónicas. Cambiarlas requiere aprobación (si sos el único dev, al menos pensarlo 2 veces).

| Contexto | Copy oficial |
|---|---|
| Empty state fretboard | *Pulsá un traste, buscá un acorde, o elegí raíz + calidad.* |
| Nota única | *Una sola clase de altura.* |
| Power chord | *Raíz + 5ta justa, sin tercera.* |
| Intervalo | *Faltan notas para un acorde.* |
| Sin match | *Sin match.* |
| Escalas compatibles | *Escalas compatibles — click para superponer.* |
| Tooltip "Apilar" | *Cuando está activado, clickear voicings/inversiones los apila con colores distintos.* |
| Footer | *Fretwise · hecho en el navegador · sin servidores.* |

---

## 11. Checklist: ¿esto es Fretwise?

Antes de publicar algo con la marca, pasá esta lista:

- [ ] ¿El color primario de acción es `--chord-red`?
- [ ] ¿Los 3 puntos del logo mantienen orden y color correctos?
- [ ] ¿Las tipografías son las del stack del sistema?
- [ ] ¿El fondo del fretboard es `--wood-900`?
- [ ] ¿Hay máximo 2 pesos tipográficos en la vista?
- [ ] ¿El copy es directo, sin exageraciones, sin emojis decorativos?
- [ ] ¿Hay al menos un detalle técnico concreto (cifras, términos correctos)?
- [ ] ¿Se puede leer en dark mode sin romper contrastes?

Si todas están tildadas, es Fretwise.

---

*Este documento es vivo. Cambios mayores requieren bumpear la versión y dejar nota en el changelog al pie.*
