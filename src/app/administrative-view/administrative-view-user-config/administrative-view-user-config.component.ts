import { Component, OnInit } from '@angular/core';
import {UserConfigSettings, UserViewSettingsService} from '../../user-view-settings.service';
import {Subscription} from "rxjs";

@Component({
  selector: 'app-administrative-view-user-config',
  templateUrl: './administrative-view-user-config.component.html',
  styleUrls: ['./administrative-view-user-config.component.scss']
})
export class AdministrativeViewUserConfigComponent implements OnInit {
  private _subscriptions = new Subscription();

  setting: UserConfigSettings;
  constructor(    private userViewSetting: UserViewSettingsService,
  ) { }
  ngOnInit(): void {
    this._subscriptions.add(
      this.userViewSetting._userConfigStateObs.subscribe(() => this.resetInfo())
    );
    this.resetInfo();
  }
  resetInfo() {
    this.setting = UserConfigSettings.copy(this.userViewSetting._userConfigStateVal);
  }
  change() {
    this.userViewSetting._userConfigSet(this.setting);
  }
}
