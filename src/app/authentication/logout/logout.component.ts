import { Component, OnInit } from '@angular/core';
import {AuthenticationService} from '../authentication.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  constructor(
    public auth: AuthenticationService,
  ) { }

  ngOnInit() {
    setTimeout(() => this.auth.logout());   // wrap because it changes internal state
  }

}
