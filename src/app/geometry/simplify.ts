/**
 * Polyline simplification (radial-distance pre-pass + Ramer-Douglas-Peucker).
 *
 * A direct port of Simplify.js (c) 2017 Vladimir Agafonkin, BSD licensed --
 * https://mourner.github.io/simplify-js. Inlined because the `simplify-js`
 * package ships CommonJS only and tripped an Angular optimization bailout on
 * every build. Behaviour is identical, including the `highestQuality` flag,
 * because it operates on stored page geometry.
 */

export interface SimplifyPoint {
  x: number;
  y: number;
}

/** Square distance between two points. */
function getSqDist(p1: SimplifyPoint, p2: SimplifyPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

/** Square distance from a point to a segment. */
function getSqSegDist(p: SimplifyPoint, p1: SimplifyPoint, p2: SimplifyPoint): number {
  let x = p1.x;
  let y = p1.y;
  let dx = p2.x - x;
  let dy = p2.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = p2.x;
      y = p2.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p.x - x;
  dy = p.y - y;

  return dx * dx + dy * dy;
}

/** Basic distance-based simplification. */
function simplifyRadialDist(points: SimplifyPoint[], sqTolerance: number): SimplifyPoint[] {
  let prevPoint = points[0];
  const newPoints = [prevPoint];
  let point: SimplifyPoint;

  for (let i = 1, len = points.length; i < len; i++) {
    point = points[i];
    if (getSqDist(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point) { newPoints.push(point); }

  return newPoints;
}

function simplifyDPStep(points: SimplifyPoint[], first: number, last: number,
                        sqTolerance: number, simplified: SimplifyPoint[]): void {
  let maxSqDist = sqTolerance;
  let index: number;

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);
    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 1) { simplifyDPStep(points, first, index, sqTolerance, simplified); }
    simplified.push(points[index]);
    if (last - index > 1) { simplifyDPStep(points, index, last, sqTolerance, simplified); }
  }
}

/** Simplification using the Ramer-Douglas-Peucker algorithm. */
function simplifyDouglasPeucker(points: SimplifyPoint[], sqTolerance: number): SimplifyPoint[] {
  const last = points.length - 1;
  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);
  return simplified;
}

/**
 * Both algorithms combined. Skipping the radial-distance pre-pass
 * (`highestQuality = true`) is more accurate but considerably slower.
 */
export function simplify(points: SimplifyPoint[], tolerance?: number,
                         highestQuality?: boolean): SimplifyPoint[] {
  if (points.length <= 2) { return points; }

  const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

  points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
  points = simplifyDouglasPeucker(points, sqTolerance);

  return points;
}
