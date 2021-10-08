import { Injectable } from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {BookCommunication} from '../../../../../../data-types/communication';
import {HttpClient} from '@angular/common/http';
import {ServerStateService} from '../../../../../../server-state/server-state.service';
import {DatabaseDictionary} from './dictionary';
import { SpellCheckerService } from 'ngx-spellchecker';
import {Dictionary} from 'ngx-spellchecker/src/services/dictionary';



@Injectable({
  providedIn: 'root'
})
export class WordDictionaryService {
  private _subscriptions = new Subscription();
  // tslint:disable-next-line:variable-name
  private _dictionary_state = new BehaviorSubject<DatabaseDictionary>(null);
  private _spellchecker_state = new BehaviorSubject<Dictionary>(null);
  private _lastBookCommunication: BookCommunication = null;
  constructor(private http: HttpClient,
              private serverState: ServerStateService,
              private spellCheckerService: SpellCheckerService) {
    this._subscriptions.add(serverState.connectedToServer.subscribe(() => {
      this.load();
    }));
  }

  load() {
    if (this._lastBookCommunication) {
      this.http.get(this._lastBookCommunication.dictionaryUrl()).subscribe(r => {
        this._dictionary_state.next(DatabaseDictionary.fromJson(r));
        const dict = this.spellCheckerService.getDictionary(' ');
        dict.setWordlist(this.documentStateVal.getWordList().sort());
        this._spellchecker_state.next(dict);
      });
    }
  }
  saveDictionary() {
    if (this._lastBookCommunication) {
      this.http.put(this._lastBookCommunication.dictionaryUrl(), this.documentStateVal.toJson(), {}).subscribe(() => console.log('Dictionary saved'));

    }
  }
  select(book: string) {
    this._lastBookCommunication = new BookCommunication(book);
    this.load();
  }
  addWord(word: string, frequency: number = 1) {
    const dictionary = this._dictionary_state.getValue();
    dictionary.dictionary.addWord(word, frequency);
    this._dictionary_state.next(dictionary);
    const dict = this.spellCheckerService.getDictionary(' ');
    dict.setWordlist(this.documentStateVal.getWordList().sort());
    this._spellchecker_state.next(dict);
  }

  get documentStateObs() { return this._dictionary_state.asObservable(); }
  get documentStateVal() { return this._dictionary_state.getValue(); }
  get spellCheckerStateVal() { return this._spellchecker_state.getValue(); }
  get spellCheckerStateObs() { return this._spellchecker_state.asObservable(); }


  removeWord(word: string) {
    const dictionary = this._dictionary_state.getValue();
    dictionary.dictionary.removeWord(word);
    this._dictionary_state.next(dictionary);
    const dict = this.spellCheckerService.getDictionary(' ');
    dict.setWordlist(this.documentStateVal.getWordList().sort());
    this._spellchecker_state.next(dict);

  }

}
