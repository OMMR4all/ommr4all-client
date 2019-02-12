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
    a.connections = json.connections.map(c => Connection.fromJson(c, a));
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

  findSyllableConnector(line: PageLine, syllable: Syllable): SyllableConnector {
    if (!syllable) { return null; }
    const c = this.connections.find(con => con.textRegion === line.getBlock());
    if (!c) { return null; }
    return c.syllableConnectors.find(s => s.syllable === syllable);
  }

}

export class Connection {
  constructor(
    private _annotations: Annotations,
    public musicRegion: Block,
    public textRegion: Block,
    public syllableConnectors: Array<SyllableConnector> = [],
  ) {}

  static fromJson(json, annotations: Annotations) {
    const page = annotations.page;
    const mr = page.musicRegionById(json.musicID);
    const tr = page.textRegionById(json.textID);
    const c = new Connection(
      annotations,
      mr, tr,
    );
    c.syllableConnectors = json.syllableConnectors.map(sc => SyllableConnector.fromJson(sc, c, tr, mr));
    return c;
  }

  get annotations() { return this._annotations; }

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
    private _connection: Connection,
    public syllable: Syllable,
    public neumeConnectors: Array<NeumeConnector> = [],
  ) {}

  static fromJson(json, connection: Connection, textRegion: Block, musicRegion: Block) {
    const si = textRegion.syllableInfoById(json.refID);
    const sc = new SyllableConnector(
      connection,
      si.s,
    );
    sc.neumeConnectors = json.neumeConnectors.map(nc => NeumeConnector.fromJson(nc, sc, musicRegion, si.l));
    return sc;
  }

  get connection() { return this._connection; }

  toJson() {
    return {
      refID: this.syllable.id,
      neumeConnectors: this.neumeConnectors.map(nc => nc.toJson())
    };
  }

}

export class NeumeConnector {
  constructor(
    private _syllableConnector: SyllableConnector,
    public neume: Note,
    public textLine: PageLine,
  ) {}

  static fromJson(json, syllableConnector: SyllableConnector, musicRegion: Block, textLine: PageLine) {
    return new NeumeConnector(
      syllableConnector,
      musicRegion.noteById(json.refID.replace('neume', 'note')),
      textLine,
    );
  }

  get syllableConnector() { return this._syllableConnector; }

  toJson() {
    return {
      refID: this.neume.id.replace('note', 'neume'),
    };
  }
}
