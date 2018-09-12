import { Component } from '@angular/core';
import { StaffsService } from './staffs.service';
import { ToolBarStateService, PrimaryViews } from './tool-bar/tool-bar-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  PrimariyViews = PrimaryViews;

  constructor(
    public staffsService: StaffsService,
    public toolbarStateService: ToolBarStateService) {}
}
