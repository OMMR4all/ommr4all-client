import { Directive, ElementRef, EventEmitter, OnDestroy, Output, inject } from '@angular/core';
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
    selector: '[appResizeObserver]',
    standalone: false
})
export class ResizeObserverDirective implements OnDestroy {
  private el = inject(ElementRef);

  @Output() resizeobs = new EventEmitter();

  constructor() {
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
