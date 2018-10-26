import {Command} from './commands';
import {copyFromList, copyFromSet, copyList, copySet, identicalLists, identicalSets} from '../../utils/copy';

export class CommandChangeSet<T> extends Command {
  constructor(
    private set: Set<T>,
    private from: Set<T>,
    private to: Set<T>,
  ) { super(); this.from = copySet(this.from); this.to = copySet(this.to); }

  do() { copyFromSet(this.set, this.to); }
  undo() { copyFromSet(this.set, this.from); }
  isIdentity() { return identicalSets(this.from, this.to); }
}

export class CommandChangeArray<T> extends Command {
  constructor(
    private array: Array<T>,
    private from: Array<T>,
    private to: Array<T>,
  ) { super(); this.from = copyList(this.from); this.to = copyList(this.to); }

  do() { copyFromList(this.array, this.to); }
  undo() { copyFromList(this.array, this.from); }
  isIdentity() { return identicalLists(this.from, this.to); }
}

export class CommandCallFunction extends Command {
  constructor(
    private func: () => void,
  ) { super(); }

  do() { this.func(); }
  undo() {}
  isIdentity() { return false; }
}
