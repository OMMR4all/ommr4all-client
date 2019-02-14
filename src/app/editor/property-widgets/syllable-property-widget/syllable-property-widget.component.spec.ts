import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SyllablePropertyWidgetComponent } from './syllable-property-widget.component';

describe('SyllablePropertyWidgetComponent', () => {
  let component: SyllablePropertyWidgetComponent;
  let fixture: ComponentFixture<SyllablePropertyWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SyllablePropertyWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SyllablePropertyWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
