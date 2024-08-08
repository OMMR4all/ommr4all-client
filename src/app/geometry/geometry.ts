import {copyList} from '../utils/copy';
import {Constants} from '../data-types/page/definitions';

const SimplifyJs = require('simplify-js');

const PolyBool = require('polybooljs');

export class Point {
  static fromJSON(p) { return new Point(p.x * Constants.GLOBAL_SCALING, p.y * Constants.GLOBAL_SCALING); }

  static fromString(s: string): Point {
    const ps = s.split(',');
    return new Point(Number(ps[0]) * Constants.GLOBAL_SCALING, Number(ps[1]) * Constants.GLOBAL_SCALING);
  }

  toJSON() { return {x: this.x / Constants.GLOBAL_SCALING, y: this.y / Constants.GLOBAL_SCALING}; }
  toString(): string { return this.x / Constants.GLOBAL_SCALING + ',' + this.y / Constants.GLOBAL_SCALING; }
  toSVG(): string { return this.x + ',' + this.y; }

  constructor(public x: number, public y: number) { this.x = x; this.y = y; }

  copy() { return new Point(this.x, this.y); }
  deepCopy() { return this.copy(); }
  copyFrom(p: Point): Point {
    this.x = p.x;
    this.y = p.y;
    return this;
  }
  equals(p: Point): boolean { return p && this.x === p.x && this.y === p.y; }
  zero() { this.x = 0; this.y = 0; }
  isZero() { return this.x === 0 && this.y === 0; }
  addLocal(p: Point) { this.x += p.x; this.y += p.y; }
  subtractLocal(p: Point) { this.x -= p.x; this.y -= p.y; }
  subtract(p: Point) { return new Point(this.x - p.x, this.y - p.y); }
  add(p: Point) { return new Point(this.x + p.x, this.y + p.y); }
  translate(s: Size): Point { return new Point(this.x + s.w, this.y + s.h); }
  translateLocal(s: Size): void { this.x = this.x + s.w; this.y = this.y + s.h; }
  measure(p: Point) { return new Size(this.x - p.x, this.y - p.y); }
  divideLocal(s: number): void {
    if (s === 0) {
      console.error('Division by zero');
      this.x = this.y = 0;
    }
    this.x /= s;
    this.y /= s;
  }
  scale(s: number): Point { return new Point(this.x * s, this.y * s); }
  maxLocal(p: Point): Point {
    this.x = Math.max(this.x, p.x);
    this.y = Math.max(this.y, p.y);
    return this;
  }
  minLocal(p: Point): Point {
    this.x = Math.min(this.x, p.x);
    this.y = Math.min(this.y, p.y);
    return this;
  }
}

export class Line {
  p1: Point;
  p2: Point;

  static fromJSON(line) { return new Line(Point.fromJSON(line.p1), Point.fromJSON(line.p2)); }
  toJSON() { return {p1: this.p1.toJSON(), p2: this.p2.toJSON}; }
  toPolyline(): PolyLine { return new PolyLine([this.p1, this.p2]); }

  copy() { return new Line(this.p1, this.p2); }
  deepCopy() { return new Line(this.p1.deepCopy(), this.p2.deepCopy()); }

  constructor(p1: Point, p2: Point) { this.p1 = p1; this.p2 = p2; }

  lengthSqr(): number { return this.p2.measure(this.p1).lengthSqr(); }

  linePointDistanceSqr(p: Point): {d: number, l: number} {
    const dir = this.p2.measure(this.p1);
    if (dir.isZero()) {
      return {d: this.p2.measure(p).lengthSqr(), l: 0};
    }
    const len = dir.normalizeLocal();
    const v = p.measure(this.p1);
    const d = v.dot(dir);
    const pol = this.p1.translate(dir.scale(d));
    return {'d': pol.measure(p).lengthSqr(), 'l': d / len};
  }

