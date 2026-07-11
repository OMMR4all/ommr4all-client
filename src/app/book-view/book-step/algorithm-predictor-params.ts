import {PageCount, PageSelection} from './page-selection';
import {Document} from "../../book-documents";

export enum AlgorithmTypes {
  Preprocessing = 'preprocessing',
  StaffLinesPC = 'staff_lines_pc',
  StaffLinePCTorch = 'staff_lines_pc_torch',
  LayoutSimpleBoundingBoxes = 'layout_simple_bounding_boxes',
  LayoutComplexStandard = 'layout_complex_standard',
  LayoutSimpleLyrics = 'layout_simple_lyrics',
  DOCUMENTALIGNMENT = 'document_alignment',

  SymbolsPC = 'symbols_pc',
  SymbolsPCTorch = 'symbols_pc_torch',

  SymbolsSQ2SQNautilus = 'symbols_sequence_to_sequence_nautilus',

  TextCalamari = 'text_calamari',
  TextDocuments = 'text_documents',
  TextNautilus = 'text_nautilus',
  TextGuppy = 'text_guppy',
  TextLLM = 'text_llm',

  TEXTDOCUMENTCORRECTOR = 'text_documents_corrector',

  SyllablesFromText = 'syllables_from_text',
  SyllablesFromTextTorch = 'syllables_from_text_torch',

  SyllablesInOrder = 'syllables_in_order',

  LayoutConnectedComponentsSelection = 'layout_connected_components_selection',

  Postprocessing = 'postprocessing',

  SymbolPatternMatcher = 'symbols_pattern_matcher',
  Train_Symbols = 'train_symbols',
  DocumentsExport = 'documents_export',

  End2EndSwin = 'end2end_swin',
  Train_End2End = 'train_end2end',
}

export enum AlgorithmGroups {
  Preprocessing = 'preprocessing',
  StaffLines = 'stafflines',
  Layout = 'layout',
  Symbols = 'symbols',
  Text = 'text',
  Tools = 'tools',
  Documents = 'documents',
  Syllables = 'syllables',
  End2End = 'end2end',
  Search = 'search',
  Postprocessing = 'postprocessing',
}

export interface AlgorithmMeta {
  label: string;
  description: string;
  default?: boolean;
  // Pipeline stages (AlgorithmGroups) that must be produced by earlier workflow
  // steps before this algorithm can run.
  requires?: AlgorithmGroups[];
  // Pipeline stages this algorithm produces. An algorithm may produce several
  // stages at once (e.g. a page-level model covering layout and text).
  produces?: AlgorithmGroups[];
}

