import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-imprint',
    templateUrl: './imprint.component.html',
    styleUrls: ['./imprint.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ImprintComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