  intersection(line: Line): Point {
    const p0 = this.p1;
    const p1 = this.p2;
    const p2 = line.p1;
    const p3 = line.p2;
    const s1 = p1.subtract(p0);
    const s2 = p3.subtract(p2);
    const d = -s2.x * s1.y + s1.x * s2.y;
    if (d === 0) { return null; }

    const s = (-s1.y * (p0.x - p2.x) + s1.x * (p0.y - p2.y)) / d;
    const t = ( s2.x * (p0.y - p2.y) - s2.y * (p0.x - p2.x)) / d;

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      // Collision detected
      return new Point(p0.x + (t * s1.x), p0.y + (t * s1.y));
    }

    return null; // No collision
  }

  y(x: number) {
    const m = (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);
    const t = this.p1.y;
    const d = x - this.p1.x;
    return m * d + t;
  }

  crossSize() {
    return (this.p2.x - this.p1.x) * (this.p2.y + this.p1.y);
  }
}

export enum SingleSelect {
  Minimum,
  Maximum,
}

export class PolyLine {
  points = new Array<Point>();

  static fromJSON(points) {
    if (!points) { return new PolyLine([]); }

    const pp = [];
    for (const p of points) {
      pp.push(Point.fromJSON(p));
    }
    return new PolyLine(pp);
  }

  static fromString(s: string): PolyLine {
    if (s.length === 0) { return new PolyLine([]); }
    return new PolyLine(
      s.split(' ').map(p => Point.fromString(p))
    );
  }

  static multiUnionFilled(ps: Array<PolyLine>, iter = 1): Array<PolyLine> {
    const polygons = ps.map(p => p.toPolyBool());
    let segments = PolyBool.segments(polygons[0]);
    for (let i = 1; i < polygons.length; i++) {
      const seg2 = PolyBool.segments(polygons[i]);
      const comb = PolyBool.combine(segments, seg2);
      segments = PolyBool.selectUnion(comb);
    }

    if (iter === 0) {
      return PolyLine.fromPolyBool(PolyBool.polygon(segments));
    } else {
      return PolyLine.multiUnionFilled(PolyLine.fromPolyBool(PolyBool.polygon(segments)), iter - 1);
    }
  }

  private static fromPolyBoolMode(d, mode: SingleSelect): PolyLine {
    if (d.regions.length === 0) { return new PolyLine([]); }
    const pls = d.regions.map(r => new PolyLine(r.map(p => new Point(p[0], p[1]))));
    if (mode === SingleSelect.Maximum) {
      return pls.reduce((prev, cur) => prev.aabb().area > cur.aabb().area ? prev : cur);
    } else {
      return pls.reduce((prev, cur) => prev.aabb().area < cur.aabb().area ? prev : cur);
    }
  }

  private static fromPolyBool(d): Array<PolyLine> {
    return d.regions.map(r => new PolyLine(r.map(p => new Point(p[0], p[1]))));
  }

  toJSON() {
    return this.points.map(p => p.toJSON());
  }

  toString(): string {
    return this.points.map(p => p.toString()).join(' ');
  }

  toSVG(): string {
    return this.points.map(p => p.toSVG()).join(' ');
  }

  private toPolyBool() {
    return {
      regions: [ this.points.map(p => [p.x, p.y])],
      inverted: false,
    };
  }

  moveRef(polyLine: PolyLine) {
    this.points = polyLine.points;
  }

  copyPointsFrom(polyLine: PolyLine) {
    this.points.length = 0;
    this.points.push(...polyLine.points);
  }

  copyFrom(polyLine: PolyLine) {
    this.points = polyLine.points.map(p => p.copy());
  }

  constructor(points: Point[], duplicityCheck = true) {
    if (points.length > 1 && duplicityCheck) {
      // remove double points
      let lastPoint: Point = points[points.length - 1];
      points.forEach(p => {
        if (!lastPoint || !lastPoint.equals(p)) {
          lastPoint = p;
          this.points.push(p);
        }
      });
    } else {
      this.points = points;
    }
  }

  copy() { return new PolyLine(copyList(this.points)); }
  deepCopy() { return new PolyLine(this.points.map(p => p.deepCopy())); }

  getPath() {
    let s = '';
    this.points.forEach(function (point) {
      s += point.x + ',' + point.y + ' ';
    });
    return s;
  }

  translateLocal(t: Size): void {
    this.points.forEach(function (p) {
      p.translateLocal(t);
    });
  }

  get length() { return this.points.length; }

