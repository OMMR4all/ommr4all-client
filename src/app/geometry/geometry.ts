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
  subtract(p: Point) {
    return new Point(this.x - p.x, this.y - p.y);
  }
}

export class Line {
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
}
