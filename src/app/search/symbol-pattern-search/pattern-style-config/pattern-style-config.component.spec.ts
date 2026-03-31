import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternStyleConfigComponent } from './pattern-style-config.component';

describe('PatternStyleConfigComponent', () => {
  let component: PatternStyleConfigComponent;
  let fixture: ComponentFixture<PatternStyleConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternStyleConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatternStyleConfigComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
