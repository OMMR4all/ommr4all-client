import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UserComment, UserCommentHolder, UserComments} from '../../../data-types/page/userComment';
import {ActionsService} from '../../actions/actions.service';
import {ActionType} from '../../actions/action-types';
import {MatInput} from '@angular/material';

@Component({
  selector: 'app-comment-property-widget',
  templateUrl: './comment-property-widget.component.html',
  styleUrls: ['./comment-property-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentPropertyWidgetComponent implements OnInit, OnDestroy {
  @Input() comments: UserComments = null;

  private _commentHolder: UserCommentHolder = null;
  @Input() get commentHolder() { return this._commentHolder; }
  set commentHolder(c: UserCommentHolder) {
    if (c === this._commentHolder) { return; }
    this.comment = null;
    this._commentHolder = c;
    if (this._commentHolder) {
      this.comment = this.comments.getByHolder(this._commentHolder);
    }
    this.changeDetector.markForCheck();
  }

  private _comment: UserComment = null;
  get comment() { return this._comment; }
  set comment(c: UserComment) {
    if (c === this._comment) { return; }
    if (this._comment && this._comment.holder) {
      this.text = this.commentArea.value;
    }
    this._comment = c;
    if (this._comment && this.commentArea) {
      this.commentArea.value = this.text;
    }
    this.changeDetector.markForCheck();
  }

  @ViewChild('commentArea', {static: false}) commentArea: MatInput;

  constructor(
    private actions: ActionsService,
    private changeDetector: ChangeDetectorRef,
  ) { }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.comment = null;
  }

  set text(t: string) {
    if (this.actions.caller.isActionActive) {
      this.actions.changeCommentText(this.comment, t);
    } else {
      this.actions.startAction(ActionType.CommentsText);
      this.actions.changeCommentText(this.comment, t);
      this.actions.finishAction();
    }
  }

  get text() { return this.comment ? this.comment.text : ''; }

  onKeydown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.code === 'Escape') {
      (event.target as HTMLElement).blur();
    }
  }

  onDelete() {
    this.actions.startAction(ActionType.CommentsDeleted);
    this.actions.removeComment(this.comment);
    this.comment = null;
    this.actions.finishAction();
  }

  onAdd(event: MouseEvent) {
    event.preventDefault();
    this.actions.startAction(ActionType.CommentsAdded);
    this.comment = this.actions.addComment(this.comments, this.commentHolder);
    this.actions.finishAction();
    setTimeout(() => {
      this.commentArea.focus();
      this.changeDetector.detectChanges();
    }, 0);
  }
}
