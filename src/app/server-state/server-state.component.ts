import { Component, OnInit, inject } from '@angular/core';
import {ServerStateService} from './server-state.service';

@Component({
    selector: 'app-server-state',
    templateUrl: './server-state.component.html',
    styleUrls: ['./server-state.component.css'],
    standalone: false
})
export class ServerStateComponent implements OnInit {
  serverState = inject(ServerStateService);


  ngOnInit() {
  }

  retry() {
    this.serverState.retry();
  }

}
