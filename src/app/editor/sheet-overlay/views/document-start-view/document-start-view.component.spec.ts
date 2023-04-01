import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentStartViewComponent } from './document-start-view.component';

describe('DocumentStartViewComponent', () => {
  let component: DocumentStartViewComponent;
  let fixture: ComponentFixture<DocumentStartViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentStartViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentStartViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
