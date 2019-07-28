import {BookMeta} from '../book-list.service';

export interface ModelMeta {
  id: string;
  created: string;
  accuracy: number;
  iters: number;
}

export interface DefaultModelForStyle {
  style: string;
  model: ModelMeta;
}

export interface AvailableModels {
  book: string;
  book_meta: BookMeta;
  newest_model?: ModelMeta;
  selected_model?: ModelMeta;
  book_models: ModelMeta[];
  models_of_same_book_style: [BookMeta, ModelMeta][];
  default_book_style_model?: ModelMeta;
  default_models: DefaultModelForStyle[];
}

