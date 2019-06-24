import {Page} from './page';
import {Meta} from './meta';
import {IdGenerator} from './id-generator';

export class PcGts {
  static readonly VERSION = 1;
  constructor(
    public meta = new Meta(),
    public page = new Page(),
  ) {}

  static fromJson(json) {
    if (json.version !== PcGts.VERSION) {
      console.error('Invalid version. Expected ' + PcGts.VERSION + ' but received ' + json.version);
    }
    return new PcGts(
      Meta.fromJson(json.meta),
      Page.fromJson(json.page),
    );
  }

  toJson() {
    this.refreshIds();
    return {
      meta: this.meta.toJson(),
      page: this.page.toJson(),
      version: PcGts.VERSION,
    };
  }

  clean() {
    this.page.clean();
  }

  refreshIds() {
    IdGenerator.reset();
    this.page.refreshIds();
  }
}
