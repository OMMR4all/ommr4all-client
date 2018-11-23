import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesPreviewComponent } from './pages-preview.component';

describe('PagesPreviewComponent', () => {
  let component: PagesPreviewComponent;
  let fixture: ComponentFixture<PagesPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PagesPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PagesPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
