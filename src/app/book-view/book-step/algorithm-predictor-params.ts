import {PageCount, PageSelection} from './page-selection';

export enum AlgorithmTypes {
  Preprocessing = 'preprocessing',
  StaffLinesPC = 'staff_lines_pc',
  LayoutSimpleBoundingBoxes = 'layout_simple_bounding_boxes',
  LayoutComplexStandard = 'layout_complex_standard',
  SymbolsPC = 'symbols_pc',
  LayoutConnectedComponentsSelection = 'layout_connected_components_selection',
}

export const labelForAlgorithmType = new Map<AlgorithmTypes, string>(
  [
    [AlgorithmTypes.Preprocessing, 'Preprocessing'],
    [AlgorithmTypes.StaffLinesPC, 'Staff lines'],
    [AlgorithmTypes.LayoutSimpleBoundingBoxes, 'Simple layout'],
    [AlgorithmTypes.LayoutComplexStandard, 'Complex layout'],
    [AlgorithmTypes.SymbolsPC, 'Symbols'],
    [AlgorithmTypes.LayoutConnectedComponentsSelection, 'Connected components'],
  ]
);


export enum AlgorithmGroups {
  Preprocessing = 'preprocessing',
  StaffLines = 'stafflines',
  Layout = 'layout',
  Symbols = 'symbols',
  Tools = 'tools',
}

export const labelForAlgorithmGroup = new Map<AlgorithmGroups, string>(
  [
    [AlgorithmGroups.Preprocessing, 'Preprocessing'],
    [AlgorithmGroups.StaffLines, 'Staff lines'],
    [AlgorithmGroups.Layout, 'Layout'],
    [AlgorithmGroups.Symbols, 'Symbols'],
    [AlgorithmGroups.Tools, 'Tools'],
  ]
);

export const algorithmGroupTypesMapping = new Map<AlgorithmGroups, AlgorithmTypes[]>(
  [
    [AlgorithmGroups.Preprocessing, [AlgorithmTypes.Preprocessing]],
    [AlgorithmGroups.StaffLines, [AlgorithmTypes.StaffLinesPC]],
    [AlgorithmGroups.Layout, [AlgorithmTypes.LayoutSimpleBoundingBoxes, AlgorithmTypes.LayoutComplexStandard]],
    [AlgorithmGroups.Symbols, [AlgorithmTypes.SymbolsPC]],
    [AlgorithmGroups.Tools, [AlgorithmTypes.LayoutConnectedComponentsSelection]],
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
}

export class AlgorithmRequest {
  params = new AlgorithmPredictorParams();
  pcgts: any = undefined;
  selection: PageSelection = {
    count: PageCount.Unprocessed,
    pages: [],
  };
}
