import { Component } from '@angular/core';
import { EditorService } from './editor/editor.service';
import { ToolBarStateService, PrimaryViews } from './editor/tool-bar/tool-bar-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  PrimariyViews = PrimaryViews;

  constructor(
    public staffsService: EditorService,
    public toolbarStateService: ToolBarStateService) {}
}
