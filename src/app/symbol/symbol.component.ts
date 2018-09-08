import { Component, OnInit, Input } from '@angular/core';
import { Symbol, SymbolType } from '../musical-symbols/symbol';

@Component({
  selector: 'g[app-symbol]',
  templateUrl: './symbol.component.html',
  styleUrls: ['./symbol.component.css']
})
export class SymbolComponent implements OnInit {
  @Input() symbol: Symbol;

  size: number;

  SymbolType = SymbolType;

  constructor() {
  }

  ngOnInit() {
    this.size = this.symbol.staff.avgStaffLineDistance;
  }

}
