import {computePisBands} from './pis-bands';
import {PageLine} from '../../../../data-types/page/pageLine';
import {Block} from '../../../../data-types/page/block';
import {Page} from '../../../../data-types/page/page';
import {StaffLine} from '../../../../data-types/page/music-region/staff-line';
import {Point, PolyLine} from '../../../../geometry/geometry';
import {BlockType} from '../../../../data-types/page/definitions';
import {PitchDetectionParams} from '../../../../data-types/page/pitch-detection-params';

const LD = 100;      // distance between two staff lines
const TOP_Y = 200;   // y of the topmost staff line
const N_LINES = 4;

function staff(params: PitchDetectionParams): PageLine {
  const page = new Page('', 1000, 700, 1000, 0);
  page.pitchParams = params;
  const block = Block.create(page, BlockType.Music);
  const line = new PageLine(block);
  for (let i = 0; i < N_LINES; i++) {
    const y = TOP_Y + i * LD;
    StaffLine.create(line, new PolyLine([new Point(0, y), new Point(600, y)]));
  }
  line.update();
  line.avgStaffLineDistance = line.computeAvgStaffLineDistance();
  return line;
}

function ysOf(points: string): number[] {
  return points.split(' ').map(p => Number(p.split(',')[1]));
}

/** The bands inside the gap below the second staff line, as fractions of that gap. */
function bandsOfOneGap(line: PageLine) {
  const gapTop = TOP_Y + LD;
  return computePisBands(line)
    .map(b => {
      const ys = ysOf(b.points);
      return {from: (Math.min(...ys) - gapTop) / LD, to: (Math.max(...ys) - gapTop) / LD, onStaffLine: b.onStaffLine};
    })
    .filter(b => b.from >= -0.001 && b.to <= 1.001)
    .map(b => ({from: Number(b.from.toFixed(3)), to: Number(b.to.toFixed(3)), onStaffLine: b.onStaffLine}));
}

describe('computePisBands', () => {
  it('splits a gap symmetrically with the default tolerances', () => {
    expect(bandsOfOneGap(staff(new PitchDetectionParams()))).toEqual([
      {from: 0, to: 0.3, onStaffLine: true},
      {from: 0.3, to: 0.7, onStaffLine: false},
      {from: 0.7, to: 1, onStaffLine: true},
    ]);
  });

  it('moves the boundaries with asymmetric tolerances', () => {
    expect(bandsOfOneGap(staff(new PitchDetectionParams(0.45, 0.15)))).toEqual([
      {from: 0, to: 0.45, onStaffLine: true},
      {from: 0.45, to: 0.85, onStaffLine: false},
      {from: 0.85, to: 1, onStaffLine: true},
    ]);
  });

  it('agrees with positionInStaff inside every band', () => {
    const line = staff(new PitchDetectionParams(0.45, 0.15));
    computePisBands(line).forEach(band => {
      const ys = ysOf(band.points);
      const pos = line.positionInStaff(new Point(300, (Math.min(...ys) + Math.max(...ys)) / 2));
      expect(pos % 2 === 1).toBe(band.onStaffLine);
    });
  });

  it('covers one gap above and below the staff', () => {
    const bands = computePisBands(staff(new PitchDetectionParams()));
    expect(bands.length).toBe((N_LINES + 1) * 3);
    const ys = bands.reduce((all, b) => all.concat(ysOf(b.points)), [] as number[]);
    expect(Math.min(...ys)).toBe(TOP_Y - LD);
    expect(Math.max(...ys)).toBe(TOP_Y + N_LINES * LD);
  });

  it('follows the curvature of a staff line', () => {
    const line = staff(new PitchDetectionParams());
    line.staffLines[1].coords = new PolyLine(
      [new Point(0, TOP_Y + LD), new Point(300, TOP_Y + LD + 40), new Point(600, TOP_Y + LD)]);
    line.update();

    // gap -1 and gap 0 contribute three bands each, so index 6 is the first band below that line
    const ys = ysOf(computePisBands(line)[6].points);
    expect(Math.min(...ys)).toBe(TOP_Y + LD);
    expect(Math.max(...ys)).toBe(TOP_Y + LD + 40 + 0.3 * (LD - 40));
  });

  it('draws nothing without at least two staff lines', () => {
    const page = new Page('', 1000, 700, 1000, 0);
    const line = new PageLine(Block.create(page, BlockType.Music));
    expect(computePisBands(line)).toEqual([]);
    StaffLine.create(line, new PolyLine([new Point(0, TOP_Y), new Point(600, TOP_Y)]));
    expect(computePisBands(line)).toEqual([]);
  });
});
