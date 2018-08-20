import { Line } from '../geometry/geometry';

export class StaffLine {
  line: Line;

  constructor(line: Line) {
    this.line = line;
  }

  getPath() {
    return this.line.getPath();
  }
}

export class Staff {
  lines: StaffLine[];

  constructor(lines: StaffLine[]) {
    this.lines = lines;
  }

}
