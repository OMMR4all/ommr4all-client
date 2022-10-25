import {Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from '../authentication.service';
import {ActivatedRoute, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {ApiError, apiErrorFromHttpErrorResponse, ErrorCodes} from '../../utils/api-error';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
   form: FormGroup;
   apiError: ApiError;
   redirect = '/';

  constructor(private fb: FormBuilder,
              private authService: AuthenticationService,
              private router: Router,
              private route: ActivatedRoute) {

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
            if (err.status === 400) {
              this.apiError = {
                status: err.status,
                developerMessage: 'Invalid credentials.',
                userMessage: 'Invalid credentials. Please try again.',
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
