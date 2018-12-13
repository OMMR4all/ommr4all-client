import { Component, OnInit } from '@angular/core';
import {ServerStateService} from './server-state.service';

@Component({
  selector: 'app-server-state',
  templateUrl: './server-state.component.html',
  styleUrls: ['./server-state.component.css']
})
export class ServerStateComponent implements OnInit {

  constructor(
    public serverState: ServerStateService
  ) { }

  ngOnInit() {
  }

  retry() {
    this.serverState.retry();
  }

}
