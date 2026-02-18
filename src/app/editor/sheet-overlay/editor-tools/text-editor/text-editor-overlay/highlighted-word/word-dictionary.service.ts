import { Injectable } from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {BookCommunication} from '../../../../../../data-types/communication';
import {HttpClient} from '@angular/common/http';
import {ServerStateService} from '../../../../../../server-state/server-state.service';
import {DatabaseDictionary} from './dictionary';
import {SimpleSpellChecker} from '../../spellchecker';



@Injectable({
  providedIn: 'root'
})
export class WordDictionaryService {
  private _subscriptions = new Subscription();

  // tslint:disable-next-line:variable-name
  private _dictionary_state = new BehaviorSubject<DatabaseDictionary>(null);

  // tslint:disable-next-line:variable-name
  private _spellchecker_state = new BehaviorSubject<SimpleSpellChecker>(null);

  private _lastBookCommunication: BookCommunication = null;
  constructor(
    private http: HttpClient,
    private serverState: ServerStateService
  ) {
    this._subscriptions.add(serverState.connectedToServer.subscribe(() => {
      this.load();
    }));
  }
  private refreshChecker() {
    const dict = this.documentStateVal;
    if (dict && dict.dictionary) {
      const words = dict.getWordList().sort();
      this._spellchecker_state.next(new SimpleSpellChecker(words));
    }
  }
  load() {
    if (this._lastBookCommunication) {
      this.http.get(this._lastBookCommunication.dictionaryUrl()).subscribe(r => {
        this._dictionary_state.next(DatabaseDictionary.fromJson(r));
        this.refreshChecker();
      });
    }
  }

  saveDictionary() {
    if (this._lastBookCommunication) {
      if (this.documentStateVal == null) {
      this.http.put(this._lastBookCommunication.dictionaryUrl(), this.documentStateVal.toJson(), {}).subscribe(() => console.log('Dictionary saved'));}
      else {
        this.load();
      }

    }
  }
  select(book: string) {
    if (this._lastBookCommunication == null || book !== this._lastBookCommunication.book) {
      this._lastBookCommunication = new BookCommunication(book);
      this.load();
    }
  }
  addWord(word: string, frequency: number = 1) {
    const dictionary = this.documentStateVal;
    if (dictionary) {
      dictionary.dictionary.addWord(word, frequency);
      this._dictionary_state.next(dictionary);
      this.refreshChecker();
    }
  }
  removeWord(word: string) {
    const dictionary = this.documentStateVal;
    if (dictionary) {
      dictionary.dictionary.removeWord(word);
      this._dictionary_state.next(dictionary);

      this.refreshChecker();
    }
  }
  get documentStateObs() { return this._dictionary_state.asObservable(); }
  get documentStateVal() { return this._dictionary_state.getValue(); }
  get spellCheckerStateVal() { return this._spellchecker_state.getValue(); }
  get spellCheckerStateObs() { return this._spellchecker_state.asObservable(); }


}
