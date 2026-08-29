import { Component, inject } from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from '../authentication.service';
import {ActivatedRoute, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {ApiError, apiErrorFromHttpErrorResponse, ErrorCodes} from '../../utils/api-error';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    standalone: false
})
export class LoginComponent {
   private fb = inject(UntypedFormBuilder);
   private authService = inject(AuthenticationService);
   private router = inject(Router);
   private route = inject(ActivatedRoute);

   form: UntypedFormGroup;
   apiError: ApiError;
   redirect = '/';

  constructor() {

    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.route.queryParams.pipe(filter(params => params.redirect)).subscribe(
      redirect => {
        if (redirect && redirect.redirect !== '/login' && redirect.redirect !== '/logout') {
          this.redirect = redirect.redirect;
        }
        if (this.authService.isLoggedIn()) {
          this.router.navigateByUrl(this.redirect).then();
        }
      }
    );
  }


  login() {
    const val = this.form.value;

    if (val.username && val.password) {
      this.authService.login(val.username, val.password)
        .subscribe(
          () => {
            this.router.navigateByUrl(this.redirect).then();
          },
          (err: HttpErrorResponse) => {
            // simplejwt answers a wrong password with 401, not 400: mapping that through
            // the generic handler told the user their session had expired while they were
            // sitting on the login page
            if (err.status === 400 || err.status === 401) {
              this.apiError = {
                status: err.status,
                developerMessage: 'Invalid credentials.',
                userMessage: $localize`:@@invalidCredentials:Invalid credentials. Please try again.`,
                errorCode: ErrorCodes.InvalidCredentials,
              };
            } else {
              this.apiError = apiErrorFromHttpErrorResponse(err);
            }
          }
        );
    }
  }

}
