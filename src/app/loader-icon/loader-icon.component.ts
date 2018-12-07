import {Component, Input, OnInit} from '@angular/core';

export enum LoaderIconTypes {
  DEFAULT = 0,
  DUAL = 1,
}

@Component({
  selector: 'app-loader-icon',
  templateUrl: './loader-icon.component.html',
  styleUrls: ['./loader-icon.component.css']
})
export class LoaderIconComponent implements OnInit {
  LIT = LoaderIconTypes;
  @Input() type = LoaderIconTypes.DEFAULT;

  constructor() { }

  ngOnInit() {
  }

}
