import {Component, Input, OnInit} from '@angular/core';
import {EditorService} from '../../editor.service';
import {ActionType} from '../../actions/action-types';
import {EditorTools} from '../../tool-bar/tool-bar-state.service';
import {BlockType, SymbolType} from '../../../data-types/page/definitions';

@Component({
  selector: 'app-debug-action-statistics',
  templateUrl: './debug-action-statistics.component.html',
  styleUrls: ['./debug-action-statistics.component.scss']
})
export class DebugActionStatisticsComponent implements OnInit {
  @Input() showAnnotationCounts = false;
  @Input() showActions = false;
  @Input() showTiming = false;

  BlockType = BlockType;
  SymbolType = SymbolType;

  constructor(public editor: EditorService) { }

  ngOnInit() {
  }

  get page() { return this.editor.pageStateVal.pcgts.page; }

  get nMusicLines() { let i = 0; this.page.musicRegions.forEach(mr => i += mr.musicLines.length); return i; }
  get nStaffLines() { let i = 0; this.page.musicRegions.forEach(mr => mr.musicLines.forEach(ml => i += ml.staffLines.length)); return i; }
  nBlock(type: BlockType) { return this.page.blocks.filter(tr => tr.type === type).length; }
  nSymbolType(type: SymbolType) { let i = 0; this.page.musicRegions.forEach(mr => mr.musicLines.forEach(ml => i += ml.filterSymbols(type).length)); return i; }
  nSymbols() { let i = 0; this.page.musicRegions.forEach(mr => mr.musicLines.forEach(ml => i += ml.symbols.length)); return i; }


  get counts(): Array<{l: string, c: number}> {
    const out = [];
    this.editor.actionStatistics.actionStats.forEach((v, k) => { out.push({l: ActionType[k], c: v}); });

    return out;
  }

  countTrack(index, item) { return index; }

  get toolTiming(): Array<{l: string, t: number}> {
    const out = [];
    this.editor.actionStatistics.toolTiming.forEach((v, k) => { out.push({l: EditorTools[k], t: this.toHMS(v)}); });
    return out;
  }

  toolTimingTrack(index, item) { return index; }

  private toHMS(time: number) {
    const h = Math.floor(time / 1000 / 3600);
    time -= h * 1000 * 3600;
    const m = Math.floor(time / 1000 / 60);
    time -= m * 1000 * 60;
    const s = Math.floor(time / 1000);
    time -= s * 1000;
    const ms = Math.floor(time / 100);
    let o = '' + h + ':';
    if (m === 0) { o += '00'; } else if (m <= 9) { o += '0' + m; } else { o += m; }
    o += ':';
    if (s === 0) { o += '00'; } else if (s <= 9) { o += '0' + s; } else { o += s; }
    return o + '.' + ms;
  }

  get totalTiming() {
    let s = 0;
    this.editor.actionStatistics.toolTiming.forEach(v => s += v);
    return this.toHMS(s);
  }

  onResetActions() { this.editor.actionStatistics.actionStats.clear(); }
  onResetTiming() { this.editor.actionStatistics.toolTiming.clear(); }
}
