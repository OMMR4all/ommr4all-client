import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {EditorTool} from "../editor-tool";
import {SheetOverlayService} from "../../sheet-overlay.service";
import {ActionsService} from "../../../actions/actions.service";
import {ViewChangesService} from "../../../actions/view-changes.service";
import {Options, ShortcutService} from "../../../shortcut-overlay/shortcut.service";
import {ViewSettings} from "../../views/view";
import {LayoutLineMergerService} from "./layout-line-merger.service";
import {Point, PolyLine} from '../../../../geometry/geometry';
import {PageLine} from "../../../../data-types/page/pageLine";
import {EditorTools} from "../../../tool-bar/tool-bar-state.service";
import {BlockType} from "../../../../data-types/page/definitions";
import {ActionType} from "../../../actions/action-types";
import machina from 'machina';
import {Sentence} from "../../../../data-types/page/sentence";

@Component({
  selector: '[app-layout-line-merger]',
  standalone: false,
  templateUrl: './layout-line-merger.component.html',
  styleUrl: './layout-line-merger.component.scss',
})
export class LayoutLineMergerComponent extends EditorTool implements OnInit {
  protected sheetOverlayService : SheetOverlayService;
  protected changeDetector: ChangeDetectorRef;
  private actions = inject(ActionsService);
  protected viewChanges: ViewChangesService;
  private hotkeys = inject(ShortcutService);
  private lineJoinerService = inject(LayoutLineMergerService); // Create this just like SplitterService

  private clickPos: Point;
  curPos: Point;

  startRegion: PageLine;
  endRegion: PageLine;

  readonly tooltips: Partial<Options>[] = [
    { keys: this.hotkeys.symbols().mouse1 + ' + drag', description: 'Join two lyric lines', group: EditorTools.Layout},
  ];

  constructor() {

    const sheetOverlayService = inject(SheetOverlayService);
    const changeDetector = inject(ChangeDetectorRef);
    const viewChanges = inject(ViewChangesService);

    super(sheetOverlayService, viewChanges, changeDetector,
      new ViewSettings(false, false, true, false, true),
    );

    this._states = new machina.Fsm({
      initialState: 'idle',
      states: {
        idle: {
          activate: 'active',
          _onEnter: () => this.tooltips.forEach(obj => this.hotkeys.deleteShortcut(obj))
        },
        active: {
          _onEnter: () => this.tooltips.forEach(obj => this.hotkeys.addShortcut(obj)),
          idle: 'idle',
          cancel: () => {},
          startDrag: 'drag',
        },
        drag: {
          _onExit: () => {
            this.startRegion = null;
            this.endRegion = null;
          },
          cancel: () => this.states.transition('active'),
          finish: () => {
            if (this.startRegion && this.endRegion && this.startRegion !== this.endRegion) {
              this._joinRegions(this.startRegion, this.endRegion);
            }
            this.states.transition('active');
          },
        }
      }
    });
    this.lineJoinerService.states = this._states;
  }

  ngOnInit() {
    this.states.on('transition', () => this.changeDetector.markForCheck());
  }

  onMouseDown(event: MouseEvent) {
    if (this.state === 'idle') return;

    const p = this.mouseToSvg(event);
    if (this.state === 'active') {
      this.startRegion = this.sheetOverlayService.closestLyricLineToMouse;

      if (this.startRegion) {
        this.clickPos = p;
        this.curPos = p;
        this.states.handle('startDrag');
      }
    }
    event.preventDefault();
  }

  onMouseUp(event: MouseEvent): void {
    if (this.state === 'idle') return;

    if (this.state === 'drag') {
      this.endRegion = this.sheetOverlayService.closestLyricLineToMouse;
      this.states.handle('finish');
    }
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent): void {
    if (this.state === 'idle') return;

    if (this.state === 'drag') {
      this.curPos = this.mouseToSvg(event);
      this.changeDetector.markForCheck();
    }
    event.preventDefault();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.states.handle('cancel');
      event.preventDefault();
    }
  }

  private _joinRegions(line1: PageLine, line2: PageLine) {
    if (!line1 || !line2 || line1 === line2) return;
    if (line1.blockType !== BlockType.Lyrics || line2.blockType !== BlockType.Lyrics) return;

    this.actions.startAction(ActionType.LayoutRegionJoin); // Use your specific action type

    const l1LeftX = Math.min(...line1.coords.points.map(p => p.x));
    const l2LeftX = Math.min(...line2.coords.points.map(p => p.x));

    const firstLine = l1LeftX <= l2LeftX ? line1 : line2;
    const secondLine = l1LeftX <= l2LeftX ? line2 : line1;

    const splitIntoEdges = (poly: PolyLine) => {
      const avgY = poly.averageY();
      const topEdge = poly.points.filter(p => p.y <= avgY).sort((a, b) => a.x - b.x);
      const bottomEdge = poly.points.filter(p => p.y > avgY).sort((a, b) => b.x - a.x);
      return { topEdge, bottomEdge };
    };

    const firstEdges = splitIntoEdges(firstLine.coords);
    const secondEdges = splitIntoEdges(secondLine.coords);


    const combinedPoints = [
      ...firstEdges.topEdge,
      ...secondEdges.topEdge,
      ...secondEdges.bottomEdge,
      ...firstEdges.bottomEdge
    ];

    const newPageLine = new PageLine();
    newPageLine.coords = new PolyLine(combinedPoints);


    const syllables1 = firstLine.sentence?.syllables || [];
    const syllables2 = secondLine.sentence?.syllables || [];

    newPageLine.sentence = new Sentence([...syllables1, ...syllables2]);

    this.actions.attachLine(firstLine.getBlock(), newPageLine);
    this.actions.detachLine(firstLine);
    this.actions.detachLine(secondLine);

    this.actions.finishAction();
  }
}
