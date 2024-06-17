import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {GlobalSettingsService} from '../global-settings.service';
import {AuthenticationService, GlobalPermissions} from '../authentication/authentication.service';
import {UserViewSettingsService} from '../user-view-settings.service';

@Component({
  selector: 'app-administrative-view',
  templateUrl: './administrative-view.component.html',
  styleUrls: ['./administrative-view.component.scss']
})
export class AdministrativeViewComponent implements OnInit {
  readonly view = new BehaviorSubject<string>('');

  get mayViewTasks() { return this.authentication.hasPermission(GlobalPermissions.TasksList); }

  constructor(
    private route: ActivatedRoute,
    public settings: GlobalSettingsService,
    private authentication: AuthenticationService,
    private userViewSetting: UserViewSettingsService,
  ) {
    this.route.paramMap.subscribe(
      (params: ParamMap) => {
        this.view.next(params.get('view'));
      });
  }

  ngOnInit() {
  }

}
