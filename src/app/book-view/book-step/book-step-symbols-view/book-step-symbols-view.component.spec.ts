import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookStepSymbolsViewComponent } from './book-step-symbols-view.component';

describe('BookStepSymbolsViewComponent', () => {
  let component: BookStepSymbolsViewComponent;
  let fixture: ComponentFixture<BookStepSymbolsViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookStepSymbolsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookStepSymbolsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
