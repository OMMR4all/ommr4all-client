import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextRegionComponent } from './text-region.component';

describe('TextRegionComponent', () => {
  let component: TextRegionComponent;
  let fixture: ComponentFixture<TextRegionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextRegionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextRegionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
