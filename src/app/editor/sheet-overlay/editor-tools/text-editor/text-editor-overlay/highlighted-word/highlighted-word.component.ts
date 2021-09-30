import {Component, HostListener, Input, OnInit} from '@angular/core';
import {WordDictionaryService} from './word-dictionary.service';
import {Dictionary} from 'ngx-spellchecker/src/services/dictionary';

@Component({
  selector: 'app-highlighted-word',
  templateUrl: './highlighted-word.component.html',
  styleUrls: ['./highlighted-word.component.scss']
})
export class HighlightedWordComponent implements OnInit {

  @Input() text: string;
  @Input() markedWords: string[] = [];
  public count = 0;
  private corrector: Dictionary = null;
  constructor(
    wdservice: WordDictionaryService
  ) {
    this.corrector = wdservice.spellCheckerStateVal;
  }

  getWords() {
    return this.text.split(' ');
  }

  ngOnInit(): void {
  }

  checkIfMarked(word: string) {
    word = word.replace(/-/g, '');
    const val = this.corrector.spellCheck(word);
    return !val;

  }
  testw(word) {
    console.log(word.replace(/-/g, ''));
  }

}
