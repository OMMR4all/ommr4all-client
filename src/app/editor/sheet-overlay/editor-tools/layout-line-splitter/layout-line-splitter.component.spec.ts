import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutLineSplitterComponent } from './layout-line-splitter.component';

describe('LayoutLineSplitterComponent', () => {
  let component: LayoutLineSplitterComponent;
  let fixture: ComponentFixture<LayoutLineSplitterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayoutLineSplitterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutLineSplitterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