  equals(p: PolyLine): boolean {
    if (p.length !== this.length) { return false; }
    for (let i = 0; i < this.length; i++) {
      if (!p.points[i].equals(this.points[i])) { return false; }
    }
    return true;
  }

  aabb(): Rect {
    if (this.points.length === 0) {
      return new Rect(new Point(0, 0), new Size(0, 0));
    }

    const tl = this.points[0].copy();
    const br = tl.copy();

    for (let i = 1; i < this.points.length; i++) {
      tl.minLocal(this.points[i]);
      br.maxLocal(this.points[i]);
    }

    return new Rect(tl, br.measure(tl));
  }

  averageY(): number {
    if (this.points.length === 0) {
      return 0;
    }
    let d = 0;
    for (const point of this.points) {
      d += point.y;
    }
    return d /= this.points.length;
  }

  intersectsWithRect(r: Rect): boolean {
    // TODO: Currently only checks if one point is in rect
    for (const point of this.points) {
      if (r.containsPoint(point)) {
        return true;
      }
    }

    return false;
  }
  interpolateY(x: number): number {
    if (this.points.length < 2) {
      console.error('Interpolate requires at least two valid points.');
      return 0;
    }
    let p1 = this.points[0];
    let p2 = this.points[1];
    for (let i = 2; i < this.points.length; i++) {
      if (x > p2.x) {
        p1 = p2;
        p2 = this.points[i];
      }
    }

    const line = new Line(p1, p2);
    return line.y(x);
  }
  intersects_with_array(x: number) {
    let p1 = this.points[this.points.length - 1];
    const intersects = [];
    for (let i = 0; i < this.points.length; i++) {
      const p2 = this.points[i];
      const intersection = this.intersects(x, p1.x, p1.y, p2.x, p2.y);
      p1 = p2;
      if (intersection) {
        intersects.push(intersection);
      }
    }
    return intersects;
  }
  intersects(x: number, x1: number, y1: number, x2: number, y2: number) {
    const top = this.aabb().top;
    const bottom = this.aabb().bottom;
    const lX1 = x;
    const lX2 = x;
    const lY1 = bottom + 5;
    const lY2 = top - 5;
    /*
    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (lX1 === lX2 && lY1 === lY2)) {
      return false;
    }

    const denominator = ((lY2 - lY1) * (x2 - x1) - (lX2 - lX1) * (y2 - y1));

    // Lines are parallel
    if (denominator === 0) {
      return false;
    }

    const ua = ((lX2 - lX1) * (y1 - lY1) - (lY2 - lY1) * (x1 - lY1)) / denominator;
    const ub = ((x2 - x1) * (y1 - lY1) - (y2 - y1) * (x1 - lX1)) / denominator;

    // is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
      return false;
    }

    // Return a object with the x and y coordinates of the intersection
    const xNew = x1 + ua * (x2 - x1);
    const yNew = y1 + ua * (y2 - y1);

    return {xNew, yNew};
     */
    const line = new Line(new Point(x1, y1), new Point(x2, y2));
    const line2 = new Line(new Point(lX1, lY1), new Point(lX2, lY2));
    return line.intersection(line2);
  }
  sort(comparator: (p1: Point, p2: Point) => number): void {
    this.points = this.points.sort(comparator);
  }

  isClockWise() {
    let area = 0;
    this.edges().forEach(edge => area += edge.crossSize());
    return area > 0;
  }

  edges(): Array<Line> {
    const lines: Array<Line> = [];
    for (let i = 0; i < this.points.length; ++i) {
      lines.push(new Line(this.points[i], this.points[(i + 1) % this.points.length]));
    }
    return lines;
  }

