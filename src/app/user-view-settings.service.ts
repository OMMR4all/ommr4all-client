import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {
  APPEARANCE_SETTINGS,
  AppearanceGroupId,
  appearanceDefault,
  appearanceSetting,
} from "./editor/appearance/appearance-settings";

const STORAGE_KEY = 'userconfig';

/** stroke-dasharray values written by the removed user config page. */
const LEGACY_DASH_VALUES = {'None': 'none', '4 1': '4 2'};

export class UserConfigSettings {
  // tool-bar buttons hidden in the overflow menu of their section, keyed by
  // section id (see tool-bar-buttons.ts); an empty map is the default layout
  toolbarHiddenButtons: Record<string, string[]> = {};
  // sheet-overlay appearance, keyed by the ids of appearance-settings.ts;
  // missing entries fall back to the catalog default
  appearance: Record<string, string | number> = {};

  static copy(b: UserConfigSettings) {
    const m = new UserConfigSettings();
    m.copyFrom(b);
    return m;
  }

  copyFrom(b: UserConfigSettings): UserConfigSettings {
    if (!b) { return this; }
    this.toolbarHiddenButtons = b.toolbarHiddenButtons ?? {};
    // only keep ids the catalog still knows, so removed settings do not linger
    // in local storage forever
    this.appearance = {};
    const appearance = b.appearance ?? {};
    Object.keys(appearance).forEach(id => {
      if (appearanceSetting(id) !== undefined && appearance[id] !== undefined && appearance[id] !== null) {
        this.appearance[id] = appearance[id];
      }
    });
    UserConfigSettings.migrateLegacyReadingOrder(b, this.appearance);
    return this;
  }

  /** Carries the four settings of the old administrative user config page over. */
  private static migrateLegacyReadingOrder(b: UserConfigSettings, appearance: Record<string, string | number>) {
    const legacyValues = b as unknown as Record<string, string | number>;
    const take = (legacy: string, id: string, transform?: (v: string | number) => string | number) => {
      const value = legacyValues[legacy];
      if (value === undefined || value === null || appearance[id] !== undefined) { return; }
      appearance[id] = transform ? transform(value) : value;
    };
    take('readingOrderColor', 'readingOrder.symbolColor');
    take('readingOrderStrokeWidth', 'readingOrder.symbolWidth');
    take('readingOrderOpacity', 'readingOrder.symbolOpacity');
    take('readingOrderStrokeDash', 'readingOrder.symbolDash', v => LEGACY_DASH_VALUES[v] ?? v);
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserViewSettingsService {
  private _userConfig = new BehaviorSubject<UserConfigSettings>(UserViewSettingsService.load());
  /** resolved appearance values (stored value or catalog default), rebuilt on every change */
  private _appearance: Record<string, string | number> = {};

  private static load(): UserConfigSettings {
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      // a corrupt entry must not break the construction of this root service
      console.warn('Discarding invalid user configuration in local storage', e);
    }
    // always normalize: the stored blob is a plain object that predates every
    // setting added since it was written
    return UserConfigSettings.copy(stored);
  }

  constructor() {
    this._userConfig.subscribe(value => {
      this.resolveAppearance(value);
      if (!value) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      }
    });
  }

  get _userConfigStateObs() { return this._userConfig.asObservable(); }
  get _userConfigStateVal() { return this._userConfig.getValue(); }

  public _userConfigSet(config: UserConfigSettings) { this._userConfig.next(config); }

  private resolveAppearance(config: UserConfigSettings) {
    const resolved = {};
    APPEARANCE_SETTINGS.forEach(s => {
      const stored = config && config.appearance ? config.appearance[s.id] : undefined;
      resolved[s.id] = stored === undefined || stored === null ? s.default : stored;
    });
    this._appearance = resolved;
  }

  /** The effective value of an appearance setting (never undefined). */
  public appearance(id: string): string | number {
    const value = this._appearance[id];
    return value === undefined ? appearanceDefault(id) : value;
  }

  public appearanceNumber(id: string): number {
    const value = this.appearance(id);
    const n = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(n) ? Number(appearanceDefault(id)) : n;
  }

  public appearanceString(id: string): string {
    return String(this.appearance(id));
  }

  /** True if the user has overridden the catalog default. */
  public isAppearanceCustomized(id: string): boolean {
    const c = this._userConfigStateVal;
    return !!(c && c.appearance && c.appearance[id] !== undefined);
  }

  public setAppearance(id: string, value: string | number) {
    const m = UserConfigSettings.copy(this._userConfigStateVal);
    m.appearance = Object.assign({}, m.appearance, {[id]: value});
    this._userConfig.next(m);
  }

  /** Drops the user's values of one group, or of everything if no group is given. */
  public resetAppearance(group?: AppearanceGroupId) {
    const m = UserConfigSettings.copy(this._userConfigStateVal);
    const appearance = Object.assign({}, m.appearance);
    Object.keys(appearance).forEach(id => {
      const def = appearanceSetting(id);
      if (!group || (def && def.group === group)) {
        delete appearance[id];
      }
    });
    m.appearance = appearance;
    this._userConfig.next(m);
  }

  /** Returns undefined if the user has not customized the section yet
   *  (callers then fall back to the catalog's default-hidden buttons). */
  public hiddenToolbarButtons(section: string): string[] | undefined {
    const c = this._userConfigStateVal;
    return c && c.toolbarHiddenButtons ? c.toolbarHiddenButtons[section] : undefined;
  }

  public setHiddenToolbarButtons(section: string, ids: string[]) {
    const m = UserConfigSettings.copy(this._userConfigStateVal);
    m.toolbarHiddenButtons = Object.assign({}, m.toolbarHiddenButtons, {[section]: ids});
    this._userConfig.next(m);
  }
}
