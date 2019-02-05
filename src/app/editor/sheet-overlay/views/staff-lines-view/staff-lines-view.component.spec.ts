import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffLinesViewComponent } from './staff-lines-view.component';

describe('StaffLinesViewComponent', () => {
  let component: StaffLinesViewComponent;
  let fixture: ComponentFixture<StaffLinesViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StaffLinesViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffLinesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
