import {ActionsService} from './actions/actions.service';
import {EditorService} from './editor.service';
import {ServerStateService} from '../server-state/server-state.service';
import {ActionType} from './actions/action-types';

export class AutoSaver {
  private _actionsSinceLastSave = 0;
  private runnerId;
  private autoSavePrepareTimeout = null;
  get isAutoSaving() { return !!this.autoSavePrepareTimeout; }
  get canSave() { return !this.isAutoSaving && this._actionsSinceLastSave > 0; }
  get actionsSinceLastSave() { return this._actionsSinceLastSave; }

  constructor(
    private actions: ActionsService,
    private editor: EditorService,
    private serverState: ServerStateService,
    private forceSaveInterval = 5 * 60 * 1000,    // 5 mins
    private readonly actionsToAutoSave = 25,      // all 25 actions
  ) {
    serverState.disconnectedFromServer.subscribe(() => {
      this.destroy();
    });
    serverState.connectedToServer.subscribe(() => {
      this.continue();
    });
    editor.pageSaved.subscribe(() => {
      this.reset();
    });
    actions.actionCalled.subscribe((at) => {
      if (at !== ActionType.Undo && at !== ActionType.Redo) {
        this._actionsSinceLastSave += 1;
        this.checkAutoSave();
      }
    });
    this.runnerId = setInterval(() => this.autoSave(), forceSaveInterval);
  }

  public reset() {
    this.destroy();
    this.continue();
    this._actionsSinceLastSave = 0;
  }

  public continue() {
    this.destroy();
    this.runnerId = setInterval(() => this.autoSave(), this.forceSaveInterval);
    this.checkAutoSave();
  }

  public destroy() {
    clearInterval(this.runnerId);
    clearTimeout(this.autoSavePrepareTimeout);
    this.autoSavePrepareTimeout = null;
    this.runnerId = null;
  }

  private checkAutoSave() {
    if (this._actionsSinceLastSave >= this.actionsToAutoSave) {
      this.autoSave();
    }
  }

  private autoSave() {
    this._actionsSinceLastSave = 0;
    this.autoSavePrepareTimeout = setTimeout(
      () => { this.editor.save(); this.autoSavePrepareTimeout = null; }, 1000
    );
  }
}
