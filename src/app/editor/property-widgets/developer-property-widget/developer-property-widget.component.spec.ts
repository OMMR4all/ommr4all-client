import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeveloperPropertyWidgetComponent } from './developer-property-widget.component';

describe('DeveloperPropertyWidgetComponent', () => {
  let component: DeveloperPropertyWidgetComponent;
  let fixture: ComponentFixture<DeveloperPropertyWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeveloperPropertyWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeveloperPropertyWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
