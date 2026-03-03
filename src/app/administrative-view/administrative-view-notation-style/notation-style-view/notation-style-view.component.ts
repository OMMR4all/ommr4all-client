import { Component, Input, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {AuthenticationService} from '../../../authentication/authentication.service';
import {ServerStateService} from '../../../server-state/server-state.service';
import {BookCommunication} from '../../../data-types/communication';
import {BookMeta} from '../../../book-list.service';
import {BookStyle, GlobalSettingsService} from '../../../global-settings.service';
import {ServerUrls} from '../../../server-urls';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../../utils/api-error';

@Component({
    selector: 'app-notation-style-view',
    templateUrl: './notation-style-view.component.html',
    styleUrls: ['./notation-style-view.component.scss'],
    standalone: false
})
export class NotationStyleViewComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthenticationService);
  private settings = inject(GlobalSettingsService);

  apiError: ApiError;
  notationStyle: BookStyle;

  constructor() {
    this.route.paramMap.subscribe(
      (params: ParamMap) => {
        this.notationStyle = this.settings.bookStyleById(params.get('sub1'));
      });
  }

  ngOnInit() {
  }

  save() {
    this.http.post(ServerUrls.bookStyles() + '/' + this.notationStyle.id, this.notationStyle).subscribe(
      r => {},
      err => {
        this.apiError = apiErrorFromHttpErrorResponse(err);
      }
    )
  }
}
