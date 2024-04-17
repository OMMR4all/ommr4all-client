export enum PageCount {
  All = 'all',
  Unprocessed = 'unprocessed',
  Unlocked = 'unlocked',
  Custom = 'custom',
}

export interface PageSelection {
  count: PageCount;
  pages: string[];
  selected_pages_range_as_regex: string;
}
