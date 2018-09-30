import { PolyLine, Point } from '../geometry/geometry';

export class TextBoundaryLines {
  static fromJson(json): TextBoundaryLines {
    const t = new TextBoundaryLines();
    if (json) {
      t.capital = PolyLine.fromJSON(json['capital']);
      t.upper = PolyLine.fromJSON(json['upper']);
      t.lower = PolyLine.fromJSON(json['lower']);
      t.bottom = PolyLine.fromJSON(json['bottom']);
    }
    return t;
  }
  constructor(
    public capital = new PolyLine([]),
    public upper = new PolyLine([]),
    public lower = new PolyLine([]),
    public bottom = new PolyLine([]),
  ) {}
}

export class TextLine {
  static fromJson(json): TextLine {
    const t = new TextLine();
    if (json) {
      for (const p of json['polygons']) {
        t.polygons.add(PolyLine.fromJSON(p));
      }
      t.boundaryLines = TextBoundaryLines.fromJson(json['boundaries']);
    }
    return t;
  }

  constructor(
    readonly polygons = new Set<PolyLine>(),
    public boundaryLines = new TextBoundaryLines()
  ) {}

}
