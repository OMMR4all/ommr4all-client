import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DocumentMonodySelectionComponent } from './document-monody-selection.component';

describe('DocumentMonodySelectionComponent', () => {
  let component: DocumentMonodySelectionComponent;
  let fixture: ComponentFixture<DocumentMonodySelectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentMonodySelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentMonodySelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
