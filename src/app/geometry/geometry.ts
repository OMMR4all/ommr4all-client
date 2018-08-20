export class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
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
}
