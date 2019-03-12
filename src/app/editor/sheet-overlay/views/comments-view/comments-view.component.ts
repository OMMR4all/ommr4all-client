import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {UserComments} from '../../../../data-types/page/userComment';
import {EditorTool} from '../../editor-tools/editor-tool';
import {NonScalingComponentType} from '../../elements/non-scaling-component/non-scaling.component';

@Component({
  selector: '[app-comments-view]',  // tslint:disable-line component-selector
  templateUrl: './comments-view.component.html',
  styleUrls: ['./comments-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsViewComponent implements OnInit {
  @Input() comments: UserComments = null;
  @Input() editorTool: EditorTool;

  NonScalingType = NonScalingComponentType;

  constructor(
    private changeDetector: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
  }

  redraw() {
    this.changeDetector.detectChanges();
  }
}
