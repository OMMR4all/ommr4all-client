/**
 * Boundaries of the on-line/in-space decision of a symbol, mirroring the server side
 * (database/file_formats/pcgts/page/pitchparams.py).
 *
 * Both values are fractions of the distance between two adjacent staff lines, measured
 * upward from the lower line of the gap:
 *
 *   [0, toleranceBottom]                -> on the lower staff line
 *   [toleranceBottom, 1-toleranceTop]   -> in the space
 *   [1-toleranceTop, 1]                 -> on the upper staff line
 *
 * The defaults reproduce the formerly hardcoded tolerance of 0.4 half staff spaces exactly.
 */
export class PitchDetectionParams {
  // a space band of at least this fraction always survives, see the server side
  static readonly MIN_SPACE_FRACTION = 0.1;
  static readonly DEFAULT_TOLERANCE = 0.3;

  constructor(
    public toleranceTop = PitchDetectionParams.DEFAULT_TOLERANCE,
    public toleranceBottom = PitchDetectionParams.DEFAULT_TOLERANCE,
    public forceClefsOnLine = true,
  ) {}

  static fromJson(d: any): PitchDetectionParams {
    if (!d) { return new PitchDetectionParams(); }
    return new PitchDetectionParams(
      d.toleranceTop === undefined || d.toleranceTop === null ? PitchDetectionParams.DEFAULT_TOLERANCE : d.toleranceTop,
      d.toleranceBottom === undefined || d.toleranceBottom === null ? PitchDetectionParams.DEFAULT_TOLERANCE : d.toleranceBottom,
      d.forceClefsOnLine === undefined || d.forceClefsOnLine === null ? true : !!d.forceClefsOnLine,
    );
  }

  copy(): PitchDetectionParams {
    return new PitchDetectionParams(this.toleranceTop, this.toleranceBottom, this.forceClefsOnLine);
  }

  equals(o: PitchDetectionParams): boolean {
    return !!o && o.toleranceTop === this.toleranceTop && o.toleranceBottom === this.toleranceBottom
      && o.forceClefsOnLine === this.forceClefsOnLine;
  }

  toJson() {
    return {
      toleranceTop: this.toleranceTop,
      toleranceBottom: this.toleranceBottom,
      forceClefsOnLine: this.forceClefsOnLine,
    };
  }

  clamped(): PitchDetectionParams {
    let top = Math.min(Math.max(Number(this.toleranceTop), 0), 1);
    let bottom = Math.min(Math.max(Number(this.toleranceBottom), 0), 1);
    if (isNaN(top) || isNaN(bottom)) { return new PitchDetectionParams(); }

    const max = 1 - PitchDetectionParams.MIN_SPACE_FRACTION;
    if (top + bottom > max) {
      // keep the requested ratio, but leave room for the space
      const scale = max / (top + bottom);
      top *= scale;
      bottom *= scale;
    }
    return new PitchDetectionParams(top, bottom, this.forceClefsOnLine);
  }
}

export const defaultPitchDetectionParams = new PitchDetectionParams();
