import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutPropertyWidgetComponent } from './layout-property-widget.component';

describe('LayoutPropertyWidgetComponent', () => {
  let component: LayoutPropertyWidgetComponent;
  let fixture: ComponentFixture<LayoutPropertyWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LayoutPropertyWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutPropertyWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
