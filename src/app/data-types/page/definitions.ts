export class Constants {
  static readonly GLOBAL_SCALING = 1000;
}

export enum BlockType {
  Paragraph = 'paragraph',
  Heading = 'heading',
  Lyrics = 'lyrics',
  DropCapital = 'dropCapital',
  FolioNumber = 'folioNumber',

  Music = 'music',
}

export class BlockTypeUtil {
  static readonly css = {
    paragraph: 'paragraph',
    heading: 'heading',
    lyrics: 'lyrics',
    dropCapital: 'drop-capital',
    folioNumber: 'folio-number',
    music: 'music',
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
  Note = 'note',
  Clef = 'clef',
  Accid = 'accid',

  LogicalConnection = 'logicalConnection',  // No internal symbol, but generated object
}

export enum TextEquivIndex {
  OCR_GroundTruth = 0,
  Syllables = 1,
}

export enum AccidentalType {
  Natural = 'natural',
  Sharp = 'sharp',
  Flat = 'flat',
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

  Min = Space_0,
  Max = Space_7,

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

  NeumeStart = 2,
}

export enum ClefType {
  Clef_F = 'f',
  Clef_C = 'c',
}

export enum SyllableConnectionType {
  Visible = 0,
  Hidden = 1,
  New = 2,
}

export enum SymbolErrorType {
  SEQUENCE = 0,
  CLEF = 1,
  SEGMENTATION = 2,
}

export enum AdvancedSymbolClass {
  NORMAL = 0,
  HOLED = 1,
  CARO = 2,
  W,
}
export enum AdvancedSymbolColor {
  BLACK = 0,
  RED = 1,
  GREEN = 2,
  BLUE = 3,
  ORANGE = 4,
  GREY = 5,
  YELLOW = 6,
}
export const pisGabcMapping = new Map<MusicSymbolPositionInStaff, string>(
  [
    [MusicSymbolPositionInStaff.Space_0, 'b'],
    [MusicSymbolPositionInStaff.Line_0, 'b'],
    [MusicSymbolPositionInStaff.Space_1, 'c'],
    [MusicSymbolPositionInStaff.Line_1, 'd'],
    [MusicSymbolPositionInStaff.Space_2, 'e'],
    [MusicSymbolPositionInStaff.Line_2, 'f'],
    [MusicSymbolPositionInStaff.Space_3, 'g'],
    [MusicSymbolPositionInStaff.Line_3, 'h'],
    [MusicSymbolPositionInStaff.Space_4, 'i'],
    [MusicSymbolPositionInStaff.Line_4, 'j'],
    [MusicSymbolPositionInStaff.Space_5, 'k'],
    [MusicSymbolPositionInStaff.Line_5, 'l'],
    [MusicSymbolPositionInStaff.Space_6, 'm'],
  ]);

export const pisGabcClefMapping = new Map<MusicSymbolPositionInStaff, string>(
  [
    [MusicSymbolPositionInStaff.Line_1, '1'],
    [MusicSymbolPositionInStaff.Line_2, '2'],
    [MusicSymbolPositionInStaff.Line_3, '3'],
    [MusicSymbolPositionInStaff.Line_4, '4'],
  ]);

export const typeGabcAccMapping = new Map<AccidentalType, string>(
  [
    [AccidentalType.Natural, 'y'],
    [AccidentalType.Sharp, '#'],
    [AccidentalType.Flat, 'x'],
  ]);
