import { Injectable } from '@angular/core';
import { Staffs } from './musical-symbols/StaffLine';

@Injectable({
  providedIn: 'root'
})
export class StaffsService {
  private _staffs = new Staffs();

  constructor() { }

  get staffs() {
    return this._staffs;
  }
}
