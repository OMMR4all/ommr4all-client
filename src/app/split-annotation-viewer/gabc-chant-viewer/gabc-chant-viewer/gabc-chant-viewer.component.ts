import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {ExsurgeRendererModule} from 'exsurge-angular';
import {Subscription} from "rxjs";
import {PageLine} from "../../../data-types/page/pageLine";
import {Block} from "../../../data-types/page/block";
@Component({
  selector: 'app-gabc-chant-viewer',
  templateUrl: './gabc-chant-viewer.component.html',
  styleUrls: ['./gabc-chant-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class GabcChantViewerComponent implements OnInit {
  private _subscription = new Subscription();
  private _line: PageLine = null;
  private _block: Block = null;
  private gabcText = '';
  private lines = null;
  @Input() set block(l: Block) {
    if (l === this._block) { return; }
    this._block = l;
    this.gabcText = this.block.generateGabcString();
    this.lines = this._block.musicLines;
  }
  get block() { return this._block; }
  @Input() zoom = 1;
  @Input() pan = {x: 0, y: 0};
  @Input() viewWidth = 0;
  get sentence() { return this._line.sentence; }
  get aabb() { return this._block.AABB; }
  get blockType() { return this._line.getBlock().type; }
  get top() { return Math.max(0, this.aabb.top * this.zoom + this.pan.y); }
  get left() { return Math.max(0, this.aabb.right * this.zoom + this.pan.x); }
  get right() { return Math.min(this.viewWidth, this.aabb.right * this.zoom + this.pan.x); }

  get bottom() {return (this.aabb.bottom) * this.zoom + this.pan.y; }
  get height() {return this.bottom - this.top; }
  get width() { return this.right - this.left; }
  constructor(    public changeDetector: ChangeDetectorRef,
  ) {     this.changeDetector.detach();
  }

  ngOnInit() {
    this.changeDetector.detectChanges();
  }

  ngAfterContentChecked(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('pan' in changes) {

      if (changes.pan.currentValue.x == changes.pan.previousValue.x && changes.pan.currentValue.y == changes.pan.previousValue.y) {        this.redraw();


      }
      else {
        this.redraw();
      }

    }


  }
  redraw() {
    this.gabcText = this.block.generateGabcString();

    this.changeDetector.detectChanges(); }
  get getGabcText() {

    return this.gabcText;
  }


}
