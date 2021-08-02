import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SplitAnnotationViewerComponent } from './split-annotation-viewer.component';

describe('SplitAnnotationViewerComponent', () => {
  let component: SplitAnnotationViewerComponent;
  let fixture: ComponentFixture<SplitAnnotationViewerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SplitAnnotationViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SplitAnnotationViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
