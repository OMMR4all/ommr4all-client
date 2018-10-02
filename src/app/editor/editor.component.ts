import { Component, OnInit } from '@angular/core';
import { PrimaryViews } from '../tool-bar/tool-bar-state.service';
import { EditorService } from './editor.service';
import { ToolBarStateService } from '../tool-bar/tool-bar-state.service';
import {Router, ActivatedRoute, ParamMap, NavigationStart, NavigationEnd} from '@angular/router';
import {switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  PrimariyViews = PrimaryViews;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public editorService: EditorService,
    public toolbarStateService: ToolBarStateService) {}

  ngOnInit() {
    this.editorService.load(this.route.snapshot.params['book_id'], this.route.snapshot.params['page_id']);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd)
        this.editorService.select(this.route.snapshot.params['book_id'], this.route.snapshot.params['page_id']);
    });
  }

}
