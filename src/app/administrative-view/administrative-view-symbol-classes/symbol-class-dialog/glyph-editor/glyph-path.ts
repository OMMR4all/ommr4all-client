/**
 * The subset of SVG path syntax the visual glyph editor can round-trip.
 *
 * Glyph paths are authored in a 100x100 viewBox with the visual centre at (50,50); the sheet
 * overlay scales that box to two staff-line distances (see `SymbolComponent.genericGlyphTransform`).
 * Only absolute `M`/`L`/`Q`/`Z` are emitted. Parsing additionally accepts the relative forms and
 * `H`/`V`, so a path written by hand usually still opens in the editor. Anything else -- notably
 * the arcs of the shipped presets in `SYMBOL_GLYPH_PRESETS` -- is reported as not representable
 * rather than silently rewritten.
 */
export type GlyphNodeCommand = 'M' | 'L' | 'Q' | 'Z';

export interface GlyphNode {
  cmd: GlyphNodeCommand;
  /** Anchor point; undefined for `Z`. */
  x?: number;
  y?: number;
  /** Quadratic control point; only set for `Q`. */
  cx?: number;
  cy?: number;
}

const SUPPORTED = 'MLQZmlqzHVhv';

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Parses `d`, or returns null if it uses a command the editor cannot represent. */
export function parseGlyphPath(d: string): GlyphNode[] {
  if (!d || d.trim().length === 0) { return []; }
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
  if (!tokens) { return null; }

  const nodes: GlyphNode[] = [];
  let cmd = '';
  let i = 0;
  let cur = {x: 0, y: 0};
  let start = {x: 0, y: 0};

  const num = () => {
    const t = tokens[i++];
    const v = Number(t);
    return (t === undefined || isNaN(v)) ? NaN : v;
  };

  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) {
      cmd = tokens[i++];
      if (SUPPORTED.indexOf(cmd) < 0) { return null; }
    } else if (cmd === '') {
      return null;
    } else if (cmd === 'M') {
      cmd = 'L';        // an implicit repetition after a moveto is a lineto
    } else if (cmd === 'm') {
      cmd = 'l';
    }

    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? cur.x : 0;
    const oy = rel ? cur.y : 0;

    switch (cmd.toUpperCase()) {
      case 'Z':
        nodes.push({cmd: 'Z'});
        cur = {...start};
        break;
      case 'M': {
        const x = num() + ox, y = num() + oy;
        if (isNaN(x) || isNaN(y)) { return null; }
        nodes.push({cmd: 'M', x, y});
        cur = {x, y};
        start = {x, y};
        break;
      }
      case 'L': {
        const x = num() + ox, y = num() + oy;
        if (isNaN(x) || isNaN(y)) { return null; }
        nodes.push({cmd: 'L', x, y});
        cur = {x, y};
        break;
      }
      case 'H': {
        const x = num() + ox;
        if (isNaN(x)) { return null; }
        nodes.push({cmd: 'L', x, y: cur.y});
        cur = {x, y: cur.y};
        break;
      }
      case 'V': {
        const y = num() + oy;
        if (isNaN(y)) { return null; }
        nodes.push({cmd: 'L', x: cur.x, y});
        cur = {x: cur.x, y};
        break;
      }
      case 'Q': {
        const cx = num() + ox, cy = num() + oy, x = num() + ox, y = num() + oy;
        if (isNaN(cx) || isNaN(cy) || isNaN(x) || isNaN(y)) { return null; }
        nodes.push({cmd: 'Q', cx, cy, x, y});
        cur = {x, y};
        break;
      }
      default:
        return null;
    }
  }
  // a path that starts with anything but a moveto is not a shape the editor can extend
  if (nodes.length > 0 && nodes[0].cmd !== 'M') { return null; }
  return nodes;
}

export function serializeGlyphPath(nodes: GlyphNode[]): string {
  return nodes.map(n => {
    if (n.cmd === 'Z') { return 'Z'; }
    if (n.cmd === 'Q') { return `Q ${round(n.cx)} ${round(n.cy)} ${round(n.x)} ${round(n.y)}`; }
    return `${n.cmd} ${round(n.x)} ${round(n.y)}`;
  }).join(' ');
}

/**
 * Approximates an arbitrary path by sampling it into a polyline, so a preset or a hand-written
 * curve can be opened in the editor. Subpaths are joined, which is why this only ever runs on an
 * explicit request by the user.
 */
export function flattenToGlyphNodes(d: string, samples = 48): GlyphNode[] {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  el.setAttribute('d', d);
  const total = el.getTotalLength();
  if (!total) { return []; }
  const nodes: GlyphNode[] = [];
  for (let i = 0; i <= samples; i++) {
    const p = el.getPointAtLength(total * i / samples);
    nodes.push({cmd: i === 0 ? 'M' : 'L', x: p.x, y: p.y});
  }
  return nodes;
}
