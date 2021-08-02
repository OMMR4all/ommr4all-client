import {PageCount, PageSelection} from './page-selection';
import {Document} from "../../book-documents";

export enum AlgorithmTypes {
  Preprocessing = 'preprocessing',
  StaffLinesPC = 'staff_lines_pc',
  LayoutSimpleBoundingBoxes = 'layout_simple_bounding_boxes',
  LayoutComplexStandard = 'layout_complex_standard',
  LayoutSimpleLyrics = 'layout_simple_lyrics',

  SymbolsPC = 'symbols_pc',

  TextCalamari = 'text_calamari',
  TextDocuments = 'text_documents',
  TEXTDOCUMENTCORRECTOR = 'text_documents_corrector',

  SyllablesFromText = 'syllables_from_text',
  SyllablesInOrder = 'syllables_in_order',

  LayoutConnectedComponentsSelection = 'layout_connected_components_selection',
}

export interface AlgorithmMeta {
  label: string;
  description: string;
  default?: boolean;
}

export const metaForAlgorithmType = new Map<AlgorithmTypes, AlgorithmMeta>([
    [AlgorithmTypes.Preprocessing, {label: 'Preprocessing', description: '', default: true}],
    [AlgorithmTypes.StaffLinesPC, {label: 'Staff lines', description: '', default: true}],
    [AlgorithmTypes.LayoutSimpleBoundingBoxes, {label: 'Simple layout', description: '', default: false}],
    [AlgorithmTypes.LayoutComplexStandard, {
      label: 'Complex layout',
      description: 'The complex layout tries to find and accurately bound lyrics and music regions, but also drop capitals, page numbers, ' +
        'or para texts. A complex layout is only necessary if an accurate layout is desired which however is not necessary for a ' +
        'transcription of melody and syllables.',
      default: false
    }],
    [AlgorithmTypes.LayoutSimpleLyrics, {
      label: 'Simple lyrics layout',
      description: 'The simple lyrics layout generates a rudimentary layout based on the staff lines: the area between two staves is ' +
        'chosen as lyrics region. Other region types such as page numbers or drop capitals are not detected. ' +
        'This layout is simple, yet sufficient for any other algorithm or processing.',
      default: true}],
    [AlgorithmTypes.SymbolsPC, {label: 'Symbols', description: '', default: true}],
    [AlgorithmTypes.TextCalamari, {label: 'Character recognition', description: '', default: true}],
    [AlgorithmTypes.SyllablesFromText, {
      label: 'Syllables from text',
      description: 'This algorithm tries to apply the syllables of the text automatically to the correct neume by using the output of an automatic text recognition.',
      default: true,
    }],
    [AlgorithmTypes.SyllablesInOrder, {
      label: 'Syllables in order',
      description: 'This algorithm applies the syllables one after the other to each neume in a line. This algorithm is most useful if the original document suits this rule.',
      default: false,
    }],
    [AlgorithmTypes.LayoutConnectedComponentsSelection, {label: 'Connected components', description: ''}],
  ]
);

export enum AlgorithmGroups {
  Preprocessing = 'preprocessing',
  StaffLines = 'stafflines',
  Layout = 'layout',
  Symbols = 'symbols',
  Text = 'text',
  Tools = 'tools',
  Syllables = 'syllables',
}

export const labelForAlgorithmGroup = new Map<AlgorithmGroups, string>(
  [
    [AlgorithmGroups.Preprocessing, 'Preprocessing'],
    [AlgorithmGroups.StaffLines, 'Staff lines'],
    [AlgorithmGroups.Layout, 'Layout'],
    [AlgorithmGroups.Symbols, 'Symbols'],
    [AlgorithmGroups.Tools, 'Tools'],
    [AlgorithmGroups.Text, 'Text'],
    [AlgorithmGroups.Syllables, 'Syllables']
  ]
);

export const algorithmGroupTypesMapping = new Map<AlgorithmGroups, AlgorithmTypes[]>(
  [
    [AlgorithmGroups.Preprocessing, [AlgorithmTypes.Preprocessing]],
    [AlgorithmGroups.StaffLines, [AlgorithmTypes.StaffLinesPC]],
    [AlgorithmGroups.Layout, [AlgorithmTypes.LayoutSimpleLyrics, AlgorithmTypes.LayoutComplexStandard]],
    [AlgorithmGroups.Symbols, [AlgorithmTypes.SymbolsPC]],
    [AlgorithmGroups.Text, [AlgorithmTypes.TextCalamari]],
    [AlgorithmGroups.Syllables, [AlgorithmTypes.SyllablesFromText, AlgorithmTypes.SyllablesInOrder]],
    [AlgorithmGroups.Tools, [AlgorithmTypes.LayoutConnectedComponentsSelection]],
  ]
);
export const algorithmTypesGroupMapping = new Map<AlgorithmTypes, AlgorithmGroups>(
  [
    [AlgorithmTypes.Preprocessing, AlgorithmGroups.Preprocessing],
    [AlgorithmTypes.StaffLinesPC, AlgorithmGroups.StaffLines],
    [AlgorithmTypes.LayoutSimpleLyrics, AlgorithmGroups.Layout],
    [AlgorithmTypes.LayoutComplexStandard, AlgorithmGroups.Layout],
    [AlgorithmTypes.SymbolsPC, AlgorithmGroups.Symbols],
    [AlgorithmTypes.TextCalamari, AlgorithmGroups.Text],
    [AlgorithmTypes.SyllablesFromText, AlgorithmGroups.Syllables],
    [AlgorithmTypes.SyllablesInOrder, AlgorithmGroups.Syllables],
    [AlgorithmTypes.LayoutConnectedComponentsSelection, AlgorithmGroups.Tools],
  ]
);

export class AlgorithmPredictorParams {
  // general
  modelId: string = undefined;

  // preprocessing
  automaticLd = true;
  avgLd = 10;

  // connected components
  initialLine: string = undefined;

  documentId: string = undefined;
  documentText: string = undefined;

}

export class AlgorithmRequest {
  params = new AlgorithmPredictorParams();
  pcgts: any = undefined;
  selection: PageSelection = {
    count: PageCount.Unprocessed,
    pages: [],
  };
}
