import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import {AuthenticationService} from '../authentication.service';


@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html',
    styleUrls: ['./logout.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LogoutComponent implements OnInit {
  auth = inject(AuthenticationService);


  ngOnInit() {
    setTimeout(() => this.auth.logout());   // wrap because it changes internal state
  }

}
