import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import { PrimaryViews } from '../tool-bar/tool-bar-state.service';
import { EditorService } from './editor.service';
import { ToolBarStateService } from '../tool-bar/tool-bar-state.service';
import {Router, ActivatedRoute, ParamMap, NavigationStart, NavigationEnd} from '@angular/router';
import {switchMap} from 'rxjs/operators';
import {SheetOverlayComponent} from '../sheet-overlay/sheet-overlay.component';
import {ActionsService} from './actions/actions.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  @ViewChild(SheetOverlayComponent) sheetOverlayComponent: SheetOverlayComponent;
  PrimariyViews = PrimaryViews;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private actions: ActionsService,
    public editorService: EditorService,
    public toolbarStateService: ToolBarStateService) {}

  ngOnInit() {
    this.editorService.load(this.route.snapshot.params['book_id'], this.route.snapshot.params['page_id']);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd)
        this.editorService.select(this.route.snapshot.params['book_id'], this.route.snapshot.params['page_id']);
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.editorService.actionStatistics.tick();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.code === 'KeyZ' && event.ctrlKey) {
      this.sheetOverlayComponent.toIdle();
      if (event.shiftKey) {
        this.actions.redo();
      } else {
        this.actions.undo();
      }
      event.preventDefault();
    }
  }
}
