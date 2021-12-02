import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Dictionary} from 'ngx-spellchecker/src/services/dictionary';
import {WordDictionaryService} from '../../word-dictionary.service';
import {MatMenuTrigger} from '@angular/material/menu';
import {Subscription} from 'rxjs';
import {DatabaseDictionary} from '../../dictionary';

const Levenshtein = require('damerau-levenshtein');
export class Replacement {
  public currentText: string;
  public repalcement: string;
  constructor(currentText: string, replacement: string) {
    this.currentText = currentText;
    this.repalcement = replacement;
}

}
export class Suggestion {
  public suggestion: string;
  public probability: number;
  public count: number;

  constructor(suggestion: string, probability: number, count: number) {
    this.suggestion = suggestion;
    this.probability = probability;
    this.count = count;

  }
  getSuggestion() {
    return this.suggestion;
  }
}
@Component({
  selector: 'app-word',
  templateUrl: './word.component.html',
  styleUrls: ['./word.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})

export class WordComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = ['Suggestion', 'Ct.', 'P'];

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  private _subscription = new Subscription();
  @ViewChild('spancontainer') public span: ElementRef;
  private prevWord: string;
  private misspelled: boolean;
  @Input() word: string;
  @Output() replacementEvent = new EventEmitter<Replacement>();
  public suggestions: Suggestion[] = [];
  public suggestions2: string[] = [];
  private corrector: Dictionary = null;
  public element: ElementRef = null;
  private wdservice: WordDictionaryService = null;
  private dictionary: DatabaseDictionary = null;

  constructor(
    wdservice: WordDictionaryService,
    element: ElementRef
  ) {
    this.wdservice = wdservice;
    this.corrector = wdservice.spellCheckerStateVal;
    this.element = element;
    this.dictionary = wdservice.documentStateVal;
  }

  ngOnInit(): void {
    this._subscription.add(this.wdservice.spellCheckerStateObs.subscribe(r => { this.corrector = r; }));
    this._subscription.add(this.wdservice.documentStateObs.subscribe(r => { this.dictionary = r; }));

  }

  ngAfterViewInit(): void {
  }


  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
  checkIfMarked(word: string) {
    if (word !== this.prevWord) {
      this.prevWord = word;
      word = word.replace(/[-,.]/g, '');
      const vak = this.corrector.checkAndSuggest(word, 10, 3);
      this.suggestions2 = vak.suggestions;
      let suggestionList: Suggestion[] = [];
      // tslint:disable-next-line:forin
      for (const x of vak.suggestions) {
        const dist = Levenshtein(word, x).steps;
        suggestionList.push(new Suggestion(x, dist, this.dictionary.dictionary.findByWord(x).frequency));
    }
      let totalCount = 0;
      suggestionList.forEach(x => totalCount = totalCount + x.count);
      suggestionList.forEach(x => x.probability = Math.round((x.count / (x.probability ** x.probability ) / totalCount * 100) * 100) / 100);
      suggestionList = suggestionList.sort((x, y) => y.probability - x.probability).slice(0, 5);
      this.suggestions = suggestionList;
      this.misspelled = vak.misspelled;
      return vak.misspelled;
    }
    return this.misspelled;
  }

  display() {
    this.trigger.openMenu();
  }

  addToDictionary(word: string) {
    word = word.replace(/-/g, '');
    this.prevWord = null;

    this.wdservice.addWord(word);
  }

  removeFromDictionary(word: string) {
    word = word.replace(/-/g, '');
    this.prevWord = null;
    this.wdservice.removeWord(word);
  }

  replace(suggestion: string) {
    this.replacementEvent.emit(new Replacement(this.word, this.dictionary.dictionary.findByWord(suggestion).hyphenated));
  }
}
