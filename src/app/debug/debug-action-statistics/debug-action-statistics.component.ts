import {Component, OnInit} from '@angular/core';
import {EditorService} from '../../editor/editor.service';
import {ActionType} from '../../editor/actions/action-types';
import {EditorTools} from '../../tool-bar/tool-bar-state.service';
import {TextRegionType} from '../../data-types/page/text-region';
import {SymbolType} from '../../data-types/page/definitions';

@Component({
  selector: 'app-debug-action-statistics',
  templateUrl: './debug-action-statistics.component.html',
  styleUrls: ['./debug-action-statistics.component.css']
})
export class DebugActionStatisticsComponent implements OnInit {
  TextRegionType = TextRegionType;
  SymbolType = SymbolType;

  constructor(public editor: EditorService) { }

  ngOnInit() {
  }

  get page() { return this.editor.pcgts.page; }

  get nMusicRegions() { return this.page.musicRegions.length; }
  get nMusicLines() { let i = 0; this.page.musicRegions.forEach(mr => i += mr.musicLines.length); return i; }
  get nStaffLines() { let i = 0; this.page.musicRegions.forEach(mr => mr.musicLines.forEach(ml => i += ml.staffLines.length)); return i; }
  nTextRegion(type: TextRegionType) { return this.page.textRegions.filter(tr => tr.type === type).length; }
  nSymbolType(type: SymbolType) { let i = 0; this.page.musicRegions.forEach(mr => mr.musicLines.forEach(ml => i += ml.filterSymbols(type).length)); return i; }
  nSymbols() { let i = 0; this.page.musicRegions.forEach(mr => mr.musicLines.forEach(ml => i += ml.symbols.length)); return i; }


  get counts(): Array<{l: string, c: number}> {
    const out = [];
    this.editor.actionStatistics.actionStats.forEach((v, k) => { out.push({l: ActionType[k], c: v}); });

    return out;
  }

  get toolTiming(): Array<{l: string, t: number}> {
    const out = [];
    this.editor.actionStatistics.toolTiming.forEach((v, k) => { out.push({l: EditorTools[k], t: this.toHMS(v)}); });
    return out;
  }

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
}
