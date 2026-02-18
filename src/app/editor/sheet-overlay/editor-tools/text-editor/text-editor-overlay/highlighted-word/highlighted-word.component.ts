import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef, EventEmitter,
  HostListener,
  Input,
  OnInit, Output,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {WordDictionaryService} from './word-dictionary.service';
import {Replacement, WordComponent} from './word/word/word.component';
import {SimpleSpellChecker} from '../../spellchecker';
function isCoordinateWithinRect(rect: ClientRect, x: number, y: number, elem: WordComponent) {
  const rect2 = elem.span.nativeElement.getBoundingClientRect();
  return rect2.left < x && x < rect2.right;
}

@Component({
    selector: 'app-highlighted-word',
    templateUrl: './highlighted-word.component.html',
    styleUrls: ['./highlighted-word.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})

export class HighlightedWordComponent implements OnInit, AfterViewInit, AfterContentInit {
  @ViewChildren(WordComponent) childrenComponent: QueryList<WordComponent>;
  @Input() text: string;
  @Input() textarea: HTMLInputElement;
  @Output() replacementEventParent = new EventEmitter<Replacement>();
  private textareaEventListeners: Array<() => void> = [];
  private highlightTagElements: Array<{
    element: WordComponent;
    clientRect: ClientRect;
  }> = [];
  public count = 0;
  private corrector: SimpleSpellChecker | null = null;

  constructor(
    private wdservice: WordDictionaryService,
    element: ElementRef,
    private renderer: Renderer2, private cdr: ChangeDetectorRef
  ) {
    this.wdservice.spellCheckerStateObs.subscribe(checker => {
      this.corrector = checker;
      this.cdr.markForCheck();
    });
  }

  getWords() {
    return this.text ? this.text.split(' ') : [];
  }


  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const onClick = this.renderer.listen(
      this.textarea,
      'contextmenu',
      event => {
        this.handleTextareaMouseEvent(event, 'click');
      }
    );
    this.textareaEventListeners.push(onClick);
    const a: Array<{
      element: WordComponent;
      clientRect: ClientRect;
    }> = [];
    for (const item of this.childrenComponent) {

      if (item.span !== undefined) {
        a.push({element: item, clientRect: item.span.nativeElement.getBoundingClientRect()});
        this.highlightTagElements = a;
      }
    }
    this.childrenComponent.changes.subscribe((comps: QueryList<WordComponent>) => {
      const a: Array<{
        element: WordComponent;
        clientRect: ClientRect;
      }> = [];
      for (const item of comps) {
        // tslint:disable-next-line:prefer-const
        if (item.span !== undefined) {
          a.push({element: item, clientRect: item.span.nativeElement.getBoundingClientRect()});
          this.highlightTagElements = a;
        }
      }
    });

  }

  private handleTextareaMouseEvent(
    event: MouseEvent,
    eventName: 'click' | 'mousemove'
  ) {
    const matchingTagIndex = this.highlightTagElements.findIndex(elm =>
      isCoordinateWithinRect(elm.clientRect, event.clientX, event.clientY, elm.element)
    );
    if (matchingTagIndex > -1) {
      const target = this.highlightTagElements[matchingTagIndex].element;
      target.display();
      event.preventDefault();
    }
  }

  ngAfterContentInit(): void {
  }
  replace(replacement: Replacement) {
    this.replacementEventParent.emit(replacement);
  }
}