export const metaForAlgorithmType = new Map<AlgorithmTypes, AlgorithmMeta>([
    [AlgorithmTypes.Preprocessing, {label: 'Preprocessing', description: '', default: true,
      requires: [], produces: [AlgorithmGroups.Preprocessing]}],
    [AlgorithmTypes.StaffLinesPC, {label: 'Staff lines', description: '', default: true,
      requires: [AlgorithmGroups.Preprocessing], produces: [AlgorithmGroups.StaffLines]}],
    [AlgorithmTypes.StaffLinePCTorch, {label: 'Staff lines', description: '', default: true,
      requires: [AlgorithmGroups.Preprocessing], produces: [AlgorithmGroups.StaffLines]}],

    [AlgorithmTypes.LayoutSimpleBoundingBoxes, {label: 'Simple layout', description: '', default: false,
      requires: [AlgorithmGroups.StaffLines], produces: [AlgorithmGroups.Layout]}],
    [AlgorithmTypes.LayoutComplexStandard, {
      label: 'Complex layout',
      description: 'The complex layout tries to find and accurately bound lyrics and music regions, but also drop capitals, page numbers, ' +
        'or para texts. A complex layout is only necessary if an accurate layout is desired which however is not necessary for a ' +
        'transcription of melody and syllables.',
      default: false,
      requires: [AlgorithmGroups.StaffLines], produces: [AlgorithmGroups.Layout]
    }],
    [AlgorithmTypes.LayoutSimpleLyrics, {
      label: 'Simple lyrics layout',
      description: 'The simple lyrics layout generates a rudimentary layout based on the staff lines: the area between two staves is ' +
        'chosen as lyrics region. Other region types such as page numbers or drop capitals are not detected. ' +
        'This layout is simple, yet sufficient for any other algorithm or processing.',
      default: true,
      requires: [AlgorithmGroups.StaffLines], produces: [AlgorithmGroups.Layout]}],
    [AlgorithmTypes.SymbolsPC, {label: 'Symbols', description: '', default: true,
      requires: [AlgorithmGroups.StaffLines, AlgorithmGroups.Layout], produces: [AlgorithmGroups.Symbols]}],
    [AlgorithmTypes.SymbolsPCTorch, {label: 'Segmentation', description: '', default: true,
      requires: [AlgorithmGroups.StaffLines, AlgorithmGroups.Layout], produces: [AlgorithmGroups.Symbols]}],

  [AlgorithmTypes.SymbolsSQ2SQNautilus, {label: 'S2S', description: '', default: false,
    requires: [AlgorithmGroups.StaffLines, AlgorithmGroups.Layout], produces: [AlgorithmGroups.Symbols]}],

  [AlgorithmTypes.TextCalamari, {label: 'Calamari', description: 'Character recognition', default: false,
    requires: [AlgorithmGroups.Layout], produces: [AlgorithmGroups.Text]}],
  [AlgorithmTypes.TextNautilus, {label: 'Nautilus', description: 'Character recognition', default: false,
    requires: [AlgorithmGroups.Layout], produces: [AlgorithmGroups.Text]}],
  [AlgorithmTypes.TextGuppy, {label: 'Guppy', description: 'Character recognition', default: true,
    requires: [AlgorithmGroups.Layout], produces: [AlgorithmGroups.Text]}],
  [AlgorithmTypes.TextLLM, {
    label: 'LLM',
    description: 'Page level text transcription using a vision large language model (Chandra 2, runs locally on the server). ' +
      'The whole page is transcribed at once and the recognized text lines are assigned to the text regions afterwards.',
    default: false,
    requires: [AlgorithmGroups.Layout], produces: [AlgorithmGroups.Text]
  }],

  [AlgorithmTypes.SyllablesFromTextTorch, {
    label: 'Syllables from text',
    description: 'This algorithm tries to apply the syllables of the text automatically to the correct neume by using the output of an automatic text recognition.',
    default: true,
    requires: [AlgorithmGroups.Text, AlgorithmGroups.Symbols], produces: [AlgorithmGroups.Syllables],
  }],
  [AlgorithmTypes.SyllablesFromText, {
      label: 'Syllables from text',
      description: 'This algorithm tries to apply the syllables of the text automatically to the correct neume by using the output of an automatic text recognition.',
      default: false,
      requires: [AlgorithmGroups.Text, AlgorithmGroups.Symbols], produces: [AlgorithmGroups.Syllables],
    }],
    [AlgorithmTypes.SyllablesInOrder, {
      label: 'Syllables in order',
      description: 'This algorithm applies the syllables one after the other to each neume in a line. This algorithm is most useful if the original document suits this rule.',
      default: false,
      requires: [AlgorithmGroups.Text, AlgorithmGroups.Symbols], produces: [AlgorithmGroups.Syllables],
    }],

    [AlgorithmTypes.TextDocuments, {
      label: 'Document matching',
      description: 'Matches the recognized text of the documents (chants) against a lyrics database and corrects it. ' +
        'Requires the text recognition to be finished.',
      default: true,
      requires: [AlgorithmGroups.Layout, AlgorithmGroups.Text], produces: [AlgorithmGroups.Documents],
    }],
    [AlgorithmTypes.Postprocessing, {
      label: 'Postprocessing',
      description: 'Postprocessing of the recognized symbols based on the assigned syllables.',
      default: true,
      requires: [AlgorithmGroups.Symbols, AlgorithmGroups.Syllables], produces: [AlgorithmGroups.Postprocessing],
    }],

    [AlgorithmTypes.LayoutConnectedComponentsSelection, {label: 'Connected components', description: ''}],

    [AlgorithmTypes.End2EndSwin, {
      label: 'End-to-end (Swin)',
      description: 'Experimental: transcribes symbols, lyrics and syllable assignments of each staff and its lyric line ' +
        'in one step using a Swin transformer. Symbol positions are synthesized and may need manual correction. ' +
        'Requires a model trained for this book.',
      default: true,
      requires: [AlgorithmGroups.StaffLines, AlgorithmGroups.Layout],
      produces: [AlgorithmGroups.Symbols, AlgorithmGroups.Text, AlgorithmGroups.Syllables],
    }],
  ]
);

