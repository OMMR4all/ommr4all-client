import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import {WordDictionaryService} from '../../word-dictionary.service';
import {MatMenuTrigger} from '@angular/material/menu';
import {Subscription} from 'rxjs';
import {DatabaseDictionary} from '../../dictionary';
import {SimpleSpellChecker} from '../../../../spellchecker';

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
    standalone: false
})

export class WordComponent implements OnInit, OnDestroy, AfterViewInit {
  private wdservice = inject(WordDictionaryService);

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
  private corrector: SimpleSpellChecker | null = null;
  public element: ElementRef = null;
  private dictionary: DatabaseDictionary = null;

  constructor() {
    const wdservice = this.wdservice;
    const element = inject(ElementRef);

    this.corrector = wdservice.spellCheckerStateVal;
    this.element = element;
    this.dictionary = wdservice.documentStateVal;
  }

  ngOnInit(): void {
    this._subscription.add(this.wdservice.spellCheckerStateObs.subscribe(r => {
      this.corrector = r;
    }));
    this._subscription.add(this.wdservice.documentStateObs.subscribe(r => {
      this.dictionary = r;
    }));
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  checkIfMarked(word: string) {
    if (!this.corrector || !this.dictionary) return false;

    if (word !== this.prevWord) {
      this.prevWord = word;
      const cleanWord = word.replace(/[-,.]/g, '');

      const isMisspelled = !this.corrector.check(cleanWord);
      this.misspelled = isMisspelled;

      if (isMisspelled) {
        const rawSuggestions = this.corrector.getSuggestions(cleanWord, 10);
        this.suggestions2 = rawSuggestions;

        const suggestionList: Suggestion[] = [];
        for (const x of rawSuggestions) {

          const wordInfo = this.dictionary.dictionary.findByWord(x);
          const freq = wordInfo ? wordInfo.frequency : 0;

          suggestionList.push(new Suggestion(x, 1, freq));
        }

        let totalCount = 0;
        suggestionList.forEach(x => totalCount += x.count);

        // Probability calculation logic remains yours
        suggestionList.forEach(x => {
          if (totalCount > 0) {
            x.probability = Math.round((x.count / totalCount * 100) * 100) / 100;
          } else {
            x.probability = 0;
          }
        });

        this.suggestions = suggestionList.sort((x, y) => y.probability - x.probability).slice(0, 5);
      } else {
        this.suggestions = [];
      }
    }
    return this.misspelled;
  }

  display() {
    this.trigger.openMenu();
  }

  addToDictionary(word: string) {
    const clean = word.replace(/-/g, '');
    this.prevWord = null;
    this.wdservice.addWord(clean);
  }

  removeFromDictionary(word: string) {
    const clean = word.replace(/-/g, '');
    this.prevWord = null;
    this.wdservice.removeWord(clean);
  }

  replace(suggestion: string) {
    const wordInfo = this.dictionary.dictionary.findByWord(suggestion);
    this.replacementEvent.emit(new Replacement(this.word, wordInfo ? wordInfo.hyphenated : suggestion));
  }
}
