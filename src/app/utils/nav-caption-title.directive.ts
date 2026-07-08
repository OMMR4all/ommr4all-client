import {AfterViewInit, Directive, ElementRef, inject} from '@angular/core';

/**
 * Sidebar labels (.nav-caption) are truncated with an ellipsis if the drawer is too narrow.
 * This directive exposes the full label text as a native tooltip on the surrounding
 * list item, so hovering an item always reveals the complete label.
 */
@Directive({
    selector: '.nav-caption',
    standalone: false,
})
export class NavCaptionTitleDirective implements AfterViewInit {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    const caption = this.el.nativeElement;
    const label = (caption.textContent || '').trim();
    if (!label) { return; }
    const item = (caption.closest('a, button') as HTMLElement) || caption;
    item.title = label;
  }
}
