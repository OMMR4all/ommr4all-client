import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LineViewComponent } from './line-view.component';

describe('LineViewComponent', () => {
  let component: LineViewComponent;
  let fixture: ComponentFixture<LineViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LineViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
