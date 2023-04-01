import {Component, Input, OnInit} from '@angular/core';
import {PcGts} from '../../../../data-types/page/pcgts';
import {Block} from "../../../../data-types/page/block";
import {Page} from "../../../../data-types/page/page";
import {BlockType} from "../../../../data-types/page/definitions";

@Component({
  selector: 'app-alternative-render-view',
  templateUrl: './alternative-render-view.component.html',
  styleUrls: ['./alternative-render-view.component.scss']
})
export class AlternativeRenderViewComponent implements OnInit {
  @Input() pcgts: PcGts;

  constructor() { }
  get page(): Page { if (this.pcgts) { return this.pcgts.page; } else { return null; } }
  get musicBlocks(): Array<Block> { return (this.page) ? this.page.blocks.filter(b => b.type === BlockType.Music) : []; }

  ngOnInit(): void {
  }

}
