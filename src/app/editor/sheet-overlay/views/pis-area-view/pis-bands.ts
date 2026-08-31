import {PageLine} from '../../../../data-types/page/pageLine';
import {StaffLine} from '../../../../data-types/page/music-region/staff-line';
import {Point} from '../../../../geometry/geometry';

export interface PisBand {
  /** SVG polygon points of the band, following the curvature of the staff lines. */
  points: string;
  onStaffLine: boolean;
}

/** x positions at which the bands are evaluated: every point of every staff line, in their common range. */
function sampleXs(staffLines: StaffLine[]): number[] {
  let left = -Infinity;
  let right = Infinity;
  staffLines.forEach(sl => {
    const aabb = sl.coords.aabb();
    left = Math.max(left, aabb.left);
    right = Math.min(right, aabb.right);
  });
  if (!(left < right)) { return []; }

  const xs = new Set<number>([left, right]);
  staffLines.forEach(sl => sl.coords.points.forEach(p => {
    if (p.x > left && p.x < right) { xs.add(p.x); }
  }));
  return Array.from(xs).sort((a, b) => a - b);
}

/**
 * The area each position in staff claims on `line`: where a symbol counts as sitting on a staff line
 * and where it counts as sitting in the space between two of them.
 *
 * The boundaries come straight from the book's PitchDetectionParams, so editing them moves the bands.
 * Whether a band is a line or a space position is not assumed but asked of the line itself, which
 * keeps the colors right for the (rare) books whose staff lines are flagged as spaces -- their band
 * boundaries are shifted by half a gap, which this is not reproducing.
 */
export function computePisBands(line: PageLine): PisBand[] {
  const bands: PisBand[] = [];
  if (!line) { return bands; }
  const staffLines = line.staffLines.slice().sort((a, b) => a.coords.averageY() - b.coords.averageY());
  if (staffLines.length <= 1) { return bands; }

  const xs = sampleXs(staffLines);
  if (xs.length < 2) { return bands; }

  const params = line.pitchParams;
  const ld = line.avgStaffLineDistance || line.computeAvgStaffLineDistance();
  const yAt = (index: number, x: number) => {
    if (index < 0) { return staffLines[0].coords.interpolateY(x) - ld; }
    if (index >= staffLines.length) { return staffLines[staffLines.length - 1].coords.interpolateY(x) + ld; }
    return staffLines[index].coords.interpolateY(x);
  };

  // fractions of a gap, measured downwards from its upper line; the first and the last band belong
  // to a staff line, the one in between is the space
  const fractions = [0, params.toleranceTop, 1 - params.toleranceBottom, 1];
  const midX = xs[Math.floor(xs.length / 2)];

  // one gap above and one below the staff, so that the ledger positions are visible too
  for (let gap = -1; gap < staffLines.length; gap++) {
    const y = (x: number, f: number) => {
      const top = yAt(gap, x);
      return top + f * (yAt(gap + 1, x) - top);
    };

    for (let b = 0; b < fractions.length - 1; b++) {
      const from = fractions[b];
      const to = fractions[b + 1];
      if (to - from < 1e-6) { continue; }

      const points = xs.map(x => x + ',' + y(x, from))
        .concat(xs.slice().reverse().map(x => x + ',' + y(x, to)))
        .join(' ');
      const pos = line.positionInStaff(new Point(midX, y(midX, (from + to) / 2)));
      bands.push({points: points, onStaffLine: pos % 2 === 1});
    }
  }

  return bands;
}