  closestLineInsertIndexToPoint(p: Point): number {
    let closestDist2 = 1e10;
    let closestIndex = -1;
    for (let i = 0; i < this.points.length; ++i) {
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % this.points.length];
      const line = new Line(p1, p2);
      const d2 = p1.measure(p).lengthSqr();
      if (d2 < closestDist2) {
        const prev = this.points[(i - 1 + this.points.length) % this.points.length];
        const next = this.points[(i + 1) % this.points.length];
        const prev_p = p1.measure(prev).normalize();
        const next_p = p1.measure(next).normalize();
        const d = (prev_p.add(next_p)).normalize();
        const target_p = p1.measure(p);
        if (target_p.cross(d) <= 0) {
          closestIndex = i;
        } else {
          closestIndex = (i + 1) % this.points.length;
        }
        closestDist2 = d2;
      }
      const dl = line.linePointDistanceSqr(p);
      if (dl.l >= 0 && dl.l <= 1) {
        if (dl.d < closestDist2) {
          closestIndex = i + 1;
          closestDist2 = dl.d;
        }
      }
    }
    return closestIndex;
  }

  fitPointToClosest(p: Point): void {
    const idx = this.points.indexOf(p);
    if (idx >= 0) {
      const copy = new PolyLine(this.points.filter(point => point !== p));
      copy.points.splice(copy.closestLineInsertIndexToPoint(p), 0, p);
      this.points = copy.points;
    } else {
      console.warn('Point not part of polyline');
    }
  }

  simplify(tolerance: number): PolyLine {
    return new PolyLine(SimplifyJs(this.points, tolerance, false).map(p => new Point(p.x, p.y)));
  }

  differenceSingle(p: PolyLine, mode = SingleSelect.Minimum): PolyLine {
    if (this.points.length === 0 || p.points.length === 0) { return this; }
    const diff = PolyBool.difference(this.toPolyBool(), p.toPolyBool());
    return PolyLine.fromPolyBoolMode(diff, mode);
  }

  difference(p: PolyLine): Array<PolyLine> {
    if (this.points.length === 0 || p.points.length === 0) { return [this]; }
    const diff = PolyBool.difference(this.toPolyBool(), p.toPolyBool());
    return PolyLine.fromPolyBool(diff);
  }

  union(p: PolyLine): Array<PolyLine> {
    return PolyLine.fromPolyBool(PolyBool.union(this.toPolyBool(), p.toPolyBool()));
  }

}

export class Size {
  w: number;
  h: number;

  static fromJSON(size) {
    return new Size(size.w, size.h);
  }

  toJSON() {
    return {w: this.w, h: this.h};
  }

  constructor(w: number = 0, h: number = 0) {
    this.w = w;
    this.h = h;
  }
  copy(): Size {
    return new Size(this.w, this.h);
  }
  copyFrom(s: Size): Size {
    this.w = s.w;
    this.h = s.h;
    return this;
  }
  equals(s: Size): boolean {
    return s && this.w === s.w && this.h === s.h;
  }
  zero(): void {
    this.w = 0;
    this.h = 0;
  }
  add(s: Size): Size {
    return new Size(this.w + s.w, this.h + s.h);
  }
  get area(): number {
    return this.w * this.h;
  }
  lengthSqr(): number {
    return this.w * this.w + this.h * this.h;
  }
  length(): number {
    return Math.sqrt(this.w * this.w + this.h * this.h);
  }
  normalize(): Size {
    const n = Math.sqrt(this.lengthSqr());
    return new Size(this.w / n, this.h / n);
  }
  normalizeLocal(): number {
    const n = Math.sqrt(this.lengthSqr());
    this.w /= n;
    this.h /= n;
    return n;
  }
  dot(s: Size) {
    return this.w * s.w + this.h * s.h;
  }
  cross(s: Size) {
    return this.w * s.h - this.h * s.w;
  }
  scale(s: number) {
    return new Size(this.w * s, this.h * s);
  }
  isZero() {
    return this.w === 0 && this.h === 0;
  }
}

export class Rect {
  private _origin: Point;
  private _size: Size;

  static fromJSON(rect) {
    return new Rect(Point.fromJSON(rect.origin), Size.fromJSON(rect.size));
  }

  toJSON() {
    return {origin: this._origin.toJSON(), size: this._size.toJSON()};
  }

  toPolyline(): PolyLine {
    return new PolyLine([this.tl(), this.tr(), this.br(), this.bl()]);
  }

