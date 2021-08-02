import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PagePreviewComponent } from './page-preview.component';

describe('PagePreviewComponent', () => {
  let component: PagePreviewComponent;
  let fixture: ComponentFixture<PagePreviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PagePreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PagePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
