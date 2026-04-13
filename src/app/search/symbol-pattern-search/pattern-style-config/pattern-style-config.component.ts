import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle} from "@angular/material/expansion";
import {MatCheckbox} from "@angular/material/checkbox";
import {MatIcon} from "@angular/material/icon";
import {FormsModule} from "@angular/forms";
import {DecimalPipe} from "@angular/common";

export interface PatternStyleConfig {
  borderColor: string;
  borderOpacity: number;
  backgroundColor: string;
  bgOpacity: number;
  labelBgColor: string;
  labelBgOpacity: number;
  labelBorderColor: string;
  labelBorderOpacity: number;
  labelTextColor: string;
  labelTextOpacity: number;
}

@Component({
  standalone: true,
  selector: 'app-pattern-style-config',
  imports: [
    MatExpansionPanelHeader,
    MatExpansionPanel,
    MatCheckbox,
    MatExpansionPanelTitle,
    MatIcon,
    FormsModule,
    DecimalPipe
  ],
  templateUrl: './pattern-style-config.component.html',
  styleUrl: './pattern-style-config.component.scss',
})
export class PatternStyleConfigComponent implements OnInit {
  @Input() config: PatternStyleConfig = {
    borderColor: '#000000',
    borderOpacity: 1.0,
    backgroundColor: 'transparent',
    bgOpacity: 0.35,
    labelBgColor: 'transparent',
    labelBgOpacity: 1.0,
    labelBorderColor: 'transparent',
    labelBorderOpacity: 1.0,
    labelTextColor: '#ffffff',
    labelTextOpacity: 1.0,
  };

  @Output() configChange = new EventEmitter<PatternStyleConfig>();

  isBgTransparent = true;
  isLabelBgTransparent = true;
  isLabelBorderTransparent = true;

  activeBgColor = '#ff0000';
  activeLabelBgColor = '#000000';
  activeLabelBorderColor = '#000000';

  ngOnInit() {
    this.syncTogglesWithConfig();
  }

  syncTogglesWithConfig() {
    this.isBgTransparent = this.config.backgroundColor === 'transparent' || this.config.backgroundColor === 'none';
    if (!this.isBgTransparent) this.activeBgColor = this.config.backgroundColor;

    this.isLabelBgTransparent = this.config.labelBgColor === 'transparent' || this.config.labelBgColor === 'none';
    if (!this.isLabelBgTransparent) this.activeLabelBgColor = this.config.labelBgColor;

    this.isLabelBorderTransparent = this.config.labelBorderColor === 'transparent' || this.config.labelBorderColor === 'none';
    if (!this.isLabelBorderTransparent) this.activeLabelBorderColor = this.config.labelBorderColor;
  }

  onStyleChange() {
    this.config.backgroundColor = this.isBgTransparent ? 'transparent' : this.activeBgColor;
    this.config.labelBgColor = this.isLabelBgTransparent ? 'transparent' : this.activeLabelBgColor;
    this.config.labelBorderColor = this.isLabelBorderTransparent ? 'transparent' : this.activeLabelBorderColor;

    // Emit a fresh copy of the config so Angular detects the change
    this.configChange.emit({ ...this.config });
  }
}
