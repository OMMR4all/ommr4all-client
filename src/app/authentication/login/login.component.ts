import { Component } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from '../authentication.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
   form: FormGroup;
   error = '';

  constructor(private fb: FormBuilder,
              private authService: AuthenticationService,
              private router: Router) {

    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    const val = this.form.value;

    if (val.username && val.password) {
      this.authService.login(val.username, val.password)
        .subscribe(
          () => {
            this.router.navigateByUrl('/');
          },
          () => {
            this.error = 'Invalid credentials. Please try again.';
          }
        );
    }
  }

}
