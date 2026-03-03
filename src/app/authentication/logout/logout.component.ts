import { Component, OnInit, inject } from '@angular/core';
import {AuthenticationService} from '../authentication.service';


@Component({
    selector: 'app-logout',
    templateUrl: './logout.component.html',
    styleUrls: ['./logout.component.css'],
    standalone: false
})
export class LogoutComponent implements OnInit {
  auth = inject(AuthenticationService);


  ngOnInit() {
    setTimeout(() => this.auth.logout());   // wrap because it changes internal state
  }

}
