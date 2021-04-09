import {Directive, ElementRef, EventEmitter, OnDestroy, Output} from '@angular/core';
import ResizeObserver from 'resize-observer-polyfill';
const entriesMap = new WeakMap();

const ro = new ResizeObserver(entries => {
  for (const entry of entries) {
    if (entriesMap.has(entry.target)) {
      const comp = entriesMap.get(entry.target);
      comp._resizeCallback(entry);
    }
  }
});

@Directive({
  selector: '[appResizeObserver]'
})
export class ResizeObserverDirective implements OnDestroy {
  @Output() resizeobs = new EventEmitter();

  constructor(private el: ElementRef) {
    const target = this.el.nativeElement;
    entriesMap.set(target, this);
    ro.observe(target);
  }

  _resizeCallback(entry) {
    console.log(entry.contentRect);
    this.resizeobs.emit(entry);
  }

  ngOnDestroy() {
    const target = this.el.nativeElement;
    ro.unobserve(target);
    entriesMap.delete(target);
  }
}
