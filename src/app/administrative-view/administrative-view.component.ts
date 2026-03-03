import { Component, OnInit, inject } from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {GlobalSettingsService} from '../global-settings.service';
import {AuthenticationService, GlobalPermissions} from '../authentication/authentication.service';
import {UserViewSettingsService} from '../user-view-settings.service';

@Component({
    selector: 'app-administrative-view',
    templateUrl: './administrative-view.component.html',
    styleUrls: ['./administrative-view.component.scss'],
    standalone: false
})
export class AdministrativeViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  settings = inject(GlobalSettingsService);
  private authentication = inject(AuthenticationService);
  private userViewSetting = inject(UserViewSettingsService);

  readonly view = new BehaviorSubject<string>('');

  get mayViewTasks() { return this.authentication.hasPermission(GlobalPermissions.TasksList); }

  constructor() {
    this.route.paramMap.subscribe(
      (params: ParamMap) => {
        this.view.next(params.get('view'));
      });
  }

  ngOnInit() {
  }

}
