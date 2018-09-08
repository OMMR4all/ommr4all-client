import { Component, OnInit, Input } from '@angular/core';
import { Symbol, SymbolType } from '../musical-symbols/symbol';

@Component({
  selector: 'g[app-symbol]',
  templateUrl: './symbol.component.html',
  styleUrls: ['./symbol.component.css']
})
export class SymbolComponent implements OnInit {
  @Input() symbol: Symbol;

  @Input() size = 0;

  SymbolType = SymbolType;

  constructor() {
  }

  ngOnInit() {
    if (this.size === 0) {
      if (!this.symbol.staff) {
        console.error('Symbol without staff or height definition');
      }
      this.size = this.symbol.staff.avgStaffLineDistance;
    }
  }

}
