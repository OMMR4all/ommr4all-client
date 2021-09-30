import {AfterViewInit, Component, HostListener, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
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

  @Input() word: string;
  public suggestions: string[] = [];
  private corrector: Dictionary = null;
  private open = false;
  private timer;
  constructor(
    wdservice: WordDictionaryService
  ) {
    this.corrector = wdservice.spellCheckerStateVal;
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
      console.log(word.replace(/-/g, ''));
      $event.preventDefault();
    }
  }
  teste() {
    console.log("enter");
  }
  testl() {
    console.log("elave");
  }
  test3() {
    console.log("elave3");
  }
}
