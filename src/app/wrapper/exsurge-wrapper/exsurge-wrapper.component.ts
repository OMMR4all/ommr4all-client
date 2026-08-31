import {Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit, OnDestroy, HostListener, EventEmitter, Output} from '@angular/core';

declare let exsurge: any;

@Component({
    selector: 'app-exsurge-wrapper',
    templateUrl: './exsurge-wrapper.component.html',
    styleUrls: ['./exsurge-wrapper.component.scss'],
    standalone: false
})
export class ExsurgeWrapperComponent implements OnChanges, AfterViewInit {
  @ViewChild('container', {static: true}) container!: ElementRef;

  @Input() source = '';
  @Input() isRenderInCanvas = false;
  @Input() singleLine = false;
  @Input() useDropCap = false;
  @Output() rendered = new EventEmitter<{width: number, height: number}>();
  private ctxt: any;
  private score: any;

  ngAfterViewInit() {
    this.setupExsurge();
    this.renderChant();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.ctxt && (changes['source'] || changes['singleLine'] || changes['useDropCap'])) {
      this.renderChant();
    }
  }

  private setupExsurge() {
    this.ctxt = new exsurge.ChantContext();

    this.ctxt.setFont('\'Crimson Text\', serif', 19.2);
    this.ctxt.dropCapTextFont = this.ctxt.lyricTextFont;
    this.ctxt.annotationTextFont = this.ctxt.lyricTextFont;
    this.ctxt.textMeasuringStrategy = exsurge.TextMeasuringStrategy.Canvas;
  }

  private renderChant() {
    if (!this.source || !this.ctxt) { return; }

    const containerEl = this.container.nativeElement;
    this.singleLine ? containerEl.classList.add('single-line-mode') : containerEl.classList.remove('single-line-mode');
    const mappings = exsurge.Gabc.createMappingsFromSource(this.ctxt, this.source);
    this.score = new exsurge.ChantScore(this.ctxt, mappings, this.useDropCap);

    this.layoutAndDraw();
  }

  private layoutAndDraw() {
    if (!this.score) { return; }

    const containerEl = this.container.nativeElement;

    const width = this.singleLine ? 999999 : (containerEl.clientWidth || 800);

    // Exsurge only trims the last system's staff lines to the final notation when this flag is
    // false. Left at its default (true) the staff would be drawn across the full layout width --
    // which for a single line is the 999999 above, giving an absurdly wide SVG and a scrollbar.
    if (this.singleLine) { this.score.extendLastSystemStaffLines = false; }

    this.score.performLayoutAsync(this.ctxt, () => {
      this.score.layoutChantLines(this.ctxt, width, () => {

        containerEl.innerHTML = '';

        if (this.isRenderInCanvas) {
          containerEl.appendChild(this.ctxt.canvas);
          this.score.draw(this.ctxt);
        } else {
          const svgNode = this.score.createSvgNode(this.ctxt);
          containerEl.appendChild(svgNode);
        }
        const bounds = this.score.bounds;
        this.rendered.emit({width: bounds ? bounds.width : 0, height: bounds ? bounds.height : 0});
      });
    });
  }

  @HostListener('window:resize')
  onResize() {
    if (this.score && !this.singleLine) {
      this.layoutAndDraw();
    }
  }
}
