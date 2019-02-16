import {copyList} from '../../utils/copy';
import {ActionType} from '../actions/action-types';
import {ViewChangesService} from '../actions/view-changes.service';
import {RequestChangedViewElements, RequestChangedViewElement, ChangedView} from '../actions/changed-view-elements';
import {viewEngine_ChangeDetectorRef_interface} from '@angular/core/src/render3/view_ref';

export class ActionCaller {
  private _actions: Array<Action> = [];
  private _actionToCreate: Action = null;
  private _maxActionsInQueue = 1000;
  private _totalActions = 0;

  private _actionIndex = 0;

  constructor(
    private viewChanges: ViewChangesService,
  ) {}

  get size() { return this._actions.length; }
  get totalActions() { return this._totalActions; }
  get isActionActive(): boolean { return this._actionToCreate === null; }
  get hasUndo(): boolean { return this._actionIndex > 0; }
  get hasDo(): boolean { return this._actionIndex < this._actions.length; }

  public reset() {
    this._actionIndex = 0;
    this._totalActions = 0;
    this._actions = [];
  }

  public undo() {
    if (this._actionIndex <= 0) { this._actionIndex = 0; return; }
    this._actionIndex -= 1;
    this._actions[this._actionIndex].undo(this.viewChanges);
  }

  public redo() {
    if (this._actionIndex >= this._actions.length) { this._actionIndex = this._actions.length; return; }
    this._actions[this._actionIndex].do(this.viewChanges);
    this._actionIndex += 1;
  }

  private pushAction(action: Action) {
    this._actions.splice(this._actionIndex, this._actions.length - this._actionIndex);
    this._actions.push(action);
    if (this._actions.length > this._maxActionsInQueue) {
      this._actions.splice(0, this._actions.length - this._maxActionsInQueue);
    }
    this._actionIndex = this._actions.length;
    this._totalActions += 1;
    console.log('Action: ' + ActionType[action.type]);
  }


  public startAction(type: ActionType, changedViewElements: RequestChangedViewElements) {
    if (this._actionToCreate) {
      console.error('Action not finalized!', this._actionToCreate);
      this.finishAction();
    }
    this._actionToCreate = new Action(new MultiCommand([]), type);
    changedViewElements.forEach(e => this._actionToCreate.addChangedViewElement(e));
  }

  public runCommand(command: Command) {
    if (command.isIdentity()) { return; }
    if (!this._actionToCreate) { console.error('No action started yet!'); this.startAction(ActionType.Undefined, []); }
    const lastCommand = this._actionToCreate.command as MultiCommand;
    lastCommand.push(command);
    command.do();
  }

  public finishAction(updateCallback: () => void = null): Action {
    if (!this._actionToCreate) { console.warn('No action started.'); return null; }
    if ((this._actionToCreate.command as MultiCommand).empty) { this._actionToCreate = null; return null; }
    this._actionToCreate.updateCallback = updateCallback;
    this.pushAction(this._actionToCreate);
    // if (run) { this._actionToCreate.do(); }  // finish the action!
    const act = this._actionToCreate;
    this._actionToCreate = null;
    act.do(this.viewChanges);
    return act;
  }

  public runAction(type: ActionType, command: Command) {
    if (command.isIdentity()) { return; }
    const action = new Action(command, type);
    this.pushAction(action);
    action.do(this.viewChanges);
  }

  public pushChangedViewElement(...element: RequestChangedViewElement[]) {
    if (!this._actionToCreate) { return; }
    this._actionToCreate.addChangedViewElement(...element);
  }
}

class Action {
  constructor(
    public readonly command: Command,
    public readonly type: ActionType,
    public updateCallback: () => void = null,
    private readonly _changedView: ChangedView = new ChangedView(),
  ) {}

  get changedView() { return this._changedView; }

  addChangedViewElement(...e: RequestChangedViewElement[]) {
    e.forEach(v => this.changedView.add(v));
  }

  do(viewChanges: ViewChangesService) {
    this.command.do();
    if (this.updateCallback) { this.updateCallback(); }
    viewChanges.handle(this.changedView);
  }

  undo(viewChanges: ViewChangesService) {
    this.command.undo();
    if (this.updateCallback) { this.updateCallback(); }
    viewChanges.handle(this.changedView);
  }
}

export abstract class Command {
  abstract do(): void;
  abstract undo(): void;
  abstract isIdentity(): boolean;
}

export class MultiCommand {
  constructor(
    private _commands: Array<Command>
  ) {}

  get empty() { return this._commands.length === 0; }

  push(command: Command) { this._commands.push(command); }

  do() { this._commands.forEach(c => c.do()); }
  undo() { copyList(this._commands).reverse().forEach(c => c.undo()); }
  isIdentity() { for (const cmd of this._commands) { if (!cmd.isIdentity()) { return false; }} return true; }
}


