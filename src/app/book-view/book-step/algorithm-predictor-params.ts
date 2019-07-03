import {PageCount, PageSelection} from './book-step-page-selector/book-step-page-selector.component';

export enum LayoutModes {
  Simple = 'simple',
  Complex = 'complex',
}

export class AlgorithmPredictorParams {
  // general
  modelId: string = undefined;

  // preprocessing
  automaticLd = true;
  avgLd = 10;

  // layout
  layoutMode: LayoutModes = LayoutModes.Simple;
}

export class AlgorithmRequest {
  params = new AlgorithmPredictorParams();
  selection: PageSelection = {
    count: PageCount.Unprocessed,
    pages: [],
  };
}
