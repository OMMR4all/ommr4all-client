import {PolyLine, Rect} from 'src/app/geometry/geometry';
import {StaffEquiv} from './staff-equiv';
import {Region} from '../region';

export class StaffLine extends Region {
  private _staff: StaffEquiv;

  static create(
    staff: Region,
    coords = new PolyLine([])
  ) {
    const ml = new StaffLine();
    ml.coords = coords
    ml.attachToParent(staff);
    ml.updateSorting();
    ml._updateAABB();
    return ml;
  }

  static fromJson(json, staffEquiv: StaffEquiv): StaffLine {
    return StaffLine.create(
      staffEquiv,
      PolyLine.fromString(json.coords),
    );
  }

  constructor() {
    super();
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
    return this._staff;
  }

}
