import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HighlightedWordComponent } from './highlighted-word.component';

describe('HighlightedWordComponent', () => {
  let component: HighlightedWordComponent;
  let fixture: ComponentFixture<HighlightedWordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HighlightedWordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HighlightedWordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
