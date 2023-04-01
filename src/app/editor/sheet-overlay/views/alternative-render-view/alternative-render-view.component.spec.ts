import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlternativeRenderViewComponent } from './alternative-render-view.component';

describe('AlternativeRenderViewComponent', () => {
  let component: AlternativeRenderViewComponent;
  let fixture: ComponentFixture<AlternativeRenderViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlternativeRenderViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AlternativeRenderViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
