export enum BlockType {
  Paragraph = 0,
  Heading,
  Lyrics,
  DropCapital,
  FolioNumber,

  Music,
}

export class BlockTypeUtil {
  static readonly css = {
    0: 'paragraph',
    1: 'heading',
    2: 'lyrics',
    3: 'drop-capital',
    4: 'folio-number',
    5: 'music',
  };
}

export enum EmptyRegionDefinition {
  HasSymbols = 1,
  HasDimension = 2,
  HasStaffLines = 4,
  HasLines = 8,
  HasText = 16,

  Default = HasSymbols | HasDimension | HasStaffLines | HasLines | HasText,   // tslint:disable-line no-bitwise
}

export enum SymbolType {
  Note = 0,
  Clef = 1,
  Accid = 2,

  LogicalConnection = 10,  // No internal symbol, but generated object
}

export enum StaffEquivIndex {
  Default = 0,
}

export enum TextEquivIndex {
  OCR_GroundTruth = 0,
  Syllables = 1,
}

export enum AccidentalType {
  Natural = 0,
  Sharp = 1,
  Flat = -1,
}

export enum MusicSymbolPositionInStaff {
  Undefined = -1000,
  Space_0 = 0,
  Line_0 = 1,
  Space_1 = 2,
  Line_1 = 3,
  Space_2 = 4,
  Line_2 = 5,
  Space_3 = 6,
  Line_3 = 7,
  Space_4 = 8,
  Line_4 = 9,
  Space_5 = 10,
  Line_5 = 11,
  Space_6 = 12,
  Line_6 = 13,
  Space_7 = 14,

  Up = 101,
  Down = 99,
  Equal = 100,
}

export enum NoteType {
  Normal = 0,
  Oriscus = 1,
  Apostropha = 2,
  LiquescentFollowingU = 3,
  LiquescentFollowingD = 4,
}

export enum GraphicalConnectionType {
  Gaped = 0,
  Looped = 1,
}

export enum ClefType {
  Clef_F = 0,
  Clef_C = 1,
}

export enum SyllableConnectionType {
  Visible = 0,
  Hidden = 1,
  New = 2,
}

