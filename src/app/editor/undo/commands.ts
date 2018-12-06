import {copyList} from '../../utils/copy';
import {ActionType} from '../actions/action-types';

export class ActionCaller {
  private _actions: Array<Action> = [];
  private _actionToCreate: Action = null;
  private _maxActionsInQueue = 1000;

  private _actionIndex = 0;

  get size() { return this._actions.length; }
  get isActionActive(): boolean { return this._actionToCreate === null; }

  public reset() {
    this._actionIndex = 0;
    this._actions = [];
  }

  public undo() {
    if (this._actionIndex <= 0) { this._actionIndex = 0; return; }
    this._actionIndex -= 1;
    this._actions[this._actionIndex].undo();
  }

  public redo() {
    if (this._actionIndex >= this._actions.length) { this._actionIndex = this._actions.length; return; }
    this._actions[this._actionIndex].do();
    this._actionIndex += 1;
  }

  private pushAction(action: Action) {
    this._actions.splice(this._actionIndex, this._actions.length - this._actionIndex);
    this._actions.push(action);
    if (this._actions.length > this._maxActionsInQueue) {
      this._actions.splice(0, this._actions.length - this._maxActionsInQueue);
    }
    this._actionIndex = this._actions.length;
    console.log('Action: ' + ActionType[action.type]);
  }


  public startAction(type: ActionType) {
    if (this._actionToCreate) {
      console.error('Action not finalized!');
      this.finishAction();
    }
    this._actionToCreate = new Action(new MultiCommand([]), type);
  }

  public runCommand(command: Command) {
    if (command.isIdentity()) { return; }
    if (!this._actionToCreate) { console.error('No action started yet!'); this.startAction(ActionType.Undefined); }
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
    return act;
  }

  public runAction(type: ActionType, command: Command) {
    if (command.isIdentity()) { return; }
    const action = new Action(command, type);
    this.pushAction(action);
    action.do();
  }
}

class Action {
  constructor(
    public readonly command: Command,
    public readonly type: ActionType,
    public updateCallback: () => void = null,
  ) {}

  do() { this.command.do(); if (this.updateCallback) { this.updateCallback(); } }
  undo() { this.command.undo(); if (this.updateCallback) { this.updateCallback(); } }
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


