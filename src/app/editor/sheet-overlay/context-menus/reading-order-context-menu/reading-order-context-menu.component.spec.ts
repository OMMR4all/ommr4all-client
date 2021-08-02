import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReadingOrderContextMenuComponent } from './reading-order-context-menu.component';

describe('ReadingOrderContextMenuComponent', () => {
  let component: ReadingOrderContextMenuComponent;
  let fixture: ComponentFixture<ReadingOrderContextMenuComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReadingOrderContextMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadingOrderContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
