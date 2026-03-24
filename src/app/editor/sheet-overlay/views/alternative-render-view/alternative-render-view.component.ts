import {Component, ElementRef, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {PcGts} from '../../../../data-types/page/pcgts';
import {Block} from "../../../../data-types/page/block";
import {Page} from "../../../../data-types/page/page";
import {BlockType} from "../../../../data-types/page/definitions";

@Component({
    selector: 'app-alternative-render-view',
    templateUrl: './alternative-render-view.component.html',
    styleUrls: ['./alternative-render-view.component.scss'],
    standalone: false
})
export class AlternativeRenderViewComponent implements OnInit {
  @Input() pcgts: PcGts;
  @Output() finishedLoading = new EventEmitter<{finishedLoading: boolean, nodeList: NodeList | Element[]}>();
  private elRef = inject(ElementRef);
  public allSvgNotes: Element[] = [];
  constructor() { }
  get page(): Page { if (this.pcgts) { return this.pcgts.page; } else { return null; } }
  get musicBlocks(): Block[] { return (this.page) ? this.page.blocks.filter(b => b.type === BlockType.Music) : []; }

  ngOnInit(): void {
  }
  collectSvgNotes() {
    setTimeout(() => {
      this.allSvgNotes = Array.from(this.elRef.nativeElement.querySelectorAll('.note'));

      console.log(`Alternative Renderer found ${this.allSvgNotes.length} notes!`);

      if (this.allSvgNotes.length > 0) {
        this.finishedLoading.emit({
          finishedLoading: true,
          nodeList: this.allSvgNotes
        });
      }
    }, 200);
  }
}