  constructor(origin: Point = new Point(0, 0), size: Size = new Size(0, 0)) {
    this._origin = origin;
    this.size = size;
  }
  copy(): Rect {
    return new Rect(this._origin.copy(), this._size.copy());
  }
  copyFrom(rect: Rect): Rect {
    this._origin.copyFrom(rect._origin);
    this._size.copyFrom(rect._size);
    return this;
  }

  equals(r: Rect): boolean {
    return r && this._origin.equals(r.origin) && this._size.equals(r.size);
  }
  get size(): Size {
    return this._size;
  }
  get origin(): Point {
    return this._origin;
  }
  get area(): number {
    return this.size.area;
  }

  tl(): Point {
    return this._origin.copy();
  }

  tr(): Point {
    return this._origin.add(new Point(this._size.w, 0));
  }

  bl(): Point {
    return this._origin.add(new Point(0, this._size.h));
  }

  br(): Point {
    return this._origin.translate(this._size);
  }

  get left() { return this._origin.x; }
  get top() { return this._origin.y; }
  get bottom() { return this._origin.y + this._size.h; }
  get right() { return this._origin.x + this._size.w; }
  center() { return new Point(this._origin.x + this.size.w / 2, this._origin.y + this.size.h / 2); }
  vcenter() { return this._origin.y + this.size.h * 0.5; }
  hcenter() { return this._origin.x + this.size.w * 0.5; }


  setN(y: number) {
    this._size.h += this._origin.y - y;
    this._origin.y = y;
    this.size = this._size;  // force update
  }

  setE(x: number) {
    this._size.w += x - this._origin.x - this._size.w;
    this.size = this._size;  // force update
  }

  setS(y: number) {
    this._size.h += y - this._origin.y - this._size.h;
    this.size = this._size;  // force update
  }

  setW(x: number) {
    this._size.w += this._origin.x - x;
    this._origin.x = x;
    this.size = this._size;  // force update
  }

  set size(s: Size) {
    this._size = s;
    if (this._size.w < 0) {
      this._origin.x += this._size.w;
      this._size.w = -this._size.w;
    }
    if (this._size.h < 0) {
      this._origin.y += this._size.h;
      this._size.h = -this._size.h;
    }
  }
  set origin(o: Point) {
    this._origin = o;
  }

  zero() {
    this._origin.zero();
    this._size.zero();
  }

  get isZero(): boolean {
    return this._size.isZero();
  }

  noIntersectionWithRect(rect: Rect): boolean {
    return this.top > rect.bottom || this.bottom < rect.top || this.left > rect.right || this.right < rect.left;
  }

  intersetcsWithRect(rect: Rect): boolean {
    return !this.noIntersectionWithRect(rect);
  }

  union(rect: Rect): Rect {
    if (this.isZero) { return rect.copy(); }
    if (rect.isZero) { return this.copy(); }
    const tl = this.tl().minLocal(rect.tl());
    return new Rect(tl, this.br().maxLocal(rect.br()).measure(tl));
  }

  containsPoint(p: Point): boolean {
    return p.x >= this._origin.x && p.y >= this._origin.y && p.x <= this._origin.x + this._size.w && p.y <= this._origin.y + this._size.h;
  }

  distanceSqrToPoint(p: Point): number {
    if (p.x >= this._origin.x && p.x <= this._origin.x + this._size.w
      && p.y >= this._origin.y && p.y <= this._origin.y + this._size.h) {
      return 0;
    }
    const p1 = this.tl().measure(p).lengthSqr();
    const p2 = this.tr().measure(p).lengthSqr();
    const p3 = this.br().measure(p).lengthSqr();
    const p4 = this.bl().measure(p).lengthSqr();
    const d1 = (new Line(this.tl(), this.tr())).linePointDistanceSqr(p);
    const d2 = (new Line(this.tr(), this.br())).linePointDistanceSqr(p);
    const d3 = (new Line(this.br(), this.bl())).linePointDistanceSqr(p);
    const d4 = (new Line(this.bl(), this.tl())).linePointDistanceSqr(p);

    let d = Math.min(p1, Math.min(p2, Math.min(p3, p4)));
    for (const di of [d1, d2, d3, d4]) {
      if (di && di.l >= 0 && di.l <= 1) {
        d = Math.min(di.d, d);
      }
    }

    return d;
  }
}
