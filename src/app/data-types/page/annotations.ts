import {Syllable} from './syllable';
import {Note} from './music-region/symbol';
import {Page} from './page';
import {Block} from './block';
import {PageLine} from './pageLine';

export class Annotations {
  public connections: Array<Connection> = [];
  constructor(
    private _page: Page,
  ) {
  }

  static fromJson(json, page: Page) {
    const a = new Annotations(
      page,
    );
    if (!json) { return a; }
    a.connections = json.connections.map(c => Connection.fromJson(c, page));
    return a;
  }

  toJson() {
    return {
      connections: this.connections.map(c => c.toJson()),
    };
  }

  get page() { return this._page; }

  findNeumeConnector(note: Note): {nc: NeumeConnector, sc: SyllableConnector} {
    if (!note) { return null; }
    const c = this.connections.find(con => con.musicRegion === note.staff.getBlock());
    if (!c) { return null; }
    for (const s of c.syllableConnectors) {
      const nc = s.neumeConnectors.find(ncc => ncc.neume === note);
      if (nc) { return {nc: nc, sc: s}; }
    }
    return null;
  }

}

export class Connection {
  constructor(
      public musicRegion: Block,
      public textRegion: Block,
      public syllableConnectors: Array<SyllableConnector> = [],
  ) {}

  static fromJson(json, page: Page) {
    const mr = page.musicRegionById(json.musicID);
    const tr = page.textRegionById(json.textID);
    return new Connection(
      mr, tr,
      json.syllableConnectors.map(sc => SyllableConnector.fromJson(sc, page, tr, mr)),
    );
  }

  toJson() {
    return {
      musicID: this.musicRegion.id,
      textID: this.textRegion.id,
      syllableConnectors: this.syllableConnectors.map(sc => sc.toJson()),
    };
  }

}

export class SyllableConnector {
  constructor(
    public syllable: Syllable,
    public neumeConnectors: Array<NeumeConnector> = [],
  ) {}

  static fromJson(json, page: Page, textRegion: Block, musicRegion: Block) {
    const si = textRegion.syllableInfoById(json.refID);
    return new SyllableConnector(
      si.s,
      json.neumeConnectors.map(nc => NeumeConnector.fromJson(nc, musicRegion, si.l)),
    );
  }

  toJson() {
    return {
      refID: this.syllable.id,
      neumeConnectors: this.neumeConnectors.map(nc => nc.toJson())
    };
  }

}

export class NeumeConnector {
  constructor(
    public neume: Note,
    public textLine: PageLine,
  ) {}

  static fromJson(json, musicRegion: Block, textLine: PageLine) {
    return new NeumeConnector(
      musicRegion.noteById(json.refID.replace('neume', 'note')),
      textLine,
    );
  }

  toJson() {
    return {
      refID: this.neume.id.replace('note', 'neume'),
    };
  }
}
