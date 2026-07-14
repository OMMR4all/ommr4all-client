import { Injectable, inject } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import { HttpClient } from "@angular/common/http";
import {UserIdleService} from "./common/user-idle.service";
import {Router} from "@angular/router";

export class UserConfigSettings {
  readingOrderColor = 'black';
  readingOrderStrokeWidth = 1;
  readingOrderOpacity = 0.5;
  readingOrderStrokeDash = '1';
  // tool-bar buttons hidden in the overflow menu of their section, keyed by
  // section id (see tool-bar-buttons.ts); an empty map is the default layout
  toolbarHiddenButtons: {[section: string]: string[]} = {};
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
    this.toolbarHiddenButtons = b.toolbarHiddenButtons || {};
    return this;
  }
}
@Injectable({
  providedIn: 'root'
})

export class UserViewSettingsService {
  private http = inject(HttpClient);
  private userIdle = inject(UserIdleService);
  router = inject(Router);

  private _userConfig = new BehaviorSubject<UserConfigSettings>(JSON.parse(localStorage.getItem('userconfig')));

  constructor() {

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

  /** Returns undefined if the user has not customized the section yet
   *  (callers then fall back to the catalog's default-hidden buttons). */
  public hiddenToolbarButtons(section: string): string[] | undefined {
    const c = this._userConfigStateVal;
    return c && c.toolbarHiddenButtons ? c.toolbarHiddenButtons[section] : undefined;
  }

  public setHiddenToolbarButtons(section: string, ids: string[]) {
    const m = UserConfigSettings.copy(this._userConfigStateVal || new UserConfigSettings());
    m.toolbarHiddenButtons = Object.assign({}, m.toolbarHiddenButtons, {[section]: ids});
    this._userConfig.next(m);
  }
}
