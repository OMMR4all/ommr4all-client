import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Dictionary} from 'ngx-spellchecker/src/services/dictionary';
import {WordDictionaryService} from '../../word-dictionary.service';
import {MatMenuTrigger} from '@angular/material/menu';
import {Subscription} from 'rxjs';

export class Replacement {
  public currentText: string;
  public repalcement: string;
  constructor(currentText: string, replacement: string) {
    this.currentText = currentText;
    this.repalcement = replacement;
}

}

@Component({
  selector: 'app-word',
  templateUrl: './word.component.html',
  styleUrls: ['./word.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})

export class WordComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  private _subscription = new Subscription();
  @ViewChild('spancontainer') public span: ElementRef;
  @Input() word: string;
  @Output() replacementEvent = new EventEmitter<Replacement>();
  public suggestions: string[] = [];
  private corrector: Dictionary = null;
  private open = false;
  private timer;
  public element: ElementRef = null;
  private wdservice: WordDictionaryService = null;
  constructor(
    wdservice: WordDictionaryService,
    element: ElementRef
  ) {
    this.wdservice = wdservice;
    this.corrector = wdservice.spellCheckerStateVal;
    this.element = element;
  }

  ngOnInit(): void {
    this._subscription.add(this.wdservice.spellCheckerStateObs.subscribe(r => { this.corrector = r; }));
  }

  ngAfterViewInit(): void {
    this._subscription.add(this.trigger.menu.close.subscribe(() => this.open = false ));

  }


  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
  checkIfMarked(word: string) {
    word = word.replace(/-/g, '');
    const vak = this.corrector.checkAndSuggest(word, 5, 2);
    this.suggestions = vak.suggestions;
    return vak.misspelled;

  }

  display() {
    this.trigger.openMenu();
    this.open = true;

  }

  addToDictionary(word: string) {
    word = word.replace(/-/g, '');
    this.wdservice.addWord(word);
  }

  removeFromDictionary(word: string) {
    word = word.replace(/-/g, '');
    this.wdservice.removeWord(word);

  }

  replace(suggestion: string) {
    this.replacementEvent.emit(new Replacement(this.word, suggestion));
  }
}
