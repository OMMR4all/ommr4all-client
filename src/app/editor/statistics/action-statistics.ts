import {EditorTools} from '../../tool-bar/tool-bar-state.service';
import {ActionType} from '../actions/action-types';
import {enumMapToObj, mapToObj, objIntoEnumMap} from '../../utils/converting';
import {PageEditingProgress} from '../../data-types/page-editing-progress';

export class ActionStatistics {
  private readonly pauseThreshold_ms = 2001;
  private readonly timeUpdateTimer_ms = 100;
  private readonly _actionStats = new Map<ActionType, number>();
  private readonly _actionHistory: Array<{action: ActionType, time: number}> = [];
  private readonly _toolTiming = new Map<EditorTools, number>();
  private _startTime = 0;
  private _curTool: EditorTools = -1;
  private _lastLifeSign = 0;

  static fromJson(json, currentTool: EditorTools, pageProgress: PageEditingProgress) {
    const stats = new ActionStatistics(currentTool, pageProgress);
    objIntoEnumMap(json.actions, stats._actionStats, ActionType);
    objIntoEnumMap(json.toolTiming, stats._toolTiming, EditorTools);
    json.actionHistory.forEach(d => { stats._actionHistory.push({action: d.action, time: d.time}); });
    return stats;
  }

  toJson() {
    return {
      'actions': enumMapToObj(this._actionStats, ActionType),
      'toolTiming': enumMapToObj(this._toolTiming, EditorTools),
      'actionHistory': this._actionHistory,
    };
  }

  constructor(currentTool: EditorTools, private pageProgress: PageEditingProgress) {
    this._curTool = currentTool;
    this._startTime = performance.now();
    this._lastLifeSign = performance.now();
    setTimeout(() => this._updateEditorToolsTimeout(), this.timeUpdateTimer_ms);
  }

  get actionStats() { return this._actionStats; }
  get actionHistory() { return this._actionHistory; }
  get toolTiming() { return this._toolTiming; }
  get sleeping() { return this.pageProgress.locked.get(this._curTool) || performance.now() - this._lastLifeSign > this.pauseThreshold_ms; }

  get startTime(): number { if (this.sleeping) { return performance.now(); } return this._startTime; }


  tick() {
    if (this.sleeping) {
      this._startTime = performance.now();
    }
    this._lastLifeSign = performance.now();
  }


  private ensureActionField(type: ActionType, defaultValue = 0) {
    if (!this._actionStats.has(type)) {
      this._actionStats.set(type, defaultValue);
    }
  }

  actionCalled(actionType: ActionType) {
    this.ensureActionField(actionType);
    this._actionStats.set(actionType, this._actionStats.get(actionType) + 1);
    this._actionHistory.push({action: actionType, time: performance.now()});
    this.tick();
  }

  private ensureToolTimingField(type: EditorTools, defaultValue = 0) {
    if (!this._toolTiming.has(type)) {
      this._toolTiming.set(type, defaultValue);
    }
  }

  editorToolActivated(prev: EditorTools, next: EditorTools) {
    this.ensureToolTimingField(prev);
    const now = performance.now();
    if (this._startTime > 0 && !this.sleeping) {
      this._toolTiming.set(prev, this._toolTiming.get(prev) + now - this.startTime);
    }
    this._startTime = now;
    this._curTool = next;
    this._lastLifeSign = now;
  }

  private _updateEditorToolsTimeout() {
    if (this._curTool >= 0 && this._startTime > 0 && !this.sleeping) {
      const now = performance.now();
      this.ensureToolTimingField(this._curTool);
      this._toolTiming.set(this._curTool, this._toolTiming.get(this._curTool) + now - this.startTime);
      this._startTime = now;
    }
    setTimeout(() => this._updateEditorToolsTimeout(), this.timeUpdateTimer_ms);
  }

}
