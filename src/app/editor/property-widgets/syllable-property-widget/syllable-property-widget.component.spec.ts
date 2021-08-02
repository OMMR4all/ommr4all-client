import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SyllablePropertyWidgetComponent } from './syllable-property-widget.component';

describe('SyllablePropertyWidgetComponent', () => {
  let component: SyllablePropertyWidgetComponent;
  let fixture: ComponentFixture<SyllablePropertyWidgetComponent>;

  beforeEach(waitForAsync(() => {
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
