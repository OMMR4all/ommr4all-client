import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {UserIdleService} from "./common/user-idle.service";
import {Router} from "@angular/router";

export class UserConfigSettings {
  readingOrderColor = 'black';
  readingOrderStrokeWidth = 1;
  readingOrderOpacity = 0.5;
  readingOrderStrokeDash = '1';
  static copy(b: UserConfigSettings) {
    const m = new UserConfigSettings();
    m.copyFrom(b);
    return m;
  }
  copyFrom(b: UserConfigSettings): UserConfigSettings {
    this.readingOrderColor = b.readingOrderColor || 'black';
    this.readingOrderStrokeWidth = b.readingOrderStrokeWidth || 1;
    this.readingOrderOpacity = b.readingOrderOpacity || 0.5;
    this.readingOrderStrokeDash = b.readingOrderStrokeDash || '1';
    return this;
  }
}
@Injectable({
  providedIn: 'root'
})

export class UserViewSettingsService {
  private _userConfig = new BehaviorSubject<UserConfigSettings>(JSON.parse(localStorage.getItem('userconfig')));

  constructor(
    private http: HttpClient,
    private userIdle: UserIdleService,
    public router: Router,
  ) {

    if (localStorage.getItem('userconfig') === undefined) {

    }

    this._userConfig.subscribe(value => {
      if (!value) {
        localStorage.removeItem('userconfig');

      } else {
        localStorage.setItem('userconfig', JSON.stringify(value));
      }
    });

    if (this._userConfigStateVal === null) {
      const userSetting = new UserConfigSettings();
      this._userConfig.next(userSetting);
    }
  }
  get _userConfigStateObs() { return this._userConfig.asObservable(); }
  get _userConfigStateVal() { return this._userConfig.getValue(); }

  public _userConfigSet(config: UserConfigSettings) {this._userConfig.next(config); }
}
