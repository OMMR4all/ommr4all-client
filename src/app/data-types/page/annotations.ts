import {MusicRegion} from './music-region/music-region';
import {TextRegion, TextRegionType} from './text-region';
import {Syllable} from './syllable';
import {Note} from './music-region/symbol';
import {Page} from './page';
import {TextLine} from './text-line';

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

}

export class Connection {
  constructor(
      public musicRegion: MusicRegion,
      public textRegion: TextRegion,
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

  static fromJson(json, page: Page, textRegion: TextRegion, musicRegion: MusicRegion) {
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
    public textLine: TextLine,
  ) {}

  static fromJson(json, musicRegion: MusicRegion, textLine: TextLine) {
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
