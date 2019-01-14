import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutExtractConnectedComponentsComponent } from './layout-extract-connected-components.component';

describe('LayoutExtractConnectedComponentsComponent', () => {
  let component: LayoutExtractConnectedComponentsComponent;
  let fixture: ComponentFixture<LayoutExtractConnectedComponentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LayoutExtractConnectedComponentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutExtractConnectedComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
