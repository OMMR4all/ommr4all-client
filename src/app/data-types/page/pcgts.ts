import {Page} from './page';
import {Meta} from './meta';
import {IdGenerator} from './id-generator';

export class PcGts {
  constructor(
    public meta = new Meta(),
    public page = new Page(),
  ) {}

  static fromJson(json) {
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
    };
  }

  refreshIds() {
    IdGenerator.reset();
    this.page.refreshIds();
  }
}
