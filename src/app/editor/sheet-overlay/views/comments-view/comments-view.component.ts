import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import {UserComments} from '../../../../data-types/page/userComment';
import {EditorTool} from '../../editor-tools/editor-tool';
import {NonScalingComponentType} from '../../elements/non-scaling-component/non-scaling.component';

@Component({
    selector: '[app-comments-view]',    templateUrl: './comments-view.component.html',
    styleUrls: ['./comments-view.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class CommentsViewComponent implements OnInit {
  private changeDetector = inject(ChangeDetectorRef);

  @Input() comments: UserComments = null;
  @Input() editorTool: EditorTool;

  NonScalingType = NonScalingComponentType;

  ngOnInit() {
  }

  redraw() {
    this.changeDetector.detectChanges();
  }
}
