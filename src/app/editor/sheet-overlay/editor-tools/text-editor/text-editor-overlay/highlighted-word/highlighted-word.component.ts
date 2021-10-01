import {AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnInit, QueryList, Renderer2, ViewChild, ViewChildren} from '@angular/core';
import {WordDictionaryService} from './word-dictionary.service';
import {Dictionary} from 'ngx-spellchecker/src/services/dictionary';
import {WordComponent} from './word/word/word.component';

/*function indexIsInsideTag(index: number, tag: WordComponent) {
  return tag.indices.start < index && index < tag.indices.end;
}

function overlaps(tagA: WordComponent, tagB: WordComponent) {
  return (
    indexIsInsideTag(tagB.indices.start, tagA) ||
    indexIsInsideTag(tagB.indices.end, tagA)
  );
}*/

function isCoordinateWithinRect(rect: ClientRect, x: number, y: number, elem: WordComponent) {
  const rect2 = elem.span.nativeElement.getBoundingClientRect();
  return rect2.left < x && x < rect2.right;
}

@Component({
  selector: 'app-highlighted-word',
  templateUrl: './highlighted-word.component.html',
  styleUrls: ['./highlighted-word.component.scss']
})

export class HighlightedWordComponent implements OnInit, AfterViewInit, AfterContentInit {
  @ViewChildren(WordComponent) childrenComponent: QueryList<WordComponent>;
  @Input() text: string;
  @Input() markedWords: string[] = [];
  @Input() textarea: HTMLInputElement;
  private textareaEventListeners: Array<() => void> = [];
  private highlightTagElements: Array<{
    element: WordComponent;
    clientRect: ClientRect;
  }>;
  public count = 0;
  private corrector: Dictionary = null;

  constructor(
    wdservice: WordDictionaryService,
    element: ElementRef,
    private renderer: Renderer2, private cdr: ChangeDetectorRef
  ) {
    this.corrector = wdservice.spellCheckerStateVal;
  }

  getWords() {
    return this.text.split(' ');
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
          console.log(this.highlightTagElements);
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
}
