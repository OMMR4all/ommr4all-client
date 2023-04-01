import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GabcChantViewerComponent } from './gabc-chant-viewer.component';

describe('GabcChantViewerComponent', () => {
  let component: GabcChantViewerComponent;
  let fixture: ComponentFixture<GabcChantViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GabcChantViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GabcChantViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
