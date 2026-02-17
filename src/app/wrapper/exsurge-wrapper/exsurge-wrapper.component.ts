import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

declare var exsurge: any;

@Component({
  selector: 'app-exsurge-wrapper',
  templateUrl: './exsurge-wrapper.component.html',
  styleUrls: ['./exsurge-wrapper.component.scss']
})
export class ExsurgeWrapperComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef;

  @Input() gabc: string = '';
  @Input() singleLine: boolean = false; // Neu: Flag für Einzeiler

  private resizeObserver: ResizeObserver | null = null;
  private renderTimeout: any;

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver(() => this.debounceRender());
    this.resizeObserver.observe(this.container.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gabc'] && !changes['gabc'].firstChange) {
      this.renderMusic();
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver) { this.resizeObserver.disconnect(); }
    clearTimeout(this.renderTimeout);
  }

  private debounceRender() {
    clearTimeout(this.renderTimeout);
    this.renderTimeout = setTimeout(() => this.renderMusic(), 100);
  }

  private renderMusic() {
    if (!this.gabc || !this.container) { return; }

    const containerEl = this.container.nativeElement;

    // Logik für die Breite:
    // Wenn singleLine aktiv ist, geben wir eine extrem große Breite an,
    // damit exsurge niemals einen Zeilenumbruch erzwingt.
    const renderWidth = this.singleLine ? 999999 : (containerEl.offsetWidth || 800);

    try {
      const ctxt = new exsurge.ChantContext();
      const mappings = exsurge.Gabc.createMappingsFromSource(ctxt, this.gabc);
      const score = new exsurge.ChantScore(ctxt, mappings, true);

      score.performLayout(ctxt, () => {
        score.layoutChantLines(ctxt, renderWidth, () => {
          const innerHtml = score.createDrawable(ctxt);
          containerEl.innerHTML = innerHtml;

          // Bei Single-Line: SVG-Breite auf Inhalt anpassen
          if (this.singleLine) {
            const svg = containerEl.querySelector('svg');
            if (svg) { svg.style.maxWidth = 'none'; }
          }
        });
      });
    } catch (error) {
      console.error('Exsurge Error:', error);
    }
  }
}
