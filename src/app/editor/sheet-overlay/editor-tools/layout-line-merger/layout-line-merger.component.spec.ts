import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutLineMergerComponent } from './layout-line-merger.component';

describe('LayoutLineMergerComponent', () => {
  let component: LayoutLineMergerComponent;
  let fixture: ComponentFixture<LayoutLineMergerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LayoutLineMergerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutLineMergerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
