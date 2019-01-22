import { Injectable } from '@angular/core';
import {BlockType} from '../../../data-types/page/definitions';

@Injectable({
  providedIn: 'root'
})
export class LayoutPropertyWidgetService {
  useDefaultRegion = true;
  regionType = BlockType.Music;

  constructor() { }
}
