import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadingOrderViewComponent } from './reading-order-view.component';

describe('ReadingOrderViewComponent', () => {
  let component: ReadingOrderViewComponent;
  let fixture: ComponentFixture<ReadingOrderViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReadingOrderViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadingOrderViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
