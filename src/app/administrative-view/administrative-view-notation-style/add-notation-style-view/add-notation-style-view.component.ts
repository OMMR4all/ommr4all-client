import { Component, OnInit } from '@angular/core';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../../utils/api-error';
import {FormControl, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {ServerUrls} from '../../../server-urls';
import {BookStyle, GlobalSettingsService} from '../../../global-settings.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-add-notation-style-view',
  templateUrl: './add-notation-style-view.component.html',
  styleUrls: ['./add-notation-style-view.component.scss']
})
export class AddNotationStyleViewComponent implements OnInit {
  apiError: ApiError;
  nameFormControl = new FormControl('', [
    Validators.required,
  ]);

  constructor(
    private http: HttpClient,
    private router: Router,
    private settings: GlobalSettingsService,
  ) { }

  ngOnInit() {
  }

  create() {
    if (this.nameFormControl.errors) { return; }
    const style: BookStyle = {
      id: '',
      name: this.nameFormControl.value,
    };
    this.http.put<BookStyle>(ServerUrls.bookStyles(), style).subscribe(
      r => {
        this.settings.bookStyles.push(r);
        this.settings.reloadBookStyles();
        this.router.navigate(['administration', 'view', 'edit_style', r.id]);
      },
      err => {
        this.apiError = apiErrorFromHttpErrorResponse(err);
      }
    );
  }

}
