import {AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Dictionary} from 'ngx-spellchecker/src/services/dictionary';
import {WordDictionaryService} from '../../word-dictionary.service';
import {MatMenuTrigger} from '@angular/material/menu';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-word',
  templateUrl: './word.component.html',
  styleUrls: ['./word.component.scss']
})
export class WordComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  private _subscription = new Subscription();
  @ViewChild('spancontainer') public span: ElementRef;
  @Input() word: string;
  public suggestions: string[] = [];
  private corrector: Dictionary = null;
  private open = false;
  private timer;
  public element: ElementRef = null;
  constructor(
    wdservice: WordDictionaryService,
    element: ElementRef
  ) {
    this.corrector = wdservice.spellCheckerStateVal;
    this.element = element;
  }

  ngOnInit(): void {
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
  testw(word, $event: MouseEvent) {
    console.log(this.open);
    if (this.open === false) {
      console.log($event);
      this.trigger.openMenu();
      this.open = true;
      $event.preventDefault();
    }
  }

  display() {
    this.trigger.openMenu();
    this.open = true;

  }

  addToDictionary(word: string) {
  }

  removeFromDictionary(word: string) {
  }

  replace(suggestion: string) {
  }
}
