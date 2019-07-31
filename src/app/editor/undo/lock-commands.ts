import {Command} from './commands';
import {PageEditingProgress, PageProgressGroups} from '../../data-types/page-editing-progress';

export class CommandSetLock extends Command {
  private readonly oldLock = this.progress.getLocked(this.group);

  constructor(
    private progress: PageEditingProgress,
    private group: PageProgressGroups,
    private lock: boolean
  ) {
    super();
  }

  do() { this.progress.setLocked(this.group, this.lock); }
  undo() { this.progress.setLocked(this.group, this.oldLock); }
  isIdentity() {
    if (this.lock === this.oldLock) { return true; }
  }
}
