import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadingOrderPropertyWidgetComponent } from './reading-order-property-widget.component';

describe('ReadingOrderPropertyWidgetComponent', () => {
  let component: ReadingOrderPropertyWidgetComponent;
  let fixture: ComponentFixture<ReadingOrderPropertyWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReadingOrderPropertyWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadingOrderPropertyWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
