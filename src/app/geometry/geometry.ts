import {forEach} from '../../../node_modules/@angular/router/src/utils/collection';

export class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  copy() {
    return new Point(this.x, this.y);
  }
  copyFrom(p: Point): Point {
    this.x = p.x;
    this.y = p.y;
    return this;
  }
  zero() {
    this.x = 0;
    this.y = 0;
  }
  addLocal(p: Point) {
    this.x += p.x;
    this.y += p.y;
  }
  subtractLocal(p: Point) {
    this.x -= p.x;
    this.y -= p.y;
  }
  add(p: Point) {
    return new Point(this.x + p.x, this.y + p.y);
  }
  translate(s: Size) {
    return new Point(this.x + s.w, this.y + s.h);
  }
  subtract(p: Point) {
    return new Point(this.x - p.x, this.y - p.y);
  }
  measure(p: Point) {
    return new Size(this.x - p.x, this.y - p.y);
  }
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
  constructor(p1: Point, p2: Point) {
    this.p1 = p1;
    this.p2 = p2;
  }

  lengthSqr(): number {
    return this.p2.measure(this.p1).lengthSqr();
  }

  linePointDistanceSqr(p: Point): {d: number, l: number} {
    const dir = this.p2.measure(this.p1);
    if (dir.isZero()) {
      return null;
    }
    const len = dir.normalizeLocal();
    const v = p.measure(this.p1);
    const d = v.dot(dir);
    const pol = this.p1.translate(dir.scale(d));
    return {'d': pol.measure(p).lengthSqr(), 'l': d / len};
  }

  y(x: number) {
    const m = (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);
    const t = this.p1.y;
    const d = x - this.p1.x;
    return m * d + t;
  }
}

export class PolyLine {
  points: Point[];
  constructor(points: Point[]) {
    this.points = points;
  }
  getPath() {
    let s = '';
    this.points.forEach(function (point) {
      s += point.x + ',' + point.y + ' ';
    });
    return s;
  }

  translate(t: Point) {
    this.points.forEach(function (p) {
      p.addLocal(t);
    });
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
}

export class Size {
  w: number;
  h: number;
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
  zero() {
    this.w = 0;
    this.h = 0;
  }
  lengthSqr() {
    return this.w * this.w + this.h * this.h;
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
  constructor(origin: Point, size: Size) {
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
  get size(): Size {
    return this._size;
  }
  get origin(): Point {
    return this._origin;
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

  intersetcsWithRect(rect: Rect): boolean {
    return this._origin.x + this._size.w > rect._origin.x ||
      this._origin.y + this._size.h > rect._origin.y ||
      rect._origin.x + rect._size.w > this._origin.x ||
      rect._origin.y + rect._size.h > this._origin.y;
  }

  union(rect: Rect): Rect {
    const tl = this.tl().minLocal(rect.tl());
    return new Rect(tl, this.br().maxLocal(rect.br()).measure(tl));
  }

  containsPoint(p: Point): boolean {
    return p.x >= this._origin.x && p.y >= this._origin.y && p.x <= this._origin.x + this._size.w && p.y <= this._origin.y + this._size.h;
  }

  distanceSqrToPoint(p: Point): number {
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
