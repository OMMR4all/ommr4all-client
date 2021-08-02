import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HoverMenuComponent } from './hover-menu.component';

describe('HoverMenuComponent', () => {
  let component: HoverMenuComponent;
  let fixture: ComponentFixture<HoverMenuComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HoverMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HoverMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
