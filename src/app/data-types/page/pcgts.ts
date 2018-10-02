import {Page} from './page';
import {Meta} from './meta';

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
    return {
      meta: this.meta.toJson(),
      page: this.page.toJson(),
    };
  }
}