export const labelForAlgorithmGroup = new Map<AlgorithmGroups, string>(
  [
    [AlgorithmGroups.Preprocessing, 'Preprocessing'],
    [AlgorithmGroups.StaffLines, 'Staff lines'],
    [AlgorithmGroups.Layout, 'Layout'],
    [AlgorithmGroups.Symbols, 'Symbols'],
    [AlgorithmGroups.Tools, 'Tools'],
    [AlgorithmGroups.Text, 'Text'],
    [AlgorithmGroups.Documents, 'Document'],
    [AlgorithmGroups.Syllables, 'Syllables'],
    [AlgorithmGroups.End2End, 'End-to-end transcription'],
    [AlgorithmGroups.Postprocessing, 'Postprocessing']


  ]
);

export const algorithmGroupTypesMapping = new Map<AlgorithmGroups, AlgorithmTypes[]>(
  [
    [AlgorithmGroups.Preprocessing, [AlgorithmTypes.Preprocessing]],
    [AlgorithmGroups.StaffLines, [AlgorithmTypes.StaffLinePCTorch]], // deactivated: AlgorithmTypes.StaffLinesPC
    [AlgorithmGroups.Layout, [AlgorithmTypes.LayoutSimpleLyrics, AlgorithmTypes.LayoutComplexStandard]],
    [AlgorithmGroups.Symbols, [AlgorithmTypes.SymbolsPCTorch,  AlgorithmTypes.SymbolsSQ2SQNautilus]], // deactivated: AlgorithmTypes.SymbolsPC,
    [AlgorithmGroups.Text, [AlgorithmTypes.TextGuppy, AlgorithmTypes.TextNautilus, AlgorithmTypes.TextLLM]], // deactivated: AlgorithmTypes.TextCalamari,
    [AlgorithmGroups.Syllables, [AlgorithmTypes.SyllablesFromTextTorch, AlgorithmTypes.SyllablesInOrder] ], // deactivated: AlgorithmTypes.SyllablesFromText,
    [AlgorithmGroups.Documents, [AlgorithmTypes.TextDocuments]],
    [AlgorithmGroups.End2End, [AlgorithmTypes.End2EndSwin]],
    [AlgorithmGroups.Tools, [AlgorithmTypes.LayoutConnectedComponentsSelection]],
    [AlgorithmGroups.Postprocessing, [AlgorithmTypes.Postprocessing]],
    [AlgorithmGroups.Search, [AlgorithmTypes.SymbolPatternMatcher]]
  ]
);
export const algorithmTypesGroupMapping = new Map<AlgorithmTypes, AlgorithmGroups>(
  [
    [AlgorithmTypes.Preprocessing, AlgorithmGroups.Preprocessing],
    [AlgorithmTypes.StaffLinesPC, AlgorithmGroups.StaffLines],
    [AlgorithmTypes.StaffLinePCTorch, AlgorithmGroups.StaffLines],
    [AlgorithmTypes.LayoutSimpleBoundingBoxes, AlgorithmGroups.Layout],
    [AlgorithmTypes.LayoutSimpleLyrics, AlgorithmGroups.Layout],
    [AlgorithmTypes.LayoutComplexStandard, AlgorithmGroups.Layout],
    [AlgorithmTypes.SymbolsPC, AlgorithmGroups.Symbols],
    [AlgorithmTypes.SymbolsPCTorch, AlgorithmGroups.Symbols],
    [AlgorithmTypes.SymbolsSQ2SQNautilus, AlgorithmGroups.Symbols],

    [AlgorithmTypes.TextCalamari, AlgorithmGroups.Text],
    [AlgorithmTypes.TextNautilus, AlgorithmGroups.Text],
    [AlgorithmTypes.TextGuppy, AlgorithmGroups.Text],
    [AlgorithmTypes.TextLLM, AlgorithmGroups.Text],

    [AlgorithmTypes.SyllablesFromText, AlgorithmGroups.Syllables],
    [AlgorithmTypes.SyllablesFromTextTorch, AlgorithmGroups.Syllables],
    [AlgorithmTypes.SyllablesInOrder, AlgorithmGroups.Syllables],
    [AlgorithmTypes.TextDocuments, AlgorithmGroups.Documents],
    [AlgorithmTypes.Postprocessing, AlgorithmGroups.Postprocessing],
    [AlgorithmTypes.End2EndSwin, AlgorithmGroups.End2End],
    [AlgorithmTypes.LayoutConnectedComponentsSelection, AlgorithmGroups.Tools],
  ]
);

