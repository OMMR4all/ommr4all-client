import {Component, Input, OnInit} from '@angular/core';
import {PageState} from '../../../editor.service';
import {Observable} from 'rxjs';

@Component({
  selector: '[app-background-image-view]',  // tslint:disable-line component-selector
  templateUrl: './background-image-view.component.html',
  styleUrls: ['./background-image-view.component.css']
})
export class BackgroundImageViewComponent implements OnInit {
  @Input()
  pageState: Observable<PageState>;

  constructor() { }

  ngOnInit() {
  }

}
