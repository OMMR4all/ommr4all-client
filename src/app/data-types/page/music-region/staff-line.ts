import {PolyLine, Rect} from 'src/app/geometry/geometry';
import {Region} from '../region';
import {IdType} from '../id-generator';
import {PageLine} from '../pageLine';

export class StaffLine extends Region {
  static create(
    staff: Region,
    coords = new PolyLine([])
  ) {
    const ml = new StaffLine();
    ml.coords = coords;
    ml.attachToParent(staff);
    ml.updateSorting();
    ml._updateAABB();
    return ml;
  }

  static fromJson(json, staffEquiv: Region): StaffLine {
    return StaffLine.create(
      staffEquiv,
      PolyLine.fromString(json.coords),
    );
  }

  constructor() {
    super(IdType.StaffLine);
  }


  toJson() {
    return {
      coords: this.coords.toString(),
    };
  }

  updateSorting() {
    this.coords.sort((a, b) => a.x - b.x);
  }

  getPath() {
    return this.coords.getPath();
  }

  get staff() {
    return this.parent as PageLine;
  }

}