// The pipeline stages offered in the one-click workflow configurator, in
// canonical order (also the order of the default workflow).
export const oneClickPipelineGroups: AlgorithmGroups[] = [
  AlgorithmGroups.Preprocessing,
  AlgorithmGroups.StaffLines,
  AlgorithmGroups.Layout,
  AlgorithmGroups.Symbols,
  AlgorithmGroups.Text,
  AlgorithmGroups.Syllables,
];

// Special stages that can be added to a workflow but are not part of the
// default pipeline.
export const optionalPipelineGroups: AlgorithmGroups[] = [
  AlgorithmGroups.Documents,
  AlgorithmGroups.Postprocessing,
  AlgorithmGroups.End2End,
];

export function stageInfoFor(t: AlgorithmTypes): {requires: AlgorithmGroups[], produces: AlgorithmGroups[]} {
  const meta = metaForAlgorithmType.get(t);
  if (meta && meta.produces) {
    return {requires: meta.requires || [], produces: meta.produces};
  }
  const group = algorithmTypesGroupMapping.get(t);
  return {requires: [], produces: group !== undefined ? [group] : []};
}

export class AlgorithmPredictorParams {
  // general
  modelId: string = undefined;

  // preprocessing
  automaticLd = true;
  avgLd = 10;
  deskew = true;

  // layout
  dropCapitals = true;
  documentStarts = true;
  documentStartsDropCapitalMinHeight = 0.5;

  // connected components
  initialLine: string = undefined;

  documentId: string = undefined;
  documentText: string = undefined;

  // text detection
  useDictionaryCorrection = false;

  // llm based text transcription; api keys are configured on the server
  // via environment variables, never sent from the client
  llmProvider = 'chandra';
  llmModel = '';

  patterns: number[][] = [];
}

export class AlgorithmRequest {
  store_to_pcgts = false;
  params = new AlgorithmPredictorParams();
  pcgts: any = undefined;
  selection: PageSelection = {
    count: PageCount.Unprocessed,
    pages: [],
    selected_pages_range_as_regex: '',
  };
  // 'cpu' or 'gpu'; null lets the server pick the algorithm's default
  worker_resource: string = null;
}

export interface WorkerResourceInfo {
  allowed: boolean;
  default: boolean;
  n_workers: number;
  n_free: number;
  n_tasks_queued: number;
}

export interface WorkerResourcesResponse {
  operation: string;
  resources: {cpu: WorkerResourceInfo, gpu: WorkerResourceInfo};
}
