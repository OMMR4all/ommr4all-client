import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';

declare var exsurge: any;

@Component({
    selector: 'app-exsurge-wrapper',
    templateUrl: './exsurge-wrapper.component.html',
    styleUrls: ['./exsurge-wrapper.component.scss'],
    standalone: false
})
export class ExsurgeWrapperComponent implements OnChanges, AfterViewInit {
  @ViewChild('container', {static: true}) container!: ElementRef;

  @Input() source: string = '';
  @Input() isRenderInCanvas: boolean = false;
  @Input() singleLine: boolean = false;
  @Input() useDropCap: boolean = false;

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

    // Wichtige Layout-Konfiguration
    this.ctxt.setFont('\'Crimson Text\', serif', 19.2);
    this.ctxt.dropCapTextFont = this.ctxt.lyricTextFont;
    this.ctxt.annotationTextFont = this.ctxt.lyricTextFont;
    this.ctxt.textMeasuringStrategy = exsurge.TextMeasuringStrategy.Canvas;
  }

  private renderChant() {
    if (!this.source || !this.ctxt) { return; }

    // Container CSS anpassen
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
      });
    });
  }

  @HostListener('window:resize')
  onResize() {
    // Bei Resize nur neu berechnen, wenn wir im Multi-Line Modus sind
    if (this.score && !this.singleLine) {
      this.layoutAndDraw();
    }
  }
}
