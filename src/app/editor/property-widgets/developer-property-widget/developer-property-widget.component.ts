import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-developer-property-widget',
  templateUrl: './developer-property-widget.component.html',
  styleUrls: ['./developer-property-widget.component.css']
})
export class DeveloperPropertyWidgetComponent implements OnInit {
  showToolState = false;
  showActions = false;
  showAnnotationCounts = false;
  showTiming = false;

  constructor() { }

  ngOnInit() {
  }

}
